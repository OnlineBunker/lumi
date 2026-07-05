import axios from 'axios'

// In dev, Vite proxies `/api` → http://localhost:8000 (see vite.config.js).
// In prod (Vercel), set VITE_API_URL to the Render backend, e.g.
//   https://lumi-qoe2.onrender.com
// Empty string means "same origin" (dev with the Vite proxy).
const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
const API_BASE = `${BASE_URL}/api`

// Axios for regular requests (upload, delete)
export const api = axios.create({
  baseURL: API_BASE,
  timeout: 60_000,
})

/**
 * streamChat — SSE streaming chat via fetch ReadableStream
 *
 * Why not EventSource? EventSource only supports GET.
 * We use fetch + ReadableStream to POST and stream simultaneously.
 *
 * @param {object}   payload   - { doc_id, question, mode, chat_history }
 * @param {function} onToken   - called for each streamed token string
 * @param {function} onSources - called once with [{page, text}] array
 * @param {function} onDone    - called when stream ends
 * @param {function} onError   - called on any error
 */
export async function streamChat({ payload, onToken, onSources, onDone, onError }) {
  try {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      // Backend returns {"detail": "..."} on FastAPI HTTPExceptions; on a
      // Vercel 404 the body is HTML — fall back to status text so the
      // user sees something useful ("404 Not Found" vs the generic
      // "Request failed" they were getting before).
      const ct = response.headers.get('content-type') || ''
      let detail = response.statusText || 'Request failed'
      if (ct.includes('application/json')) {
        const err = await response.json().catch(() => ({}))
        if (err?.detail) detail = err.detail
      }
      throw new Error(`${response.status} ${detail}`)
    }

    const reader  = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer    = ''

    let gotDone = false
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      // Buffer partial SSE lines (they can arrive split across chunks)
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()   // keep the last incomplete line in the buffer

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const data = JSON.parse(line.slice(6))
          if      (data.type === 'token')   onToken(data.content)
          else if (data.type === 'sources') onSources(data.content)
          else if (data.type === 'done')    { onDone(); gotDone = true }
          else if (data.type === 'error')   onError(data.content)
        } catch { /* malformed line — skip */ }
      }
    }

    // If the server closed the stream without sending a 'done' event
    // (e.g. backend crash, LLM error before our try/except landed), the UI
    // would otherwise sit with a blinking cursor forever.
    if (!gotDone) onError('Stream ended unexpectedly.')
  } catch (err) {
    onError(err.message || 'Network error')
  }
}
