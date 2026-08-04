import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/axiosInstance'

/*
==============================
ASYNC THUNKS
==============================
*/

export const fetchMyOrders = createAsyncThunk(
  'orders/fetchMyOrders',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('orders/my-orders')
      return res.data.orders
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch orders')
    }
  }
)

export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await api.get(`orders/${orderId}`)
      return res.data.order
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch order')
    }
  }
)

export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async ({ orderId, reason }, { rejectWithValue }) => {
    try {
      const res = await api.put(`orders/${orderId}/cancel`, { reason })
      return res.data.order
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to cancel order')
    }
  }
)

export const submitReturnRequest = createAsyncThunk(
  'orders/submitReturnRequest',
  async ({ formData }, { rejectWithValue }) => {
    try {
      const res = await api.post('returns', formData)
      return res.data.returnReq
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to submit return request')
    }
  }
)

export const generateInvoice = createAsyncThunk(
  'orders/generateInvoice',
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await api.post('invoice', { orderId })
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to generate invoice')
    }
  }
)

/*
==============================
SLICE
==============================
*/

const initialState = {
  orders: [],
  selectedOrder: null,
  loading: false,
  orderDetailLoading: false,
  cancelLoading: false,
  returnLoading: false,
  invoiceLoading: false,
  error: null,
  orderDetailError: null,
  returnSuccess: false,
  cancelSuccess: false,
}

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setSelectedOrder: (state, action) => {
      state.selectedOrder = action.payload
    },
    clearSelectedOrder: (state) => {
      state.selectedOrder = null
      state.orderDetailError = null
    },
    clearOrderError: (state) => {
      state.error = null
      state.orderDetailError = null
    },
    resetReturnSuccess: (state) => {
      state.returnSuccess = false
    },
    resetCancelSuccess: (state) => {
      state.cancelSuccess = false
    },
    // Real-time socket update
    updateOrderInList: (state, action) => {
      const updated = action.payload
      const idx = state.orders.findIndex(o => o._id === updated.orderId || o._id === updated._id)
      if (idx !== -1) {
        state.orders[idx] = {
          ...state.orders[idx],
          orderStatus: updated.status || updated.orderStatus,
          trackingHistory: updated.trackingHistory || state.orders[idx].trackingHistory,
          deliveredAt: updated.deliveredAt || state.orders[idx].deliveredAt,
          courierName: updated.courierName || state.orders[idx].courierName,
          trackingNumber: updated.trackingNumber || state.orders[idx].trackingNumber,
          estimatedDelivery: updated.estimatedDelivery || state.orders[idx].estimatedDelivery,
        }
      }
      // Also update selectedOrder if it matches
      if (state.selectedOrder && (state.selectedOrder._id === updated.orderId || state.selectedOrder._id === updated._id)) {
        state.selectedOrder = {
          ...state.selectedOrder,
          orderStatus: updated.status || updated.orderStatus,
          trackingHistory: updated.trackingHistory || state.selectedOrder.trackingHistory,
          deliveredAt: updated.deliveredAt || state.selectedOrder.deliveredAt,
          courierName: updated.courierName || state.selectedOrder.courierName,
          trackingNumber: updated.trackingNumber || state.selectedOrder.trackingNumber,
          estimatedDelivery: updated.estimatedDelivery || state.selectedOrder.estimatedDelivery,
        }
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch my orders
    builder
      .addCase(fetchMyOrders.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.loading = false
        state.orders = action.payload || []
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // Fetch order by ID
    builder
      .addCase(fetchOrderById.pending, (state) => {
        state.orderDetailLoading = true
        state.orderDetailError = null
        state.selectedOrder = null
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.orderDetailLoading = false
        state.selectedOrder = action.payload
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.orderDetailLoading = false
        state.orderDetailError = action.payload
      })

    // Cancel order
    builder
      .addCase(cancelOrder.pending, (state) => {
        state.cancelLoading = true
        state.error = null
        state.cancelSuccess = false
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.cancelLoading = false
        state.cancelSuccess = true
        const updated = action.payload
        const idx = state.orders.findIndex(o => o._id === updated._id)
        if (idx !== -1) state.orders[idx] = updated
        if (state.selectedOrder?._id === updated._id) state.selectedOrder = updated
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.cancelLoading = false
        state.error = action.payload
      })

    // Submit return request
    builder
      .addCase(submitReturnRequest.pending, (state) => {
        state.returnLoading = true
        state.error = null
        state.returnSuccess = false
      })
      .addCase(submitReturnRequest.fulfilled, (state) => {
        state.returnLoading = false
        state.returnSuccess = true
      })
      .addCase(submitReturnRequest.rejected, (state, action) => {
        state.returnLoading = false
        state.error = action.payload
      })

    // Generate invoice
    builder
      .addCase(generateInvoice.pending, (state) => {
        state.invoiceLoading = true
      })
      .addCase(generateInvoice.fulfilled, (state) => {
        state.invoiceLoading = false
      })
      .addCase(generateInvoice.rejected, (state, action) => {
        state.invoiceLoading = false
        state.error = action.payload
      })
  },
})

export const {
  setSelectedOrder,
  clearSelectedOrder,
  clearOrderError,
  resetReturnSuccess,
  resetCancelSuccess,
  updateOrderInList,
} = orderSlice.actions

export default orderSlice.reducer
