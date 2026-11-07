import { useState } from 'react'
import { FileText } from 'lucide-react'

export function saveFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function PdfPicker({
  multiple,
  onFiles,
}: {
  multiple: boolean
  onFiles: (files: File[]) => void
}) {
  const [dragging, setDragging] = useState(false)
  const take = (items: File[]) =>
    onFiles(
      items.filter(
        (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'),
      ),
    )
  return (
    <label
      className={`dropzone ${dragging ? 'drag' : ''}`}
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        take(Array.from(event.dataTransfer.files))
      }}
    >
      <input
        type="file"
        accept="application/pdf,.pdf"
        multiple={multiple}
        onChange={(event) => {
          take(Array.from(event.target.files || []))
          event.currentTarget.value = ''
        }}
      />
      <span className="upload-icon">
        <FileText size={22} />
      </span>
      <strong>Drop PDF{multiple ? 's' : ''} here</strong>
      <span>
        or <u>browse files</u>
      </span>
      <small>Processed locally in your browser · No upload</small>
    </label>
  )
}
