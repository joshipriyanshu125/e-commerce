import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { fetchProductById } from '../features/products/productSlice'
import { addToCart } from '../features/cart/cartSlice'
import { Star, ShieldCheck, Truck, RefreshCw, Plus, Minus, ChevronLeft, ChevronRight, X, ChevronUp, ChevronDown } from 'lucide-react'
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
  const [allDetailsTab, setAllDetailsTab] = useState('features') // features | specs | description | manufacturer
  const [expandedFeatures, setExpandedFeatures] = useState({}) // { [index]: boolean }
  const [detailsOpen, setDetailsOpen] = useState(true)
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

      // Set active tab to first available detail tab
      const available = [
        selectedProduct.features?.length > 0 && 'features',
        selectedProduct.specifications?.length > 0 && 'specs',
        selectedProduct.description && 'description',
        (selectedProduct.manufacturerInfo?.name || selectedProduct.manufacturerInfo?.address) && 'manufacturer',
      ].filter(Boolean)

      if (available.length > 0 && !available.includes(allDetailsTab)) {
        setAllDetailsTab(available[0])
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

  // ── Image normalization — preserve color tag ─────────────────────────────────
  const rawImages = selectedProduct.images || []
  // Keep full objects so we can use the stored `color` field
  const allImages = rawImages
    .map(img => {
      if (typeof img === 'string') return { url: img, color: '' }
      if (img && typeof img === 'object') {
        const url = img.url || img.secure_url || ''
        return { url, color: img.color || '' }
      }
      return null
    })
    .filter(img => img && img.url)

  // Helper — extract the display URL from a normalized image object
  const imgUrl = (img) => (typeof img === 'string' ? img : img?.url || '')

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

  // ── Color-specific Image Filtering ────────────────────────────────────────────
  const getImagesForColor = (colorObj, colorIndex) => {
    if (!allImages || allImages.length === 0) return []
    if (colors.length <= 1) return allImages

    const colorName = typeof colorObj === 'string'
      ? colorObj.toLowerCase().trim()
      : (colorObj?.name || '').toLowerCase().trim()

    const colorBase = colorName.replace(/\s*\d+$/, '').trim()

    // 1. Direct tag match (exact or base color match, e.g. "Jade Black 2" vs "Jade Black")
    const taggedMatches = allImages.filter(img => {
      const tag = (img.color || '').toLowerCase().trim()
      if (!tag) return false
      const tagBase = tag.replace(/\s*\d+$/, '').trim()
      return tag === colorName || tagBase === colorBase || tag.includes(colorBase) || colorName.includes(tag)
    })
    if (taggedMatches.length > 0) return taggedMatches

    // 2. Untagged fallback if some images are tagged but none matched this color
    const anyTagged = allImages.some(img => (img.color || '').trim() !== '')
    if (anyTagged) {
      const untagged = allImages.filter(img => !(img.color || '').trim())
      if (untagged.length > 0) return untagged
    }

    // 3. Legacy: keyword search in URL
    if (colorName) {
      const keywordMatches = allImages.filter(img => {
        const urlLower = imgUrl(img).toLowerCase()
        if (colorBase === 'grey' || colorBase === 'gray') {
          return urlLower.includes('grey') || urlLower.includes('gray')
        }
        if (colorBase === 'navy' || colorBase === 'blue') {
          return urlLower.includes('navy') || urlLower.includes('blue')
        }
        return urlLower.includes(colorBase)
      })
      if (keywordMatches.length > 0) return keywordMatches
    }

    // 4. Proportional slice per color variant
    if (colors.length > 0) {
      const countPerColor = Math.ceil(allImages.length / colors.length)
      const startIdx = colorIndex * countPerColor
      const colorSlice = allImages.slice(startIdx, startIdx + countPerColor)
      if (colorSlice.length > 0) return colorSlice
    }

    return allImages
  }

  // Active color name & index
  const activeColorObj = selectedColor || (colors.length > 0 ? colors[0] : null)
  const activeColorName = activeColorObj
    ? (typeof activeColorObj === 'string' ? activeColorObj : activeColorObj.name)
    : ''
  const activeColorIdx = colors.findIndex(c => {
    const n = typeof c === 'string' ? c : c.name
    return n.toLowerCase().trim() === activeColorName.toLowerCase().trim()
  })

  // Active filtered images for the selected color variant (array of { url, color } objects)
  const images = getImagesForColor(activeColorObj, activeColorIdx >= 0 ? activeColorIdx : 0)


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

  const activeImage = images.length > 0 ? images[Math.min(activeImageIdx, images.length - 1)] : null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in font-sans">

      {/* Main product column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start pb-6">

        {/* ── Left Column: Image Gallery ────────────────────────────────────── */}
        <div className="lg:col-span-7 space-y-4">

          {/* Main image with slider arrows */}
          <div className="aspect-square bg-atelier-cream border border-atelier-lightgray/30 overflow-hidden relative rounded-xl group">
            {activeImage ? (
              <img
                key={`${activeColorName}-${activeImageIdx}`}
                src={imgUrl(activeImage)}
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

            {/* Prev / Next arrows — only shown when multiple images for active color */}
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

          {/* Thumbnail strip — shown whenever a product has multiple images, positioned below main image with clean margin */}
          {images.length > 1 && (
            <div className="mt-6 pt-2">
              <div
                ref={thumbnailRef}
                className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin"
                style={{ scrollbarWidth: 'none' }}
              >
                {images.map((img, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => goToImage(idx, idx > activeImageIdx ? 'next' : 'prev')}
                    className={`flex-shrink-0 h-16 w-16 sm:h-20 sm:w-20 bg-white border-2 overflow-hidden rounded-xl transition-all duration-200 cursor-pointer ${
                      activeImageIdx === idx
                        ? 'border-black ring-2 ring-black/15 shadow-sm scale-105'
                        : 'border-gray-200 hover:border-gray-400 opacity-80 hover:opacity-100'
                    }`}
                    aria-label={`Image ${idx + 1}`}
                  >
                    <img
                      src={imgUrl(img)}
                      alt=""
                      className="h-full w-full object-contain p-1"
                      onError={(e) => { e.target.style.opacity = '0' }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right Column: Info ────────────────────────────────────────────── */}
        <div className="lg:col-span-5 space-y-5">

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

          {/* ── Flipkart-Style Color Variant Selector (Shown ONLY when product has multiple colors) ── */}
          {colors.length > 1 && (
            <div className="space-y-3">
              <h3 className="text-sm font-sans font-medium text-atelier-dark flex items-center justify-between">
                <span>
                  Selected Color:{' '}
                  <span className="text-atelier-gray font-normal capitalize">
                    {activeColorName || 'Select a color'}
                  </span>
                </span>
              </h3>
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
                {colors.map((color, idx) => {
                  const colorName = typeof color === 'string' ? color : color.name
                  const colorHex = typeof color === 'object' ? color.hex : (colorHexMap[colorName.toLowerCase().trim()] || '#888888')
                  const isSelected = activeColorName.toLowerCase().trim() === colorName.toLowerCase().trim()

                  // Thumbnail preview image specifically for this color
                  const colorSpecificImages = getImagesForColor(color, idx)
                  const colorThumbObj = colorSpecificImages[0] || allImages[idx] || allImages[0]
                  const colorThumbUrl = imgUrl(colorThumbObj)

                  return (
                    <button
                      key={colorName}
                      type="button"
                      onClick={() => {
                        setSelectedColor(color)
                        setActiveImageIdx(0)
                      }}
                      title={colorName}
                      className={`relative flex flex-col items-center p-1.5 bg-white border-2 rounded-xl transition-all duration-200 shrink-0 group ${
                        isSelected
                          ? 'border-black ring-2 ring-black/10 shadow-sm scale-105'
                          : 'border-atelier-lightgray/60 hover:border-atelier-dark/60'
                      }`}
                    >
                      {/* Image preview box matching Flipkart / modern e-commerce variant swatch */}
                      <div className="h-16 w-14 sm:h-18 sm:w-16 rounded-lg overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center relative">
                        {colorThumbUrl ? (
                          <img
                            src={colorThumbUrl}
                            alt={colorName}
                            className="h-full w-full object-contain p-1"
                            onError={e => {
                              // If image fails to load, replace with color swatch div
                              e.target.style.display = 'none'
                              if (e.target.nextSibling) e.target.nextSibling.style.display = 'block'
                            }}
                          />
                        ) : null}
                        {/* Fallback color swatch div if no image or image load fails */}
                        <div
                          className="h-full w-full"
                          style={{
                            backgroundColor: colorHex,
                            display: colorThumbUrl ? 'none' : 'block',
                          }}
                        />
                        {/* Selected indicator overlay */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-black/15 rounded-lg flex items-center justify-center">
                            <span className="h-5 w-5 rounded-full bg-black text-white flex items-center justify-center text-[10px] shadow-sm font-bold">
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

          {/* ── ALL DETAILS — Flipkart-style tabbed section ───────────────────── */}
          {(selectedProduct.features?.length > 0 || selectedProduct.specifications?.length > 0 || selectedProduct.description || selectedProduct.manufacturerInfo?.name || selectedProduct.manufacturerInfo?.address) && (
            <div className="border border-atelier-lightgray/30 rounded-lg overflow-hidden">
              {/* Collapsible header */}
              <button
                onClick={() => setDetailsOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-semibold text-atelier-dark">All details</span>
                {detailsOpen ? <ChevronUp size={16} className="text-atelier-gray" /> : <ChevronDown size={16} className="text-atelier-gray" />}
              </button>

              {detailsOpen && (
                <div className="bg-white">
                  {/* Tab bar */}
                  <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-hide">
                    {[
                      selectedProduct.features?.length > 0 && { key: 'features', label: 'Features' },
                      selectedProduct.specifications?.length > 0 && { key: 'specs', label: 'Specifications' },
                      selectedProduct.description && { key: 'description', label: 'Description' },
                      (selectedProduct.manufacturerInfo?.name || selectedProduct.manufacturerInfo?.address) && { key: 'manufacturer', label: 'Manufacturer info' },
                    ].filter(Boolean).map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setAllDetailsTab(tab.key)}
                        className={`flex-shrink-0 px-4 py-3 text-xs font-medium tracking-wide transition-all border-b-2 ${
                          allDetailsTab === tab.key
                            ? 'border-atelier-dark bg-atelier-dark text-white'
                            : 'border-transparent text-atelier-gray hover:text-atelier-dark hover:border-gray-300'
                        }`}
                      >{tab.label}</button>
                    ))}
                  </div>

                  {/* ── FEATURES TAB ──────────────────────────────────── */}
                  {allDetailsTab === 'features' && selectedProduct.features?.length > 0 && (
                    <div className="overflow-x-auto py-4 px-3">
                      <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
                        {selectedProduct.features.map((feat, i) => {
                          const isExpanded = !!expandedFeatures[i]
                          const isLong = feat.description && feat.description.length > 80

                          return (
                            <div
                              key={i}
                              className={`flex items-start gap-3 bg-gray-50 rounded-xl p-3 flex-shrink-0 border border-gray-100 transition-all duration-200 ${
                                isExpanded ? 'w-80 shadow-sm bg-white' : 'w-56'
                              }`}
                            >
                              {feat.imageUrl && (
                                <div className="w-14 h-14 rounded-full bg-[#b8c8d8] flex items-center justify-center flex-shrink-0 overflow-hidden">
                                  <img src={feat.imageUrl} alt={feat.title} className="w-full h-full object-cover" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-atelier-dark mb-1 leading-tight">{feat.title}</p>
                                <p className="text-xs text-atelier-gray leading-relaxed">
                                  {isExpanded ? (
                                    <>
                                      {feat.description}{' '}
                                      <button
                                        onClick={() => setExpandedFeatures(prev => ({ ...prev, [i]: false }))}
                                        className="text-blue-600 hover:underline font-medium ml-1 inline-block"
                                      >
                                        less
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      {isLong ? `${feat.description.slice(0, 80)}...` : feat.description}
                                      {isLong && (
                                        <button
                                          onClick={() => setExpandedFeatures(prev => ({ ...prev, [i]: true }))}
                                          className="text-blue-600 hover:underline font-medium ml-1 inline-block"
                                        >
                                          more
                                        </button>
                                      )}
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── SPECIFICATIONS TAB ────────────────────────────── */}
                  {allDetailsTab === 'specs' && selectedProduct.specifications?.length > 0 && (
                    <div className="px-4 py-4">
                      <p className="text-xs font-bold text-atelier-dark mb-3">General</p>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-0">
                        {selectedProduct.specifications.map((spec, i) => (
                          <div key={i} className="py-2.5 border-b border-gray-100">
                            <p className="text-[10px] text-atelier-gray uppercase tracking-wide mb-0.5">{spec.key}</p>
                            <p className="text-xs font-medium text-atelier-dark">{spec.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── DESCRIPTION TAB ───────────────────────────────── */}
                  {allDetailsTab === 'description' && (
                    <div className="px-4 py-4">
                      <p className="text-xs text-atelier-gray leading-relaxed">{selectedProduct.description}</p>
                    </div>
                  )}

                  {/* ── MANUFACTURER INFO TAB ─────────────────────────── */}
                  {allDetailsTab === 'manufacturer' && selectedProduct.manufacturerInfo && (
                    <div className="px-4 py-4 space-y-3">
                      {selectedProduct.manufacturerInfo.name && (
                        <div>
                          <p className="text-[10px] text-atelier-gray uppercase tracking-wide mb-0.5">Store / Brand</p>
                          <p className="text-xs font-medium text-atelier-dark">{selectedProduct.manufacturerInfo.name}</p>
                        </div>
                      )}
                      {selectedProduct.manufacturerInfo.address && (
                        <div>
                          <p className="text-[10px] text-atelier-gray uppercase tracking-wide mb-0.5">Address</p>
                          <p className="text-xs text-atelier-dark leading-relaxed">{selectedProduct.manufacturerInfo.address}</p>
                        </div>
                      )}
                      {selectedProduct.manufacturerInfo.location && (
                        <div>
                          <p className="text-[10px] text-atelier-gray uppercase tracking-wide mb-0.5">Location</p>
                          <p className="text-xs font-medium text-atelier-dark">📍 {selectedProduct.manufacturerInfo.location}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Shipping & Returns accordion (kept) */}
          <details className="group border-b border-atelier-lightgray/40 py-4 cursor-pointer focus:outline-none">
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



      {/* Reviews Section — Strict single instance */}
      <ReviewSection
        key={`reviews-${id}`}
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
