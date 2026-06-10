/**
 * FAI Engineer — Large-Project Seed Script
 *
 * Creates a realistic 10-page / 200-balloon / 200-feature / 200-Form3 dataset
 * for production validation and performance benchmarking.
 *
 * Prerequisites:
 *   npm install firebase-admin
 *   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json
 *   export FIREBASE_PROJECT_ID=your-firebase-project-id
 *
 * Usage:
 *   node scripts/seed-large-project.mjs <projectId> [userId]
 *
 * The projectId must already exist in Firestore (created via the FAI Engineer UI).
 * The userId is the uid of the user who owns the project. Defaults to 'seed-script'.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

// ── Config ───────────────────────────────────────────────────────────────────

const PROJECT_ID = process.argv[2]
const USER_ID    = process.argv[3] ?? 'seed-script'

if (!PROJECT_ID) {
  console.error('Usage: node scripts/seed-large-project.mjs <projectId> [userId]')
  process.exit(1)
}

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID
if (!FIREBASE_PROJECT_ID) {
  console.error('Set FIREBASE_PROJECT_ID environment variable.')
  process.exit(1)
}

// ── Aerospace characteristic dataset ─────────────────────────────────────────

const FEATURE_POOL = [
  // Linear dimensions
  { type: 'Linear',       nominal: '50.00',  tolerance: '±0.10',  min: '49.90',  max: '50.10',  units: 'mm' },
  { type: 'Linear',       nominal: '120.00', tolerance: '±0.15',  min: '119.85', max: '120.15', units: 'mm' },
  { type: 'Linear',       nominal: '25.50',  tolerance: '±0.05',  min: '25.45',  max: '25.55',  units: 'mm' },
  { type: 'Linear',       nominal: '8.00',   tolerance: '±0.20',  min: '7.80',   max: '8.20',   units: 'mm' },
  { type: 'Linear',       nominal: '200.00', tolerance: '±0.25',  min: '199.75', max: '200.25', units: 'mm' },
  // Diameters
  { type: 'Diameter',     nominal: '30.00',  tolerance: '±0.02',  min: '29.98',  max: '30.02',  units: 'mm' },
  { type: 'Diameter',     nominal: '12.50',  tolerance: '±0.02',  min: '12.48',  max: '12.52',  units: 'mm' },
  { type: 'Diameter',     nominal: '6.00',   tolerance: '+0.00/-0.02', min: '5.98', max: '6.00', units: 'mm' },
  { type: 'Diameter',     nominal: '50.00',  tolerance: 'H7',     min: '50.000', max: '50.025', units: 'mm' },
  // Radii
  { type: 'Radius',       nominal: '3.00',   tolerance: '±0.50',  min: '2.50',   max: '3.50',   units: 'mm' },
  { type: 'Radius',       nominal: '15.00',  tolerance: '±0.50',  min: '14.50',  max: '15.50',  units: 'mm' },
  // Angles
  { type: 'Angle',        nominal: '90.0',   tolerance: '±0.5°',  min: '89.5',   max: '90.5',   units: 'deg' },
  { type: 'Angle',        nominal: '45.0',   tolerance: '±0.5°',  min: '44.5',   max: '45.5',   units: 'deg' },
  // Threads
  { type: 'Thread',       nominal: 'M8x1.25',tolerance: '6H',     min: '',       max: '',       units: '' },
  { type: 'Thread',       nominal: 'M6x1.0', tolerance: '6H',     min: '',       max: '',       units: '' },
  { type: 'Thread',       nominal: 'M12x1.75', tolerance: '6g',   min: '',       max: '',       units: '' },
  // GD&T
  { type: 'GD&T',         nominal: '⊙ Ø0.2 M', tolerance: 'A B C', min: '',    max: '',       units: 'mm' },
  { type: 'GD&T',         nominal: '▱ 0.1',  tolerance: 'A',      min: '',       max: '',       units: 'mm' },
  { type: 'GD&T',         nominal: '○ 0.05', tolerance: 'A',      min: '',       max: '',       units: 'mm' },
  { type: 'GD&T',         nominal: '= 0.1',  tolerance: 'B',      min: '',       max: '',       units: 'mm' },
  // Surface Finish
  { type: 'Surface Finish', nominal: 'Ra 1.6', tolerance: 'max', min: '',       max: '',       units: 'µm' },
  { type: 'Surface Finish', nominal: 'Ra 3.2', tolerance: 'max', min: '',       max: '',       units: 'µm' },
  { type: 'Surface Finish', nominal: 'Rz 6.3', tolerance: 'max', min: '',       max: '',       units: 'µm' },
  // Notes
  { type: 'Note',         nominal: 'MATERIAL: Al 6061-T6', tolerance: '',  min: '', max: '', units: '' },
  { type: 'Note',         nominal: 'BREAK ALL SHARP EDGES 0.2 MAX', tolerance: '', min: '', max: '', units: '' },
]

const COMMENTS_POOL = [
  'Measure with CMM after heat treatment',
  'Check at 4 equal positions around circumference',
  'Critical dimension — measure 3 samples per batch',
  'Apply after surface treatment',
  '',
  '',
  '',  // mostly empty comments for realism
  '',
  '',
  'Verify with thread gauge',
]

const TOOLING_POOL = [
  'CMM - Zeiss Contura',
  'Micrometer 0-25mm',
  'Vernier caliper',
  'Thread gauge Go/NoGo',
  'Surface roughness tester',
  'Digital protractor',
  '',
  '',
]

const RESULT_POOL = {
  pass:    ['50.04', '30.01', '120.12', '25.49', '8.15', '12.50', '3.20', '89.8', '1.42', '3.18'],
  fail:    ['50.25', '29.95', '121.20', '25.30', '8.45', '12.45', '4.10', '91.2', '3.60', '4.20'],
  pending: [''],
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function gridPos(index, perPage) {
  // Distribute balloons in a grid across the page
  const cols = Math.ceil(Math.sqrt(perPage))
  const row  = Math.floor(index / cols)
  const col  = index % cols
  const marginX = 0.08
  const marginY = 0.10
  const cellW = (1 - 2 * marginX) / cols
  const cellH = (1 - 2 * marginY) / Math.ceil(perPage / cols)
  return {
    x: marginX + col * cellW + cellW * 0.2 + Math.random() * cellW * 0.6,
    y: marginY + row * cellH + cellH * 0.2 + Math.random() * cellH * 0.6,
  }
}

function now() { return Timestamp.now() }

// ── Seeding ───────────────────────────────────────────────────────────────────

const TOTAL_BALLOONS   = 200
const TOTAL_PAGES      = 10
const BALLOONS_PER_PAGE = Math.ceil(TOTAL_BALLOONS / TOTAL_PAGES)  // 20

async function seed() {
  // Init Admin SDK
  if (!getApps().length) {
    initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS), projectId: FIREBASE_PROJECT_ID })
  }
  const db = getFirestore()
  const batch = () => db.batch()

  console.log(`\nSeeding project: ${PROJECT_ID}`)
  console.log(`User: ${USER_ID}`)
  console.log(`Target: ${TOTAL_PAGES} pages, ${TOTAL_BALLOONS} balloons, ${TOTAL_BALLOONS} features, ${TOTAL_BALLOONS} Form 3 rows\n`)

  // ── Phase 1: Balloons ──────────────────────────────────────────────────────
  console.log('Phase 1/3 — Writing balloons...')
  const balloonIds = []
  let b = batch()
  let opCount = 0

  for (let i = 0; i < TOTAL_BALLOONS; i++) {
    const pageNumber    = Math.floor(i / BALLOONS_PER_PAGE) + 1
    const indexOnPage   = i % BALLOONS_PER_PAGE
    const balloonNumber = i + 1
    const pos           = gridPos(indexOnPage, BALLOONS_PER_PAGE)

    const ref = db.collection('projects').doc(PROJECT_ID).collection('balloons').doc()
    balloonIds.push(ref.id)

    b.set(ref, {
      projectId:     PROJECT_ID,
      pageNumber,
      balloonNumber,
      xPercent:      parseFloat(pos.x.toFixed(4)),
      yPercent:      parseFloat(pos.y.toFixed(4)),
      createdBy:     USER_ID,
      createdAt:     now(),
      updatedAt:     now(),
    })

    opCount++
    if (opCount === 499) {  // Firestore batch limit is 500
      await b.commit()
      b = batch()
      opCount = 0
      process.stdout.write('.')
    }
  }

  if (opCount > 0) await b.commit()
  console.log(`\n  ✓ ${TOTAL_BALLOONS} balloons written`)

  // ── Phase 2: Features ──────────────────────────────────────────────────────
  console.log('Phase 2/3 — Writing features...')
  const featureIds = []
  b = batch()
  opCount = 0

  for (let i = 0; i < TOTAL_BALLOONS; i++) {
    const balloonId    = balloonIds[i]
    const balloonNumber = i + 1
    const pageNumber   = Math.floor(i / BALLOONS_PER_PAGE) + 1
    const featureNumber = i + 1
    const spec         = FEATURE_POOL[i % FEATURE_POOL.length]
    const comment      = pick(COMMENTS_POOL)

    const ref = db.collection('projects').doc(PROJECT_ID).collection('features').doc()
    featureIds.push(ref.id)

    b.set(ref, {
      projectId:    PROJECT_ID,
      balloonId,
      balloonNumber,
      pageNumber,
      featureNumber,
      type:         spec.type,
      nominal:      spec.nominal,
      tolerance:    spec.tolerance,
      min:          spec.min,
      max:          spec.max,
      units:        spec.units,
      comments:     comment,
      createdBy:    USER_ID,
      createdAt:    now(),
      updatedAt:    now(),
    })

    opCount++
    if (opCount === 499) {
      await b.commit()
      b = batch()
      opCount = 0
      process.stdout.write('.')
    }
  }

  if (opCount > 0) await b.commit()
  console.log(`\n  ✓ ${TOTAL_BALLOONS} features written`)

  // ── Phase 3: Form 3 Results ────────────────────────────────────────────────
  // Realistic distribution: 70% pass, 15% fail, 15% pending
  console.log('Phase 3/3 — Writing Form 3 results...')
  b = batch()
  opCount = 0

  for (let i = 0; i < TOTAL_BALLOONS; i++) {
    const featureId         = featureIds[i]
    const balloonId         = balloonIds[i]
    const characteristicNumber = i + 1
    const rand              = Math.random()
    const status            = rand < 0.70 ? 'pass' : rand < 0.85 ? 'fail' : 'pending'
    const resultPool        = RESULT_POOL[status]
    const result            = status === 'pending' ? '' : pick(resultPool)
    const tooling           = status === 'pending' ? '' : pick(TOOLING_POOL)
    const nc                = status === 'fail' ? `NC-${String(i + 1).padStart(4, '0')}` : ''

    // Use featureId as the document ID (1:1 mapping)
    const ref = db.collection('projects').doc(PROJECT_ID)
      .collection('form3Results').doc(featureId)

    b.set(ref, {
      projectId:              PROJECT_ID,
      featureId,
      balloonId,
      characteristicNumber,
      result,
      status,
      designedTooling:        tooling,
      nonConformanceNumber:   nc,
      inspectorNotes:         '',
      createdBy:              USER_ID,
      createdAt:              now(),
      updatedAt:              now(),
    })

    opCount++
    if (opCount === 499) {
      await b.commit()
      b = batch()
      opCount = 0
      process.stdout.write('.')
    }
  }

  if (opCount > 0) await b.commit()
  console.log(`\n  ✓ ${TOTAL_BALLOONS} Form 3 results written`)

  // ── Summary ────────────────────────────────────────────────────────────────
  const passCount    = Math.round(TOTAL_BALLOONS * 0.70)
  const failCount    = Math.round(TOTAL_BALLOONS * 0.15)
  const pendingCount = TOTAL_BALLOONS - passCount - failCount

  console.log('\n─────────────────────────────────────────')
  console.log('Seed complete.')
  console.log(`  Project ID : ${PROJECT_ID}`)
  console.log(`  Pages      : ${TOTAL_PAGES}`)
  console.log(`  Balloons   : ${TOTAL_BALLOONS} (${BALLOONS_PER_PAGE}/page)`)
  console.log(`  Features   : ${TOTAL_BALLOONS}`)
  console.log(`  Form 3     : ${passCount} pass · ${failCount} fail · ${pendingCount} pending`)
  console.log('\nOpen in FAI Engineer to validate:')
  console.log(`  /projects/${PROJECT_ID}/pdf`)
  console.log('─────────────────────────────────────────\n')
}

seed().catch(err => {
  console.error('\nSeed FAILED:', err)
  process.exit(1)
})
