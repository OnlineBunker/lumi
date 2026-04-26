import { useState } from 'react'
import toast from 'react-hot-toast'
import { streamChat } from '../api/client.js'
import useChatStore from '../store/chatStore.js'

export function useChat() {
  const [isLoading, setIsLoading] = useState(false)

  const {
    docId, mode,
    addMessage, appendToken, setSources,
    finishStreaming, getChatHistory,
  } = useChatStore()

  const sendMessage = async (question) => {
    if (!docId || isLoading) return
    if (!question.trim()) return

    // Add user message immediately
    addMessage({ role: 'user', content: question })

    // Add a blank streaming assistant message
    addMessage({ role: 'assistant', content: '', sources: [], isStreaming: true })

    setIsLoading(true)

    await streamChat({
      payload: {
        doc_id:       docId,
        question:     question.trim(),
        mode:         mode,
        chat_history: getChatHistory(),
      },
      onToken:   (token)   => appendToken(token),
      onSources: (sources) => setSources(sources),
      onDone:    ()        => { finishStreaming(); setIsLoading(false) },
      onError:   (msg)     => {
        finishStreaming()
        setIsLoading(false)
        toast.error(msg)
      },
    })
  }

  return { sendMessage, isLoading }
}
