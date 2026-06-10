import { useState } from 'react'
import {
  FileSpreadsheet, FileText, Package, FileCheck2,
  Table2, ClipboardList, ChevronDown, Download,
} from 'lucide-react'
import type { ComponentType } from 'react'
import type { Feature } from '../../featureTable/types/featureTypes'
import type { Balloon } from '../../ballooning/types/balloonTypes'
import type { Form1Data } from '../../as9102/types/form1Types'
import type { Form2Row } from '../../as9102/types/form2Types'
import type { Form3Row } from '../../as9102/types/form3Types'
import { exportFeaturesToExcel, exportFeaturesToCSV } from '../../export/services/excelExportService'
import { exportForm3CSV, exportForm3Excel } from '../../as9102/services/form3ExportService'
import { exportForm1Excel, exportForm1CSV } from '../../as9102/services/form1ExportService'
import { exportForm2Excel, exportForm2CSV } from '../../as9102/services/form2ExportService'
import { SidebarActionCard } from './SidebarActionCard'

interface ExportSectionProps {
  isExpanded: boolean
  features: Feature[]
  balloons: Balloon[]
  form1Data: Partial<Form1Data>
  form2Rows: Form2Row[]
  form3Rows: Form3Row[]
  projectName: string
  onExportBalloonedPdf: () => void
  onOpenFairPackage: () => void
}

// ── Pill button ───────────────────────────────────────────────────────────────

function Pill({
  label,
  icon: Icon,
  onClick,
  disabled,
  wide,
}: {
  label: string
  icon?: ComponentType<{ className?: string }>
  onClick: () => void
  disabled?: boolean
  wide?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? 'No data to export' : `Download ${label}`}
      className={[
        'inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5',
        'text-[9px] font-bold uppercase tracking-wide transition-all',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/70',
        wide ? 'px-2' : '',
        disabled
          ? 'cursor-not-allowed border border-white/[0.04] bg-transparent text-gray-700'
          : 'border border-white/[0.10] bg-white/[0.05] text-gray-400 hover:border-white/[0.22] hover:bg-white/[0.10] hover:text-white',
      ].join(' ')}
    >
      {Icon && <Icon className="h-2.5 w-2.5 shrink-0" />}
      {label}
    </button>
  )
}

// ── Compact export row ────────────────────────────────────────────────────────

function ExportRow({
  icon: Icon,
  label,
  count,
  onExcel,
  onCsv,
  onPdf,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  count?: number
  onExcel?: () => void
  onCsv?: () => void
  onPdf?: () => void
}) {
  const disabled = count === 0
  return (
    <div className="flex items-center gap-2 px-3 py-[7px]">
      <Icon className="h-3 w-3 shrink-0 text-gray-600" />
      <span className={`min-w-0 flex-1 truncate text-[11px] font-medium ${disabled ? 'text-gray-600' : 'text-gray-400'}`}>
        {label}
      </span>
      {count !== undefined && count > 0 && (
        <span className="shrink-0 text-[9px] tabular-nums text-gray-600">{count}</span>
      )}
      <div className="ml-1 flex shrink-0 items-center gap-1">
        {onPdf ? (
          <Pill label="PDF" icon={FileText} onClick={onPdf} disabled={disabled} wide />
        ) : (
          <>
            <Pill label="XLS" icon={FileSpreadsheet} onClick={onExcel!} disabled={disabled} />
            <Pill label="CSV" onClick={onCsv!} disabled={disabled} />
          </>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function ExportSection({
  isExpanded,
  features,
  balloons,
  form1Data,
  form2Rows,
  form3Rows,
  projectName,
  onExportBalloonedPdf,
  onOpenFairPackage,
}: ExportSectionProps) {
  const [individualOpen, setIndividualOpen] = useState(false)

  if (!isExpanded) return null

  const hasForm1 = !!form1Data.fairIdentifier
  const fairId   = form1Data.fairIdentifier ?? projectName

  const rows = [
    {
      icon: FileCheck2,
      label: 'Form 1 · FAIR Header',
      count: hasForm1 ? 1 : 0,
      onExcel: () => exportForm1Excel(form1Data),
      onCsv:   () => exportForm1CSV(form1Data),
    },
    {
      icon: FileText,
      label: 'Form 2 · Materials',
      count: form2Rows.length,
      onExcel: () => exportForm2Excel(form2Rows, fairId),
      onCsv:   () => exportForm2CSV(form2Rows, fairId),
    },
    {
      icon: ClipboardList,
      label: 'Form 3 · Inspection',
      count: form3Rows.length,
      onExcel: () => exportForm3Excel(form3Rows, projectName),
      onCsv:   () => exportForm3CSV(form3Rows, projectName),
    },
    {
      icon: Table2,
      label: 'Feature Table',
      count: features.length,
      onExcel: () => exportFeaturesToExcel(features, balloons, projectName),
      onCsv:   () => exportFeaturesToCSV(features, balloons, projectName),
    },
    {
      icon: FileText,
      label: 'Ballooned PDF',
      count: balloons.length,
      onPdf: onExportBalloonedPdf,
    },
  ]

  const readyCount = rows.filter(r => (r.count ?? 0) > 0).length

  return (
    <div className="px-3 space-y-2">

      {/* Primary CTA */}
      <SidebarActionCard
        icon={Package}
        eyebrow="Complete Package"
        title="Export FAIR Package"
        description="ZIP: Ballooned Drawing + Form 1 · 2 · 3 + Features"
        tone="green"
        active
        onClick={onOpenFairPackage}
      />

      {/* Individual exports — collapsible */}
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] overflow-hidden">

        {/* Toggle header */}
        <button
          type="button"
          onClick={() => setIndividualOpen(o => !o)}
          className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-white/[0.04]"
        >
          <Download className="h-3.5 w-3.5 shrink-0 text-gray-500" />
          <span className="flex-1 text-[10px] font-semibold text-gray-400">Individual Exports</span>
          {readyCount > 0 && (
            <span className="rounded-full bg-white/[0.07] px-1.5 py-0.5 text-[9px] font-bold text-gray-500">
              {readyCount}
            </span>
          )}
          <ChevronDown className={[
            'h-3.5 w-3.5 shrink-0 text-gray-600 transition-transform duration-200',
            individualOpen ? 'rotate-180' : '',
          ].join(' ')} />
        </button>

        {/* Rows */}
        {individualOpen && (
          <div className="border-t border-white/[0.06] divide-y divide-white/[0.04]">
            {rows.map(row => (
              <ExportRow key={row.label} {...row} />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
