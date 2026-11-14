import { Navigate, Outlet } from 'react-router'
import { useLanguage } from '../i18n/useLanguage'
import { useAuth } from './context'

/** Renders child routes only for signed-in users; everyone else goes to /login. */
export function RequireAuth() {
  const { session } = useAuth()
  const { t } = useLanguage()
  if (session === undefined) return <p className="p-6 text-ink-500">{t.loading}</p>
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}
