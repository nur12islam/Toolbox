interface Env {
  REMOVEBG_API_KEY?: string
  TURNSTILE_SECRET_KEY?: string
  RATE_LIMIT_KV?: {
    get(key: string): Promise<string | null>
    put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
  }
}

interface PagesRequestContext {
  request: Request
  env: Env
}

const MAX_IMAGE_BYTES = 22 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const RATE_LIMIT = 5
const RATE_WINDOW_SECONDS = 60

function json(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function onRequestPost({ request, env }: PagesRequestContext): Promise<Response> {
  const apiKey = env.REMOVEBG_API_KEY
  const turnstileSecret = env.TURNSTILE_SECRET_KEY
  const rateLimitKv = env.RATE_LIMIT_KV
  if (!apiKey)
    return json('Background removal is temporarily unavailable. Please try again later.', 503)
  if (!turnstileSecret || !rateLimitKv) {
    return json('Background removal security is not configured yet. Please try again later.', 503)
  }

  const origin = request.headers.get('Origin')
  if (origin !== new URL(request.url).origin)
    return json('Cross-origin requests are not allowed.', 403)

  const ip = request.headers.get('CF-Connecting-IP')
  if (!ip) return json('Could not verify this request. Please try again later.', 403)
  const bucket = Math.floor(Date.now() / (RATE_WINDOW_SECONDS * 1000))
  const key = `remove-bg:${ip}:${bucket}`
  try {
    const count = Number((await rateLimitKv.get(key)) || 0)
    if (count >= RATE_LIMIT)
      return json('Too many requests. Please wait a minute before trying again.', 429)
    await rateLimitKv.put(key, String(count + 1), {
      expirationTtl: RATE_WINDOW_SECONDS * 2,
    })
  } catch {
    return json('Background removal security is temporarily unavailable. Please try again.', 503)
  }

  const declaredLength = Number(request.headers.get('Content-Length') || 0)
  if (declaredLength > MAX_IMAGE_BYTES + 256 * 1024)
    return json('The image exceeds the 22 MB upload limit.', 413)

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return json('Send an image as multipart form data in the image_file field.', 400)
  }
  const upload = form.get('image_file')
  const captcha = form.get('cf-turnstile-response')
  if (typeof captcha !== 'string' || !captcha)
    return json('Complete the security check and try again.', 403)

  let verification: Response
  try {
    verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: turnstileSecret,
        response: captcha,
        remoteip: ip,
      }),
    })
  } catch {
    return json('The security check is temporarily unavailable. Please try again.', 503)
  }
  let verificationResult: { success?: boolean; hostname?: string }
  try {
    verificationResult = (await verification.json()) as { success?: boolean; hostname?: string }
  } catch {
    return json('The security check is temporarily unavailable. Please try again.', 503)
  }
  if (
    !verification.ok ||
    !verificationResult.success ||
    verificationResult.hostname !== new URL(request.url).hostname
  )
    return json('The security check expired or failed. Please try again.', 403)

  if (!(upload instanceof File)) return json('Choose a JPG, PNG, or WebP image first.', 400)
  if (upload.size > MAX_IMAGE_BYTES) return json('The image exceeds the 22 MB upload limit.', 413)
  if (!ALLOWED_TYPES.has(upload.type.toLowerCase()))
    return json('Only JPG, PNG, and WebP images are supported.', 415)

  const body = new FormData()
  body.append('image_file', upload, upload.name || 'image')
  body.append('size', 'auto')

  let result: Response
  try {
    result = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body,
    })
  } catch {
    return json('Could not reach remove.bg. Please try again later.', 502)
  }

  if (!result.ok) {
    if (result.status === 402) return json('The remove.bg account has run out of API credits.', 402)
    if (result.status === 403)
      return json('The remove.bg API key was rejected. Check the Cloudflare secret.', 502)
    if (result.status === 429)
      return json('The remove.bg rate limit was reached. Please try again later.', 429)
    if (result.status === 400 || result.status === 415 || result.status === 422)
      return json(
        'remove.bg could not process this image. Try a clear JPG, PNG, or WebP photo.',
        422,
      )
    return json('remove.bg is temporarily unavailable. Please try again later.', 502)
  }

  const headers = new Headers({
    'Content-Type': result.headers.get('Content-Type') || 'image/png',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  })
  const credits = result.headers.get('X-Credits-Charged')
  if (credits) headers.set('X-Credits-Charged', credits)
  return new Response(result.body, { status: 200, headers })
}
