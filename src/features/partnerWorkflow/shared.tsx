import { useState } from 'react'
import { CheckCircle2, AlertTriangle, ChevronDown, Loader2, Trash2, Shield } from 'lucide-react'
import type { ProductId } from '../../auth/AuthTypes'

// ─── Feedback Banner ──────────────────────────────────────────────────────────

export function FeedbackBanner({ type, message }: { type: 'success' | 'error'; message: string }) {
  return (
    <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm
      ${type === 'success'
        ? 'bg-success/10 border border-success/20 text-success'
        : 'bg-error/10 border border-error/20 text-error'}`}>
      {type === 'success'
        ? <CheckCircle2 className="w-4 h-4 shrink-0" />
        : <AlertTriangle className="w-4 h-4 shrink-0" />}
      {message}
    </div>
  )
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

export function ConfirmModal({
  title,
  warning,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: {
  title:         string
  warning:       string
  confirmLabel?: string
  onConfirm:     (reason: string) => Promise<void>
  onCancel:      () => void
}) {
  const [reason,     setReason]     = useState('')
  const [confirming, setConfirming] = useState(false)

  const handleConfirm = async () => {
    setConfirming(true)
    try { await onConfirm(reason) } finally { setConfirming(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 flex flex-col gap-4">
        <div>
          <h3 className="text-base font-bold text-text-primary mb-1.5">{title}</h3>
          <p className="text-sm text-text-secondary">{warning}</p>
        </div>
        <div>
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1.5">Reason</label>
          <textarea
            value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Optional reason..."
            rows={3}
            className="w-full px-3 py-2 rounded-xl border border-border text-sm resize-none
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} disabled={confirming}
            className="text-sm font-medium text-text-secondary hover:text-text-primary px-4 py-2 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={confirming}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white
              bg-error hover:bg-error/90 px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50">
            {confirming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Collapsible Card ─────────────────────────────────────────────────────────

export function CollapsibleCard({
  title, subtitle, icon: Icon, iconBg, iconColor,
  defaultOpen = false, open: controlledOpen, onOpenChange,
  badge, headerRight, disabled = false, children,
}: {
  title:          string
  subtitle:       string
  icon:           typeof Shield
  iconBg:         string
  iconColor:      string
  defaultOpen?:   boolean
  open?:          boolean
  onOpenChange?:  (open: boolean) => void
  badge?:         React.ReactNode
  headerRight?:   React.ReactNode
  disabled?:      boolean
  children:       React.ReactNode
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open    = isControlled ? controlledOpen : internalOpen
  const setOpen = (val: boolean) => isControlled ? onOpenChange?.(val) : setInternalOpen(val)

  return (
    <div className="card overflow-hidden">
      <button type="button" onClick={() => !disabled && setOpen(!open)}
        className={['w-full flex items-center gap-3 p-4 sm:p-5 text-left transition-colors bg-gray-50/60',
          disabled ? 'cursor-default opacity-60' : 'hover:bg-gray-100/70'].join(' ')}>
        <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-bold text-text-primary leading-tight">{title}</h2>
            {badge}
          </div>
          <p className="text-[11px] text-text-secondary mt-0.5">{subtitle}</p>
        </div>
        {headerRight && (
          <div onClick={e => e.stopPropagation()} className="shrink-0">{headerRight}</div>
        )}
        {!disabled && (
          <ChevronDown className={`w-4 h-4 text-text-secondary transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} />
        )}
        {disabled && (
          <span className="text-[10px] font-semibold bg-gray-100 text-text-secondary px-2 py-0.5 rounded-full shrink-0">Soon</span>
        )}
      </button>
      {open && !disabled && (
        <div className="px-4 sm:px-5 pb-5 border-t border-border pt-4">{children}</div>
      )}
    </div>
  )
}

// ─── Domain Manager ───────────────────────────────────────────────────────────

function isValidHostname(value: string): boolean {
  return /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/.test(value)
}

export function DomainManager({ domains, onChange }: { domains: string[]; onChange: (d: string[]) => void }) {
  const [input,    setInput]    = useState('')
  const [inputErr, setInputErr] = useState('')

  const handleAdd = () => {
    const val = input.trim().toLowerCase()
    if (!val) return
    if (!isValidHostname(val)) { setInputErr('Invalid hostname format (e.g. fai.ev.engineer)'); return }
    if (domains.includes(val)) { setInputErr('Domain already added.'); return }
    onChange([...domains, val])
    setInput(''); setInputErr('')
  }

  return (
    <div>
      <div className="flex gap-2">
        <input type="text" value={input}
          onChange={e => { setInput(e.target.value); setInputErr('') }}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="fai.ev.engineer"
          className="flex-1 px-3 py-2 text-sm border border-border rounded-lg font-mono
            focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white" />
        <button type="button" onClick={handleAdd}
          className="px-3 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shrink-0">
          Add
        </button>
      </div>
      {inputErr && <p className="text-xs text-error mt-1">{inputErr}</p>}
      {domains.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {domains.map(d => (
            <span key={d} className="inline-flex items-center gap-1.5 text-xs font-mono bg-primary-light
              text-primary px-2.5 py-1 rounded-full border border-primary/20">
              {d}
              <button type="button" onClick={() => onChange(domains.filter(x => x !== d))}
                className="text-primary/60 hover:text-error transition-colors leading-none">×</button>
            </span>
          ))}
        </div>
      )}
      {domains.length === 0 && (
        <p className="text-[11px] text-text-secondary mt-1.5 italic">No domains added yet.</p>
      )}
    </div>
  )
}

// ─── Admin Slot ───────────────────────────────────────────────────────────────

export type AdminSlot = {
  email:       string
  uid:         string | null
  displayName: string
  status:      'idle' | 'found' | 'not_found'
}

export function emptySlot(): AdminSlot {
  return { email: '', uid: null, displayName: '', status: 'idle' }
}

// ─── Platform Products ────────────────────────────────────────────────────────

export const PLATFORM_PRODUCTS: { id: ProductId; label: string; description: string }[] = [
  { id: 'fai_reports', label: 'FAI Reports',                    description: 'Balloon drawings + AS9102 First Article Inspection' },
  { id: 'battery_pm',  label: 'Battery Predictive Maintenance', description: 'AI-powered battery health monitoring for EV fleets'  },
  { id: 'motor_pm',    label: 'Motor Predictive Maintenance',   description: 'Vibration & thermal monitoring for electric motors'  },
  { id: 'energy_mgmt', label: 'Energy Management',              description: 'Fleet-level energy tracking & optimisation'          },
  { id: 'clean_room',  label: 'Clean Room Solutions',           description: 'Cleanroom environmental monitoring & reporting'      },
]

// ─── Org status helpers ───────────────────────────────────────────────────────

import type { OrgStatus } from '../../services/organisationService'

export const ORG_STATUS_STYLES: Record<OrgStatus, string> = {
  active:    'bg-success/10 text-success border-success/20',
  trial:     'bg-blue-50 text-blue-700 border-blue-200',
  suspended: 'bg-red-50 text-error border-red-200',
  inactive:  'bg-gray-100 text-text-secondary border-border',
}

export const ORG_STATUS_LABELS: Record<OrgStatus, string> = {
  active: 'Active', trial: 'Trial', suspended: 'Suspended', inactive: 'Inactive',
}

export const ORG_PRODUCT_OPTIONS: { id: ProductId; label: string }[] = [
  { id: 'fai_reports', label: 'Balloon Drawings + AS9102 FAI Reports' },
  { id: 'battery_pm',  label: 'Battery Predictive Maintenance'        },
  { id: 'motor_pm',    label: 'Motor Predictive Maintenance'          },
  { id: 'energy_mgmt', label: 'Energy Management'                     },
  { id: 'clean_room',  label: 'Clean Room Solutions'                  },
]
