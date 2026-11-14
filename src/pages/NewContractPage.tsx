import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '../auth/context'
import { LimitNotice } from '../components/LimitNotice'
import { buttonClass, inputClass, labelClass } from '../components/ui'
import { useLanguage } from '../i18n/useLanguage'
import { isAtContractLimit } from '../lib/contracts'
import { supabase } from '../lib/supabase'
import {
  CATEGORIES, PRICE_PERIODS, TERM_TYPES,
  type ContractCategory, type DocumentRow, type PricePeriod, type TermType,
} from '../lib/types'

interface FormState {
  documentId: string
  providerName: string
  category: ContractCategory
  priceAmount: string
  pricePeriod: PricePeriod
  termType: TermType
  endDate: string
  noticePeriodDays: string
}

/** Manual contract entry. notice_deadline is computed by the database on save. */
export function NewContractPage() {
  const { session } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [documents, setDocuments] = useState<Pick<DocumentRow, 'id' | 'original_name' | 'created_at'>[]>([])
  const [atLimit, setAtLimit] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const [form, setForm] = useState<FormState>({
    documentId: params.get('document') ?? '',
    providerName: '',
    category: 'electricity',
    priceAmount: '',
    pricePeriod: 'month',
    termType: 'fixed_term',
    endDate: '',
    noticePeriodDays: '',
  })

  useEffect(() => {
    isAtContractLimit().then(setAtLimit, () => setAtLimit(false))
    supabase
      .from('documents')
      .select('id, original_name, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => setDocuments(data ?? []))
  }, [])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const endDateRequired = form.termType !== 'open_ended'

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!session) return
    setSaving(true)
    setFailed(false)

    const { error } = await supabase.from('contracts').insert({
      user_id: session.user.id,
      document_id: form.documentId || null,
      provider_name: form.providerName.trim(),
      category: form.category,
      price_amount: form.priceAmount ? Number(form.priceAmount.replace(',', '.')) : null,
      price_period: form.priceAmount ? form.pricePeriod : null,
      term_type: form.termType,
      end_date: form.endDate || null,
      notice_period_days: form.noticePeriodDays ? Number(form.noticePeriodDays) : null,
      confirmed_at: new Date().toISOString(),
    })
    if (error) {
      setSaving(false)
      setFailed(true)
      return
    }
    if (form.documentId) {
      await supabase.from('documents').update({ status: 'confirmed' }).eq('id', form.documentId)
    }
    navigate('/')
  }

  if (atLimit === null) return <p className="text-ink-500">{t.loading}</p>
  if (atLimit) return <LimitNotice />

  return (
    <section>
      <h1 className="text-2xl font-bold text-ink-950">{t.form.title}</h1>
      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className={`${labelClass} sm:col-span-2`}>
          {t.form.document}
          <select value={form.documentId} onChange={(e) => update('documentId', e.target.value)} className={inputClass}>
            <option value="">{t.form.noDocument}</option>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>{doc.original_name ?? doc.id}</option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          {t.form.provider}
          <input required value={form.providerName} onChange={(e) => update('providerName', e.target.value)} className={inputClass} />
        </label>

        <label className={labelClass}>
          {t.form.category}
          <select value={form.category} onChange={(e) => update('category', e.target.value as ContractCategory)} className={inputClass}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{t.categories[c]}</option>)}
          </select>
        </label>

        <label className={labelClass}>
          {t.form.price}
          <input
            inputMode="decimal"
            pattern="\d+([.,]\d{1,2})?"
            value={form.priceAmount}
            onChange={(e) => update('priceAmount', e.target.value)}
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          {t.form.pricePeriod}
          <select value={form.pricePeriod} onChange={(e) => update('pricePeriod', e.target.value as PricePeriod)} className={inputClass}>
            {PRICE_PERIODS.map((p) => <option key={p} value={p}>{t.pricePeriods[p]}</option>)}
          </select>
        </label>

        <label className={labelClass}>
          {t.form.termType}
          <select value={form.termType} onChange={(e) => update('termType', e.target.value as TermType)} className={inputClass}>
            {TERM_TYPES.map((tt) => <option key={tt} value={tt}>{t.termTypes[tt]}</option>)}
          </select>
        </label>

        <label className={labelClass}>
          {t.form.endDate}
          <input
            type="date"
            required={endDateRequired}
            value={form.endDate}
            onChange={(e) => update('endDate', e.target.value)}
            className={inputClass}
          />
          {form.termType === 'auto_renewing' && (
            <span className="mt-1 block text-xs font-normal text-ink-500">{t.form.endDateHint}</span>
          )}
        </label>

        <label className={labelClass}>
          {t.form.noticePeriod}
          <input
            type="number"
            min={0}
            step={1}
            value={form.noticePeriodDays}
            onChange={(e) => update('noticePeriodDays', e.target.value)}
            className={inputClass}
          />
        </label>

        <div className="sm:col-span-2">
          {failed && <p role="alert" className="mb-3 text-sm text-red-700">{t.form.error}</p>}
          <button type="submit" disabled={saving} className={buttonClass}>
            {saving ? t.form.saving : t.form.save}
          </button>
        </div>
      </form>
    </section>
  )
}
