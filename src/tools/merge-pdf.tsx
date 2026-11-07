import { useState } from 'react'
import { PDFDocument } from 'pdf-lib'
import { ArrowDown, ArrowUp, Download, FileText } from 'lucide-react'
import { PdfPicker, saveFile } from '../core/pdf'

export default function MergePdfTool() {
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const move = (index: number, offset: number) =>
    setFiles((current) => {
      const next = [...current],
        target = index + offset
      if (target < 0 || target >= next.length) return current
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  const merge = async () => {
    if (files.length < 2) return
    setBusy(true)
    setMessage('')
    try {
      const output = await PDFDocument.create()
      for (const file of files) {
        const source = await PDFDocument.load(await file.arrayBuffer())
        const pages = await output.copyPages(source, source.getPageIndices())
        pages.forEach((page) => output.addPage(page))
      }
      const bytes = await output.save()
      saveFile(new Blob([bytes], { type: 'application/pdf' }), 'toolbox-merged.pdf')
      setMessage('Merged PDF downloaded.')
    } catch {
      setMessage('One of these PDFs could not be read. Password-protected PDFs are not supported.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="single-tool">
      <PdfPicker
        multiple
        onFiles={(incoming) => {
          setFiles((current) => [...current, ...incoming])
          setMessage('')
        }}
      />
      <p className="hint">
        Add two or more PDFs, then use the arrows to set their order. All pages are kept in the
        merged file.
      </p>
      {files.length > 0 && (
        <div className="file-list">
          {files.map((file, index) => (
            <div className="file-list-item" key={`${file.name}-${index}`}>
              <FileText size={18} />
              <span>
                {index + 1}. {file.name}
              </span>
              <small>{(file.size / 1024).toFixed(0)} KB</small>
              <button
                className="icon-btn"
                aria-label={`Move ${file.name} up`}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <ArrowUp size={15} />
              </button>
              <button
                className="icon-btn"
                aria-label={`Move ${file.name} down`}
                disabled={index === files.length - 1}
                onClick={() => move(index, 1)}
              >
                <ArrowDown size={15} />
              </button>
              <button
                className="icon-btn"
                aria-label={`Remove ${file.name}`}
                onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <button className="btn primary" disabled={files.length < 2 || busy} onClick={merge}>
        <Download size={17} />
        {busy ? 'Merging…' : `Merge ${files.length} PDFs`}
      </button>
      {message && (
        <p className="success" role="status">
          {message}
        </p>
      )}
    </div>
  )
}
