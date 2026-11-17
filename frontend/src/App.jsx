import { lazy, Suspense } from 'react'
import useChatStore from './store/chatStore.js'
import HomePage from './pages/HomePage.jsx'

// The workspace carries the PDF engine (~2/3 of the app); the home page shouldn't wait for it
const WorkspacePage = lazy(() => import('./pages/WorkspacePage.jsx'))

export default function App() {
  const hasDoc = useChatStore((s) => !!s.docId)
  return hasDoc ? <Suspense><WorkspacePage /></Suspense> : <HomePage />
}
