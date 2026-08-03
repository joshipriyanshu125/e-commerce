import React, { useState, useEffect, useRef } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import {
  ShoppingBag, Eye, Search, Filter, RefreshCw,
  Truck, XCircle, RotateCcw, Printer, ChevronRight,
  Package, CheckCircle2, Clock, MapPin, User, CreditCard,
  Calendar, Hash, AlertTriangle, ChevronDown, X
} from 'lucide-react'
import api from '../../services/axiosInstance'
import { io } from 'socket.io-client'

// ─── Status Configuration ────────────────────────────────────────────────────
const STATUS_PIPELINE = [
  'Processing',
  'Confirmed',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
]

const STATUS_META = {
  Processing:       { color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/20',  icon: Clock },
  Confirmed:        { color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    icon: CheckCircle2 },
  Packed:           { color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/20',  icon: Package },
  Shipped:          { color: 'text-indigo-400',  bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20',  icon: Truck },
  'Out for Delivery': { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: Truck },
  Delivered:        { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle2 },
  Cancelled:        { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     icon: XCircle },
  Refunded:         { color: 'text-pink-400',    bg: 'bg-pink-500/10',    border: 'border-pink-500/20',    icon: RotateCcw },
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.Processing
  const Icon = meta.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border font-semibold ${meta.color} ${meta.bg} ${meta.border}`}>
      <Icon size={10} strokeWidth={2.5} />
      {status}
    </span>
  )
}

// ─── Status Pipeline Stepper ──────────────────────────────────────────────────
const StatusStepper = ({ currentStatus }) => {
  const isCancelled = currentStatus === 'Cancelled'
  const isRefunded  = currentStatus === 'Refunded'
  const currentIdx  = STATUS_PIPELINE.indexOf(currentStatus)

  if (isCancelled || isRefunded) {
    const meta = STATUS_META[currentStatus]
    const Icon = meta.icon
    return (
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${meta.bg} ${meta.border}`}>
        <Icon size={18} className={meta.color} />
        <span className={`text-sm font-semibold ${meta.color}`}>Order {currentStatus}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1">
      {STATUS_PIPELINE.map((step, i) => {
        const done    = currentIdx >= i
        const active  = currentIdx === i
        const meta    = STATUS_META[step]
        const Icon    = meta.icon
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center min-w-[72px]">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                active
                  ? `${meta.bg} ${meta.border} ${meta.color} scale-110`
                  : done
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-white/5 border-white/10 text-white/20'
              }`}>
                <Icon size={13} strokeWidth={2.5} />
              </div>
              <p className={`text-center text-[9px] mt-1.5 leading-tight font-mono uppercase tracking-wide ${
                active ? meta.color : done ? 'text-emerald-400/80' : 'text-white/20'
              }`}>{step}</p>
            </div>
            {i < STATUS_PIPELINE.length - 1 && (
              <div className={`flex-1 h-px min-w-[16px] mb-4 transition-all ${
                currentIdx > i ? 'bg-emerald-500/40' : 'bg-white/8'
              }`} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminOrdersManager = () => {
  const [orders, setOrders]             = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [actionLoading, setActionLoading] = useState(null) // orderId or null
  const [search, setSearch]             = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [showCourierForm, setShowCourierForm] = useState(false)
  const [courierName, setCourierName]   = useState('')
  const [trackingNum, setTrackingNum]   = useState('')
  const [pendingStatus, setPendingStatus] = useState(null)
  const detailRef = useRef(null)

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('orders')
      if (res.data.success) setOrders(res.data.orders || [])
    } catch (err) {
      console.error(err)
      setError('Failed to load orders from the server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrders() }, [])

  // ── Real-Time Socket.IO Updates ──────────────────────────────────────────
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'
    const socket = io(socketUrl, { withCredentials: true, transports: ['websocket', 'polling'] })

    const handleOrderUpdate = () => {
      api.get('orders').then(res => {
        if (res.data?.success) setOrders(res.data.orders || [])
      }).catch(err => console.error('Realtime orders error:', err))
    }

    socket.on('newOrder', handleOrderUpdate)
    socket.on('orderStatusUpdated', handleOrderUpdate)

    return () => {
      socket.off('newOrder', handleOrderUpdate)
      socket.off('orderStatusUpdated', handleOrderUpdate)
      socket.disconnect()
    }
  }, [])

  // Sync detail panel when orders update
  useEffect(() => {
    if (selectedOrder) {
      const updated = orders.find(o => o._id === selectedOrder._id)
      if (updated) setSelectedOrder(updated)
    }
  }, [orders])

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = orders.filter(o => {
    const matchSearch = !search ||
      o._id.toLowerCase().includes(search.toLowerCase()) ||
      (o.shippingInfo?.fullName || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'All' || o.orderStatus === filterStatus
    return matchSearch && matchStatus
  })

  // ── Status update ──────────────────────────────────────────────────────────
  const commitStatusUpdate = async (orderId, status, extras = {}) => {
    try {
      setActionLoading(orderId)
      const res = await api.put(`orders/${orderId}/status`, { status, ...extras })
      if (res.data.success) {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, ...res.data.order } : o))
        if (selectedOrder?._id === orderId) setSelectedOrder(res.data.order)
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status.')
    } finally {
      setActionLoading(null)
      setShowCourierForm(false)
      setPendingStatus(null)
      setCourierName('')
      setTrackingNum('')
    }
  }

  const handleStatusChange = (orderId, newStatus) => {
    // Shipping triggers courier assignment form
    if (newStatus === 'Shipped') {
      setPendingStatus(newStatus)
      setCourierName(selectedOrder?.courierName || '')
      setTrackingNum(selectedOrder?.trackingNumber || '')
      setShowCourierForm(true)
    } else {
      commitStatusUpdate(orderId, newStatus)
    }
  }

  const handleCourierSubmit = () => {
    if (!selectedOrder) return
    commitStatusUpdate(selectedOrder._id, pendingStatus, { courierName, trackingNumber: trackingNum })
  }

  // ── Admin Cancel ───────────────────────────────────────────────────────────
  const handleAdminCancel = async (orderId) => {
    if (!window.confirm('Cancel this order? The customer will be notified.')) return
    try {
      setActionLoading(orderId)
      const res = await api.put(`orders/${orderId}/admin-cancel`)
      if (res.data.success) {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, ...res.data.order } : o))
        if (selectedOrder?._id === orderId) setSelectedOrder(res.data.order)
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order.')
    } finally {
      setActionLoading(null)
    }
  }

  // ── Refund ─────────────────────────────────────────────────────────────────
  const handleRefund = async (orderId) => {
    if (!window.confirm('Issue a refund for this order? This cannot be undone.')) return
    try {
      setActionLoading(orderId)
      const res = await api.put(`orders/${orderId}/refund`)
      if (res.data.success) {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, ...res.data.order } : o))
        if (selectedOrder?._id === orderId) setSelectedOrder(res.data.order)
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to refund order.')
    } finally {
      setActionLoading(null)
    }
  }

  // ── Print invoice ──────────────────────────────────────────────────────────
  const handlePrintInvoice = () => {
    if (!selectedOrder) return
    const o = selectedOrder
    const win = window.open('', '_blank')
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${o._id.slice(-6).toUpperCase()}</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 32px; color: #111; }
          h1 { font-size: 22px; margin-bottom: 4px; }
          .sub { color: #777; font-size: 13px; margin-bottom: 24px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
          .card { background: #f9f9f9; border-radius: 8px; padding: 16px; }
          .card h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin: 0 0 8px; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; font-size: 11px; text-transform: uppercase; color: #888; padding: 8px 0; border-bottom: 1px solid #eee; }
          td { padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
          .total { font-size: 16px; font-weight: 700; color: #111; }
          .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; background: #fef3c7; color: #92400e; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>Invoice</h1>
        <p class="sub">Order #${o._id.toUpperCase()} &nbsp;·&nbsp; ${new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <div class="grid">
          <div class="card">
            <h3>Bill To</h3>
            <strong>${o.shippingInfo?.fullName || '—'}</strong><br/>
            ${o.shippingInfo?.phone || ''}<br/>
            ${o.shippingInfo?.address || ''}<br/>
            ${o.shippingInfo?.city || ''}, ${o.shippingInfo?.postalCode || ''}<br/>
            ${o.shippingInfo?.country || ''}
          </div>
          <div class="card">
            <h3>Payment</h3>
            Method: <strong>${o.paymentInfo?.method || 'COD'}</strong><br/>
            Status: <strong>${o.paymentInfo?.paymentStatus || 'Pending'}</strong><br/>
            Order Status: <span class="badge">${o.orderStatus}</span>
            ${o.courierName ? `<br/>Courier: <strong>${o.courierName}</strong>` : ''}
            ${o.trackingNumber ? `<br/>Tracking: <strong>${o.trackingNumber}</strong>` : ''}
          </div>
        </div>
        <table>
          <thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
          <tbody>
            ${(o.orderItems || []).map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>$${item.price?.toFixed(2)}</td>
                <td>$${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <br/>
        <table style="width:300px;margin-left:auto">
          <tr><td style="color:#888">Subtotal</td><td style="text-align:right">$${o.itemsPrice?.toFixed(2) || '—'}</td></tr>
          <tr><td style="color:#888">Shipping</td><td style="text-align:right">$${o.shippingPrice?.toFixed(2) || '0.00'}</td></tr>
          <tr><td style="color:#888">Tax</td><td style="text-align:right">$${o.taxPrice?.toFixed(2) || '0.00'}</td></tr>
          <tr><td class="total">Total</td><td class="total" style="text-align:right">$${o.totalPrice?.toFixed(2)}</td></tr>
        </table>
        <script>window.onload=()=>window.print()</script>
      </body>
      </html>
    `)
    win.document.close()
  }

  // ── Summary Stats ──────────────────────────────────────────────────────────
  const stats = {
    total:     orders.length,
    pending:   orders.filter(o => o.orderStatus === 'Processing').length,
    shipped:   orders.filter(o => o.orderStatus === 'Shipped').length,
    delivered: orders.filter(o => o.orderStatus === 'Delivered').length,
    cancelled: orders.filter(o => o.orderStatus === 'Cancelled').length,
    revenue:   orders.filter(o => o.orderStatus !== 'Cancelled' && o.orderStatus !== 'Refunded').reduce((a, o) => a + o.totalPrice, 0),
  }

  const allStatuses = ['All', 'Processing', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Refunded']

  return (
    <AdminLayout title="Orders">
      <div className="p-5 lg:p-8 space-y-6 max-w-[1600px] mx-auto">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Order Management</h2>
            <p className="text-xs text-white/40 mt-1">Track, manage and fulfil every customer order</p>
          </div>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70 hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* ── Stats Strip ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Orders', value: stats.total,     color: 'text-white' },
            { label: 'Pending',      value: stats.pending,   color: 'text-yellow-400' },
            { label: 'Shipped',      value: stats.shipped,   color: 'text-indigo-400' },
            { label: 'Delivered',    value: stats.delivered, color: 'text-emerald-400' },
            { label: 'Cancelled',    value: stats.cancelled, color: 'text-red-400' },
            { label: 'Revenue',      value: `$${stats.revenue.toFixed(0)}`, color: 'text-amber-400' },
          ].map(s => (
            <div key={s.label} className="bg-[#13131a] border border-white/5 rounded-xl p-4">
              <p className="text-[10px] font-mono uppercase tracking-wider text-white/30">{s.label}</p>
              <p className={`text-xl font-bold font-mono mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* ── Main Grid ────────────────────────────────────────────────── */}
        <div className="flex gap-6 items-start">

          {/* ── Orders Table ────────────────────────────────────────────── */}
          <div className={`flex-1 min-w-0 bg-[#13131a] border border-white/5 rounded-xl overflow-hidden transition-all ${selectedOrder ? 'hidden lg:block lg:w-[55%] lg:flex-none' : ''}`}>

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 border-b border-white/5">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by Order ID or Customer..."
                  className="w-full bg-[#1a1a24] border border-white/10 text-white text-xs rounded-lg pl-8 pr-3 py-2.5 placeholder-white/25 focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div className="relative">
                <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="bg-[#1a1a24] border border-white/10 text-white/70 text-xs rounded-lg pl-8 pr-6 py-2.5 focus:outline-none focus:border-amber-500/50 appearance-none"
                >
                  {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-white/30 uppercase tracking-widest font-mono">
                    <th className="px-4 py-3 text-left font-semibold">Order</th>
                    <th className="px-4 py-3 text-left font-semibold">Customer</th>
                    <th className="px-4 py-3 text-left font-semibold hidden sm:table-cell">Items</th>
                    <th className="px-4 py-3 text-left font-semibold">Amount</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="py-16 text-center text-white/20 font-mono">
                        <RefreshCw size={20} className="animate-spin mx-auto mb-3 opacity-30" />
                        Loading orders…
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-16 text-center text-white/20 font-mono">
                        <ShoppingBag size={24} className="mx-auto mb-3 opacity-20" />
                        No orders found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map(order => {
                      const isSelected = selectedOrder?._id === order._id
                      const isLoading  = actionLoading === order._id
                      return (
                        <tr
                          key={order._id}
                          className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${isSelected ? 'bg-amber-500/5 border-l-2 border-amber-500/50' : ''}`}
                          onClick={() => { setSelectedOrder(order); setShowCourierForm(false) }}
                        >
                          <td className="px-4 py-3.5">
                            <p className="font-mono font-bold text-white/90">#{order._id.slice(-6).toUpperCase()}</p>
                            <p className="text-[10px] text-white/30 mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="font-medium text-white/80">{order.shippingInfo?.fullName || 'Guest'}</p>
                            <p className="text-[10px] text-white/30 mt-0.5 font-mono">{order.shippingInfo?.phone || '—'}</p>
                          </td>
                          <td className="px-4 py-3.5 hidden sm:table-cell text-white/50">
                            {order.orderItems?.reduce((a, b) => a + (b.quantity || 0), 0)} items
                          </td>
                          <td className="px-4 py-3.5 font-mono font-semibold text-white/90">
                            ${order.totalPrice?.toFixed(2)}
                          </td>
                          <td className="px-4 py-3.5">
                            {isLoading
                              ? <span className="text-white/30 font-mono text-[10px] flex items-center gap-1"><RefreshCw size={10} className="animate-spin" /> Updating…</span>
                              : <StatusBadge status={order.orderStatus} />
                            }
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              onClick={e => { e.stopPropagation(); setSelectedOrder(order); setShowCourierForm(false) }}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-all ${
                                isSelected
                                  ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                                  : 'bg-white/5 border-white/8 text-white/60 hover:bg-white/10'
                              }`}
                            >
                              <Eye size={11} /> View
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Row count */}
            <div className="px-4 py-3 border-t border-white/5 text-[10px] text-white/25 font-mono">
              Showing {filtered.length} of {orders.length} orders
            </div>
          </div>

          {/* ── Detail Panel ────────────────────────────────────────────── */}
          {selectedOrder && (
            <div ref={detailRef} className="w-full lg:w-[45%] lg:flex-none bg-[#13131a] border border-white/5 rounded-xl overflow-hidden">

              {/* Panel Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <div>
                  <p className="text-xs font-mono text-white/40 uppercase tracking-wider">Order Details</p>
                  <h3 className="text-base font-bold text-white font-mono mt-0.5">
                    #{selectedOrder._id.slice(-6).toUpperCase()}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintInvoice}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60 hover:bg-white/10 hover:text-white transition-all"
                  >
                    <Printer size={12} /> Print Invoice
                  </button>
                  <button
                    onClick={() => { setSelectedOrder(null); setShowCourierForm(false) }}
                    className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">

                {/* Status Stepper */}
                <div className="space-y-3">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-white/30">Order Pipeline</p>
                  <StatusStepper currentStatus={selectedOrder.orderStatus} />
                </div>

                {/* Quick Status Update */}
                <div className="space-y-3 border-t border-white/5 pt-5">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-white/30">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_PIPELINE.filter(s => s !== selectedOrder.orderStatus).map(s => {
                      const meta = STATUS_META[s]
                      return (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(selectedOrder._id, s)}
                          disabled={!!actionLoading}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all active:scale-95 disabled:opacity-40 ${meta.bg} ${meta.border} ${meta.color} hover:opacity-80`}
                        >
                          {actionLoading === selectedOrder._id
                            ? <RefreshCw size={10} className="animate-spin" />
                            : <ChevronRight size={10} />
                          }
                          {s}
                        </button>
                      )
                    })}
                  </div>

                  {/* Courier Form (shown when Shipped is selected) */}
                  {showCourierForm && (
                    <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 space-y-3 mt-2">
                      <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold">
                        <Truck size={14} /> Assign Courier Details
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-mono uppercase tracking-wider text-white/30 mb-1 block">Courier Name</label>
                          <input
                            type="text"
                            value={courierName}
                            onChange={e => setCourierName(e.target.value)}
                            placeholder="e.g. FedEx, DHL"
                            className="w-full bg-[#1c1c28] border border-white/10 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500/50 placeholder-white/20"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-mono uppercase tracking-wider text-white/30 mb-1 block">Tracking No.</label>
                          <input
                            type="text"
                            value={trackingNum}
                            onChange={e => setTrackingNum(e.target.value)}
                            placeholder="Track ID"
                            className="w-full bg-[#1c1c28] border border-white/10 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500/50 placeholder-white/20"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleCourierSubmit}
                          disabled={!!actionLoading}
                          className="flex-1 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
                        >
                          Confirm Shipment
                        </button>
                        <button onClick={() => setShowCourierForm(false)} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60 hover:text-white transition-all">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Courier info display */}
                  {selectedOrder.courierName && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/15">
                      <Truck size={16} className="text-indigo-400 flex-shrink-0" />
                      <div className="text-xs">
                        <p className="text-white/60 font-mono">Courier: <span className="text-white font-semibold">{selectedOrder.courierName}</span></p>
                        {selectedOrder.trackingNumber && (
                          <p className="text-white/40 font-mono mt-0.5">Tracking: <span className="text-indigo-300">{selectedOrder.trackingNumber}</span></p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Danger Actions */}
                  <div className="flex gap-2 pt-1">
                    {!['Cancelled', 'Refunded', 'Delivered'].includes(selectedOrder.orderStatus) && (
                      <button
                        onClick={() => handleAdminCancel(selectedOrder._id)}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-mono transition-all active:scale-95 disabled:opacity-50"
                      >
                        <XCircle size={11} /> Cancel Order
                      </button>
                    )}
                    {['Delivered', 'Cancelled'].includes(selectedOrder.orderStatus) && (
                      <button
                        onClick={() => handleRefund(selectedOrder._id)}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 hover:bg-pink-500/20 text-xs font-mono transition-all active:scale-95 disabled:opacity-50"
                      >
                        <RotateCcw size={11} /> Issue Refund
                      </button>
                    )}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="space-y-3 border-t border-white/5 pt-5">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-white/30">Order Summary</p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {[
                      { icon: Hash,       label: 'Full ID',     value: selectedOrder._id },
                      { icon: Calendar,   label: 'Placed',      value: new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
                      { icon: CreditCard, label: 'Method',      value: selectedOrder.paymentInfo?.method || 'COD' },
                      { icon: CreditCard, label: 'Payment',     value: selectedOrder.paymentInfo?.paymentStatus || 'Pending', special: true },
                    ].map(({ icon: Icon, label, value, special }) => (
                      <div key={label} className="flex flex-col gap-1 bg-white/[0.02] rounded-xl p-3 border border-white/5">
                        <div className="flex items-center gap-1.5 text-white/30">
                          <Icon size={11} />
                          <span className="text-[9px] uppercase tracking-wider font-mono">{label}</span>
                        </div>
                        <span className={`font-mono font-semibold truncate ${special ? (value === 'Paid' ? 'text-emerald-400' : 'text-yellow-400') : 'text-white/80'}`}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3 border-t border-white/5 pt-5">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-white/30">Items Ordered</p>
                  <div className="space-y-2">
                    {selectedOrder.orderItems?.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover border border-white/10 flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                            <Package size={14} className="text-white/20" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white/90 text-xs truncate">{item.name}</p>
                          <p className="text-[10px] text-white/40 font-mono mt-0.5">${item.price?.toFixed(2)} × {item.quantity}</p>
                        </div>
                        <span className="font-mono font-bold text-white/80 text-xs">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  {/* Price breakdown */}
                  <div className="space-y-2 mt-3 text-xs font-mono">
                    <div className="flex justify-between text-white/40">
                      <span>Subtotal</span>
                      <span>${selectedOrder.itemsPrice?.toFixed(2) || '—'}</span>
                    </div>
                    <div className="flex justify-between text-white/40">
                      <span>Shipping</span>
                      <span>${selectedOrder.shippingPrice?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between text-white/40">
                      <span>Tax</span>
                      <span>${selectedOrder.taxPrice?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm border-t border-white/10 pt-2 mt-1">
                      <span className="text-white">Total</span>
                      <span className="text-amber-400">${selectedOrder.totalPrice?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="space-y-3 border-t border-white/5 pt-5">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-white/30">Shipping Address</p>
                  {selectedOrder.shippingInfo ? (
                    <div className="flex gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                      <MapPin size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="text-white/70 space-y-0.5 font-mono leading-relaxed">
                        <p className="font-semibold text-white">{selectedOrder.shippingInfo.fullName}</p>
                        {selectedOrder.shippingInfo.phone && <p>📞 {selectedOrder.shippingInfo.phone}</p>}
                        <p>{selectedOrder.shippingInfo.address}</p>
                        <p>{selectedOrder.shippingInfo.city}, {selectedOrder.shippingInfo.postalCode}</p>
                        <p>{selectedOrder.shippingInfo.country}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-white/30 italic">No shipping address provided.</p>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminOrdersManager
