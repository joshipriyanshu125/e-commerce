import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Normalize a DB product to the shape the UI expects
const normalizeDBProduct = (p) => {
  const salePrice = p.discountPrice ? Number(p.discountPrice) : null
  const basePrice = Number(p.price)

  return {
    id: p._id,
    _id: p._id,
    name: p.name,
    description: p.description || '',
    category: p.category || '',
    brand: p.brand || '',
    type: 'fashion', // default so catalogue view works
    price: salePrice || basePrice,
    originalPrice: salePrice ? basePrice : null,
    rating: p.rating || 0,
    numReviews: p.numReviews || 0,
    countInStock: p.countInStock || 0,
    status: p.status,
    tags: p.tags || [],
    // Colors: DB stores plain strings, UI expects [{name, hex}]
    colors: Array.isArray(p.colors) && p.colors.length > 0
      ? p.colors.map(c => typeof c === 'string' ? { name: c, hex: colorToHex(c) } : c)
      : [{ name: 'Default', hex: '#888888' }],
    // Sizes: plain strings from DB
    sizes: Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes : [],
    // Images: DB stores [{public_id, url}], UI expects [url string]
    images: Array.isArray(p.images) && p.images.length > 0
      ? p.images.map(img => (typeof img === 'string' ? img : img.url))
      : [],
    // Details: use tags as details bullets if no details field
    details: p.tags && p.tags.length > 0
      ? p.tags.map(t => String(t))
      : [],
    reviews: Array.isArray(p.reviews) ? p.reviews.map(r => ({
      id: r._id || r.id,
      name: r.name,
      rating: r.rating,
      comment: r.comment,
      date: r.createdAt ? r.createdAt.split('T')[0] : '',
    })) : [],
  }
}

// Map common color names to hex codes
function colorToHex(name) {
  const map = {
    black: '#1C1C1C', white: '#FFFFFF', red: '#DC2626', blue: '#2563EB',
    green: '#16A34A', yellow: '#EAB308', orange: '#EA580C', purple: '#9333EA',
    pink: '#EC4899', grey: '#6B7280', gray: '#6B7280', brown: '#92400E',
    navy: '#1E3A5F', beige: '#F5F0E8', cream: '#F0ECE3', camel: '#C29B70',
    cognac: '#825633', sand: '#D7C7B7', charcoal: '#374151', offwhite: '#EAE6DD',
    'off-white': '#EAE6DD', tortoise: '#87562D', flax: '#D2C3B2', noir: '#1C1C1C',
    silver: '#C0C0C0', gold: '#D4AF37',
  }
  return map[name.toLowerCase().replace(/\s+/g, '-')] || '#888888'
}

// Async thunk to load all products from the backend
export const fetchAPIProducts = createAsyncThunk(
  'products/fetchAPIProducts',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/products?limit=100&page=1`)
      return res.data.products || []
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const createProductReview = createAsyncThunk(
  'products/createProductReview',
  async ({ productId, review }, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        withCredentials: true
      }
      await axios.post(`${API_URL}/products/${productId}/reviews`, review, config)
      // Refresh products so the new review appears
      dispatch(fetchAPIProducts())
      return { productId, review }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

const initialState = {
  products: [],        // DB products (normalized)
  allProducts: [],     // same — used by Home.jsx
  filteredProducts: [],
  selectedProduct: null,
  searchQuery: '',
  selectedCategory: 'all',
  selectedType: 'all',
  sortOption: 'featured',
  apiLoading: false,
  apiError: null,
}

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload
      state.filteredProducts = applyFiltersAndSort(state)
    },
    setCategory: (state, action) => {
      state.selectedCategory = action.payload
      state.filteredProducts = applyFiltersAndSort(state)
    },
    setType: (state, action) => {
      state.selectedType = action.payload
      state.filteredProducts = applyFiltersAndSort(state)
    },
    setSortOption: (state, action) => {
      state.sortOption = action.payload
      state.filteredProducts = applyFiltersAndSort(state)
    },
    selectProductById: (state, action) => {
      state.selectedProduct =
        state.products.find(p => p.id === action.payload || p._id === action.payload) || null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAPIProducts.pending, (state) => {
        state.apiLoading = true
        state.apiError = null
      })
      .addCase(fetchAPIProducts.fulfilled, (state, action) => {
        state.apiLoading = false
        const normalized = action.payload
          .filter(p => !p.status || p.status.toLowerCase() === 'active')
          .map(normalizeDBProduct)
        state.products = normalized
        state.allProducts = normalized
        state.filteredProducts = applyFiltersAndSort({ ...state, products: normalized, allProducts: normalized })
      })
      .addCase(fetchAPIProducts.rejected, (state, action) => {
        state.apiLoading = false
        state.apiError = action.payload
      })
  },
})

function applyFiltersAndSort(state) {
  const source = state.allProducts && state.allProducts.length > 0
    ? state.allProducts
    : state.products
  let result = [...source]

  if (state.selectedType && state.selectedType !== 'all') {
    result = result.filter(p => p.type === state.selectedType)
  }
  if (state.selectedCategory && state.selectedCategory !== 'all') {
    result = result.filter(
      p => p.category.toLowerCase() === state.selectedCategory.toLowerCase()
    )
  }
  if (state.searchQuery && state.searchQuery.trim() !== '') {
    const q = state.searchQuery.toLowerCase()
    result = result.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q)
    )
  }
  if (state.sortOption === 'price-low-high') result.sort((a, b) => a.price - b.price)
  else if (state.sortOption === 'price-high-low') result.sort((a, b) => b.price - a.price)
  else if (state.sortOption === 'rating') result.sort((a, b) => b.rating - a.rating)

  return result
}

export const {
  setSearchQuery, setCategory, setType, setSortOption, selectProductById,
} = productSlice.actions
export default productSlice.reducer
