"use server";

import { neon } from "@neondatabase/serverless";

/**
 * Server Actions for database operations
 * Uses Neon's serverless driver - credentials are kept server-side only
 */

const sql = neon(process.env.DATABASE_URL!);

export async function getPostsAction() {
    const data = await sql`
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
    return data;
}

export async function getPostAction(id: string) {
    const data = await sql`
        SELECT 
            p.*,
            u.display_name as author_name,
            u.wallet_address as author_address
        FROM posts p
        JOIN users u ON p.author_id = u.id
        WHERE p.id = ${id}
    `;
    return data[0] || null;
}

export async function getRepliesAction(postId: string) {
    const data = await sql`
        SELECT 
            r.*,
            u.display_name as author_name,
            u.wallet_address as author_address
        FROM replies r
        JOIN users u ON r.author_id = u.id
        WHERE r.post_id = ${postId}
        ORDER BY r.created_at ASC
    `;
    return data;
}
