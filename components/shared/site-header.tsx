'use client';

import Link from 'next/link';

import { UserMenu } from '@/components/shared/user-menu';
import { useI18n } from '@/lib/i18n/context';

export const SiteHeader = () => {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-10 bg-background py-5 sm:bg-background/80 sm:backdrop-blur-sm sm:border-b sm:border-border/60">
      <div className="max-w-md sm:max-w-lg mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">Q</span>
          </div>
          <span className="text-sm font-medium text-foreground">{t.appName}</span>
        </Link>
        <UserMenu />
      </div>
    </header>
  );
};
