'use client';

/**
 * Onboarding Screen
 * 
 * Full-screen dark onboarding with animated background.
 * "Replies that matter. Pay to speak. Listen to signal."
 */

import React from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers';
import Image from 'next/image';

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
    const { login, ready } = useAuth();

    const handleGetStarted = async () => {
        await login();
        onComplete();
    };

    return (
        <div className="relative h-full w-full bg-black text-white flex flex-col font-sans selection:bg-yellow-900/30 overflow-hidden">

            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(253,224,71,0.03)_0%,transparent_60%)]" />
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                    {[1, 2, 3].map((i) => (
                        <motion.div
                            key={i}
                            className="absolute border border-white/10 rounded-full"
                            style={{ width: `${i * 250}px`, height: `${i * 250}px` }}
                            animate={{
                                scale: [1, 1.05, 1],
                                opacity: [0.3, 0.1, 0.3],
                            }}
                            transition={{
                                duration: 8 + i * 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: i * 2,
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Header */}
            <header className="absolute top-0 left-0 right-0 p-8 flex justify-center z-10">
                <Image
                    src="/images/4fc30744af8343073f9758cd778b65d18578784f.png"
                    alt="Replay"
                    width={80}
                    height={80}
                    className="h-20 w-auto object-contain opacity-90"
                />
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center text-center z-10 px-6 mt-10">
                <div className="flex flex-col items-center gap-6">
                    <h1 className="text-4xl font-semibold tracking-tight text-white">
                        Replies that matter.
                    </h1>

                    <div className="flex flex-col gap-1 text-lg font-normal text-zinc-400 tracking-wide">
                        <span>Pay to speak.</span>
                        <span>Listen to signal.</span>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full p-8 pb-12 z-10 flex justify-center">
                <Button
                    onClick={handleGetStarted}
                    disabled={!ready}
                    className="w-full h-12 bg-white text-black hover:bg-zinc-200 hover:text-black font-medium text-base rounded-full shadow-[0_0_20px_-5px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_-5px_rgba(253,224,71,0.2)]"
                >
                    Get started
                </Button>
            </footer>
        </div>
    );
}
