import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  setDoc,
  onSnapshot,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { firestore } from '../firebase/firestore'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface BrandingPreset {
  brandingId:               string
  businessName:             string
  businessCode:             string
  logoUrl?:                 string
  website?:                 string
  supportEmail?:            string
  supportPhone?:            string
  whatsappNumber?:          string
  technicalSupportNumber?:  string
  poweredByText:            string
  poweredByUrl:             string
  domains:                  string[]
  enabled:                  boolean
  createdAt:                Timestamp | null
  updatedAt:                Timestamp | null
  createdBy:                string
}

export interface ActiveBrandingConfig {
  activeBrandingId: string | null
  updatedAt:        Timestamp | null
  updatedBy:        string
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_BRANDING: Omit<BrandingPreset, 'brandingId' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
  businessName:  'iTelematics Software Private Limited',
  businessCode:  'itelematics',
  poweredByText: 'powered by EV.ENGINEER',
  poweredByUrl:  'https://ev.engineer',
  domains:       [],
  enabled:       true,
}

// ─── Branding presets CRUD ─────────────────────────────────────────────────────

export async function listBrandingPresets(): Promise<BrandingPreset[]> {
  const snap = await getDocs(collection(firestore, 'brandings'))
  return snap.docs.map(d => ({ brandingId: d.id, ...(d.data() as Omit<BrandingPreset, 'brandingId'>) }))
}

export function subscribeToBrandingPresets(
  callback: (presets: BrandingPreset[]) => void,
): () => void {
  return onSnapshot(
    collection(firestore, 'brandings'),
    snap => callback(
      snap.docs.map(d => ({ brandingId: d.id, ...(d.data() as Omit<BrandingPreset, 'brandingId'>) }))
    ),
    () => callback([]),
  )
}

export async function createBrandingPreset(
  data: Omit<BrandingPreset, 'brandingId' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const ref = await addDoc(collection(firestore, 'brandings'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateBrandingPreset(
  brandingId: string,
  data: Partial<Omit<BrandingPreset, 'brandingId' | 'createdAt' | 'createdBy'>>,
): Promise<void> {
  const ref = doc(firestore, 'brandings', brandingId)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

export async function deleteBrandingPreset(brandingId: string): Promise<void> {
  await deleteDoc(doc(firestore, 'brandings', brandingId))
}

// ─── Active branding (appConfig/activeBranding) ────────────────────────────────

export async function setActiveBranding(brandingId: string | null, updatedBy: string): Promise<void> {
  const ref = doc(firestore, 'appConfig', 'activeBranding')
  await setDoc(ref, { activeBrandingId: brandingId, updatedAt: serverTimestamp(), updatedBy })
}

// Subscribes to appConfig/activeBranding, then resolves the actual preset document.
// Fires callback with null if no active branding is set or if it cannot be resolved.
export function subscribeToActiveBranding(
  callback: (branding: BrandingPreset | null) => void,
): () => void {
  let innerUnsub: (() => void) | null = null

  const outerUnsub = onSnapshot(
    doc(firestore, 'appConfig', 'activeBranding'),
    snap => {
      if (innerUnsub) { innerUnsub(); innerUnsub = null }

      if (!snap.exists()) { callback(null); return }

      const { activeBrandingId } = snap.data() as ActiveBrandingConfig
      if (!activeBrandingId)    { callback(null); return }

      innerUnsub = onSnapshot(
        doc(firestore, 'brandings', activeBrandingId),
        brandingSnap => {
          if (!brandingSnap.exists()) { callback(null); return }
          callback({ brandingId: brandingSnap.id, ...(brandingSnap.data() as Omit<BrandingPreset, 'brandingId'>) })
        },
        () => callback(null),
      )
    },
    () => callback(null),
  )

  return () => {
    outerUnsub()
    if (innerUnsub) innerUnsub()
  }
}

// Creates the default iTelematics branding preset (if not already present)
// and sets it as the active branding.
export async function restoreDefaultBranding(updatedBy: string): Promise<void> {
  // Check if the default branding already exists by businessCode
  const snap = await getDocs(collection(firestore, 'brandings'))
  let existingId: string | null = null

  snap.docs.forEach(d => {
    if ((d.data() as BrandingPreset).businessCode === DEFAULT_BRANDING.businessCode) {
      existingId = d.id
    }
  })

  let brandingId: string
  if (existingId) {
    brandingId = existingId
    await updateBrandingPreset(existingId, { ...DEFAULT_BRANDING })
  } else {
    brandingId = await createBrandingPreset({ ...DEFAULT_BRANDING, createdBy: updatedBy })
  }

  await setActiveBranding(brandingId, updatedBy)
}

// Returns current active branding ID (one-shot read)
export async function getActiveBrandingId(): Promise<string | null> {
  const ref  = doc(firestore, 'appConfig', 'activeBranding')
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return (snap.data() as ActiveBrandingConfig).activeBrandingId ?? null
}

// ─── Default branding seeds ───────────────────────────────────────────────────

const SEED_BRANDINGS: Omit<BrandingPreset, 'brandingId' | 'createdAt' | 'updatedAt'>[] = [
  {
    businessName:            'FAI Engineer',
    businessCode:            'fai',
    website:                 'https://fai.ev.engineer',
    supportEmail:            'info@itelematics.com',
    supportPhone:            '+918880423666',
    whatsappNumber:          '918880423666',
    technicalSupportNumber:  '919108206147',
    poweredByText:           'EV.ENGINEER',
    poweredByUrl:            'https://ev.engineer',
    domains:                 ['fai.ev.engineer'],
    enabled:                 true,
    createdBy:               'seed',
  },
  {
    businessName:            'iFab Tech',
    businessCode:            'ifab',
    website:                 'https://fai.ifab.tech',
    supportEmail:            'sri@ifab.tech',
    supportPhone:            '+447714296479',
    whatsappNumber:          '447714296479',
    technicalSupportNumber:  '919108206147',
    poweredByText:           'EV.ENGINEER',
    poweredByUrl:            'https://ev.engineer',
    domains:                 ['fai.ifab.tech'],
    enabled:                 true,
    createdBy:               'seed',
  },
]

export interface SeedBrandingResult {
  seeded:  string[]
  updated: string[]
  errors:  string[]
}

// Upserts the two default partner brandings (FAI + iFab).
// Matches existing docs by businessCode; creates new docs if missing.
export async function seedDefaultBrandings(calledBy: string): Promise<SeedBrandingResult> {
  const snap = await getDocs(collection(firestore, 'brandings'))
  const existing = snap.docs.map(d => ({
    id:   d.id,
    code: (d.data() as BrandingPreset).businessCode,
  }))

  const result: SeedBrandingResult = { seeded: [], updated: [], errors: [] }

  for (const seed of SEED_BRANDINGS) {
    const match = existing.find(e => e.code === seed.businessCode)
    try {
      if (match) {
        await updateDoc(doc(firestore, 'brandings', match.id), {
          ...seed,
          updatedAt: serverTimestamp(),
        })
        result.updated.push(seed.businessName)
      } else {
        await addDoc(collection(firestore, 'brandings'), {
          ...seed,
          createdBy: calledBy,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        result.seeded.push(seed.businessName)
      }
    } catch (err) {
      result.errors.push(`${seed.businessName}: ${(err as Error).message}`)
    }
  }

  return result
}
