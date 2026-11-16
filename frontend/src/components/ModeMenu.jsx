import { useState, useRef, useEffect } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'

// Keys match MODE_PROMPTS in backend/utils/prompt_builder.py
const MODES = {
  default: ['Standard', 'Clear, direct answers'],
  summary: ['Summary', 'Key points as bullets'],
  eli5: ['Explain simply', 'Plain words, no jargon'],
  student: ['Study notes', 'Concepts, definitions, examples'],
  pro: ['Expert', 'Technical depth and terms'],
  translate: ['Translate', 'Into natural English'],
}

export default function ModeMenu({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const listRef = useRef(null)
  const triggerRef = useRef(null)

  useEffect(() => {
    if (open) listRef.current.querySelector('[aria-selected=true]').focus()
  }, [open])

  const close = () => { setOpen(false); triggerRef.current.focus() }

  const onKeyDown = (e) => {
    const options = [...listRef.current.children]
    const i = options.indexOf(document.activeElement)
    if (e.key === 'Escape') close()
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      options[(i + (e.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length].focus()
    }
  }

  return (
    // Closes when focus leaves the menu (click outside, Tab away)
    <div className="relative" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}>
      <button
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Answer style: ${MODES[value][0]}`}
        className={`flex items-center gap-1.5 h-8 pl-2.5 pr-2 rounded-lg text-sm transition-colors hover:bg-fill ${
          open ? 'bg-fill text-ink' : value === 'default' ? 'text-ink-2' : 'text-ink font-medium'
        }`}
      >
        {MODES[value][0]}
        <ChevronsUpDown size={14} aria-hidden className="text-ink-3" />
      </button>

      {open && (
        <div
          ref={listRef}
          role="listbox"
          aria-label="Answer style"
          onKeyDown={onKeyDown}
          className="absolute bottom-full left-0 mb-2 z-20 w-64 p-1 rounded-xl border border-line bg-surface shadow-[0_12px_32px_rgb(0_0_0/0.16)] origin-bottom-left animate-[pop_140ms_ease-out]"
        >
          {Object.entries(MODES).map(([id, [label, hint]]) => (
            <button
              key={id}
              role="option"
              aria-selected={id === value}
              onClick={() => { onChange(id); close() }}
              className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left outline-none hover:bg-fill focus-visible:bg-fill"
            >
              <Check size={15} aria-hidden className={`mt-0.5 shrink-0 ${id === value ? 'text-ink' : 'invisible'}`} />
              <span>
                <span className="block text-sm font-medium leading-5">{label}</span>
                <span className="block text-[13px] leading-5 text-ink-3">{hint}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
