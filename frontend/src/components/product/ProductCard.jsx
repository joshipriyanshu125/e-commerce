import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Heart } from 'lucide-react'
import { deleteWishlistItem, fetchWishlist, optimisticAdd, optimisticRemove, saveWishlistItem } from '../../features/wishlist/wishlistSlice'
import { toast } from '../common/ToastHost'
import { optimizeImage } from '../../utils/cloudinary'
import { useCurrency } from '../../context/CurrencyContext'

const colorToHex = (name) => {
  const map = {
    black: '#1C1C1C', white: '#F5F5F5', red: '#DC2626', blue: '#2563EB',
    green: '#16A34A', yellow: '#EAB308', orange: '#EA580C', purple: '#9333EA',
    pink: '#EC4899', grey: '#6B7280', gray: '#6B7280', brown: '#92400E',
    navy: '#1E3A5F', beige: '#F5F0E8', cream: '#F0ECE3', camel: '#C29B70',
    cognac: '#825633', sand: '#D7C7B7', charcoal: '#374151', silver: '#C0C0C0',
    gold: '#D4AF37', 'off-white': '#EAE6DD', offwhite: '#EAE6DD',
  }
  return map[name?.toLowerCase()?.trim()] || '#888888'
}

const ProductCard = ({ product }) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { formatPrice } = useCurrency()
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated)
  const wishlisted = useSelector(state => state.wishlist.items.some(item => (item.product._id || item.product.id) === (product._id || product.id)))

  // Normalize colors: accept both [{name, hex}] and plain strings
  const normalizedColors = (product.colors || []).map(c =>
    typeof c === 'string' ? { name: c, hex: colorToHex(c) } : c
  )

  const [selectedColor, setSelectedColor] = useState(normalizedColors[0] || { name: 'Default', hex: '#888888' })
  const [hovered, setHovered] = useState(false)

  const handleCardClick = () => {
    const id = product.id || product._id
    navigate(`/product/${id}`)
  }

  // Handle color change and stop propagation so clicking swatches doesn't trigger card navigation
  const handleColorSelect = (e, color) => {
    e.stopPropagation()
    setSelectedColor(color)
  }

  const handleWishlistClick = (e) => {
    e.stopPropagation()
    if (!isAuthenticated) { toast('Please sign in to save products.', 'error'); return navigate('/login?redirect=/wishlist') }
    const id = product._id || product.id
    if (wishlisted) {
      dispatch(optimisticRemove(id))
      dispatch(deleteWishlistItem(id)).unwrap().catch(() => dispatch(fetchWishlist()))
    } else {
      dispatch(optimisticAdd(product))
      dispatch(saveWishlistItem({ productId: id })).unwrap().catch(() => dispatch(fetchWishlist()))
    }
  }

  const imageUrl = (product.images && product.images[0])
    ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.url)
    : 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80'

  const optimizedSrc = optimizeImage(imageUrl, { width: 600, height: 800, crop: 'fill' })
  const fallbackSrc = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80'

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group cursor-pointer flex flex-col space-y-3"
    >
      {/* Image Container with 3:4 Aspect Ratio */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-atelier-beige">
        <button
          onClick={handleWishlistClick}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm text-atelier-dark hover:bg-white transition-colors duration-200"
        >
          <Heart size={16} strokeWidth={1.5} className={wishlisted ? 'fill-red-700 text-red-700' : 'text-atelier-dark'} />
        </button>

        <img
          src={optimizedSrc}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className={`h-full w-full object-cover transition-transform duration-700 ease-out ${hovered ? 'scale-105' : 'scale-100'}`}
          onError={(e) => {
            e.target.onerror = null
            e.target.src = fallbackSrc
          }}
        />
        
        {/* Simple hover overlay */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Metadata */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs font-mono tracking-widest uppercase text-atelier-gray">
          <span>{product.category}</span>
          <span className="text-atelier-dark font-medium">{formatPrice(product.price)}</span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <h3 className="font-serif text-base text-atelier-dark font-medium leading-tight group-hover:text-atelier-accent transition-colors">
            {product.name}
          </h3>
          {product.originalPrice && (
            <span className="text-xs text-atelier-gray line-through font-mono">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Color Swatch Selectors */}
        {normalizedColors.length > 0 && (
          <div className="flex items-center space-x-1.5 pt-2">
            {normalizedColors.map((color) => (
              <button
                key={color.name}
                onClick={(e) => handleColorSelect(e, color)}
                className={`h-3 w-3 rounded-full border transition-all duration-200 ${
                  selectedColor.name === color.name 
                    ? 'border-atelier-dark scale-110 ring-1 ring-atelier-dark/20' 
                    : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
                aria-label={`Select ${color.name}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductCard
