import { FileSpreadsheet, FileText, Lock } from 'lucide-react'
import type { Feature } from '../../featureTable/types/featureTypes'
import type { Balloon } from '../../ballooning/types/balloonTypes'
import { exportFeaturesToExcel, exportFeaturesToCSV } from '../../export/services/excelExportService'

interface ExportSectionProps {
  isExpanded: boolean
  features: Feature[]
  balloons: Balloon[]
  projectName: string
  onExportBalloonedPdf: () => void
}

function ExportBtn({
  onClick, disabled, icon: Icon, label, sublabel, comingSoon,
}: {
  onClick?: () => void
  disabled?: boolean
  icon: React.ComponentType<{ className?: string }>
  label: string
  sublabel?: string
  comingSoon?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || comingSoon}
      title={comingSoon ? 'Coming soon' : disabled ? 'No data to export' : label}
      className={[
        'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-left text-xs transition-colors',
        comingSoon
          ? 'opacity-35 cursor-not-allowed text-gray-500'
          : disabled
            ? 'opacity-35 cursor-not-allowed text-gray-500'
            : 'text-gray-300 hover:bg-white/[0.06] hover:text-white',
      ].join(' ')}
    >
      {comingSoon
        ? <Lock className="w-3.5 h-3.5 shrink-0 text-gray-600" />
        : <Icon className={`w-3.5 h-3.5 shrink-0 ${disabled ? 'text-gray-600' : 'text-gray-400'}`} />
      }
      <div className="flex-1 min-w-0">
        <div className="font-medium leading-none">{label}</div>
        {sublabel && <div className="text-[9px] text-gray-600 mt-0.5">{sublabel}</div>}
      </div>
      {comingSoon && (
        <span className="text-[8px] font-bold tracking-wider text-gray-600 uppercase shrink-0">Soon</span>
      )}
    </button>
  )
}

export function ExportSection({
  isExpanded,
  features,
  balloons,
  projectName,
  onExportBalloonedPdf,
}: ExportSectionProps) {
  if (!isExpanded) return null

  const hasFeatures = features.length > 0

  return (
    <div className="px-3 space-y-0.5">
      {/* Feature Table exports */}
      <p className="text-[9px] font-semibold tracking-[0.1em] text-gray-600 uppercase px-0 pb-1 pt-0.5">
        Feature Table
      </p>
      <ExportBtn
        onClick={() => exportFeaturesToExcel(features, balloons, projectName)}
        disabled={!hasFeatures}
        icon={FileSpreadsheet}
        label="Export Excel"
        sublabel={hasFeatures ? `${features.length} feature${features.length !== 1 ? 's' : ''}` : 'No features yet'}
      />
      <ExportBtn
        onClick={() => exportFeaturesToCSV(features, balloons, projectName)}
        disabled={!hasFeatures}
        icon={FileText}
        label="Export CSV"
        sublabel={hasFeatures ? `${features.length} feature${features.length !== 1 ? 's' : ''}` : 'No features yet'}
      />

      {/* Form 3 exports */}
      <p className="text-[9px] font-semibold tracking-[0.1em] text-gray-600 uppercase px-0 pt-3 pb-1">
        AS9102 Form 3
      </p>
      <div className="bg-white/[0.02] rounded-lg px-3 py-2 border border-white/[0.04]">
        <p className="text-[9px] text-gray-600 leading-relaxed">
          Open Form 3 panel to export inspection results as Excel or CSV.
        </p>
      </div>

      {/* PDF exports */}
      <p className="text-[9px] font-semibold tracking-[0.1em] text-gray-600 uppercase px-0 pt-3 pb-1">
        PDF
      </p>
      <ExportBtn
        onClick={onExportBalloonedPdf}
        icon={FileText}
        label="Ballooned PDF"
        sublabel={`${balloons.length} balloon${balloons.length !== 1 ? 's' : ''}`}
      />

      <p className="text-[9px] font-semibold tracking-[0.1em] text-gray-600 uppercase px-0 pt-3 pb-1">
        Coming Soon
      </p>
      <ExportBtn icon={FileText} label="Project Backup" sublabel="Full project archive" comingSoon />
    </div>
  )
}
