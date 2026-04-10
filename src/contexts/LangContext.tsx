'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type { Lang } from '@/lib/i18n';

interface LangContextType {
  lang: Lang;
  toggleLang: () => void;
}

const LangContext = createContext<LangContextType | undefined>(undefined);

export const useLangContext = () => {
  const context = useContext(LangContext);
  if (context === undefined) {
    throw new Error('useLangContext must be used within a LangProvider');
  }
  return context;
};

const STORAGE_KEY = 'lang';
const DEFAULT_LANG: Lang = 'en';

function readStoredLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'kr') return stored;
  } catch {
    // localStorage unavailable (SSR or private browsing)
  }
  return DEFAULT_LANG;
}

interface LangProviderProps {
  children: ReactNode;
}

export const LangProvider: React.FC<LangProviderProps> = ({ children }) => {
  // Start with default; real value loaded after mount to avoid hydration mismatch.
  const [lang, setLang] = useState<Lang>(DEFAULT_LANG);

  // Sync from localStorage after hydration
  useEffect(() => {
    setLang(readStoredLang());
  }, []);

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next: Lang = prev === 'en' ? 'kr' : 'en';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return (
    <LangContext.Provider value={{ lang, toggleLang }}>
      {children}
    </LangContext.Provider>
  );
};
