/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TURNSTILE_SITE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface TurnstileOptions {
  sitekey: string
  callback: (token: string) => void
  'expired-callback': () => void
  'error-callback': () => void
}

interface Window {
  turnstile?: {
    render: (container: HTMLElement, options: TurnstileOptions) => string
    remove: (widgetId: string) => void
    reset: (widgetId: string) => void
  }
}
