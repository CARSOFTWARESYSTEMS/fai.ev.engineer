/**
 * demoDataSeeder.ts
 *
 * Browser-side demo data generator. Uses the Firebase client SDK.
 * Creates 6 realistic aerospace/manufacturing demo projects for beta onboarding.
 *
 * Each project gets: metadata, balloons, features, Form 1, Form 2 rows, Form 3 results.
 * All demo documents are tagged with isDemoData: true for targeted cleanup.
 *
 * Usage (from DemoDataTab component):
 *   const results = await seedDemoProjects(uid, orgCode, orgName, productKey, onProgress)
 *   await deleteDemoProjects(uid)
 *   await exportDemoDataset(uid)
 */

import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  writeBatch,
  serverTimestamp,
  deleteDoc,
} from 'firebase/firestore'
import { firestore } from '../firebase/firestore'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SeedProgress {
  projectIndex: number
  totalProjects: number
  projectName: string
  step: string
}

export interface SeedResult {
  projectId: string
  projectName: string
  status: string
  balloonCount: number
  featureCount: number
  form3Count: number
  form2Count: number
}

interface DemoProjectSpec {
  projectName: string
  customerName: string
  partNumber: string
  partName: string
  drawingNumber: string
  drawingRevision: string
  material: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'draft' | 'in-progress' | 'review' | 'completed'
  balloonCount: number
  fairIdentifier: string
  fairVerifiedBy: string
  fairReviewedBy: string
  purchaseOrderNumber: string
  supplierCode: string
  form2RowIndices: number[]   // indices into FORM2_ROWS
  form3PassRate: number       // 0.0 – 1.0
}

// ─── Demo project definitions ─────────────────────────────────────────────────

const DEMO_PROJECTS: DemoProjectSpec[] = [
  {
    projectName:       'Aerospace Bracket — Aft Fuselage',
    customerName:      'Boeing Defense & Space',
    partNumber:        'BAC-7734-001',
    partName:          'Aft Fuselage Bracket',
    drawingNumber:     'DWG-BAC-7734-001',
    drawingRevision:   'Rev C',
    material:          'Aluminium 6061-T6',
    description:       'Primary structural bracket for aft fuselage attachment. Fully inspected per AS9102 FAIR requirements.',
    priority:          'critical',
    status:            'completed',
    balloonCount:      30,
    fairIdentifier:    'FAI-BAC-7734-001-C',
    fairVerifiedBy:    'J. Kowalski',
    fairReviewedBy:    'S. Nakamura',
    purchaseOrderNumber: 'PO-2024-00812',
    supplierCode:      '2PAM6',
    form2RowIndices:   [0, 1, 2, 10, 8],
    form3PassRate:     0.93,
  },
  {
    projectName:       'Aerospace Housing — Actuator',
    customerName:      'Airbus S.A.S.',
    partNumber:        'AIR-4421-002',
    partName:          'Actuator Housing',
    drawingNumber:     'DWG-AIR-4421-002',
    drawingRevision:   'Rev B',
    material:          'Titanium Ti-6Al-4V',
    description:       'Flight-critical actuator housing. Requires NDT inspection per customer specification ABS 0062.',
    priority:          'critical',
    status:            'in-progress',
    balloonCount:      45,
    fairIdentifier:    'FAI-AIR-4421-002-B',
    fairVerifiedBy:    'A. Fernandez',
    fairReviewedBy:    'R. Patel',
    purchaseOrderNumber: 'PO-2024-01145',
    supplierCode:      '9SAN4',
    form2RowIndices:   [6, 7, 8, 9, 12, 4],
    form3PassRate:     0.78,
  },
  {
    projectName:       'Mounting Plate — Avionics Bay',
    customerName:      'Raytheon Technologies',
    partNumber:        'RTX-2290-005',
    partName:          'Avionics Bay Mounting Plate',
    drawingNumber:     'DWG-RTX-2290-005',
    drawingRevision:   'Rev A',
    material:          'Aluminium 7075-T651',
    description:       'Avionics bay mounting plate with precision-located hole pattern. CMM inspection required.',
    priority:          'high',
    status:            'review',
    balloonCount:      25,
    fairIdentifier:    'FAI-RTX-2290-005-A',
    fairVerifiedBy:    'M. Okonkwo',
    fairReviewedBy:    'T. Bergström',
    purchaseOrderNumber: 'PO-2024-00437',
    supplierCode:      '2PAM6',
    form2RowIndices:   [0, 2, 10, 18],
    form3PassRate:     0.88,
  },
  {
    projectName:       'CNC Machined Part — Valve Body',
    customerName:      'SpaceX',
    partNumber:        'SPX-0091-012',
    partName:          'Propellant Valve Body',
    drawingNumber:     'DWG-SPX-0091-012',
    drawingRevision:   'Rev D',
    material:          'Stainless Steel 316L',
    description:       'Liquid propellant valve body. Passivation required. Hydrostatic leak test per SPX-PROC-0091.',
    priority:          'critical',
    status:            'draft',
    balloonCount:      20,
    fairIdentifier:    'FAI-SPX-0091-012-D',
    fairVerifiedBy:    'D. Morrison',
    fairReviewedBy:    'K. Larsson',
    purchaseOrderNumber: 'PO-2024-02201',
    supplierCode:      '9SAN4',
    form2RowIndices:   [5, 4, 7, 8, 9],
    form3PassRate:     0.70,
  },
  {
    projectName:       'Battery Cooling Plate — EV Module',
    customerName:      'Tesla Inc.',
    partNumber:        'TSL-8810-003',
    partName:          'Battery Module Cooling Plate',
    drawingNumber:     'DWG-TSL-8810-003',
    drawingRevision:   'Rev B',
    material:          'Aluminium 6061-T6',
    description:       'Liquid-cooled battery module plate with micro-channel passages. Pressure tested at 4 bar.',
    priority:          'high',
    status:            'in-progress',
    balloonCount:      40,
    fairIdentifier:    'FAI-TSL-8810-003-B',
    fairVerifiedBy:    'P. Singh',
    fairReviewedBy:    'C. Weber',
    purchaseOrderNumber: 'PO-2024-01892',
    supplierCode:      '2PAM6',
    form2RowIndices:   [0, 1, 2, 13, 10],
    form3PassRate:     0.85,
  },
  {
    projectName:       'Precision Fixture — CMM Master',
    customerName:      'Lockheed Martin',
    partNumber:        'LMT-5503-007',
    partName:          'CMM Master Fixture',
    drawingNumber:     'DWG-LMT-5503-007',
    drawingRevision:   'Rev E',
    material:          'Tool Steel D2',
    description:       'Precision CMM master fixture. Hardened and ground. All datums laser-calibrated.',
    priority:          'medium',
    status:            'completed',
    balloonCount:      35,
    fairIdentifier:    'FAI-LMT-5503-007-E',
    fairVerifiedBy:    'N. Johansson',
    fairReviewedBy:    'Y. Tanaka',
    purchaseOrderNumber: 'PO-2024-00305',
    supplierCode:      '4SES3',
    form2RowIndices:   [11, 10, 7, 17, 18, 8],
    form3PassRate:     0.97,
  },
]

// ─── Feature pool (reused from large-project seed) ────────────────────────────

const FEATURE_POOL = [
  { type: 'Linear',        nominal: '50.00',          tolerance: '±0.10',       min: '49.90',  max: '50.10',  units: 'mm'  },
  { type: 'Linear',        nominal: '120.00',         tolerance: '±0.15',       min: '119.85', max: '120.15', units: 'mm'  },
  { type: 'Linear',        nominal: '25.50',          tolerance: '±0.05',       min: '25.45',  max: '25.55',  units: 'mm'  },
  { type: 'Linear',        nominal: '8.00',           tolerance: '±0.20',       min: '7.80',   max: '8.20',   units: 'mm'  },
  { type: 'Linear',        nominal: '200.00',         tolerance: '±0.25',       min: '199.75', max: '200.25', units: 'mm'  },
  { type: 'Linear',        nominal: '15.75',          tolerance: '±0.08',       min: '15.67',  max: '15.83',  units: 'mm'  },
  { type: 'Diameter',      nominal: '30.00',          tolerance: '±0.02',       min: '29.98',  max: '30.02',  units: 'mm'  },
  { type: 'Diameter',      nominal: '12.50',          tolerance: '±0.02',       min: '12.48',  max: '12.52',  units: 'mm'  },
  { type: 'Diameter',      nominal: '6.00',           tolerance: '+0.00/-0.02', min: '5.98',   max: '6.00',   units: 'mm'  },
  { type: 'Diameter',      nominal: '50.00',          tolerance: 'H7',          min: '50.000', max: '50.025', units: 'mm'  },
  { type: 'Diameter',      nominal: '8.50',           tolerance: '+0.00/-0.03', min: '8.47',   max: '8.50',   units: 'mm'  },
  { type: 'Radius',        nominal: '3.00',           tolerance: '±0.50',       min: '2.50',   max: '3.50',   units: 'mm'  },
  { type: 'Radius',        nominal: '15.00',          tolerance: '±0.50',       min: '14.50',  max: '15.50',  units: 'mm'  },
  { type: 'Angle',         nominal: '90.0',           tolerance: '±0.5°',       min: '89.5',   max: '90.5',   units: 'deg' },
  { type: 'Angle',         nominal: '45.0',           tolerance: '±0.5°',       min: '44.5',   max: '45.5',   units: 'deg' },
  { type: 'Thread',        nominal: 'M8x1.25',        tolerance: '6H',          min: '',       max: '',       units: ''    },
  { type: 'Thread',        nominal: 'M6x1.0',         tolerance: '6H',          min: '',       max: '',       units: ''    },
  { type: 'Thread',        nominal: 'M12x1.75',       tolerance: '6g',          min: '',       max: '',       units: ''    },
  { type: 'GD&T',          nominal: '⊙ Ø0.2 M',      tolerance: 'A B C',       min: '',       max: '',       units: 'mm'  },
  { type: 'GD&T',          nominal: '▱ 0.1',          tolerance: 'A',           min: '',       max: '',       units: 'mm'  },
  { type: 'GD&T',          nominal: '○ 0.05',         tolerance: 'A',           min: '',       max: '',       units: 'mm'  },
  { type: 'GD&T',          nominal: '= 0.1',          tolerance: 'B',           min: '',       max: '',       units: 'mm'  },
  { type: 'Surface Finish', nominal: 'Ra 1.6',        tolerance: 'max',         min: '',       max: '',       units: 'µm'  },
  { type: 'Surface Finish', nominal: 'Ra 3.2',        tolerance: 'max',         min: '',       max: '',       units: 'µm'  },
  { type: 'Surface Finish', nominal: 'Rz 6.3',        tolerance: 'max',         min: '',       max: '',       units: 'µm'  },
  { type: 'Note',          nominal: 'MATERIAL CERT REQUIRED', tolerance: '',    min: '',       max: '',       units: ''    },
  { type: 'Note',          nominal: 'BREAK ALL SHARP EDGES 0.2 MAX', tolerance: '', min: '', max: '',         units: ''    },
]

const COMMENTS_POOL = [
  'Measure with CMM after heat treatment',
  'Check at 4 equal positions around circumference',
  'Critical dimension — measure 3 samples per batch',
  'Apply after surface treatment',
  'Verify with thread gauge',
  '',
  '',
  '',
  '',
  '',
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

const MEASUREMENT_POOL = [
  'CMM - Zeiss Contura G2',
  'Mitutoyo Micrometer 0-25mm (SN: MIC-042)',
  'Mitutoyo Vernier Caliper 150mm (SN: CAL-107)',
  'Thread gauge M8x1.25 6H Go/NoGo',
  'Mahr MarSurf PS10 roughness tester',
  'Fowler Pro Digital Protractor',
  'Renishaw OMP40 probe',
  '',
]

const RESULT_PASS = ['50.04', '30.01', '120.12', '25.49', '8.15', '12.50', '3.20', '89.8', '1.42', '3.18']
const RESULT_FAIL = ['50.25', '29.95', '121.20', '25.30', '8.45', '12.45', '4.10', '91.2', '3.60', '4.20']

// ─── Form 2 row data pool ─────────────────────────────────────────────────────

const FORM2_ROWS = [
  { materialOrProcessName: 'Aluminium 6061-T6',            specificationNumber: 'AMS 2770',       code: '6061',  supplierName: 'TW Metals',             supplierAddress: 'Exeter, PA, USA',           supplierCode: '1FWT7', customerApprovalVerification: 'Yes', certificateOfConformanceNumber: 'CoC-TW-2024-001', acceptanceReportNumber: 'AR-2024-001', comments: 'Mill cert attached' },
  { materialOrProcessName: 'Hard Anodise Type III',         specificationNumber: 'AMS 2469',       code: 'HAC',   supplierName: 'Anodize Corp',           supplierAddress: 'Burbank, CA, USA',          supplierCode: '4ANO2', customerApprovalVerification: 'Yes', certificateOfConformanceNumber: 'CoC-AC-2024-007', acceptanceReportNumber: 'AR-2024-007', comments: 'Class 1, 0.001in min' },
  { materialOrProcessName: 'Chemical Conversion Coating',   specificationNumber: 'MIL-DTL-5541',   code: 'CCC',   supplierName: 'Anodize Corp',           supplierAddress: 'Burbank, CA, USA',          supplierCode: '4ANO2', customerApprovalVerification: 'Yes', certificateOfConformanceNumber: 'CoC-AC-2024-008', acceptanceReportNumber: '',             comments: 'Class 3' },
  { materialOrProcessName: 'Zinc Plating',                  specificationNumber: 'ASTM B633',      code: 'ZN',    supplierName: 'Precision Plating',      supplierAddress: 'Detroit, MI, USA',          supplierCode: '8PPL1', customerApprovalVerification: 'No',  certificateOfConformanceNumber: '',                 acceptanceReportNumber: '',             comments: '' },
  { materialOrProcessName: 'Passivation',                   specificationNumber: 'AMS 2700',       code: 'PASS',  supplierName: 'Anodize Corp',           supplierAddress: 'Burbank, CA, USA',          supplierCode: '4ANO2', customerApprovalVerification: 'Yes', certificateOfConformanceNumber: 'CoC-AC-2024-010', acceptanceReportNumber: '',             comments: 'Method 1 Type 6' },
  { materialOrProcessName: 'Stainless Steel 316L',          specificationNumber: 'AMS 5507',       code: '316L',  supplierName: 'Sandvik Materials',      supplierAddress: 'Stockholm, Sweden',         supplierCode: '9SAN4', customerApprovalVerification: 'Yes', certificateOfConformanceNumber: 'CoC-SM-2024-002', acceptanceReportNumber: 'AR-2024-002', comments: '' },
  { materialOrProcessName: 'Titanium Ti-6Al-4V',            specificationNumber: 'AMS 4928',       code: 'Ti64',  supplierName: 'VSMPO-AVISMA',           supplierAddress: 'Verkhnaya Salda, RU',       supplierCode: '2VSM9', customerApprovalVerification: 'Yes', certificateOfConformanceNumber: 'CoC-VS-2024-003', acceptanceReportNumber: 'AR-2024-003', comments: 'Grade 5 ELI' },
  { materialOrProcessName: 'Shot Peening',                  specificationNumber: 'AMS 2430',       code: 'SP',    supplierName: 'Metal Improvement Co',   supplierAddress: 'Paramus, NJ, USA',          supplierCode: '3MIC8', customerApprovalVerification: 'N/A', certificateOfConformanceNumber: '',                 acceptanceReportNumber: '',             comments: 'Intensity 0.010 Almen A' },
  { materialOrProcessName: 'Penetrant Inspection',          specificationNumber: 'NAS 410',        code: 'FPI',   supplierName: 'Intertek NDT',           supplierAddress: 'Houston, TX, USA',          supplierCode: '7INT3', customerApprovalVerification: 'Yes', certificateOfConformanceNumber: 'CoC-IN-2024-011', acceptanceReportNumber: 'AR-2024-011', comments: 'Level II technician' },
  { materialOrProcessName: 'Magnetic Particle Inspection',  specificationNumber: 'ASTM E1444',     code: 'MPI',   supplierName: 'Intertek NDT',           supplierAddress: 'Houston, TX, USA',          supplierCode: '7INT3', customerApprovalVerification: 'Yes', certificateOfConformanceNumber: 'CoC-IN-2024-012', acceptanceReportNumber: 'AR-2024-012', comments: '' },
  { materialOrProcessName: 'Heat Treatment',                specificationNumber: 'AMS 2770',       code: 'HT',    supplierName: 'Solar Atmospheres',      supplierAddress: 'Souderton, PA, USA',        supplierCode: '5SOL6', customerApprovalVerification: 'Yes', certificateOfConformanceNumber: 'CoC-SA-2024-004', acceptanceReportNumber: '',             comments: 'T6 temper' },
  { materialOrProcessName: 'Primer Application',            specificationNumber: 'MIL-PRF-23377',  code: 'PRM',   supplierName: 'Anodize Corp',           supplierAddress: 'Burbank, CA, USA',          supplierCode: '4ANO2', customerApprovalVerification: 'N/A', certificateOfConformanceNumber: '',                 acceptanceReportNumber: '',             comments: 'Class C2' },
  { materialOrProcessName: 'Ultrasonic Inspection',         specificationNumber: 'ASTM E114',      code: 'UT',    supplierName: 'Mistras Group',          supplierAddress: 'Princeton Jct, NJ, USA',    supplierCode: '6MST2', customerApprovalVerification: 'Yes', certificateOfConformanceNumber: 'CoC-MG-2024-013', acceptanceReportNumber: 'AR-2024-013', comments: 'UT Level II' },
  { materialOrProcessName: 'Brazing',                       specificationNumber: 'AMS 2675',       code: 'BRZ',   supplierName: 'Advanced Brazing Inc',   supplierAddress: 'Phoenix, AZ, USA',          supplierCode: '2ABI7', customerApprovalVerification: 'Yes', certificateOfConformanceNumber: 'CoC-AB-2024-005', acceptanceReportNumber: '',             comments: 'Filler BNi-2' },
  { materialOrProcessName: 'Welding',                       specificationNumber: 'AWS D1.1',       code: 'WLD',   supplierName: 'Aerojet Welding',        supplierAddress: 'Sacramento, CA, USA',       supplierCode: '3AWL5', customerApprovalVerification: 'Yes', certificateOfConformanceNumber: 'CoC-AW-2024-006', acceptanceReportNumber: '',             comments: 'EB weld' },
  { materialOrProcessName: 'Adhesive Bonding',              specificationNumber: 'MIL-A-8625',     code: 'ADH',   supplierName: 'Cytec Solvay Group',     supplierAddress: 'Woodland Park, NJ, USA',    supplierCode: '1CYT4', customerApprovalVerification: 'N/A', certificateOfConformanceNumber: '',                 acceptanceReportNumber: '',             comments: 'FM-73 film adhesive' },
  { materialOrProcessName: 'Dry Film Lubrication',          specificationNumber: 'MIL-PRF-46010',  code: 'DFL',   supplierName: 'Everlube Products',      supplierAddress: 'Garden Grove, CA, USA',     supplierCode: '8EVL9', customerApprovalVerification: 'N/A', certificateOfConformanceNumber: '',                 acceptanceReportNumber: '',             comments: 'Type II' },
  { materialOrProcessName: 'Cadmium Plating',               specificationNumber: 'AMS 2400',       code: 'CD',    supplierName: 'Precision Plating',      supplierAddress: 'Detroit, MI, USA',          supplierCode: '8PPL1', customerApprovalVerification: 'Yes', certificateOfConformanceNumber: 'CoC-PP-2024-014', acceptanceReportNumber: '',             comments: 'Type I, Class 2' },
  { materialOrProcessName: 'Electrical Discharge Machining', specificationNumber: 'N/A',           code: 'EDM',   supplierName: 'Sparc EDM Solutions',    supplierAddress: 'Chicago, IL, USA',          supplierCode: '4SES3', customerApprovalVerification: 'N/A', certificateOfConformanceNumber: '',                 acceptanceReportNumber: '',             comments: 'Wire EDM per drawing' },
  { materialOrProcessName: 'CNC Machining',                 specificationNumber: 'N/A',            code: 'CNC',   supplierName: 'Precision Aerospace Mfg', supplierAddress: 'Chatsworth, CA, USA',      supplierCode: '2PAM6', customerApprovalVerification: 'N/A', certificateOfConformanceNumber: '',                 acceptanceReportNumber: '',             comments: 'In-house' },
]

// ─── Utilities ─────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function gridPos(index: number, total: number): { x: number; y: number } {
  const cols    = Math.ceil(Math.sqrt(total))
  const rows    = Math.ceil(total / cols)
  const col     = index % cols
  const row     = Math.floor(index / cols)
  const marginX = 0.08
  const marginY = 0.10
  const cellW   = (1 - 2 * marginX) / cols
  const cellH   = (1 - 2 * marginY) / rows
  return {
    x: parseFloat((marginX + col * cellW + cellW * 0.2 + Math.random() * cellW * 0.6).toFixed(4)),
    y: parseFloat((marginY + row * cellH + cellH * 0.2 + Math.random() * cellH * 0.6).toFixed(4)),
  }
}

// Auto-flushing batch helper — Firestore batch limit is 500 ops
function makeBatch() {
  let batch    = writeBatch(firestore)
  let opCount  = 0

  return {
    set(ref: ReturnType<typeof doc>, data: Record<string, unknown>) {
      batch.set(ref, data)
      opCount++
    },
    delete(ref: ReturnType<typeof doc>) {
      batch.delete(ref)
      opCount++
    },
    get pending() { return opCount },
    async flush() {
      if (opCount > 0) {
        await batch.commit()
        batch   = writeBatch(firestore)
        opCount = 0
      }
    },
    async maybeFlush() {
      if (opCount >= 490) await this.flush()
    },
  }
}

// ─── Seed a single project ────────────────────────────────────────────────────

async function seedProject(
  spec: DemoProjectSpec,
  uid: string,
  organizationCode: string,
  organizationName: string,
  productKey: string,
  onProgress?: (step: string) => void,
): Promise<SeedResult> {
  const projectRef = doc(collection(firestore, 'projects'))
  const projectId  = projectRef.id
  const b          = makeBatch()

  // ── Project document ────────────────────────────────────────────────────────
  onProgress?.('Creating project document')
  b.set(projectRef, {
    projectId,
    uid,
    productKey,
    organizationCode,
    organizationName,
    projectName:     spec.projectName,
    customerName:    spec.customerName,
    partNumber:      spec.partNumber,
    partName:        spec.partName,
    drawingNumber:   spec.drawingNumber,
    drawingRevision: spec.drawingRevision,
    material:        spec.material,
    description:     spec.description,
    status:          spec.status,
    priority:        spec.priority,
    version:         1,
    sourcePdfName:   '',
    pdfStatus:       'none',
    googleDriveFileId: '',
    isDemoData:      true,
    createdAt:       serverTimestamp(),
    updatedAt:       serverTimestamp(),
  })
  await b.flush()

  // ── Balloons ────────────────────────────────────────────────────────────────
  onProgress?.('Creating balloons')
  const count      = spec.balloonCount
  const pagesCount = Math.ceil(count / 10)
  const balloonIds: string[] = []

  for (let i = 0; i < count; i++) {
    const pageNumber    = Math.floor(i / Math.ceil(count / pagesCount)) + 1
    const indexOnPage   = i % Math.ceil(count / pagesCount)
    const pos           = gridPos(indexOnPage, Math.ceil(count / pagesCount))
    const balloonRef    = doc(collection(firestore, 'projects', projectId, 'balloons'))

    balloonIds.push(balloonRef.id)
    b.set(balloonRef, {
      projectId,
      pageNumber,
      balloonNumber: i + 1,
      xPercent:      pos.x,
      yPercent:      pos.y,
      createdBy:     uid,
      isDemoData:    true,
      createdAt:     serverTimestamp(),
      updatedAt:     serverTimestamp(),
    })
    await b.maybeFlush()
  }
  await b.flush()

  // ── Features ────────────────────────────────────────────────────────────────
  onProgress?.('Creating features')
  const featureIds: string[] = []
  const pagesForFeatures = Math.ceil(count / 10)

  for (let i = 0; i < count; i++) {
    const pageNumber    = Math.floor(i / Math.ceil(count / pagesForFeatures)) + 1
    const spec_f        = FEATURE_POOL[i % FEATURE_POOL.length]
    const featureRef    = doc(collection(firestore, 'projects', projectId, 'features'))

    featureIds.push(featureRef.id)
    b.set(featureRef, {
      projectId,
      balloonId:     balloonIds[i],
      balloonNumber: i + 1,
      pageNumber,
      featureNumber: i + 1,
      type:          spec_f.type,
      nominal:       spec_f.nominal,
      tolerance:     spec_f.tolerance,
      min:           spec_f.min,
      max:           spec_f.max,
      units:         spec_f.units,
      comments:      pick(COMMENTS_POOL),
      createdBy:     uid,
      isDemoData:    true,
      createdAt:     serverTimestamp(),
      updatedAt:     serverTimestamp(),
    })
    await b.maybeFlush()
  }
  await b.flush()

  // ── Form 3 results ──────────────────────────────────────────────────────────
  onProgress?.('Creating Form 3 results')

  for (let i = 0; i < count; i++) {
    const featureId  = featureIds[i]
    const rand       = Math.random()
    const status     = rand < spec.form3PassRate
      ? 'pass'
      : rand < spec.form3PassRate + 0.10 ? 'fail' : 'pending'
    const result     = status === 'pass' ? pick(RESULT_PASS) : status === 'fail' ? pick(RESULT_FAIL) : ''
    const form3Ref   = doc(firestore, 'projects', projectId, 'form3Results', featureId)

    b.set(form3Ref, {
      projectId,
      featureId,
      balloonId:                balloonIds[i],
      characteristicNumber:     i + 1,
      result,
      status,
      designedTooling:          status === 'pending' ? '' : pick(TOOLING_POOL),
      measurementEquipmentUsed: status === 'pending' ? '' : pick(MEASUREMENT_POOL),
      nonConformanceNumber:     status === 'fail' ? `NC-${String(i + 1).padStart(4, '0')}` : '',
      inspectorNotes:           '',
      createdBy:                uid,
      isDemoData:               true,
      createdAt:                serverTimestamp(),
      updatedAt:                serverTimestamp(),
    })
    await b.maybeFlush()
  }
  await b.flush()

  // ── Form 1 ──────────────────────────────────────────────────────────────────
  onProgress?.('Creating Form 1')
  const form1Ref = doc(firestore, 'projects', projectId, 'form1', projectId)
  await setDoc(form1Ref, {
    projectId,
    fairIdentifier:                spec.fairIdentifier,
    fairType:                      'Detail',
    fairScope:                     'Full',
    reasonForFair:                 'Initial production run — new part number',
    partNumber:                    spec.partNumber,
    partName:                      spec.partName,
    partRevisionLevel:             spec.drawingRevision,
    drawingNumber:                 spec.drawingNumber,
    drawingRevisionLevel:          spec.drawingRevision,
    additionalChanges:             '',
    manufacturingProcessReference: `WO-2024-${Math.floor(Math.random() * 9000 + 1000)}`,
    organizationName,
    supplierCode:                  spec.supplierCode,
    purchaseOrderNumber:           spec.purchaseOrderNumber,
    baselinePartNumber:            `${spec.partNumber} ${spec.drawingRevision.replace('Rev ', 'Rev ')}`,
    containsNonconformance:        spec.form3PassRate >= 0.90 ? 'No' : 'Yes',
    fairVerifiedBy:                spec.fairVerifiedBy,
    verifiedDate:                  '2024-11-15',
    fairReviewedBy:                spec.fairReviewedBy,
    reviewedDate:                  '2024-11-18',
    customerApproval:              spec.status === 'completed' ? `${spec.fairReviewedBy} (Customer Approval)` : '',
    customerApprovalDate:          spec.status === 'completed' ? '2024-11-22' : '',
    comments:                      'Demo data — generated for beta testing.',
    isDemoData:                    true,
    updatedAt:                     serverTimestamp(),
  })

  // ── Form 2 rows ─────────────────────────────────────────────────────────────
  onProgress?.('Creating Form 2 rows')
  const form2Count = spec.form2RowIndices.length

  for (let r = 0; r < form2Count; r++) {
    const rowData   = FORM2_ROWS[spec.form2RowIndices[r]]
    const form2Ref  = doc(collection(firestore, 'projects', projectId, 'form2Rows'))

    b.set(form2Ref, {
      projectId,
      rowOrder:  r + 1,
      ...rowData,
      isDemoData: true,
      createdAt:  serverTimestamp(),
      updatedAt:  serverTimestamp(),
    })
    await b.maybeFlush()
  }
  await b.flush()

  return {
    projectId,
    projectName:   spec.projectName,
    status:        spec.status,
    balloonCount:  count,
    featureCount:  count,
    form3Count:    count,
    form2Count,
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Seeds all 6 demo projects for the given user.
 * Returns the list of created project IDs and counts.
 */
export async function seedDemoProjects(
  uid: string,
  organizationCode: string,
  organizationName: string,
  productKey: string,
  onProgress?: (p: SeedProgress) => void,
): Promise<SeedResult[]> {
  const results: SeedResult[] = []

  for (let i = 0; i < DEMO_PROJECTS.length; i++) {
    const spec = DEMO_PROJECTS[i]
    onProgress?.({ projectIndex: i, totalProjects: DEMO_PROJECTS.length, projectName: spec.projectName, step: 'Starting' })

    const result = await seedProject(
      spec,
      uid,
      organizationCode,
      organizationName,
      productKey,
      (step) => onProgress?.({ projectIndex: i, totalProjects: DEMO_PROJECTS.length, projectName: spec.projectName, step }),
    )
    results.push(result)
  }

  return results
}

/**
 * Deletes all demo projects (and their subcollections) owned by the given user.
 * Returns the number of projects deleted.
 */
export async function deleteDemoProjects(uid: string): Promise<number> {
  const allSnap = await getDocs(
    query(collection(firestore, 'projects'), where('uid', '==', uid))
  )
  const projectsSnap = { docs: allSnap.docs.filter(d => d.data().isDemoData === true) }

  // auditTrail is append-only (delete: false in rules) — skip it
  const SUBCOLLECTIONS = ['balloons', 'features', 'form1', 'form2Rows', 'form3Results']
  let deleted = 0

  for (const projectDoc of projectsSnap.docs) {
    const projectId = projectDoc.id
    const b = makeBatch()

    // Delete all subcollection docs
    for (const sub of SUBCOLLECTIONS) {
      const subSnap = await getDocs(collection(firestore, 'projects', projectId, sub))
      for (const subDoc of subSnap.docs) {
        b.delete(doc(firestore, 'projects', projectId, sub, subDoc.id))
        await b.maybeFlush()
      }
    }
    await b.flush()

    // Delete the project document itself
    await deleteDoc(doc(firestore, 'projects', projectId))
    deleted++
  }

  return deleted
}

/**
 * Exports all demo projects for the given user as a JSON file download.
 */
export async function exportDemoDataset(uid: string): Promise<void> {
  const allSnap = await getDocs(
    query(collection(firestore, 'projects'), where('uid', '==', uid))
  )
  const demoDocs = allSnap.docs.filter(d => d.data().isDemoData === true)

  const dataset: Record<string, unknown>[] = []

  for (const projectDoc of demoDocs) {
    const projectId = projectDoc.id
    const entry: Record<string, unknown> = { ...projectDoc.data() }

    for (const sub of ['balloons', 'features', 'form2Rows', 'form3Results']) {
      const subSnap = await getDocs(collection(firestore, 'projects', projectId, sub))
      entry[sub] = subSnap.docs.map(d => d.data())
    }

    const form1Snap = await getDocs(collection(firestore, 'projects', projectId, 'form1'))
    entry.form1 = form1Snap.docs[0]?.data() ?? null

    dataset.push(entry)
  }

  const json    = JSON.stringify({ exportedAt: new Date().toISOString(), projects: dataset }, null, 2)
  const blob    = new Blob([json], { type: 'application/json' })
  const url     = URL.createObjectURL(blob)
  const anchor  = document.createElement('a')
  anchor.href   = url
  anchor.download = `fai-demo-dataset-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

/**
 * Returns summary info about existing demo projects for the given user.
 */
export async function getDemoProjectSummary(uid: string): Promise<{ count: number; names: string[] }> {
  const snap = await getDocs(
    query(collection(firestore, 'projects'), where('uid', '==', uid))
  )
  const demoDocs = snap.docs.filter(d => d.data().isDemoData === true)
  return {
    count: demoDocs.length,
    names: demoDocs.map(d => (d.data() as { projectName: string }).projectName),
  }
}
