import { NavLink, Outlet } from 'react-router'
import { useLanguage } from '../i18n/useLanguage'
import { cn } from '../lib/cn'
import { supabase } from '../lib/supabase'
import { LanguageSwitch } from './LanguageSwitch'

function navClass({ isActive }: { isActive: boolean }) {
  return cn('text-sm font-medium', isActive ? 'text-ink-950' : 'text-ink-500 hover:text-ink-950')
}

/** Header + page container for signed-in pages. */
export function Layout() {
  const { t } = useLanguage()
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
          <span className="font-bold text-primary">{t.appName}</span>
          <nav aria-label={t.nav.main} className="flex gap-4">
            <NavLink to="/" end className={navClass}>{t.nav.contracts}</NavLink>
            <NavLink to="/upload" className={navClass}>{t.nav.upload}</NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <LanguageSwitch />
            <button type="button" onClick={() => supabase.auth.signOut()} className="text-sm text-ink-500 hover:text-ink-950">
              {t.nav.signOut}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
