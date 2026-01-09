/**
 * x402 Protocol Implementation (EIP-712 / EIP-3009)
 * 
 * Implements the atomic payment flow using USDC TransferWithAuthorization.
 * 
 * Flow:
 * 1. Client POSTs to protected route
 * 2. Server 402 Payment Required -> Returns EIP-712 requirements
 * 3. Client signs EIP-712 typed data (TransferWithAuthorization)
 * 4. Client retries request with X-PAYMENT header containing signature
 * 5. Server verifies and settles transaction via Facilitator
 */

import { paymentConfig, movementTestnet } from './movement';

// ===========================================
// TYPES
// ===========================================

export interface X402Accept {
    scheme: 'exact';
    network: string;       // "eip155:30732"
    maxAmountRequired: string;
    resource: string;
    description: string;
    payTo: string;
    asset: string;         // Contract address
    maxTimeoutSeconds: number;
    extra?: Record<string, string>;
}

export interface X402Requirements {
    x402Version: 1;
    accepts: X402Accept[];
}

export interface EIP712Domain {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
}

export interface TransferWithAuthorization {
    from: string;
    to: string;
    value: string;
    validAfter: number | string;
    validBefore: number | string;
    nonce: string; // bytes32 hex
}

export interface X402PaymentPayload {
    signature: string;
    authorization: TransferWithAuthorization;
}

export interface X402PaymentHeader {
    x402Version: 1;
    scheme: 'exact';
    network: string;
    payload: X402PaymentPayload;
}

export interface X402ResponseHeader {
    success: boolean;
    txHash: string;
    networkId: string;
}

// ===========================================
// CONSTANTS (EIP-712)
// ===========================================

export const EIP712_TYPES = {
    TransferWithAuthorization: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'validAfter', type: 'uint256' },
        { name: 'validBefore', type: 'uint256' },
        { name: 'nonce', type: 'bytes32' },
    ],
};

// ===========================================
// CLIENT UTILS
// ===========================================

export function parse402Response(response: Response): X402Requirements | null {
    const header = response.headers.get('PAYMENT-REQUIRED');
    if (!header) return null;
    try {
        return JSON.parse(Buffer.from(header, 'base64').toString());
    } catch {
        return null;
    }
}

export function createPaymentHeader(
    network: string,
    payload: X402PaymentPayload
): string {
    const header: X402PaymentHeader = {
        x402Version: 1,
        scheme: 'exact',
        network,
        payload,
    };
    return Buffer.from(JSON.stringify(header)).toString('base64');
}

// ===========================================
// SERVER UTILS
// ===========================================

export function create402Response(
    payTo: string,
    amount: string,
    resource: string,
    asset: string = '0xUSDC_CONTRACT_PLACEHOLDER' // TODO: Replace with real address or env var
): Response {
    const requirements: X402Requirements = {
        x402Version: 1,
        accepts: [{
            scheme: 'exact',
            network: `eip155:${movementTestnet.id}`,
            maxAmountRequired: amount,
            resource,
            description: 'Tip to reply',
            payTo,
            asset,
            maxTimeoutSeconds: 60,
            extra: { name: 'USD Coin', version: '2' }
        }]
    };

    const headerVal = Buffer.from(JSON.stringify(requirements)).toString('base64');

    return new Response(JSON.stringify(requirements), {
        status: 402,
        headers: {
            'Content-Type': 'application/json',
            'PAYMENT-REQUIRED': headerVal,
        },
    });
}

// ===========================================
// FETCH WRAPPER
// ===========================================

export async function x402Fetch(
    url: string,
    options: RequestInit = {},
    onSign: (requirements: X402Requirements) => Promise<string | null> // Returns valid X-PAYMENT header
): Promise<Response> {
    // 1. Initial Request
    const res = await fetch(url, options);
    if (res.status !== 402) return res;

    // 2. Parse Requirements
    const reqs = parse402Response(res);
    if (!reqs) throw new Error('Invalid 402 response');

    // 3. Request Signature
    const paymentHeader = await onSign(reqs);
    if (!paymentHeader) throw new Error('Payment cancelled');

    // 4. Retry with Header
    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'X-PAYMENT': paymentHeader,
        },
    });
}
