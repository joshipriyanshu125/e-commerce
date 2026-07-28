import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ProductCard = ({ product }) => {
  const navigate = useNavigate()

  // Normalize colors: accept both [{name, hex}] and plain strings
  const normalizedColors = (product.colors || []).map(c =>
    typeof c === 'string' ? { name: c, hex: '#888888' } : c
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

  // Normalize image src: DB products have {url} objects, mock products have plain strings
  const rawImage = product.images?.[0]
  const imageSrc = rawImage
    ? (typeof rawImage === 'string' ? rawImage : rawImage.url)
    : 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80'

  const fallbackSrc = 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80'

  return (
    <div 
      className="group flex flex-col justify-between cursor-pointer text-left transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-xl"
      onClick={handleCardClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Product Image Wrapper */}
      <div className="relative aspect-square w-full bg-atelier-cream overflow-hidden mb-4 border border-atelier-lightgray/30 transition-all duration-300 group-hover:shadow-xl">
        {/* Badges (New, Sale) */}
        {product.tag && (
          <span className="absolute top-3 left-3 bg-atelier-beige border border-atelier-dark/40 font-mono text-sm tracking-widest uppercase py-1 px-2.5 z-10 select-none">
            {product.tag}
          </span>
        )}

        {/* Product image */}
        <img 
          src={imageSrc}
          alt={product.name}
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
          <span className="text-atelier-dark font-medium">${product.price}</span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <h3 className="font-serif text-base text-atelier-dark font-medium leading-tight group-hover:text-atelier-accent transition-colors">
            {product.name}
          </h3>
          {product.originalPrice && (
            <span className="text-xs text-atelier-gray line-through font-mono">
              ${product.originalPrice}
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
