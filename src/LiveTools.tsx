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
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [result, setResult] = useState<Blob | null>(null)
  useEffect(() => {
    if (!result) { setPreview(''); return }
    const url = URL.createObjectURL(result)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [result])
  const process = async () => {
    if (!file) return
    setBusy(true); setMessage('')
    try {
      const form = new FormData()
      form.append('image_file', file)
      const response = await fetch('/api/remove-background', { method: 'POST', body: form })
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null
        setMessage(payload?.error || (response.status === 404 ? 'This API requires the Cloudflare Pages deployment and REMOVEBG_API_KEY secret.' : 'remove.bg could not process this image. Try another image or check the API account.'))
        return
      }
      const blob = await response.blob()
      setResult(blob)
      const credits = response.headers.get('X-Credits-Charged')
      setMessage(credits ? `Background removed. This request used ${credits} remove.bg credit${credits === '1' ? '' : 's'}.` : 'Background removed. Your transparent PNG is ready.')
    } catch {
      setMessage('Could not reach the background-removal service. Deploy this project on Cloudflare Pages and set the REMOVEBG_API_KEY secret.')
    }
    finally { setBusy(false) }
  }
  return <div className="tool-layout"><div className="tool-controls">
    <label className="dropzone"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => { const next = event.target.files?.[0] || null; setFile(next); setResult(null); setMessage('') }} /><span className="upload-icon"><Eraser size={22} /></span><strong>{file ? file.name : 'Choose an image'}</strong><span><u>browse files</u></span><small>JPG, PNG, or WebP · Maximum 22 MB</small></label>
    {file && <p className="file-line"><Check size={15} />{(file.size / 1024 / 1024).toFixed(2)} MB selected</p>}
    <button className="btn primary full" disabled={!file || busy || file.size > 22 * 1024 * 1024} onClick={process}><Eraser size={17} />{busy ? 'Removing background with remove.bg…' : 'Remove background'}</button>
    {file && file.size > 22 * 1024 * 1024 && <p className="error" role="alert">This image is larger than remove.bg's 22 MB upload limit.</p>}
    {preview && <button className="btn secondary full" onClick={() => result && saveFile(result, 'toolbox-background-removed.png')}><Download size={17} />Download transparent PNG</button>}
    {message && <p className="success" role="status">{message}</p>}
    <p className="hint">Your image is sent to remove.bg through this Cloudflare Function for processing. remove.bg API use may consume credits. The API key is kept server-side and is never sent to your browser.</p>
  </div><div className="preview-panel"><div className="preview-heading"><span>Transparent result</span><span className="muted">Processed by remove.bg</span></div>{preview ? <img className="image-preview" src={preview} alt="Background removed preview" /> : <div className="empty-preview"><Eraser size={34} /><span>Choose an image, then remove its background</span></div>}</div></div>
}

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

