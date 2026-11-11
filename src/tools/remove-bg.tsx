import { useEffect, useRef, useState } from 'react'
import { Check, Download, Eraser } from 'lucide-react'
import { saveFile } from '../core/pdf'

export default function BackgroundRemoverTool() {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [result, setResult] = useState<Blob | null>(null)
  const turnstileRef = useRef<HTMLDivElement>(null)
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileWidgetId = useRef('')
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined
  useEffect(() => {
    if (!siteKey || !turnstileRef.current) return
    let widgetId: string | undefined
    const mount = () => {
      if (!window.turnstile || !turnstileRef.current) return
      widgetId = window.turnstile.render(turnstileRef.current, {
        sitekey: siteKey,
        callback: (token) => setTurnstileToken(token),
        'expired-callback': () => setTurnstileToken(''),
        'error-callback': () => setTurnstileToken(''),
      })
      turnstileWidgetId.current = widgetId
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-turnstile]')
    if (window.turnstile) mount()
    else if (existing) existing.addEventListener('load', mount, { once: true })
    else {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.dataset.turnstile = 'true'
      script.addEventListener('load', mount, { once: true })
      document.head.append(script)
    }
    return () => {
      if (widgetId) window.turnstile?.remove(widgetId)
    }
  }, [siteKey])
  const [preview, setPreview] = useState('')
  useEffect(() => {
    if (!result) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreview('')
      return
    }
    const url = URL.createObjectURL(result)

    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [result])
  const process = async () => {
    if (!file) return
    setBusy(true)
    setMessage('')
    try {
      const form = new FormData()
      form.append('image_file', file)
      form.append('cf-turnstile-response', turnstileToken)
      const response = await fetch('/api/remove-background', { method: 'POST', body: form })
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        setMessage(
          payload?.error ||
            (response.status === 404
              ? 'This API requires the Cloudflare Pages deployment and REMOVEBG_API_KEY secret.'
              : 'remove.bg could not process this image. Try another image or check the API account.'),
        )
        return
      }
      const blob = await response.blob()
      setResult(blob)
      const credits = response.headers.get('X-Credits-Charged')
      setMessage(
        credits
          ? `Background removed. This request used ${credits} remove.bg credit${credits === '1' ? '' : 's'}.`
          : 'Background removed. Your transparent PNG is ready.',
      )
    } catch {
      setMessage(
        'Could not reach the background-removal service. Deploy this project on Cloudflare Pages and set the REMOVEBG_API_KEY secret.',
      )
    } finally {
      setBusy(false)
      setTurnstileToken('')
      if (turnstileWidgetId.current) window.turnstile?.reset(turnstileWidgetId.current)
    }
  }
  return (
    <div className="tool-layout">
      <div className="tool-controls">
        <label className="dropzone">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const next = event.target.files?.[0] || null
              setFile(next)
              setTurnstileToken('')
              setResult(null)
              setMessage('')
            }}
          />
          <span className="upload-icon">
            <Eraser size={22} />
          </span>
          <strong>{file ? file.name : 'Choose an image'}</strong>
          <span>
            <u>browse files</u>
          </span>
          <small>JPG, PNG, or WebP · Maximum 22 MB</small>
        </label>
        {file && (
          <p className="file-line">
            <Check size={15} />
            {(file.size / 1024 / 1024).toFixed(2)} MB selected
          </p>
        )}
        {siteKey ? (
          <div ref={turnstileRef} aria-label="Security verification" />
        ) : (
          <p className="hint" role="status">
            Background removal is temporarily unavailable because its security check is not
            configured.
          </p>
        )}
        <button
          className="btn primary full"
          disabled={!file || !turnstileToken || busy || file.size > 22 * 1024 * 1024}
          onClick={process}
        >
          <Eraser size={17} />
          {busy ? 'Removing background with remove.bg…' : 'Remove background'}
        </button>
        {file && file.size > 22 * 1024 * 1024 && (
          <p className="error" role="alert">
            This image is larger than remove.bg's 22 MB upload limit.
          </p>
        )}
        {preview && (
          <button
            className="btn secondary full"
            onClick={() => result && saveFile(result, 'toolbox-background-removed.png')}
          >
            <Download size={17} />
            Download transparent PNG
          </button>
        )}
        {message && (
          <p className="success" role="status">
            {message}
          </p>
        )}
        <p className="hint">
          Your image is sent to remove.bg through this Cloudflare Function for processing. remove.bg
          API use may consume credits. The API key is kept server-side and is never sent to your
          browser.
        </p>
      </div>
      <div className="preview-panel">
        <div className="preview-heading">
          <span>Transparent result</span>
          <span className="muted">Processed by remove.bg</span>
        </div>
        {preview ? (
          <img className="image-preview" src={preview} alt="Background removed preview" />
        ) : (
          <div className="empty-preview">
            <Eraser size={34} />
            <span>Choose an image, then remove its background</span>
          </div>
        )}
      </div>
    </div>
  )
}
