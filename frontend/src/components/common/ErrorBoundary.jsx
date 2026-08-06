import React from 'react'

export default class ErrorBoundary extends React.Component {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error, info) { console.error('Unhandled UI error', error, info) }
  render() {
    if (this.state.hasError) return <main role="alert" className="min-h-[60vh] grid place-items-center p-6 text-center"><div><p className="font-mono text-xs uppercase tracking-widest text-atelier-gray">Something went wrong</p><h1 className="font-serif text-3xl mt-2">Please refresh and try again.</h1><button className="btn-atelier-dark mx-auto mt-6" onClick={() => window.location.reload()}>Refresh page</button></div></main>
    return this.props.children
  }
}
