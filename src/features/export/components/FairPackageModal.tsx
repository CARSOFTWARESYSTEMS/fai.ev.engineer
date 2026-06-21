import { useState } from 'react'
import { X, Package, FileSpreadsheet, FileText, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import type { FairPackageInput } from '../services/fairPackageExportService'
import { exportFairPackage } from '../services/fairPackageExportService'
import { useAuth } from '../../../auth/hooks/useAuth'
import { logFairExported } from '../../../services/userActivityLogService'

interface FairPackageModalProps {
  input: FairPackageInput
  onClose: () => void
}

interface SummaryRow {
  label: string
  value: string | number
  icon: React.ElementType
  warn?: boolean
}

export function FairPackageModal({ input, onClose }: FairPackageModalProps) {
  const [status, setStatus] = useState<'idle' | 'building' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const { firebaseUser } = useAuth()

  const { form1, form2Rows, form3Rows, features, balloons } = input

  const summaryRows: SummaryRow[] = [
    { label: 'FAIR Identifier', value: form1.fairIdentifier || '—', icon: FileText, warn: !form1.fairIdentifier },
    { label: 'Part Number',     value: form1.partNumber     || '—', icon: FileText, warn: !form1.partNumber },
    { label: 'FAIR Type / Scope', value: [form1.fairType, form1.fairScope].filter(Boolean).join(' · ') || '—', icon: FileText },
    { label: 'Balloons',        value: balloons.length,    icon: FileSpreadsheet },
    { label: 'Features',        value: features.length,    icon: FileSpreadsheet },
    { label: 'Form 2 Rows',     value: form2Rows.length,   icon: FileSpreadsheet },
    { label: 'Form 3 Rows',     value: form3Rows.length,   icon: FileSpreadsheet },
  ]

  const hasWarnings = summaryRows.some(r => r.warn)

  const contents = [
    { name: 'Ballooned_Drawing.pdf', ready: balloons.length > 0 },
    { name: 'Form1.xlsx',            ready: !!form1.fairIdentifier },
    { name: 'Form2.xlsx',            ready: form2Rows.length > 0 },
    { name: 'Form3.xlsx',            ready: form3Rows.length > 0 },
    { name: 'Features.xlsx',         ready: features.length > 0 },
  ]

  const handleExport = async () => {
    setStatus('building')
    setErrorMsg(null)
    try {
      await exportFairPackage(input)
      setStatus('done')
      const uid   = input.ownerUid   ?? firebaseUser?.uid   ?? ''
      const email = input.ownerEmail ?? firebaseUser?.email ?? ''
      if (uid) {
        logFairExported({
          ownerUid:     uid,
          ownerEmail:   email,
          projectId:    input.projectId,
          projectName:  input.projectName,
          balloonCount: input.balloons.length,
          featureCount: input.features.length,
        }).catch(() => {})
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Export failed')
      setStatus('error')
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Package className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-gray-900">Export FAIR Package</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Review before generating ZIP</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary */}
        <div className="px-5 py-4 space-y-2.5">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Package Summary</p>
          <div className="grid grid-cols-2 gap-2">
            {summaryRows.map(row => (
              <div
                key={row.label}
                className={[
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-xs',
                  row.warn ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50 border border-gray-100',
                ].join(' ')}
              >
                <row.icon className={`w-3.5 h-3.5 shrink-0 ${row.warn ? 'text-amber-500' : 'text-gray-400'}`} />
                <span className="text-gray-500 truncate">{row.label}</span>
                <span className={`ml-auto font-semibold shrink-0 ${row.warn ? 'text-amber-600' : 'text-gray-800'}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ZIP Contents */}
        <div className="px-5 pb-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">ZIP Contents</p>
          <div className="rounded-lg border border-gray-100 divide-y divide-gray-50 overflow-hidden">
            {contents.map(item => (
              <div key={item.name} className="flex items-center gap-2.5 px-3 py-2 text-xs">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.ready ? 'bg-green-400' : 'bg-gray-200'}`} />
                <span className={`flex-1 font-mono ${item.ready ? 'text-gray-700' : 'text-gray-400'}`}>{item.name}</span>
                {!item.ready && <span className="text-[10px] text-gray-400">empty</span>}
              </div>
            ))}
            {['/Certificates/', '/Supplier_FAIRs/', '/Attachments/'].map(folder => (
              <div key={folder} className="flex items-center gap-2.5 px-3 py-2 text-xs">
                <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-gray-100" />
                <span className="flex-1 font-mono text-gray-300">{folder}</span>
                <span className="text-[10px] text-gray-300">placeholder</span>
              </div>
            ))}
          </div>
        </div>

        {/* Warnings */}
        {hasWarnings && (
          <div className="mx-5 mb-4 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>Some Form 1 fields are empty. The package will still export — fill in Form 1 for a complete submission.</span>
          </div>
        )}

        {/* Error */}
        {status === 'error' && errorMsg && (
          <div className="mx-5 mb-4 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3 border-t border-gray-100 bg-gray-50/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={status === 'building'}
            className={[
              'inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all',
              status === 'done'
                ? 'bg-green-600 text-white'
                : 'bg-primary text-white hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed',
            ].join(' ')}
          >
            {status === 'building' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {status === 'done'     && <CheckCircle2 className="w-3.5 h-3.5" />}
            {status === 'building' ? 'Building ZIP…' : status === 'done' ? 'Downloaded!' : 'Export Package'}
          </button>
        </div>
      </div>
    </div>
  )
}
