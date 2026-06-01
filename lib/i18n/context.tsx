'use client';

import { createContext, useContext } from 'react';

import type { Locale } from '@/lib/i18n/config';
import { getDictionary, type Dictionary } from '@/lib/i18n/dictionaries';

type I18nValue = { locale: Locale; t: Dictionary };

const I18nContext = createContext<I18nValue | null>(null);

export const I18nProvider = ({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) => {
  const value: I18nValue = { locale, t: getDictionary(locale) };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nValue => {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used within <I18nProvider>');
  return value;
};
