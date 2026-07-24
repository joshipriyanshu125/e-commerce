import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { X, Plus, Minus, Trash2, Tag } from 'lucide-react'
import { toggleCart, setCartOpen, removeFromCart, updateQuantity, applyCoupon } from '../../features/cart/cartSlice'

const CartDrawer = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  
  const { items, isCartOpen, couponCode, discountPercent } = useSelector(state => state.cart)
  const [promoInput, setPromoInput] = useState('')
  const [promoError, setPromoError] = useState('')
  const [promoSuccess, setPromoSuccess] = useState('')

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isCartOpen])

  if (!isCartOpen) return null

  const handleClose = () => {
    dispatch(setCartOpen(false))
  }

  const handleQuantityChange = (id, colorName, size, currentQty, delta) => {
    const newQty = currentQty + delta
    if (newQty >= 1) {
      dispatch(updateQuantity({ id, colorName, size, quantity: newQty }))
    }
  }

  const handleRemove = (id, colorName, size) => {
    dispatch(removeFromCart({ id, colorName, size }))
  }

  const handlePromoSubmit = (e) => {
    e.preventDefault()
    if (promoInput.trim() === '') return
    
    dispatch(applyCoupon(promoInput))
    
    const code = promoInput.toUpperCase()
    if (code === 'ATELIER15' || code === 'QUIETLUXURY') {
      setPromoSuccess(`Promo code applied!`)
      setPromoError('')
      setPromoInput('')
    } else {
      setPromoError('Invalid promotional code.')
      setPromoSuccess('')
    }
  }

  const handleCheckoutClick = () => {
    dispatch(setCartOpen(false))
    navigate('/checkout')
  }

  // Calculate prices
  const subtotal = items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0)
  const discountAmount = Math.round(subtotal * (discountPercent / 100))
  const finalTotal = subtotal - discountAmount

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={handleClose}
      />

      {/* Panel container */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        {/* Sliding Panel */}
        <div className="w-screen max-w-md bg-atelier-beige border-l border-atelier-lightgray flex flex-col justify-between shadow-2xl animate-slide-in h-full">
          
          {/* Header */}
          <div className="px-6 py-6 border-b border-atelier-lightgray/60 flex items-center justify-between">
            <h2 className="font-serif text-lg text-atelier-dark font-medium uppercase tracking-wide">
              Shopping Bag
            </h2>
            <button 
              onClick={handleClose}
              className="p-2 text-atelier-dark hover:opacity-75"
              aria-label="Close cart"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-grow overflow-y-auto px-6 py-4 no-scrollbar">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                <p className="font-serif text-lg text-atelier-gray italic">Your bag is empty.</p>
                <button
                  onClick={handleClose}
                  className="btn-atelier-outline"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="divide-y divide-atelier-lightgray/40">
                {items.map((item, index) => (
                  <div key={`${item.product.id}-${item.color.name}-${item.size}`} className="py-6 flex items-start space-x-4">
                    {/* Image */}
                    <div className="h-20 w-20 bg-atelier-lightgray flex-shrink-0 overflow-hidden rounded-md">
                      <img 
                        src={item.product.images[0] || 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80'} 
                        alt={item.product.name} 
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80'
                        }}
                      />
                    </div>

                    {/* Meta & details */}
                    <div className="flex-grow flex flex-col justify-between h-20">
                      <div>
                        <div className="flex items-start justify-between">
                          <span className="font-mono text-[8px] tracking-widest text-atelier-gray uppercase block mb-0.5">
                            {item.product.category}
                          </span>
                          <span className="text-xs text-atelier-dark font-mono font-medium">
                            ${item.product.price * item.quantity}
                          </span>
                        </div>
                        <h3 className="font-serif text-sm text-atelier-dark font-medium leading-tight line-clamp-1">
                          {item.product.name}
                        </h3>
                        <div className="flex items-center space-x-3 mt-1 font-mono text-[9px] text-atelier-gray uppercase">
                          <div className="flex items-center space-x-1">
                            <span 
                              className="h-2 w-2 rounded-full inline-block" 
                              style={{ backgroundColor: item.color.hex }}
                            />
                            <span>{item.color.name}</span>
                          </div>
                          {item.size && item.size !== 'One Size' && (
                            <span>Size: {item.size}</span>
                          )}
                        </div>
                      </div>

                      {/* Quantity selector and Delete */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-atelier-lightgray bg-atelier-cream/80">
                          <button
                            onClick={() => handleQuantityChange(item.product.id, item.color.name, item.size, item.quantity, -1)}
                            className="p-1.5 text-atelier-gray hover:text-atelier-dark"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="px-2 text-xs font-mono text-atelier-dark font-medium select-none min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.product.id, item.color.name, item.size, item.quantity, 1)}
                            className="p-1.5 text-atelier-gray hover:text-atelier-dark"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemove(item.product.id, item.color.name, item.size)}
                          className="text-atelier-gray hover:text-red-700 transition-colors duration-200 p-1"
                          aria-label="Remove item"
                        >
                          <Trash2 size={14} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer calculation */}
          {items.length > 0 && (
            <div className="px-6 py-6 bg-atelier-cream border-t border-atelier-lightgray flex flex-col space-y-6">
              {/* Promo Code Form */}
              <form onSubmit={handlePromoSubmit} className="flex space-x-2">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    placeholder="PROMO CODE (e.g. ATELIER15)"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    className="w-full bg-atelier-beige border border-atelier-lightgray text-[10px] font-mono tracking-wider py-2.5 pl-3 pr-8 focus:outline-none focus:border-atelier-dark uppercase"
                  />
                  <Tag size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-atelier-gray" />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 border border-atelier-dark text-[10px] tracking-wider uppercase font-mono bg-atelier-dark text-white hover:bg-opacity-95"
                >
                  Apply
                </button>
              </form>
              
              {promoError && <p className="text-[9px] font-mono uppercase text-red-600 tracking-wider -mt-4">{promoError}</p>}
              {promoSuccess && <p className="text-[9px] font-mono uppercase text-atelier-accent tracking-wider -mt-4">{promoSuccess}</p>}
              {discountPercent > 0 && (
                <div className="flex items-center justify-between text-[9px] font-mono uppercase text-atelier-accent tracking-wider -mt-2">
                  <span>Discount Active:</span>
                  <span>{discountPercent}% OFF</span>
                </div>
              )}

              {/* Price summary */}
              <div className="space-y-2 text-xs font-mono tracking-wider text-atelier-gray uppercase">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-atelier-dark font-medium">${subtotal}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-atelier-accent">
                    <span>Discount</span>
                    <span>-${discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-atelier-dark font-medium">
                    {subtotal >= 150 ? 'FREE' : '$15'}
                  </span>
                </div>
                <div className="flex justify-between border-t border-atelier-lightgray/60 pt-4 text-sm tracking-widest text-atelier-dark">
                  <span className="font-serif capitalize font-medium text-base">Total</span>
                  <span className="font-medium">
                    ${finalTotal + (subtotal >= 150 ? 0 : 15)}
                  </span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={handleCheckoutClick}
                className="w-full btn-atelier-dark text-center"
              >
                Proceed to Checkout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CartDrawer
