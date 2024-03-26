import type { Config } from 'drizzle-kit'
export default {
    schema: './src/app/db/schema.ts',
    out: './drizzle',
    driver: 'pg',
    dbCredentials: {
        connectionString:
            'postgresql://motivatordb_owner:CMBw0bJj5uQl@ep-rough-bar-a44axfqa.us-east-1.aws.neon.tech/motivatordb?sslmode=require',
    },
} satisfies Config
