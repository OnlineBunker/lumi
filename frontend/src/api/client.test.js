import { test } from 'node:test'
import assert from 'node:assert/strict'
import { streamChat } from './client.js'

// Fake fetch that returns the body split into the given raw chunks.
const serve = (chunks, status = 200) => {
  globalThis.fetch = async () => new Response(
    status === 200
      ? new ReadableStream({ start(c) { chunks.forEach((s) => c.enqueue(new TextEncoder().encode(s))); c.close() } })
      : JSON.stringify({ detail: chunks }),
    { status, headers: { 'Content-Type': 'application/json' } },
  )
}

const run = async () => {
  const got = { tokens: '', sources: null, done: 0, errors: [] }
  await streamChat({
    payload: {},
    onToken: (t) => { got.tokens += t },
    onSources: (s) => { got.sources = s },
    onDone: () => { got.done++ },
    onError: (msg, status) => { got.errors.push([msg, status]) },
  })
  return got
}

test('parses events split across network chunks', async () => {
  serve([
    'data: {"type":"sources","content":[{"page":2}]}\n\nda',
    'ta: {"type":"token","content":"Hel"}\n\ndata: {"type":"tok',
    'en","content":"lo"}\n\ndata: {"type":"done"}\n\n',
  ])
  assert.deepEqual(await run(), { tokens: 'Hello', sources: [{ page: 2 }], done: 1, errors: [] })
})

test('server error event ends the stream once, without onDone', async () => {
  serve(['data: {"type":"error","content":"LLM error: x"}\n\ndata: {"type":"done"}\n\n'])
  const got = await run()
  assert.equal(got.done, 0)
  assert.deepEqual(got.errors, [['LLM error: x', undefined]])
})

test('stream closed without done is reported', async () => {
  serve(['data: {"type":"token","content":"Hi"}\n\n'])
  assert.deepEqual((await run()).errors, [['Stream ended unexpectedly.', undefined]])
})

test('HTTP error passes detail and status (404 triggers re-upload)', async () => {
  serve('Document not found.', 404)
  assert.deepEqual((await run()).errors, [['Document not found.', 404]])
})
