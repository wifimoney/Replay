'use client';

/**
 * Privy Provider Component
 * 
 * Wraps the app with Privy authentication context.
 * Provides a mock context when Privy is not configured (development).
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { PrivyProvider, usePrivy as usePrivyOriginal, useWallets } from '@privy-io/react-auth';

// Movement EVM Testnet chain config
const movementTestnet = {
    id: 30732,
    name: 'Movement EVM Testnet',
    network: 'movement-testnet',
    nativeCurrency: {
        name: 'MOVE',
        symbol: 'MOVE',
        decimals: 18,
    },
    rpcUrls: {
        default: {
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
};

// Custom hook to access the unified auth context
export const AuthContext = createContext<any>(null);

export function useAuth() {
    return useContext(AuthContext);
}

function PrivyAuthAdapter({ children }: { children: React.ReactNode }) {
    const privy = usePrivyOriginal();
    return (
        <AuthContext.Provider value={privy}>
            {children}
        </AuthContext.Provider>
    );
}

function MockAuthAdapter({ children }: { children: React.ReactNode }) {
    const [authenticated, setAuthenticated] = useState(false);

    const login = useCallback(() => setAuthenticated(true), []);
    const logout = useCallback(() => setAuthenticated(false), []);

    const value = {
        ready: true,
        authenticated,
        user: authenticated ? { email: { address: 'demo@replay.app' } } : null,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

interface ProvidersProps {
    children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

    if (!appId) {
        console.warn('NEXT_PUBLIC_PRIVY_APP_ID is not configured - using mock auth');
        return (
            <MockAuthAdapter>
                {children}
            </MockAuthAdapter>
        );
    }

    return (
        <PrivyProvider
            appId={appId}
            config={{
                loginMethods: ['email', 'sms'],
                appearance: {
                    theme: 'dark',
                    accentColor: '#ffffff',
                },
                embeddedWallets: {
                    createOnLogin: 'all-users',
                    showWalletUIs: false,
                    noPromptOnSignature: true,
                },
                defaultChain: movementTestnet,
                supportedChains: [movementTestnet],
            }}
        >
            <PrivyAuthAdapter>
                {children}
            </PrivyAuthAdapter>
        </PrivyProvider>
    );
}
