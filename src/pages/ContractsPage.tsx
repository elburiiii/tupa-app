import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { LimitNotice } from '../components/LimitNotice'
import { buttonClass, secondaryButtonClass } from '../components/ui'
import { formatDate, formatEuro, formatNumber, type Language } from '../i18n/context'
import type { Dictionary } from '../i18n/en'
import { useLanguage } from '../i18n/useLanguage'
import { FREE_CONTRACT_LIMIT } from '../lib/config'
import { byNextDeadline, nextDeadline, todayIso } from '../lib/deadlines'
import { supabase } from '../lib/supabase'
import type { ContractRow } from '../lib/types'

/** Price line for the list, e.g. "Spot price 0.49 c/kWh + €3.90/month" or "€29.90 per month". */
function priceText(contract: ContractRow, t: Dictionary, lang: Language): string | null {
  const amount = contract.price_amount != null ? formatEuro(contract.price_amount, lang) : null
  if (contract.price_type === 'spot' && contract.spot_margin_cents_kwh != null) {
    return t.spotPrice(formatNumber(contract.spot_margin_cents_kwh, lang), amount)
  }
  const parts = [
    contract.price_type === 'variable' ? t.priceTypes.variable : null,
    amount,
    amount && contract.price_period ? t.pricePeriods[contract.price_period] : null,
  ]
  return parts.filter(Boolean).join(' ') || null
}

/** Active contracts, sorted by the next date the user has to act by. */
export function ContractsPage() {
  const { t, lang } = useLanguage()
  const [contracts, setContracts] = useState<ContractRow[] | null>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    supabase
      .from('contracts')
      .select('*')
      .eq('status', 'active')
      .then(({ data, error }) => {
        if (error) return setLoadError(true)
        setContracts([...(data as ContractRow[])].sort(byNextDeadline))
      })
  }, [])

  if (loadError) return <p role="alert" className="text-red-700">{t.contracts.loadError}</p>
  if (!contracts) return <p className="text-ink-500">{t.loading}</p>

  const atLimit = contracts.length >= FREE_CONTRACT_LIMIT
  const today = todayIso()

  return (
    <section className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-ink-950">{t.contracts.title}</h1>
        {!atLimit && (
          <div className="flex gap-2">
            <Link to="/contracts/new" className={secondaryButtonClass}>{t.contracts.addManually}</Link>
            <Link to="/upload" className={buttonClass}>{t.contracts.upload}</Link>
          </div>
        )}
      </div>

      {atLimit && <div className="mt-6"><LimitNotice /></div>}

      {contracts.length === 0 ? (
        <p className="mt-6 text-ink-500">{t.contracts.empty}</p>
      ) : (
        <ul className="mt-6 divide-y divide-line rounded-xl border border-line bg-surface">
          {contracts.map((contract) => {
            const deadline = nextDeadline(contract)
            const passed = deadline !== null && deadline < today
            const price = priceText(contract, t, lang)
            return (
              <li key={contract.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                <div>
                  <p className="font-semibold text-ink-950">{contract.provider_name}</p>
                  <p className="text-sm text-ink-500">
                    {t.categories[contract.category]} · {t.termTypes[contract.term_type]}
                    {price && ` · ${price}`}
                  </p>
                </div>
                <div className="text-right text-sm">
                  {deadline ? (
                    <>
                      <p className="text-ink-500">{t.contracts.nextDeadline}</p>
                      <p className={passed ? 'font-semibold text-red-700' : 'font-semibold text-ink-950'}>
                        {formatDate(deadline, lang)}{passed && ` · ${t.contracts.overdue}`}
                      </p>
                    </>
                  ) : (
                    <p className="text-ink-500">
                      {contract.term_type === 'open_ended'
                        ? t.contracts.cancelAnytime(contract.notice_period_days)
                        : t.contracts.noDeadline}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
