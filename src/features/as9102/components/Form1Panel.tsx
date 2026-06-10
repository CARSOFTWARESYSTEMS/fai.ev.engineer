import { useState, useMemo } from 'react'
import {
  X, FileCheck2, CheckCircle2, AlertCircle, Loader2,
  ChevronDown, Tag, FileText, Settings, AlertTriangle, ShieldCheck,
} from 'lucide-react'
import type { Form1SaveStatus } from '../hooks/useForm1'
import type { Form1Input } from '../types/form1Types'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Form1PanelProps {
  data: Form1Input
  isLoaded: boolean
  saveStatus: Form1SaveStatus
  onUpdate: <K extends keyof Form1Input>(key: K, value: Form1Input[K]) => void
  onClose: () => void
}

// All user-fillable fields (excludes projectId)
const ALL_FILLABLE_KEYS: (keyof Form1Input)[] = [
  'fairIdentifier', 'fairType', 'fairScope', 'reasonForFair',
  'partNumber', 'partName', 'partRevisionLevel',
  'drawingNumber', 'drawingRevisionLevel', 'additionalChanges',
  'manufacturingProcessReference', 'organizationName', 'supplierCode',
  'purchaseOrderNumber', 'baselinePartNumber', 'containsNonconformance',
  'fairVerifiedBy', 'verifiedDate', 'fairReviewedBy', 'reviewedDate',
  'customerApproval', 'customerApprovalDate', 'comments',
]

type SectionId = 'classification' | 'part' | 'manufacturing' | 'nonconformance' | 'verification'

interface SectionDef {
  id: SectionId
  title: string
  icon: React.ElementType
  keys: (keyof Form1Input)[]
}

const SECTIONS: SectionDef[] = [
  {
    id: 'classification',
    title: 'FAIR Classification',
    icon: Tag,
    keys: ['fairIdentifier', 'fairType', 'fairScope', 'reasonForFair'],
  },
  {
    id: 'part',
    title: 'Part Information',
    icon: FileText,
    keys: ['partNumber', 'partName', 'partRevisionLevel', 'drawingNumber', 'drawingRevisionLevel', 'additionalChanges'],
  },
  {
    id: 'manufacturing',
    title: 'Manufacturing & Supply',
    icon: Settings,
    keys: ['manufacturingProcessReference', 'organizationName', 'supplierCode', 'purchaseOrderNumber', 'baselinePartNumber'],
  },
  {
    id: 'nonconformance',
    title: 'Nonconformance',
    icon: AlertTriangle,
    keys: ['containsNonconformance'],
  },
  {
    id: 'verification',
    title: 'Verification & Approval',
    icon: ShieldCheck,
    keys: ['fairVerifiedBy', 'verifiedDate', 'fairReviewedBy', 'reviewedDate', 'customerApproval', 'customerApprovalDate', 'comments'],
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function isFilled(data: Form1Input, key: keyof Form1Input): boolean {
  const v = data[key]
  return typeof v === 'string' ? v.trim().length > 0 : Boolean(v)
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SaveIndicator({ status }: { status: Form1SaveStatus }) {
  if (status === 'idle') return null
  return (
    <span className={[
      'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-all',
      status === 'saving' ? 'text-gray-500 bg-gray-100' :
      status === 'saved'  ? 'text-green-700 bg-green-50 border border-green-200' :
      'text-red-700 bg-red-50 border border-red-200',
    ].join(' ')}>
      {status === 'saving' && <Loader2 className="w-3 h-3 animate-spin" />}
      {status === 'saved'  && <CheckCircle2 className="w-3 h-3" />}
      {status === 'error'  && <AlertCircle className="w-3 h-3" />}
      {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : 'Save failed'}
    </span>
  )
}

function CompletionBadge({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  const color = pct === 100 ? 'text-green-700 bg-green-50 border-green-200' :
                pct >= 50   ? 'text-blue-700 bg-blue-50 border-blue-200' :
                              'text-gray-500 bg-gray-100 border-gray-200'
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${color}`}>
      {pct === 100 && <CheckCircle2 className="w-3 h-3" />}
      {done} / {total}
    </span>
  )
}

interface SectionCardProps {
  def: SectionDef
  data: Form1Input
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}

function SectionCard({ def, data, isOpen, onToggle, children }: SectionCardProps) {
  const done = def.keys.filter(k => isFilled(data, k)).length
  const total = def.keys.length
  const allDone = done === total

  return (
    <div className={[
      'rounded-xl border bg-white shadow-sm overflow-hidden transition-all',
      allDone ? 'border-green-200' : 'border-gray-200',
    ].join(' ')}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/70 transition-colors text-left"
      >
        <def.icon className={`w-4 h-4 shrink-0 ${allDone ? 'text-green-500' : 'text-primary'}`} />
        <span className="flex-1 text-sm font-semibold text-gray-800">{def.title}</span>
        <CompletionBadge done={done} total={total} />
        <ChevronDown className={[
          'w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0',
          isOpen ? 'rotate-180' : '',
        ].join(' ')} />
      </button>

      {isOpen && (
        <div className="border-t border-gray-100 px-5 pt-4 pb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-4">
          {children}
        </div>
      )}
    </div>
  )
}

interface FieldProps {
  label: string
  required?: boolean
  isEmpty?: boolean
  hint?: string
  span?: 1 | 2 | 3
  children: React.ReactNode
}

function Field({ label, required, isEmpty, hint, span = 1, children }: FieldProps) {
  const colClass =
    span === 3 ? 'sm:col-span-2 lg:col-span-3' :
    span === 2 ? 'sm:col-span-2' : ''
  return (
    <div className={colClass}>
      <label className="block text-[11px] font-semibold text-gray-500 mb-1 leading-none">
        {label}
        {required && (
          <span className={`ml-1 font-bold ${isEmpty ? 'text-red-500' : 'text-gray-400'}`}>*</span>
        )}
      </label>
      {children}
      {hint && <p className="text-[10px] text-gray-400 mt-1">{hint}</p>}
      {required && isEmpty && (
        <p className="text-[10px] text-red-500 mt-1 font-medium">Required</p>
      )}
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const inputCls = [
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 bg-gray-50',
  'focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 focus:bg-white',
  'transition-colors placeholder-gray-300',
].join(' ')

const inputRequiredEmptyCls = [
  'w-full rounded-lg border border-red-300 px-3 py-2 text-sm text-gray-800 bg-red-50/30',
  'focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 focus:bg-white',
  'transition-colors placeholder-gray-300',
].join(' ')

// ── Main component ──────────────────────────────────────────────────────────────

export function Form1Panel({ data, isLoaded, saveStatus, onUpdate, onClose }: Form1PanelProps) {
  const [openSections, setOpenSections] = useState<Set<SectionId>>(
    new Set(['classification', 'part', 'manufacturing', 'nonconformance', 'verification']),
  )

  const toggleSection = (id: SectionId) => {
    setOpenSections(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const completedCount = useMemo(
    () => ALL_FILLABLE_KEYS.filter(k => isFilled(data, k)).length,
    [data],
  )
  const totalCount = ALL_FILLABLE_KEYS.length

  const inp = (key: keyof Form1Input) => ({
    value: (data[key] ?? '') as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onUpdate(key, e.target.value as Form1Input[typeof key]),
  })

  const cls = (key: keyof Form1Input, required?: boolean) => {
    if (required && !isFilled(data, key)) return inputRequiredEmptyCls
    return inputCls
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="shrink-0 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-3 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
              <FileCheck2 className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h1 className="text-sm font-bold text-gray-900 whitespace-nowrap">AS9102 Form 1</h1>
                <span className="text-xs text-gray-400 hidden sm:inline">
                  Design Characteristics Accountability
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">First Article Inspection Report — Header</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <SaveIndicator status={saveStatus} />
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 shadow-sm hover:border-gray-400 hover:bg-gray-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>
        </div>

        {/* Error banner */}
        {saveStatus === 'error' && (
          <div className="border-t border-red-200 bg-red-50 px-5 py-2 flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Autosave failed — check your connection and try editing a field again.</span>
          </div>
        )}
      </div>

      {/* ── Sticky summary bar ───────────────────────────────────────────────── */}
      {isLoaded && (
        <div className="shrink-0 bg-white border-b border-gray-200 px-5 py-2.5 flex items-center gap-4 flex-wrap">
          {data.fairIdentifier ? (
            <span className="text-xs font-bold text-primary font-mono bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
              {data.fairIdentifier}
            </span>
          ) : (
            <span className="text-xs text-red-500 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              FAIR ID required
            </span>
          )}
          {data.partNumber && (
            <span className="text-xs text-gray-600">
              <span className="text-gray-400">Part </span>
              <span className="font-semibold text-gray-800">{data.partNumber}</span>
              {data.partRevisionLevel && <span className="text-gray-400"> · Rev {data.partRevisionLevel}</span>}
            </span>
          )}
          {data.partName && (
            <span className="text-xs text-gray-500 truncate max-w-[200px]">{data.partName}</span>
          )}
          {data.fairType && data.fairScope && (
            <span className="text-xs text-gray-400">
              {data.fairType} · {data.fairScope}
            </span>
          )}
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-28 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={[
                    'h-full rounded-full transition-all duration-300',
                    completedCount === totalCount ? 'bg-green-500' :
                    completedCount >= totalCount / 2 ? 'bg-primary' : 'bg-gray-300',
                  ].join(' ')}
                  style={{ width: `${Math.round((completedCount / totalCount) * 100)}%` }}
                />
              </div>
            </div>
            <CompletionBadge done={completedCount} total={totalCount} />
            <span className="text-[11px] text-gray-400">fields completed</span>
          </div>
        </div>
      )}

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      {!isLoaded ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-sm">Loading…</span>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

            {/* ── FAIR Classification ─────────────────────────────────────── */}
            <SectionCard
              def={SECTIONS[0]}
              data={data}
              isOpen={openSections.has('classification')}
              onToggle={() => toggleSection('classification')}
            >
              <Field label="FAIR Identifier" required isEmpty={!isFilled(data, 'fairIdentifier')}>
                <input
                  className={cls('fairIdentifier', true)}
                  placeholder="e.g. FAI-2024-001"
                  {...inp('fairIdentifier')}
                />
              </Field>
              <Field label="FAIR Type">
                <select className={inputCls} {...inp('fairType')}>
                  <option value="">Select…</option>
                  <option value="Detail">Detail FAI</option>
                  <option value="Assembly">Assembly FAI</option>
                </select>
              </Field>
              <Field label="FAIR Scope">
                <select className={inputCls} {...inp('fairScope')}>
                  <option value="">Select…</option>
                  <option value="Full">Full FAI</option>
                  <option value="Partial">Partial FAI</option>
                </select>
              </Field>
              <Field label="Reason for Full / Partial FAI" span={3}>
                <input className={inputCls} placeholder="Describe reason for this FAI…" {...inp('reasonForFair')} />
              </Field>
            </SectionCard>

            {/* ── Part Information ─────────────────────────────────────────── */}
            <SectionCard
              def={SECTIONS[1]}
              data={data}
              isOpen={openSections.has('part')}
              onToggle={() => toggleSection('part')}
            >
              <Field label="Part Number">
                <input className={inputCls} placeholder="Part number" {...inp('partNumber')} />
              </Field>
              <Field label="Part Name">
                <input className={inputCls} placeholder="Part name / description" {...inp('partName')} />
              </Field>
              <Field label="Part Revision Level">
                <input className={inputCls} placeholder="e.g. Rev B" {...inp('partRevisionLevel')} />
              </Field>
              <Field label="Drawing Number">
                <input className={inputCls} placeholder="Drawing number" {...inp('drawingNumber')} />
              </Field>
              <Field label="Drawing Revision Level">
                <input className={inputCls} placeholder="e.g. Rev C" {...inp('drawingRevisionLevel')} />
              </Field>
              <Field label="Additional Changes">
                <input className={inputCls} placeholder="Change notice / deviation" {...inp('additionalChanges')} />
              </Field>
            </SectionCard>

            {/* ── Manufacturing & Supply ────────────────────────────────────── */}
            <SectionCard
              def={SECTIONS[2]}
              data={data}
              isOpen={openSections.has('manufacturing')}
              onToggle={() => toggleSection('manufacturing')}
            >
              <Field label="Manufacturing Process Reference" span={2}>
                <input className={inputCls} placeholder="Process spec / work order / router" {...inp('manufacturingProcessReference')} />
              </Field>
              <Field label="Organization Name">
                <input className={inputCls} placeholder="Your organization" {...inp('organizationName')} />
              </Field>
              <Field label="Supplier Code" hint="CAGE code or internal supplier ID">
                <input className={inputCls} placeholder="e.g. 1ABC2" {...inp('supplierCode')} />
              </Field>
              <Field label="Purchase Order Number">
                <input className={inputCls} placeholder="PO number" {...inp('purchaseOrderNumber')} />
              </Field>
              <Field label="Baseline Part Number (incl. Revision)" hint="Part number used for the baseline FAI">
                <input className={inputCls} placeholder="Baseline PN + revision" {...inp('baselinePartNumber')} />
              </Field>
            </SectionCard>

            {/* ── Nonconformance ────────────────────────────────────────────── */}
            <SectionCard
              def={SECTIONS[3]}
              data={data}
              isOpen={openSections.has('nonconformance')}
              onToggle={() => toggleSection('nonconformance')}
            >
              <Field
                label="Does this FAIR contain documented nonconformance(s)?"
                span={2}
                hint="If Yes, attach NC documentation to this FAIR package"
              >
                <select className={inputCls} {...inp('containsNonconformance')}>
                  <option value="">Select…</option>
                  <option value="No">No</option>
                  <option value="Yes">Yes — NC documentation attached</option>
                </select>
              </Field>
            </SectionCard>

            {/* ── Verification & Approval ───────────────────────────────────── */}
            <SectionCard
              def={SECTIONS[4]}
              data={data}
              isOpen={openSections.has('verification')}
              onToggle={() => toggleSection('verification')}
            >
              <Field label="FAIR Verified By">
                <input className={inputCls} placeholder="Inspector / verifier name" {...inp('fairVerifiedBy')} />
              </Field>
              <Field label="Verified Date">
                <input type="date" className={inputCls} {...inp('verifiedDate')} />
              </Field>
              <div className="hidden lg:block" /> {/* spacer on 3-col */}

              <Field label="FAIR Reviewed / Approved By">
                <input className={inputCls} placeholder="Approver name" {...inp('fairReviewedBy')} />
              </Field>
              <Field label="Reviewed Date">
                <input type="date" className={inputCls} {...inp('reviewedDate')} />
              </Field>
              <div className="hidden lg:block" />

              <Field label="Customer Approval">
                <input className={inputCls} placeholder="Customer name or signature reference" {...inp('customerApproval')} />
              </Field>
              <Field label="Customer Approval Date">
                <input type="date" className={inputCls} {...inp('customerApprovalDate')} />
              </Field>
              <div className="hidden lg:block" />

              <Field label="Comments" span={3}>
                <textarea
                  rows={3}
                  className={inputCls}
                  placeholder="General comments or notes for this FAIR…"
                  value={(data.comments ?? '') as string}
                  onChange={e => onUpdate('comments', e.target.value)}
                />
              </Field>
            </SectionCard>

          </div>
        </div>
      )}

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-gray-200 bg-white px-5 py-2 flex items-center justify-between gap-4">
        <p className="text-[10px] text-gray-400">
          AS9102D · Form 1 · Design Characteristics Accountability
        </p>
        <p className="text-[10px] text-gray-400">
          All fields save automatically · <span className="text-gray-300">*</span> = required
        </p>
      </div>
    </div>
  )
}
