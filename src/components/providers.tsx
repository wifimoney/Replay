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

// Mock auth context for development without Privy
interface MockAuthContext {
    ready: boolean;
    authenticated: boolean;
    user: { email?: { address: string } } | null;
    login: () => void;
    logout: () => void;
}

const MockAuthContext = createContext<MockAuthContext | null>(null);

function MockAuthProvider({ children }: { children: React.ReactNode }) {
    const [authenticated, setAuthenticated] = useState(false);

    const login = useCallback(() => {
        setAuthenticated(true);
    }, []);

    const logout = useCallback(() => {
        setAuthenticated(false);
    }, []);

    return (
        <MockAuthContext.Provider
            value={{
                ready: true,
                authenticated,
                user: authenticated ? { email: { address: 'demo@replay.app' } } : null,
                login,
                logout,
            }}
        >
            {children}
        </MockAuthContext.Provider>
    );
}

// Custom hook that uses either Privy or mock auth
export function useAuth() {
    const mockAuth = useContext(MockAuthContext);

    // If we have mock auth context, use it
    if (mockAuth) {
        return mockAuth;
    }

    // Otherwise, this will throw if not wrapped in PrivyProvider
    // which is fine - we'll handle that case in the provider
    try {
        const privy = usePrivyOriginal();
        return {
            ready: privy.ready,
            authenticated: privy.authenticated,
            user: privy.user,
            login: privy.login,
            logout: privy.logout,
        };
    } catch {
        // Fallback if hook fails
        return {
            ready: true,
            authenticated: false,
            user: null,
            login: () => console.warn('Privy not configured'),
            logout: () => { },
        };
    }
}

interface ProvidersProps {
    children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

    if (!appId) {
        // Render with mock auth provider for development
        console.warn('NEXT_PUBLIC_PRIVY_APP_ID is not configured - using mock auth');
        return <MockAuthProvider>{children}</MockAuthProvider>;
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
                    createOnLogin: 'users-without-wallets',
                    showWalletUIs: false,
                },
                defaultChain: movementTestnet,
                supportedChains: [movementTestnet],
            }}
        >
            {children}
        </PrivyProvider>
    );
}
