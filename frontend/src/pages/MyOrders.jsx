import React, { useEffect, useState } from 'react'
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
    <div className="min-h-screen bg-atelier-beige text-atelier-dark font-sans selection:bg-atelier-accent selection:text-white">
      <div className="max-w-3xl mx-auto px-4 py-10 sm:py-16">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b border-atelier-lightgray pb-5">
          <div>
            <span className="font-mono text-xs tracking-[0.25em] uppercase text-atelier-gray block mb-1">
              Fulfillment Status
            </span>
            <h1 className="text-3xl font-serif font-semibold text-atelier-dark">My Orders</h1>
            <p className="text-xs text-atelier-gray font-mono mt-1">
              {orders.length > 0 ? `${orders.length} order${orders.length !== 1 ? 's' : ''} recorded` : 'No orders recorded'}
            </p>
          </div>
          <button
            onClick={() => dispatch(fetchMyOrders())}
            className="p-2.5 bg-atelier-cream border border-atelier-lightgray text-atelier-gray
              hover:text-atelier-dark hover:border-atelier-dark transition-all duration-300"
            title="Refresh list"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <OrderFilters
            filter={filter}
            setFilter={setFilter}
            search={search}
            setSearch={setSearch}
          />
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-none text-rose-800 text-xs font-mono uppercase">
            {error}
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="space-y-4">
            {[1, 2].map(i => <OrderSkeleton key={i} />)}
          </div>
        )}

        {/* Order Cards */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-4 animate-fade-in">
            {filtered.map(order => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-atelier-lightgray bg-atelier-cream/40 p-8">
            <div className="w-14 h-14 rounded-full bg-atelier-dark/5 flex items-center justify-center mb-4">
              <ShoppingBag size={22} className="text-atelier-gray/40" />
            </div>
            <h3 className="font-serif text-lg text-atelier-dark font-medium mb-1">
              {search || filter !== 'All' ? 'No matching orders found' : 'No orders placed'}
            </h3>
            <p className="text-xs text-atelier-gray font-mono max-w-xs mb-6">
              {search || filter !== 'All'
                ? 'Try adjusting your filters or keywords.'
                : "It looks like you haven't placed an order with us yet."}
            </p>
            {filter === 'All' && !search ? (
              <button
                onClick={() => navigate('/shop')}
                className="btn-atelier-dark"
              >
                Start Shopping
              </button>
            ) : (
              <button
                onClick={() => { setFilter('All'); setSearch('') }}
                className="px-5 py-2.5 border border-atelier-dark font-mono text-[10px] uppercase tracking-widest text-atelier-dark hover:bg-atelier-dark hover:text-white transition-all"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyOrders
