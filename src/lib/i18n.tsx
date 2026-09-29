'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import hu from '../locales/hu.json';
import en from '../locales/en.json';
import de from '../locales/de.json';
import ru from '../locales/ru.json';
import fr from '../locales/fr.json';

export type SupportedLanguage = 'hu' | 'en' | 'de' | 'ru' | 'fr';

const translations: Record<SupportedLanguage, any> = {
  hu,
  en,
  de,
  ru,
  fr,
};

export const LANGUAGE_LABELS: Record<SupportedLanguage, { label: string; flag: string }> = {
  hu: { label: 'Magyar', flag: '🇭🇺' },
  en: { label: 'English', flag: '🇬🇧' },
  de: { label: 'Deutsch', flag: '🇩🇪' },
  ru: { label: 'Русский', flag: '🇷🇺' },
  fr: { label: 'Français', flag: '🇫🇷' },
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'hu',
  setLanguage: () => {},
  t: (path) => path,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>('hu');

  useEffect(() => {
    const saved = localStorage.getItem('allyoutuber_lang') as SupportedLanguage;
    if (saved && translations[saved]) {
      setLanguageState(saved);
    } else {
      const browserLang = navigator.language.slice(0, 2);
      if (['hu', 'en', 'de', 'ru', 'fr'].includes(browserLang)) {
        setLanguageState(browserLang as SupportedLanguage);
      }
    }
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('allyoutuber_lang', lang);
  };

  const t = (path: string, params?: Record<string, string | number>): string => {
    const keys = path.split('.');
    let current = translations[language] || translations.hu;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English if missing
        let fallback = translations.en;
        for (const fbKey of keys) {
          if (fallback && typeof fallback === 'object' && fbKey in fallback) {
            fallback = fallback[fbKey];
          } else {
            return path;
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current !== 'string') return path;

    let result = current;
    if (params) {
      for (const [pKey, pVal] of Object.entries(params)) {
        result = result.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
      }
    }
    return result;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
