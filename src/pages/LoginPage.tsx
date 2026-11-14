import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router'
import { useAuth } from '../auth/context'
import { LanguageSwitch } from '../components/LanguageSwitch'
import { buttonClass, inputClass, labelClass } from '../components/ui'
import { useLanguage } from '../i18n/useLanguage'
import { supabase } from '../lib/supabase'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export function LoginPage() {
  const { session } = useAuth()
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  if (session) return <Navigate to="/" replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setStatus('sending')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    setStatus(error ? 'error' : 'sent')
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <div className="mb-8 flex justify-end">
        <LanguageSwitch />
      </div>
      <h1 className="text-2xl font-bold text-ink-950">{t.login.title}</h1>
      <p className="mt-2 text-sm text-ink-500">{t.login.intro}</p>

      {status === 'sent' ? (
        <p role="status" className="mt-6 rounded-lg bg-tint p-4 text-sm text-ink-700">{t.login.sent(email.trim())}</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className={labelClass}>
            {t.login.email}
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </label>
          {status === 'error' && <p role="alert" className="text-sm text-red-700">{t.login.error}</p>}
          <button type="submit" disabled={status === 'sending'} className={`${buttonClass} w-full`}>
            {status === 'sending' ? t.login.sending : t.login.submit}
          </button>
        </form>
      )}
    </main>
  )
}
