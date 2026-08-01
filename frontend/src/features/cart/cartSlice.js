import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  items: JSON.parse(localStorage.getItem('cartItems')) || [],
  isCartOpen: false,
  couponCode: '',
  discountType: '',       // 'percentage' | 'flat'
  discountValue: 0,       // the raw coupon value (e.g. 20 for 20% or $20)
  discountAmount: 0,      // computed dollar discount returned by API
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    toggleCart: (state) => {
      state.isCartOpen = !state.isCartOpen
    },
    setCartOpen: (state, action) => {
      state.isCartOpen = action.payload
    },
    addToCart: (state, action) => {
      const { product, quantity, color, size } = action.payload
      
      const existingIndex = state.items.findIndex(
        item => item.product.id === product.id && 
                item.color.name === color.name && 
                item.size === size
      )

      if (existingIndex > -1) {
        state.items[existingIndex].quantity += quantity
      } else {
        state.items.push({ product, quantity, color, size })
      }
      
      state.isCartOpen = true
      localStorage.setItem('cartItems', JSON.stringify(state.items))
    },
    removeFromCart: (state, action) => {
      const { id, colorName, size } = action.payload
      state.items = state.items.filter(
        item => !(item.product.id === id && 
                  item.color.name === colorName && 
                  item.size === size)
      )
      localStorage.setItem('cartItems', JSON.stringify(state.items))
    },
    updateQuantity: (state, action) => {
      const { id, colorName, size, quantity } = action.payload
      const item = state.items.find(
        item => item.product.id === id && 
                item.color.name === colorName && 
                item.size === size
      )
      if (item) {
        item.quantity = Math.max(1, quantity)
      }
      localStorage.setItem('cartItems', JSON.stringify(state.items))
    },
    applyCoupon: (state, action) => {
      // payload: { code, discountType, discountValue, discountAmount }
      state.couponCode = (action.payload.code || '').toUpperCase()
      state.discountType = action.payload.discountType || ''
      state.discountValue = action.payload.discountValue || 0
      state.discountAmount = action.payload.discountAmount || 0
    },
    clearCart: (state) => {
      state.items = []
      state.couponCode = ''
      state.discountType = ''
      state.discountValue = 0
      state.discountAmount = 0
      state.isCartOpen = false
      localStorage.removeItem('cartItems')
    }
  }
})

export const { toggleCart, setCartOpen, addToCart, removeFromCart, updateQuantity, applyCoupon, clearCart } = cartSlice.actions
export default cartSlice.reducer
