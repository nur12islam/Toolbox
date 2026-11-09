import { useEffect, useState } from 'react'
import { FileImage } from 'lucide-react'

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function useImageFile() {
  const [file, setFile] = useState<File | null>(null)
  const [src, setSrc] = useState('')
  useEffect(() => {
    if (!file) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSrc('')
      return
    }
    const url = URL.createObjectURL(file)
    setSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  return { file, src, setFile }
}

export function Upload({ onFiles, multiple = false }: { onFiles: (files: File[]) => void; multiple?: boolean }) {
  const [drag, setDrag] = useState(false)
  return (
    <label className={`dropzone ${drag ? 'drag' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); onFiles(Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))) }}>
      <input type="file" accept="image/*" multiple={multiple}
        onChange={(e) => { onFiles(Array.from(e.target.files || [])); e.currentTarget.value = '' }} />
      <span className="upload-icon"><FileImage size={22} /></span>
      <strong>Drop your image{multiple ? 's' : ''} here</strong>
      <span>or <u>browse files</u></span>
      <small>Files stay on this device · No upload</small>
    </label>
  )
}