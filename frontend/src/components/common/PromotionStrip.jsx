import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/axiosInstance'

const remaining = end => Math.max(0, new Date(end).getTime() - Date.now())
const format = ms => { const h=Math.floor(ms/3600000), m=Math.floor(ms%3600000/60000), s=Math.floor(ms%60000/1000); return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` }
export default function PromotionStrip() {
  const [promotions,setPromotions]=useState([]); const [now,setNow]=useState(Date.now())
  useEffect(()=>{ api.get('promotions/active').then(r=>setPromotions(r.data.promotions||[])).catch(()=>{}); const id=setInterval(()=>setNow(Date.now()),1000); return()=>clearInterval(id) },[])
  if(!promotions.length) return null
  const promo=promotions[0]; const countdown = promo.type==='flash_sale' ? format(Math.max(0, new Date(promo.endsAt).getTime() - now)) : null
  return <section className="bg-atelier-dark text-white px-4 py-4 text-center"><p className="font-mono text-xs uppercase tracking-[.2em] opacity-70">{promo.type.replace('_',' ')}</p><h2 className="font-serif text-xl mt-1">{promo.banner?.title || promo.name}</h2>{promo.banner?.subtitle&&<p className="text-sm text-white/70 mt-1">{promo.banner.subtitle}</p>}{countdown&&<p className="font-mono mt-2 tracking-widest">Ends in {countdown}</p>}<Link to={promo.banner?.link || '/shop'} className="inline-block mt-3 text-xs font-mono uppercase tracking-widest border-b">Shop the offer</Link></section>
}
