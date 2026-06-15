import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
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
  ownedByPartnerId?:        string   // Partner that owns this branding preset
  createdAt:                Timestamp | null
  updatedAt:                Timestamp | null
  createdBy:                string
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_BRANDING: Omit<BrandingPreset, 'brandingId' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
  businessName:  'iTelematics Software Private Limited',
  businessCode:  'itelematics',
  poweredByText: 'powered by EV.ENGINEER',
  poweredByUrl:  'https://ev.engineer',
  domains:       [],
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

// Subscribe to a single branding preset by ID.
export function subscribeToBrandingById(
  brandingId: string,
  callback: (preset: BrandingPreset | null) => void,
): () => void {
  return onSnapshot(
    doc(firestore, 'brandings', brandingId),
    snap => {
      if (!snap.exists()) { callback(null); return }
      callback({ brandingId: snap.id, ...(snap.data() as Omit<BrandingPreset, 'brandingId'>) })
    },
    () => callback(null),
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

// Upserts the default iTelematics branding preset (creates if missing, updates if found).
export async function restoreDefaultBranding(updatedBy: string): Promise<void> {
  const snap = await getDocs(collection(firestore, 'brandings'))
  let existingId: string | null = null

  snap.docs.forEach(d => {
    if ((d.data() as BrandingPreset).businessCode === DEFAULT_BRANDING.businessCode) {
      existingId = d.id
    }
  })

  if (existingId) {
    await updateBrandingPreset(existingId, { ...DEFAULT_BRANDING })
  } else {
    await createBrandingPreset({ ...DEFAULT_BRANDING, createdBy: updatedBy })
  }
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
