import { Target, Zap, Eye, FileCheck2, Lightbulb, Bot } from 'lucide-react'
import type { AgentActivityItem, AgentActivityKind, AgentPlan } from '../domain/types'

const KIND_META: Record<AgentActivityKind, { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
  plan:           { icon: Target,     label: 'Plan',           color: 'text-primary' },
  action:         { icon: Zap,        label: 'Actions',        color: 'text-amber-600' },
  observation:    { icon: Eye,        label: 'Observations',   color: 'text-indigo-600' },
  evidence:       { icon: FileCheck2, label: 'Evidence',       color: 'text-emerald-600' },
  recommendation: { icon: Lightbulb,  label: 'Recommendation', color: 'text-pink-600' },
}

interface Props {
  plan:     AgentPlan
  activity: AgentActivityItem[]
}

export function AgentActivityPanel({ plan, activity }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Bot className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-bold text-text-primary">Mission Orchestrator</h2>
      </div>

      <div className="px-4 py-3 border-b border-border bg-background">
        <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">Provider</p>
        <p className="text-xs font-semibold text-text-primary">{plan.providerLabel}</p>
        <p className="text-[10px] text-text-secondary mt-0.5">AI Model: {plan.modelLabel}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">User Goal</p>
          <p className="text-xs text-text-primary leading-relaxed">{plan.goal}</p>
        </div>

        {plan.steps.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">Plan — Selected Engines</p>
            <ul className="space-y-1">
              {plan.steps.map(step => (
                <li key={step.simulatorId} className="text-xs text-text-secondary">
                  <span className="font-mono font-bold text-text-primary">{step.simulatorId}</span> {step.name} — {step.reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {plan.assumptions.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">Assumptions</p>
            <ul className="list-disc list-inside space-y-1">
              {plan.assumptions.map((a, i) => (
                <li key={i} className="text-xs text-text-secondary">{a}</li>
              ))}
            </ul>
          </div>
        )}

        {activity.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-border">
            {activity.map((item, i) => {
              const meta = KIND_META[item.kind]
              const Icon = meta.icon
              return (
                <div key={i} className="flex items-start gap-2">
                  <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${meta.color}`} aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">{meta.label}</p>
                    <p className="text-xs text-text-primary leading-relaxed">{item.text}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
