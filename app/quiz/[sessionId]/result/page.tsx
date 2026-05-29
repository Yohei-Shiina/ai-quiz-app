import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function ResultPage() {
  return (
    <main className="min-h-dvh bg-background flex flex-col">
      <div className="mx-auto max-w-md w-full px-4 pt-20 pb-8 flex flex-col items-center gap-6 flex-1">
        <div className="mt-12 w-full flex flex-col gap-3">
          <Button asChild className="h-12 w-full rounded-xl text-[15px] font-medium shadow-sm">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
