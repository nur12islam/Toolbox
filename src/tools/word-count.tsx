import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { countText } from '../core/logic'

export default function WordCounterTool() {
  const [text, setText] = useState('')
  const stats = countText(text)
  const metrics = [
    ['Words', stats.words],
    ['Characters', stats.chars],
    ['No spaces', stats.charsNoSpaces],
    ['Sentences', stats.sentences],
    ['Paragraphs', stats.paragraphs],
    ['Reading time', stats.minutes ? `${stats.minutes} min` : '—'],
  ]
  return (
    <div className="single-tool">
      <label className="field">
        Paste or type your text
        <textarea
          className="word-input"
          rows={12}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Start typing or paste text here…"
        />
      </label>
      <div className="word-metrics">
        {metrics.map(([label, value]) => (
          <div className="word-metric" key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="signature-actions">
        <button className="btn secondary" disabled={!text} onClick={() => setText('')}>
          <RotateCcw size={16} />
          Clear text
        </button>
        <button
          className="btn primary"
          disabled={!text}
          onClick={() => navigator.clipboard.writeText(text)}
        >
          Copy text
        </button>
      </div>
      <p className="hint">
        Reading time is estimated at 200 words per minute. Your text stays in this browser tab.
      </p>
    </div>
  )
}
