import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Download, RotateCcw } from 'lucide-react'
import { saveFile } from '../core/pdf'

export default function SignatureTool() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const [color, setColor] = useState('#101014')
  const [width, setWidth] = useState(4)
  const point = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) * event.currentTarget.width) / rect.width,
      y: ((event.clientY - rect.top) * event.currentTarget.height) / rect.height,
    }
  }
  const start = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    drawing.current = true
    last.current = point(event)
    const context = event.currentTarget.getContext('2d')!
    context.fillStyle = color
    context.beginPath()
    context.arc(last.current.x, last.current.y, width / 2, 0, Math.PI * 2)
    context.fill()
  }
  const draw = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !last.current) return
    const next = point(event),
      context = event.currentTarget.getContext('2d')!
    context.strokeStyle = color
    context.lineWidth = width
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.beginPath()
    context.moveTo(last.current.x, last.current.y)
    context.lineTo(next.x, next.y)
    context.stroke()
    last.current = next
  }
  const clear = () => {
    const canvas = canvasRef.current
    if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
  }
  return (
    <div className="single-tool signature-tool">
      <p className="hint">
        Draw with your mouse, finger, or stylus. Export as a transparent PNG for documents and
        forms.
      </p>
      <canvas
        ref={canvasRef}
        className="signature-pad"
        width={1200}
        height={420}
        aria-label="Signature drawing area"
        onPointerDown={start}
        onPointerMove={draw}
        onPointerUp={() => {
          drawing.current = false
          last.current = null
        }}
        onPointerCancel={() => {
          drawing.current = false
          last.current = null
        }}
      />
      <div className="field-row">
        <label>
          Ink color
          <div className="color-input">
            <input type="color" value={color} onChange={(event) => setColor(event.target.value)} />
            <code>{color.toUpperCase()}</code>
          </div>
        </label>
        <label>
          Stroke width · {width}
          <input
            type="range"
            min="1"
            max="16"
            value={width}
            onChange={(event) => setWidth(Number(event.target.value))}
          />
        </label>
      </div>
      <div className="signature-actions">
        <button className="btn secondary" onClick={clear}>
          <RotateCcw size={16} />
          Clear
        </button>
        <button
          className="btn primary"
          onClick={() =>
            canvasRef.current?.toBlob(
              (blob) => blob && saveFile(blob, 'toolbox-signature.png'),
              'image/png',
            )
          }
        >
          <Download size={17} />
          Download transparent PNG
        </button>
      </div>
    </div>
  )
}
