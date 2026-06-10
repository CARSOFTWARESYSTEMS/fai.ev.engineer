// ─── GIS Type Declarations ─────────────────────────────────────────────────────

interface TokenResponse {
  access_token: string
  error?: string
  error_description?: string
}

interface TokenClient {
  requestAccessToken(opts?: { prompt?: DriveTokenPrompt; login_hint?: string }): void
}

type DriveTokenPrompt = '' | 'none' | 'consent' | 'select_account'

interface DriveTokenRequestOptions {
  prompt?: DriveTokenPrompt
  timeoutMs?: number
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string
            scope: string
            callback: (response: TokenResponse) => void
            error_callback?: (error: unknown) => void
          }): TokenClient
        }
      }
    }
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DRIVE_SCOPE       = 'https://www.googleapis.com/auth/drive.file'
const CLIENT_ID         = import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID as string
const ROOT_FOLDER_NAME  = 'FAI.EV.ENGINEER'
const FOLDER_MIME       = 'application/vnd.google-apps.folder'
const DRIVE_FILES_URL   = 'https://www.googleapis.com/drive/v3/files'
const DRIVE_UPLOAD_URL  = 'https://www.googleapis.com/upload/drive/v3/files'

// ─── In-memory token cache (55-min TTL) ──────────────────────────────────────
// Tokens expire after 60 min; we treat them as stale at 55 min to be safe.
// One upload per session means one popup, not one per upload.

interface CachedToken {
  token: string
  expiresAt: number
  email: string  // Google account this token belongs to
}
let _tokenCache: CachedToken | null = null

function getValidCachedToken(forEmail?: string): string | null {
  if (!_tokenCache) return null
  if (Date.now() >= _tokenCache.expiresAt) { _tokenCache = null; return null }
  // Reject cached token if it belongs to a different user
  if (forEmail && _tokenCache.email && _tokenCache.email !== forEmail) {
    console.log('[DRIVE] Cached Drive token email mismatch, requesting new token')
    clearGoogleDriveSession()
    return null
  }
  return _tokenCache.token
}

// ─── In-memory folder ID cache ────────────────────────────────────────────────
// Avoids repeated Drive API calls within the same browser session.
// Keys: 'fai:root' | 'fai:user:{uid}' | 'fai:project:{projectId}'

const _folderCache: Record<string, string> = {}

// ─── Clear entire Drive session ───────────────────────────────────────────────
// Must be called on sign-out and on any Firebase auth user change.

export function clearGoogleDriveSession(): void {
  console.log('[DRIVE] Clearing Drive session')
  _tokenCache = null
  Object.keys(_folderCache).forEach((k) => delete _folderCache[k])
  console.log('[DRIVE] Token cache cleared')
}

// ─── Load GIS script (once) ───────────────────────────────────────────────────

let _gisPromise: Promise<void> | null = null

export function loadGisScript(): Promise<void> {
  if (_gisPromise) return _gisPromise
  _gisPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) { resolve(); return }
    const script = document.createElement('script')
    const timeoutId = window.setTimeout(() => {
      script.remove()
      _gisPromise = null
      reject(new Error('Google Identity Services loading timed out.'))
    }, 10_000)
    script.src   = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      window.clearTimeout(timeoutId)
      resolve()
    }
    script.onerror = () => {
      window.clearTimeout(timeoutId)
      _gisPromise = null
      reject(new Error('Failed to load Google Identity Services.'))
    }
    document.head.appendChild(script)
  })
  return _gisPromise
}

// ─── Request Drive access token ───────────────────────────────────────────────
// loginHint: pass the Firebase user's email so GIS uses the SAME Google account
// as the Firebase login — skips the account picker silently when already signed in.
//
// Token is cached in memory (55 min) so the popup appears at most ONCE per session,
// not once per upload.

export async function requestDriveToken(
  loginHint?: string,
  options: DriveTokenRequestOptions = {},
): Promise<string> {
  if (!CLIENT_ID || CLIENT_ID === 'your_google_oauth_client_id') {
    throw new Error('VITE_GOOGLE_DRIVE_CLIENT_ID is not configured. Set it in .env.local.')
  }

  const cached = options.prompt ? null : getValidCachedToken(loginHint)
  if (cached) return cached

  await loadGisScript()

  return new Promise<string>((resolve, reject) => {
    let settled = false
    const timeoutMs = options.timeoutMs ?? 15_000
    const finish = (callback: () => void) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeoutId)
      callback()
    }
    const timeoutId = window.setTimeout(() => {
      finish(() => reject(new Error('Google Drive authorization timed out. Reconnect Google Drive.')))
    }, timeoutMs)

    const tokenClient = window.google!.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope:     DRIVE_SCOPE,
      callback:  (response) => {
        if (response.error) {
          finish(() => reject(new Error(response.error_description ?? response.error)))
        } else if (!response.access_token) {
          finish(() => reject(new Error('Google Drive authorization returned no access token.')))
        } else {
          finish(() => {
            _tokenCache = { token: response.access_token, expiresAt: Date.now() + 55 * 60 * 1000, email: loginHint ?? '' }
            resolve(response.access_token)
          })
        }
      },
      error_callback: (error) => {
        const message = (error as { message?: string; type?: string })?.message
          ?? (error as { type?: string })?.type
          ?? 'Google Drive authorization failed.'
        finish(() => reject(new Error(message)))
      },
    })
    // login_hint: force same Google account as Firebase login (skips account picker)
    // prompt: '' attempts the previously granted account without forcing consent.
    tokenClient.requestAccessToken({
      prompt: options.prompt ?? '',
      login_hint: loginHint,
    })
  })
}

// ─── Internal: find folder by name inside a parent ───────────────────────────

async function findFolder(
  accessToken: string,
  name: string,
  parentId: string
): Promise<string | null> {
  const params = new URLSearchParams({
    q:         `name='${name}' and mimeType='${FOLDER_MIME}' and '${parentId}' in parents and trashed=false`,
    fields:    'files(id)',
    pageSize:  '1',
    spaces:    'drive',
  })
  const res = await fetch(`${DRIVE_FILES_URL}?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Drive search failed (${res.status})`)
  const { files } = await res.json()
  return files?.[0]?.id ?? null
}

// ─── Internal: create a folder inside a parent ───────────────────────────────

async function createFolder(
  accessToken: string,
  name: string,
  parentId: string
): Promise<string> {
  const res = await fetch(DRIVE_FILES_URL, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, mimeType: FOLDER_MIME, parents: [parentId] }),
  })
  if (!res.ok) throw new Error(`Drive folder create failed (${res.status})`)
  const { id } = await res.json()
  return id as string
}

// ─── Internal: get or create (with cache) ────────────────────────────────────

async function getOrCreateFolder(
  accessToken: string,
  name: string,
  parentId: string,
  cacheKey: string
): Promise<string> {
  if (_folderCache[cacheKey]) return _folderCache[cacheKey]
  const existing = await findFolder(accessToken, name, parentId)
  const id = existing ?? await createFolder(accessToken, name, parentId)
  _folderCache[cacheKey] = id
  return id
}

// ─── Public: ensure FAI.EV.ENGINEER/{uid}/{projectId} folder chain ────────────

export async function ensureProjectFolders(
  accessToken: string,
  uid: string,
  projectId: string
): Promise<{ rootFolderId: string; userFolderId: string; projectFolderId: string }> {
  console.log('[DRIVE] Root Folder — ensuring:', ROOT_FOLDER_NAME)
  const rootFolderId = await getOrCreateFolder(
    accessToken, ROOT_FOLDER_NAME, 'root', 'fai:root'
  )
  console.log('[DRIVE] Root Folder ID:', rootFolderId)

  console.log('[DRIVE] User Folder — ensuring:', uid)
  const userFolderId = await getOrCreateFolder(
    accessToken, uid, rootFolderId, `fai:user:${uid}`
  )
  console.log('[DRIVE] User Folder ID:', userFolderId)

  console.log('[DRIVE] Project Folder — ensuring:', projectId)
  const projectFolderId = await getOrCreateFolder(
    accessToken, projectId, userFolderId, `fai:project:${projectId}`
  )
  console.log('[DRIVE] Project Folder ID:', projectFolderId)

  return { rootFolderId, userFolderId, projectFolderId }
}

// ─── Upload file into a specific Drive folder ─────────────────────────────────

export async function uploadFileToDrive(
  accessToken: string,
  folderId: string,
  file: File
): Promise<{ fileId: string; viewUrl: string }> {
  console.log('[DRIVE] Upload Started:', file.name, '→ folder:', folderId)

  const form = new FormData()
  form.append(
    'metadata',
    new Blob(
      [JSON.stringify({ name: file.name, mimeType: 'application/pdf', parents: [folderId] })],
      { type: 'application/json' }
    )
  )
  form.append('file', file)

  const res = await fetch(
    `${DRIVE_UPLOAD_URL}?uploadType=multipart&fields=id,webViewLink`,
    {
      method:  'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body:    form,
    }
  )

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Drive upload failed (${res.status}): ${body}`)
  }

  const data = await res.json()
  console.log('[DRIVE] Upload Success:', data.id)
  return { fileId: data.id as string, viewUrl: data.webViewLink as string ?? '' }
}

// ─── Delete a single file from Drive ─────────────────────────────────────────

export async function deleteFileFromDrive(
  accessToken: string,
  fileId: string
): Promise<void> {
  const res = await fetch(`${DRIVE_FILES_URL}/${fileId}`, {
    method:  'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  // 404 = already gone; treat as success
  if (!res.ok && res.status !== 404) {
    throw new Error(`Drive file delete failed (${res.status})`)
  }
  console.log('[DRIVE] Delete Success — file:', fileId)
}

// ─── Delete all files inside a project folder, then the folder itself ─────────

export async function deleteProjectFolderFromDrive(
  accessToken: string,
  projectFolderId: string
): Promise<void> {
  console.log('[DRIVE] Project Folder — deleting contents:', projectFolderId)

  // List files in the project folder
  const params = new URLSearchParams({
    q:      `'${projectFolderId}' in parents and trashed=false`,
    fields: 'files(id,name)',
  })
  const listRes = await fetch(`${DRIVE_FILES_URL}?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (listRes.ok) {
    const { files } = await listRes.json()
    for (const f of (files ?? []) as { id: string; name: string }[]) {
      console.log('[DRIVE] Delete Success — removing file:', f.name)
      await deleteFileFromDrive(accessToken, f.id)
    }
  }

  // Delete the folder itself
  await deleteFileFromDrive(accessToken, projectFolderId)
  console.log('[DRIVE] Project Folder — deleted:', projectFolderId)

  // Clear from cache
  for (const key of Object.keys(_folderCache)) {
    if (_folderCache[key] === projectFolderId) {
      delete _folderCache[key]
    }
  }
}

// ─── Preview URL ──────────────────────────────────────────────────────────────

export function getDrivePreviewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`
}
