'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TRANSLATIONS, Language } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('am'); // Default to Amharic for Ethiopian authentic experience, toggleable anytime
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('enat_lang') as Language;
    if (saved === 'en' || saved === 'am') {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('enat_lang', lang);
    }
  };

  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'am' : 'en';
    setLanguage(nextLang);
  };

  const t = (key: string): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    if (dict[key]) {
      return dict[key];
    }
    // Fallback to English
    if (TRANSLATIONS.en[key]) {
      return TRANSLATIONS.en[key];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Provide a safe fallback if used outside provider
    return {
      language: 'am' as Language,
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: (key: string) => TRANSLATIONS.am[key] || TRANSLATIONS.en[key] || key
    };
  }
  return context;
}
