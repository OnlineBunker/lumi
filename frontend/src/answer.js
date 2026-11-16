// The model ends each answer with "Sources: 2, 4" (or "Sources: none"); the UI shows those as chips.
// Returns pages = null when the line is missing, so callers can fall back to every retrieved page.
export function splitSources(text) {
  const m = text.match(/\n\s*\**sources?\**:\**\s*([^\n]*)\s*$/i)
  if (!m) return { body: text, pages: null }
  const pages = [...m[1].matchAll(/\d+/g)].map(Number)
  return { body: text.slice(0, m.index), pages }
}

// Just enough Markdown for model answers: paragraphs, headings, bullet and numbered lists.
export function parseBlocks(text) {
  const blocks = []
  for (const line of text.split('\n')) {
    const item = line.match(/^\s*([-*•]|\d+[.)])\s+(.*)/)
    const heading = line.match(/^#{1,4}\s+(.*)/)
    const last = blocks.at(-1)
    if (item) {
      const ordered = /\d/.test(item[1])
      if (last?.type === 'list' && last.ordered === ordered) last.items.push(item[2])
      else blocks.push({ type: 'list', ordered, items: [item[2]] })
    } else if (heading) {
      blocks.push({ type: 'heading', text: heading[1] })
    } else if (!line.trim()) {
      blocks.push({ type: 'break' })
    } else if (last?.type === 'p') {
      last.text += '\n' + line
    } else {
      blocks.push({ type: 'p', text: line })
    }
  }
  return blocks.filter((b) => b.type !== 'break')
}

// Splits "**bold** and `code`" into [{text, bold?, code?}] runs.
export const inlineRuns = (text) =>
  text.split(/(\*\*[^*]+\*\*|`[^`]+`)/).filter(Boolean).map((s) =>
    s.startsWith('**') ? { text: s.slice(2, -2), bold: true }
      : s.startsWith('`') ? { text: s.slice(1, -1), code: true }
        : { text: s })
