import type { ContractRow } from './types'

/**
 * The date the user must act by: the notice deadline when there is one,
 * otherwise the end of a fixed term. Open-ended contracts have none.
 * (notice_deadline itself is computed in the database.)
 */
export function nextDeadline(contract: ContractRow): string | null {
  if (contract.notice_deadline) return contract.notice_deadline
  if (contract.term_type === 'fixed_term') return contract.end_date
  return null
}

/** Sorts by next deadline, earliest first; contracts without one go last. */
export function byNextDeadline(a: ContractRow, b: ContractRow): number {
  const da = nextDeadline(a)
  const db = nextDeadline(b)
  if (da === db) return a.provider_name.localeCompare(b.provider_name)
  if (!da) return 1
  if (!db) return -1
  return da < db ? -1 : 1
}

/** Today as YYYY-MM-DD in the user's local time zone. */
export function todayIso(): string {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}
