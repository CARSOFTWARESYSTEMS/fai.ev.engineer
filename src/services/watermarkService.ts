import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { firestore } from '../firebase/firestore'

export type WatermarkVariant = 'light' | 'dark' | 'auto'

export interface WatermarkConfig {
  enabled:   boolean
  text:      string
  opacity:   number           // 0.00 – 0.20
  variant:   WatermarkVariant
  updatedAt?: unknown
  updatedBy?: string
}

export const WATERMARK_DEFAULTS: WatermarkConfig = {
  enabled: true,
  text:    'FAI AS9102 BETA TESTING',
  opacity: 0.04,
  variant: 'light',
}

const VALID_VARIANTS: WatermarkVariant[] = ['light', 'dark', 'auto']

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

function parseConfig(d: Record<string, unknown>): WatermarkConfig {
  const text = typeof d.text === 'string' ? d.text.trim().slice(0, 50) : ''
  return {
    enabled: typeof d.enabled === 'boolean'
               ? d.enabled
               : WATERMARK_DEFAULTS.enabled,
    text:    text.length > 0 ? text : WATERMARK_DEFAULTS.text,
    opacity: typeof d.opacity === 'number'
               ? clamp(d.opacity, 0, 0.20)
               : WATERMARK_DEFAULTS.opacity,
    variant: VALID_VARIANTS.includes(d.variant as WatermarkVariant)
               ? (d.variant as WatermarkVariant)
               : WATERMARK_DEFAULTS.variant,
  }
}

// Firestore: appConfig/watermark
export function subscribeToWatermark(
  callback: (config: WatermarkConfig) => void,
): () => void {
  const ref = doc(firestore, 'appConfig', 'watermark')
  return onSnapshot(
    ref,
    snap => callback(snap.exists() ? parseConfig(snap.data()) : WATERMARK_DEFAULTS),
    ()   => callback(WATERMARK_DEFAULTS),
  )
}

export async function getWatermark(): Promise<WatermarkConfig> {
  const ref  = doc(firestore, 'appConfig', 'watermark')
  const snap = await getDoc(ref)
  return snap.exists() ? parseConfig(snap.data()) : WATERMARK_DEFAULTS
}

export async function saveWatermark(config: WatermarkConfig, updatedBy: string): Promise<void> {
  const ref = doc(firestore, 'appConfig', 'watermark')
  await setDoc(ref, {
    enabled:   config.enabled,
    text:      config.text.trim().slice(0, 50) || WATERMARK_DEFAULTS.text,
    opacity:   clamp(config.opacity, 0, 0.20),
    variant:   VALID_VARIANTS.includes(config.variant) ? config.variant : 'light',
    updatedAt: serverTimestamp(),
    updatedBy,
  })
}

export async function resetWatermarkToDefault(updatedBy: string): Promise<void> {
  await saveWatermark(WATERMARK_DEFAULTS, updatedBy)
}
