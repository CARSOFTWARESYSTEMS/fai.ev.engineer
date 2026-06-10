import { useState, useEffect, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { PlusCircle, TableProperties, PanelRight, PanelBottom, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Balloon } from '../../ballooning/types/balloonTypes'
import type { Form3Status } from '../../as9102/types/form3Types'
import type { Feature, FeatureInput, FeatureFormData } from '../types/featureTypes'
import { FeatureTableRow } from './FeatureTableRow'
import { FeatureEditor } from './FeatureEditor'

const NEW = '__new'
const ROW_HEIGHT = 34

interface FeatureTablePanelProps {
  features: Feature[]
  balloons: Balloon[]
  selectedBalloonId: string | null
  projectId: string
  userId: string
  onAddFeature: (input: FeatureInput) => void
  onUpdateFeature: (featureId: string, data: FeatureFormData) => void
  onDeleteFeature: (featureId: string) => void
  onSelectBalloon: (balloonId: string) => void
  statusByFeatureId: Map<string, Form3Status>
  tableLayout: 'right' | 'bottom'
  onToggleLayout: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function FeatureTablePanel({
  features,
  balloons,
  selectedBalloonId,
  projectId,
  userId,
  onAddFeature,
  onUpdateFeature,
  onDeleteFeature,
  onSelectBalloon,
  statusByFeatureId,
  tableLayout,
  onToggleLayout,
  isCollapsed,
  onToggleCollapse,
}: FeatureTablePanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editingId === NEW) setEditingId(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBalloonId])

  const selectedBalloon = selectedBalloonId
    ? balloons.find(b => b.id === selectedBalloonId) ?? null
    : null

  const linkedFeature = selectedBalloon
    ? features.find(f => f.balloonId === selectedBalloon.id) ?? null
    : null

  const nextFeatureNumber = features.length === 0
    ? 1
    : Math.max(...features.map(f => f.featureNumber)) + 1

  const canAddFeature = selectedBalloon !== null && linkedFeature === null && editingId !== NEW

  // Only virtualize when not editing (editor rows have variable height)
  const shouldVirtualize = editingId === null && features.length > 0

  const virtualizer = useVirtualizer({
    count: shouldVirtualize ? features.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 6,
    enabled: shouldVirtualize,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()
  const paddingTop = shouldVirtualize && virtualItems.length > 0 ? virtualItems[0].start : 0
  const paddingBottom = shouldVirtualize && virtualItems.length > 0
    ? totalSize - virtualItems[virtualItems.length - 1].end
    : 0

  const handleSaveNew = (data: FeatureFormData) => {
    if (!selectedBalloon) return
    const input: FeatureInput = {
      projectId,
      balloonId: selectedBalloon.id,
      balloonNumber: selectedBalloon.balloonNumber,
      pageNumber: selectedBalloon.pageNumber,
      createdBy: userId,
      ...data,
    }
    onAddFeature(input)
    setEditingId(null)
  }

  const handleSaveEdit = (featureId: string, data: FeatureFormData) => {
    onUpdateFeature(featureId, data)
    setEditingId(null)
  }

  const handleDelete = (featureId: string) => {
    if (editingId === featureId) setEditingId(null)
    onDeleteFeature(featureId)
  }

  const COLS = ['#', 'B', 'Status', 'Type', 'Nominal', 'Tol', 'Min', 'Max', 'Units', 'Comments', '']

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Panel header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0 bg-white">
        <div className="flex items-center gap-2">
          <TableProperties className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-text-primary">Feature Table</span>
          {features.length > 0 && (
            <span className="text-xs text-text-secondary bg-gray-100 rounded-full px-2 py-0.5">
              {features.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!isCollapsed && canAddFeature && (
            <button
              onClick={() => setEditingId(NEW)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-primary border border-primary rounded-lg hover:bg-primary-light transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Add Feature {selectedBalloon && `for ①${selectedBalloon.balloonNumber}`}
            </button>
          )}
          {!isCollapsed && selectedBalloon && linkedFeature && editingId !== linkedFeature.id && (
            <button
              onClick={() => setEditingId(linkedFeature.id)}
              className="text-xs text-primary hover:underline px-1"
            >
              Edit linked feature
            </button>
          )}
          {!isCollapsed && (
            <button
              onClick={onToggleLayout}
              title={tableLayout === 'right' ? 'Switch to bottom drawer' : 'Switch to right panel'}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
            >
              {tableLayout === 'right'
                ? <PanelBottom className="w-4 h-4 text-text-secondary" />
                : <PanelRight className="w-4 h-4 text-text-secondary" />
              }
            </button>
          )}
          <button
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
          >
            {isCollapsed
              ? (tableLayout === 'right'
                  ? <ChevronLeft className="w-4 h-4 text-text-secondary" />
                  : <ChevronUp className="w-4 h-4 text-text-secondary" />)
              : (tableLayout === 'right'
                  ? <ChevronRight className="w-4 h-4 text-text-secondary" />
                  : <ChevronDown className="w-4 h-4 text-text-secondary" />)
            }
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {!selectedBalloon && features.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-text-secondary">
              <TableProperties className="w-10 h-10 mb-3 text-border" />
              <p className="text-sm font-medium">Select a balloon to add a feature</p>
              <p className="text-xs mt-1">Click a balloon number on the PDF, then click <strong>Add Feature</strong></p>
            </div>
          )}

          {selectedBalloon && features.length === 0 && editingId !== NEW && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-text-secondary">
              <p className="text-sm">Balloon <strong className="text-primary">#{selectedBalloon.balloonNumber}</strong> has no linked feature yet.</p>
              <p className="text-xs mt-1">Click <strong>Add Feature</strong> above to create one.</p>
            </div>
          )}

          {(features.length > 0 || editingId === NEW) && (
            <div ref={scrollRef} className="flex-1 overflow-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    {COLS.map((col, i) => (
                      <th
                        key={i}
                        className="px-2 py-1.5 text-left text-[10px] font-semibold text-text-secondary uppercase tracking-wide border-b border-border whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Virtualized rendering when not editing */}
                  {shouldVirtualize ? (
                    <>
                      {paddingTop > 0 && (
                        <tr><td style={{ height: paddingTop }} colSpan={COLS.length} /></tr>
                      )}
                      {virtualItems.map(vRow => {
                        const f = features[vRow.index]
                        return (
                          <FeatureTableRow
                            key={f.id}
                            feature={f}
                            isSelected={selectedBalloon?.id === f.balloonId}
                            linkedBalloon={balloons.find(b => b.id === f.balloonId) ?? null}
                            status={statusByFeatureId.get(f.id) ?? 'pending'}
                            onEdit={setEditingId}
                            onDelete={handleDelete}
                            onSelectBalloon={onSelectBalloon}
                          />
                        )
                      })}
                      {paddingBottom > 0 && (
                        <tr><td style={{ height: paddingBottom }} colSpan={COLS.length} /></tr>
                      )}
                    </>
                  ) : (
                    // Full render when editing (editor row has variable height)
                    <>
                      {features.map(f =>
                        editingId === f.id ? (
                          <FeatureEditor
                            key={f.id}
                            feature={f}
                            balloonNumber={f.balloonNumber}
                            defaultFeatureNumber={f.featureNumber}
                            onSave={(data) => handleSaveEdit(f.id, data)}
                            onCancel={() => setEditingId(null)}
                          />
                        ) : (
                          <FeatureTableRow
                            key={f.id}
                            feature={f}
                            isSelected={selectedBalloon?.id === f.balloonId}
                            linkedBalloon={balloons.find(b => b.id === f.balloonId) ?? null}
                            status={statusByFeatureId.get(f.id) ?? 'pending'}
                            onEdit={setEditingId}
                            onDelete={handleDelete}
                            onSelectBalloon={onSelectBalloon}
                          />
                        )
                      )}
                    </>
                  )}
                  {editingId === NEW && selectedBalloon && (
                    <FeatureEditor
                      feature={null}
                      balloonNumber={selectedBalloon.balloonNumber}
                      defaultFeatureNumber={nextFeatureNumber}
                      onSave={handleSaveNew}
                      onCancel={() => setEditingId(null)}
                    />
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
