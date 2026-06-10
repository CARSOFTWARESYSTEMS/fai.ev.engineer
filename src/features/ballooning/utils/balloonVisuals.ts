import type { Form3Status } from '../../as9102/types/form3Types'

export const BALLOON_VISUALS = {
  fill: '#0F6FFF',
  text: '#FFFFFF',
  gap: '#FFFFFF',
  status: {
    pending: '#FBBF24',
    pass: '#22C55E',
    fail: '#EF4444',
  } satisfies Record<Form3Status, string>,
  viewer: {
    diameterPx: 28,
    gapPx: 2,
    ringPx: 4,
  },
  pdf: {
    innerRadius: 10,
    gapRadius: 11.5,
    outerRadius: 14.5,
    fontSize: 8,
  },
} as const

export function getBalloonStatusColor(status: Form3Status): string {
  return BALLOON_VISUALS.status[status]
}
