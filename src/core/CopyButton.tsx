import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'

type CopyState = 'idle' | 'copied' | 'failed'

/** Icon button that copies text and confirms it with a short, accessible icon morph. */
export function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<CopyState>('idle')
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setState('copied')
    } catch {
      setState('failed')
    }
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setState('idle'), 1600)
  }

  return (
    <>
      <button
        type="button"
        className="icon-btn copy-btn"
        data-state={state}
        aria-label={label}
        onClick={copy}
      >
        <span className="copy-icon copy-icon-idle">
          <Copy size={16} />
        </span>
        <span className="copy-icon copy-icon-done">
          <Check size={16} />
        </span>
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {state === 'copied' ? 'Copied to clipboard' : state === 'failed' ? 'Copy failed' : ''}
      </span>
    </>
  )
}
