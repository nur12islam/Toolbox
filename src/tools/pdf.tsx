import { useState } from 'react'
import { Download, FileImage } from 'lucide-react'
import { Upload } from '../core/media'

export default function PdfTool() {
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const create = async () => {
    if (!files.length) return
    setBusy(true)
    setMsg('')
    try {
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
      for (let i = 0; i < files.length; i++) {
        const data = await new Promise<string>((resolve, reject) => {
          const r = new FileReader()
          r.onload = () => resolve(String(r.result))
          r.onerror = reject
          r.readAsDataURL(files[i])
        })
        const img = new Image()
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject(new Error('Could not read image'))
          img.src = data
        })
        if (i) pdf.addPage()
        const pw = pdf.internal.pageSize.getWidth(),
          ph = pdf.internal.pageSize.getHeight(),
          scale = Math.min(pw / img.width, ph / img.height)
        pdf.addImage(
          data,
          files[i].type === 'image/png' ? 'PNG' : 'JPEG',
          (pw - img.width * scale) / 2,
          (ph - img.height * scale) / 2,
          img.width * scale,
          img.height * scale,
        )
      }
      pdf.save('toolbox-images.pdf')
      setMsg('PDF created and downloaded.')
    } catch {
      setMsg('Could not convert one of those files. Try JPG or PNG images.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="single-tool">
      <Upload
        multiple
        onFiles={(f) => {
          setFiles(f)
          setMsg('')
        }}
      />
      <p className="hint">
        Each selected image becomes one page, fitted to A4 paper. Select images in the order you
        want them.
      </p>
      {files.length > 0 && (
        <div className="file-list">
          {files.map((f, i) => (
            <div className="file-list-item" key={f.name + i}>
              <FileImage size={18} />
              <span>
                {i + 1}. {f.name}
              </span>
              <small>{(f.size / 1024).toFixed(0)} KB</small>
            </div>
          ))}
        </div>
      )}
      <button className="btn primary" disabled={!files.length || busy} onClick={create}>
        <Download size={17} />
        {busy
          ? 'Creating PDF…'
          : `Create PDF · ${files.length} image${files.length === 1 ? '' : 's'}`}
      </button>
      {msg && <p className="success">{msg}</p>}
    </div>
  )
}
