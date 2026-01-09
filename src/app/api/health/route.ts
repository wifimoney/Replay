/**
 * GET /api/health
 * 
 * Health check endpoint to verify API and database are running.
 */

import { NextResponse } from 'next/server';
import { movementTestnet } from '@/lib/movement';
import { db } from '@/lib/db';

export async function GET() {
    let dbStatus: { ok: boolean; now?: string; error?: string } = { ok: false };

    try {
        const result = await db.query('SELECT now() AS now');
        dbStatus = { ok: true, now: result.rows[0].now };
    } catch (e: any) {
        dbStatus = { ok: false, error: e.message };
    }

    return NextResponse.json({
        status: dbStatus.ok ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        version: '0.1.0',
        db: dbStatus,
        config: {
            chain: movementTestnet.name,
            chainId: movementTestnet.id,
            privyConfigured: !!process.env.NEXT_PUBLIC_PRIVY_APP_ID,
            databaseConfigured: !!process.env.DATABASE_URL,
            sellerConfigured: !!process.env.X402_SELLER_ADDRESS,
        },
    });
}
