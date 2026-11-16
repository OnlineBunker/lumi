import { useState } from 'react'
import { FileUp, AlertCircle } from 'lucide-react'
import { uploadPdf } from '../api/client.js'
import useChatStore from '../store/chatStore.js'
import { useCycle, READING } from '../hooks/useCycle.js'
import ThemeToggle from '../components/ThemeToggle.jsx'

const MAX_MB = 20

export default function HomePage() {
  const [dragging, setDragging] = useState(false)
  const [upload, setUpload] = useState(null) // { name, progress 0-1 }
  const [error, setError] = useState(null)
  const setDocument = useChatStore((s) => s.setDocument)

  const processFile = async (file) => {
    if (!file || upload) return
    setError(null)
    if (!file.name.toLowerCase().endsWith('.pdf')) return setError(`“${file.name}” isn’t a PDF. Choose a .pdf file.`)
    if (file.size > MAX_MB * 1024 * 1024) return setError(`That file is over ${MAX_MB} MB. Try a smaller PDF.`)

    setUpload({ name: file.name, progress: 0 })
    try {
      const data = await uploadPdf(file, (e) => setUpload({ name: file.name, progress: e.progress ?? 1 }))
      setDocument({ ...data, fileObject: file })
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Check your connection and try again.')
      setUpload(null)
    }
  }

  const trySample = async () => {
    const blob = await fetch('/sample.pdf').then((r) => r.blob())
    processFile(new File([blob], 'sleep-primer.pdf', { type: 'application/pdf' }))
  }

  return (
    <div className="min-h-full flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between">
        <span className="text-lg font-semibold tracking-tight"><span className="highlight">Lumi</span></span>
        <ThemeToggle />
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 pt-6 pb-16 grid lg:grid-cols-[1fr_1.05fr] gap-14 lg:gap-20 items-center">
        <div className="max-w-xl">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.08] text-balance">
            Ask your PDF <span className="highlight">anything</span>.
          </h1>
          <p className="mt-4 text-lg text-ink-2 leading-relaxed text-pretty">
            Upload a document and ask in plain language. Every answer points to the page it came from,
            and Lumi highlights the exact passage so you can check it.
          </p>

          <label
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]) }}
            className={`mt-10 block rounded-2xl border-2 border-dashed p-6 sm:p-7 transition-colors focus-within:border-[rgb(var(--focus))] ${
              upload ? 'border-line bg-surface' : dragging ? 'border-ink bg-fill' : 'border-line bg-surface hover:border-ink-3 cursor-pointer'
            }`}
          >
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              disabled={!!upload}
              // Reset so picking the same file again (after an error) still fires
              onChange={(e) => { processFile(e.target.files[0]); e.target.value = '' }}
            />
            {upload ? <Progress {...upload} /> : (
              <div className="flex items-center gap-5 pointer-events-none">
                <div className="shrink-0 grid place-items-center w-12 h-12 rounded-xl bg-fill text-ink-2">
                  <FileUp size={22} strokeWidth={1.75} aria-hidden />
                </div>
                <div>
                  <p className="font-medium">{dragging ? 'Drop to upload' : 'Choose a PDF or drop it here'}</p>
                  <p className="mt-0.5 text-sm text-ink-3">Text-based PDFs up to {MAX_MB} MB</p>
                </div>
              </div>
            )}
          </label>

          {error && (
            <p role="alert" className="mt-3 flex items-start gap-2 text-sm text-ink-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden /> {error}
            </p>
          )}

          {!upload && (
            <p className="mt-5 text-sm text-ink-2">
              No PDF handy?{' '}
              <button onClick={trySample} className="font-medium text-ink underline decoration-mark decoration-[3px] underline-offset-4 hover:decoration-ink">
                Try a sample about sleep
              </button>
            </p>
          )}
        </div>

        <Preview />
      </main>

      <footer className="px-6 py-5 text-sm text-ink-3 text-center">
        Answers are written by Google Gemini and can be wrong. Check the cited page.
      </footer>
    </div>
  )
}

function Progress({ name, progress }) {
  const word = useCycle(READING)
  const uploading = progress < 1
  return (
    <div>
      <p className="font-medium truncate">{name}</p>
      <div
        role="progressbar"
        aria-label={uploading ? 'Uploading' : 'Reading the document'}
        aria-valuenow={uploading ? Math.round(progress * 100) : undefined}
        className="mt-3 h-1.5 rounded-full bg-fill overflow-hidden"
      >
        <div
          className={`h-full rounded-full bg-ink transition-[width] duration-300 ${uploading ? '' : 'animate-pulse'}`}
          style={{ width: `${Math.max(progress, 0.04) * 100}%` }}
        />
      </div>
      <p className="mt-2.5 text-sm">
        {uploading ? <span className="text-ink-2">Uploading {Math.round(progress * 100)}%</span> : <span className="shimmer">{word}…</span>}
      </p>
    </div>
  )
}

// A static picture of the core loop: a page with a cited passage, and the answer that cites it.
function Preview() {
  const line = (w, i) => <div key={i} className="h-2 rounded-full bg-zinc-200" style={{ width: `${w}%` }} />
  return (
    <div aria-hidden className="relative w-full max-w-[520px] h-[340px] sm:h-[400px] mx-auto select-none">
      <div className="absolute left-0 top-0 w-[72%] h-[88%] rounded-md bg-white p-[7%] shadow-[0_1px_3px_rgb(0_0_0/0.1),0_16px_40px_rgb(0_0_0/0.10)]">
        <div className="h-1.5 w-1/3 rounded-full bg-zinc-200" />
        <div className="mt-5 h-3.5 w-3/5 rounded-full bg-zinc-300" />
        <div className="mt-5 space-y-2.5">{[100, 94, 97, 58].map(line)}</div>
        <div className="mt-5 space-y-2.5">
          {[96, 100, 71].map((w, i) => (
            <div key={i} className="mark-line h-2 rounded-full bg-zinc-200" style={{ width: `${w}%`, animationDelay: `${500 + i * 180}ms` }} />
          ))}
        </div>
        <div className="mt-5 space-y-2.5">{[100, 89, 64].map(line)}</div>
      </div>
      <div className="absolute right-0 bottom-0 w-[62%] rounded-2xl border border-line bg-surface p-4 shadow-[0_16px_40px_rgb(0_0_0/0.14)]">
        <p className="ml-auto w-fit px-3 py-1.5 rounded-xl rounded-br-sm bg-fill text-[13px]">Why do I crash after coffee?</p>
        <p className="mt-3 text-[13px] leading-5">
          Caffeine only hides sleep pressure. When it wears off, all of it hits at once.
        </p>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-ink-3">
          From <span className="px-2 py-0.5 rounded-md bg-mark text-[#1a1a1e] font-medium">p. 1</span>
        </div>
      </div>
    </div>
  )
}
