import { useEffect, useState } from 'react'
import { useLanguage } from '../i18n/useLanguage'
import { STORAGE_BUCKET, supabase } from '../lib/supabase'
import { linkClass } from './ui'

/** Signed URLs are short-lived; the preview loads the file once. */
const SIGNED_URL_TTL_SECONDS = 60

interface Props {
  storagePath: string
  mimeType: string
}

async function signedUrl(storagePath: string): Promise<string | null> {
  const { data } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS)
  return data?.signedUrl ?? null
}

/** Opens the file in a new tab with a fresh signed URL (the preview's URL may have expired). */
async function openInNewTab(storagePath: string) {
  const tab = window.open('', '_blank') // open synchronously so the popup isn't blocked
  const url = await signedUrl(storagePath)
  if (tab && url) tab.location.href = url
  else tab?.close()
}

/** Shows an uploaded document next to the form: PDFs in a frame, images inline. */
export function DocumentPreview({ storagePath, mimeType }: Props) {
  const { t } = useLanguage()
  // Remember which file the URL belongs to, so switching documents shows "loading" again.
  const [loaded, setLoaded] = useState<{ path: string; url: string | null } | null>(null)
  const url = loaded?.path === storagePath ? loaded.url : null

  useEffect(() => {
    let cancelled = false
    signedUrl(storagePath).then((next) => {
      if (!cancelled) setLoaded({ path: storagePath, url: next })
    })
    return () => {
      cancelled = true
    }
  }, [storagePath])

  if (loaded?.path !== storagePath) return <p className="text-sm text-ink-500">{t.loading}</p>
  if (!url) return <p className="text-sm text-ink-500">{t.form.noPreview}</p>

  // Most browsers other than Safari can't display HEIC.
  const canShowImage = mimeType === 'image/jpeg' || mimeType === 'image/png'

  return (
    <div className="space-y-2">
      {mimeType === 'application/pdf' ? (
        <iframe src={url} title={t.form.document} className="h-[75vh] w-full rounded-lg border border-line bg-surface" />
      ) : canShowImage ? (
        <img src={url} alt={t.form.document} className="w-full rounded-lg border border-line" />
      ) : (
        <p className="text-sm text-ink-500">{t.form.noPreview}</p>
      )}
      <button type="button" onClick={() => openInNewTab(storagePath)} className={`${linkClass} text-sm`}>
        {t.form.openDocument}
      </button>
    </div>
  )
}
