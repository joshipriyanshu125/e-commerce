import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../services/axiosInstance'

const call = async (request, rejectWithValue) => { try { return (await request()).data.wishlist.items || [] } catch (e) { return rejectWithValue(e.response?.data?.message || 'Unable to update wishlist') } }
export const fetchWishlist = createAsyncThunk('wishlist/fetch', (_, { rejectWithValue }) => call(() => api.get('wishlist'), rejectWithValue))
export const saveWishlistItem = createAsyncThunk('wishlist/save', ({ productId, notifyOnRestock = true }, { rejectWithValue }) => call(() => api.post('wishlist/items', { productId, notifyOnRestock }), rejectWithValue))
export const deleteWishlistItem = createAsyncThunk('wishlist/delete', (id, { rejectWithValue }) => call(() => api.delete(`wishlist/items/${id}`), rejectWithValue))
export const deleteWishlistItems = createAsyncThunk('wishlist/deleteMany', (productIds, { rejectWithValue }) => call(() => api.delete('wishlist/items', { data: { productIds } }), rejectWithValue))

const slice = createSlice({ name: 'wishlist', initialState: { items: [], loading: false, error: null }, reducers: {
  optimisticAdd: (s, a) => { if (!s.items.some(i => (i.product._id || i.product.id) === (a.payload._id || a.payload.id))) s.items.unshift({ product: a.payload, priceAtAdd: a.payload.price, priceChanged: false, inStock: a.payload.countInStock > 0, notifyOnRestock: true }) },
  optimisticRemove: (s, a) => { s.items = s.items.filter(i => (i.product._id || i.product.id) !== a.payload) }, clearWishlist: s => { s.items = [] }
}, extraReducers: b => b.addCase(fetchWishlist.pending, s => { s.loading = true }).addMatcher(a => a.type.startsWith('wishlist/') && a.type.endsWith('/fulfilled'), (s, a) => { s.loading = false; s.items = a.payload; s.error = null }).addMatcher(a => a.type.startsWith('wishlist/') && a.type.endsWith('/rejected'), (s, a) => { s.loading = false; s.error = a.payload }) })
export const { optimisticAdd, optimisticRemove, clearWishlist } = slice.actions
export default slice.reducer
