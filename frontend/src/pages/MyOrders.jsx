import React, { useEffect, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag, RefreshCw } from 'lucide-react'
import { io } from 'socket.io-client'

import { fetchMyOrders, updateOrderInList } from '../features/orders/orderSlice'
import OrderCard from '../components/orders/OrderCard'
import OrderSkeleton from '../components/orders/OrderSkeleton'
import OrderFilters, { FILTER_TABS } from '../components/orders/OrderFilters'

const ACTIVE_STATUSES = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery']

const MyOrders = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { orders = [], loading, error } = useSelector(s => s.orders || {})
  const { user } = useSelector(s => s.auth)

  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  // Fetch on mount
  useEffect(() => {
    dispatch(fetchMyOrders())
  }, [dispatch])

  // Real-time socket updates
  useEffect(() => {
    if (!user) return
    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'
    const socket = io(socketUrl, { withCredentials: true, transports: ['websocket', 'polling'] })

    socket.emit('join', user._id || user.id)
    socket.on('orderStatusUpdated', (data) => {
      dispatch(updateOrderInList(data))
    })

    return () => { socket.off('orderStatusUpdated'); socket.disconnect() }
  }, [user, dispatch])

  // Filter logic
  const filtered = (orders || []).filter(order => {
    const activeTab = FILTER_TABS.find(t => t.key === filter)
    let passesFilter = true

    if (filter === 'All') {
      passesFilter = true
    } else if (filter === 'active') {
      passesFilter = ACTIVE_STATUSES.includes(order.orderStatus)
    } else {
      passesFilter = order.orderStatus === filter
    }

    const s = search.toLowerCase()
    const passesSearch = !search ||
      (order._id || '').toLowerCase().includes(s) ||
      (order.orderItems || []).some(i => (i.name || '').toLowerCase().includes(s))

    return passesFilter && passesSearch
  })

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto px-4 py-10 sm:py-16">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">My Orders</h1>
            <p className="text-sm text-white/40 mt-1">
              {orders.length > 0 ? `${orders.length} order${orders.length !== 1 ? 's' : ''} total` : 'No orders yet'}
            </p>
          </div>
          <button
            onClick={() => dispatch(fetchMyOrders())}
            className="p-2.5 rounded-xl bg-white/5 border border-white/8 text-white/40
              hover:text-white/70 hover:border-white/15 transition-all"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <OrderFilters
            filter={filter}
            setFilter={setFilter}
            search={search}
            setSearch={setSearch}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <OrderSkeleton key={i} />)}
          </div>
        )}

        {/* Order list */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-4">
            {filtered.map(order => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-5">
              <ShoppingBag size={32} className="text-white/20" />
            </div>
            <h3 className="text-lg font-semibold text-white/60 mb-2">
              {search || filter !== 'All' ? 'No matching orders' : 'No orders yet'}
            </h3>
            <p className="text-sm text-white/30 max-w-xs mb-6">
              {search || filter !== 'All'
                ? 'Try adjusting your filters or search query.'
                : "Looks like you haven't placed any orders yet. Start shopping!"}
            </p>
            {filter === 'All' && !search && (
              <button
                onClick={() => navigate('/shop')}
                className="px-6 py-2.5 bg-white text-black text-sm font-semibold rounded-xl
                  hover:bg-white/90 transition-colors"
              >
                Shop Now
              </button>
            )}
            {(search || filter !== 'All') && (
              <button
                onClick={() => { setFilter('All'); setSearch('') }}
                className="px-6 py-2.5 bg-white/10 text-white text-sm font-medium rounded-xl
                  hover:bg-white/15 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyOrders
