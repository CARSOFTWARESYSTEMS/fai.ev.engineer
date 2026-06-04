/** Reads ?pk= from the current URL. Defaults to "fai" if not present or empty. */
export function readProductKey(): string {
  const params = new URLSearchParams(window.location.search)
  const pk = params.get('pk')?.trim().toLowerCase()
  return pk || 'fai'
}
