import { useState } from 'react'
import { Check, Download, Image as ImageIcon } from 'lucide-react'
import { Upload, useImageFile, saveBlob } from '../core/media'
import { fitImageDimensions } from '../core/logic'

export default function ImageTool() {
  const { file, src, setFile } = useImageFile()
  const [w, setW] = useState('1280')
  const [h, setH] = useState('1280')
  const [quality, setQuality] = useState(0.82)
  const [format, setFormat] = useState('image/jpeg')
  const [keep, setKeep] = useState(true)
  const process = () => {
    if (!src) return
    const img = new Image()
    img.onload = () => {
      const { width, height } = fitImageDimensions(
        img.width,
        img.height,
        Number(w),
        Number(h),
        keep,
      )
      const c = document.createElement('canvas')
      c.width = width
      c.height = height
      c.getContext('2d')!.drawImage(img, 0, 0, width, height)
      c.toBlob(
        (b) =>
          b && saveBlob(b, `toolbox-${width}x${height}.${format === 'image/png' ? 'png' : 'jpg'}`),
        format,
        quality,
      )
    }
    img.src = src
  }
  return (
    <div className="tool-layout">
      <div className="tool-controls">
        <Upload onFiles={(f) => f[0] && setFile(f[0])} />
        {file && (
          <p className="file-line">
            <Check size={15} />
            {file.name} · {(file.size / 1024).toFixed(0)} KB
          </p>
        )}
        <div className="field-row">
          <label>
            Max width
            <input type="number" value={w} onChange={(e) => setW(e.target.value)} />
          </label>
          <label>
            Max height
            <input type="number" value={h} onChange={(e) => setH(e.target.value)} />
          </label>
        </div>
        <label className="check-line">
          <input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} /> Keep
          aspect ratio
        </label>
        <label className="field">
          Output format
          <select value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="image/jpeg">JPEG — smaller files</option>
            <option value="image/png">PNG — lossless</option>
          </select>
        </label>
        {format === 'image/jpeg' && (
          <label className="field">
            Quality · {Math.round(quality * 100)}%
            <input
              type="range"
              min=".2"
              max="1"
              step=".05"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
            />
          </label>
        )}
        <button className="btn primary full" disabled={!src} onClick={process}>
          <Download size={17} /> Resize & export
        </button>
      </div>
      <div className="preview-panel">
        <div className="preview-heading">
          <span>Original preview</span>
          <span className="muted">{file ? `${(file.size / 1024).toFixed(1)} KB` : ''}</span>
        </div>
        {src ? (
          <img className="image-preview" src={src} alt="Selected preview" />
        ) : (
          <div className="empty-preview">
            <ImageIcon size={34} />
            <span>Choose an image to get started</span>
          </div>
        )}
      </div>
    </div>
  )
}
