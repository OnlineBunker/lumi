import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Baby, GraduationCap, BrainCircuit, Languages, X } from 'lucide-react'
import useChatStore from '../store/chatStore.js'

const MODES = [
  {
    id:    'summary',
    icon:  FileText,
    label: 'Summary',
    desc:  'Key points as bullets',
    color: '#10b981',   // emerald
  },
  {
    id:    'eli5',
    icon:  Baby,
    label: 'ELI5',
    desc:  'Simple language',
    color: '#f59e0b',   // amber
  },
  {
    id:    'student',
    icon:  GraduationCap,
    label: 'Student',
    desc:  'Structured + examples',
    color: '#6366f1',   // indigo
  },
  {
    id:    'pro',
    icon:  BrainCircuit,
    label: 'Pro',
    desc:  'Technical depth',
    color: '#ec4899',   // pink
  },
  {
    id:    'translate',
    icon:  Languages,
    label: 'Translate',
    desc:  'To English',
    color: '#06b6d4',   // cyan
  },
]

export default function ActionPanel({ onClose, onModeSelect }) {
  const { mode: activeMode } = useChatStore()

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.95 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        exit={{    opacity: 0, y: 8,  scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl p-3"
        style={{
          background: 'rgba(11,11,26,0.95)',
          border: '1px solid var(--border)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          zIndex: 50,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-xs font-semibold uppercase tracking-widest"
             style={{ color: 'var(--text-muted)' }}>
            Response style
          </p>
          <button onClick={onClose}
                  className="w-5 h-5 flex items-center justify-center rounded"
                  style={{ color: 'var(--text-muted)' }}>
            <X size={12} />
          </button>
        </div>

        {/* Mode grid */}
        <div className="grid grid-cols-5 gap-2">
          {MODES.map(({ id, icon: Icon, label, desc, color }) => {
            const isActive = activeMode === id
            return (
              <motion.button
                key={id}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { onModeSelect(id); onClose() }}
                className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200"
                style={{
                  background: isActive ? `${color}22` : 'var(--glass)',
                  border: `1px solid ${isActive ? `${color}55` : 'var(--border)'}`,
                }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                     style={{ background: `${color}20` }}>
                  <Icon size={15} style={{ color }} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold leading-none mb-0.5"
                     style={{ color: isActive ? color : 'var(--text-primary)' }}>
                    {label}
                  </p>
                  <p className="text-[10px] leading-tight hidden sm:block"
                     style={{ color: 'var(--text-muted)' }}>
                    {desc}
                  </p>
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Active mode indicator */}
        {activeMode !== 'default' && (
          <div className="mt-3 pt-3 flex items-center justify-between"
               style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Active mode:
              <span className="ml-1 font-semibold" style={{ color: 'var(--text-primary)' }}>
                {MODES.find(m => m.id === activeMode)?.label}
              </span>
            </p>
            <button
              onClick={() => { onModeSelect('default'); onClose() }}
              className="text-xs px-2 py-1 rounded-md transition-all duration-200"
              style={{ color: 'var(--text-muted)', background: 'var(--glass)' }}
            >
              Reset
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
