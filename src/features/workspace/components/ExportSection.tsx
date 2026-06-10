import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import type { Feature } from '../../featureTable/types/featureTypes'
import type { Balloon } from '../../ballooning/types/balloonTypes'
import { exportFeaturesToExcel, exportFeaturesToCSV } from '../../export/services/excelExportService'
import { exportForm3CSV, exportForm3Excel } from '../../as9102/services/form3ExportService'
import type { Form3Row } from '../../as9102/types/form3Types'
import { SidebarActionButton, SidebarActionCard } from './SidebarActionCard'

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
  onClick: () => void
  disabled?: boolean
  icon: React.ComponentType<{ className?: string }>
  label: string
  sublabel?: string
}) {
  return (
    <SidebarActionButton
      icon={Icon}
      onClick={onClick}
      disabled={disabled}
      label={label}
      description={sublabel}
      title={disabled ? 'No data to export' : label}
    />
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
  const availableDeliverables =
    (hasFeatures ? 2 : 0) +
    (hasForm3Rows ? 2 : 0) +
    (balloons.length > 0 ? 1 : 0)

  return (
    <div className="px-3">
      <SidebarActionCard
        icon={Download}
        eyebrow="Ready for Export"
        title="Export Deliverables"
        description={`${availableDeliverables} deliverable${availableDeliverables !== 1 ? 's' : ''} available`}
        tone="blue"
        active
      >
        <div className="mt-3 space-y-1.5 border-t border-white/[0.08] pt-3">
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
      </SidebarActionCard>
    </div>
  )
}
