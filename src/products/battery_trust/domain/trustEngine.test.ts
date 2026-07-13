import { describe, it, expect } from 'vitest'
import {
  computeTrustFactors, getReadinessBand, readinessCodeForScore,
  validateWeights, validateFactorScore, TRUST_FACTOR_DEFINITIONS,
} from './trustEngine'
import { HAPPY_PATH_FACTOR_SCORES, HAPPY_PATH_EXPECTED_SCORE } from './fixtures'
import type { TrustFactorId } from './types'

describe('computeTrustFactors', () => {
  it('computes the happy-path weighted score as exactly 96.25', () => {
    const { overallScore } = computeTrustFactors(HAPPY_PATH_FACTOR_SCORES)
    expect(overallScore).toBe(HAPPY_PATH_EXPECTED_SCORE)
  })

  it('assigns Mission Ready band for the happy-path score', () => {
    const { overallScore } = computeTrustFactors(HAPPY_PATH_FACTOR_SCORES)
    expect(readinessCodeForScore(overallScore)).toBe('MISSION_READY')
  })

  it('rejects factor scores above 100', () => {
    const bad = { ...HAPPY_PATH_FACTOR_SCORES, identity_trust: 101 }
    expect(() => computeTrustFactors(bad)).toThrow()
  })

  it('rejects factor scores below 0', () => {
    const bad = { ...HAPPY_PATH_FACTOR_SCORES, identity_trust: -1 }
    expect(() => computeTrustFactors(bad)).toThrow()
  })

  it('rejects weight sets that do not sum to 100', () => {
    const badWeights = TRUST_FACTOR_DEFINITIONS.map((w, i) => i === 0 ? { ...w, weight: w.weight + 5 } : w)
    expect(() => validateWeights(badWeights)).toThrow()
  })

  it('accepts valid weights and valid scores without throwing', () => {
    expect(() => validateWeights(TRUST_FACTOR_DEFINITIONS)).not.toThrow()
    expect(() => validateFactorScore(50)).not.toThrow()
    expect(() => validateFactorScore(0)).not.toThrow()
    expect(() => validateFactorScore(100)).not.toThrow()
  })

  it('increases overall score when cybersecurity posture increases (higher posture = more trust)', () => {
    const lower: Record<TrustFactorId, number> = { ...HAPPY_PATH_FACTOR_SCORES, cybersecurity_posture: 40 }
    const higher: Record<TrustFactorId, number> = { ...HAPPY_PATH_FACTOR_SCORES, cybersecurity_posture: 95 }
    const lowerScore = computeTrustFactors(lower).overallScore
    const higherScore = computeTrustFactors(higher).overallScore
    expect(higherScore).toBeGreaterThan(lowerScore)
  })
})

describe('getReadinessBand boundaries', () => {
  it.each([
    [100, 'MISSION_READY'],
    [90,  'MISSION_READY'],
    [89.9, 'CAUTION'],
    [75,  'CAUTION'],
    [74.9, 'REVIEW_REQUIRED'],
    [60,  'REVIEW_REQUIRED'],
    [59.9, 'NOT_READY'],
    [40,  'NOT_READY'],
    [39.9, 'GROUNDED'],
    [0,   'GROUNDED'],
  ])('score %s maps to %s', (score, code) => {
    expect(getReadinessBand(score as number).code).toBe(code)
  })
})
