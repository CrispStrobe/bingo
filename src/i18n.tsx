import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { de } from './locales/de'
import { en, type Key } from './locales/en'
import { it } from './locales/it'

export const LANGS = { en: 'English', de: 'Deutsch', it: 'Italiano' } as const
export type Lang = keyof typeof LANGS

const DICTS = { en, de, it }
const STORE_KEY = 'crispbingo:lang'
const LEGACY_STORE_KEY = 'bingo-party:lang'

export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORE_KEY) ?? localStorage.getItem(LEGACY_STORE_KEY)
    if (saved && saved in LANGS) return saved as Lang
  } catch {
    /* private mode */
  }
  for (const tag of navigator.languages ?? [navigator.language]) {
    const base = tag.split('-')[0]
    if (base in LANGS) return base as Lang
  }
  return 'en'
}

export type Translate = (key: Key, vars?: Record<string, string | number>) => string

/** Translator without React, for strings needed before the provider mounts. */
export function staticT(lang: Lang = detectLang()): Translate {
  return make(lang)
}

function make(lang: Lang): Translate {
  const dict = DICTS[lang]
  return (key, vars) => {
    const raw = dict[key] ?? en[key] ?? key
    if (!vars) return raw
    return raw.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m))
  }
}

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: Translate }
const I18nContext = createContext<Ctx | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang)

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem(STORE_KEY, l)
    } catch {
      /* private mode */
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo(() => ({ lang, setLang, t: make(lang) }), [lang, setLang])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n outside I18nProvider')
  return ctx
}

/** BCP-47 tag for speech synthesis. */
export function speechLocale(lang: Lang): string {
  return lang === 'de' ? 'de-DE' : lang === 'it' ? 'it-IT' : 'en-GB'
}
