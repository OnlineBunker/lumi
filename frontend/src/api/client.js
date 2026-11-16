import axios from 'axios'

// Dev: empty, so Vite proxies /api to localhost:8000.
// Prod: VITE_API_URL points at the Render backend.
const API_BASE = `${(import.meta.env?.VITE_API_URL || '').replace(/\/+$/, '')}/api`

// No timeout: a cold Render instance can take over a minute to wake up.
export const api = axios.create({ baseURL: API_BASE })

export async function uploadPdf(file, onUploadProgress) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/upload', form, { onUploadProgress })
  return data
}

// fetch instead of EventSource because EventSource can't POST.
// onError(message, httpStatus) — status is only set when the request itself failed.
export async function streamChat({ payload, onToken, onSources, onDone, onError }) {
  let finished = false
  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return onError(err.detail || res.statusText, res.status)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() // last line may be incomplete

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const { type, content } = JSON.parse(line.slice(6))
        if (type === 'token') onToken(content)
        else if (type === 'sources') onSources(content)
        else if (type === 'error') { onError(content); finished = true }
        else if (type === 'done' && !finished) { onDone(); finished = true }
      }
    }
    if (!finished) onError('Stream ended unexpectedly.')
  } catch (err) {
    if (!finished) onError(err.message || 'Network error')
  }
}
