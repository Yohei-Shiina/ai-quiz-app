'use client';

import { useEffect, useState } from 'react';

import { LOADING } from '@/lib/constants';
import { useI18n } from '@/lib/i18n/context';

export const LoadingView = ({ topic }: { topic: string }) => {
  const { t } = useI18n();
  const steps = t.loading.steps;
  const [stepIndex, setStepIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (stepIndex >= steps.length - 1) return;

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
  }, [stepIndex, steps.length]);

  return (
    <main className="min-h-dvh flex flex-col max-w-md sm:max-w-lg mx-auto px-4 items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <p className="font-display italic text-4xl text-primary">{topic}</p>
        <p className="text-base text-foreground">{t.loading.progress}</p>
        <p
          className={`text-sm text-muted-foreground mt-2 transition-opacity duration-200 motion-reduce:transition-none ${visible ? 'opacity-100' : 'opacity-0'}`}
        >
          {steps[stepIndex]}
        </p>
      </div>
    </main>
  );
};
