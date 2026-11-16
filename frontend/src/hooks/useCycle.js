import { useEffect, useState } from 'react'

export const READING = [
  'Reading the fine print', 'Skimming the margins', 'Untangling paragraphs', 'Indexing every page',
  'Dog-earing the good parts', 'Combobulating', 'Brewing embeddings', 'Sharpening pencils',
  'Cross-referencing', 'Highlighting the highlights', 'Counting footnotes', 'Alphabetizing thoughts',
]

export const THINKING = [
  'Thinking', 'Flipping pages', 'Checking the index', 'Connecting the dots', 'Consulting the footnotes',
  'Mulling it over', 'Pondering', 'Recombobulating', 'Finding the right page', 'Squinting at page numbers',
  'Reading between the lines', 'Hunting for quotes',
]

// Cycles through `words`, starting at a random one, Claude Code style.
export function useCycle(words, ms = 1800) {
  const [i, setI] = useState(() => Math.floor(Math.random() * words.length))
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % words.length), ms)
    return () => clearInterval(t)
  }, [words, ms])
  return words[i]
}
