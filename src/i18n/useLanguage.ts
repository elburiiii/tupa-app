import { useContext } from 'react'
import { LanguageContext } from './context'

/** Current language, its dictionary (`t`) and a setter. */
export function useLanguage() {
  return useContext(LanguageContext)
}
