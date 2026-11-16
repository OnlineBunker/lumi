import { create } from 'zustand'

// view: on phones the PDF opens as a sheet over the chat ('doc') or stays closed ('chat')
const emptyDoc = { docId: null, filename: null, pageCount: 0, fileObject: null, currentPage: 1, highlight: null, view: 'chat' }

let nextId = 0

const useChatStore = create((set) => ({
  ...emptyDoc,
  messages: [], // { id, role, content, sources, isStreaming }
  mode: 'default',

  setDocument: (data) => set({
    ...emptyDoc,
    docId: data.doc_id,
    filename: data.filename,
    pageCount: data.page_count,
    fileObject: data.fileObject,
  }),
  clearDocument: () => set({ ...emptyDoc, messages: [] }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  setMode: (mode) => set({ mode }),
  setView: (view) => set({ view }),
  // Jump to a cited page and mark the passage; citing the same passage again clears it
  cite: (page, text) => set((s) =>
    s.highlight?.page === page && s.highlight.text === text
      ? { highlight: null }
      : { currentPage: page, highlight: { page, text }, view: 'doc' }),

  addMessage: (msg) => set((s) => ({
    messages: [...s.messages, { id: nextId++, ...msg }],
  })),

  // Patch the last message (the one being streamed). `fn` gets it, returns the changed fields.
  updateLast: (fn) => set((s) => {
    const last = s.messages.at(-1)
    return { messages: [...s.messages.slice(0, -1), { ...last, ...fn(last) }] }
  }),
}))

export default useChatStore
