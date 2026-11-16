import { useState, useEffect, useRef, useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight, Minus, Plus, Highlighter } from 'lucide-react'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import useChatStore from '../store/chatStore.js'

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim()
const escape = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

const placeholder = <div className="w-[min(100%,640px)] aspect-[1/1.3] rounded bg-surface/60 animate-pulse" />

const iconButton = 'grid place-items-center w-9 h-9 rounded-lg text-ink-2 hover:bg-fill hover:text-ink disabled:opacity-35 disabled:hover:bg-transparent transition-colors'

export default function PDFViewer() {
  // Only the fields we use, so streaming chat tokens don't re-render the PDF
  const { fileObject, pageCount, currentPage, setCurrentPage, highlight } = useChatStore(useShallow((s) => ({
    fileObject: s.fileObject, pageCount: s.pageCount, currentPage: s.currentPage,
    setCurrentPage: s.setCurrentPage, highlight: s.highlight,
  })))
  const [fileUrl, setFileUrl] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [width, setWidth] = useState(600)
  const scrollRef = useRef(null)

  useEffect(() => {
    const url = URL.createObjectURL(fileObject)
    setFileUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [fileObject])

  // Fit the page to the pane, but don't let it grow past a comfortable reading width
  useEffect(() => {
    // Width is 0 while the phone sheet is closed; keep the last real width
    const ro = new ResizeObserver(([e]) => e.contentRect.width && setWidth(Math.min(e.contentRect.width - 48, 820)))
    ro.observe(scrollRef.current)
    return () => ro.disconnect()
  }, [])

  const goTo = (page) => setCurrentPage(Math.max(1, Math.min(page, pageCount)))

  // Wrap the text-layer lines that belong to the cited passage in <mark>.
  // shortcut: matches line by line, so very short lines (< 12 chars) are never marked.
  const passage = highlight?.page === currentPage ? norm(highlight.text) : null
  const renderText = useCallback(({ str }) => {
    const line = norm(str)
    return passage && line.length >= 12 && passage.includes(line) ? `<mark>${escape(str)}</mark>` : escape(str)
  }, [passage])

  // Scroll to the passage on every citation click. Same page: the marks are already there.
  // New page: wait for its text layer. Zooming later re-renders it but must not jump again.
  const pendingPage = useRef(null) // page we still owe a scroll to
  const scrollToMark = useCallback(() => {
    const shown = Number(scrollRef.current.querySelector('[data-page-number]')?.dataset.pageNumber)
    const mark = scrollRef.current.querySelector('mark')
    if (mark && shown === pendingPage.current) {
      mark.scrollIntoView({ block: 'center', behavior: 'smooth' })
      pendingPage.current = null
    }
  }, [])
  useEffect(() => {
    pendingPage.current = highlight?.page ?? null
    scrollToMark()
  }, [highlight, scrollToMark])

  return (
    <div
      className="relative flex-1 min-w-0 min-h-0 flex flex-col bg-canvas"
      tabIndex={0}
      role="region"
      aria-label={`Page ${currentPage} of ${pageCount}. Use arrow keys to turn pages.`}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(currentPage + 1)
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goTo(currentPage - 1)
      }}
    >
      {/* isolate: pdf.js gives its text layer z-index 2; keep that inside so it can't cover the controls */}
      <div ref={scrollRef} className="isolate flex-1 overflow-auto px-6 pt-6 pb-24">
        {/* mx-auto, not justify-center: a zoomed page wider than the pane must stay scrollable on the left */}
        <div className="w-fit mx-auto">
          {fileUrl && (
            <Document file={fileUrl} loading={placeholder}>
              <Page
                pageNumber={currentPage}
                width={width * zoom}
                customTextRenderer={renderText}
                onRenderTextLayerSuccess={scrollToMark}
                loading={placeholder}
                className="shadow-[0_1px_3px_rgb(0_0_0/0.12),0_8px_24px_rgb(0_0_0/0.08)] rounded-sm overflow-hidden"
              />
            </Document>
          )}
        </div>
      </div>

      {/* Floating page controls, like Preview */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 rounded-xl bg-surface border border-line shadow-lg">
        <button onClick={() => goTo(currentPage - 1)} disabled={currentPage <= 1} aria-label="Previous page" className={iconButton}>
          <ChevronLeft size={18} aria-hidden />
        </button>
        <span className="px-2 text-sm tabular-nums text-ink-2 whitespace-nowrap">
          <span className="text-ink font-medium">{currentPage}</span> of {pageCount}
        </span>
        <button onClick={() => goTo(currentPage + 1)} disabled={currentPage >= pageCount} aria-label="Next page" className={iconButton}>
          <ChevronRight size={18} aria-hidden />
        </button>
        <span className="w-px h-5 mx-1 bg-line" aria-hidden />
        <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} disabled={zoom <= 0.5} aria-label="Zoom out" className={iconButton}>
          <Minus size={16} aria-hidden />
        </button>
        <button onClick={() => setZoom(1)} className="px-1.5 h-9 rounded-lg text-sm tabular-nums text-ink-2 hover:bg-fill w-14" aria-label={`Reset zoom (${Math.round(zoom * 100)}%)`}>
          {Math.round(zoom * 100)}%
        </button>
        <button onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))} disabled={zoom >= 2.5} aria-label="Zoom in" className={iconButton}>
          <Plus size={16} aria-hidden />
        </button>
        {passage && (
          <>
            <span className="w-px h-5 mx-1 bg-line" aria-hidden />
            <button onClick={() => useChatStore.setState({ highlight: null })} aria-label="Remove highlight" title="Remove highlight" className={iconButton}>
              <Highlighter size={16} aria-hidden />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
