export type SidebarSectionId = 'pdf' | 'balloons' | 'features' | 'form3' | 'navigator' | 'export'

export type WorkspaceMode = 'review' | 'ballooning' | 'features' | 'as9102'

export interface WorkspaceSidebarPrefs {
  isExpanded: boolean
  openSections: Partial<Record<SidebarSectionId, boolean>>
  mode: WorkspaceMode
}

// Sections that are open by default per workspace mode
export const MODE_SECTIONS: Record<WorkspaceMode, Partial<Record<SidebarSectionId, boolean>>> = {
  review:     { pdf: true,  balloons: false, features: false, form3: false, navigator: true,  export: false },
  ballooning: { pdf: true,  balloons: true,  features: false, form3: false, navigator: false, export: false },
  features:   { pdf: false, balloons: false, features: true,  form3: false, navigator: false, export: false },
  as9102:     { pdf: false, balloons: false, features: false, form3: true,  navigator: false, export: false },
}
