import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

// catches render crashes so the user sees a recovery screen instead of a blank page
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error:', error, info.componentStack)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <section className="flex min-h-screen w-full items-center justify-center p-8" role="main">
        <div className="glass-card mx-auto w-full max-w-[480px] text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-error bg-error/15 text-xl text-error">
            !
          </div>
          <h1 className="mb-2 text-2xl font-bold">Something went wrong</h1>
          <p className="mb-6 text-sm text-text-secondary">
            An unexpected error occurred. Your answers are saved locally and will be sent when possible.
          </p>
          <button
            onClick={this.handleReload}
            className="rounded-lg bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Reload Page
          </button>
        </div>
      </section>
    )
  }
}
