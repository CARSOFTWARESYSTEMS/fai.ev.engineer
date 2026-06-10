import { FileSpreadsheet, FileText } from 'lucide-react'
import type { Form3Row } from '../types/form3Types'
import { exportForm3Excel, exportForm3CSV } from '../services/form3ExportService'

interface Form3ExportActionsProps {
  rows: Form3Row[]
  projectName: string
}

export function Form3ExportActions({ rows, projectName }: Form3ExportActionsProps) {
  const disabled = rows.length === 0

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => exportForm3Excel(rows, projectName)}
        disabled={disabled}
        title="Export Form 3 as Excel (.xlsx)"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <FileSpreadsheet className="w-3.5 h-3.5" />
        Excel
      </button>
      <button
        onClick={() => exportForm3CSV(rows, projectName)}
        disabled={disabled}
        title="Export Form 3 as CSV (.csv)"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <FileText className="w-3.5 h-3.5" />
        CSV
      </button>
    </div>
  )
}
