import { Component, type ErrorInfo, type ReactNode } from 'react'

type State = { failed: boolean }

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ToolBox encountered an unexpected error.', error, info)
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="content about-page" role="alert">
          <span className="eyebrow">Something went wrong</span>
          <h1>This page could not load.</h1>
          <p className="hero-copy">
            Refresh the page and try again. Your selected files stay on your device.
          </p>
          <button className="btn primary" onClick={() => window.location.reload()}>
            Refresh page
          </button>
        </main>
      )
    }
    return this.props.children
  }
}
