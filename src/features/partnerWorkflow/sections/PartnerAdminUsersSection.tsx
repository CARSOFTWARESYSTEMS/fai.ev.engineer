import { useEffect, useState } from 'react'
import { Users2, Loader2, Plus, UserX, UserCheck, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react'
import {
  subscribePartnerAdmins,
  assignPartnerAdmin,
  assignPendingPartnerAdmin,
  deactivatePartnerAdmin,
  reactivatePartnerAdmin,
  revokePartnerAdmin,
  type PartnerAdminRecord,
  type PartnerAdminRole,
} from '../../../services/partnerAccessService'
import { listUsers } from '../../../services/roleManagementService'
import { getReadablePartnerError } from '../../../services/partnerService'
import { FeedbackBanner, CollapsibleCard, type AdminSlot, emptySlot } from '../shared'

interface Props {
  partnerId:        string
  callerUid:        string
  callerEmail:      string
  isDeveloperAdmin: boolean
}

function statusBadge(s: string) {
  return s === 'active'  ? 'bg-success/10 text-success border-success/20'
       : s === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200'
       :                   'bg-gray-100 text-text-secondary border-border'
}

export function PartnerAdminUsersSection({ partnerId, callerUid, callerEmail, isDeveloperAdmin }: Props) {
  const [admins,    setAdmins]    = useState<PartnerAdminRecord[]>([])
  const [feedback,  setFeedback]  = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [addSlot,   setAddSlot]   = useState<AdminSlot>(emptySlot())
  const [addRole,   setAddRole]   = useState<PartnerAdminRole>('partner_admin')
  const [searching, setSearching] = useState(false)
  const [addOpen,   setAddOpen]   = useState(false)
  const [adding,    setAdding]    = useState(false)

  useEffect(() => subscribePartnerAdmins(partnerId, setAdmins), [partnerId])

  function showFeedback(type: 'success' | 'error', msg: string) {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 4000)
  }

  async function resolveAddSlotEmail() {
    if (!addSlot.email.trim()) return
    setSearching(true)
    try {
      const all   = await listUsers()
      const match = all.find(u => u.email?.toLowerCase() === addSlot.email.toLowerCase().trim())
      setAddSlot(match
        ? { email: match.email, uid: match.uid, displayName: match.displayName, status: 'found' }
        : { email: addSlot.email.trim().toLowerCase(), uid: null, displayName: '', status: 'not_found' })
    } catch { showFeedback('error', 'Failed to search users.') }
    finally { setSearching(false) }
  }

  const superAdmins   = admins.filter(a => a.role === 'partner_super_admin')
  const partnerAdmins = admins.filter(a => a.role === 'partner_admin')

  async function handleAdd() {
    if (!addSlot.email.trim()) return
    if (addRole === 'partner_super_admin' && superAdmins.length >= 1) {
      showFeedback('error', 'Only 1 Partner Super Admin allowed per partner.'); return
    }
    if (addRole === 'partner_admin' && partnerAdmins.length >= 2) {
      showFeedback('error', 'Maximum 2 Partner Admins allowed per partner.'); return
    }
    setAdding(true)
    try {
      if (addSlot.status === 'found' && addSlot.uid) {
        await assignPartnerAdmin({ uid: addSlot.uid, email: addSlot.email, displayName: addSlot.displayName,
          partnerId, addedBy: callerUid, addedByEmail: callerEmail })
      } else {
        await assignPendingPartnerAdmin({ email: addSlot.email, role: addRole,
          partnerId, addedBy: callerUid, addedByEmail: callerEmail })
      }
      showFeedback('success', `${addSlot.email} added as ${addRole === 'partner_super_admin' ? 'Partner Super Admin' : 'Partner Admin'}.`)
      setAddSlot(emptySlot()); setAddOpen(false)
    } catch (err) {
      showFeedback('error', `Failed to add admin: ${getReadablePartnerError(err)}`)
    } finally { setAdding(false) }
  }

  async function handleDeactivate(a: PartnerAdminRecord) {
    try { await deactivatePartnerAdmin(a.uid); showFeedback('success', `${a.email} deactivated.`) }
    catch (err) { showFeedback('error', `Failed: ${getReadablePartnerError(err)}`) }
  }

  async function handleReactivate(a: PartnerAdminRecord) {
    try { await reactivatePartnerAdmin(a.uid); showFeedback('success', `${a.email} reactivated.`) }
    catch (err) { showFeedback('error', `Failed: ${getReadablePartnerError(err)}`) }
  }

  async function handleRemove(a: PartnerAdminRecord) {
    if (a.role === 'partner_super_admin' && superAdmins.length <= 1) {
      showFeedback('error', 'Cannot remove the only Partner Super Admin.'); return
    }
    try {
      await revokePartnerAdmin(a.uid, partnerId, { uid: callerUid, email: callerEmail })
      showFeedback('success', `${a.email} removed from this partner.`)
    } catch (err) { showFeedback('error', `Failed: ${getReadablePartnerError(err)}`) }
  }

  return (
    <div className="flex flex-col gap-4">
      {feedback && <FeedbackBanner type={feedback.type} message={feedback.msg} />}

      <CollapsibleCard title="Partner Admins"
        subtitle={`${admins.length} admin${admins.length !== 1 ? 's' : ''} · Super Admin + up to 2 Partner Admins`}
        icon={Users2} iconBg="bg-purple-50" iconColor="text-purple-600" defaultOpen={true}
        badge={admins.length > 0
          ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-light text-primary border border-primary/20">{admins.length}</span>
          : undefined}
        headerRight={isDeveloperAdmin
          ? <button onClick={() => setAddOpen(o => !o)}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary
                hover:bg-primary-light px-2.5 py-1 rounded-lg border border-primary/20 transition-colors">
              <Plus className="w-3 h-3" /> Add Admin
            </button>
          : undefined}
      >
        {addOpen && isDeveloperAdmin && (
          <div className="mb-4 p-4 rounded-xl bg-gray-50 border border-border flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1.5">Role</label>
              <div className="flex gap-3">
                {(['partner_super_admin', 'partner_admin'] as PartnerAdminRole[]).map(r => (
                  <label key={r} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="addRole" value={r} checked={addRole === r} onChange={() => setAddRole(r)} className="accent-primary" />
                    <span className="text-sm text-text-primary">{r === 'partner_super_admin' ? 'Super Admin' : 'Partner Admin'}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1.5">Email</label>
              <div className="flex gap-2">
                <input type="email" value={addSlot.email}
                  onChange={e => setAddSlot({ ...emptySlot(), email: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && resolveAddSlotEmail()}
                  placeholder="admin@company.com"
                  className="flex-1 px-3 py-2 rounded-xl border border-border text-sm
                    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
                <button type="button" onClick={resolveAddSlotEmail}
                  disabled={!addSlot.email.trim() || searching}
                  className="px-3 py-2 rounded-xl border border-border text-sm font-medium
                    text-text-primary hover:bg-gray-50 transition-colors disabled:opacity-50">
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find'}
                </button>
              </div>
              {addSlot.status === 'found' && (
                <div className="mt-1.5 flex items-center gap-2 px-3 py-2 rounded-xl bg-success/5 border border-success/20 text-xs text-success">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  Found: {addSlot.displayName || addSlot.email} — will be assigned as active
                </div>
              )}
              {addSlot.status === 'not_found' && (
                <div className="mt-1.5 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Not registered — will be saved as pending
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setAddOpen(false); setAddSlot(emptySlot()) }}
                className="text-sm text-text-secondary hover:text-text-primary px-3 py-1.5 transition-colors">Cancel</button>
              <button onClick={handleAdd} disabled={adding || !addSlot.email.trim()}
                className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2
                  bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50">
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add
              </button>
            </div>
          </div>
        )}

        {admins.length === 0
          ? <p className="text-sm text-text-secondary italic py-2">No admins assigned yet.</p>
          : (
            <div className="flex flex-col gap-3">
              {['partner_super_admin', 'partner_admin'].map(role => {
                const group = admins.filter(a => a.role === role)
                if (group.length === 0) return null
                return (
                  <div key={role}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-2">
                      {role === 'partner_super_admin' ? 'Super Admin' : 'Partner Admins'}
                    </p>
                    <div className="flex flex-col gap-2">
                      {group.map(a => (
                        <div key={a.uid} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 border border-border">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">{a.displayName || a.email}</p>
                            {a.displayName && <p className="text-[11px] text-text-secondary truncate">{a.email}</p>}
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${statusBadge(a.status)}`}>
                            {a.status}
                          </span>
                          {isDeveloperAdmin && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              {a.status === 'active'
                                ? <button onClick={() => handleDeactivate(a)} title="Deactivate"
                                    className="text-text-secondary hover:text-amber-600 transition-colors">
                                    <UserX className="w-4 h-4" />
                                  </button>
                                : a.status === 'deactivated'
                                  ? <button onClick={() => handleReactivate(a)} title="Reactivate"
                                      className="text-text-secondary hover:text-success transition-colors">
                                      <UserCheck className="w-4 h-4" />
                                    </button>
                                  : null
                              }
                              <button onClick={() => handleRemove(a)} title="Remove"
                                className="text-text-secondary hover:text-error transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        }

        {!isDeveloperAdmin && (
          <p className="text-xs text-text-secondary italic mt-2">View only — developer admin access required to manage admins.</p>
        )}
      </CollapsibleCard>
    </div>
  )
}
