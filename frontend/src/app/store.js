import { configureStore } from '@reduxjs/toolkit'
import uiReducer from '../features/ui/uiSlice'
import authReducer from '../features/auth/authSlice'
import productsReducer from '../features/products/productSlice'
import cartReducer from '../features/cart/cartSlice'
import ordersReducer from '../features/orders/orderSlice'

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    auth: authReducer,
    products: productsReducer,
    cart: cartReducer,
    orders: ordersReducer,
  },
})
