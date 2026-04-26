import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Send, Plus, Sparkles } from 'lucide-react'
import useChatStore from '../store/chatStore.js'
import { useChat } from '../hooks/useChat.js'
import MessageBubble from './MessageBubble.jsx'
import ActionPanel from './ActionPanel.jsx'

// Quick-starter prompts shown when chat is empty
const STARTERS = [
  'Summarize this document',
  'What are the main points?',
  'Explain the key concepts',
  'What conclusions are drawn?',
]

export default function ChatPanel() {
  const [input, setInput]               = useState('')
  const [showActions, setShowActions]   = useState(false)
  const [isFocused, setIsFocused]       = useState(false)
  const messagesEndRef                  = useRef(null)
  const textareaRef                     = useRef(null)

  const { messages, mode, setMode }     = useChatStore()
  const { sendMessage, isLoading }      = useChat()

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const q = input.trim()
    if (!q || isLoading) return
    setInput('')
    sendMessage(q)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Auto-grow textarea up to 5 lines
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }, [input])

  const modeLabel = mode !== 'default' ? mode.toUpperCase() : null

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--surface)' }}>
      {/* ─── Messages area ─── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 min-h-0">

        {messages.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full gap-6 text-center px-4"
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                 style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
              <Sparkles size={20} color="#6366f1" />
            </div>
            <div>
              <p className="font-display font-semibold text-lg mb-1"
                 style={{ color: 'var(--text-primary)' }}>
                Ask anything
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Answers are grounded in your document
              </p>
            </div>

            {/* Quick starter chips */}
            <div className="flex flex-wrap justify-center gap-2">
              {STARTERS.map((s) => (
                <motion.button
                  key={s}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => sendMessage(s)}
                  className="px-3 py-2 rounded-xl text-sm transition-all duration-200"
                  style={{
                    background: 'var(--glass)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          /* Message list */
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* ─── Input area ─── */}
      <div
        className="shrink-0 px-4 pb-4 pt-2"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        {/* Active mode badge */}
        <AnimatePresence>
          {modeLabel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2 flex items-center gap-2"
            >
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: 'rgba(99,102,241,0.15)',
                      border: '1px solid rgba(99,102,241,0.3)',
                      color: '#a5b4fc',
                    }}>
                {modeLabel} mode
              </span>
              <button
                className="text-xs"
                style={{ color: 'var(--text-muted)' }}
                onClick={() => setMode('default')}
              >
                reset
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input box container — relative for ActionPanel positioning */}
        <div className="relative">
          {/* Action Panel popup */}
          <AnimatePresence>
            {showActions && (
              <ActionPanel
                onClose={() => setShowActions(false)}
                onModeSelect={(m) => setMode(m)}
              />
            )}
          </AnimatePresence>

          {/* Input pill */}
          <div
            className="flex items-end gap-2 rounded-2xl p-2 transition-all duration-200"
            style={{
              background: 'var(--glass)',
              border: `1px solid ${isFocused ? 'rgba(99,102,241,0.5)' : 'var(--border)'}`,
              boxShadow: isFocused ? '0 0 0 3px rgba(99,102,241,0.08)' : 'none',
            }}
          >
            {/* Plus / Actions button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowActions((v) => !v)}
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 mb-0.5"
              style={{
                background: showActions ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${showActions ? 'rgba(99,102,241,0.4)' : 'var(--border)'}`,
                color: showActions ? '#6366f1' : 'var(--text-muted)',
              }}
            >
              <motion.div animate={{ rotate: showActions ? 45 : 0 }} transition={{ type: 'spring', stiffness: 300 }}>
                <Plus size={15} />
              </motion.div>
            </motion.button>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ask a question…"
              disabled={isLoading}
              className="flex-1 bg-transparent resize-none outline-none text-sm leading-relaxed py-1.5 disabled:opacity-50"
              style={{
                color: 'var(--text-primary)',
                fontFamily: 'DM Sans, sans-serif',
                overflowY: 'hidden',
              }}
              style2={{
                '::placeholder': { color: 'var(--text-muted)' },
              }}
            />

            {/* Send button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 mb-0.5 disabled:opacity-30"
              style={{
                background: input.trim() && !isLoading
                  ? 'linear-gradient(135deg, #6366f1, #06b6d4)'
                  : 'rgba(255,255,255,0.06)',
                border: 'none',
                cursor: input.trim() && !isLoading ? 'pointer' : 'default',
              }}
            >
              {isLoading ? (
                <div className="w-3 h-3 rounded-full border border-transparent"
                     style={{ borderTopColor: 'white', animation: 'spin 0.7s linear infinite' }} />
              ) : (
                <Send size={13} color={input.trim() ? 'white' : 'var(--text-muted)'} />
              )}
            </motion.button>
          </div>

          <p className="text-center text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

      <style>{`
        textarea::placeholder { color: var(--text-muted); }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
