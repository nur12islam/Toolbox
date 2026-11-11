import { useEffect, useRef, useState } from 'react'
import { Download } from 'lucide-react'
import { saveBlob } from '../core/media'

export default function FaviconTool() {
  const [text, setText] = useState('T')
  const [bg, setBg] = useState('#dc143c')
  const [fg, setFg] = useState('#ffffff')
  const [shape, setShape] = useState('rounded')
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = canvas.current
    if (!c) return
    const ctx = c.getContext('2d')!
    c.width = 256
    c.height = 256
    ctx.clearRect(0, 0, 256, 256)
    ctx.fillStyle = bg
    if (shape === 'circle') {
      ctx.beginPath()
      ctx.arc(128, 128, 120, 0, Math.PI * 2)
      ctx.fill()
    } else if (shape === 'rounded') {
      ctx.beginPath()
      ctx.roundRect(8, 8, 240, 240, 48)
      ctx.fill()
    } else ctx.fillRect(0, 0, 256, 256)
    ctx.fillStyle = fg
    ctx.font = 'bold 144px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText((text || 'T').slice(0, 2), 128, 134)
  }, [text, bg, fg, shape])
  return (
    <div className="tool-layout">
      <div className="tool-controls">
        <label className="field">
          Letter or emoji
          <input
            maxLength={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="T"
          />
        </label>
        <div className="field-row">
          <label>
            Background
            <div className="color-input">
              <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} />
              <code>{bg}</code>
            </div>
          </label>
          <label>
            Foreground
            <div className="color-input">
              <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} />
              <code>{fg}</code>
            </div>
          </label>
        </div>
        <label className="field">
          Shape
          <select value={shape} onChange={(e) => setShape(e.target.value)}>
            <option value="rounded">Rounded square</option>
            <option value="circle">Circle</option>
            <option value="square">Square</option>
          </select>
        </label>
        <button
          className="btn primary full"
          onClick={() => canvas.current?.toBlob((b) => b && saveBlob(b, 'favicon.png'))}
        >
          <Download size={17} /> Download 256px PNG
        </button>
        <p className="hint">
          For browser compatibility, convert the PNG to .ico if your site requires that format.
        </p>
      </div>
      <div className="qr-preview">
        <canvas ref={canvas} className="favicon-canvas" />
        <strong>Favicon preview</strong>
        <small>256 × 256 PNG</small>
      </div>
    </div>
  )
}
