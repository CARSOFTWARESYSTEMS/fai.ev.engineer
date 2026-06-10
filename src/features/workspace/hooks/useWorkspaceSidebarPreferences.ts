import { useState, useCallback } from 'react'
import type { SidebarSectionId, WorkspaceMode } from '../types/workspaceTypes'
import { MODE_SECTIONS } from '../types/workspaceTypes'

const KEYS = {
  expanded: 'fai-workspace-sidebar-expanded',
  sections: 'fai-workspace-sidebar-sections',
  mode:     'fai-workspace-mode',
}

const DEFAULT_OPEN: Partial<Record<SidebarSectionId, boolean>> = {
  pdf:       true,
  balloons:  true,
  features:  true,
  form3:     false,
  navigator: false,
  export:    false,
}

function readExpanded(): boolean {
  const v = localStorage.getItem(KEYS.expanded)
  return v === null ? true : v === 'true'
}

function readSections(): Partial<Record<SidebarSectionId, boolean>> {
  try {
    const raw = localStorage.getItem(KEYS.sections)
    return raw ? (JSON.parse(raw) as Partial<Record<SidebarSectionId, boolean>>) : {}
  } catch {
    return {}
  }
}

function readMode(): WorkspaceMode {
  const v = localStorage.getItem(KEYS.mode) as WorkspaceMode | null
  const valid: WorkspaceMode[] = ['review', 'ballooning', 'features', 'as9102', 'export']
  return (v && valid.includes(v)) ? v : 'ballooning'
}

export function useWorkspaceSidebarPreferences() {
  const [isExpanded, setIsExpanded] = useState<boolean>(readExpanded)
  const [savedSections, setSavedSections] = useState<Partial<Record<SidebarSectionId, boolean>>>(readSections)
  const [workspaceMode, setWorkspaceModeState] = useState<WorkspaceMode>(readMode)

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => {
      const next = !prev
      localStorage.setItem(KEYS.expanded, String(next))
      return next
    })
  }, [])

  const isSectionOpen = useCallback(
    (id: SidebarSectionId): boolean => {
      const saved = savedSections[id]
      return saved !== undefined ? saved : (DEFAULT_OPEN[id] ?? true)
    },
    [savedSections],
  )

  const toggleSection = useCallback((id: SidebarSectionId) => {
    setSavedSections(prev => {
      const current = prev[id] !== undefined ? prev[id]! : (DEFAULT_OPEN[id] ?? true)
      const next = { ...prev, [id]: !current }
      localStorage.setItem(KEYS.sections, JSON.stringify(next))
      return next
    })
  }, [])

  const setWorkspaceMode = useCallback((mode: WorkspaceMode) => {
    setWorkspaceModeState(mode)
    localStorage.setItem(KEYS.mode, mode)
    // Auto-open sections for this mode
    const modeSections = MODE_SECTIONS[mode]
    setSavedSections(prev => {
      const next = { ...prev, ...modeSections }
      localStorage.setItem(KEYS.sections, JSON.stringify(next))
      return next
    })
  }, [])

  return {
    isExpanded,
    toggleExpanded,
    isSectionOpen,
    toggleSection,
    workspaceMode,
    setWorkspaceMode,
  }
}
