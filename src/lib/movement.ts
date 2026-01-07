/**
 * Movement EVM Testnet Configuration
 * 
 * This module provides the chain configuration for Movement EVM Testnet
 * that integrates with both Privy and viem.
 */

import { defineChain } from 'viem';

/**
 * Movement EVM Testnet Chain Definition
 * 
 * Chain ID: 30732 (Movement EVM Testnet / Imola)
 * This is the EVM-compatible testnet for Movement Network
 */
export const movementTestnet = defineChain({
    id: 30732,
    name: 'Movement EVM Testnet',
    nativeCurrency: {
        name: 'MOVE',
        symbol: 'MOVE',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ['https://mevm.testnet.imola.movementlabs.xyz/v1'],
        },
        public: {
            http: ['https://mevm.testnet.imola.movementlabs.xyz/v1'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Movement Explorer',
            url: 'https://explorer.testnet.imola.movementlabs.xyz',
        },
    },
    testnet: true,
});

/**
 * Payment configuration for x402
 */
export const paymentConfig = {
    // Cost per reply in wei (0.001 MOVE)
    replyCostWei: BigInt(process.env.NEXT_PUBLIC_REPLY_COST_WEI || '1000000000000000'),

    // Human readable cost
    replyCostFormatted: '0.001 MOVE',

    // Asset identifier for x402 (native MOVE token)
    asset: 'native',

    // Facilitator URL for payment verification
    facilitatorUrl: process.env.X402_FACILITATOR_URL || 'https://facilitator.stableyard.fi',
} as const;

/**
 * Format wei to MOVE with specified decimals
 */
export function formatMove(wei: bigint, decimals: number = 4): string {
    const move = Number(wei) / 1e18;
    return move.toFixed(decimals);
}

/**
 * Parse MOVE amount to wei
 */
export function parseMove(move: string | number): bigint {
    return BigInt(Math.floor(Number(move) * 1e18));
}
