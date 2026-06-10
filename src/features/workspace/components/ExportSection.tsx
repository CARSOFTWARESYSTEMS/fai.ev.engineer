import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import type { Feature } from '../../featureTable/types/featureTypes'
import type { Balloon } from '../../ballooning/types/balloonTypes'
import { exportFeaturesToExcel, exportFeaturesToCSV } from '../../export/services/excelExportService'
import { exportForm3CSV, exportForm3Excel } from '../../as9102/services/form3ExportService'
import type { Form3Row } from '../../as9102/types/form3Types'

interface ExportSectionProps {
  isExpanded: boolean
  features: Feature[]
  balloons: Balloon[]
  form3Rows: Form3Row[]
  projectName: string
  onExportBalloonedPdf: () => void
}

function ExportBtn({
  onClick, disabled, icon: Icon, label, sublabel,
}: {
  onClick?: () => void
  disabled?: boolean
  icon: React.ComponentType<{ className?: string }>
  label: string
  sublabel?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={disabled ? 'No data to export' : label}
      className={[
        'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-left text-xs transition-colors',
        disabled
          ? 'opacity-35 cursor-not-allowed text-gray-500'
          : 'text-gray-300 hover:bg-white/[0.06] hover:text-white',
      ].join(' ')}
    >
      <Icon className={`w-3.5 h-3.5 shrink-0 ${disabled ? 'text-gray-600' : 'text-gray-400'}`} />
      <div className="flex-1 min-w-0">
        <div className="font-medium leading-none">{label}</div>
        {sublabel && <div className="text-[9px] text-gray-600 mt-0.5">{sublabel}</div>}
      </div>
    </button>
  )
}

export function ExportSection({
  isExpanded,
  features,
  balloons,
  form3Rows,
  projectName,
  onExportBalloonedPdf,
}: ExportSectionProps) {
  if (!isExpanded) return null

  const hasFeatures = features.length > 0
  const hasForm3Rows = form3Rows.length > 0

  return (
    <div className="px-3">
      <div className="rounded-xl border border-primary/60 bg-primary/[0.12] p-3 shadow-[0_0_18px_rgb(37_99_235_/_0.14)]">
        <div className="mb-3 flex items-start gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/50 bg-primary/20 text-blue-200">
            <Download className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-xs font-semibold text-white">Export Deliverables</h3>
            <p className="mt-0.5 text-[9px] leading-relaxed text-blue-100/70">
              Download reports and final project outputs.
            </p>
          </div>
        </div>
        <div className="space-y-1 rounded-lg border border-white/[0.08] bg-[#111827]/70 p-1">
          <ExportBtn
            onClick={() => exportFeaturesToExcel(features, balloons, projectName)}
            disabled={!hasFeatures}
            icon={FileSpreadsheet}
            label="Feature Table Excel"
            sublabel={hasFeatures ? `${features.length} characteristics` : 'No features yet'}
          />
          <ExportBtn
            onClick={() => exportFeaturesToCSV(features, balloons, projectName)}
            disabled={!hasFeatures}
            icon={FileText}
            label="Feature Table CSV"
            sublabel={hasFeatures ? `${features.length} characteristics` : 'No features yet'}
          />
          <div className="mx-2 my-1 border-t border-white/[0.08]" />
          <ExportBtn
            onClick={() => exportForm3Excel(form3Rows, projectName)}
            disabled={!hasForm3Rows}
            icon={FileSpreadsheet}
            label="AS9102 Form 3 Excel"
            sublabel={hasForm3Rows ? `${form3Rows.length} inspection rows` : 'No Form 3 rows yet'}
          />
          <ExportBtn
            onClick={() => exportForm3CSV(form3Rows, projectName)}
            disabled={!hasForm3Rows}
            icon={FileText}
            label="AS9102 Form 3 CSV"
            sublabel={hasForm3Rows ? `${form3Rows.length} inspection rows` : 'No Form 3 rows yet'}
          />
          <div className="mx-2 my-1 border-t border-white/[0.08]" />
          <ExportBtn
            onClick={onExportBalloonedPdf}
            disabled={balloons.length === 0}
            icon={FileText}
            label="Download Ballooned PDF"
            sublabel={balloons.length > 0
              ? `${balloons.length} balloon${balloons.length !== 1 ? 's' : ''}`
              : 'No balloons yet'}
          />
        </div>
      </div>
    </div>
  )
}
