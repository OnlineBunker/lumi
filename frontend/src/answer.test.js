import { test } from 'node:test'
import assert from 'node:assert/strict'
import { splitSources, parseBlocks, inlineRuns } from './answer.js'

test('splitSources pulls the page list off the end', () => {
  assert.deepEqual(splitSources('Light limits it.\n\nSources: 2, 4'), { body: 'Light limits it.', pages: [2, 4] })
  assert.deepEqual(splitSources('Nope.\n**Sources:** Page 3'), { body: 'Nope.', pages: [3] })
  assert.deepEqual(splitSources('Not here.\nSources: none').pages, [])
  assert.equal(splitSources('Still streaming').pages, null)
})

test('parseBlocks groups lists and joins paragraph lines', () => {
  assert.deepEqual(parseBlocks('## Key ideas\nIntro\nmore\n\n- a\n* b\n1. one\n2) two'), [
    { type: 'heading', text: 'Key ideas' },
    { type: 'p', text: 'Intro\nmore' },
    { type: 'list', ordered: false, items: ['a', 'b'] },
    { type: 'list', ordered: true, items: ['one', 'two'] },
  ])
})

test('inlineRuns handles bold and code', () => {
  assert.deepEqual(inlineRuns('use **ATP** in `stroma`'), [
    { text: 'use ' }, { text: 'ATP', bold: true }, { text: ' in ' }, { text: 'stroma', code: true },
  ])
})
