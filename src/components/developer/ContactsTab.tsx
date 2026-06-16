import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Phone, Mail, MessageCircle, ChevronDown, ChevronRight,
  Search, Users, AlertCircle, Loader2, UserX,
  Building2, Clock, Globe, Trash2, FolderOpen, Folder,
  FileText, ExternalLink, ArrowRight,
} from 'lucide-react'
import {
  subscribeAllUsers,
  groupUsersBySignupDomain,
  buildContactLinks,
  domainDisplayLabel,
  deleteUserData,
  deleteProjectData,
  LEGACY_DOMAIN,
  type DirectoryUser,
} from '../../services/userDirectoryService'
import { getUserProjects } from '../../projects/project.service'
import type { FAIProject } from '../../projects/project.types'
import type { UserRole } from '../../auth/AuthTypes'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(ts: unknown): string {
  if (!ts) return '—'
  try {
    const d = typeof (ts as { toDate?: () => Date }).toDate === 'function'
      ? (ts as { toDate: () => Date }).toDate()
      : new Date(ts as string)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return '—' }
}

function roleBadgeClass(role: UserRole): string {
  const map: Record<UserRole, string> = {
    super_admin: 'bg-purple-100 text-purple-700 border-purple-200',
    admin:       'bg-red-100 text-red-700 border-red-200',
    manager:     'bg-amber-100 text-amber-700 border-amber-200',
    engineer:    'bg-blue-100 text-blue-700 border-blue-200',
    user:        'bg-gray-100 text-gray-600 border-gray-200',
  }
  return map[role] ?? map.user
}

const PROJECT_STATUS: Record<string, { label: string; cls: string }> = {
  'draft':       { label: 'Draft',       cls: 'bg-slate-100  text-slate-600'  },
  'in-progress': { label: 'In Progress', cls: 'bg-blue-100   text-blue-700'   },
  'review':      { label: 'Review',      cls: 'bg-amber-100  text-amber-700'  },
  'completed':   { label: 'Completed',   cls: 'bg-green-100  text-green-700'  },
  'complete':    { label: 'Completed',   cls: 'bg-green-100  text-green-700'  },
  'archived':    { label: 'Archived',    cls: 'bg-gray-100   text-gray-500'   },
}

function ProjectStatusBadge({ status }: { status: string }) {
  const s = PROJECT_STATUS[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.cls}`}>
      {s.label}
    </span>
  )
}

function Avatar({ user }: { user: DirectoryUser }) {
  const initials = (user.displayName || user.email || '?')
    .split(' ').slice(0, 2).map(s => s[0]?.toUpperCase() ?? '').join('')
  return (
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
      <span className="text-xs font-bold text-primary">{initials || '?'}</span>
    </div>
  )
}

// ─── Shared: Step-2 Name Confirm Modal ────────────────────────────────────────
// Reused for both user and project delete. Admin must type the exact name.

function NameConfirmModal({
  title,
  expectedName,
  inputLabel,
  queueLabel,
  onConfirm,
  onCancel,
  deleting,
}: {
  title:        string
  expectedName: string
  inputLabel:   string
  queueLabel?:  string   // e.g. "Deleting 2 of 6 users"
  onConfirm:    () => void
  onCancel:     () => void
  deleting:     boolean
}) {
  const [value, setValue] = useState('')
  const matches = value.trim() === expectedName.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-border max-w-sm w-full p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-text-primary">{title}</h2>
            {queueLabel && (
              <p className="text-xs text-text-secondary mt-0.5">{queueLabel}</p>
            )}
          </div>
        </div>

        {/* Instruction */}
        <p className="text-sm text-text-secondary mb-1">
          {inputLabel} <strong className="text-text-primary break-all">"{expectedName}"</strong> to confirm:
        </p>
        <input
          autoFocus
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && matches && !deleting) onConfirm() }}
          placeholder={expectedName}
          className={[
            'w-full mt-1 mb-4 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors focus:outline-none',
            matches
              ? 'border-red-400 bg-red-50/40 text-red-700 focus:ring-2 focus:ring-red-200'
              : 'border-border focus:ring-2 focus:ring-primary/20',
          ].join(' ')}
        />

        {/* Match hint */}
        <div className={`text-xs mb-5 transition-opacity ${value.length > 0 && !matches ? 'opacity-100' : 'opacity-0'}`}>
          <span className="text-red-500">Name does not match — check spelling and capitalization.</span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-text-primary border border-border rounded-xl hover:bg-background transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!matches || deleting}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {deleting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting…</>
              : <><Trash2 className="w-4 h-4" /> Delete</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Step-1: User Delete Info Modal ──────────────────────────────────────────
// Shows who will be deleted + warning. "Proceed →" advances to name confirm.

function UserDeleteInfoModal({
  users,
  onProceed,
  onCancel,
}: {
  users:     DirectoryUser[]
  onProceed: () => void
  onCancel:  () => void
}) {
  const isBulk = users.length > 1
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-border max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">
              {isBulk ? `Delete ${users.length} users?` : 'Delete user?'}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Step 1 of 2 — review before confirming
            </p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4 max-h-44 overflow-y-auto space-y-2">
          {users.map(u => (
            <div key={u.uid} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <span className="text-[11px] font-bold text-red-600">
                  {(u.displayName || u.email || '?')[0].toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary leading-tight truncate">
                  {u.displayName || '(No name)'}
                </p>
                <p className="text-xs text-text-secondary truncate">{u.email}</p>
              </div>
            </div>
          ))}
        </div>

        <div
          className="text-xs rounded-lg border px-3 py-2.5 mb-5 space-y-1"
          style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.25)' }}
        >
          <p className="font-semibold text-amber-700">What will be deleted:</p>
          <ul className="text-amber-700 list-disc list-inside space-y-0.5">
            <li>Firestore user profile</li>
            <li>Partner admin record (if any)</li>
          </ul>
          <p className="font-semibold text-amber-700 mt-1">What is preserved:</p>
          <ul className="text-amber-700 list-disc list-inside space-y-0.5">
            <li>All projects and drawing data</li>
            <li>Google sign-in account (Firebase Auth)</li>
          </ul>
          {isBulk && (
            <p className="text-amber-600 mt-1 font-medium">
              You will confirm each user by name — one at a time.
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-text-primary border border-border rounded-xl hover:bg-background transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onProceed}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            Proceed <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Project Sub-panel ────────────────────────────────────────────────────────

function ProjectSubPanel({ uid }: { uid: string }) {
  const [projects,           setProjects]           = useState<FAIProject[] | null>(null)
  const [loading,            setLoading]            = useState(true)
  // Step 1: info modal
  const [infoProject,        setInfoProject]        = useState<FAIProject | null>(null)
  // Step 2: name-confirm modal
  const [nameConfirmProject, setNameConfirmProject] = useState<FAIProject | null>(null)
  const [deletingProj,       setDeletingProj]       = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getUserProjects(uid).then(list => {
      if (!cancelled) { setProjects(list); setLoading(false) }
    })
    return () => { cancelled = true }
  }, [uid])

  function openDeleteFlow(p: FAIProject) {
    setInfoProject(p)
  }

  function proceedToNameConfirm() {
    if (!infoProject) return
    setNameConfirmProject(infoProject)
    setInfoProject(null)
  }

  async function handleDeleteProject() {
    if (!nameConfirmProject) return
    setDeletingProj(true)
    try {
      await deleteProjectData(nameConfirmProject.projectId)
      setProjects(prev => prev?.filter(p => p.projectId !== nameConfirmProject.projectId) ?? null)
    } catch (err) {
      console.error('Project delete failed:', err)
    } finally {
      setDeletingProj(false)
      setNameConfirmProject(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3 px-4 text-xs text-text-secondary">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Loading projects…
      </div>
    )
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="flex items-center gap-2 py-3 px-4 text-xs text-text-secondary">
        <FolderOpen className="w-3.5 h-3.5 opacity-50" />
        No projects found for this user.
      </div>
    )
  }

  return (
    <>
      {/* Project Step 1 — info */}
      {infoProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-border max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-text-primary">Delete project?</h2>
                <p className="text-xs text-text-secondary mt-0.5">Step 1 of 2 — review before confirming</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-border rounded-xl px-4 py-3 mb-4">
              <p className="font-semibold text-text-primary truncate">{infoProject.projectName || '(Untitled)'}</p>
              {infoProject.partNumber && (
                <p className="text-xs text-text-secondary font-mono mt-0.5">{infoProject.partNumber}</p>
              )}
            </div>

            <div
              className="text-xs rounded-lg border px-3 py-2.5 mb-5"
              style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.25)' }}
            >
              <p className="text-amber-700">
                <strong>Note:</strong> This removes the Firestore project record. Sub-collections (balloons, features, forms) and Google Drive files are <strong>not</strong> deleted automatically.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setInfoProject(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-text-primary border border-border rounded-xl hover:bg-background transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={proceedToNameConfirm}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Proceed <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Step 2 — type name */}
      {nameConfirmProject && (
        <NameConfirmModal
          title="Type project name to confirm"
          expectedName={nameConfirmProject.projectName || '(Untitled)'}
          inputLabel="Type the project name"
          onConfirm={handleDeleteProject}
          onCancel={() => setNameConfirmProject(null)}
          deleting={deletingProj}
        />
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50/80 text-text-secondary uppercase tracking-wide border-b border-border/40">
              <th className="py-2 px-4 text-left font-semibold">Project Name</th>
              <th className="py-2 px-4 text-left font-semibold">Part #</th>
              <th className="py-2 px-4 text-left font-semibold">Drawing #</th>
              <th className="py-2 px-4 text-left font-semibold">Status</th>
              <th className="py-2 px-4 text-left font-semibold">Updated</th>
              <th className="py-2 px-4 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.projectId} className="border-b border-border/30 hover:bg-slate-50/60 transition-colors">
                <td className="py-2 px-4 font-medium text-text-primary max-w-[180px]">
                  <div className="flex items-center gap-1.5 truncate">
                    <FileText className="w-3 h-3 text-primary/60 shrink-0" />
                    <span className="truncate">{p.projectName || '(Untitled)'}</span>
                  </div>
                </td>
                <td className="py-2 px-4 font-mono text-text-secondary">{p.partNumber || '—'}</td>
                <td className="py-2 px-4 font-mono text-text-secondary">
                  {p.drawingNumber
                    ? `${p.drawingNumber}${p.drawingRevision ? ` Rev ${p.drawingRevision}` : ''}`
                    : '—'}
                </td>
                <td className="py-2 px-4"><ProjectStatusBadge status={p.status} /></td>
                <td className="py-2 px-4 text-text-secondary whitespace-nowrap">{fmtDate(p.updatedAt)}</td>
                <td className="py-2 px-4">
                  <div className="flex items-center gap-1">
                    {p.googleDriveViewUrl ? (
                      <a
                        href={p.googleDriveViewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View PDF in Google Drive"
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border/70 text-text-secondary/60 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span title="No PDF uploaded" className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border/40 text-text-secondary/25 cursor-not-allowed">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <button
                      onClick={() => openDeleteFlow(p)}
                      title="Delete project"
                      className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border/70 text-text-secondary/50 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 text-[10px] text-text-secondary/60">
          {projects.length} project{projects.length !== 1 ? 's' : ''} total
        </div>
      </div>
    </>
  )
}

// ─── Summary Cards ────────────────────────────────────────────────────────────

function SummaryCards({ users }: { users: DirectoryUser[] }) {
  const grouped   = groupUsersBySignupDomain(users)
  const domains   = [...grouped.keys()].filter(k => k !== LEGACY_DOMAIN)
  const legacy    = grouped.get(LEGACY_DOMAIN)?.length ?? 0
  const missingPh = users.filter(u => !u.mobileNumber?.trim()).length
  const cards = [
    { label: 'Total Users',      value: users.length,   color: 'text-primary'     },
    { label: 'Known Domains',    value: domains.length, color: 'text-emerald-600' },
    { label: 'Legacy / Unknown', value: legacy,         color: 'text-amber-600'   },
    { label: 'Missing Phone',    value: missingPh,      color: 'text-red-600'     },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {cards.map(c => (
        <div key={c.label} className="bg-white border border-border rounded-xl p-4 shadow-sm">
          <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          <p className="text-xs text-text-secondary mt-0.5">{c.label}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Contact Action Buttons ───────────────────────────────────────────────────

function ContactActions({ user }: { user: DirectoryUser }) {
  const links = buildContactLinks(user)
  return (
    <div className="flex items-center gap-1">
      <a
        href={links.tel ?? undefined}
        onClick={links.tel ? undefined : e => e.preventDefault()}
        title={links.tel ? `Call ${user.displayName}` : 'No phone number'}
        className={[
          'inline-flex items-center justify-center w-7 h-7 rounded-lg border text-xs transition-colors',
          links.tel
            ? 'border-border text-text-secondary hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50'
            : 'border-border/50 text-text-secondary/30 cursor-not-allowed',
        ].join(' ')}
      >
        <Phone className="w-3.5 h-3.5" />
      </a>
      <a
        href={links.mailto}
        title={`Email ${user.displayName}`}
        className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border text-text-secondary hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors"
      >
        <Mail className="w-3.5 h-3.5" />
      </a>
      <a
        href={links.whatsapp ?? undefined}
        target="_blank"
        rel="noopener noreferrer"
        onClick={links.whatsapp ? undefined : e => e.preventDefault()}
        title={links.whatsapp ? `WhatsApp ${user.displayName}` : 'No phone number'}
        className={[
          'inline-flex items-center justify-center w-7 h-7 rounded-lg border text-xs transition-colors',
          links.whatsapp
            ? 'border-border text-text-secondary hover:text-green-600 hover:border-green-300 hover:bg-green-50'
            : 'border-border/50 text-text-secondary/30 cursor-not-allowed',
        ].join(' ')}
      >
        <MessageCircle className="w-3.5 h-3.5" />
      </a>
    </div>
  )
}

// ─── User Row (desktop table) ─────────────────────────────────────────────────

function UserRow({
  user, selected, onToggle, onDelete,
}: {
  user: DirectoryUser; selected: boolean; onToggle: () => void; onDelete: () => void
}) {
  const [projectsOpen, setProjectsOpen] = useState(false)
  return (
    <>
      <tr className={`border-b border-border/50 transition-colors ${selected ? 'bg-red-50/40' : projectsOpen ? 'bg-primary/5' : 'hover:bg-background/50'}`}>
        <td className="py-3 pl-4 pr-2 w-8">
          <input type="checkbox" checked={selected} onChange={onToggle}
            className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer" />
        </td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar user={user} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{user.displayName || '(No name)'}</p>
              {!user.profileCompleted && (
                <span className="text-[10px] text-amber-600 font-medium">Profile incomplete</span>
              )}
            </div>
          </div>
        </td>
        <td className="py-3 px-4 text-sm text-text-secondary truncate max-w-[160px]">{user.email}</td>
        <td className="py-3 px-4 text-sm text-text-secondary font-mono">
          {user.mobileNumber?.trim() || <span className="text-text-secondary/40 not-italic font-sans">—</span>}
        </td>
        <td className="py-3 px-4 text-sm text-text-secondary truncate max-w-[140px]">
          {user.organizationName || <span className="text-text-secondary/40">—</span>}
        </td>
        <td className="py-3 px-4">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${roleBadgeClass(user.role)}`}>
            {user.role}
          </span>
        </td>
        <td className="py-3 px-4 text-xs text-text-secondary whitespace-nowrap">{fmtDate(user.lastLoginAt)}</td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-1">
            <ContactActions user={user} />
            <button
              onClick={() => setProjectsOpen(o => !o)}
              title={projectsOpen ? 'Hide projects' : 'View projects'}
              className={[
                'inline-flex items-center justify-center w-7 h-7 rounded-lg border text-xs transition-colors ml-1',
                projectsOpen
                  ? 'border-primary/40 text-primary bg-primary/10'
                  : 'border-border/70 text-text-secondary/60 hover:text-primary hover:border-primary/40 hover:bg-primary/5',
              ].join(' ')}
            >
              {projectsOpen ? <FolderOpen className="w-3.5 h-3.5" /> : <Folder className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onDelete}
              title={`Delete ${user.displayName || user.email}`}
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border/70 text-text-secondary/50 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>
      {projectsOpen && (
        <tr className="border-b border-border/50">
          <td />
          <td colSpan={7} className="p-0">
            <div className="bg-slate-50/60 border-l-2 border-primary/30 ml-4 mr-4 my-2 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-border/40 bg-white/60">
                <FolderOpen className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-text-primary">
                  Projects by {user.displayName || user.email}
                </span>
              </div>
              <ProjectSubPanel uid={user.uid} />
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ─── User Card (mobile) ───────────────────────────────────────────────────────

function UserCard({
  user, selected, onToggle, onDelete,
}: {
  user: DirectoryUser; selected: boolean; onToggle: () => void; onDelete: () => void
}) {
  const [projectsOpen, setProjectsOpen] = useState(false)
  return (
    <div className={`border rounded-xl shadow-sm transition-colors ${selected ? 'bg-red-50/40 border-red-200' : 'bg-white border-border'}`}>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <input type="checkbox" checked={selected} onChange={onToggle}
              className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer shrink-0" />
            <Avatar user={user} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">{user.displayName || '(No name)'}</p>
              <p className="text-xs text-text-secondary truncate">{user.email}</p>
            </div>
          </div>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${roleBadgeClass(user.role)}`}>
            {user.role}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {user.mobileNumber?.trim() && (
            <div className="flex items-center gap-1 text-text-secondary">
              <Phone className="w-3 h-3 shrink-0" /><span className="font-mono truncate">{user.mobileNumber}</span>
            </div>
          )}
          {user.organizationName && (
            <div className="flex items-center gap-1 text-text-secondary">
              <Building2 className="w-3 h-3 shrink-0" /><span className="truncate">{user.organizationName}</span>
            </div>
          )}
          {user.lastLoginAt && (
            <div className="flex items-center gap-1 text-text-secondary">
              <Clock className="w-3 h-3 shrink-0" /><span>{fmtDate(user.lastLoginAt)}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <ContactActions user={user} />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setProjectsOpen(o => !o)}
              className={[
                'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors',
                projectsOpen
                  ? 'text-primary border-primary/40 bg-primary/10'
                  : 'text-text-secondary border-border hover:text-primary hover:border-primary/30 hover:bg-primary/5',
              ].join(' ')}
            >
              {projectsOpen ? <FolderOpen className="w-3.5 h-3.5" /> : <Folder className="w-3.5 h-3.5" />}
              Projects
            </button>
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-200 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      </div>
      {projectsOpen && (
        <div className="border-t border-border bg-slate-50/60">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border/40">
            <FolderOpen className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-text-primary">Projects</span>
          </div>
          <ProjectSubPanel uid={user.uid} />
        </div>
      )}
    </div>
  )
}

// ─── Domain Group ─────────────────────────────────────────────────────────────

function DomainGroup({
  domain, users, defaultOpen, selectedUids, onToggleUser, onToggleAll, onRequestDelete,
}: {
  domain: string; users: DirectoryUser[]; defaultOpen: boolean
  selectedUids: Set<string>
  onToggleUser: (uid: string) => void
  onToggleAll: (uids: string[], allSelected: boolean) => void
  onRequestDelete: (users: DirectoryUser[]) => void
}) {
  const [open, setOpen] = useState(defaultOpen)
  const label    = domainDisplayLabel(domain)
  const isLegacy = domain === LEGACY_DOMAIN
  const uids         = users.map(u => u.uid)
  const selectedHere = uids.filter(id => selectedUids.has(id))
  const allSelected  = selectedHere.length === users.length && users.length > 0
  const someSelected = selectedHere.length > 0 && !allSelected

  return (
    <div className="border border-border rounded-xl overflow-hidden mb-3">
      <div className="flex items-center bg-white hover:bg-background/50 transition-colors">
        <div className="pl-4 pr-2 py-3 shrink-0" onClick={e => e.stopPropagation()}>
          <input
            type="checkbox" checked={allSelected}
            ref={el => { if (el) el.indeterminate = someSelected }}
            onChange={() => onToggleAll(uids, allSelected)}
            className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
            title={allSelected ? 'Deselect all in group' : 'Select all in group'}
          />
        </div>
        <button onClick={() => setOpen(o => !o)} className="flex-1 flex items-center justify-between px-3 py-3">
          <div className="flex items-center gap-2.5">
            <Globe className={`w-4 h-4 ${isLegacy ? 'text-text-secondary/50' : 'text-primary'}`} />
            <span className={`text-sm font-semibold ${isLegacy ? 'text-text-secondary' : 'text-text-primary'}`}>{label}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {users.length} {users.length === 1 ? 'user' : 'users'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {selectedHere.length > 0 && (
              <span className="text-xs text-red-600 font-medium">{selectedHere.length} selected</span>
            )}
            {open ? <ChevronDown className="w-4 h-4 text-text-secondary" /> : <ChevronRight className="w-4 h-4 text-text-secondary" />}
          </div>
        </button>
      </div>

      {selectedHere.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-red-50 border-t border-red-100">
          <span className="text-xs text-red-700 font-medium">
            {selectedHere.length} user{selectedHere.length > 1 ? 's' : ''} selected in this group
          </span>
          <button
            onClick={() => onRequestDelete(users.filter(u => selectedUids.has(u.uid)))}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete {selectedHere.length > 1 ? `${selectedHere.length} users` : 'user'}
          </button>
        </div>
      )}

      {open && (
        <div className="border-t border-border">
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-background text-xs text-text-secondary uppercase tracking-wide">
                  <th className="py-2 pl-4 pr-2 w-8" />
                  <th className="py-2 px-4 text-left font-semibold">Name</th>
                  <th className="py-2 px-4 text-left font-semibold">Email</th>
                  <th className="py-2 px-4 text-left font-semibold">Phone</th>
                  <th className="py-2 px-4 text-left font-semibold">Organization</th>
                  <th className="py-2 px-4 text-left font-semibold">Role</th>
                  <th className="py-2 px-4 text-left font-semibold">Last Login</th>
                  <th className="py-2 px-4 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <UserRow key={u.uid} user={u}
                    selected={selectedUids.has(u.uid)}
                    onToggle={() => onToggleUser(u.uid)}
                    onDelete={() => onRequestDelete([u])}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="sm:hidden p-3 space-y-2">
            {users.map(u => (
              <UserCard key={u.uid} user={u}
                selected={selectedUids.has(u.uid)}
                onToggle={() => onToggleUser(u.uid)}
                onDelete={() => onRequestDelete([u])}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main ContactsTab ─────────────────────────────────────────────────────────

const ROLE_OPTIONS: Array<UserRole | 'all'> = ['all', 'engineer', 'manager', 'admin', 'super_admin', 'user']

export function ContactsTab() {
  const [allUsers,     setAllUsers]     = useState<DirectoryUser[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(false)
  const [search,       setSearch]       = useState('')
  const [roleFilter,   setRoleFilter]   = useState<UserRole | 'all'>('all')
  const [domainFilter, setDomainFilter] = useState<string>('all')
  const [selectedUids, setSelectedUids] = useState<Set<string>>(new Set())

  // ── Delete flow state ──────────────────────────────────────────────────────
  // Step 1: info modal — show who is being deleted + warning
  const [infoUsers,  setInfoUsers]  = useState<DirectoryUser[] | null>(null)
  // Step 2: name-confirm queue — process one user at a time
  const [nameQueue,  setNameQueue]  = useState<DirectoryUser[]>([])
  const [currentUser, setCurrentUser] = useState<DirectoryUser | null>(null)
  const [deleting,   setDeleting]   = useState(false)
  const [doneCount,  setDoneCount]  = useState(0)   // how many in this bulk run we've deleted so far

  useEffect(() => {
    setLoading(true)
    const unsub = subscribeAllUsers(users => {
      setAllUsers(users); setLoading(false); setError(false)
    })
    return unsub
  }, [])

  const availableDomains = useMemo(() => {
    const set = new Set<string>()
    for (const u of allUsers) set.add(u.signupDomain || LEGACY_DOMAIN)
    return [...set].sort((a, b) => {
      if (a === LEGACY_DOMAIN) return 1
      if (b === LEGACY_DOMAIN) return -1
      return a.localeCompare(b)
    })
  }, [allUsers])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return allUsers.filter(u => {
      if (roleFilter   !== 'all' && u.role !== roleFilter)                              return false
      if (domainFilter !== 'all' && (u.signupDomain || LEGACY_DOMAIN) !== domainFilter) return false
      if (!q) return true
      return (
        u.displayName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.mobileNumber?.includes(q) ||
        u.organizationName?.toLowerCase().includes(q)
      )
    })
  }, [allUsers, search, roleFilter, domainFilter])

  const grouped = useMemo(() => groupUsersBySignupDomain(filtered), [filtered])

  const onToggleUser = useCallback((uid: string) => {
    setSelectedUids(prev => {
      const next = new Set(prev)
      if (next.has(uid)) next.delete(uid); else next.add(uid)
      return next
    })
  }, [])

  const onToggleAll = useCallback((uids: string[], allSelected: boolean) => {
    setSelectedUids(prev => {
      const next = new Set(prev)
      if (allSelected) { uids.forEach(id => next.delete(id)) }
      else             { uids.forEach(id => next.add(id))    }
      return next
    })
  }, [])

  // Called when trash is clicked (single or group bulk)
  function requestDelete(users: DirectoryUser[]) {
    setDoneCount(0)
    setInfoUsers(users)
  }

  // Step 1 → Step 2: advance from info modal to first name-confirm
  function proceedToNameConfirm() {
    if (!infoUsers) return
    const [first, ...rest] = infoUsers
    setInfoUsers(null)
    setCurrentUser(first)
    setNameQueue(rest)
  }

  // Step 2 confirm: delete current user, then advance queue
  async function handleDeleteCurrent() {
    if (!currentUser) return
    setDeleting(true)
    try {
      await deleteUserData(currentUser.uid)
      setDoneCount(n => n + 1)
      setSelectedUids(prev => { const next = new Set(prev); next.delete(currentUser.uid); return next })
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeleting(false)
      if (nameQueue.length > 0) {
        const [next, ...rest] = nameQueue
        setCurrentUser(next)
        setNameQueue(rest)
      } else {
        setCurrentUser(null)
      }
    }
  }

  function cancelDelete() {
    setInfoUsers(null)
    setCurrentUser(null)
    setNameQueue([])
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }
  if (error) {
    return (
      <div className="flex items-center justify-center py-16 gap-3 text-error">
        <AlertCircle className="w-5 h-5" />
        <span className="text-sm">Failed to load users. Check Firestore permissions.</span>
      </div>
    )
  }

  const totalInRun = doneCount + (currentUser ? 1 : 0) + nameQueue.length

  return (
    <>
      {/* User Step 1 — info modal */}
      {infoUsers && (
        <UserDeleteInfoModal
          users={infoUsers}
          onProceed={proceedToNameConfirm}
          onCancel={cancelDelete}
        />
      )}

      {/* User Step 2 — name confirm (one at a time) */}
      {currentUser && (
        <NameConfirmModal
          title="Type the user's name to confirm"
          expectedName={currentUser.displayName || currentUser.email || ''}
          inputLabel="Type the name"
          queueLabel={
            totalInRun > 1
              ? `Deleting ${doneCount + 1} of ${totalInRun} users`
              : undefined
          }
          onConfirm={handleDeleteCurrent}
          onCancel={cancelDelete}
          deleting={deleting}
        />
      )}

      <div className="space-y-6">
        <SummaryCards users={allUsers} />

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, phone, or org…"
              className="input-field pl-9 text-sm w-full"
            />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as UserRole | 'all')}
            className="input-field text-sm w-full sm:w-44">
            {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r === 'all' ? 'All Roles' : r}</option>)}
          </select>
          <select value={domainFilter} onChange={e => setDomainFilter(e.target.value)}
            className="input-field text-sm w-full sm:w-56">
            <option value="all">All Domains</option>
            {availableDomains.map(d => <option key={d} value={d}>{domainDisplayLabel(d)}</option>)}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Users className="w-4 h-4" />
            <span>
              {filtered.length === allUsers.length
                ? `${allUsers.length} users across ${grouped.size} ${grouped.size === 1 ? 'domain' : 'domains'}`
                : `${filtered.length} of ${allUsers.length} users`}
            </span>
          </div>
          {selectedUids.size > 0 && (
            <button
              onClick={() => requestDelete(allUsers.filter(u => selectedUids.has(u.uid)))}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete {selectedUids.size} selected
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-text-secondary">
            <UserX className="w-10 h-10 opacity-30" />
            <p className="text-sm">No users match your filters.</p>
          </div>
        ) : (
          <div>
            {[...grouped.entries()].map(([domain, users], idx) => (
              <DomainGroup key={domain} domain={domain} users={users} defaultOpen={idx === 0}
                selectedUids={selectedUids}
                onToggleUser={onToggleUser}
                onToggleAll={onToggleAll}
                onRequestDelete={requestDelete}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
