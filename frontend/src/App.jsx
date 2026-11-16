import useChatStore from './store/chatStore.js'
import HomePage from './pages/HomePage.jsx'
import WorkspacePage from './pages/WorkspacePage.jsx'

export default function App() {
  const hasDoc = useChatStore((s) => !!s.docId)
  return hasDoc ? <WorkspacePage /> : <HomePage />
}
