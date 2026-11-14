/** Allowed upload types. HEIC often arrives with an empty file.type, so fall back to the extension. */
const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
  heif: 'image/heif',
}

export const ACCEPT_ATTRIBUTE = '.pdf,.jpg,.jpeg,.png,.heic,.heif,application/pdf,image/jpeg,image/png,image/heic,image/heif'

/** Returns the normalised MIME type, or null when the file type is not allowed. */
export function allowedMimeType(file: File): string | null {
  const allowed = Object.values(MIME_BY_EXTENSION)
  if (allowed.includes(file.type)) return file.type
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  return MIME_BY_EXTENSION[extension] ?? null
}

/** Hex-encoded SHA-256 of the file contents. */
export async function sha256Hex(file: File): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}
