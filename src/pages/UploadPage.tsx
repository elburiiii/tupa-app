import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../auth/context'
import { LimitNotice } from '../components/LimitNotice'
import { buttonClass, inputClass, labelClass, linkClass } from '../components/ui'
import { useLanguage } from '../i18n/useLanguage'
import { MAX_UPLOAD_BYTES } from '../lib/config'
import { isAtContractLimit } from '../lib/contracts'
import { ACCEPT_ATTRIBUTE, allowedMimeType, sha256Hex } from '../lib/files'
import { STORAGE_BUCKET, supabase } from '../lib/supabase'

type UploadError = 'errorType' | 'errorSize' | 'errorFailed'

const UNIQUE_VIOLATION = '23505'

export function UploadPage() {
  const { session } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [atLimit, setAtLimit] = useState<boolean | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<UploadError | null>(null)
  const [duplicateId, setDuplicateId] = useState<string | null>(null)

  useEffect(() => {
    isAtContractLimit().then(setAtLimit, () => setAtLimit(false))
  }, [])

  async function findDocumentByHash(sha256: string): Promise<string | null> {
    const { data } = await supabase.from('documents').select('id').eq('sha256', sha256).maybeSingle()
    return data?.id ?? null
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!file || !session) return
    setError(null)
    setDuplicateId(null)

    const mimeType = allowedMimeType(file)
    if (!mimeType) return setError('errorType')
    if (file.size > MAX_UPLOAD_BYTES) return setError('errorSize')

    setBusy(true)
    try {
      const sha256 = await sha256Hex(file)
      const existingId = await findDocumentByHash(sha256)
      if (existingId) return setDuplicateId(existingId)

      const documentId = crypto.randomUUID()
      const storagePath = `${session.user.id}/${documentId}`

      const upload = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, file, { contentType: mimeType, upsert: false })
      if (upload.error) return setError('errorFailed')

      const insert = await supabase.from('documents').insert({
        id: documentId,
        user_id: session.user.id,
        storage_path: storagePath,
        original_name: file.name,
        mime_type: mimeType,
        size_bytes: file.size,
        sha256,
        source: 'upload',
      })
      if (insert.error) {
        // Don't leave an orphaned file behind.
        await supabase.storage.from(STORAGE_BUCKET).remove([storagePath])
        if (insert.error.code === UNIQUE_VIOLATION) {
          const id = await findDocumentByHash(sha256)
          if (id) return setDuplicateId(id)
        }
        return setError('errorFailed')
      }

      navigate(`/contracts/new?document=${documentId}`)
    } catch {
      setError('errorFailed')
    } finally {
      setBusy(false)
    }
  }

  if (atLimit === null) return <p className="text-ink-500">{t.loading}</p>

  return (
    <section className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-ink-950">{t.upload.title}</h1>
      <p className="mt-2 text-sm text-ink-500">{t.upload.intro}</p>

      {atLimit ? (
        <div className="mt-6"><LimitNotice /></div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className={labelClass}>
            {t.upload.file}
            <input
              type="file"
              required
              accept={ACCEPT_ATTRIBUTE}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className={inputClass}
            />
          </label>
          <p className="text-xs text-ink-500">{t.upload.hint}</p>

          {error && <p role="alert" className="text-sm text-red-700">{t.upload[error]}</p>}
          {duplicateId && (
            <p role="alert" className="text-sm text-ink-700">
              {t.upload.duplicate}{' '}
              <Link to={`/contracts/new?document=${duplicateId}`} className={linkClass}>{t.upload.useExisting}</Link>
            </p>
          )}

          <button type="submit" disabled={busy || !file} className={buttonClass}>
            {busy ? t.upload.uploading : t.upload.submit}
          </button>
        </form>
      )}

      {!atLimit && (
        <p className="mt-8 text-sm text-ink-500">
          {t.upload.noDocument}{' '}
          <Link to="/contracts/new" className={linkClass}>{t.upload.addManually}</Link>
        </p>
      )}
    </section>
  )
}
