use std::collections::HashMap;
use std::fmt;
use std::fs;
use std::str::FromStr;
use std::sync::Arc;

use chrono::{TimeZone, Utc};
use dashmap::DashMap;
use ethers::{
    providers::{Middleware, Provider, Ws},
    types::{H160, I256, U256, U64},
};
use eyre::Result;
use rust_decimal::Decimal;
use serde::de::{self, Visitor};
use serde::{Deserialize, Deserializer, Serialize, Serializer};

use crate::globals::*;
use crate::types::*;

pub fn timestamp_to_string(timestamp: U256) -> String {
    Utc.timestamp_opt(timestamp.as_u64() as i64, 0)
        .single()
        .unwrap()
        .to_rfc3339()
}

pub fn timestamp_to_date_string(timestamp: U256) -> String {
    Utc.timestamp_opt(timestamp.as_u64() as i64, 0)
        .single()
        .unwrap()
        .format("%Y-%m-%d")
        .to_string()
}

pub async fn find_block_by_timestamp(
    client: Arc<Provider<Ws>>,
    desired_timestamp: u64,
    start_block: U64,
    end_block: U64,
) -> Result<U64> {
    let mut low = start_block.as_u64();
    let mut high = end_block.as_u64();

    while low <= high {
        let mid = low + (high - low) / 2;
        let mid_block = client.get_block::<u64>(mid).await?.unwrap();
        match mid_block.timestamp.as_u64().cmp(&desired_timestamp) {
            std::cmp::Ordering::Less => low = mid + 1,
            std::cmp::Ordering::Greater => high = mid - 1,
            std::cmp::Ordering::Equal => return Ok(mid.into()),
        }
    }
    let res = u64::max(high, start_block.as_u64()); // Could be start_block - 1

    tracing::debug!(start_block=?start_block, end_block=?end_block, res=?res, "find_block_by_timestamp");

    Ok(res.into())
}

pub trait Decimalizable {
    fn normalized(&self) -> Decimal;
}

impl Decimalizable for I256 {
    fn normalized(&self) -> Decimal {
        let val_i128 = (*self).as_i128();
        let val_dec = Decimal::from_i128_with_scale(val_i128, DECIMAL_SCALE);
        val_dec.round_dp(DECIMAL_PRECISION)
    }
}

impl Decimalizable for U256 {
    fn normalized(&self) -> Decimal {
        let val_ethers_i128 = I256::try_from(*self).unwrap();
        let val_i128 = val_ethers_i128.as_i128();
        let val_dec = Decimal::from_i128_with_scale(val_i128, DECIMAL_SCALE);
        val_dec.round_dp(DECIMAL_PRECISION)
    }
}

impl Decimalizable for fixed_point::FixedPoint {
    fn normalized(&self) -> Decimal {
        let val_ethers_i128 = I256::try_from(*self).unwrap();
        let val_i128 = val_ethers_i128.as_i128();
        let val_dec = Decimal::from_i128_with_scale(val_i128, DECIMAL_SCALE);
        val_dec.round_dp(DECIMAL_PRECISION)
    }
}

pub trait CompactSerializable {
    fn compact_ser(&self) -> String;
}

impl CompactSerializable for Decimal {
    fn compact_ser(&self) -> String {
        let mut formatted = self.to_string();
        if formatted.contains('.') {
            formatted = formatted.trim_end_matches('0').to_string();
            if formatted.ends_with('.') {
                formatted.pop();
            }
        }
        formatted
    }
}

pub trait DashMapToHashMap<K, V> {
    fn to_hashmap(&self) -> HashMap<K, V>
    where
        K: Eq + std::hash::Hash + Clone,
        V: Clone;
}

impl<K, V> DashMapToHashMap<K, V> for DashMap<K, V> {
    fn to_hashmap(&self) -> HashMap<K, V>
    where
        K: Eq + std::hash::Hash + Clone,
        V: Clone,
    {
        self.iter()
            .map(|entry| (entry.key().clone(), entry.value().clone()))
            .collect()
    }
}

pub trait EventsSerializable {
    fn to_serializable(&self) -> SerializableEvents;
    fn from_serializable(sevents: SerializableEvents) -> Events;
}

impl EventsSerializable for Events {
    fn to_serializable(&self) -> SerializableEvents {
        SerializableEvents {
            longs: self.longs.to_hashmap(),
            shorts: self.shorts.to_hashmap(),
            lps: self.lps.to_hashmap(),
            share_prices: self.share_prices.to_hashmap(),
        }
    }

    fn from_serializable(sevents: SerializableEvents) -> Events {
        Events {
            longs: sevents.longs.clone().into_iter().collect(),
            shorts: sevents.shorts.clone().into_iter().collect(),
            lps: sevents.lps.clone().into_iter().collect(),
            share_prices: sevents.share_prices.clone().into_iter().collect(),
        }
    }
}

impl Serialize for PositionKey {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let key_str = format!("0x{:x}-0x{:x}", self.trader, self.maturity_time);
        serializer.serialize_str(&key_str)
    }
}

impl<'de> Deserialize<'de> for PositionKey {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        struct PositionKeyVisitor;

        impl<'de> Visitor<'de> for PositionKeyVisitor {
            type Value = PositionKey;

            fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
                formatter.write_str("a string encoded PositionKey")
            }

            fn visit_str<E>(self, value: &str) -> Result<PositionKey, E>
            where
                E: de::Error,
            {
                let parts: Vec<&str> = value.split('-').collect();
                if parts.len() != 2 {
                    return Err(E::custom("Invalid format for PositionKey"));
                }
                let trader = H160::from_str(parts[0]).map_err(de::Error::custom)?;
                let maturity_time = U256::from_str(parts[1]).map_err(de::Error::custom)?;
                Ok(PositionKey {
                    trader,
                    maturity_time,
                })
            }
        }

        deserializer.deserialize_string(PositionKeyVisitor)
    }
}

impl Serialize for LpKey {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let key_str = format!("0x{:x}", self.provider);
        serializer.serialize_str(&key_str)
    }
}

impl<'de> Deserialize<'de> for LpKey {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        struct LpKeyVisitor;

        impl<'de> Visitor<'de> for LpKeyVisitor {
            type Value = LpKey;

            fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
                formatter.write_str("a string encoded LpKey")
            }

            fn visit_str<E>(self, value: &str) -> Result<LpKey, E>
            where
                E: de::Error,
            {
                let provider = H160::from_str(value).map_err(de::Error::custom)?;
                Ok(LpKey { provider })
            }
        }

        deserializer.deserialize_string(LpKeyVisitor)
    }
}

// [TODO] Replace all DashMap by HashMap. Would thus make this code more easily reusable.
pub fn read_eventsdb(hconf: &HyperdriveConfig) -> Result<(Arc<Events>, U64)> {
    match fs::read_to_string(format!("{}-{}.json", hconf.pool_type, hconf.address)) {
        Ok(events_data) => {
            let events_db: EventsDb = serde_json::from_str(&events_data)?;

            tracing::info!(
                end_block_num=?events_db.end_block_num,
                "LoadingPreviousEvents"
            );

            let events = Arc::new(Events::from_serializable(events_db.events));
            let start_block_num = events_db.end_block_num.into();
            Ok((events, start_block_num))
        }
        Err(_) => {
            tracing::info!("FreshEvents");

            let events = Arc::new(Events {
                longs: DashMap::new(),
                shorts: DashMap::new(),
                lps: DashMap::new(),
                share_prices: DashMap::new(),
            });
            let start_block_num = hconf.deploy_block_num;
            Ok((events, start_block_num))
        }
    }
}
