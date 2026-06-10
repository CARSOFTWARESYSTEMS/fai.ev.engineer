import { X, FileText, PlusCircle, Trash2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import type { Form2Row, Form2RowUpdateInput } from '../types/form2Types'
import type { Form2SaveStatus } from '../hooks/useForm2'
import { UndoToast } from '../../../components/ui/UndoToast'

interface Form2PanelProps {
  rows: Form2Row[]
  isLoaded: boolean
  saveStatus: Form2SaveStatus
  pendingDeleteLabel: string | null
  onAddRow: () => void
  onUpdateRow: (rowId: string, data: Form2RowUpdateInput) => void
  onDeleteRow: (rowId: string) => void
  onUndoDelete: () => void
  onDismissDeleteToast: () => void
  onClose: () => void
}

function SaveIndicator({ status }: { status: Form2SaveStatus }) {
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

const COLUMNS: { key: keyof Form2RowUpdateInput; label: string; placeholder: string; width: string }[] = [
  { key: 'materialOrProcessName',        label: 'Material / Process Name',        placeholder: 'e.g. Aluminium 6061-T6',   width: 'min-w-[160px]' },
  { key: 'specificationNumber',          label: 'Specification Number',            placeholder: 'e.g. AMS 2750',            width: 'min-w-[140px]' },
  { key: 'code',                         label: 'Code',                            placeholder: 'N/A or code',              width: 'min-w-[80px]' },
  { key: 'supplierName',                 label: 'Supplier Name',                   placeholder: 'Supplier',                 width: 'min-w-[140px]' },
  { key: 'supplierAddress',              label: 'Supplier Address',                placeholder: 'City, Country',            width: 'min-w-[160px]' },
  { key: 'supplierCode',                 label: 'Supplier Code',                   placeholder: 'CAGE or ID',               width: 'min-w-[100px]' },
  { key: 'customerApprovalVerification', label: 'Customer Approval Verification',  placeholder: 'Yes / No / N/A',           width: 'min-w-[100px]' },
  { key: 'certificateOfConformanceNumber', label: 'CoC Number',                   placeholder: 'CoC ref',                  width: 'min-w-[120px]' },
  { key: 'acceptanceReportNumber',       label: 'Acceptance Report No.',           placeholder: 'AR ref',                   width: 'min-w-[120px]' },
  { key: 'comments',                     label: 'Comments',                        placeholder: 'Notes…',                   width: 'min-w-[160px]' },
]

const cellInput = [
  'w-full bg-transparent border border-transparent rounded px-1.5 py-0.5 text-xs text-gray-800',
  'placeholder-gray-300 focus:outline-none focus:border-primary focus:bg-white transition-colors',
].join(' ')

export function Form2Panel({ rows, isLoaded, saveStatus, pendingDeleteLabel, onAddRow, onUpdateRow, onDeleteRow, onUndoDelete, onDismissDeleteToast, onClose }: Form2PanelProps) {
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">

      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-3 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <h1 className="text-sm font-bold text-gray-900 whitespace-nowrap">AS9102 Form 2</h1>
                <span className="text-xs text-text-secondary hidden sm:inline">
                  Material and Process Certifications
                </span>
              </div>
              <p className="text-[11px] text-text-secondary">
                {rows.length} row{rows.length !== 1 ? 's' : ''} — autosave
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <SaveIndicator status={saveStatus} />
            <button
              type="button"
              onClick={onAddRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary border border-primary rounded-lg hover:bg-primary-light transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Add Row
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-2.5 text-xs font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      {!isLoaded ? (
        <div className="flex-1 flex items-center justify-center text-text-secondary">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-sm">Loading…</span>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-16 text-text-secondary">
          <FileText className="w-14 h-14 mb-4 text-gray-200" />
          <p className="text-base font-semibold text-gray-700 mb-1">No materials or processes yet</p>
          <p className="text-sm text-gray-400 max-w-xs mb-4">
            Add rows for each material specification, process, or supplier that applies to this FAIR.
          </p>
          <button
            type="button"
            onClick={onAddRow}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-primary border border-primary rounded-lg hover:bg-primary-light transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Add first row
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="min-w-max w-full text-xs border-collapse">
            <thead className="sticky top-0 z-20 bg-gray-800 text-white">
              <tr>
                <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-center border-b border-gray-700 sticky left-0 bg-gray-800 z-30 min-w-[3rem]">
                  #
                </th>
                {COLUMNS.map(col => (
                  <th
                    key={col.key}
                    className={`px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-left border-b border-gray-700 whitespace-nowrap ${col.width}`}
                  >
                    {col.label}
                  </th>
                ))}
                <th className="px-2 py-2.5 border-b border-gray-700 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row, i) => (
                <tr key={row.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-3 py-2 text-center font-mono text-[11px] text-gray-500 sticky left-0 bg-inherit border-b border-gray-100">
                    {i + 1}
                  </td>
                  {COLUMNS.map(col => (
                    <td key={col.key} className="px-2 py-1.5 border-b border-gray-100">
                      <input
                        type="text"
                        className={cellInput}
                        value={(row[col.key as keyof Form2Row] as string) ?? ''}
                        placeholder={col.placeholder}
                        onChange={e => onUpdateRow(row.id, { [col.key]: e.target.value })}
                      />
                    </td>
                  ))}
                  <td className="px-2 py-1.5 border-b border-gray-100">
                    <button
                      type="button"
                      onClick={() => onDeleteRow(row.id)}
                      title="Delete row"
                      className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="shrink-0 border-t border-gray-100 bg-gray-50 px-5 py-2">
        <p className="text-[10px] text-gray-400">
          AS9102D · Form 2 · Material and/or Process Performance Requirements — Certification of Compliance
        </p>
      </div>

      {/* Undo toast */}
      {pendingDeleteLabel && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] pointer-events-auto">
          <UndoToast
            message={`${pendingDeleteLabel} deleted`}
            onUndo={onUndoDelete}
            onDismiss={onDismissDeleteToast}
          />
        </div>
      )}
    </div>
  )
}
