'use client'; // Error boundaries must be Client Components

import { useEffect } from 'react';

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
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div>
      <h2>{t.error.title}</h2>
      <button onClick={() => reset()}>{t.error.retry}</button>
    </div>
  );
}
