/**
 * Movement EVM Chain Configuration
 * 
 * This module provides the complete Movement EVM Testnet configuration
 * for use with viem and wagmi.
 */

import { defineChain } from 'viem';
import { http, createConfig, createStorage } from 'wagmi';

// ===========================================
// MOVEMENT EVM TESTNET CHAIN DEFINITION
// ===========================================

/**
 * Movement EVM Testnet (Imola)
 * 
 * This is the EVM-compatible testnet for Movement Network.
 * Uses the Solidity/EVM execution layer, not Move.
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
            http: [process.env.NEXT_PUBLIC_MOVEMENT_RPC_URL || 'https://mevm.testnet.imola.movementlabs.xyz/v1'],
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
 * Movement EVM Mainnet (Porto)
 * 
 * Production chain - use only when ready for mainnet.
 */
export const movementMainnet = defineChain({
    id: 126,
    name: 'Movement EVM Mainnet',
    nativeCurrency: {
        name: 'MOVE',
        symbol: 'MOVE',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ['https://mevm.mainnet.movementlabs.xyz/v1'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Movement Explorer',
            url: 'https://explorer.movementlabs.xyz',
        },
    },
    testnet: false,
});

// ===========================================
// WAGMI CONFIG
// ===========================================

/**
 * Wagmi configuration for Movement EVM
 */
export const wagmiConfig = createConfig({
    chains: [movementTestnet],
    transports: {
        [movementTestnet.id]: http(),
    },
    // SSR-safe storage (no localStorage during SSR)
    storage: createStorage({
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    }),
    ssr: true,
});

// ===========================================
// PAYMENT CONFIGURATION
// ===========================================

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

    // Seller address (receives payments)
    sellerAddress: process.env.X402_SELLER_ADDRESS || '0x0000000000000000000000000000000000000001',
} as const;

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

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

/**
 * Get explorer URL for a transaction
 */
export function getExplorerTxUrl(txHash: string, chain: typeof movementTestnet = movementTestnet): string {
    return `${chain.blockExplorers.default.url}/tx/${txHash}`;
}

/**
 * Get explorer URL for an address
 */
export function getExplorerAddressUrl(address: string, chain: typeof movementTestnet = movementTestnet): string {
    return `${chain.blockExplorers.default.url}/address/${address}`;
}

/**
 * Check if we're on the correct chain
 */
export function isMovementChain(chainId: number): boolean {
    return chainId === movementTestnet.id || chainId === movementMainnet.id;
}
