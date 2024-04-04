import {
    boolean,
    date,
    integer,
    pgTable,
    text,
    uuid,
} from 'drizzle-orm/pg-core'

export const user = pgTable('users', {
    address: text('address').unique().primaryKey(),
})

export const stats = pgTable('stats', {
    user_address: text('user_address')
        .references(() => user.address)
        .primaryKey(),
    actions: integer('actions').default(0),
    volume: integer('volume').default(0),
})

export const assessor = pgTable('assessor', {
    address: text('address').unique().primaryKey(),
})

export const assessor_slot = pgTable('assessor_slot', {
    id: uuid('id').defaultRandom().unique().primaryKey(),
    assessor_ID: text('assessor_ID').references(() => assessor.address),
    done: boolean('done').default(false),
    week: integer('week').default(0),
})

export const reward = pgTable('reward', {
    id: uuid('id').defaultRandom().unique().primaryKey(),
    amount: integer('amount'),
    date: date('date'),
    assessor_slot_id: uuid('assessor_slot_id').references(
        () => assessor_slot.id
    ),
    user_address: text('user_address').references(() => user.address),
})

export const assessor_slot_user = pgTable('assessor_slot_user', {
    id: uuid('id').defaultRandom().unique().primaryKey(),
    assessor_slot_id: uuid('assessor_slot_id').references(
        () => assessor_slot.id
    ),
    user_address: text('user_address').references(() => user.address),
})

export const statistics = pgTable('statistics', {
    block_number: integer('block_number').unique().primaryKey(),
    user_address: text('user_address').references(() => user.address),
    pnl_long: integer('pnl_long').default(0),
    pnl_short: integer('pnl_short').default(0),
    pnl_lp: integer('pnl_lp').default(0),
    volume_long: integer('volume_long').default(0),
    volume_short: integer('volume_short').default(0),
    volume_lp: integer('volume_lp').default(0),
    week: integer('week').default(0),
})
