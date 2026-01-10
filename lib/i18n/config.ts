// Simple i18n implementation that works without next-intl plugin
import esMessages from '@/messages/es.json';
import enMessages from '@/messages/en.json';

export type Locale = 'es' | 'en';

export const defaultLocale: Locale = 'es';
export const locales: readonly Locale[] = ['es', 'en'] as const;

// Re-export useLocale from context for convenience
export { useLocale } from './context';

const messages: Record<Locale, typeof esMessages> = {
  es: esMessages,
  en: enMessages,
};

export function getMessages(locale: Locale = defaultLocale) {
  return messages[locale] || messages[defaultLocale];
}

export function createTranslator(namespace: string, locale: Locale = defaultLocale) {
  const allMessages = messages[locale] || messages[defaultLocale];
  const namespaceMessages = (allMessages as Record<string, Record<string, string>>)[namespace] || {};

  return function t(key: string, params?: Record<string, string | number>): string {
    let text = namespaceMessages[key] || key;
    
    // Handle interpolation like {current} and {total}
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
      });
    }
    
    return text;
  };
}


