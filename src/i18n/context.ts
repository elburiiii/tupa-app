import { createContext } from 'react'
import { fi } from './fi'
import type { Dictionary } from './en'

export const LANGUAGES = ['fi', 'en'] as const
export type Language = (typeof LANGUAGES)[number]

export interface LanguageContextValue {
  lang: Language
  t: Dictionary
  setLang: (lang: Language) => void
}

export const LanguageContext = createContext<LanguageContextValue>({
  lang: 'fi',
  t: fi,
  setLang: () => {},
})

const STORAGE_KEY = 'tupa:lang'

function isLanguage(value: unknown): value is Language {
  return LANGUAGES.includes(value as Language)
}

/** Picks the initial language: ?lang= in the URL, then a saved choice, then Finnish. */
export function detectLanguage(): Language {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('lang')
    if (isLanguage(fromUrl)) return fromUrl
    const saved = localStorage.getItem(STORAGE_KEY)
    if (isLanguage(saved)) return saved
  } catch {
    // Ignore storage errors (e.g. private mode).
  }
  return 'fi'
}

export function saveLanguage(lang: Language) {
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // Ignore storage errors.
  }
}

const LOCALES: Record<Language, string> = { fi: 'fi-FI', en: 'en-IE' }

/** Formats a euro amount the way each language expects (€74.20 vs 74,20 €). */
export function formatEuro(amount: number, lang: Language): string {
  return new Intl.NumberFormat(LOCALES[lang], { style: 'currency', currency: 'EUR' }).format(amount)
}

/** Formats a YYYY-MM-DD date (14.11.2026 vs 14/11/2026) without time-zone shifts. */
export function formatDate(isoDate: string, lang: Language): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Intl.DateTimeFormat(LOCALES[lang]).format(new Date(year, month - 1, day))
}
