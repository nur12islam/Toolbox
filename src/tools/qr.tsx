import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Download } from 'lucide-react'

export default function QrTool() {
  const [value, setValue] = useState('https://example.com')
  const [size, setSize] = useState('512')
  const [dark, setDark] = useState('#2a0a10')
  const [light, setLight] = useState('#ffffff')
  const [data, setData] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    QRCode.toDataURL(value || ' ', {
      width: Number(size),
      margin: 2,
      color: { dark: dark + 'ff', light: light + 'ff' },
    })
      .then((url) => {
        if (active) {
          setData(url)
          setError('')
        }
      })
      .catch(() => active && setError('Could not generate QR code'))
    return () => {
      active = false
    }
  }, [value, size, dark, light])
  return (
    <div className="tool-layout">
      <div className="tool-controls">
        <label className="field">
          Text or URL
          <textarea
            rows={4}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Paste a URL or type a message"
          />
        </label>
        <label className="field">
          Image size
          <select value={size} onChange={(e) => setSize(e.target.value)}>
            <option value="256">256 × 256</option>
            <option value="512">512 × 512</option>
            <option value="1024">1024 × 1024</option>
          </select>
        </label>
        <div className="field-row">
          <label>
            QR color
            <div className="color-input">
              <input type="color" value={dark} onChange={(e) => setDark(e.target.value)} />
              <code>{dark}</code>
            </div>
          </label>
          <label>
            Background
            <div className="color-input">
              <input type="color" value={light} onChange={(e) => setLight(e.target.value)} />
              <code>{light}</code>
            </div>
          </label>
        </div>
        <button
          className="btn primary full"
          disabled={!data}
          onClick={() => {
            const a = document.createElement('a')
            a.href = data
            a.download = 'toolbox-qr.png'
            a.click()
          }}
        >
          <Download size={17} /> Download QR PNG
        </button>
        <p className="hint">Test your QR code with a phone before printing or sharing it.</p>
      </div>
      <div className="qr-preview">
        {data ? (
          <img src={data} alt="Generated QR code" />
        ) : (
          <span>{error || 'Preparing QR code…'}</span>
        )}
        <strong>Live preview</strong>
        <small>Generated locally in your browser</small>
      </div>
    </div>
  )
}
