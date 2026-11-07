import { useEffect, useMemo, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import 'react-easy-crop/react-easy-crop.css'
import presets from '../data/presets.json'
import { Check, Download, RotateCcw } from 'lucide-react'
import { Upload, useImageFile, saveBlob } from '../core/media'
import { findQualityForTarget } from '../core/logic'

type PhotoPreset = {
  name: string
  width: number
  height: number
  unit: string
  minKB: number
  maxKB: number
  format: string
}

const photoPresets = presets as PhotoPreset[]

function readImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not read this image.'))
    image.src = source
  })
}

function canvasBlob(canvas: HTMLCanvasElement, format: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not create an image.'))),
      format,
      quality,
    )
  })
}

function rotatedCanvas(image: HTMLImageElement, degrees: number, flipped: boolean) {
  const radians = (degrees * Math.PI) / 180
  const width = Math.ceil(
    Math.abs(image.width * Math.cos(radians)) + Math.abs(image.height * Math.sin(radians)),
  )
  const height = Math.ceil(
    Math.abs(image.width * Math.sin(radians)) + Math.abs(image.height * Math.cos(radians)),
  )
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is unavailable in this browser.')
  context.translate(width / 2, height / 2)
  context.rotate(radians)
  context.scale(flipped ? -1 : 1, 1)
  context.drawImage(image, -image.width / 2, -image.height / 2)
  return canvas
}

export default function PhotoTool() {
  const { file, src, setFile } = useImageFile()
  const [presetName, setPresetName] = useState(photoPresets[0].name)
  const [width, setWidth] = useState(photoPresets[0].width)
  const [height, setHeight] = useState(photoPresets[0].height)
  const [minKB, setMinKB] = useState(photoPresets[0].minKB)
  const [maxKB, setMaxKB] = useState(photoPresets[0].maxKB)
  const [format, setFormat] = useState(photoPresets[0].format)
  const [quality, setQuality] = useState(0.92)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [cropPixels, setCropPixels] = useState<Area | null>(null)
  const [whiteBackground, setWhiteBackground] = useState(true)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [enhanceSignature, setEnhanceSignature] = useState(false)
  const [threshold, setThreshold] = useState(165)
  const [resultUrl, setResultUrl] = useState('')
  const [message, setMessage] = useState('')

  useEffect(
    () => () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl)
    },
    [resultUrl],
  )

  const aspect = useMemo(() => width / Math.max(height, 1), [width, height])
  const selectPreset = (name: string) => {
    setPresetName(name)
    const selected = photoPresets.find((preset) => preset.name === name)
    if (!selected) return
    setWidth(selected.width)
    setHeight(selected.height)
    setMinKB(selected.minKB)
    setMaxKB(selected.maxKB)
    setFormat(selected.format)
  }

  const buildCanvas = async (targetWidth: number, targetHeight: number) => {
    if (!src || !cropPixels) throw new Error('Choose an image and adjust its crop first.')
    const image = await readImage(src)
    const rotated = rotatedCanvas(image, rotation, flipped)
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, targetWidth)
    canvas.height = Math.max(1, targetHeight)
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas is unavailable in this browser.')
    context.fillStyle = whiteBackground ? '#ffffff' : 'transparent'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.filter = `brightness(${brightness}%) contrast(${contrast}%)`
    context.drawImage(
      rotated,
      cropPixels.x,
      cropPixels.y,
      cropPixels.width,
      cropPixels.height,
      0,
      0,
      canvas.width,
      canvas.height,
    )
    context.filter = 'none'
    if (enhanceSignature) {
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      for (let index = 0; index < imageData.data.length; index += 4) {
        const gray =
          imageData.data[index] * 0.299 +
          imageData.data[index + 1] * 0.587 +
          imageData.data[index + 2] * 0.114
        const ink = gray < threshold
        imageData.data[index] = ink ? 20 : 255
        imageData.data[index + 1] = ink ? 20 : 255
        imageData.data[index + 2] = ink ? 20 : 255
        imageData.data[index + 3] = 255
      }
      context.putImageData(imageData, 0, 0)
    }
    return canvas
  }

  const exportImage = async () => {
    if (!file || !cropPixels) return
    setMessage('Preparing an optimized copy…')
    try {
      let outputWidth = Math.max(1, Math.round(width))
      let outputHeight = Math.max(1, Math.round(height))
      let canvas = await buildCanvas(outputWidth, outputHeight)
      let qualityResult = await findQualityForTarget(
        async (candidate) => (await canvasBlob(canvas, format, candidate)).size,
        minKB,
        maxKB,
        12,
        quality,
      )
      let output = await canvasBlob(canvas, format, qualityResult.quality)
      for (
        let attempt = 0;
        !qualityResult.withinTarget && output.size > maxKB * 1024 && attempt < 8;
        attempt += 1
      ) {
        outputWidth = Math.max(1, Math.round(outputWidth * 0.94))
        outputHeight = Math.max(1, Math.round(outputHeight * 0.94))
        canvas = await buildCanvas(outputWidth, outputHeight)
        qualityResult = await findQualityForTarget(
          async (candidate) => (await canvasBlob(canvas, format, candidate)).size,
          minKB,
          maxKB,
          12,
          quality,
        )
        output = await canvasBlob(canvas, format, qualityResult.quality)
      }
      const nextUrl = URL.createObjectURL(output)
      setResultUrl((current) => {
        if (current) URL.revokeObjectURL(current)
        return nextUrl
      })
      saveBlob(
        output,
        `photo-${outputWidth}x${outputHeight}.${format === 'image/png' ? 'png' : 'jpg'}`,
      )
      setMessage(
        qualityResult.withinTarget
          ? `Saved ${outputWidth} × ${outputHeight} · ${(output.size / 1024).toFixed(1)} KB (target ${minKB}–${maxKB} KB).`
          : `Closest result is ${(output.size / 1024).toFixed(1)} KB (target ${minKB}–${maxKB} KB). This target may not be possible for this image.`,
      )
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not process this image.')
    }
  }

  return (
    <div className="tool-layout photo-tool">
      <div className="tool-controls">
        <Upload
          onFiles={(files) => {
            if (!files[0]) return
            setFile(files[0])
            setCrop({ x: 0, y: 0 })
            setZoom(1)
            setResultUrl('')
            setMessage('')
          }}
        />
        {file && (
          <p className="file-line">
            <Check size={15} />
            {file.name} · {(file.size / 1024).toFixed(1)} KB
          </p>
        )}
        <label className="field">
          Preset
          <select value={presetName} onChange={(event) => selectPreset(event.target.value)}>
            {photoPresets.map((preset) => (
              <option key={preset.name}>{preset.name}</option>
            ))}
            <option>Custom</option>
          </select>
        </label>
        <div className="field-row">
          <label>
            Width (px)
            <input
              type="number"
              min="1"
              max="6000"
              value={width}
              onChange={(event) => {
                setPresetName('Custom')
                setWidth(Number(event.target.value))
              }}
            />
          </label>
          <label>
            Height (px)
            <input
              type="number"
              min="1"
              max="6000"
              value={height}
              onChange={(event) => {
                setPresetName('Custom')
                setHeight(Number(event.target.value))
              }}
            />
          </label>
        </div>
        <div className="field-row">
          <label>
            Min size (KB)
            <input
              type="number"
              min="1"
              value={minKB}
              onChange={(event) => setMinKB(Number(event.target.value))}
            />
          </label>
          <label>
            Max size (KB)
            <input
              type="number"
              min="1"
              value={maxKB}
              onChange={(event) => setMaxKB(Number(event.target.value))}
            />
          </label>
        </div>
        <label className="field">
          Format
          <select value={format} onChange={(event) => setFormat(event.target.value)}>
            <option value="image/jpeg">JPEG</option>
            <option value="image/png">PNG</option>
          </select>
        </label>
        {format === 'image/jpeg' && (
          <label className="field">
            Maximum quality · {Math.round(quality * 100)}%
            <input
              type="range"
              min=".4"
              max="1"
              step=".02"
              value={quality}
              onChange={(event) => setQuality(Number(event.target.value))}
            />
          </label>
        )}
        <label className="check-line">
          <input
            type="checkbox"
            checked={whiteBackground}
            onChange={(event) => setWhiteBackground(event.target.checked)}
          />{' '}
          Fill background with white
        </label>
        <label className="field">
          Brightness · {brightness}%
          <input
            type="range"
            min="50"
            max="150"
            value={brightness}
            onChange={(event) => setBrightness(Number(event.target.value))}
          />
        </label>
        <label className="field">
          Contrast · {contrast}%
          <input
            type="range"
            min="50"
            max="200"
            value={contrast}
            onChange={(event) => setContrast(Number(event.target.value))}
          />
        </label>
        <label className="check-line">
          <input
            type="checkbox"
            checked={enhanceSignature}
            onChange={(event) => setEnhanceSignature(event.target.checked)}
          />{' '}
          Enhance signature and remove paper background
        </label>
        {enhanceSignature && (
          <label className="field">
            Ink threshold · {threshold}
            <input
              type="range"
              min="80"
              max="240"
              value={threshold}
              onChange={(event) => setThreshold(Number(event.target.value))}
            />
          </label>
        )}
        <div className="photo-actions">
          <button
            className="btn secondary"
            type="button"
            onClick={() => setRotation((value) => (value + 90) % 360)}
          >
            <RotateCcw size={16} />
            Rotate
          </button>
          <button
            className="btn secondary"
            type="button"
            onClick={() => setFlipped((value) => !value)}
          >
            Flip
          </button>
        </div>
        <label className="field">
          Zoom · {zoom.toFixed(1)}×
          <input
            type="range"
            min="1"
            max="3"
            step=".05"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
        </label>
        <button className="btn primary full" disabled={!src || !cropPixels} onClick={exportImage}>
          <Download size={17} /> Export photo
        </button>
        {message && (
          <p className="success" role="status">
            {message}
          </p>
        )}
        <p className="hint">
          The size target is best-effort: some image content cannot fit the requested dimensions and
          file-size range together.
        </p>
      </div>
      <div className="preview-panel">
        <div className="preview-heading">
          <span>Crop and preview</span>
          <span className="muted">
            {src ? `${width} × ${height} px` : 'Your image appears here'}
          </span>
        </div>
        {src ? (
          <div className={flipped ? 'crop-container crop-flipped' : 'crop-container'}>
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setCropPixels(pixels)}
            />
          </div>
        ) : (
          <div className="empty-preview">
            <span>Upload a photo to preview and crop it</span>
          </div>
        )}
        {file && (
          <p className="hint">
            Original size: {(file.size / 1024).toFixed(1)} KB · Target: {minKB}–{maxKB} KB
          </p>
        )}
        {resultUrl && (
          <div className="after-preview">
            <div className="preview-heading">
              <span>After</span>
              <span className="muted">{resultUrl ? 'Ready to download' : ''}</span>
            </div>
            <img className="image-preview" src={resultUrl} alt="Processed preview" />
          </div>
        )}
      </div>
    </div>
  )
}
