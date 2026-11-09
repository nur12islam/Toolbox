import { useState } from 'react'
import { CopyButton } from '../core/CopyButton'

export default function GradientTool() {
  const [a, setA] = useState('#dc143c')
  const [b, setB] = useState('#3b2218')
  const [angle, setAngle] = useState(135)
  const css = `linear-gradient(${angle}deg, ${a} 0%, ${b} 100%)`
  return (
    <div className="gradient-lab">
      <div className="gradient-preview" style={{ background: css }} />
      <div className="field-row">
        <label>Start color<div className="color-input"><input type="color" value={a} onChange={(e) => setA(e.target.value)} /><code>{a}</code></div></label>
        <label>End color<div className="color-input"><input type="color" value={b} onChange={(e) => setB(e.target.value)} /><code>{b}</code></div></label>
      </div>
      <label className="field">Angle · {angle}°
        <input type="range" min="0" max="360" value={angle} onChange={(e) => setAngle(Number(e.target.value))} />
      </label>
      <div className="copy-row"><div><small>CSS BACKGROUND</small><code>{css}</code></div><CopyButton text={`background: ${css};`} label="Copy CSS" /></div>
    </div>
  )
}