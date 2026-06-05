import { useState, useEffect } from 'react'
import { PlusCircle, TableProperties, PanelRight, PanelBottom, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Balloon } from '../../ballooning/types/balloonTypes'
import type { Feature, FeatureInput, FeatureFormData } from '../types/featureTypes'
import { FeatureTableRow } from './FeatureTableRow'
import { FeatureEditor } from './FeatureEditor'

// Sentinel: editing a new (unsaved) feature
const NEW = '__new'

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
  tableLayout,
  onToggleLayout,
  isCollapsed,
  onToggleCollapse,
}: FeatureTablePanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  // Close the new-feature editor when the selected balloon changes
  useEffect(() => {
    if (editingId === NEW) setEditingId(null)
  }, [selectedBalloonId]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedBalloon = selectedBalloonId
    ? balloons.find(b => b.id === selectedBalloonId) ?? null
    : null

  const linkedFeature = selectedBalloon
    ? features.find(f => f.balloonId === selectedBalloon.id) ?? null
    : null

  const nextFeatureNumber = features.length === 0
    ? 1
    : Math.max(...features.map(f => f.featureNumber)) + 1

  const canAddFeature =
    selectedBalloon !== null &&
    linkedFeature === null &&
    editingId !== NEW

  // ── handlers ──────────────────────────────────────────────────────────────

  const handleSaveNew = (data: FeatureFormData) => {
    if (!selectedBalloon) return
    const input: FeatureInput = {
      projectId,
      balloonId: selectedBalloon.id,
      balloonNumber: selectedBalloon.balloonNumber,
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

  // ── render ─────────────────────────────────────────────────────────────────

  const COLS = ['#', 'B', 'Type', 'Nominal', 'Tol', 'Min', 'Max', 'Units', 'Comments', '']

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
          {/* Context hint */}
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

          {/* Table */}
          {(features.length > 0 || editingId === NEW) && (
            <div className="flex-1 overflow-auto">
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
                        isLinked={selectedBalloon?.id === f.balloonId}
                        onEdit={setEditingId}
                        onDelete={handleDelete}
                        onSelectBalloon={onSelectBalloon}
                      />
                    )
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
