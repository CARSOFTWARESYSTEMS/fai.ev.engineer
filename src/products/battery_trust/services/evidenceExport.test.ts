import { describe, it, expect } from 'vitest'
import { evidenceToHtml, evidenceToJson, escapeHtml } from './evidenceExport'
import { buildHappyPathRun } from './LocalSimulationGateway'
import { SCN_HAPPY_001, REF_2W_LFP_51V_V1 } from '../domain/fixtures'

describe('escapeHtml', () => {
  it('escapes angle brackets, quotes, and ampersands', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(escapeHtml(`"quoted" & 'single'`)).toBe('&quot;quoted&quot; &amp; &#39;single&#39;')
  })
})

describe('evidenceToHtml', () => {
  it('escapes an injected organisation/actor name instead of rendering raw HTML', () => {
    const run = buildHappyPathRun(SCN_HAPPY_001, REF_2W_LFP_51V_V1, {
      organisationName: '<img src=x onerror=alert(1)>',
      actorDisplayName: '<b>Eve</b>',
    })
    const html = evidenceToHtml(run.evidencePackage!)
    expect(html).not.toContain('<img src=x onerror=alert(1)>')
    expect(html).not.toContain('<b>Eve</b>')
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
  })

  it('includes the synthetic disclaimer and never claims QA/Architect approval', () => {
    const run = buildHappyPathRun(SCN_HAPPY_001, REF_2W_LFP_51V_V1, {})
    const html = evidenceToHtml(run.evidencePackage!)
    expect(html).toContain('SYNTHETIC POC — NOT FOR OPERATIONAL OR FLIGHT DECISIONS')
    expect(html).not.toMatch(/QA approved|Architect approved/i)
    expect(html).toContain('DRAFT_NOT_REVIEWED')
  })
})

describe('evidenceToJson', () => {
  it('produces valid, parseable JSON containing simulated=true', () => {
    const run = buildHappyPathRun(SCN_HAPPY_001, REF_2W_LFP_51V_V1, {})
    const json = evidenceToJson(run.evidencePackage!)
    const parsed = JSON.parse(json)
    expect(parsed.simulated).toBe(true)
    expect(parsed.classification).toBe('SYNTHETIC_POC')
  })
})
