export type SidebarSectionId = 'pdf' | 'balloons' | 'features' | 'form3' | 'navigator' | 'export'

export type WorkspaceMode = 'review' | 'ballooning' | 'features' | 'as9102' | 'export'

export interface WorkspaceSidebarPrefs {
  isExpanded: boolean
  openSections: Partial<Record<SidebarSectionId, boolean>>
  mode: WorkspaceMode
}

export const MODE_VISIBLE_SECTIONS: Record<WorkspaceMode, SidebarSectionId[]> = {
  review: ['pdf', 'navigator'],
  ballooning: ['balloons', 'navigator'],
  features: ['features', 'navigator'],
  as9102: ['form3'],
  export: ['export'],
}

// Sections that are open by default per workspace mode
export const MODE_SECTIONS: Record<WorkspaceMode, Partial<Record<SidebarSectionId, boolean>>> = {
  review:     { pdf: true,  balloons: false, features: false, form3: false, navigator: true,  export: false },
  ballooning: { pdf: false, balloons: true,  features: false, form3: false, navigator: true,  export: false },
  features:   { pdf: false, balloons: false, features: true,  form3: false, navigator: true,  export: false },
  as9102:     { pdf: false, balloons: false, features: false, form3: true,  navigator: false, export: false },
  export:     { pdf: false, balloons: false, features: false, form3: false, navigator: false, export: true },
}
