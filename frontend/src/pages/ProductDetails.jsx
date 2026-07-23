import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { selectProductById, addMockReview } from '../features/products/productSlice'
import { addToCart } from '../features/cart/cartSlice'
import { Star, ShieldCheck, Truck, RefreshCw, Plus, Minus } from 'lucide-react'

const ProductDetails = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  
  const selectedProduct = useSelector(state => state.products.selectedProduct)
  
  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  
  // Review form states
  const [reviewName, setReviewName] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [isAddingReview, setIsAddingReview] = useState(false)
  const [reviewAddedMsg, setReviewAddedMsg] = useState('')
  
  const [isAddingToBag, setIsAddingToBag] = useState(false)

  // Fetch product on mount or id change
  useEffect(() => {
    dispatch(selectProductById(id))
    // Reset selectors
    setSelectedSize('')
    setQuantity(1)
    setActiveImageIdx(0)
  }, [id, dispatch])

  // Synchronize color selection once product is loaded
  useEffect(() => {
    if (selectedProduct) {
      setSelectedColor(selectedProduct.colors[0])
      if (selectedProduct.sizes && selectedProduct.sizes.length > 0) {
        setSelectedSize(selectedProduct.sizes[0])
      }
    }
  }, [selectedProduct])

  if (!selectedProduct) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="font-serif text-xl text-atelier-gray italic">Loading product details...</p>
        <Link to="/" className="btn-atelier-outline mt-6 inline-block">Back to Shop</Link>
      </div>
    )
  }

  const handleQuantityChange = (val) => {
    setQuantity(prev => Math.max(1, prev + val))
  }

  const handleAddToBag = () => {
    if (!selectedColor) return
    if (selectedProduct.sizes && selectedProduct.sizes.length > 0 && !selectedSize) {
      alert('Please select a size.')
      return
    }

    setIsAddingToBag(true)
    
    // Simulate slight network lag
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

  const handleReviewSubmit = (e) => {
    e.preventDefault()
    if (reviewName.trim() === '' || reviewComment.trim() === '') return

    dispatch(addMockReview({
      productId: selectedProduct.id,
      review: {
        name: reviewName,
        rating: Number(reviewRating),
        comment: reviewComment
      }
    }))

    setReviewAddedMsg('Review posted successfully!')
    setReviewName('')
    setReviewComment('')
    setReviewRating(5)
    setIsAddingReview(false)
    
    setTimeout(() => setReviewAddedMsg(''), 4000)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in font-sans">
      
      {/* Breadcrumbs */}
      <nav className="text-[10px] font-mono tracking-widest uppercase text-atelier-gray mb-10 flex flex-wrap items-center gap-1.5">
        <Link to="/" className="hover:text-atelier-dark">Home</Link>
        <span>/</span>
        <Link to={`/?type=${selectedProduct.type}`} className="hover:text-atelier-dark capitalize">{selectedProduct.type}</Link>
        <span>/</span>
        <span className="text-atelier-dark">{selectedProduct.name}</span>
      </nav>

      {/* Main product column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start pb-20">
        
        {/* Left Column: Image Stack / Carousel */}
        <div className="lg:col-span-7 space-y-4 lg:sticky lg:top-28 lg:self-start">
          <div className="aspect-square bg-atelier-cream border border-atelier-lightgray/30 overflow-hidden relative">
            <img 
              src={selectedProduct.images[activeImageIdx] || selectedProduct.images[0]} 
              alt={selectedProduct.name} 
              className="h-full w-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>

          {/* Mini Thumbnail Strip if multiple images exist */}
          {selectedProduct.images.length > 1 && (
            <div className="flex gap-3">
              {selectedProduct.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`h-16 w-16 bg-atelier-cream border overflow-hidden ${
                    activeImageIdx === idx ? 'border-atelier-dark' : 'border-atelier-lightgray/40 hover:border-atelier-gray'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Information & Details */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Header metadata */}
          <div className="space-y-3">
            <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-atelier-gray block">
              {selectedProduct.category}
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-atelier-dark font-medium leading-tight">
              {selectedProduct.name}
            </h1>
            
            {/* Rating summary */}
            <div className="flex items-center space-x-2">
              <div className="flex text-atelier-accent">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={14} 
                    fill={i < Math.round(selectedProduct.rating) ? "currentColor" : "none"} 
                    strokeWidth={1.5}
                  />
                ))}
              </div>
              <span className="text-xs text-atelier-dark font-mono font-medium">{selectedProduct.rating}</span>
              <span className="text-xs text-atelier-gray">({selectedProduct.reviews.length} reviews)</span>
            </div>

            {/* Price list */}
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

          {/* Color Selector */}
          {selectedColor && (
            <div className="space-y-3">
              <h3 className="font-mono text-[10px] tracking-widest uppercase text-atelier-gray">
                Color: <span className="text-atelier-dark font-medium">{selectedColor.name}</span>
              </h3>
              <div className="flex items-center space-x-2">
                {selectedProduct.colors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color)}
                    className={`h-6 w-6 rounded-full border transition-all duration-200 ${
                      selectedColor.name === color.name 
                        ? 'border-atelier-dark scale-110 ring-2 ring-atelier-dark/10' 
                        : 'border-atelier-lightgray hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size Selector */}
          {selectedProduct.sizes && selectedProduct.sizes[0] !== 'One Size' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-[10px] tracking-widest uppercase text-atelier-gray">
                  Select Size
                </h3>
                <button className="text-[10px] font-mono tracking-widest uppercase text-atelier-gray hover:text-atelier-dark underline">
                  Size Guide
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedProduct.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 border font-mono text-[10px] tracking-wider uppercase transition-all duration-200 ${
                      selectedSize === size 
                        ? 'border-atelier-dark bg-atelier-dark text-white font-semibold' 
                        : 'border-atelier-lightgray bg-transparent text-atelier-dark hover:border-atelier-dark'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector & Action Button */}
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

          {/* Quality highlights */}
          <div className="grid grid-cols-3 gap-4 border-y border-atelier-lightgray/40 py-6 text-center text-atelier-gray text-[10px] font-mono tracking-widest uppercase">
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

          {/* Details & FAQ Accordeon */}
          <div className="divide-y divide-atelier-lightgray/40 border-b border-atelier-lightgray/40">
            <details className="group py-4 cursor-pointer focus:outline-none">
              <summary className="flex items-center justify-between text-xs font-mono tracking-wider uppercase text-atelier-dark">
                <span>Details & Specifications</span>
                <span className="text-atelier-gray group-open:rotate-180 transition-transform">&darr;</span>
              </summary>
              <ul className="list-disc list-inside mt-3 text-xs text-atelier-gray leading-relaxed font-light space-y-1.5 pl-2">
                {selectedProduct.details.map((spec, i) => (
                  <li key={i}>{spec}</li>
                ))}
              </ul>
            </details>

            <details className="group py-4 cursor-pointer focus:outline-none">
              <summary className="flex items-center justify-between text-xs font-mono tracking-wider uppercase text-atelier-dark">
                <span>Shipping & Returns</span>
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

      {/* Reviews Section */}
      <section className="border-t border-atelier-lightgray/60 pt-16 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Review scores statistics */}
          <div className="lg:col-span-4 space-y-6">
            <h2 className="font-serif text-2xl text-atelier-dark font-medium">Customer reviews</h2>
            
            <div className="flex items-center space-x-4">
              <span className="text-5xl font-mono font-semibold text-atelier-dark">
                {selectedProduct.rating}
              </span>
              <div>
                <div className="flex text-atelier-accent">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={16} 
                      fill={i < Math.round(selectedProduct.rating) ? "currentColor" : "none"} 
                      strokeWidth={1.5}
                    />
                  ))}
                </div>
                <span className="text-xs text-atelier-gray tracking-wider font-mono">
                  BASED ON {selectedProduct.reviews.length} REVIEWS
                </span>
              </div>
            </div>

            {/* Show feedback confirmation */}
            {reviewAddedMsg && (
              <p className="bg-atelier-cream border border-atelier-accent/40 text-atelier-accent px-4 py-3 text-xs font-mono uppercase tracking-wider">
                {reviewAddedMsg}
              </p>
            )}

            {/* Write a review accordion toggle */}
            {!isAddingReview ? (
              <button
                onClick={() => setIsAddingReview(true)}
                className="w-full btn-atelier-outline"
              >
                Write a review
              </button>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4 border border-atelier-lightgray p-6 bg-atelier-cream/40">
                <h4 className="font-mono text-[10px] tracking-widest uppercase text-atelier-dark font-semibold border-b border-atelier-lightgray pb-2">
                  New Review
                </h4>
                
                <div className="space-y-1">
                  <label className="block text-[9px] font-mono tracking-wider text-atelier-gray uppercase">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    className="w-full bg-atelier-beige border border-atelier-lightgray py-2 px-3 text-xs focus:outline-none focus:border-atelier-dark"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-mono tracking-wider text-atelier-gray uppercase">
                    Rating
                  </label>
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(e.target.value)}
                    className="w-full bg-atelier-beige border border-atelier-lightgray py-2 px-3 text-xs focus:outline-none focus:border-atelier-dark font-mono"
                  >
                    <option value="5">5 Stars (Excellent)</option>
                    <option value="4">4 Stars (Good)</option>
                    <option value="3">3 Stars (Average)</option>
                    <option value="2">2 Stars (Poor)</option>
                    <option value="1">1 Star (Very Poor)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-mono tracking-wider text-atelier-gray uppercase">
                    Comments
                  </label>
                  <textarea
                    rows="3"
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full bg-atelier-beige border border-atelier-lightgray py-2 px-3 text-xs focus:outline-none focus:border-atelier-dark"
                  />
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="submit"
                    className="flex-grow py-2.5 bg-atelier-dark text-white font-mono text-[9px] tracking-widest uppercase hover:opacity-90 transition-opacity"
                  >
                    Post Review
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingReview(false)}
                    className="py-2.5 px-4 border border-atelier-lightgray font-mono text-[9px] tracking-widest uppercase hover:border-atelier-dark transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* List of reviews */}
          <div className="lg:col-span-8 divide-y divide-atelier-lightgray/40">
            {selectedProduct.reviews.length > 0 ? (
              selectedProduct.reviews.map((review) => (
                <div key={review.id} className="py-6 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-atelier-dark font-semibold">
                      {review.name}
                    </span>
                    <span className="font-mono text-[10px] text-atelier-gray">
                      {review.date}
                    </span>
                  </div>

                  <div className="flex text-atelier-accent">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={12} 
                        fill={i < review.rating ? "currentColor" : "none"} 
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>

                  <p className="text-xs sm:text-sm text-atelier-gray font-light leading-relaxed max-w-2xl font-sans">
                    {review.comment}
                  </p>
                </div>
              ))
            ) : (
              <div className="py-8">
                <p className="font-serif text-sm text-atelier-gray italic">No reviews yet. Be the first to share your thoughts.</p>
              </div>
            )}
          </div>
        </div>
      </section>

    </div>
  )
}

export default ProductDetails
