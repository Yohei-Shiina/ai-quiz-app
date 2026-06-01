'use server';

import { cookies } from 'next/headers';

import { LOCALE_COOKIE, type Locale } from '@/lib/i18n/config';

const ONE_YEAR = 60 * 60 * 24 * 365;

export const setLocaleAction = async (locale: Locale) => {
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: ONE_YEAR,
    sameSite: 'lax',
  });
};
