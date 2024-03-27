import type { Config } from 'drizzle-kit'
export const config = {
    schema: './src/app/db/schema.ts',
    out: './drizzle',
    driver: 'pg',
    dbCredentials: {
        connectionString: process.env.PG_CONNECT_STR || '',
    },
} satisfies Config
