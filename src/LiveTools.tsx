import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { PDFDocument } from 'pdf-lib'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs'
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'
import { ArrowDown, ArrowUp, Check, Download, Eraser, FileText, RotateCcw } from 'lucide-react'

GlobalWorkerOptions.workerSrc = pdfWorkerUrl

function saveFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function PdfPicker({ multiple, onFiles }: { multiple: boolean; onFiles: (files: File[]) => void }) {
  const [dragging, setDragging] = useState(false)
  const take = (items: File[]) => onFiles(items.filter(file => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')))
  return <label className={`dropzone ${dragging ? 'drag' : ''}`} onDragOver={event => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); take(Array.from(event.dataTransfer.files)) }}>
    <input type="file" accept="application/pdf,.pdf" multiple={multiple} onChange={event => { take(Array.from(event.target.files || [])); event.currentTarget.value = '' }} />
    <span className="upload-icon"><FileText size={22} /></span><strong>Drop PDF{multiple ? 's' : ''} here</strong><span>or <u>browse files</u></span><small>Processed locally in your browser · No upload</small>
  </label>
}

export function MergePdfTool() {
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const move = (index: number, offset: number) => setFiles(current => {
    const next = [...current], target = index + offset
    if (target < 0 || target >= next.length) return current
    ;[next[index], next[target]] = [next[target], next[index]]
    return next
  })
  const merge = async () => {
    if (files.length < 2) return
    setBusy(true); setMessage('')
    try {
      const output = await PDFDocument.create()
      for (const file of files) {
        const source = await PDFDocument.load(await file.arrayBuffer())
        const pages = await output.copyPages(source, source.getPageIndices())
        pages.forEach(page => output.addPage(page))
      }
      const bytes = await output.save()
      saveFile(new Blob([bytes], { type: 'application/pdf' }), 'toolbox-merged.pdf')
      setMessage('Merged PDF downloaded.')
    } catch {
      setMessage('One of these PDFs could not be read. Password-protected PDFs are not supported.')
    } finally { setBusy(false) }
  }
  return <div className="single-tool"><PdfPicker multiple onFiles={incoming => { setFiles(current => [...current, ...incoming]); setMessage('') }} />
    <p className="hint">Add two or more PDFs, then use the arrows to set their order. All pages are kept in the merged file.</p>
    {files.length > 0 && <div className="file-list">{files.map((file, index) => <div className="file-list-item" key={`${file.name}-${index}`}><FileText size={18} /><span>{index + 1}. {file.name}</span><small>{(file.size / 1024).toFixed(0)} KB</small><button className="icon-btn" aria-label={`Move ${file.name} up`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={15} /></button><button className="icon-btn" aria-label={`Move ${file.name} down`} disabled={index === files.length - 1} onClick={() => move(index, 1)}><ArrowDown size={15} /></button><button className="icon-btn" aria-label={`Remove ${file.name}`} onClick={() => setFiles(current => current.filter((_, i) => i !== index))}>×</button></div>)}</div>}
    <button className="btn primary" disabled={files.length < 2 || busy} onClick={merge}><Download size={17} />{busy ? 'Merging…' : `Merge ${files.length} PDFs`}</button>{message && <p className="success" role="status">{message}</p>}
  </div>
}

export function CompressPdfTool() {
  const [file, setFile] = useState<File | null>(null)
  const [quality, setQuality] = useState(0.68)
  const [scale, setScale] = useState(1.35)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const compress = async () => {
    if (!file) return
    setBusy(true); setMessage('')
    try {
      const pdfjs = await getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
      const { jsPDF } = await import('jspdf')
      let output: InstanceType<typeof jsPDF> | null = null
      for (let pageNumber = 1; pageNumber <= pdfjs.numPages; pageNumber++) {
        const page = await pdfjs.getPage(pageNumber)
        const viewport = page.getViewport({ scale: 1 })
        const renderViewport = page.getViewport({ scale })
        const canvas = document.createElement('canvas')
        canvas.width = Math.ceil(renderViewport.width); canvas.height = Math.ceil(renderViewport.height)
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Canvas is unavailable')
        context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height)
        await page.render({ canvasContext: context, viewport: renderViewport }).promise
        const image = canvas.toDataURL('image/jpeg', quality)
        if (!output) output = new jsPDF({ unit: 'pt', format: [viewport.width, viewport.height], compress: true })
        else output.addPage([viewport.width, viewport.height])
        output.addImage(image, 'JPEG', 0, 0, viewport.width, viewport.height, undefined, 'FAST')
        page.cleanup(); canvas.width = 0; canvas.height = 0
      }
      pdfjs.destroy()
      if (!output) throw new Error('The PDF has no pages')
      const blob = output.output('blob')
      saveFile(blob, `${file.name.replace(/\.pdf$/i, '')}-compressed.pdf`)
      setMessage(`Compressed copy downloaded · ${(file.size / 1024).toFixed(0)} KB original → ${(blob.size / 1024).toFixed(0)} KB output.`)
    } catch {
      setMessage('Could not process this PDF. Encrypted or damaged files are not supported.')
    } finally { setBusy(false) }
  }
  return <div className="single-tool"><PdfPicker multiple={false} onFiles={items => { setFile(items[0] || null); setMessage('') }} />
    {file && <p className="file-line"><Check size={15} />{file.name} · {(file.size / 1024).toFixed(0)} KB</p>}
    <label className="field">Image quality · {Math.round(quality * 100)}%<input type="range" min="0.35" max="0.9" step="0.05" value={quality} onChange={event => setQuality(Number(event.target.value))} /></label>
    <label className="field">Page detail<select value={scale} onChange={event => setScale(Number(event.target.value))}><option value="1">Smaller file · 72 DPI</option><option value="1.35">Balanced · 97 DPI</option><option value="1.75">Sharper · 126 DPI</option></select></label>
    <p className="hint">Pages are rendered as images to reduce size. Text in the new PDF will not be selectable or searchable. Choose higher detail to preserve more fine print.</p>
    <button className="btn primary" disabled={!file || busy} onClick={compress}><Download size={17} />{busy ? 'Compressing pages…' : 'Compress PDF'}</button>{message && <p className="success" role="status">{message}</p>}
  </div>
}

export function BackgroundRemoverTool() {
  const [file, setFile] = useState<File | null>(null)
  const [tolerance, setTolerance] = useState(48)
  const [feather, setFeather] = useState(30)
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const process = async () => {
    if (!file) return
    setBusy(true); setMessage('')
    try {
      const source = new Image()
      source.src = URL.createObjectURL(file)
      await new Promise<void>((resolve, reject) => { source.onload = () => resolve(); source.onerror = () => reject(new Error('Image failed to load')) })
      const factor = Math.min(1, 2200 / Math.max(source.naturalWidth, source.naturalHeight))
      const canvas = canvasRef.current!
      canvas.width = Math.max(1, Math.round(source.naturalWidth * factor)); canvas.height = Math.max(1, Math.round(source.naturalHeight * factor))
      const context = canvas.getContext('2d', { willReadFrequently: true })!
      context.drawImage(source, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(source.src)
      const image = context.getImageData(0, 0, canvas.width, canvas.height), { data, width, height } = image
      const samples = [0, width - 1, (height - 1) * width, height * width - 1]
      const bg = [0, 0, 0].map((_, channel) => samples.reduce((sum, index) => sum + data[index * 4 + channel], 0) / samples.length)
      const threshold = tolerance * Math.sqrt(3), soft = Math.max(1, feather * Math.sqrt(3))
      const pixelCount = width * height, seen = new Uint8Array(pixelCount), queue = new Int32Array(pixelCount)
      let head = 0, tail = 0
      const closeToBackground = (index: number) => { const p = index * 4; const dr = data[p] - bg[0], dg = data[p + 1] - bg[1], db = data[p + 2] - bg[2]; return Math.sqrt(dr * dr + dg * dg + db * db) <= threshold }
      const add = (index: number) => { if (!seen[index] && closeToBackground(index)) { seen[index] = 1; queue[tail++] = index } }
      for (let x = 0; x < width; x++) { add(x); add((height - 1) * width + x) }
      for (let y = 1; y < height - 1; y++) { add(y * width); add(y * width + width - 1) }
      while (head < tail) {
        const index = queue[head++], x = index % width
        if (x > 0) add(index - 1); if (x + 1 < width) add(index + 1)
        if (index >= width) add(index - width); if (index + width < pixelCount) add(index + width)
      }
      for (let index = 0; index < pixelCount; index++) if (seen[index]) {
        const p = index * 4, dr = data[p] - bg[0], dg = data[p + 1] - bg[1], db = data[p + 2] - bg[2]
        const distance = Math.sqrt(dr * dr + dg * dg + db * db)
        const fadeStart = Math.max(0, threshold - soft)
        data[p + 3] = Math.round(data[p + 3] * Math.max(0, Math.min(1, (distance - fadeStart) / (threshold - fadeStart || 1))))
      }
      context.putImageData(image, 0, 0); setPreview(canvas.toDataURL('image/png')); setMessage('Background removed. Adjust the edge controls and process again if needed.')
    } catch { setMessage('Could not read this image. Try a JPG or PNG file.') }
    finally { setBusy(false) }
  }
  return <div className="tool-layout"><div className="tool-controls">
    <label className="dropzone"><input type="file" accept="image/*" onChange={event => { const next = event.target.files?.[0] || null; setFile(next); setPreview(''); setMessage('') }} /><span className="upload-icon"><Eraser size={22} /></span><strong>{file ? file.name : 'Choose an image'}</strong><span><u>browse files</u></span><small>Best results with a plain, evenly lit background.</small></label>
    <label className="field">Background tolerance · {tolerance}<input type="range" min="8" max="115" value={tolerance} onChange={event => setTolerance(Number(event.target.value))} /></label>
    <label className="field">Edge softness · {feather}<input type="range" min="0" max="90" value={feather} onChange={event => setFeather(Number(event.target.value))} /></label>
    <button className="btn primary full" disabled={!file || busy} onClick={process}><Eraser size={17} />{busy ? 'Removing background…' : 'Remove background'}</button>
    {preview && <button className="btn secondary full" onClick={() => saveFile(dataUrlBlob(preview), 'toolbox-background-removed.png')}><Download size={17} />Download transparent PNG</button>}
    {message && <p className="success" role="status">{message}</p>}<p className="hint">This local color-based remover works best when the background is a different, fairly solid color from the subject.</p><canvas ref={canvasRef} hidden />
  </div><div className="preview-panel"><div className="preview-heading"><span>Transparent result</span><span className="muted">Runs on this device</span></div>{preview ? <img className="image-preview" src={preview} alt="Background removed preview" /> : <div className="empty-preview"><Eraser size={34} /><span>Choose an image, then remove its background</span></div>}</div></div>
}

function dataUrlBlob(dataUrl: string) { const [header, data] = dataUrl.split(','); const bytes = atob(data); const buffer = new Uint8Array(bytes.length); for (let i = 0; i < bytes.length; i++) buffer[i] = bytes.charCodeAt(i); return new Blob([buffer], { type: header.match(/data:(.*?);/)?.[1] || 'application/octet-stream' }) }

export function SignatureTool() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const [color, setColor] = useState('#101014')
  const [width, setWidth] = useState(4)
  const point = (event: ReactPointerEvent<HTMLCanvasElement>) => { const rect = event.currentTarget.getBoundingClientRect(); return { x: (event.clientX - rect.left) * event.currentTarget.width / rect.width, y: (event.clientY - rect.top) * event.currentTarget.height / rect.height } }
  const start = (event: ReactPointerEvent<HTMLCanvasElement>) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); drawing.current = true; last.current = point(event); const context = event.currentTarget.getContext('2d')!; context.fillStyle = color; context.beginPath(); context.arc(last.current.x, last.current.y, width / 2, 0, Math.PI * 2); context.fill() }
  const draw = (event: ReactPointerEvent<HTMLCanvasElement>) => { if (!drawing.current || !last.current) return; const next = point(event), context = event.currentTarget.getContext('2d')!; context.strokeStyle = color; context.lineWidth = width; context.lineCap = 'round'; context.lineJoin = 'round'; context.beginPath(); context.moveTo(last.current.x, last.current.y); context.lineTo(next.x, next.y); context.stroke(); last.current = next }
  const clear = () => { const canvas = canvasRef.current; if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height) }
  return <div className="single-tool signature-tool"><p className="hint">Draw with your mouse, finger, or stylus. Export as a transparent PNG for documents and forms.</p>
    <canvas ref={canvasRef} className="signature-pad" width={1200} height={420} aria-label="Signature drawing area" onPointerDown={start} onPointerMove={draw} onPointerUp={() => { drawing.current = false; last.current = null }} onPointerCancel={() => { drawing.current = false; last.current = null }} />
    <div className="field-row"><label>Ink color<div className="color-input"><input type="color" value={color} onChange={event => setColor(event.target.value)} /><code>{color.toUpperCase()}</code></div></label><label>Stroke width · {width}<input type="range" min="1" max="16" value={width} onChange={event => setWidth(Number(event.target.value))} /></label></div>
    <div className="signature-actions"><button className="btn secondary" onClick={clear}><RotateCcw size={16} />Clear</button><button className="btn primary" onClick={() => canvasRef.current?.toBlob(blob => blob && saveFile(blob, 'toolbox-signature.png'), 'image/png')}><Download size={17} />Download transparent PNG</button></div>
  </div>
}

export function WordCounterTool() {
  const [text, setText] = useState('')
  const stats = useMemo(() => {
    const words = text.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) || []
    const sentences = text.trim() ? (text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || []).filter(part => part.trim()).length : 0
    const paragraphs = text.trim() ? text.trim().split(/\n\s*\n/).filter(part => part.trim()).length : 0
    return { words: words.length, chars: text.length, charsNoSpaces: text.replace(/\s/g, '').length, sentences, paragraphs, minutes: words.length ? Math.max(1, Math.ceil(words.length / 200)) : 0 }
  }, [text])
  const metrics = [['Words', stats.words], ['Characters', stats.chars], ['No spaces', stats.charsNoSpaces], ['Sentences', stats.sentences], ['Paragraphs', stats.paragraphs], ['Reading time', stats.minutes ? `${stats.minutes} min` : '—']]
  return <div className="single-tool"><label className="field">Paste or type your text<textarea className="word-input" rows={12} value={text} onChange={event => setText(event.target.value)} placeholder="Start typing or paste text here…" /></label>
    <div className="word-metrics">{metrics.map(([label, value]) => <div className="word-metric" key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
    <div className="signature-actions"><button className="btn secondary" disabled={!text} onClick={() => setText('')}><RotateCcw size={16} />Clear text</button><button className="btn primary" disabled={!text} onClick={() => navigator.clipboard.writeText(text)}>Copy text</button></div>
    <p className="hint">Reading time is estimated at 200 words per minute. Your text stays in this browser tab.</p>
  </div>
}

const unitGroups: Record<string, { label: string; units: Record<string, number> } | { label: string; temperature: true; units: Record<string, number> }> = {
  Length: { label: 'Length', units: { Meters: 1, Kilometers: 1000, Centimeters: 0.01, Millimeters: 0.001, Miles: 1609.344, Yards: 0.9144, Feet: 0.3048, Inches: 0.0254 } },
  Weight: { label: 'Weight', units: { Kilograms: 1, Grams: 0.001, Milligrams: 0.000001, Pounds: 0.45359237, Ounces: 0.028349523125, 'Metric tons': 1000 } },
  Temperature: { label: 'Temperature', temperature: true, units: { Celsius: 1, Fahrenheit: 1, Kelvin: 1 } },
  Area: { label: 'Area', units: { 'Square meters': 1, 'Square kilometers': 1e6, Hectares: 10000, Acres: 4046.8564224, 'Square feet': 0.09290304, 'Square yards': 0.83612736 } },
  Volume: { label: 'Volume', units: { Liters: 1, Milliliters: 0.001, 'Cubic meters': 1000, 'US gallons': 3.785411784, 'US cups': 0.2365882365, 'US fluid ounces': 0.0295735296 } },
  Speed: { label: 'Speed', units: { 'Meters/second': 1, 'Kilometers/hour': 1 / 3.6, 'Miles/hour': 0.44704, Knots: 0.514444 } },
  Data: { label: 'Data size', units: { Bytes: 1, 'Kilobytes (KB)': 1000, 'Megabytes (MB)': 1e6, 'Gigabytes (GB)': 1e9, 'Kibibytes (KiB)': 1024, 'Mebibytes (MiB)': 1048576, 'Gibibytes (GiB)': 1073741824 } },
}

function toBase(value: number, unit: string, group: string) { if (group !== 'Temperature') return value * (unitGroups[group].units[unit] || 1); if (unit === 'Fahrenheit') return (value - 32) * 5 / 9; if (unit === 'Kelvin') return value - 273.15; return value }
function fromBase(value: number, unit: string, group: string) { if (group !== 'Temperature') return value / (unitGroups[group].units[unit] || 1); if (unit === 'Fahrenheit') return value * 9 / 5 + 32; if (unit === 'Kelvin') return value + 273.15; return value }

export function UnitConverterTool() {
  const [group, setGroup] = useState('Length')
  const [value, setValue] = useState('1')
  const options = Object.keys(unitGroups[group].units)
  const [from, setFrom] = useState(options[0]), [to, setTo] = useState(options[1])
  const units = Object.keys(unitGroups[group].units)
  const result = Number.isFinite(Number(value)) && value !== '' ? fromBase(toBase(Number(value), from, group), to, group) : NaN
  const formatted = Number.isFinite(result) ? new Intl.NumberFormat(undefined, { maximumSignificantDigits: 10 }).format(result) : '—'
  const changeGroup = (next: string) => { setGroup(next); const nextUnits = Object.keys(unitGroups[next].units); setFrom(nextUnits[0]); setTo(nextUnits[1]) }
  return <div className="single-tool unit-tool"><label className="field">Measurement<select value={group} onChange={event => changeGroup(event.target.value)}>{Object.entries(unitGroups).map(([key, info]) => <option key={key} value={key}>{info.label}</option>)}</select></label>
    <label className="field">Value<input type="number" value={value} onChange={event => setValue(event.target.value)} placeholder="Enter a number" /></label>
    <div className="field-row"><label>From<select value={from} onChange={event => setFrom(event.target.value)}>{units.map(unit => <option key={unit}>{unit}</option>)}</select></label><label>To<select value={to} onChange={event => setTo(event.target.value)}>{units.map(unit => <option key={unit}>{unit}</option>)}</select></label></div>
    <div className="unit-result"><span>CONVERTED VALUE</span><strong>{formatted}</strong><small>{to}</small></div>
    <div className="signature-actions"><button className="btn secondary" onClick={() => { setFrom(to); setTo(from) }}>Swap units</button><button className="btn primary" disabled={!Number.isFinite(result)} onClick={() => navigator.clipboard.writeText(String(result))}>Copy result</button></div>
    <p className="hint">Conversions use standard metric and customary unit definitions. Data units include decimal (KB) and binary (KiB) sizes.</p>
  </div>
}

