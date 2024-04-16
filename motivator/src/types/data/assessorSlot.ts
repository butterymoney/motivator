import { User } from './user'

export type AssessorSlot = {
    id: string
    assessorID: string
    done: boolean
    week: number
    users: string[]
    rewards: Reward[]
    totals: Totals[]
    statistics: Statistics[]
}

export type Totals = {
    user_address: string
    timestamp: Date
    totalActions: number
    totalVolume: number
    totalPnl: number
}

export type Statistics = {
    user_address: string
    timestamp: string | null
    pnl_longs: number | null
    pnl_shorts: number | null
    pnl_lps: number | null
    volume_longs: number | null
    volume_shorts: number | null
    volume_lps: number | null
    action_count_shorts: number | null
    action_count_longs: number | null
    action_count_lps: number | null
}

export type Reward = {
    date: string | null
    user_address: string | null
    id: string
    amount: number | null
    assessor_slot_id: string | null
}
