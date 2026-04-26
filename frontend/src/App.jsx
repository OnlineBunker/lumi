import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import HomePage from './pages/HomePage.jsx'
import WorkspacePage from './pages/WorkspacePage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/"          element={<HomePage />} />
          <Route path="/workspace" element={<WorkspacePage />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  )
}
