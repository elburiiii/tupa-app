import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '../auth/context'
import { DocumentPreview } from '../components/DocumentPreview'
import { LimitNotice } from '../components/LimitNotice'
import { buttonClass, inputClass, labelClass } from '../components/ui'
import { useLanguage } from '../i18n/useLanguage'
import { isAtContractLimit } from '../lib/contracts'
import { supabase } from '../lib/supabase'
import {
  CATEGORIES, PRICE_PERIODS, PRICE_TYPES, TERM_TYPES,
  type ContractCategory, type DocumentRow, type PricePeriod, type PriceType, type TermType,
} from '../lib/types'

type DocumentOption = Pick<DocumentRow, 'id' | 'original_name' | 'storage_path' | 'mime_type'>

interface FormState {
  documentId: string
  providerName: string
  category: ContractCategory
  priceType: PriceType
  priceAmount: string
  pricePeriod: PricePeriod
  spotMargin: string
  termType: TermType
  endDate: string
  noticePeriodDays: string
}

const DECIMAL_PATTERN = '\\d+([.,]\\d{1,3})?'

/** "3,90" → 3.9; empty → null. */
function parseDecimal(value: string): number | null {
  return value.trim() ? Number(value.trim().replace(',', '.')) : null
}

/** Manual contract entry. notice_deadline is computed by the database on save. */
export function NewContractPage() {
  const { session } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [documents, setDocuments] = useState<DocumentOption[]>([])
  const [atLimit, setAtLimit] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const [form, setForm] = useState<FormState>({
    documentId: params.get('document') ?? '',
    providerName: '',
    category: 'electricity',
    priceType: 'fixed',
    priceAmount: '',
    pricePeriod: 'month',
    spotMargin: '',
    termType: 'fixed_term',
    endDate: '',
    noticePeriodDays: '',
  })

  useEffect(() => {
    isAtContractLimit().then(setAtLimit, () => setAtLimit(false))
    supabase
      .from('documents')
      .select('id, original_name, storage_path, mime_type')
      .order('created_at', { ascending: false })
      .then(({ data }) => setDocuments(data ?? []))
  }, [])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      // Spot pricing only exists for electricity.
      if (next.category !== 'electricity' && next.priceType === 'spot') next.priceType = 'fixed'
      return next
    })
  }

  const isSpot = form.priceType === 'spot'
  const selectedDocument = documents.find((doc) => doc.id === form.documentId)
  const priceTypes = PRICE_TYPES.filter((type) => type !== 'spot' || form.category === 'electricity')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!session) return
    setSaving(true)
    setFailed(false)

    const priceAmount = parseDecimal(form.priceAmount)
    const { error } = await supabase.from('contracts').insert({
      user_id: session.user.id,
      document_id: form.documentId || null,
      provider_name: form.providerName.trim(),
      category: form.category,
      price_type: form.priceType,
      spot_margin_cents_kwh: isSpot ? parseDecimal(form.spotMargin) : null,
      price_amount: priceAmount,
      price_period: priceAmount == null ? null : isSpot ? 'month' : form.pricePeriod,
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
  if (atLimit) return <div className="mx-auto max-w-3xl"><LimitNotice /></div>

  const formElement = (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
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

      <label className={`${labelClass} sm:col-span-2`}>
        {t.form.priceType}
        <select value={form.priceType} onChange={(e) => update('priceType', e.target.value as PriceType)} className={inputClass}>
          {priceTypes.map((p) => <option key={p} value={p}>{t.priceTypes[p]}</option>)}
        </select>
        {isSpot && <span className="mt-1 block text-xs font-normal text-ink-500">{t.form.spotHint}</span>}
      </label>

      {isSpot ? (
        <>
          <label className={labelClass}>
            {t.form.spotMargin}
            <input
              required
              inputMode="decimal"
              pattern={DECIMAL_PATTERN}
              value={form.spotMargin}
              onChange={(e) => update('spotMargin', e.target.value)}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            {t.form.monthlyFee}
            <input
              inputMode="decimal"
              pattern={DECIMAL_PATTERN}
              value={form.priceAmount}
              onChange={(e) => update('priceAmount', e.target.value)}
              className={inputClass}
            />
          </label>
        </>
      ) : (
        <>
          <label className={labelClass}>
            {t.form.price}
            <input
              inputMode="decimal"
              pattern={DECIMAL_PATTERN}
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
        </>
      )}

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
          required={form.termType !== 'open_ended'}
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
  )

  return (
    <section className={selectedDocument ? '' : 'mx-auto max-w-3xl'}>
      <h1 className="mb-6 text-2xl font-bold text-ink-950">{t.form.title}</h1>
      {selectedDocument ? (
        // Document on the left, form on the right (stacked on small screens).
        <div className="grid items-start gap-8 lg:grid-cols-2">
          <div className="lg:sticky lg:top-4">
            <DocumentPreview storagePath={selectedDocument.storage_path} mimeType={selectedDocument.mime_type} />
          </div>
          {formElement}
        </div>
      ) : (
        formElement
      )}
    </section>
  )
}
