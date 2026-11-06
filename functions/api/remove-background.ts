interface Env {
  REMOVEBG_API_KEY?: string
}

interface PagesRequestContext {
  request: Request
  env: Env
}

const MAX_IMAGE_BYTES = 22 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function json(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function onRequestPost({ request, env }: PagesRequestContext): Promise<Response> {
  if (!env.REMOVEBG_API_KEY) return json('The Cloudflare Pages secret REMOVEBG_API_KEY is not configured.', 503)

  const origin = request.headers.get('Origin')
  if (origin !== new URL(request.url).origin) return json('Cross-origin requests are not allowed.', 403)

  const declaredLength = Number(request.headers.get('Content-Length') || 0)
  if (declaredLength > MAX_IMAGE_BYTES + 256 * 1024) return json('The image exceeds the 22 MB upload limit.', 413)

  let upload: FormDataEntryValue | null
  try {
    upload = (await request.formData()).get('image_file')
  } catch {
    return json('Send an image as multipart form data in the image_file field.', 400)
  }
  if (!(upload instanceof File)) return json('Choose a JPG, PNG, or WebP image first.', 400)
  if (upload.size > MAX_IMAGE_BYTES) return json('The image exceeds the 22 MB upload limit.', 413)
  if (!ALLOWED_TYPES.has(upload.type.toLowerCase())) return json('Only JPG, PNG, and WebP images are supported.', 415)

  const body = new FormData()
  body.append('image_file', upload, upload.name || 'image')
  body.append('size', 'auto')

  let result: Response
  try {
    result = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': env.REMOVEBG_API_KEY },
      body,
    })
  } catch {
    return json('Could not reach remove.bg. Please try again later.', 502)
  }

  if (!result.ok) {
    if (result.status === 402) return json('The remove.bg account has run out of API credits.', 402)
    if (result.status === 403) return json('The remove.bg API key was rejected. Check the Cloudflare secret.', 502)
    if (result.status === 429) return json('The remove.bg rate limit was reached. Please try again later.', 429)
    if (result.status === 400 || result.status === 415 || result.status === 422) return json('remove.bg could not process this image. Try a clear JPG, PNG, or WebP photo.', 422)
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

