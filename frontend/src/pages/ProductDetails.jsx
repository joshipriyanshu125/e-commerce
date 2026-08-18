import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { fetchProductById } from '../features/products/productSlice'
import { addToCart } from '../features/cart/cartSlice'
import { Star, ShieldCheck, Truck, RefreshCw, Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-react'
import ReviewSection from '../components/product/ReviewSection'
import SizeRecommender from '../components/product/SizeRecommender'
import SimilarProducts from '../components/product/SimilarProducts'

const ProductDetails = () => {
  const { id } = useParams()
  const dispatch = useDispatch()

  const selectedProduct = useSelector(state => state.products.selectedProduct)
  const apiLoading = useSelector(state => state.products.apiLoading)

  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [isSliding, setIsSliding] = useState(false)
  const [slideDir, setSlideDir] = useState('next')

  const [isAddingToBag, setIsAddingToBag] = useState(false)
  const thumbnailRef = useRef(null)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    dispatch(fetchProductById(id))
    setSelectedSize('')
    setQuantity(1)
    setActiveImageIdx(0)
  }, [id, dispatch])

  useEffect(() => {
    if (selectedProduct) {
      const colors = selectedProduct.colors || []
      if (colors.length === 1) setSelectedColor(colors[0])
      else setSelectedColor(null)

      const sizes = selectedProduct.sizes || []
      if (sizes.length === 1 && typeof sizes[0] === 'string' && !sizes[0].includes('-')) {
        setSelectedSize(sizes[0])
      } else {
        setSelectedSize(null)
      }
    }
  }, [selectedProduct])

  // Show loading skeleton / missing notice if product is not yet loaded or doesn't match ID
  const isCorrectProduct = selectedProduct && (selectedProduct._id === id || selectedProduct.id === id)
  if (!isCorrectProduct) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center font-sans">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-atelier-dark border-t-transparent mb-4" />
        <p className="font-serif text-xl text-atelier-gray italic">
          {apiLoading ? 'Loading product details...' : 'Product not found.'}
        </p>
        <Link to="/" className="btn-atelier-outline mt-6 inline-block">Back to Shop</Link>
      </div>
    )
  }

  // ── Image normalization ──────────────────────────────────────────────────────
  const rawImages = selectedProduct.images || []
  const images = rawImages
    .map(img => {
      if (typeof img === 'string' && img.startsWith('http')) return img
      if (typeof img === 'string' && img.startsWith('/')) return img
      if (img && typeof img === 'object' && img.url) return img.url
      return null
    })
    .filter(Boolean)

  // ── Color normalization ──────────────────────────────────────────────────────
  const colorHexMap = {
    black: '#1C1C1C', white: '#F5F5F5', red: '#DC2626', blue: '#2563EB',
    green: '#16A34A', yellow: '#EAB308', orange: '#EA580C', purple: '#9333EA',
    pink: '#EC4899', grey: '#6B7280', gray: '#6B7280', brown: '#92400E',
    navy: '#1E3A5F', beige: '#F5F0E8', cream: '#F0ECE3', camel: '#C29B70',
    cognac: '#825633', sand: '#D7C7B7', charcoal: '#374151', silver: '#C0C0C0',
    gold: '#D4AF37', 'off-white': '#EAE6DD', offwhite: '#EAE6DD',
  }
  const colors = (selectedProduct.colors || []).map(c => {
    if (typeof c === 'string') {
      return { name: c, hex: colorHexMap[c.toLowerCase().trim()] || '#888888' }
    }
    return { name: c.name || 'Color', hex: c.hex || '#888888' }
  })

  // ── Color to Image index mapping ─────────────────────────────────────────────
  const getColorImageIdx = (colorObj, colorIndex) => {
    const colorName = typeof colorObj === 'string'
      ? colorObj.toLowerCase().trim()
      : (colorObj?.name || '').toLowerCase().trim()

    // 1. Match image URL strings if they contain color keywords
    if (colorName && images.length > 0) {
      const matchIdx = images.findIndex(img => {
        const urlLower = String(img).toLowerCase()
        if (colorName === 'grey' || colorName === 'gray') {
          return urlLower.includes('grey') || urlLower.includes('gray')
        }
        if (colorName === 'navy' || colorName === 'blue') {
          return urlLower.includes('navy') || urlLower.includes('blue')
        }
        return urlLower.includes(colorName)
      })
      if (matchIdx !== -1) return matchIdx
    }

    // 2. Map color index proportionally across image gallery
    if (colors.length > 0 && images.length > 0) {
      const step = images.length / colors.length
      return Math.min(Math.floor(colorIndex * step), images.length - 1)
    }

    return 0
  }

  // ── Size normalization ───────────────────────────────────────────────────────
  const expandSizes = (sizeArr) => {
    const result = []
    for (const s of sizeArr) {
      if (typeof s === 'string' && /^\d+\.?\d*-\d+\.?\d*$/.test(s.trim())) {
        const parts = s.split('-')
        const start = parseFloat(parts[0])
        const end = parseFloat(parts[1])
        const step = (end - start) <= 6 ? 0.5 : 1
        for (let v = start; v <= end; v += step) {
          result.push(Number.isInteger(v) ? String(v) : v.toFixed(1))
        }
      } else {
        result.push(String(s))
      }
    }
    return result
  }
  const allSizes = expandSizes(selectedProduct.sizes || [])

  // ── Image slider helpers ─────────────────────────────────────────────────────
  const goToImage = (idx, direction = 'next') => {
    if (isSliding || images.length <= 1) return
    setSlideDir(direction)
    setIsSliding(true)
    setTimeout(() => {
      setActiveImageIdx(idx)
      setIsSliding(false)
    }, 280)

    if (thumbnailRef.current) {
      const rail = thumbnailRef.current
      const thumb = rail.children[idx]
      if (thumb) {
        rail.scrollTo({
          left: thumb.offsetLeft - (rail.clientWidth - thumb.clientWidth) / 2,
          behavior: 'smooth',
        })
      }
    }
  }

  const goPrev = () => {
    const newIdx = activeImageIdx === 0 ? images.length - 1 : activeImageIdx - 1
    goToImage(newIdx, 'prev')
  }

  const goNext = () => {
    const newIdx = activeImageIdx === images.length - 1 ? 0 : activeImageIdx + 1
    goToImage(newIdx, 'next')
  }

  // ── Quantity / cart ──────────────────────────────────────────────────────────
  const handleQuantityChange = (val) => {
    setQuantity(prev => Math.max(1, prev + val))
  }

  const handleAddToBag = () => {
    if (allSizes.length > 0 && !selectedSize) {
      alert('Please select a size.')
      return
    }
    if (colors.length > 0 && !selectedColor) {
      alert('Please select a color.')
      return
    }
    setIsAddingToBag(true)
    setTimeout(() => {
      dispatch(addToCart({
        product: selectedProduct,
        quantity,
        color: selectedColor,
        size: selectedSize || 'One Size'
      }))
      setIsAddingToBag(false)
    }, 600)
  }

  const activeImage = images.length > 0 ? images[activeImageIdx] : null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in font-sans">

      {/* Main product column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start pb-20">

        {/* ── Left Column: Image Gallery ────────────────────────────────────── */}
        <div className="lg:col-span-7 space-y-4 lg:sticky lg:top-28 lg:self-start">

          {/* Main image with slider arrows */}
          <div className="aspect-square bg-atelier-cream border border-atelier-lightgray/30 overflow-hidden relative rounded-xl group">
            {activeImage ? (
              <img
                key={activeImageIdx}
                src={activeImage}
                alt={selectedProduct.name}
                className={`h-full w-full object-contain transition-all duration-300 ${
                  isSliding
                    ? slideDir === 'next'
                      ? 'opacity-0 translate-x-4'
                      : 'opacity-0 -translate-x-4'
                    : 'opacity-100 translate-x-0'
                }`}
                style={{ transition: 'opacity 280ms ease, transform 280ms ease' }}
                onError={(e) => { e.target.style.display = 'none' }}
              />
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-atelier-gray">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-30 mb-3">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                  <circle cx="9" cy="9" r="2"/>
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                </svg>
                <span className="text-xs font-mono tracking-widest uppercase opacity-40">No image</span>
              </div>
            )}

            {/* Prev / Next arrows — only shown when multiple images */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/80 backdrop-blur-sm border border-atelier-lightgray/50 flex items-center justify-center text-atelier-dark shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={18} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/80 backdrop-blur-sm border border-atelier-lightgray/50 flex items-center justify-center text-atelier-dark shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white z-10"
                  aria-label="Next image"
                >
                  <ChevronRight size={18} strokeWidth={2} />
                </button>
                {/* Dot indicators */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {images.map((_, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => goToImage(idx, idx > activeImageIdx ? 'next' : 'prev')}
                      className={`rounded-full transition-all duration-200 ${
                        activeImageIdx === idx
                          ? 'w-5 h-1.5 bg-atelier-dark'
                          : 'w-1.5 h-1.5 bg-atelier-dark/30 hover:bg-atelier-dark/60'
                      }`}
                      aria-label={`View image ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail strip — horizontal scrollable */}
          {images.length > 1 && (
            <div
              ref={thumbnailRef}
              className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin"
              style={{ scrollbarWidth: 'none' }}
            >
              {images.map((img, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => goToImage(idx, idx > activeImageIdx ? 'next' : 'prev')}
                  className={`flex-shrink-0 h-16 w-16 sm:h-20 sm:w-20 bg-atelier-cream border-2 overflow-hidden rounded-md transition-all duration-200 ${
                    activeImageIdx === idx
                      ? 'border-atelier-dark shadow-md scale-105'
                      : 'border-transparent hover:border-atelier-gray/50'
                  }`}
                  aria-label={`Image ${idx + 1}`}
                >
                  <img
                    src={img}
                    alt=""
                    className="h-full w-full object-contain"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right Column: Info ────────────────────────────────────────────── */}
        <div className="lg:col-span-5 space-y-8">

          {/* Header */}
          <div className="space-y-3">
            <span className="font-mono text-xs sm:text-sm tracking-[0.25em] uppercase text-atelier-gray block">
              {selectedProduct.category}
              {selectedProduct.brand ? ` · ${selectedProduct.brand}` : ''}
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-atelier-dark font-medium leading-tight">
              {selectedProduct.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center space-x-2">
              <div className="flex text-atelier-accent">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill={i < Math.round(selectedProduct.rating) ? 'currentColor' : 'none'}
                    strokeWidth={1.5}
                  />
                ))}
              </div>
              <span className="text-xs text-atelier-dark font-mono font-medium">{selectedProduct.rating}</span>
              <span className="text-xs text-atelier-gray">({selectedProduct.numReviews || 0} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-center space-x-3 pt-2">
              <span className="text-2xl text-atelier-dark font-mono font-medium">
                ${selectedProduct.price}
              </span>
              {selectedProduct.originalPrice && (
                <span className="text-lg text-atelier-gray line-through font-mono">
                  ${selectedProduct.originalPrice}
                </span>
              )}
            </div>
          </div>

          <p className="text-atelier-gray text-sm leading-relaxed font-light font-sans border-t border-atelier-lightgray/40 pt-6">
            {selectedProduct.description}
          </p>

          {/* ── Flipkart-Style Color Variant Selector (SS2 Reference) ───────────────────────── */}
          {colors.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-sans font-medium text-atelier-dark">
                Selected Color:{' '}
                <span className="text-atelier-gray font-normal capitalize">
                  {selectedColor
                    ? (typeof selectedColor === 'string' ? selectedColor : selectedColor.name)
                    : (typeof colors[0] === 'string' ? colors[0] : colors[0]?.name || 'Default')}
                </span>
              </h3>
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
                {colors.map((color, idx) => {
                  const colorName = typeof color === 'string' ? color : color.name
                  const activeColorName = selectedColor
                    ? (typeof selectedColor === 'string' ? selectedColor : selectedColor.name)
                    : (typeof colors[0] === 'string' ? colors[0] : colors[0]?.name)
                  const isSelected = activeColorName === colorName

                  // Determine matching image for this color
                  const targetImgIdx = getColorImageIdx(color, idx)
                  const colorThumb = images[targetImgIdx] || images[0]

                  return (
                    <button
                      key={colorName}
                      type="button"
                      onClick={() => {
                        setSelectedColor(color)
                        goToImage(targetImgIdx, targetImgIdx > activeImageIdx ? 'next' : 'prev')
                      }}
                      title={colorName}
                      className={`relative flex flex-col items-center p-1.5 bg-white border-2 rounded-xl transition-all duration-200 shrink-0 group ${
                        isSelected
                          ? 'border-black ring-2 ring-black/10 shadow-sm scale-105'
                          : 'border-atelier-lightgray/60 hover:border-atelier-dark/60'
                      }`}
                    >
                      {/* Image preview box matching SS2 rounded rectangle */}
                      <div className="h-16 w-14 sm:h-18 sm:w-16 rounded-lg overflow-hidden bg-atelier-cream border border-atelier-lightgray/40 flex items-center justify-center relative">
                        {colorThumb ? (
                          <img
                            src={colorThumb}
                            alt={colorName}
                            className="h-full w-full object-contain p-1"
                            onError={e => { e.target.style.display = 'none' }}
                          />
                        ) : (
                          <div
                            className="h-full w-full rounded-md"
                            style={{ backgroundColor: typeof color === 'object' ? color.hex : '#888' }}
                          />
                        )}
                        {/* Selected indicator overlay */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-black/10 rounded-lg flex items-center justify-center">
                            <span className="h-5 w-5 rounded-full bg-atelier-dark text-white flex items-center justify-center text-[10px] shadow-sm font-bold">
                              ✓
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Color Label */}
                      <span className="text-[11px] font-mono tracking-wider text-atelier-dark capitalize truncate max-w-[4.5rem] mt-1">
                        {colorName}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Size Selector ───────────────────────────────────────────────── */}
          {allSizes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm tracking-widest uppercase text-atelier-gray">
                  Select Size
                </h3>
                <button className="text-xs font-mono tracking-widest uppercase text-atelier-gray hover:text-atelier-dark underline">
                  Size Guide
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {allSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-3.5 py-2 border font-mono text-xs tracking-wider uppercase transition-all duration-200 rounded-sm min-w-[3rem] text-center ${
                      selectedSize === size
                        ? 'border-atelier-dark bg-atelier-dark text-white font-semibold shadow-sm'
                        : 'border-atelier-lightgray bg-transparent text-atelier-dark hover:border-atelier-dark'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── AI Size Recommendation ───────────────────────────────────────── */}
          {allSizes.length > 0 && (
            <SizeRecommender
              availableSizes={allSizes}
              onRecommend={(rec) => {
                if (allSizes.map(s => s.toUpperCase()).includes(rec.toUpperCase())) {
                  const match = allSizes.find(s => s.toUpperCase() === rec.toUpperCase())
                  if (match) setSelectedSize(match)
                }
              }}
            />
          )}

          {/* Quantity + Add to Bag */}
          <div className="flex gap-4 items-center pt-2">
            <div className="flex items-center border border-atelier-lightgray bg-atelier-cream h-12">
              <button
                onClick={() => handleQuantityChange(-1)}
                className="px-3 h-full text-atelier-gray hover:text-atelier-dark flex items-center justify-center"
              >
                <Minus size={14} />
              </button>
              <span className="px-4 text-xs font-mono text-atelier-dark font-medium select-none min-w-[30px] text-center">
                {quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(1)}
                className="px-3 h-full text-atelier-gray hover:text-atelier-dark flex items-center justify-center"
              >
                <Plus size={14} />
              </button>
            </div>

            <button
              onClick={handleAddToBag}
              disabled={isAddingToBag}
              className="flex-grow btn-atelier-dark h-12"
            >
              {isAddingToBag ? 'Adding to bag...' : 'Add to Bag'}
            </button>
          </div>

          {/* Trust icons */}
          <div className="grid grid-cols-3 gap-4 border-y border-atelier-lightgray/40 py-6 text-center text-atelier-gray text-sm font-mono tracking-widest uppercase">
            <div className="flex flex-col items-center space-y-1">
              <ShieldCheck size={16} strokeWidth={1.5} className="text-atelier-dark" />
              <span>Genuine Goods</span>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <Truck size={16} strokeWidth={1.5} className="text-atelier-dark" />
              <span>Complimentary Ship</span>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <RefreshCw size={16} strokeWidth={1.5} className="text-atelier-dark" />
              <span>Easy Returns</span>
            </div>
          </div>

          {/* Details accordion */}
          <div className="divide-y divide-atelier-lightgray/40 border-b border-atelier-lightgray/40">
            {selectedProduct.details && selectedProduct.details.length > 0 && (
              <details className="group py-4 cursor-pointer focus:outline-none">
                <summary className="flex items-center justify-between text-xs font-mono tracking-wider uppercase text-atelier-dark">
                  <span>Details &amp; Specifications</span>
                  <span className="text-atelier-gray group-open:rotate-180 transition-transform">&darr;</span>
                </summary>
                <ul className="list-disc list-inside mt-3 text-xs text-atelier-gray leading-relaxed font-light space-y-1.5 pl-2">
                  {selectedProduct.details.map((spec, i) => (
                    <li key={i}>{spec}</li>
                  ))}
                </ul>
              </details>
            )}

            <details className="group py-4 cursor-pointer focus:outline-none">
              <summary className="flex items-center justify-between text-xs font-mono tracking-wider uppercase text-atelier-dark">
                <span>Shipping &amp; Returns</span>
                <span className="text-atelier-gray group-open:rotate-180 transition-transform">&darr;</span>
              </summary>
              <div className="mt-3 text-xs text-atelier-gray leading-relaxed font-light pl-2 space-y-2">
                <p>Enjoy complimentary standard shipping on all orders over $150. Delivery takes between 3-5 business days.</p>
                <p>Items can be returned within 30 days of shipment in their original condition and packaging. Pre-paid shipping labels are provided.</p>
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* Reviews Section — Single instance mounted with unique product ID */}
      <ReviewSection
        key={id}
        productId={id}
        productRating={selectedProduct.rating}
        productNumReviews={selectedProduct.numReviews}
      />

      {/* Flipkart-Style Similar Products Carousel */}
      <SimilarProducts
        key={id}
        productId={id}
        currentProduct={selectedProduct}
      />
    </div>
  )
}

export default ProductDetails
