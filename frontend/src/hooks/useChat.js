import { streamChat, uploadPdf } from '../api/client.js'
import useChatStore from '../store/chatStore.js'

export function useChat() {
  const isLoading = useChatStore((s) => !!s.messages.at(-1)?.isStreaming)

  // Reads the store at call time, so retry() sees the messages it just removed
  const sendMessage = (question) => {
    const { docId, fileObject, mode, messages, addMessage, updateLast } = useChatStore.getState()
    question = question.trim()
    if (!docId || !question || messages.at(-1)?.isStreaming) return

    // History is taken before the new question is added, so it isn't sent twice.
    const chat_history = messages.filter((m) => !m.error).slice(-6).map(({ role, content }) => ({ role, content }))
    addMessage({ role: 'user', content: question })
    addMessage({ role: 'assistant', content: '', sources: [], isStreaming: true })

    const ask = (doc_id, retried) => streamChat({
      payload: { doc_id, question, mode, chat_history },
      onToken: (t) => updateLast((m) => ({ content: m.content + t })),
      onSources: (sources) => updateLast(() => ({ sources })),
      onDone: () => updateLast(() => ({ isStreaming: false })),
      onError: async (msg, status) => {
        // The server lost the doc (restart). We still have the PDF, so upload it again once.
        if (status === 404 && !retried) {
          try {
            const { doc_id: newId } = await uploadPdf(fileObject)
            useChatStore.setState({ docId: newId })
            return ask(newId, true)
          } catch (err) {
            msg = err.response?.data?.detail || err.message
          }
        }
        updateLast(() => ({ isStreaming: false, error: msg }))
      },
    })
    ask(docId, false)
  }

  // Drop the failed question and answer, then ask again
  const retry = () => {
    const { messages } = useChatStore.getState()
    useChatStore.setState({ messages: messages.slice(0, -2) })
    sendMessage(messages.at(-2).content)
  }

  return { sendMessage, retry, isLoading }
}
