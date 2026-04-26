import { create } from 'zustand'

const useChatStore = create((set, get) => ({
  // ─── Document ───────────────────────────────────────────
  docId:      null,
  filename:   null,
  pageCount:  0,
  fileObject: null,   // the raw File from the upload input
  currentPage: 1,     // synced with PDF viewer scroll

  setDocument: (data) => set({
    docId:     data.doc_id,
    filename:  data.filename,
    pageCount: data.page_count,
    fileObject: data.fileObject,
    currentPage: 1,
  }),

  setCurrentPage: (page) => set({ currentPage: page }),

  clearDocument: () => set({
    docId: null, filename: null, pageCount: 0,
    fileObject: null, currentPage: 1,
  }),

  // ─── Chat ────────────────────────────────────────────────
  messages: [],   // [{ id, role, content, sources, isStreaming }]
  mode: 'default',

  setMode: (mode) => set({ mode }),

  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, { id: Date.now(), ...msg }],
  })),

  // Append a token to the last assistant message (for streaming)
  appendToken: (token) => set((state) => {
    const msgs = [...state.messages]
    const last = msgs[msgs.length - 1]
    if (last && last.role === 'assistant') {
      msgs[msgs.length - 1] = { ...last, content: last.content + token }
    }
    return { messages: msgs }
  }),

  setSources: (sources) => set((state) => {
    const msgs = [...state.messages]
    const last = msgs[msgs.length - 1]
    if (last && last.role === 'assistant') {
      msgs[msgs.length - 1] = { ...last, sources }
    }
    return { messages: msgs }
  }),

  finishStreaming: () => set((state) => {
    const msgs = [...state.messages]
    const last = msgs[msgs.length - 1]
    if (last && last.role === 'assistant') {
      msgs[msgs.length - 1] = { ...last, isStreaming: false }
    }
    return { messages: msgs }
  }),

  clearMessages: () => set({ messages: [] }),

  // Build chat history for the API (last 6 messages for context)
  getChatHistory: () => {
    const { messages } = get()
    return messages
      .filter((m) => !m.isStreaming)
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }))
  },
}))

export default useChatStore
