import type { Metadata, Viewport } from 'next';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

export const metadata: Metadata = {
    title: 'Replay | Pay-Per-Interaction Social',
    description: 'Replies that matter. Pay to speak. Listen to signal. A social feed where every reply is an atomic payment on Movement.',
    keywords: ['social', 'crypto', 'movement', 'x402', 'micropayments', 'web3'],
    openGraph: {
        title: 'Replay | Pay-Per-Interaction Social',
        description: 'Replies that matter. Pay to speak. Listen to signal.',
        type: 'website',
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    themeColor: '#09090b',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <body>
                <Providers>
                    {children}
                    <Toaster />
                </Providers>
            </body>
        </html>
    );
}
