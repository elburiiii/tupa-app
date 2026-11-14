import { FREE_CONTRACT_LIMIT } from './config'
import { supabase } from './supabase'

/** True when the user already has the free tier's maximum number of active contracts. */
export async function isAtContractLimit(): Promise<boolean> {
  const { count, error } = await supabase
    .from('contracts')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
  if (error) throw error
  return (count ?? 0) >= FREE_CONTRACT_LIMIT
}
