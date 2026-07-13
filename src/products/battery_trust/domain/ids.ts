// Deterministic ID helpers — no Math.random / Date.now, so the same
// scenario + seed always yields byte-identical IDs (required for
// reproducible synthetic runs and stable tests).

/** Small, fast string hash (djb2). Deterministic across runs/platforms. */
function hash(input: string): string {
  let h = 5381
  for (let i = 0; i < input.length; i++) {
    h = (h * 33) ^ input.charCodeAt(i)
  }
  // Force unsigned 32-bit, base36 for compactness.
  return (h >>> 0).toString(36).padStart(7, '0')
}

export function deterministicId(prefix: string, scenarioId: string, seed: number, salt: string): string {
  return `${prefix}-${hash(`${scenarioId}:${seed}:${salt}`)}`.toUpperCase()
}

export function stepEventId(scenarioId: string, seed: number, stepIndex: number): string {
  return deterministicId('EVT', scenarioId, seed, `step-${stepIndex}`)
}
