'use client';

import { useTransition } from 'react';

import { useRouter } from 'next/navigation';

import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui';

import { signOutAction } from '@/features/auth/actions';
import { setLocaleAction } from '@/lib/i18n/actions';
import { LOCALE_NATIVE_NAMES, nextLocale } from '@/lib/i18n/config';
import { useI18n } from '@/lib/i18n/context';

export const UserMenu = () => {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const target = nextLocale(locale);

  const switchLanguage = () => {
    startTransition(async () => {
      await setLocaleAction(target);
      router.refresh();
    });
  };

  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger
        className="w-8 h-8 rounded-full bg-muted flex items-center justify-center transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-label={t.settings.language}
      >
        <span className="text-xs font-medium text-muted-foreground">Y</span>
      </DropdownMenuPrimitive.Trigger>

      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-44 rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none"
        >
          <DropdownMenuPrimitive.Item
            onSelect={(event) => {
              event.preventDefault();
              switchLanguage();
            }}
            disabled={isPending}
            className="flex w-full items-center justify-between rounded-sm px-3 py-2 text-sm outline-none cursor-pointer focus:bg-accent focus:text-accent-foreground data-disabled:opacity-50 data-disabled:pointer-events-none"
          >
            <span>{t.settings.language}</span>
            <span className="text-muted-foreground">{LOCALE_NATIVE_NAMES[target]}</span>
          </DropdownMenuPrimitive.Item>

          <DropdownMenuPrimitive.Separator className="my-1 h-px bg-border" />

          <DropdownMenuPrimitive.Item
            onSelect={(event) => {
              event.preventDefault();
              startTransition(() => {
                signOutAction();
              });
            }}
            disabled={isPending}
            className="flex w-full items-center rounded-sm px-3 py-2 text-sm outline-none cursor-pointer focus:bg-accent focus:text-accent-foreground data-disabled:opacity-50 data-disabled:pointer-events-none"
          >
            {t.settings.signOut}
          </DropdownMenuPrimitive.Item>
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
};
