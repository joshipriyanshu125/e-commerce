import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from '../../services/axiosInstance'

/*
==================================================
ASYNC THUNKS
==================================================
*/

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchAll',
  async ({ page = 1, limit = 20, filter = 'all', view = 'user' } = {}, { rejectWithValue }) => {
    try {
      const params = { page, limit, view }
      if (filter !== 'all') params.type = filter
      const res = await axios.get('notifications', { params })
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch notifications')
    }
  }
)

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async ({ view = 'user' } = {}, { rejectWithValue }) => {
    try {
      const res = await axios.get('notifications/unread-count', { params: { view } })
      return res.data.count ?? res.data.unreadCount ?? 0
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch count')
    }
  }
)

export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (id, { rejectWithValue }) => {
    try {
      await axios.put(`notifications/${id}/read`)
      return id
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to mark as read')
    }
  }
)

export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await axios.put('notifications/mark-all-read')
      return true
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to mark all as read')
    }
  }
)

export const deleteNotification = createAsyncThunk(
  'notifications/delete',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`notifications/${id}`)
      return id
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete notification')
    }
  }
)

/*
==================================================
SLICE
==================================================
*/
const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unreadCount: 0,
    loading: false,
    error: null,
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
  },
  reducers: {
    // Called by Socket.IO listener for real-time notifications
    addNotification: (state, action) => {
      state.items.unshift(action.payload)
      state.unreadCount += 1
      state.totalCount += 1
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload
    },
    clearNotifications: (state) => {
      state.items = []
      state.unreadCount = 0
      state.currentPage = 1
      state.totalPages = 1
      state.totalCount = 0
    },
  },
  extraReducers: (builder) => {
    // fetchNotifications
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.notifications || action.payload.data || []
        state.currentPage = action.payload.currentPage || action.payload.page || 1
        state.totalPages = action.payload.totalPages || 1
        state.totalCount = action.payload.total || action.payload.totalCount || state.items.length
        state.unreadCount = action.payload.unreadCount ?? state.unreadCount
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // fetchUnreadCount
    builder.addCase(fetchUnreadCount.fulfilled, (state, action) => {
      state.unreadCount = action.payload
    })

    // markAsRead
    builder.addCase(markAsRead.fulfilled, (state, action) => {
      const id = action.payload
      const item = state.items.find((n) => n._id === id)
      if (item && !item.read) {
        item.read = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    })

    // markAllAsRead
    builder.addCase(markAllAsRead.fulfilled, (state) => {
      state.items.forEach((n) => { n.read = true })
      state.unreadCount = 0
    })

    // deleteNotification
    builder.addCase(deleteNotification.fulfilled, (state, action) => {
      const id = action.payload
      const item = state.items.find((n) => n._id === id)
      if (item && !item.read) {
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
      state.items = state.items.filter((n) => n._id !== id)
      state.totalCount = Math.max(0, state.totalCount - 1)
    })
  },
})

export const { addNotification, setUnreadCount, clearNotifications } = notificationSlice.actions
export default notificationSlice.reducer
