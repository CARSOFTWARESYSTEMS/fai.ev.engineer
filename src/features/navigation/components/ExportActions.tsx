import { FileSpreadsheet } from 'lucide-react'
import type { Feature } from '../../featureTable/types/featureTypes'
import type { Balloon } from '../../ballooning/types/balloonTypes'
import { exportFeaturesToExcel } from '../../export/services/excelExportService'

interface ExportActionsProps {
  features: Feature[]
  balloons: Balloon[]
  projectName: string
}

export function ExportActions({ features, balloons, projectName }: ExportActionsProps) {
  return (
    <div className="px-4 py-2 space-y-2">
      <button
        onClick={() => exportFeaturesToExcel(features, balloons, projectName)}
        disabled={features.length === 0}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-primary border border-primary rounded-lg hover:bg-primary-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <FileSpreadsheet className="w-3.5 h-3.5" />
        Export Excel{features.length > 0 ? ` (${features.length} rows)` : ''}
      </button>
      {features.length === 0 && (
        <p className="text-xs text-text-secondary text-center italic">
          Add features to enable export
        </p>
      )}
    </div>
  )
}
