import { useEffect, useRef, useState } from 'react'
import { FileText } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { api } from '../api/client.js'
import useChatStore from '../store/chatStore.js'
import PDFViewer from '../components/PDFViewer.jsx'
import ChatPanel from '../components/ChatPanel.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'

export default function WorkspacePage() {
  // Narrow subscription: streaming tokens change `messages` many times a second, and this page
  // (plus the PDF under it) only needs to know whether a chat exists
  const { docId, filename, pageCount, hasChat, view, setView, clearDocument } = useChatStore(useShallow((s) => ({
    docId: s.docId, filename: s.filename, pageCount: s.pageCount, hasChat: s.messages.length > 0,
    view: s.view, setView: s.setView, clearDocument: s.clearDocument,
  })))
  const sheetOpen = view === 'doc'
  const closeSheet = () => setView('chat')
  const [dragY, setDragY] = useState(0)
  const startY = useRef(0)

  // The conversation lives only in this tab; warn before a refresh or Back throws it away
  useEffect(() => {
    if (!hasChat) return
    const warn = (e) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [hasChat])

  useEffect(() => {
    if (!sheetOpen) return
    const onKey = (e) => e.key === 'Escape' && closeSheet()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sheetOpen])

  const close = () => {
    if (hasChat && !window.confirm(`Close ${filename}? This conversation will be cleared.`)) return
    api.delete(`/document/${docId}`).catch(() => {})
    clearDocument()
  }

  return (
    <div className="h-full flex flex-col">
      <header className="shrink-0 h-14 flex items-center gap-3 px-4 border-b border-line bg-surface">
        <span className="hidden sm:inline font-semibold tracking-tight"><span className="highlight">Lumi</span></span>
        <div className="min-w-0 flex-1 flex items-baseline gap-2 sm:pl-1">
          <h1 className="truncate text-sm font-medium" title={filename}>{filename}</h1>
          <span className="hidden sm:inline shrink-0 text-sm text-ink-3">{pageCount} {pageCount === 1 ? 'page' : 'pages'}</span>
        </div>
        <button
          onClick={() => setView('doc')}
          className="md:hidden shrink-0 h-9 px-3 flex items-center gap-1.5 rounded-lg bg-fill text-sm font-medium"
        >
          <FileText size={15} aria-hidden /> View
        </button>
        <ThemeToggle />
        <button onClick={close} className="shrink-0 h-9 px-3.5 rounded-lg text-sm font-medium border border-line hover:bg-fill transition-colors">
          New<span className="hidden sm:inline"> PDF</span>
        </button>
      </header>

      <div className="flex-1 min-h-0 flex">
        {/* Phones: the PDF is a sheet over the chat. Wider screens: a pane beside it. */}
        {sheetOpen && <div onClick={closeSheet} className="md:hidden fixed inset-0 z-30 bg-black/40 animate-[fade_200ms_ease-out]" aria-hidden />}
        <section
          aria-label="Document"
          className={`${sheetOpen
            ? 'fixed inset-x-0 bottom-0 top-4 z-40 flex rounded-t-2xl overflow-hidden shadow-2xl animate-[sheet-up_300ms_cubic-bezier(0.2,0.8,0.2,1)]'
            : 'hidden'} md:static md:z-auto md:flex md:flex-1 md:min-w-0 md:rounded-none md:shadow-none md:animate-none flex-col`}
          style={dragY ? { transform: `translateY(${dragY}px)` } : undefined}
        >
          <div
            className="md:hidden shrink-0 bg-surface border-b border-line touch-none"
            onTouchStart={(e) => { startY.current = e.touches[0].clientY }}
            onTouchMove={(e) => setDragY(Math.max(0, e.touches[0].clientY - startY.current))}
            onTouchEnd={() => { if (dragY > 100) closeSheet(); setDragY(0) }}
          >
            <div className="mx-auto mt-2 w-10 h-1.5 rounded-full bg-line" />
            <div className="h-11 flex items-center gap-3 px-4">
              <p className="flex-1 truncate text-sm font-medium">{filename}</p>
              <button onClick={closeSheet} className="h-9 px-1 text-[15px] font-semibold">Done</button>
            </div>
          </div>
          <PDFViewer />
        </section>

        <section aria-label="Chat" className="flex-1 md:flex-none md:w-[400px] lg:w-[440px] min-w-0 flex md:border-l border-line bg-surface">
          <ChatPanel />
        </section>
      </div>
    </div>
  )
}
