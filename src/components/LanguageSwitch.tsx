import { LANGUAGES } from '../i18n/context'
import { useLanguage } from '../i18n/useLanguage'
import { cn } from '../lib/cn'

/** Compact FI / EN toggle. */
export function LanguageSwitch() {
  const { lang, setLang, t } = useLanguage()
  return (
    <div role="group" aria-label={t.language.label} className="inline-flex rounded-full bg-ink-900/5 p-0.5">
      {LANGUAGES.map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={lang === code}
          aria-label={t.language[code]}
          onClick={() => setLang(code)}
          className={cn(
            'h-7 min-w-9 rounded-full px-2.5 text-xs font-semibold uppercase',
            lang === code ? 'bg-surface text-ink-950 shadow-sm ring-1 ring-line' : 'text-ink-500 hover:text-ink-950',
          )}
        >
          {code}
        </button>
      ))}
    </div>
  )
}
