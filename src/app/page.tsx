'use client';

import { useState } from 'react';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { ReplayApp } from '@/components/ReplayApp';
import { useAuth } from '@/components/providers';

export default function HomePage() {
  const { ready, authenticated } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Show loading state while auth initializes
  if (!ready) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading...</div>
      </main>
    );
  }

  // If authenticated or user dismissed onboarding, show the app
  if (authenticated || !showOnboarding) {
    return (
      <main className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
        <ReplayApp />
      </main>
    );
  }

  // Show onboarding for new users
  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-[375px] h-[667px] mx-auto shadow-2xl overflow-hidden border border-zinc-800">
        <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
      </div>
    </main>
  );
}
