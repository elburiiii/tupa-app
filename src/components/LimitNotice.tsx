import { useLanguage } from '../i18n/useLanguage'
import { FREE_CONTRACT_LIMIT } from '../lib/config'

/** Upgrade message shown when the free tier's contract limit is reached. */
export function LimitNotice() {
  const { t } = useLanguage()
  return (
    <div role="status" className="rounded-xl border border-tint-ring bg-tint p-4 text-sm">
      <p className="font-semibold text-primary">{t.limit.title}</p>
      <p className="mt-1 text-ink-700">{t.limit.body(FREE_CONTRACT_LIMIT)}</p>
    </div>
  )
}
