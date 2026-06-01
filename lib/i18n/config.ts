export const LOCALES = ['en', 'ja'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'locale';

// Each locale's name in its own language (shown as the switch target).
export const LOCALE_NATIVE_NAMES: Record<Locale, string> = {
  en: 'English',
  ja: '日本語',
};

// The next locale to switch to. With two locales this is simply the other one.
export const nextLocale = (current: Locale): Locale =>
  LOCALES.find((l) => l !== current) ?? current;

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (LOCALES as readonly string[]).includes(value);

// Pick the best supported locale from an Accept-Language header value.
export const localeFromAcceptLanguage = (header: string | null): Locale => {
  if (!header) return DEFAULT_LOCALE;
  for (const part of header.split(',')) {
    const tag = part.split(';')[0]?.trim().toLowerCase() ?? '';
    if (tag.startsWith('ja')) return 'ja';
    if (tag.startsWith('en')) return 'en';
  }
  return DEFAULT_LOCALE;
};
