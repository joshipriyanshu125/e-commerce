import React from 'react'

export default function RouteLoader() {
  return <div className="min-h-[45vh] flex flex-col items-center justify-center gap-3" role="status" aria-live="polite"><span className="h-8 w-8 rounded-full border-2 border-atelier-lightgray border-t-atelier-dark animate-spin"/><span className="font-mono text-xs tracking-widest uppercase text-atelier-gray">Loading</span></div>
}
