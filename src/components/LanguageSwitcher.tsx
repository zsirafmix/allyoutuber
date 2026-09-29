'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, SupportedLanguage, LANGUAGE_LABELS } from '@/lib/i18n';
import { Globe, ChevronDown } from 'lucide-react';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const current = LANGUAGE_LABELS[language] || LANGUAGE_LABELS.hu;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-sm font-medium text-slate-200 transition"
        title="Change Language"
      >
        <span className="text-base">{current.flag}</span>
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl py-1 z-50 backdrop-blur-md">
          {(Object.keys(LANGUAGE_LABELS) as SupportedLanguage[]).map((lang) => (
            <button
              key={lang}
              onClick={() => {
                setLanguage(lang);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition ${
                language === lang
                  ? 'bg-violet-600/30 text-violet-300 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="text-base">{LANGUAGE_LABELS[lang].flag}</span>
              <span>{LANGUAGE_LABELS[lang].label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
