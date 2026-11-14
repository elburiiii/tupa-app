/** Row types matching supabase/migrations. Keep in sync with the schema. */

export const CATEGORIES = [
  'electricity', 'telecom', 'internet', 'insurance', 'gym',
  'streaming', 'rent', 'loan', 'subscription', 'other',
] as const
export type ContractCategory = (typeof CATEGORIES)[number]

export const TERM_TYPES = ['fixed_term', 'open_ended', 'auto_renewing'] as const
export type TermType = (typeof TERM_TYPES)[number]

export const PRICE_PERIODS = ['month', 'year', 'one_off'] as const
export type PricePeriod = (typeof PRICE_PERIODS)[number]

export const PRICE_TYPES = ['fixed', 'spot', 'variable'] as const
export type PriceType = (typeof PRICE_TYPES)[number]

export interface DocumentRow {
  id: string
  user_id: string
  storage_path: string
  original_name: string | null
  mime_type: string
  size_bytes: number
  sha256: string
  source: 'upload' | 'email'
  status: 'uploaded' | 'extracting' | 'needs_review' | 'confirmed' | 'failed'
  created_at: string
}

export interface ContractRow {
  id: string
  user_id: string
  document_id: string | null
  provider_name: string
  category: ContractCategory
  price_type: PriceType
  /** Spot-price margin in c/kWh; only for price_type 'spot'. */
  spot_margin_cents_kwh: number | null
  /** For 'spot': the monthly fee. */
  price_amount: number | null
  price_period: PricePeriod | null
  term_type: TermType
  end_date: string | null
  notice_period_days: number | null
  notice_deadline: string | null
  status: 'active' | 'cancelled' | 'archived'
  created_at: string
}
