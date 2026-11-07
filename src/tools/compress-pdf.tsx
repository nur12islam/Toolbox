import { useState } from 'react'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs'
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'
import { Check, Download } from 'lucide-react'
import { PdfPicker, saveFile } from '../core/pdf'

GlobalWorkerOptions.workerSrc = pdfWorkerUrl

export default function CompressPdfTool() {
  const [file, setFile] = useState<File | null>(null)
  const [quality, setQuality] = useState(0.68)
  const [scale, setScale] = useState(1.35)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const compress = async () => {
    if (!file) return
    setBusy(true)
    setMessage('')
    try {
      const pdfjs = await getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
      const { jsPDF } = await import('jspdf')
      let output: InstanceType<typeof jsPDF> | null = null
      for (let pageNumber = 1; pageNumber <= pdfjs.numPages; pageNumber++) {
        const page = await pdfjs.getPage(pageNumber)
        const viewport = page.getViewport({ scale: 1 })
        const renderViewport = page.getViewport({ scale })
        const canvas = document.createElement('canvas')
        canvas.width = Math.ceil(renderViewport.width)
        canvas.height = Math.ceil(renderViewport.height)
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Canvas is unavailable')
        context.fillStyle = '#fff'
        context.fillRect(0, 0, canvas.width, canvas.height)
        await page.render({ canvasContext: context, viewport: renderViewport }).promise
        const image = canvas.toDataURL('image/jpeg', quality)
        if (!output)
          output = new jsPDF({
            unit: 'pt',
            format: [viewport.width, viewport.height],
            compress: true,
          })
        else output.addPage([viewport.width, viewport.height])
        output.addImage(image, 'JPEG', 0, 0, viewport.width, viewport.height, undefined, 'FAST')
        page.cleanup()
        canvas.width = 0
        canvas.height = 0
      }
      pdfjs.destroy()
      if (!output) throw new Error('The PDF has no pages')
      const blob = output.output('blob')
      saveFile(blob, `${file.name.replace(/\.pdf$/i, '')}-compressed.pdf`)
      setMessage(
        `Compressed copy downloaded · ${(file.size / 1024).toFixed(0)} KB original → ${(blob.size / 1024).toFixed(0)} KB output.`,
      )
    } catch {
      setMessage('Could not process this PDF. Encrypted or damaged files are not supported.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="single-tool">
      <PdfPicker
        multiple={false}
        onFiles={(items) => {
          setFile(items[0] || null)
          setMessage('')
        }}
      />
      {file && (
        <p className="file-line">
          <Check size={15} />
          {file.name} · {(file.size / 1024).toFixed(0)} KB
        </p>
      )}
      <label className="field">
        Image quality · {Math.round(quality * 100)}%
        <input
          type="range"
          min="0.35"
          max="0.9"
          step="0.05"
          value={quality}
          onChange={(event) => setQuality(Number(event.target.value))}
        />
      </label>
      <label className="field">
        Page detail
        <select value={scale} onChange={(event) => setScale(Number(event.target.value))}>
          <option value="1">Smaller file · 72 DPI</option>
          <option value="1.35">Balanced · 97 DPI</option>
          <option value="1.75">Sharper · 126 DPI</option>
        </select>
      </label>
      <p className="hint">
        Pages are rendered as images to reduce size. Text in the new PDF will not be selectable or
        searchable. Choose higher detail to preserve more fine print.
      </p>
      <button className="btn primary" disabled={!file || busy} onClick={compress}>
        <Download size={17} />
        {busy ? 'Compressing pages…' : 'Compress PDF'}
      </button>
      {message && (
        <p className="success" role="status">
          {message}
        </p>
      )}
    </div>
  )
}
