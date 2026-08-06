import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Search, TrendingUp, X } from 'lucide-react'
import api from '../../services/axiosInstance'

const RECENT_KEY = 'recentSearches'
const trending = ['Linen shirts', 'Summer dresses', 'Leather bags', 'Sneakers']

export default function SearchModal({ onClose }) {
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [recent, setRecent] = useState(() => JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'))

  useEffect(() => { inputRef.current?.focus(); document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = '' } }, [])
  useEffect(() => {
    if (query.trim().length < 2) return setSuggestions([])
    const timer = setTimeout(async () => {
      try { const { data } = await api.get(`products/suggestions?q=${encodeURIComponent(query)}`); setSuggestions(data.suggestions || []) } catch { setSuggestions([]) }
    }, 250)
    return () => clearTimeout(timer)
  }, [query])
  const search = (term = query) => {
    const value = term.trim(); if (!value) return
    const next = [value, ...recent.filter(x => x.toLowerCase() !== value.toLowerCase())].slice(0, 5)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next)); setRecent(next); onClose(); navigate(`/shop?q=${encodeURIComponent(value)}`)
  }
  return <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm p-4 sm:p-10" onMouseDown={onClose}>
    <div className="mx-auto max-w-3xl bg-atelier-beige shadow-2xl p-6 sm:p-8" onMouseDown={e => e.stopPropagation()}>
      <div className="flex items-center border-b border-atelier-dark gap-3 pb-3"><Search size={20}/><input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} placeholder="Search products, brands, categories and styles" className="w-full bg-transparent font-serif text-xl outline-none"/><button onClick={onClose}><X/></button></div>
      {query && <button onClick={() => search()} className="mt-4 btn-atelier-dark text-xs">Search for “{query}”</button>}
      {suggestions.length > 0 && <section className="mt-7"><p className="font-mono text-xs uppercase tracking-widest text-atelier-gray mb-3">Live suggestions</p>{suggestions.map(p => <button key={p._id} onClick={() => { onClose(); navigate(`/product/${p._id}`) }} className="w-full flex items-center gap-3 border-b border-atelier-lightgray/50 py-3 text-left hover:bg-atelier-cream"><img className="h-12 w-12 object-cover bg-atelier-cream" src={p.images?.[0]?.url} alt=""/><span className="flex-1"><b className="font-serif">{p.name}</b><small className="block text-atelier-gray">{p.brand || p.category}</small></span><span>${p.discountPrice || p.price}</span></button>)}</section>}
      {!query && <div className="grid sm:grid-cols-2 gap-8 mt-8"><section><p className="flex gap-2 font-mono text-xs uppercase tracking-widest text-atelier-gray mb-3"><Clock size={14}/> Recent</p>{recent.length ? recent.map(t => <button key={t} onClick={() => search(t)} className="block py-1 hover:text-atelier-accent">{t}</button>) : <p className="text-sm text-atelier-gray">Your searches will appear here.</p>}</section><section><p className="flex gap-2 font-mono text-xs uppercase tracking-widest text-atelier-gray mb-3"><TrendingUp size={14}/> Trending</p>{trending.map(t => <button key={t} onClick={() => search(t)} className="block py-1 hover:text-atelier-accent">{t}</button>)}</section></div>}
    </div>
  </div>
}
