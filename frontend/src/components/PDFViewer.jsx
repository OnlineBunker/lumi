import { useState, useEffect, useRef, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader } from 'lucide-react'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import useChatStore from '../store/chatStore.js'

// Required: tell react-pdf where the worker script lives
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export default function PDFViewer() {
  const { fileObject, pageCount, currentPage, setCurrentPage } = useChatStore()
  const [fileUrl, setFileUrl]     = useState(null)
  const [scale, setScale]         = useState(1.0)
  const [isLoading, setIsLoading] = useState(true)
  const containerRef = useRef(null)

  // Convert File object → object URL for react-pdf
  useEffect(() => {
    if (!fileObject) return
    const url = URL.createObjectURL(fileObject)
    setFileUrl(url)
    return () => URL.revokeObjectURL(url)   // cleanup on unmount
  }, [fileObject])

  // Calculate scale to fit PDF width to container
  const [containerWidth, setContainerWidth] = useState(600)
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width - 48)  // 24px padding each side
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const goTo = useCallback((page) => {
    const clamped = Math.max(1, Math.min(page, pageCount))
    setCurrentPage(clamped)
  }, [pageCount, setCurrentPage])

  const onKeyDown = useCallback((e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(currentPage + 1)
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goTo(currentPage - 1)
  }, [currentPage, goTo])

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="h-full flex flex-col outline-none"
      style={{ background: 'var(--void)' }}
    >
      {/* ─── PDF Controls ─── */}
      <div
        className="flex items-center justify-between px-4 py-2 shrink-0"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
      >
        {/* Page navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => goTo(currentPage - 1)}
            disabled={currentPage <= 1}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-30"
            style={{ background: 'var(--glass)', color: 'var(--text-secondary)' }}
          >
            <ChevronLeft size={14} />
          </button>

          <span className="text-sm tabular-nums" style={{ color: 'var(--text-secondary)' }}>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{currentPage}</span>
            <span> / {pageCount}</span>
          </span>

          <button
            onClick={() => goTo(currentPage + 1)}
            disabled={currentPage >= pageCount}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-30"
            style={{ background: 'var(--glass)', color: 'var(--text-secondary)' }}
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200"
            style={{ background: 'var(--glass)', color: 'var(--text-secondary)' }}
          >
            <ZoomOut size={13} />
          </button>
          <span className="text-xs w-10 text-center tabular-nums"
                style={{ color: 'var(--text-muted)' }}>
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200"
            style={{ background: 'var(--glass)', color: 'var(--text-secondary)' }}
          >
            <ZoomIn size={13} />
          </button>
        </div>
      </div>

      {/* ─── PDF Page ─── */}
      <div className="flex-1 overflow-auto flex justify-center py-6 px-4">
        {fileUrl ? (
          <Document
            file={fileUrl}
            onLoadSuccess={() => setIsLoading(false)}
            loading={
              <div className="flex items-center justify-center h-96">
                <Loader size={20} className="animate-spin" style={{ color: '#6366f1' }} />
              </div>
            }
          >
            <Page
              pageNumber={currentPage}
              width={containerWidth * scale}
              renderAnnotationLayer
              renderTextLayer
              loading={
                <div className="flex items-center justify-center"
                     style={{ width: containerWidth, height: 400 }}>
                  <Loader size={16} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
                </div>
              }
            />
          </Document>
        ) : (
          <div className="flex items-center justify-center h-96">
            <Loader size={20} className="animate-spin" style={{ color: '#6366f1' }} />
          </div>
        )}
      </div>
    </div>
  )
}
