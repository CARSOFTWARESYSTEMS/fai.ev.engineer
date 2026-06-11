import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { firestore } from '../firebase/firestore'

export type BetaNoticeSeverity = 'info' | 'warning' | 'error'

export interface BetaNoticeConfig {
  enabled: boolean
  title: string
  message: string
  severity: BetaNoticeSeverity
  dismissible: boolean
}

export const BETA_NOTICE_DEFAULTS: BetaNoticeConfig = {
  enabled: true,
  title: 'BETA TESTING NOTICE',
  message:
    'This software is currently under beta testing. Please verify and export/download ' +
    'your reports immediately after review. The software may be optimized and test data ' +
    'may be cleaned regularly during beta.',
  severity: 'error',
  dismissible: true,
}

const VALID_SEVERITIES: BetaNoticeSeverity[] = ['info', 'warning', 'error']

function parseConfig(d: Record<string, unknown>): BetaNoticeConfig {
  return {
    enabled:     typeof d.enabled === 'boolean'            ? d.enabled     : BETA_NOTICE_DEFAULTS.enabled,
    title:       typeof d.title === 'string'               ? d.title       : BETA_NOTICE_DEFAULTS.title,
    message:     typeof d.message === 'string'             ? d.message     : BETA_NOTICE_DEFAULTS.message,
    severity:    VALID_SEVERITIES.includes(d.severity as BetaNoticeSeverity)
                   ? (d.severity as BetaNoticeSeverity)
                   : BETA_NOTICE_DEFAULTS.severity,
    dismissible: typeof d.dismissible === 'boolean'        ? d.dismissible : BETA_NOTICE_DEFAULTS.dismissible,
  }
}

// Firestore console: Collection "appConfig" → Document "betaBanner"
// Fields: enabled, title, message, severity, dismissible, updatedAt
export function subscribeToBetaNotice(
  callback: (config: BetaNoticeConfig) => void,
): () => void {
  const ref = doc(firestore, 'appConfig', 'betaBanner')
  return onSnapshot(
    ref,
    snapshot => callback(snapshot.exists() ? parseConfig(snapshot.data()) : BETA_NOTICE_DEFAULTS),
    () => callback(BETA_NOTICE_DEFAULTS),
  )
}

export async function getBetaNotice(): Promise<BetaNoticeConfig> {
  const ref  = doc(firestore, 'appConfig', 'betaBanner')
  const snap = await getDoc(ref)
  return snap.exists() ? parseConfig(snap.data()) : BETA_NOTICE_DEFAULTS
}

export async function saveBetaNotice(config: BetaNoticeConfig): Promise<void> {
  const ref = doc(firestore, 'appConfig', 'betaBanner')
  await setDoc(ref, { ...config, updatedAt: serverTimestamp() })
}
