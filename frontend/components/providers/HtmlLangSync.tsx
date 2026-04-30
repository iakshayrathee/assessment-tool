'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function HtmlLangSync() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    const fontMap: Record<string, string> = {
      hi: 'var(--font-devanagari), var(--font-inter), sans-serif',
      kn: 'var(--font-kannada), var(--font-inter), sans-serif',
      en: 'var(--font-inter), sans-serif',
    };
    document.documentElement.style.setProperty(
      '--font-lang',
      fontMap[i18n.language] || fontMap.en
    );
  }, [i18n.language]);

  return null;
}
