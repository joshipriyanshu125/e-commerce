import { configureStore } from '@reduxjs/toolkit'
import uiReducer from '../features/ui/uiSlice'
import authReducer from '../features/auth/authSlice'
// Import other reducers as you build them

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    auth: authReducer,
  },
})
