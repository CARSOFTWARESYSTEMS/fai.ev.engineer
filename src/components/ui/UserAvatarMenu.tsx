import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LogOut,
  User,
  Building2,
  Phone,
  CreditCard,
  Settings,
  Shield,
  ChevronDown,
  Code2,
} from 'lucide-react'
import { useAuth } from '../../auth/hooks/useAuth'
import { useDeveloperAccess } from '../../services/useDeveloperAccess'

export function UserAvatarMenu() {
  const { user, firebaseUser, signOut } = useAuth()
  const navigate    = useNavigate()
  const [open, setOpen] = useState(false)
  const containerRef    = useRef<HTMLDivElement>(null)

  const { isDeveloper } = useDeveloperAccess()

  const displayName = user?.displayName || firebaseUser?.displayName || 'User'
  const photoURL    = user?.photoURL    || firebaseUser?.photoURL
  const email       = user?.email       || firebaseUser?.email
  const isManager   = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'manager'

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    function handle(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open])

  const handleSignOut = async () => {
    setOpen(false)
    await signOut()
    navigate('/')
  }

  return (
    <div ref={containerRef} className="relative">

      {/* ── Avatar button ─────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        className="flex items-center gap-1 rounded-full p-0.5 hover:ring-2 hover:ring-primary/30 transition-all focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        {photoURL ? (
          <img
            src={photoURL}
            alt={displayName}
            className="w-8 h-8 rounded-full border border-border"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center">
            <span className="text-primary font-bold text-sm select-none">
              {displayName[0]?.toUpperCase()}
            </span>
          </div>
        )}
        <ChevronDown className={`w-3 h-3 text-text-secondary transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* ── Dropdown ──────────────────────────────────────────────────────── */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-1rem)] bg-white rounded-2xl shadow-xl border border-border z-50 overflow-hidden"
          role="menu"
        >

          {/* User info block */}
          <div className="px-4 py-4 bg-gray-50 border-b border-border">
            <div className="flex items-center gap-3 mb-3">
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={displayName}
                  className="w-10 h-10 rounded-full border border-border shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold text-base select-none">
                    {displayName[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <p className="text-sm font-bold text-text-primary truncate">{displayName}</p>
                  {isManager && (
                    <span className="text-[10px] font-semibold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded shrink-0">
                      {user?.role === 'super_admin' ? 'Super Admin' : 'Manager'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-secondary truncate">{email}</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              {user?.organizationName && (
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate">{user.organizationName}</span>
                </div>
              )}
              {user?.mobileNumber && (
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Phone className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                  <span>{user.mobileNumber}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs">
                <CreditCard className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="font-semibold text-success capitalize">
                  {user?.subscriptionPlan || 'trial'} plan
                </span>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1" role="group">
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-gray-50 transition-colors"
              role="menuitem"
            >
              <User className="w-4 h-4 text-text-secondary shrink-0" />
              Edit Profile
            </Link>

            {isManager && (
              <>
                <button
                  disabled
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary opacity-40 cursor-not-allowed w-full text-left"
                  role="menuitem"
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  Settings
                  <span className="ml-auto text-[10px] bg-gray-100 px-1.5 py-0.5 rounded font-medium">
                    Soon
                  </span>
                </button>
                <button
                  disabled
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary opacity-40 cursor-not-allowed w-full text-left"
                  role="menuitem"
                >
                  <Shield className="w-4 h-4 shrink-0" />
                  Manager Panel
                  <span className="ml-auto text-[10px] bg-gray-100 px-1.5 py-0.5 rounded font-medium">
                    Soon
                  </span>
                </button>
              </>
            )}
          </div>

          {isDeveloper && (
            <div className="border-t border-border py-1" role="group">
              <Link
                to="/developer-settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-gray-50 transition-colors"
                role="menuitem"
              >
                <Code2 className="w-4 h-4 text-primary shrink-0" />
                Developer Settings
                <span className="ml-auto text-[10px] font-semibold bg-primary-light text-primary px-1.5 py-0.5 rounded">
                  DEV
                </span>
              </Link>
            </div>
          )}

          <div className="border-t border-border py-1" role="group">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-red-50 transition-colors w-full text-left"
              role="menuitem"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
