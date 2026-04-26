import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Upload, FileText, Zap, Shield, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../api/client.js'
import useChatStore from '../store/chatStore.js'

const features = [
  { icon: Zap,      label: 'Streaming answers' },
  { icon: Sparkles, label: 'ELI5, Pro, Student modes' },
  { icon: Shield,   label: 'Page citations' },
  { icon: FileText, label: 'Any PDF up to 20 MB' },
]

export default function HomePage() {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState('')
  const navigate = useNavigate()
  const { setDocument } = useChatStore()

  const processFile = useCallback(async (file) => {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please upload a PDF file.')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File must be under 20 MB.')
      return
    }

    setIsUploading(true)
    setProgress('Extracting text…')

    try {
      const form = new FormData()
      form.append('file', file)

      setProgress('Embedding chunks…')
      const { data } = await api.post('/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded / e.total) * 100)
          setProgress(`Uploading… ${pct}%`)
        },
      })

      setDocument({ ...data, fileObject: file })
      toast.success(`Ready! ${data.chunk_count} chunks indexed.`)
      navigate('/workspace')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed.')
      setIsUploading(false)
      setProgress('')
    }
  }, [navigate, setDocument])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    processFile(file)
  }, [processFile])

  const onFileInput = (e) => processFile(e.target.files[0])

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--void)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
    >
      {/* Animated mesh background blobs */}
      <div className="mesh-blob w-96 h-96 bg-indigo-600 top-[-100px] left-[-100px]" style={{ animationDelay: '0s' }} />
      <div className="mesh-blob w-80 h-80 bg-violet-600 bottom-[-80px] right-[-80px]" style={{ animationDelay: '-7s' }} />
      <div className="mesh-blob w-64 h-64 bg-cyan-600 top-[40%] right-[10%]" style={{ animationDelay: '-14s' }} />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 w-full max-w-2xl px-6 flex flex-col items-center gap-10">
        {/* Logo + Heading */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6 glass"
               style={{ color: 'var(--text-secondary)', borderColor: 'rgba(99,102,241,0.3)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse-slow" />
            AI-powered PDF reader
          </div>

          <h1 className="font-display text-6xl font-800 tracking-tight leading-none mb-4"
              style={{ fontWeight: 800 }}>
            <span style={{ color: 'var(--text-primary)' }}>Chat with</span>
            <br />
            <span className="gradient-text">any PDF</span>
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Upload a document. Ask anything. Get cited, accurate answers.
          </p>
        </motion.div>

        {/* Upload Zone */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <label
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className="block cursor-pointer rounded-2xl transition-all duration-300"
            style={{
              background: isDragging ? 'rgba(99,102,241,0.12)' : 'var(--glass)',
              border: `2px dashed ${isDragging ? '#6366f1' : 'rgba(255,255,255,0.12)'}`,
              padding: '48px 32px',
            }}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-4">
                {/* Spinning loader */}
                <div className="w-14 h-14 rounded-full border-2 border-transparent"
                     style={{
                       borderTopColor: '#6366f1',
                       borderRightColor: '#06b6d4',
                       animation: 'spin 0.8s linear infinite',
                     }} />
                <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>{progress}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300"
                     style={{ background: 'rgba(99,102,241,0.15)', transform: isDragging ? 'scale(1.1)' : 'scale(1)' }}>
                  <Upload size={24} color="#6366f1" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                    Drop your PDF here
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    or <span style={{ color: '#6366f1' }}>browse files</span> · up to 20 MB
                  </p>
                </div>
              </div>
            )}
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={onFileInput}
              disabled={isUploading}
            />
          </label>
        </motion.div>

        {/* Feature chips */}
        <motion.div
          className="flex flex-wrap justify-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          {features.map(({ icon: Icon, label }) => (
            <div key={label}
                 className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm glass"
                 style={{ color: 'var(--text-secondary)' }}>
              <Icon size={13} style={{ color: '#6366f1' }} />
              {label}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Spinning keyframe inline — simpler than a class */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  )
}
