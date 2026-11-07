import { useState } from 'react'
import { Copy } from 'lucide-react'
import { hexToRgb, rgbToHsl } from '../core/logic'

export default function ColorTool() {
  const [color, setColor] = useState('#DC143C')
  const { r, g, b } = hexToRgb(color)
  const { h, s, l } = rgbToHsl(r, g, b)
  const values = {
    hex: color.toUpperCase(),
    rgb: `rgb(${r}, ${g}, ${b})`,
    hsl: `hsl(${h}, ${s}%, ${l}%)`,
  }
  return (
    <div className="color-lab">
      <div className="big-swatch" style={{ background: color }} />
      <label className="field">
        Choose a color
        <div className="color-input wide">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          <code>{color.toUpperCase()}</code>
        </div>
      </label>
      {Object.entries(values).map(([k, v]) => (
        <div className="copy-row" key={k}>
          <div>
            <small>{k.toUpperCase()}</small>
            <code>{v}</code>
          </div>
          <button
            className="icon-btn"
            aria-label={`Copy ${k}`}
            onClick={() => navigator.clipboard.writeText(v)}
          >
            <Copy size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
