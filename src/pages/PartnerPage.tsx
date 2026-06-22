import { Link } from 'react-router-dom'
import { Handshake, ChevronRight } from 'lucide-react'
import { useBranding } from '../hooks/useBranding'
import { useDeveloperAccess } from '../services/useDeveloperAccess'
import { UserAvatarMenu } from '../components/ui/UserAvatarMenu'
import { PartnerWorkflowPage } from '../features/partnerWorkflow/PartnerWorkflowPage'

export function PartnerPage() {
  const { branding }    = useBranding()
  const { isDeveloper } = useDeveloperAccess()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0 group">
                <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                  <span className="text-white font-bold text-sm">F</span>
                </div>
                <span className="hidden sm:block text-sm text-text-secondary group-hover:text-primary transition-colors">
                  {branding.businessName}
                </span>
              </Link>
              <ChevronRight className="w-4 h-4 text-border shrink-0" />
              <div className="flex items-center gap-1.5 min-w-0">
                <Handshake className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-bold text-text-primary truncate">Partner</span>
                {isDeveloper && (
                  <span className="hidden sm:block text-[10px] font-semibold px-2 py-0.5
                    rounded-full bg-primary-light text-primary border border-primary/20 shrink-0">
                    DEV
                  </span>
                )}
              </div>
            </div>
            <UserAvatarMenu />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <PartnerWorkflowPage mode="partner" />
      </main>
    </div>
  )
}
