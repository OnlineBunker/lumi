import { useState, useRef, useEffect } from 'react'
import { ArrowUp, CornerDownRight } from 'lucide-react'
import useChatStore from '../store/chatStore.js'
import { useChat } from '../hooks/useChat.js'
import MessageBubble from './MessageBubble.jsx'
import ModeMenu from './ModeMenu.jsx'

const STARTERS = ['Summarize this document', 'What are the main points?', 'What conclusions does it draw?']

export default function ChatPanel() {
  const [input, setInput] = useState('')
  const endRef = useRef(null)
  const textareaRef = useRef(null)
  const stick = useRef(true) // follow new tokens only while the reader is at the bottom
  const { messages, mode, setMode, filename } = useChatStore()
  const { sendMessage, retry, isLoading } = useChat()
  const canSend = input.trim() && !isLoading

  useEffect(() => {
    if (stick.current) endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages])

  const ask = (q) => {
    stick.current = true
    sendMessage(q)
  }

  // Grow the textarea with its content, up to ~6 lines
  useEffect(() => {
    const ta = textareaRef.current
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }, [input])

  const send = () => {
    if (!canSend) return
    ask(input)
    setInput('')
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      <div
        role="log"
        aria-busy={isLoading}
        onScroll={(e) => {
          const el = e.currentTarget
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
        }}
        className="flex-1 min-h-0 overflow-y-auto px-5 py-6"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-end">
            <h2 className="text-lg font-semibold tracking-tight">What do you want to know?</h2>
            <p className="mt-1 text-sm text-ink-2">Ask anything about {filename}, or start here:</p>
            <div className="mt-4 flex flex-col items-start gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="flex items-center gap-2 h-10 px-3.5 rounded-xl border border-line text-sm text-ink-2 hover:text-ink hover:bg-fill transition-colors"
                >
                  <CornerDownRight size={14} className="text-ink-3" aria-hidden /> {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {messages.map((m, i) => (
              <MessageBubble key={m.id} message={m} onRetry={i === messages.length - 1 ? retry : undefined} />
            ))}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 p-3 pt-0">
        <div className="rounded-2xl border border-line bg-bg focus-within:border-ink-3 transition-colors">
          <label htmlFor="question" className="sr-only">Question</label>
          <textarea
            id="question"
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              // isComposing: Enter confirms an IME word (Japanese, Chinese…), it doesn't send
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send() }
            }}
            placeholder="Ask a question"
            // 16px on phones: iOS Safari zooms the whole page into smaller inputs
            className="block w-full resize-none bg-transparent px-4 pt-3.5 pb-1 text-base md:text-[15px] leading-6 outline-none placeholder:text-ink-3"
          />
          <div className="flex items-center justify-between gap-2 p-2">
            <ModeMenu value={mode} onChange={setMode} />
            <button
              onClick={send}
              disabled={!canSend}
              aria-label="Send"
              className="grid place-items-center w-9 h-9 rounded-full bg-ink text-bg disabled:bg-fill disabled:text-ink-3 transition-colors"
            >
              <ArrowUp size={18} strokeWidth={2.25} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
