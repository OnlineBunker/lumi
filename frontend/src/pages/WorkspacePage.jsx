import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { X, FileText, ChevronLeft } from 'lucide-react'
import { api } from '../api/client.js'
import useChatStore from '../store/chatStore.js'
import PDFViewer from '../components/PDFViewer.jsx'
import ChatPanel from '../components/ChatPanel.jsx'

export default function WorkspacePage() {
  const navigate = useNavigate()
  const { docId, filename, clearDocument, clearMessages } = useChatStore()

  // Redirect to home if no document is loaded (e.g. on page refresh)
  useEffect(() => {
    if (!docId) navigate('/')
  }, [docId, navigate])

  const handleClose = async () => {
    // Clean up embeddings from vector store
    if (docId) {
      try { await api.delete(`/document/${docId}`) } catch { /* ignore */ }
    }
    clearDocument()
    clearMessages()
    navigate('/')
  }

  if (!docId) return null

  return (
    <motion.div
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: 'var(--void)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    >
      {/* ─── Top bar ─── */}
      <header
        className="flex items-center justify-between px-4 h-12 shrink-0"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
      >
        <button
          onClick={handleClose}
          className="flex items-center gap-1.5 text-sm transition-colors duration-200"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <ChevronLeft size={15} />
          Home
        </button>

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded flex items-center justify-center"
               style={{ background: 'rgba(99,102,241,0.2)' }}>
            <FileText size={11} color="#6366f1" />
          </div>
          <span className="text-sm font-medium truncate max-w-xs"
                style={{ color: 'var(--text-secondary)' }}>
            {filename}
          </span>
        </div>

        <button
          onClick={handleClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200"
          style={{ color: 'var(--text-muted)', background: 'transparent' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
            e.currentTarget.style.color = 'var(--text-primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-muted)'
          }}
        >
          <X size={14} />
        </button>
      </header>

      {/* ─── Main split view ─── */}
      <div className="flex flex-1 overflow-hidden">
        {/* PDF Viewer — 55% */}
        <div
          className="flex-1 overflow-hidden"
          style={{
            borderRight: '1px solid var(--border)',
            minWidth: 0,
            flexBasis: '55%',
            maxWidth: '55%',
          }}
        >
          <PDFViewer />
        </div>

        {/* Chat Panel — 45% */}
        <div style={{ flexBasis: '45%', maxWidth: '45%', minWidth: 0 }} className="flex flex-col">
          <ChatPanel />
        </div>
      </div>
    </motion.div>
  )
}
