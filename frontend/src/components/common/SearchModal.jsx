import React, { useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { X, Search } from 'lucide-react'
import { setSearchQuery } from '../../features/products/productSlice'

const SearchModal = ({ onClose }) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const inputRef = useRef(null)
  
  const { searchQuery, filteredProducts } = useSelector(state => state.products)

  useEffect(() => {
    // Focus search input on mount
    if (inputRef.current) {
      inputRef.current.focus()
    }
    // Prevent background scrolling
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const handleSearchChange = (e) => {
    dispatch(setSearchQuery(e.target.value))
  }

  const handleClearSearch = () => {
    dispatch(setSearchQuery(''))
  }

  const handleProductClick = (productId) => {
    onClose()
    navigate(`/product/${productId}`)
  }

  const handleSuggestedClick = (term) => {
    dispatch(setSearchQuery(term))
  }

  return (
    <div className="fixed inset-0 z-50 bg-atelier-beige/98 flex flex-col px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto animate-fade-in">
      {/* Header section with Close */}
      <div className="max-w-4xl mx-auto w-full flex justify-end mb-12">
        <button 
          onClick={() => {
            handleClearSearch()
            onClose()
          }}
          className="p-2 text-atelier-dark hover:opacity-70 transition-opacity"
          aria-label="Close search"
        >
          <X size={24} strokeWidth={1.5} />
        </button>
      </div>

      {/* Main Search Area */}
      <div className="max-w-4xl mx-auto w-full flex-grow flex flex-col">
        {/* Input field */}
        <div className="relative border-b border-atelier-dark pb-4 flex items-center mb-10">
          <Search size={22} className="text-atelier-gray mr-4" strokeWidth={1.5} />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by product name, category, brand..."
            className="w-full bg-transparent text-xl sm:text-2xl font-serif text-atelier-dark focus:outline-none placeholder-atelier-gray/40"
          />
          {searchQuery && (
            <button 
              onClick={handleClearSearch}
              className="text-xs font-mono tracking-widest text-atelier-gray hover:text-atelier-dark uppercase"
            >
              Clear
            </button>
          )}
        </div>

        {/* Dynamic results layout */}
        {searchQuery.trim() === '' ? (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h4 className="font-mono text-xs tracking-[0.2em] uppercase text-atelier-gray mb-4">Suggested Categories</h4>
              <div className="flex flex-wrap gap-3">
                {['Fashion', 'Outerwear', 'Accessories', 'Footwear', 'Bags', 'Tops'].map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSuggestedClick(term)}
                    className="px-4 py-2 border border-atelier-lightgray hover:border-atelier-dark text-xs text-atelier-dark font-mono uppercase tracking-wider transition-colors duration-200"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-mono text-xs tracking-[0.2em] uppercase text-atelier-gray mb-4">Recent Searches</h4>
              <div className="flex flex-col space-y-2 font-serif text-lg text-atelier-dark">
                <button onClick={() => handleSuggestedClick('Wool Coat')} className="text-left hover:text-atelier-accent transition-colors">Atelier Wool Coat</button>
                <button onClick={() => handleSuggestedClick('Watch')} className="text-left hover:text-atelier-accent transition-colors">Noir Automatic Watch</button>
                <button onClick={() => handleSuggestedClick('Headphones')} className="text-left hover:text-atelier-accent transition-colors">Acoustic Over-Ear Headphones</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h4 className="font-mono text-[9px] tracking-[0.2em] uppercase text-atelier-gray">
              Results ({filteredProducts.length})
            </h4>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-12">
                {filteredProducts.map((product) => (
                  <div 
                    key={product.id}
                    onClick={() => handleProductClick(product.id)}
                    className="flex items-center space-x-4 p-4 border border-atelier-lightgray/40 hover:border-atelier-dark bg-atelier-cream/40 hover:bg-atelier-cream cursor-pointer transition-all duration-300"
                  >
                    {/* Image */}
                    <div className="h-16 w-16 bg-atelier-lightgray flex-shrink-0 overflow-hidden rounded-md">
                      <img 
                        src={product.images[0] || 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80'} 
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80'
                        }}
                      />
                    </div>
                    {/* Metadata */}
                    <div className="flex-grow">
                      <span className="font-mono text-[10px] tracking-widest text-atelier-gray uppercase block mb-0.5">
                        {product.category}
                      </span>
                      <h3 className="font-serif text-sm text-atelier-dark font-medium leading-tight">
                        {product.name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-atelier-dark font-light">${product.price}</span>
                        {product.originalPrice && (
                          <span className="text-xs text-atelier-gray line-through font-light">${product.originalPrice}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="font-serif text-lg text-atelier-gray italic">No results found for "{searchQuery}".</p>
                <p className="text-xs text-atelier-gray/80 mt-2 font-mono uppercase tracking-wider">Try searching with other keywords.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchModal
