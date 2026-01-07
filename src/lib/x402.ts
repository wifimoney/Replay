/**
 * x402 Payment Protocol Implementation
 * 
 * This module implements the HTTP 402 Payment Required flow for atomic
 * pay-per-interaction. The flow is:
 * 
 * 1. Client makes request to protected endpoint
 * 2. Server returns HTTP 402 with payment requirements
 * 3. Client signs payment transaction (doesn't submit)
 * 4. Client retries with signed tx in X-PAYMENT header
 * 5. Facilitator verifies and submits transaction
 * 6. After confirmation, server returns content
 */

import { paymentConfig, movementTestnet } from './movement';

/**
 * Payment requirements returned by 402 response
 */
export interface PaymentRequirements {
    network: string;
    payTo: string;
    amount: string;
    asset: string;
    description: string;
    maxTimeoutSeconds: number;
    facilitatorUrl: string;
}

/**
 * Payment response header data
 */
export interface PaymentResponse {
    success: boolean;
    txHash?: string;
    error?: string;
}

/**
 * x402 error class for payment-related errors
 */
export class X402PaymentError extends Error {
    constructor(
        message: string,
        public paymentRequirements?: PaymentRequirements,
        public retryAfter?: number
    ) {
        super(message);
        this.name = 'X402PaymentError';
    }
}

/**
 * Parse payment requirements from 402 response headers
 */
export function parsePaymentRequirements(response: Response): PaymentRequirements | null {
    const requirementsHeader = response.headers.get('X-PAYMENT-REQUIREMENTS');

    if (!requirementsHeader) {
        return null;
    }

    try {
        return JSON.parse(requirementsHeader) as PaymentRequirements;
    } catch {
        console.error('Failed to parse payment requirements:', requirementsHeader);
        return null;
    }
}

/**
 * Build payment transaction data for signing
 * 
 * This creates the raw transaction that will be signed by the user's
 * embedded wallet and sent in the X-PAYMENT header.
 */
export function buildPaymentTransaction(requirements: PaymentRequirements) {
    return {
        to: requirements.payTo as `0x${string}`,
        value: BigInt(requirements.amount),
        chainId: movementTestnet.id,
        // For native token transfers, no data is needed
        data: '0x' as `0x${string}`,
    };
}

/**
 * Create X-PAYMENT header value from signed transaction
 */
export function createPaymentHeader(signedTx: string): string {
    // The payment header contains the signed transaction in a specific format
    const paymentData = {
        version: '1',
        network: 'movement-testnet',
        signedTransaction: signedTx,
        timestamp: Date.now(),
    };

    return Buffer.from(JSON.stringify(paymentData)).toString('base64');
}

/**
 * Parse payment response from successful request
 */
export function parsePaymentResponse(response: Response): PaymentResponse | null {
    const responseHeader = response.headers.get('X-PAYMENT-RESPONSE');

    if (!responseHeader) {
        return null;
    }

    try {
        return JSON.parse(responseHeader) as PaymentResponse;
    } catch {
        return null;
    }
}

/**
 * x402-aware fetch wrapper
 * 
 * This function handles the full x402 payment flow:
 * 1. Makes initial request
 * 2. If 402, prompts for payment via callback
 * 3. Signs transaction
 * 4. Retries with payment header
 * 
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @param onPaymentRequired - Callback when payment is required, should return signed tx or null to cancel
 */
export async function x402Fetch(
    url: string,
    options: RequestInit = {},
    onPaymentRequired: (requirements: PaymentRequirements) => Promise<string | null>
): Promise<Response> {
    // First attempt without payment
    const initialResponse = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Accept': 'application/json',
        },
    });

    // If not 402, return as-is
    if (initialResponse.status !== 402) {
        return initialResponse;
    }

    // Parse payment requirements
    const requirements = parsePaymentRequirements(initialResponse);

    if (!requirements) {
        throw new X402PaymentError(
            'Received 402 but no payment requirements found',
            undefined,
            undefined
        );
    }

    // Request payment from user
    const signedTx = await onPaymentRequired(requirements);

    if (!signedTx) {
        throw new X402PaymentError(
            'Payment cancelled by user',
            requirements,
            undefined
        );
    }

    // Retry with payment header
    const paymentResponse = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Accept': 'application/json',
            'X-PAYMENT': createPaymentHeader(signedTx),
        },
    });

    if (!paymentResponse.ok) {
        const error = await paymentResponse.text();
        throw new X402PaymentError(
            `Payment verification failed: ${error}`,
            requirements,
            undefined
        );
    }

    return paymentResponse;
}

/**
 * Create 402 response with payment requirements
 * For use in API routes
 */
export function create402Response(
    payTo: string,
    amount: string,
    description: string
): Response {
    const requirements: PaymentRequirements = {
        network: 'movement-testnet',
        payTo,
        amount,
        asset: 'native',
        description,
        maxTimeoutSeconds: 600,
        facilitatorUrl: paymentConfig.facilitatorUrl,
    };

    return new Response(JSON.stringify({ error: 'Payment Required', requirements }), {
        status: 402,
        headers: {
            'Content-Type': 'application/json',
            'X-PAYMENT-REQUIREMENTS': JSON.stringify(requirements),
        },
    });
}
