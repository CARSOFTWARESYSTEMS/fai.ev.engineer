// Bootstrap developer emails — these accounts always have Developer Settings access,
// regardless of whether a developerConfig Firestore record exists.
// Firestore rules also reference these emails via request.auth.token.email.
export const BOOTSTRAP_DEVELOPER_EMAILS: readonly string[] = [
  'sudarshana.karkala@gmail.com',
  'sudhan.infotech@gmail.com',
  'carsoftwaresystems@gmail.com',
]

export function isBootstrapDeveloper(email: string | null | undefined): boolean {
  if (!email) return false
  return (BOOTSTRAP_DEVELOPER_EMAILS as string[]).includes(email.toLowerCase())
}
