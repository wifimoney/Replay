/**
 * POST /api/replies
 * 
 * Creates a reply to a post. This endpoint implements x402 with EIP-712:
 * - First request returns 402 with EIP-712 Payment Requirements
 * - Second request with valid X-PAYMENT header contains EIP-712 signature
 */

import { NextRequest, NextResponse } from 'next/server';
import { create402Response, X402PaymentHeader, X402ResponseHeader } from '@/lib/x402';
import { paymentConfig } from '@/lib/movement';
import { addReply, getPost, getOrCreateUser } from '@/lib/db';
import { requirePrivyUser } from '@/lib/auth';

// Placeholder USDC contract if none provided
const DEFAULT_USDC_CONTRACT = '0x1000000000000000000000000000000000000000';

interface ReplyRequest {
    postId: string;
    content: string;
    walletAddress: string;
}

/**
 * Verify and Settle Payment via Facilitator
 */
async function processPayment(paymentHeader: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
        const decoded = Buffer.from(paymentHeader, 'base64').toString();
        const header: X402PaymentHeader = JSON.parse(decoded);

        if (!header.payload || !header.payload.signature) {
            return { success: false, error: 'Invalid payment payload' };
        }

        // TODO: Call Real Facilitator
        // const response = await fetch('https://x402.org/facilitator/settle', ...);

        // SIMULATION
        console.log('--- SIMULATING FACILITATOR SETTLEMENT ---');
        console.log('From:', header.payload.authorization.from);
        console.log('Signature:', header.payload.signature.slice(0, 10) + '...');

        // Simulate network delay
        await new Promise(r => setTimeout(r, 1000));

        return {
            success: true,
            txHash: `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`
        };

    } catch (error) {
        console.error('Payment processing failed:', error);
        return { success: false, error: 'Internal payment error' };
    }
}

export async function POST(request: NextRequest) {
    try {
        // 1. Verify Privy auth token first (401 if missing/invalid)
        let privyClaims;
        try {
            privyClaims = await requirePrivyUser(request);
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body: ReplyRequest = await request.json();
        const { postId, content, walletAddress } = body;

        // Validate basic fields
        if (!postId || !content || !walletAddress) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Check if post exists
        const post = await getPost(postId);
        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        // Check for X-PAYMENT header
        const paymentHeaderRaw = request.headers.get('X-PAYMENT');

        if (!paymentHeaderRaw) {
            // Return 402 with EIP-712 requirements
            const sellerAddress = process.env.X402_SELLER_ADDRESS || '0x0000000000000000000000000000000000000001';
            const usdcContract = process.env.USDC_CONTRACT_ADDRESS || DEFAULT_USDC_CONTRACT;

            // Amount in atomic units (e.g. 6 decimals for USDC)
            // User spec says "20000" for $0.02
            const amount = '20000';

            return create402Response(
                sellerAddress,
                amount,
                `/api/replies`,
                usdcContract
            );
        }

        // Process Payment
        const result = await processPayment(paymentHeaderRaw);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Payment failed' },
                { status: 402 }
            );
        }

        // Create Reply
        const user = await getOrCreateUser(walletAddress);
        const reply = await addReply(
            postId,
            user.id,
            content,
            result.txHash!,
            '20000' // Record amount
        );

        // Success Response with X-PAYMENT-RESPONSE
        const responseHeader: X402ResponseHeader = {
            success: true,
            txHash: result.txHash!,
            networkId: 'eip155:30732'
        };

        return NextResponse.json(
            { reply, message: 'Reply posted' },
            {
                status: 201,
                headers: {
                    'X-PAYMENT-RESPONSE': Buffer.from(JSON.stringify(responseHeader)).toString('base64')
                }
            }
        );

    } catch (error) {
        console.error('Error creating reply:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
