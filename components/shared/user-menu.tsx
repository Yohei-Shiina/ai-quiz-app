'use client';

import { useState, useTransition } from 'react';

import { useRouter } from 'next/navigation';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { setLocaleAction } from '@/lib/i18n/actions';
import { LOCALE_NATIVE_NAMES, nextLocale } from '@/lib/i18n/config';
import { useI18n } from '@/lib/i18n/context';

export const UserMenu = () => {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const target = nextLocale(locale);

  const switchLanguage = () => {
    startTransition(async () => {
      await setLocaleAction(target);
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="w-8 h-8 rounded-full bg-muted flex items-center justify-center transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-label={t.settings.language}
      >
        <span className="text-xs font-medium text-muted-foreground">Y</span>
      </SheetTrigger>

      <SheetContent className="pb-6">
        <SheetHeader>
          <SheetTitle>{t.settings.language}</SheetTitle>
        </SheetHeader>

        <div className="px-3">
          <button
            type="button"
            onClick={switchLanguage}
            disabled={isPending}
            className="flex w-full items-center justify-between rounded-xl px-3 py-3.5 text-left text-[15px] text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            <span>{LOCALE_NATIVE_NAMES[target]}</span>
            <span className="text-muted-foreground" aria-hidden="true">
              ›
            </span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
