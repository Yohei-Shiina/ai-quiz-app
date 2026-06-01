import { cookies, headers } from 'next/headers';

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  localeFromAcceptLanguage,
  type Locale,
} from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';

// Resolve the active locale: explicit cookie wins, otherwise fall back to the
// browser's Accept-Language header on first visit.
export const getLocale = async (): Promise<Locale> => {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieLocale)) return cookieLocale;

  const acceptLanguage = (await headers()).get('accept-language');
  return localeFromAcceptLanguage(acceptLanguage) ?? DEFAULT_LOCALE;
};

export const getDict = async () => getDictionary(await getLocale());
