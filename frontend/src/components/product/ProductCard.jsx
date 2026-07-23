import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ProductCard = ({ product }) => {
  const navigate = useNavigate()
  const [selectedColor, setSelectedColor] = useState(product.colors[0])
  const [hovered, setHovered] = useState(false)

  const handleCardClick = () => {
    navigate(`/product/${product.id}`)
  }

  // Handle color change and stop propagation so clicking swatches doesn't trigger card navigation
  const handleColorSelect = (e, color) => {
    e.stopPropagation()
    setSelectedColor(color)
  }

  return (
    <div 
      className="group flex flex-col justify-between cursor-pointer text-left"
      onClick={handleCardClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Product Image Wrapper */}
      <div className="relative aspect-square w-full bg-atelier-cream overflow-hidden mb-4 border border-atelier-lightgray/30 transition-all duration-300 group-hover:shadow-sm">
        {/* Badges (New, Sale) */}
        {product.tag && (
          <span className="absolute top-3 left-3 bg-atelier-beige border border-atelier-dark/40 font-mono text-[8px] tracking-widest uppercase py-1 px-2.5 z-10 select-none">
            {product.tag}
          </span>
        )}

        {/* Product image */}
        <img 
          src={product.images[0]} 
          alt={product.name}
          className={`h-full w-full object-cover transition-transform duration-700 ease-out ${hovered ? 'scale-105' : 'scale-100'}`}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        
        {/* Simple hover overlay if we want to show a subtle line or button */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Metadata */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[9px] font-mono tracking-widest uppercase text-atelier-gray">
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
        <div className="flex items-center space-x-1.5 pt-2">
          {product.colors.map((color) => (
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
      </div>
    </div>
  )
}

export default ProductCard
