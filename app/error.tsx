'use client';

import { useEffect } from 'react';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';
import { useI18n } from '@/lib/i18n/context';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="font-display italic text-[30px] leading-tight tracking-[-0.01em] font-normal text-foreground m-0">
            {t.error.title}
          </h2>
          {error.digest && (
            <p className="font-sans text-xs text-muted-foreground m-0 tracking-wide">
              {t.error.errorId}: <span className="font-mono select-all">{error.digest}</span>
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <Button
            onClick={() => reset()}
            className="h-12 w-full rounded-xl text-[15px] font-medium shadow-sm"
          >
            {t.error.retry}
          </Button>
          <Link
            href={ROUTES.home}
            className="text-center font-sans text-sm text-muted-foreground hover:text-foreground transition-colors py-2.5"
          >
            {t.error.backHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
