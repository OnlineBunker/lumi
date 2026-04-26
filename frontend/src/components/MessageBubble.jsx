import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'
import useChatStore from '../store/chatStore.js'

export default function MessageBubble({ message }) {
  const { setCurrentPage } = useChatStore()
  const { role, content, sources, isStreaming } = message
  const isUser = role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0  }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold mt-0.5"
        style={{
          background: isUser
            ? 'linear-gradient(135deg, #6366f1, #06b6d4)'
            : 'rgba(255,255,255,0.06)',
          color: isUser ? 'white' : 'var(--text-muted)',
          border: isUser ? 'none' : '1px solid var(--border)',
        }}
      >
        {isUser ? 'U' : 'AI'}
      </div>

      {/* Bubble + Sources */}
      <div className={`flex flex-col gap-2 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Message bubble */}
        <div
          className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
          style={{
            background: isUser
              ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(6,182,212,0.15))'
              : 'var(--glass)',
            border: `1px solid ${isUser ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`,
            color: 'var(--text-primary)',
            // Round corners contextually
            borderTopRightRadius: isUser ? '6px' : '16px',
            borderTopLeftRadius:  isUser ? '16px' : '6px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {content || (isStreaming ? '' : '…')}
          {/* Blinking cursor while streaming */}
          {isStreaming && <span className="cursor-blink" />}
        </div>

        {/* Citation chips — only on AI messages with sources */}
        {!isUser && sources && sources.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap gap-1.5"
          >
            {/* Deduplicate pages */}
            {[...new Map(sources.map((s) => [s.page, s])).values()].map((src) => (
              <button
                key={src.page}
                onClick={() => setCurrentPage(src.page)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200"
                style={{
                  background: 'rgba(99,102,241,0.12)',
                  border: '1px solid rgba(99,102,241,0.25)',
                  color: '#a5b4fc',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.22)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.12)'}
                title={src.text}
              >
                <BookOpen size={10} />
                Page {src.page}
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
