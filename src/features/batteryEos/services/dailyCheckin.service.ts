import {
  doc,
  getDoc,
  setDoc,
  query,
  collection,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore'
import { firestore } from '../../../firebase/firestore'
import type { EosDailyCheckin } from '../types/eos.types'

const COLLECTION = 'engineeringCheckins'

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

function checkinDocId(uid: string, date: string): string {
  return `${uid}_${date}`
}

export async function getTodayCheckin(uid: string): Promise<EosDailyCheckin | null> {
  const date  = todayDateString()
  const docId = checkinDocId(uid, date)
  const snap  = await getDoc(doc(firestore, COLLECTION, docId))
  if (!snap.exists()) return null
  return snap.data() as EosDailyCheckin
}

export async function submitDailyCheckin(
  checkin: Omit<EosDailyCheckin, 'checkinId' | 'date' | 'submittedAt' | 'createdAt'>,
): Promise<EosDailyCheckin> {
  const date      = todayDateString()
  const checkinId = checkinDocId(checkin.uid, date)
  const now       = new Date().toISOString()

  const full: EosDailyCheckin = {
    ...checkin,
    checkinId,
    date,
    submittedAt: now,
    createdAt:   now,
  }

  // Firestore rejects `undefined` values — strip any optional fields that weren't provided
  const payload = Object.fromEntries(
    Object.entries(full).filter(([, v]) => v !== undefined),
  )

  await setDoc(doc(firestore, COLLECTION, checkinId), payload, { merge: true })
  return full
}

export async function getRecentCheckins(
  uid: string,
  limitCount = 7,
): Promise<EosDailyCheckin[]> {
  const q    = query(
    collection(firestore, COLLECTION),
    where('uid', '==', uid),
    where('productKey', '==', 'battery_pm'),
    orderBy('date', 'desc'),
    limit(limitCount),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as EosDailyCheckin)
}

export async function getOrgCheckins(
  organisationId: string,
  date: string,
): Promise<EosDailyCheckin[]> {
  const q    = query(
    collection(firestore, COLLECTION),
    where('organisationId', '==', organisationId),
    where('date', '==', date),
    where('productKey', '==', 'battery_pm'),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as EosDailyCheckin)
}
