import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const titles = {
  '/': 'Atelier | Considered fashion',
  '/shop': 'Shop fashion | Atelier',
  '/cart': 'Your bag | Atelier',
  '/checkout': 'Checkout | Atelier',
  '/journal': 'Journal | Atelier',
}

export default function RouteSeo() {
  const { pathname } = useLocation()
  useEffect(() => {
    const title = titles[pathname] || (pathname.startsWith('/product/') ? 'Product | Atelier' : pathname.startsWith('/admin') ? 'Admin | Atelier' : 'Atelier')
    document.title = title
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical) }
    canonical.href = `${window.location.origin}${pathname}`
  }, [pathname])
  return null
}
