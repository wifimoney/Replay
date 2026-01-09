'use client';

import { useState, useCallback } from 'react';
import { usePrivy, useWallets, useSignTypedData } from '@privy-io/react-auth';
import {
    x402Fetch,
    X402Requirements,
    EIP712_TYPES,
    createPaymentHeader
} from '@/lib/x402';
import { toast } from 'sonner';
import { toHex } from 'viem';

export type PaymentStatus = 'idle' | 'signing' | 'confirming' | 'success' | 'error';

export function usePayment() {
    const { authenticated, login, getAccessToken } = usePrivy();
    const { wallets } = useWallets();
    const { signTypedData } = useSignTypedData();
    const [status, setStatus] = useState<PaymentStatus>('idle');

    const submitPaidReply = useCallback(async (postId: string, content: string) => {
        // 1. Auth check
        if (!authenticated) {
            login();
            return null;
        }

        // 2. Wallet check - prioritize Privy embedded wallet
        const wallet = wallets.find(w => w.walletClientType === 'privy') || wallets[0];
        if (!wallet) {
            toast.error('No wallet found', { description: 'Please try signing in again.' });
            return null;
        }

        setStatus('signing');

        try {
            // 3. Get Privy access token for server auth
            const accessToken = await getAccessToken();
            if (!accessToken) {
                toast.error('Auth error', { description: 'Could not get access token' });
                return null;
            }

            // 4. Start x402 flow with Bearer token
            const response = await x402Fetch(
                '/api/replies',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        postId,
                        content,
                        walletAddress: wallet.address
                    }),
                },
                // 4. Handle 402 Signing - using Privy's useSignTypedData for invisible UX
                async (reqs: X402Requirements) => {
                    try {
                        const accept = reqs.accepts[0];
                        const now = Math.floor(Date.now() / 1000);

                        // Random 32-byte nonce
                        const nonce = toHex(crypto.getRandomValues(new Uint8Array(32)));

                        const domain = {
                            name: accept.extra?.name || 'USD Coin',
                            version: accept.extra?.version || '2',
                            chainId: parseInt(accept.network.split(':')[1]),
                            verifyingContract: accept.asset as `0x${string}`,
                        };

                        const types = {
                            TransferWithAuthorization: EIP712_TYPES.TransferWithAuthorization,
                        };

                        const message = {
                            from: wallet.address as `0x${string}`,
                            to: accept.payTo as `0x${string}`,
                            value: BigInt(accept.maxAmountRequired),
                            validAfter: BigInt(0),
                            validBefore: BigInt(now + accept.maxTimeoutSeconds),
                            nonce: nonce as `0x${string}`,
                        };

                        // Use Privy's signTypedData with quiet UI option
                        // Try with hidden wallet UI first, fallback to normal if needed
                        let signature: string;
                        const typedDataInput = {
                            domain,
                            types,
                            primaryType: 'TransferWithAuthorization' as const,
                            message: {
                                from: message.from,
                                to: message.to,
                                value: message.value.toString(),
                                validAfter: message.validAfter.toString(),
                                validBefore: message.validBefore.toString(),
                                nonce: message.nonce,
                            },
                        };

                        // Use single-argument signTypedData - noPromptOnSignature in provider config
                        // handles the quiet UX for embedded wallets
                        signature = await signTypedData(typedDataInput);

                        const payload = {
                            signature,
                            authorization: {
                                from: message.from,
                                to: message.to,
                                value: message.value.toString(),
                                validAfter: message.validAfter.toString(),
                                validBefore: message.validBefore.toString(),
                                nonce
                            }
                        };

                        setStatus('confirming');
                        return createPaymentHeader(accept.network, payload);
                    } catch (error) {
                        console.error('Signing failed:', error);
                        setStatus('error');
                        toast.error('Payment cancelled');
                        return null;
                    }
                }
            );

            // 5. Success handling
            if (response.ok) {
                setStatus('success');
                const data = await response.json();
                return data;
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Payment failed');
            }

        } catch (error: any) {
            console.error('Payment flow error:', error);
            setStatus('error');
            toast.error('Reply failed', { description: error.message });
            return null;
        } finally {
            setTimeout(() => setStatus('idle'), 3000);
        }
    }, [authenticated, login, wallets, signTypedData]);

    return { status, submitPaidReply };
}
