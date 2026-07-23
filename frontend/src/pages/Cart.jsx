import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Minus, Trash2, Tag, ArrowRight } from 'lucide-react'
import { removeFromCart, updateQuantity, applyCoupon, setCartOpen } from '../features/cart/cartSlice'

const Cart = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { items, discountPercent } = useSelector(state => state.cart)
  const [promoInput, setPromoInput] = useState('')
  const [promoError, setPromoError] = useState('')
  const [promoSuccess, setPromoSuccess] = useState('')

  const subtotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0)
  const discountAmount = Math.round(subtotal * (discountPercent / 100))
  const shipping = subtotal >= 150 ? 0 : 15
  const finalTotal = subtotal - discountAmount + shipping

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
      setPromoSuccess('Promo code applied!')
      setPromoError('')
      setPromoInput('')
    } else {
      setPromoError('Invalid promotional code.')
      setPromoSuccess('')
    }
  }

  const handleCheckout = () => {
    dispatch(setCartOpen(false))
    navigate('/checkout')
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center animate-fade-in font-sans">
        <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-atelier-gray block mb-2">
          Your Bag
        </span>
        <h1 className="font-serif text-3xl text-atelier-dark font-semibold mb-4">Nothing here yet</h1>
        <p className="font-serif text-lg text-atelier-gray italic mb-8">Your shopping bag is empty.</p>
        <Link to="/" className="btn-atelier-dark inline-flex">
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in font-sans">
      <div className="border-b border-atelier-lightgray/50 pb-6 mb-10">
        <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-atelier-gray block mb-1">
          Shopping Bag
        </span>
        <h1 className="font-serif text-3xl text-atelier-dark font-semibold">
          {items.reduce((acc, item) => acc + item.quantity, 0)} item{items.length !== 1 ? 's' : ''}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start pb-20">
        {/* Cart items */}
        <div className="lg:col-span-7 divide-y divide-atelier-lightgray/40">
          {items.map((item) => (
            <div key={`${item.product.id}-${item.color.name}-${item.size}`} className="py-8 flex items-start space-x-5">
              <Link to={`/product/${item.product.id}`} className="h-28 w-28 bg-atelier-cream border border-atelier-lightgray/30 flex-shrink-0 overflow-hidden">
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="h-full w-full object-cover"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              </Link>

              <div className="flex-grow space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="font-mono text-[8px] tracking-widest text-atelier-gray uppercase block mb-1">
                      {item.product.category}
                    </span>
                    <Link to={`/product/${item.product.id}`} className="font-serif text-lg text-atelier-dark font-medium hover:text-atelier-accent transition-colors">
                      {item.product.name}
                    </Link>
                    <div className="flex items-center space-x-3 mt-2 font-mono text-[9px] text-atelier-gray uppercase">
                      <div className="flex items-center space-x-1">
                        <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ backgroundColor: item.color.hex }} />
                        <span>{item.color.name}</span>
                      </div>
                      {item.size && item.size !== 'One Size' && <span>Size: {item.size}</span>}
                    </div>
                  </div>
                  <span className="font-mono text-sm text-atelier-dark font-medium">
                    ${item.product.price * item.quantity}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center border border-atelier-lightgray bg-atelier-cream/80">
                    <button
                      onClick={() => handleQuantityChange(item.product.id, item.color.name, item.size, item.quantity, -1)}
                      className="p-2 text-atelier-gray hover:text-atelier-dark"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-3 text-sm font-mono text-atelier-dark font-medium min-w-[24px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item.product.id, item.color.name, item.size, item.quantity, 1)}
                      className="p-2 text-atelier-gray hover:text-atelier-dark"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => handleRemove(item.product.id, item.color.name, item.size)}
                    className="text-atelier-gray hover:text-red-700 transition-colors flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider"
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary sidebar */}
        <div className="lg:col-span-5 lg:sticky lg:top-28">
          <div className="bg-atelier-cream border border-atelier-lightgray p-6 space-y-6">
            <h2 className="font-serif text-lg text-atelier-dark font-medium border-b border-atelier-lightgray/60 pb-3">
              Order Summary
            </h2>

            <form onSubmit={handlePromoSubmit} className="flex space-x-2">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="PROMO CODE"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  className="w-full bg-atelier-beige border border-atelier-lightgray text-[10px] font-mono tracking-wider py-2.5 pl-3 pr-8 focus:outline-none focus:border-atelier-dark uppercase"
                />
                <Tag size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-atelier-gray" />
              </div>
              <button type="submit" className="px-4 py-2 border border-atelier-dark text-[10px] tracking-wider uppercase font-mono bg-atelier-dark text-white">
                Apply
              </button>
            </form>

            {promoError && <p className="text-[9px] font-mono uppercase text-red-600 tracking-wider">{promoError}</p>}
            {promoSuccess && <p className="text-[9px] font-mono uppercase text-atelier-accent tracking-wider">{promoSuccess}</p>}

            <div className="space-y-2 text-xs font-mono tracking-wider text-atelier-gray uppercase">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-atelier-dark font-medium">${subtotal}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-atelier-accent">
                  <span>Discount ({discountPercent}%)</span>
                  <span>-${discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-atelier-dark font-medium">{shipping === 0 ? 'FREE' : `$${shipping}`}</span>
              </div>
              <div className="flex justify-between border-t border-atelier-lightgray/60 pt-4 text-sm text-atelier-dark">
                <span className="font-serif capitalize font-medium text-base">Total</span>
                <span className="font-medium">${finalTotal}</span>
              </div>
            </div>

            <button onClick={handleCheckout} className="w-full btn-atelier-dark py-4 flex items-center justify-center gap-2">
              Proceed to Checkout
              <ArrowRight size={12} />
            </button>

            <Link to="/" className="block text-center font-mono text-[9px] tracking-widest uppercase text-atelier-gray hover:text-atelier-dark transition-colors">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
