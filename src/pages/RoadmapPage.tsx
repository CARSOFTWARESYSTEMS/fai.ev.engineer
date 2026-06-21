import { CheckCircle, Circle, Clock } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { buildMailtoLink } from '../lib/contactMessage'

type RoadmapStatus = 'done' | 'in-progress' | 'planned'

interface RoadmapItem {
  label: string
  status: RoadmapStatus
}

interface RoadmapPhase {
  phase: string
  tag: string
  tagColor: string
  description: string
  items: RoadmapItem[]
}

const roadmap: RoadmapPhase[] = [
  {
    phase: 'MVP',
    tag: 'In Progress',
    tagColor: 'bg-primary/10 text-primary',
    description: 'Core tooling for engineering drawing ballooning and AS9102 Form 3 characteristic accountability.',
    items: [
      { label: 'PDF Drawing Viewer', status: 'in-progress' },
      { label: 'Manual Ballooning', status: 'in-progress' },
      { label: 'Feature Table', status: 'in-progress' },
      { label: 'AS9102 Form 3 Export', status: 'in-progress' },
      { label: 'Google Drive Save/Load', status: 'in-progress' },
    ],
  },
  {
    phase: 'Beta',
    tag: 'Coming Next',
    tagColor: 'bg-warning/10 text-warning',
    description: 'Intelligent extraction and enhanced balloon export for faster characteristic capture.',
    items: [
      { label: 'OCR Assisted Extraction', status: 'in-progress' },
      { label: 'Dimension Parsing', status: 'planned' },
      { label: 'GD&T Parsing', status: 'planned' },
      { label: 'Enhanced Balloon Export', status: 'planned' },
    ],
  },
  {
    phase: 'Production V1',
    tag: 'Planned',
    tagColor: 'bg-slate-100 text-text-secondary',
    description: 'Full FAI package capability, billing, team management, and compliance audit trail.',
    items: [
      { label: 'AS9102 Form 1 — Design Documentation', status: 'planned' },
      { label: 'AS9102 Form 2 — Product Accountability', status: 'planned' },
      { label: 'Billing & Subscription Management', status: 'planned' },
      { label: 'Admin Portal', status: 'planned' },
      { label: 'Team Accounts & Permissions', status: 'planned' },
      { label: 'Audit Trail', status: 'planned' },
      { label: 'Version History', status: 'planned' },
    ],
  },
]

function StatusIcon({ status }: { status: RoadmapStatus }) {
  if (status === 'done') return <CheckCircle className="w-5 h-5 text-success shrink-0" />
  if (status === 'in-progress') return <Clock className="w-5 h-5 text-primary shrink-0" />
  return <Circle className="w-5 h-5 text-border shrink-0" />
}

function StatusLabel({ status }: { status: RoadmapStatus }) {
  if (status === 'done') return <span className="text-[10px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">Done</span>
  if (status === 'in-progress') return <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">In Progress</span>
  return <span className="text-[10px] font-semibold text-text-secondary bg-gray-100 px-2 py-0.5 rounded-full">Planned</span>
}

export function RoadmapPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary-light via-white to-white py-16 px-4 border-b border-border">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-primary rounded-full" />
              Public Roadmap
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-text-primary tracking-tight">
              What We're Building
            </h1>
            <p className="mt-4 text-lg text-text-secondary max-w-xl mx-auto leading-relaxed">
              FAI Engineer is built incrementally. Here's what's live, what's in progress, and what's coming next.
            </p>
          </div>
        </section>

        {/* Roadmap phases */}
        <section className="py-16 px-4 bg-background">
          <div className="max-w-3xl mx-auto flex flex-col gap-10">
            {roadmap.map((phase, idx) => (
              <div key={phase.phase} className="relative">
                {/* Vertical connector */}
                {idx < roadmap.length - 1 && (
                  <div className="absolute left-6 top-full h-10 w-px bg-border hidden sm:block" />
                )}

                <div className="card overflow-hidden">
                  {/* Phase header */}
                  <div className="px-6 py-5 border-b border-border bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-xl font-bold text-text-primary">{phase.phase}</h2>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${phase.tagColor}`}>
                          {phase.tag}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                        {phase.description}
                      </p>
                    </div>
                  </div>

                  {/* Items */}
                  <ul className="divide-y divide-border">
                    {phase.items.map((item) => (
                      <li
                        key={item.label}
                        className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <StatusIcon status={item.status} />
                          <span className={`text-sm font-medium ${item.status === 'planned' ? 'text-text-secondary' : 'text-text-primary'}`}>
                            {item.label}
                          </span>
                        </div>
                        <StatusLabel status={item.status} />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 bg-white border-t border-border">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-text-primary mb-3">
              Want to shape the roadmap?
            </h2>
            <p className="text-text-secondary mb-8">
              Start your free trial and share what features matter most to your FAI workflow.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="/register"
                className="btn-primary w-full sm:w-auto"
              >
                Start 7-Day Trial
              </a>
              <a
                href={buildMailtoLink('info@iTelematics.com', 'FAI Engineer Roadmap Feedback', { issue: 'I would like to share roadmap feedback.' })}
                className="btn-secondary w-full sm:w-auto"
              >
                Share Feedback
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
