/**
 * POST /api/replies
 * 
 * Creates a reply to a post. This endpoint implements x402:
 * - First request returns 402 with payment requirements
 * - Second request with valid X-PAYMENT header creates the reply
 */

import { NextRequest, NextResponse } from 'next/server';
import { create402Response, PaymentRequirements } from '@/lib/x402';
import { addReply, getPost, getOrCreateUser } from '@/lib/store';
import { paymentConfig } from '@/lib/movement';

interface ReplyRequest {
    postId: string;
    content: string;
    walletAddress: string;
}

/**
 * Verify and process payment from X-PAYMENT header
 * 
 * In production, this would:
 * 1. Decode the signed transaction
 * 2. Submit to facilitator for verification
 * 3. Wait for on-chain confirmation
 * 
 * For MVP, we simulate verification.
 */
async function verifyPayment(paymentHeader: string): Promise<{ valid: boolean; txHash?: string; error?: string }> {
    try {
        // Decode the payment header
        const paymentData = JSON.parse(Buffer.from(paymentHeader, 'base64').toString());

        // Validate structure
        if (!paymentData.signedTransaction) {
            return { valid: false, error: 'Missing signed transaction' };
        }

        // In production: Submit to facilitator for verification
        // const facilitatorResponse = await fetch(paymentConfig.facilitatorUrl, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ signedTransaction: paymentData.signedTransaction }),
        // });

        // For MVP: Simulate successful payment
        // Generate a mock transaction hash
        const txHash = `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`;

        return { valid: true, txHash };
    } catch (error) {
        console.error('Payment verification failed:', error);
        return { valid: false, error: 'Invalid payment header' };
    }
}

export async function POST(request: NextRequest) {
    try {
        const body: ReplyRequest = await request.json();
        const { postId, content, walletAddress } = body;

        // Validate request
        if (!postId || !content || !walletAddress) {
            return NextResponse.json(
                { error: 'Missing required fields: postId, content, walletAddress' },
                { status: 400 }
            );
        }

        if (content.length > 280) {
            return NextResponse.json(
                { error: 'Reply too long (max 280 characters)' },
                { status: 400 }
            );
        }

        // Check if post exists
        const post = getPost(postId);
        if (!post) {
            return NextResponse.json(
                { error: 'Post not found' },
                { status: 404 }
            );
        }

        // Check for X-PAYMENT header
        const paymentHeader = request.headers.get('X-PAYMENT');

        if (!paymentHeader) {
            // No payment - return 402 with requirements
            const sellerAddress = process.env.X402_SELLER_ADDRESS || '0x0000000000000000000000000000000000000001';

            return create402Response(
                sellerAddress,
                paymentConfig.replyCostWei.toString(),
                `Reply to post by ${post.author.displayName}`
            );
        }

        // Payment provided - verify it
        const { valid, txHash, error } = await verifyPayment(paymentHeader);

        if (!valid) {
            return NextResponse.json(
                { error: error || 'Payment verification failed' },
                { status: 402 }
            );
        }

        // Payment verified! Create the reply
        const user = getOrCreateUser(walletAddress);
        const reply = addReply(
            postId,
            user.id,
            content,
            txHash!,
            paymentConfig.replyCostWei.toString()
        );

        return NextResponse.json(
            {
                reply,
                txHash,
                message: 'Reply created successfully'
            },
            {
                status: 201,
                headers: {
                    'X-PAYMENT-RESPONSE': JSON.stringify({ success: true, txHash }),
                }
            }
        );
    } catch (error) {
        console.error('Error creating reply:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
