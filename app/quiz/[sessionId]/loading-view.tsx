'use client';

import { useEffect, useState } from 'react';

import { LOADING } from '@/lib/constants';

export const LoadingView = ({ topic }: { topic: string }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (stepIndex >= LOADING.messages.steps.length - 1) return;

    let fadeOutTimer: NodeJS.Timeout;

    const timer = setTimeout(() => {
      setVisible(false);

      fadeOutTimer = setTimeout(() => {
        setStepIndex((i) => i + 1);
        setVisible(true);
      }, LOADING.opacityDuration);
    }, LOADING.stepDuration);

    return () => {
      clearTimeout(timer);
      if (fadeOutTimer) clearTimeout(fadeOutTimer);
    };
  }, [stepIndex]);

  return (
    <main className="min-h-dvh flex flex-col max-w-md mx-auto px-4 items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <p className="font-display italic text-4xl text-primary">{topic}</p>
        <p className="text-base text-foreground">{LOADING.messages.progress}</p>
        <p
          className={`text-sm text-muted-foreground mt-2 transition-opacity duration-200 motion-reduce:transition-none ${visible ? 'opacity-100' : 'opacity-0'}`}
        >
          {LOADING.messages.steps[stepIndex]}
        </p>
      </div>
    </main>
  );
};
