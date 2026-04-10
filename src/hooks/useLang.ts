'use client';

import { useLangContext } from '@/contexts/LangContext';
import { t, type Lang, type TranslationKey } from '@/lib/i18n';

/**
 * useLang — convenience hook for language-aware components.
 *
 * Returns:
 *   lang       — current language ('en' | 'kr')
 *   toggleLang — function to switch language
 *   t          — pre-bound translate function: tr('key') -> string
 *
 * Example:
 *   const { tr } = useLang();
 *   <h1>{tr('home.recentTitle')}</h1>
 */
export function useLang() {
  const { lang, toggleLang } = useLangContext();
  const tr = (key: TranslationKey) => t(key, lang);
  return { lang, toggleLang, tr } as const;
}

export type { Lang, TranslationKey };
