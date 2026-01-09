const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

neonConfig.webSocketConstructor = ws;

async function migrate() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('❌ DATABASE_URL is not set in .env.local');
        process.exit(1);
    }

    console.log('Connecting to database...');
    const pool = new Pool({ connectionString });

    try {
        const sqlPath = path.join(__dirname, 'schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running schema migration...');
        await pool.query(sql);

        console.log('✅ Use seed script to populate demo data if needed.');
        console.log('✅ Schema migration complete!');
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

migrate();
