import type { User as FirebaseUser } from 'firebase/auth'
import type {
  Sim003GenerateEventsRequest, Sim003HealthResponse, Sim003ObservedEvent,
  Sim003RunResult, Sim003ScenarioDescriptor,
} from '../types'

// SIM-003 talks to a locally-run FastAPI backend (services/sim-003-mqtt) —
// a separate process/origin from this Vite app. See docs/README for local
// run instructions. Not deployed anywhere in POC-001/POC-003.
const BASE_URL = (import.meta.env.VITE_SIM003_API_BASE_URL as string | undefined) ?? 'http://localhost:8003'
const API_PREFIX = '/api/v1/simulators/sim-003'

export class Sim003ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

async function authHeaders(firebaseUser: FirebaseUser | null): Promise<Record<string, string>> {
  if (!firebaseUser) return {}
  const token = await firebaseUser.getIdToken()
  return { Authorization: `Bearer ${token}` }
}

async function request<T>(path: string, firebaseUser: FirebaseUser | null, init: RequestInit = {}): Promise<T> {
  const headers = await authHeaders(firebaseUser)
  const res = await fetch(`${BASE_URL}${API_PREFIX}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...headers, ...(init.headers ?? {}) },
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = body.detail ?? JSON.stringify(body)
    } catch { /* non-JSON error body */ }
    throw new Sim003ApiError(res.status, detail)
  }
  return res.json() as Promise<T>
}

export async function getHealth(): Promise<Sim003HealthResponse> {
  const res = await fetch(`${BASE_URL}${API_PREFIX}/health`)
  if (!res.ok) throw new Sim003ApiError(res.status, 'Health check failed')
  return res.json()
}

export function getScenarios(firebaseUser: FirebaseUser | null): Promise<{ scenarios: Sim003ScenarioDescriptor[] }> {
  return request('/scenarios', firebaseUser)
}

export function generateEvents(
  body: Sim003GenerateEventsRequest, firebaseUser: FirebaseUser | null,
): Promise<Sim003RunResult> {
  return request('/generate-events', firebaseUser, { method: 'POST', body: JSON.stringify(body) })
}

export function startRun(
  body: Sim003GenerateEventsRequest, firebaseUser: FirebaseUser | null,
): Promise<{ run_id: string; status: string }> {
  return request('/runs', firebaseUser, { method: 'POST', body: JSON.stringify(body) })
}

export function getRun(runId: string, firebaseUser: FirebaseUser | null): Promise<Sim003RunResult> {
  return request(`/runs/${encodeURIComponent(runId)}`, firebaseUser)
}

export function stopRun(runId: string, firebaseUser: FirebaseUser | null): Promise<{ run_id: string; status: string }> {
  return request(`/runs/${encodeURIComponent(runId)}/stop`, firebaseUser, { method: 'POST' })
}

export async function downloadEvidence(
  runId: string, format: 'json' | 'html', firebaseUser: FirebaseUser | null,
): Promise<void> {
  const headers = await authHeaders(firebaseUser)
  const res = await fetch(`${BASE_URL}${API_PREFIX}/runs/${encodeURIComponent(runId)}/evidence.${format}`, { headers })
  if (!res.ok) throw new Sim003ApiError(res.status, 'Evidence export failed')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${runId}.${format}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export interface Sim003StreamHandlers {
  onObservation: (event: Sim003ObservedEvent) => void
  onCompleted: (run: Sim003RunResult) => void
  onError?: (error: unknown) => void
}

/** Authenticated SSE via fetch + manual stream parsing — the native
 * EventSource API cannot send an Authorization header. */
export function streamRun(
  runId: string, firebaseUser: FirebaseUser | null, handlers: Sim003StreamHandlers,
): AbortController {
  const controller = new AbortController()

  void (async () => {
    try {
      const headers = await authHeaders(firebaseUser)
      const res = await fetch(`${BASE_URL}${API_PREFIX}/runs/${encodeURIComponent(runId)}/stream`, {
        headers, signal: controller.signal,
      })
      if (!res.ok || !res.body) throw new Sim003ApiError(res.status, 'Stream failed to open')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        let boundary: number
        while ((boundary = buffer.indexOf('\n\n')) !== -1) {
          const chunk = buffer.slice(0, boundary)
          buffer = buffer.slice(boundary + 2)

          let eventName = 'message'
          let data = ''
          for (const line of chunk.split('\n')) {
            if (line.startsWith('event:')) eventName = line.slice(6).trim()
            else if (line.startsWith('data:')) data += line.slice(5).trim()
          }
          if (!data) continue

          if (eventName === 'observation') {
            handlers.onObservation(JSON.parse(data) as Sim003ObservedEvent)
          } else if (eventName === 'completed') {
            handlers.onCompleted(JSON.parse(data) as Sim003RunResult)
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        handlers.onError?.(error)
      }
    }
  })()

  return controller
}
