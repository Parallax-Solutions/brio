'use client';

import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { Locale, defaultLocale, getMessages, createTranslator } from './config';
import { updateLocale } from '@/lib/server/profile';

type Messages = ReturnType<typeof getMessages>;

interface I18nContextValue {
  locale: Locale;
  messages: Messages;
  t: (namespace: string) => (key: string, params?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  locale: Locale;
  messages: Messages;
  children: React.ReactNode;
}

export function I18nProvider({ locale: initialLocale, messages: initialMessages, children }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [messages, setMessages] = useState<Messages>(initialMessages);

  const setLocale = useCallback(async (newLocale: Locale) => {
    setLocaleState(newLocale);
    setMessages(getMessages(newLocale));
    // Persist to localStorage for immediate use
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }
    // Also persist to database for logged-in users
    await updateLocale({ locale: newLocale });
  }, []);

  const value = useMemo(
    () => ({
      locale,
      messages,
      t: (namespace: string) => createTranslator(namespace, locale),
      setLocale,
    }),
    [locale, messages, setLocale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslations(namespace: string) {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslations must be used within an I18nProvider');
  }
  return context.t(namespace);
}

export function useLocale(): Locale {
  const context = useContext(I18nContext);
  if (!context) {
    return defaultLocale;
  }
  return context.locale;
}

export function useI18nContext() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18nContext must be used within an I18nProvider');
  }
  return context;
}

