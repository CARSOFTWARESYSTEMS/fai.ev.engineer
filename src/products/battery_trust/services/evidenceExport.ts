import type { EvidencePackage } from '../domain/types'

// ─── Evidence export (POC-001) ──────────────────────────────────────────────
//
// Two exports only: JSON and a standalone, dependency-free HTML report.
// The HTML export must never claim QA/Architect approval and must escape
// every dynamic value — see escapeHtml below and evidenceExport.test.ts.

export function evidenceToJson(evidence: EvidencePackage): string {
  return JSON.stringify(evidence, null, 2)
}

export function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function row(label: string, value: string): string {
  return `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`
}

export function evidenceToHtml(evidence: EvidencePackage): string {
  const stepRows = evidence.stepResults.map(s =>
    `<tr><td>${s.stepIndex}</td><td>${escapeHtml(s.simulatorId)}</td><td>${escapeHtml(s.name)}</td>` +
    `<td>${escapeHtml(s.status)}</td><td>${escapeHtml(s.summary)}</td></tr>`,
  ).join('\n')

  const factorRows = evidence.trustAssessment.factors.map(f =>
    `<tr><td>${escapeHtml(f.label)}</td><td>${f.weight}%</td><td>${f.score}</td><td>${f.contribution}</td></tr>`,
  ).join('\n')

  const gateRows = evidence.gateDecision.activeGates.length === 0
    ? '<tr><td colspan="2">No hard-fail gates active.</td></tr>'
    : evidence.gateDecision.activeGates.map(g => `<tr><td>${escapeHtml(g.label)}</td><td>${escapeHtml(g.detail)}</td></tr>`).join('\n')

  const assumptions = evidence.assumptions.map(a => `<li>${escapeHtml(a)}</li>`).join('')
  const limitations = evidence.limitations.map(l => `<li>${escapeHtml(l)}</li>`).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(evidence.reportTitle)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #f8fafc; color: #0f172a; font-family: Arial, Helvetica, sans-serif; line-height: 1.5; }
  .page { max-width: 960px; margin: 0 auto; padding: 28px 20px 48px; }
  .banner { background: #fef3c7; border: 1px solid #fde68a; color: #92400e; border-radius: 10px; padding: 14px 18px; font-weight: 700; font-size: 13px; text-align: center; margin-bottom: 20px; }
  .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px 22px; margin-bottom: 16px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 13px; letter-spacing: 1px; text-transform: uppercase; color: #1d4ed8; margin: 0 0 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 8px; border-bottom: 1px solid #edf2f7; vertical-align: top; }
  th { width: 32%; color: #475569; font-size: 11px; text-transform: uppercase; }
  .status { font-weight: 700; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; background: #dbeafe; color: #1d4ed8; }
  @media print { body { background: #fff; } .card { box-shadow: none; } }
</style>
</head>
<body>
<main class="page">
  <div class="banner">SYNTHETIC POC — NOT FOR OPERATIONAL OR FLIGHT DECISIONS</div>

  <div class="card">
    <h1>${escapeHtml(evidence.reportTitle)}</h1>
    <p><span class="badge">${escapeHtml(evidence.reviewStatus)}</span></p>
    <table><tbody>
      ${row('Run ID', evidence.runId)}
      ${row('Trace ID', evidence.traceId)}
      ${row('Scenario ID', evidence.scenarioId)}
      ${row('Battery ID', evidence.batteryId)}
      ${row('Organisation', evidence.organisationName ?? 'Not available')}
      ${row('Actor', evidence.actorDisplayName ?? 'Not available')}
      ${row('Policy version', evidence.policyVersion)}
      ${row('Engine version', evidence.engineVersion)}
      ${row('Schema version', evidence.schemaVersion)}
      ${row('Generated at', evidence.generatedAt)}
      ${row('Classification', evidence.classification)}
    </tbody></table>
  </div>

  <div class="card">
    <h2>Pipeline Step Results</h2>
    <table>
      <thead><tr><th>#</th><th>Simulator</th><th>Name</th><th>Status</th><th>Summary</th></tr></thead>
      <tbody>${stepRows}</tbody>
    </table>
  </div>

  <div class="card">
    <h2>Gate Decision</h2>
    <p>Policy profile: ${escapeHtml(evidence.gateDecision.policyProfileId)} · Overall: <span class="status">${evidence.gateDecision.hasHardFail ? 'HARD_FAIL' : 'PASS'}</span></p>
    <table><tbody>${gateRows}</tbody></table>
  </div>

  <div class="card">
    <h2>Trust Assessment</h2>
    <p>Overall score: <strong>${evidence.trustAssessment.overallScore}</strong> — ${escapeHtml(evidence.trustAssessment.readinessLabel)}</p>
    <table>
      <thead><tr><th>Factor</th><th>Weight</th><th>Score</th><th>Contribution</th></tr></thead>
      <tbody>${factorRows}</tbody>
    </table>
  </div>

  <div class="card">
    <h2>Assumptions</h2>
    <ul>${assumptions}</ul>
    <h2>Limitations</h2>
    <ul>${limitations}</ul>
  </div>
</main>
</body>
</html>`
}

export function downloadTextFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8;` })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
