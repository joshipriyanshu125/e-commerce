import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Star, ChevronLeft, ChevronRight, ArrowRight, Truck } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const SimilarProducts = ({ productId, currentProduct }) => {
  const navigate = useNavigate()
  const scrollRef = useRef(null)
  const [similarProducts, setSimilarProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const allProducts = useSelector(state => state.products.allProducts || [])

  useEffect(() => {
    let isMounted = true
    setLoading(true)

    if (productId) {
      axios
        .get(`${API_URL}/products/${productId}/similar`)
        .then(res => {
          if (isMounted) {
            const fetched = res.data?.products || []
            if (fetched.length > 0) {
              setSimilarProducts(normalizeProducts(fetched))
            } else {
              // Fallback to store filtering if API returns empty
              fallbackFromStore()
            }
            setLoading(false)
          }
        })
        .catch(() => {
          if (isMounted) {
            fallbackFromStore()
            setLoading(false)
          }
        })
    } else {
      fallbackFromStore()
      setLoading(false)
    }

    return () => {
      isMounted = false
    }
  }, [productId, currentProduct, allProducts])

  const fallbackFromStore = () => {
    if (!currentProduct || !allProducts.length) return
    const currentId = currentProduct._id || currentProduct.id
    const category = (currentProduct.category || '').toLowerCase()

    const matches = allProducts.filter(p => {
      const pId = p._id || p.id
      if (pId === currentId) return false
      return p.category && p.category.toLowerCase() === category
    })

    // If not enough in category, fill with remaining items
    let finalItems = [...matches]
    if (finalItems.length < 4) {
      const remaining = allProducts.filter(
        p => (p._id || p.id) !== currentId && !finalItems.some(f => (f._id || f.id) === (p._id || p.id))
      )
      finalItems = [...finalItems, ...remaining]
    }

    setSimilarProducts(finalItems.slice(0, 10))
  }

  // Helper to normalize product images & price calculations
  const normalizeProducts = rawList => {
    return rawList.map(p => {
      const salePrice = p.discountPrice ? Number(p.discountPrice) : null
      const basePrice = Number(p.price)
      const currentP = salePrice || basePrice
      const origP = salePrice ? basePrice : (p.originalPrice ? Number(p.originalPrice) : null)
      
      let discountPct = null
      if (origP && origP > currentP) {
        discountPct = Math.round(((origP - currentP) / origP) * 100)
      }

      // Normalizing images
      let img = null
      if (Array.isArray(p.images) && p.images.length > 0) {
        const first = p.images[0]
        img = typeof first === 'string' ? first : (first && first.url ? first.url : null)
      } else if (typeof p.image === 'string') {
        img = p.image
      }

      if (!img) {
        img = 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80'
      }

      return {
        id: p._id || p.id,
        name: p.name,
        brand: p.brand || p.category || 'Atelier',
        category: p.category,
        price: currentP,
        originalPrice: origP,
        discountPct,
        rating: p.rating || 4.2,
        numReviews: p.numReviews || 12,
        image: img,
        isAd: p.isAd || false,
      }
    })
  }

  const scroll = direction => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current
      const scrollAmount = clientWidth * 0.7
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  if (loading) {
    return (
      <div className="py-12 border-t border-atelier-lightgray/40">
        <div className="h-6 w-48 bg-atelier-lightgray/40 animate-pulse rounded mb-6" />
        <div className="flex gap-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="min-w-[220px] h-72 bg-atelier-cream border border-atelier-lightgray/30 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!similarProducts || similarProducts.length === 0) return null

  // Generate dynamic estimated delivery date (e.g. 3-4 days from now)
  const getDeliveryDate = () => {
    const d = new Date()
    d.setDate(d.getDate() + 3)
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
  }

  const fallbackSrc = 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80'

  return (
    <div className="py-10 border-t border-atelier-lightgray/50 font-sans">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-serif text-2xl text-atelier-dark font-medium tracking-tight">
            Similar Products
          </h2>
          <p className="text-xs text-atelier-gray font-sans mt-0.5 font-light">
            Handpicked styles matching your current selection
          </p>
        </div>

        {/* Carousel controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="h-9 w-9 rounded-full border border-atelier-lightgray/70 bg-white flex items-center justify-center text-atelier-dark hover:bg-atelier-dark hover:text-white transition-colors duration-200 shadow-xs"
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="h-9 w-9 rounded-full border border-atelier-lightgray/70 bg-white flex items-center justify-center text-atelier-dark hover:bg-atelier-dark hover:text-white transition-colors duration-200 shadow-xs"
            aria-label="Scroll right"
          >
            <ChevronRight size={18} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div
        ref={scrollRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {similarProducts.map(product => {
          const ratingVal = (product.rating || 4.0).toFixed(1)

          return (
            <div
              key={product.id}
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' })
                navigate(`/product/${product.id}`)
              }}
              className="flex-shrink-0 w-[200px] sm:w-[220px] md:w-[230px] bg-white border border-atelier-lightgray/40 rounded-xl overflow-hidden shadow-xs hover:shadow-md hover:border-atelier-gray/40 transition-all duration-300 cursor-pointer group snap-start flex flex-col justify-between"
            >
              {/* Product Image Container */}
              <div className="relative aspect-[4/5] bg-atelier-cream/60 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                  onError={e => {
                    e.target.onerror = null
                    e.target.src = fallbackSrc
                  }}
                />

                {/* AD Badge if sponsored */}
                {product.isAd && (
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-gray-200/90 text-gray-600 text-[10px] font-mono font-semibold rounded uppercase tracking-wider">
                    AD
                  </span>
                )}

                {/* Flipkart-Style Rating Badge */}
                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-emerald-700/90 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-xs">
                  <span>{ratingVal}</span>
                  <Star size={10} fill="currentColor" strokeWidth={0} />
                </div>
              </div>

              {/* Details Content */}
              <div className="p-3.5 space-y-2 flex-grow flex flex-col justify-between">
                <div>
                  {/* Brand */}
                  <span className="text-[11px] font-mono uppercase tracking-wider text-atelier-gray block truncate">
                    {product.brand}
                  </span>
                  {/* Product Title */}
                  <h3 className="text-xs font-medium text-atelier-dark line-clamp-2 leading-snug group-hover:text-amber-800 transition-colors">
                    {product.name}
                  </h3>
                </div>

                {/* Pricing Block */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    {/* Discount percentage badge */}
                    {product.discountPct ? (
                      <span className="text-xs font-bold text-emerald-700">
                        {product.discountPct}% OFF
                      </span>
                    ) : null}

                    {/* Struck original price */}
                    {product.originalPrice ? (
                      <span className="text-xs text-atelier-gray line-through font-mono">
                        ${product.originalPrice}
                      </span>
                    ) : null}

                    {/* Current Price */}
                    <span className="text-sm font-semibold font-mono text-atelier-dark">
                      ${product.price}
                    </span>
                  </div>

                  {/* Flipkart Delivery promise label */}
                  <div className="flex items-center gap-1 text-[11px] text-atelier-gray font-light">
                    <Truck size={11} className="text-emerald-600 shrink-0" />
                    <span>Get it by <strong className="font-normal text-atelier-dark">{getDeliveryDate()}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default SimilarProducts
