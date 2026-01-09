const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
require('dotenv').config({ path: '.env.local' });

neonConfig.webSocketConstructor = ws;

const DEMO_USERS = [
    { wallet: '0x1234567890abcdef1234567890abcdef12345678', name: 'alice.eth' },
    { wallet: '0xabcdef1234567890abcdef1234567890abcdef12', name: 'bob_builder' },
    { wallet: '0xdeadbeef1234567890abcdef1234567890abcdef', name: 'crypto_curious' }
];

const DEMO_POSTS = [
    {
        authorIdx: 0,
        content: "Just discovered atomic payments on Movement. The UX is insane - one tap, payment clears, reply appears. No gas estimation popups, no pending states. This is what crypto should feel like. 🚀"
    },
    {
        authorIdx: 1,
        content: "Building with x402 on Movement EVM. The HTTP 402 → payment → retry pattern is elegant. Your reply doesn't exist until you pay. No spam, pure signal. Every interaction has value."
    },
    {
        authorIdx: 2,
        content: "The embedded wallet experience with Privy is seamless. Sign in with email, wallet auto-created, payments work. No seed phrases, no connect buttons."
    }
];

async function seed() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('❌ DATABASE_URL is not set');
        process.exit(1);
    }

    const pool = new Pool({ connectionString });

    try {
        console.log('Seeding users...');
        const userIds = [];

        for (const u of DEMO_USERS) {
            const res = await pool.query(
                `INSERT INTO users (wallet_address, display_name) 
         VALUES ($1, $2) 
         ON CONFLICT (wallet_address) DO UPDATE SET display_name = $2
         RETURNING id`,
                [u.wallet, u.name]
            );
            userIds.push(res.rows[0].id);
        }

        console.log('Seeding posts...');
        for (const p of DEMO_POSTS) {
            const authorId = userIds[p.authorIdx];
            await pool.query(
                `INSERT INTO posts (id, author_id, content) 
         VALUES (uuid_generate_v4(), $1, $2)`,
                [authorId, p.content]
            );
        }

        console.log('✅ Seed complete!');
    } catch (err) {
        console.error('❌ Seeding failed:', err);
    } finally {
        await pool.end();
    }
}

seed();
