import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'

// index.html sets data-theme before first paint (saved choice, else the system setting)
export default function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === 'dark')

  const toggle = () => {
    // Read the live value: the system setting may have flipped it since render
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('theme', theme) } catch { /* private mode: lasts this visit only */ }
    setDark(theme === 'dark')
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      className="shrink-0 grid place-items-center w-9 h-9 rounded-lg text-ink-2 hover:text-ink hover:bg-fill transition-colors"
    >
      {dark ? <Sun size={17} aria-hidden /> : <Moon size={17} aria-hidden />}
    </button>
  )
}
