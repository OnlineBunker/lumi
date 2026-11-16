import { useState } from 'react'
import { AlertCircle, Check, Copy, X } from 'lucide-react'
import useChatStore from '../store/chatStore.js'
import { splitSources, parseBlocks, inlineRuns } from '../answer.js'
import { useCycle, THINKING } from '../hooks/useCycle.js'

const Inline = ({ text }) => inlineRuns(text).map((r, i) =>
  r.bold ? <strong key={i} className="font-semibold">{r.text}</strong>
    : r.code ? <code key={i} className="px-1 py-0.5 rounded bg-fill text-[0.9em]">{r.text}</code>
      : r.text)

function Answer({ text }) {
  return parseBlocks(text).map((b, i) => {
    if (b.type === 'heading') return <h3 key={i} className="font-semibold mt-1">{b.text}</h3>
    if (b.type === 'list') {
      const List = b.ordered ? 'ol' : 'ul'
      return (
        <List key={i} className={`pl-5 space-y-1.5 ${b.ordered ? 'list-decimal' : 'list-disc'} marker:text-ink-3`}>
          {b.items.map((t, j) => <li key={j} className="pl-1"><Inline text={t} /></li>)}
        </List>
      )
    }
    return <p key={i} className="whitespace-pre-line"><Inline text={b.text} /></p>
  })
}

function Thinking() {
  const word = useCycle(THINKING)
  return <p className="shimmer w-fit">{word}…</p>
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => navigator.clipboard.writeText(text).then(() => {
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  })
  return (
    <button onClick={copy} aria-label={copied ? 'Copied' : 'Copy answer'} className="ml-auto grid place-items-center w-8 h-8 rounded-lg text-ink-3 hover:text-ink hover:bg-fill transition-colors">
      {copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
    </button>
  )
}

export default function MessageBubble({ message, onRetry }) {
  const cite = useChatStore((s) => s.cite)
  const highlight = useChatStore((s) => s.highlight)
  const { role, content, sources = [], isStreaming, error } = message

  if (role === 'user') {
    return (
      <div className="self-end max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-md bg-fill text-[15px] leading-6 whitespace-pre-wrap break-words">
        {content}
      </div>
    )
  }

  const { body, pages } = splitSources(content)
  // Prefer the pages the model says it used; fall back to everything that was retrieved
  const cited = [...new Set(pages ?? sources.map((s) => s.page))].sort((a, b) => a - b)
  const textFor = (page) => sources.filter((s) => s.page === page).map((s) => s.text).join(' ')

  return (
    <div className="text-[15px] leading-relaxed break-words">
      <div className={`space-y-3 ${isStreaming ? '[&>*:last-child]:caret' : ''}`}>
        {body ? <Answer text={body} /> : isStreaming && <Thinking />}
      </div>

      {error && (
        <div role="alert" className="mt-2 flex items-start gap-2 text-sm text-ink-2">
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
          <p>
            Couldn’t get an answer. <span className="text-ink-3">{error}</span>
            {onRetry && (
              <button onClick={onRetry} className="ml-2 font-medium text-ink underline underline-offset-4">Try again</button>
            )}
          </p>
        </div>
      )}

      {!isStreaming && !error && body && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {cited.length > 0 && <span className="text-sm text-ink-3 mr-1">From</span>}
          {cited.map((page) => {
            const on = highlight?.page === page && highlight.text === textFor(page)
            return (
              <button
                key={page}
                onClick={() => cite(page, textFor(page))}
                aria-pressed={on}
                aria-label={on ? `Remove highlight on page ${page}` : `Show page ${page} in the document`}
                className={`h-7 px-2.5 flex items-center gap-1 rounded-md bg-mark text-[13px] font-medium text-[#1a1a1e] hover:brightness-95 transition ${
                  on ? 'ring-2 ring-ink ring-offset-2 ring-offset-surface' : ''
                }`}
              >
                p. {page}
                {on && <X size={12} strokeWidth={2.5} aria-hidden />}
              </button>
            )
          })}
          <CopyButton text={body} />
        </div>
      )}
    </div>
  )
}
