import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { LanguageContext, detectLanguage, saveLanguage, type Language } from './context'
import { en } from './en'
import { fi } from './fi'

const DICTIONARIES = { en, fi }

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(detectLanguage)

  const setLang = useCallback((next: Language) => {
    setLangState(next)
    saveLanguage(next)
  }, [])

  const t = DICTIONARIES[lang]

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo(() => ({ lang, t, setLang }), [lang, t, setLang])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
