import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';
import { getDict } from '@/lib/i18n/server';

export default async function NotFound() {
  const t = await getDict();

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-4">
      <div
        className="w-full max-w-md flex flex-col gap-6"
        style={{ animation: 'fade-up 0.4s ease-out both' }}
      >
        <h2 className="font-display italic text-[30px] leading-tight tracking-[-0.01em] font-normal text-foreground m-0">
          {t.notFound.title}
        </h2>
        <Button asChild className="h-12 w-full rounded-xl text-[15px] font-medium shadow-sm">
          <Link href={ROUTES.home}>{t.notFound.backHome}</Link>
        </Button>
      </div>
    </div>
  );
}
