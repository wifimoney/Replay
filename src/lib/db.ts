import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Required for Neon serverless driver to work in non-edge environments (like local dev)
neonConfig.webSocketConstructor = ws;

// Interface for our data models
export interface User {
    id: string;
    wallet_address: string;
    display_name?: string;
    created_at: Date;
}

export interface Post {
    id: string;
    author_id: string;
    content: string;
    created_at: Date;
    // Computed fields
    author?: User;
    reply_count?: number;
    total_tips?: string;
}

export interface Reply {
    id: string;
    post_id: string;
    author_id: string;
    content: string;
    payment_tx_hash: string;
    payment_amount: string;
    created_at: Date;
    // Computed fields
    author?: User;
}

// Database connection - prefer pooled for serverless
const connectionString = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;

// Global singleton for hot-reload safety in Next.js dev
declare global {
    // eslint-disable-next-line no-var
    var __pgPool: Pool | undefined;
}

function createPool(): Pool {
    if (!connectionString) {
        console.warn('DATABASE_URL not set. Database operations will fail.');
        // Return a disconnected pool that will throw on query
        // This allows the app to build even without env vars
        return new Pool({ connectionString: 'postgres://dummy:dummy@localhost:5432/dummy' });
    }
    return new Pool({ connectionString, max: 5 });
}

export const db = global.__pgPool ?? createPool();

if (process.env.NODE_ENV !== 'production') {
    global.__pgPool = db;
}

// Legacy getPool() for backwards compatibility
export function getPool(): Pool {
    return db;
}

// --- User Operations ---

export async function getOrCreateUser(walletAddress: string): Promise<User> {
    const client = await getPool().connect();
    try {
        const normalizeAddress = walletAddress.toLowerCase();

        // Try to find existing user
        const { rows } = await client.query(
            'SELECT * FROM users WHERE wallet_address = $1',
            [normalizeAddress]
        );

        if (rows.length > 0) {
            return rows[0];
        }

        // Create new user
        const { rows: newRows } = await client.query(
            'INSERT INTO users (wallet_address, display_name) VALUES ($1, $2) RETURNING *',
            [normalizeAddress, `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`]
        );

        return newRows[0];
    } finally {
        client.release();
    }
}

// --- Post Operations ---

export async function getPosts(): Promise<Post[]> {
    const client = await getPool().connect();
    try {
        const query = `
      SELECT 
        p.*,
        u.display_name as author_name,
        u.wallet_address as author_address,
        (SELECT COUNT(*) FROM replies r WHERE r.post_id = p.id) as reply_count,
        COALESCE((SELECT SUM(payment_amount::numeric) FROM replies r WHERE r.post_id = p.id), 0) as total_tips
      FROM posts p
      JOIN users u ON p.author_id = u.id
      ORDER BY p.created_at DESC
    `;

        const { rows } = await client.query(query);

        // Transform flat result to nested objects
        return rows.map(row => ({
            id: row.id,
            author_id: row.author_id,
            content: row.content,
            created_at: row.created_at,
            reply_count: parseInt(row.reply_count),
            total_tips: row.total_tips.toString(),
            author: {
                id: row.author_id,
                wallet_address: row.author_address,
                display_name: row.author_name,
                created_at: new Date() // Placeholder
            }
        }));
    } catch (e) {
        console.error('Error fetching posts:', e);
        return [];
    } finally {
        client.release();
    }
}

export async function getPost(id: string): Promise<Post | null> {
    const client = await getPool().connect();
    try {
        const query = `
      SELECT 
        p.*,
        u.display_name as author_name,
        u.wallet_address as author_address
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.id = $1
    `;

        const { rows } = await client.query(query, [id]);
        if (rows.length === 0) return null;

        const row = rows[0];
        return {
            id: row.id,
            author_id: row.author_id,
            content: row.content,
            created_at: row.created_at,
            author: {
                id: row.author_id,
                wallet_address: row.author_address,
                display_name: row.author_name,
                created_at: new Date()
            }
        };
    } finally {
        client.release();
    }
}

export async function createPost(authorId: string, content: string): Promise<Post> {
    const client = await getPool().connect();
    try {
        const query = `
      INSERT INTO posts (author_id, content)
      VALUES ($1, $2)
      RETURNING *
    `;

        const { rows } = await client.query(query, [authorId, content]);
        const row = rows[0];

        // Fetch author details to return complete object
        const authorRes = await client.query('SELECT * FROM users WHERE id = $1', [authorId]);
        const author = authorRes.rows[0];

        return {
            id: row.id,
            author_id: row.author_id,
            content: row.content,
            created_at: row.created_at,
            reply_count: 0,
            total_tips: '0',
            author: {
                id: author.id,
                wallet_address: author.wallet_address,
                display_name: author.display_name,
                created_at: author.created_at
            }
        };
    } finally {
        client.release();
    }
}

// --- Reply Operations ---

export async function addReply(
    postId: string,
    userId: string,
    content: string,
    txHash: string,
    amount: string
): Promise<Reply> {
    const client = await getPool().connect();
    try {
        const query = `
      INSERT INTO replies (post_id, author_id, content, payment_tx_hash, payment_amount)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

        const { rows } = await client.query(query, [postId, userId, content, txHash, amount]);
        return rows[0];
    } finally {
        client.release();
    }
}

export async function getReplies(postId: string): Promise<Reply[]> {
    const client = await getPool().connect();
    try {
        const query = `
      SELECT 
        r.*,
        u.display_name as author_name,
        u.wallet_address as author_address
      FROM replies r
      JOIN users u ON r.author_id = u.id
      WHERE r.post_id = $1
      ORDER BY r.created_at ASC
    `;

        const { rows } = await client.query(query, [postId]);

        return rows.map(row => ({
            ...row,
            author: {
                id: row.author_id,
                wallet_address: row.author_address,
                display_name: row.author_name,
                created_at: new Date()
            }
        }));
    } finally {
        client.release();
    }
}
