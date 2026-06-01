'use client';

import { useTransition } from 'react';

import { useRouter } from 'next/navigation';

import { LOCALES, type Locale } from '@/lib/i18n/config';
import { setLocaleAction } from '@/lib/i18n/actions';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';

const LABELS: Record<Locale, string> = { en: 'EN', ja: '日本語' };

export const LanguageToggle = () => {
  const { locale } = useI18n();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const switchTo = (next: Locale) => {
    if (next === locale) return;
    startTransition(async () => {
      await setLocaleAction(next);
      router.refresh();
    });
  };

  return (
    <div className="inline-flex items-center rounded-full border border-border bg-card p-0.5">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => switchTo(l)}
          disabled={isPending}
          aria-pressed={l === locale}
          className={cn(
            'rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50',
            l === locale
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
};
