import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '';

// Axios for regular requests (upload, delete)
export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
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
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.detail || 'Request failed')
    }

    const reader  = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer    = ''

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
          else if (data.type === 'done')    onDone()
          else if (data.type === 'error')   onError(data.content)
        } catch { /* malformed line — skip */ }
      }
    }
  } catch (err) {
    onError(err.message || 'Network error')
  }
}
