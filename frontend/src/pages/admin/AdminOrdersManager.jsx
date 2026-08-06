import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import {
  ShoppingBag, Eye, Search, Filter, RefreshCw,
  Truck, XCircle, RotateCcw, Printer, ChevronRight,
  Package, CheckCircle2, Clock, MapPin, User, CreditCard,
  Calendar, Hash, AlertTriangle, ChevronDown, X, ChevronUp, Undo2, ArrowLeft, ArrowRight, CheckCheck
} from 'lucide-react'
import api from '../../services/axiosInstance'
import { io } from 'socket.io-client'
import StatusBadge from '../../components/orders/StatusBadge'
import OrderTimeline from '../../components/orders/OrderTimeline'

// Order Status list for filters/dropdown
const ALL_STATUSES = [
  'Pending',
  'Confirmed',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
  'Refunded'
]

const AdminOrdersManager = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Selection / details panel
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [actionLoading, setActionLoading] = useState(null) 
  
  // Search, Filters & Sorting
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  
  // Pagination
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 10

  // Shipping form states
  const [showCourierForm, setShowCourierForm] = useState(false)
  const [courierName, setCourierName] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [estimatedDelivery, setEstimatedDelivery] = useState('')
  const [pendingStatus, setPendingStatus] = useState(null)

  // Cancel form states
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  // Returns panel state
  const [returns, setReturns] = useState([])
  const [loadingReturns, setLoadingReturns] = useState(false)
  const [activeTab, setActiveTab] = useState('orders') // 'orders' or 'returns'
  const [returnPage, setReturnPage] = useState(1)
  const [returnPages, setReturnPages] = useState(1)
  
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [loadingInvoice, setLoadingInvoice] = useState(false)

  useEffect(() => {
    if (selectedOrder) {
      setLoadingInvoice(true)
      setSelectedInvoice(null)
      api.get(`invoice/order/${selectedOrder._id}`)
        .then(res => {
          if (res.data && res.data.invoice) {
            setSelectedInvoice(res.data.invoice)
          }
        })
        .catch(err => {
          console.error("Could not fetch invoice for order", err)
        })
        .finally(() => {
          setLoadingInvoice(false)
        })
    } else {
      setSelectedInvoice(null)
    }
  }, [selectedOrder])
  
  // ── Fetch Orders from Server ───────────────────────────────────────────────
  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('orders', {
        params: {
          page,
          limit,
          status: filterStatus,
          search,
          sortBy,
          sortOrder
        }
      })
      if (res.data.success) {
        setOrders(res.data.orders || [])
        setPages(res.data.pages || 1)
        setTotal(res.data.total || 0)
      }
    } catch (err) {
      console.error(err)
      setError('Failed to load orders from the server.')
    } finally {
      setLoading(false)
    }
  }

  // ── Fetch Returns from Server ──────────────────────────────────────────────
  const fetchReturns = async () => {
    try {
      setLoadingReturns(true)
      const res = await api.get('returns/admin/all', {
        params: {
          page: returnPage,
          limit: 10
        }
      })
      if (res.data.success) {
        setReturns(res.data.returns || [])
        setReturnPages(res.data.pages || 1)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingReturns(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [page, filterStatus, sortBy, sortOrder])

  // Trigger search on typing delay or click refresh
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchOrders()
  }

  useEffect(() => {
    if (activeTab === 'returns') {
      fetchReturns()
    }
  }, [activeTab, returnPage])

  // ── Real-Time Socket.IO Updates ──────────────────────────────────────────
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'
    const socket = io(socketUrl, { withCredentials: true, transports: ['websocket', 'polling'] })

    const handleOrderUpdate = () => {
      fetchOrders()
      if (activeTab === 'returns') fetchReturns()
    }

    socket.on('newOrder', handleOrderUpdate)
    socket.on('orderStatusUpdated', handleOrderUpdate)

    return () => {
      socket.off('newOrder', handleOrderUpdate)
      socket.off('orderStatusUpdated', handleOrderUpdate)
      socket.disconnect()
    }
  }, [page, filterStatus, search, sortBy, sortOrder, activeTab])

  // Sync selectedOrder with updated details in state list
  useEffect(() => {
    if (selectedOrder) {
      const updated = orders.find(o => o._id === selectedOrder._id)
      if (updated) setSelectedOrder(updated)
    }
  }, [orders])

  // ── Update Order Status ──────────────────────────────────────────────────
  const commitStatusUpdate = async (status, extras = {}) => {
    if (!selectedOrder) return
    try {
      setActionLoading(selectedOrder._id)
      const res = await api.put(`orders/${selectedOrder._id}/status`, { status, ...extras })
      if (res.data.success) {
        setOrders(prev => prev.map(o => o._id === selectedOrder._id ? res.data.order : o))
        setSelectedOrder(res.data.order)
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status.')
    } finally {
      setActionLoading(null)
      setShowCourierForm(false)
      setPendingStatus(null)
      setCourierName('')
      setTrackingNumber('')
      setEstimatedDelivery('')
    }
  }

  const handleStatusChange = (newStatus) => {
    if (newStatus === 'Shipped') {
      setPendingStatus(newStatus)
      setCourierName(selectedOrder?.courierName || '')
      setTrackingNumber(selectedOrder?.trackingNumber || '')
      setEstimatedDelivery(selectedOrder?.estimatedDelivery ? new Date(selectedOrder.estimatedDelivery).toISOString().split('T')[0] : '')
      setShowCourierForm(true)
    } else {
      commitStatusUpdate(newStatus)
    }
  }

  const handleCourierSubmit = (e) => {
    e.preventDefault()
    if (!courierName || !trackingNumber || !estimatedDelivery) {
      alert('Please fill out all shipping details.')
      return
    }
    commitStatusUpdate('Shipped', { courierName, trackingNumber, estimatedDelivery })
  }

  // ── Cancel workflow ──────────────────────────────────────────────────────
  const handleCancelSubmit = async (e) => {
    e.preventDefault()
    if (!selectedOrder) return
    try {
      setActionLoading(selectedOrder._id)
      const res = await api.put(`orders/${selectedOrder._id}/admin-cancel`, { reason: cancelReason })
      if (res.data.success) {
        setOrders(prev => prev.map(o => o._id === selectedOrder._id ? res.data.order : o))
        setSelectedOrder(res.data.order)
        setShowCancelDialog(false)
        setCancelReason('')
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order.')
    } finally {
      setActionLoading(null)
    }
  }

  // ── Refund workflow ──────────────────────────────────────────────────────
  const handleRefundClick = async () => {
    if (!selectedOrder) return
    if (!window.confirm('Are you sure you want to refund this order?')) return
    try {
      setActionLoading(selectedOrder._id)
      const res = await api.put(`orders/${selectedOrder._id}/refund`)
      if (res.data.success) {
        setOrders(prev => prev.map(o => o._id === selectedOrder._id ? res.data.order : o))
        setSelectedOrder(res.data.order)
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to refund order.')
    } finally {
      setActionLoading(null)
    }
  }

  // ── Return request workflow ────────────────────────────────────────────────
  const handleApproveReturn = async () => {
    if (!selectedOrder) return
    if (!window.confirm('Approve return request and mark order status?')) return
    try {
      setActionLoading(selectedOrder._id)
      const res = await api.put(`orders/${selectedOrder._id}/approve-return`)
      if (res.data.success) {
        setOrders(prev => prev.map(o => o._id === selectedOrder._id ? res.data.order : o))
        setSelectedOrder(res.data.order)
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve return request.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectReturn = async () => {
    if (!selectedOrder) return
    const notes = window.prompt('Enter rejection reason:')
    if (notes === null) return // cancelled prompt
    try {
      setActionLoading(selectedOrder._id)
      const res = await api.put(`orders/${selectedOrder._id}/reject-return`, { adminNotes: notes })
      if (res.data.success) {
        setOrders(prev => prev.map(o => o._id === selectedOrder._id ? res.data.order : o))
        setSelectedOrder(res.data.order)
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject return request.')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#0a0a0a] text-white p-6 space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-5">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 tracking-tight">
              <ShoppingBag className="text-violet-500" /> Order Operations
            </h1>
            <p className="text-xs text-white/40 mt-1">Manage sales fulfillment, shipping and returns workflow</p>
          </div>
          
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-all ${
                activeTab === 'orders' ? 'bg-violet-600 text-white' : 'text-white/40 hover:text-white/80'
              }`}
            >
              Fulfillments
            </button>
            <button
              onClick={() => setActiveTab('returns')}
              className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-all ${
                activeTab === 'returns' ? 'bg-violet-600 text-white' : 'text-white/40 hover:text-white/80'
              }`}
            >
              Returns Pipeline
            </button>
          </div>
        </div>

        {activeTab === 'orders' ? (
          /* =========================================================================
             ORDERS LISTING TAB
             ========================================================================= */
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            <div className="xl:col-span-2 space-y-4">
              
              {/* Search, Filter & Sort Form */}
              <form onSubmit={handleSearchSubmit} className="bg-white/3 border border-white/5 p-4 rounded-2xl flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[200px] relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    placeholder="Search ID, customer name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-white/15"
                  />
                </div>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white/80 focus:outline-none"
                >
                  <option value="All" className="bg-black">All Statuses</option>
                  {ALL_STATUSES.map(s => (
                    <option key={s} value={s} className="bg-black">{s}</option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white/80 focus:outline-none"
                >
                  <option value="createdAt" className="bg-black">Date</option>
                  <option value="totalPrice" className="bg-black">Order Value</option>
                </select>

                <button
                  type="button"
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="bg-white/5 border border-white/5 rounded-xl p-2 text-xs hover:bg-white/8 transition-colors"
                >
                  {sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                <button
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-500 text-white rounded-xl px-4 py-2 text-xs font-semibold font-mono tracking-wider uppercase transition-colors"
                >
                  Apply
                </button>
              </form>

              {/* Orders table */}
              <div className="bg-white/3 border border-white/5 rounded-2xl overflow-hidden">
                {loading ? (
                  <div className="py-20 flex flex-col items-center gap-3 text-white/40">
                    <RefreshCw size={24} className="animate-spin" />
                    <span className="text-xs font-mono">Loading operations...</span>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="py-20 text-center text-white/30">
                    No orders matched search criteria.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-[10px] font-mono uppercase tracking-widest text-white/30">
                          <th className="p-4">Order ID</th>
                          <th className="p-4">Customer</th>
                          <th className="p-4">Date</th>
                          <th className="p-4 text-right">Amount</th>
                          <th className="p-4 text-center">Fulfillment</th>
                          <th className="p-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-xs">
                        {orders.map(o => (
                          <tr
                            key={o._id}
                            onClick={() => setSelectedOrder(o)}
                            className={`cursor-pointer hover:bg-white/5 transition-colors ${
                              selectedOrder?._id === o._id ? 'bg-white/5' : ''
                            }`}
                          >
                            <td className="p-4 font-mono font-bold text-white/70">
                              #{o._id.slice(-8).toUpperCase()}
                            </td>
                            <td className="p-4">
                              <p className="font-semibold">{o.shippingInfo?.fullName || 'Guest User'}</p>
                              <p className="text-[10px] text-white/40">{o.user?.email || 'N/A'}</p>
                            </td>
                            <td className="p-4 text-white/60">
                              {new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="p-4 text-right font-semibold font-mono text-white/90">
                              ${o.totalPrice.toFixed(2)}
                            </td>
                            <td className="p-4 text-center">
                              <StatusBadge status={o.orderStatus} size="sm" dark />
                            </td>
                            <td className="p-4 text-right">
                              <ChevronRight size={14} className="text-white/20" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Pagination controls */}
              {pages > 1 && (
                <div className="flex justify-between items-center bg-white/3 border border-white/5 p-4 rounded-2xl">
                  <span className="text-xs text-white/40 font-mono">
                    Page {page} of {pages} ({total} total orders)
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                      className="p-2 border border-white/8 hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-all"
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <button
                      disabled={page === pages}
                      onClick={() => setPage(prev => Math.min(prev + 1, pages))}
                      className="p-2 border border-white/8 hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-all"
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Operations Panel */}
            <div className="space-y-6">
              {selectedOrder ? (
                <div className="bg-white/3 border border-white/5 rounded-2xl p-6 space-y-6">
                  
                  {/* Panel Header */}
                  <div className="flex justify-between items-start border-b border-white/5 pb-4">
                    <div>
                      <h2 className="text-base font-bold font-mono">#{selectedOrder._id.slice(-8).toUpperCase()} DETAILS</h2>
                      <p className="text-xs text-white/40 mt-1">Status modifications panel</p>
                    </div>
                    <button onClick={() => setSelectedOrder(null)} className="p-1 text-white/30 hover:text-white">
                      <X size={16} />
                    </button>
                  </div>

                  {/* Quick stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/3 p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] text-white/30 font-mono uppercase block">Status</span>
                      <span className="mt-1 block"><StatusBadge status={selectedOrder.orderStatus} size="sm" dark /></span>
                    </div>
                    <div className="bg-white/3 p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] text-white/30 font-mono uppercase block">Total Price</span>
                      <span className="text-sm font-bold font-mono text-white/95 mt-1 block">${selectedOrder.totalPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Actions Dropdown */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-widest text-white/45 mb-2">Update status workflow</label>
                    <select
                      value={selectedOrder.orderStatus}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-sm text-white/90 focus:outline-none"
                    >
                      {ALL_STATUSES.map(s => (
                        <option key={s} value={s} className="bg-black">{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Courier / Shipping Assignment form inline */}
                  {showCourierForm && (
                    <form onSubmit={handleCourierSubmit} className="bg-white/3 border border-white/5 p-4 rounded-xl space-y-4">
                      <h4 className="text-xs font-semibold font-mono uppercase text-violet-400">Courier Shipping details</h4>
                      <div>
                        <label className="text-[10px] font-mono text-white/40 block mb-1">Courier Carrier</label>
                        <input
                          type="text"
                          required
                          value={courierName}
                          onChange={(e) => setCourierName(e.target.value)}
                          className="w-full bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-white/40 block mb-1">Tracking Number</label>
                        <input
                          type="text"
                          required
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          className="w-full bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-white/40 block mb-1">Estimated Delivery Date</label>
                        <input
                          type="date"
                          required
                          value={estimatedDelivery}
                          onChange={(e) => setEstimatedDelivery(e.target.value)}
                          className="w-full bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowCourierForm(false)}
                          className="flex-1 py-2 text-xs border border-white/8 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2 text-xs bg-violet-600 rounded-lg font-semibold"
                        >
                          Save Shipping
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Cancellation Reason form dialog inline */}
                  {showCancelDialog && (
                    <form onSubmit={handleCancelSubmit} className="bg-white/3 border border-white/5 p-4 rounded-xl space-y-3">
                      <h4 className="text-xs font-semibold font-mono uppercase text-red-400">Cancel Order Operations</h4>
                      <textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Reason for cancellation..."
                        required
                        rows={2}
                        className="w-full bg-white/5 border border-white/8 rounded-lg p-2 text-xs text-white"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowCancelDialog(false)}
                          className="flex-1 py-2 text-xs border border-white/8 rounded-lg"
                        >
                          Keep
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2 text-xs bg-red-600 rounded-lg font-semibold"
                        >
                          Confirm Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Admin Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                    {['Pending', 'Confirmed', 'Packed'].includes(selectedOrder.orderStatus) && !showCancelDialog && (
                      <button
                        onClick={() => setShowCancelDialog(true)}
                        className="flex-1 py-2.5 text-xs border border-red-500/20 hover:bg-red-500/10 text-red-400 rounded-xl transition-all"
                      >
                        Cancel Order
                      </button>
                    )}
                    {['Delivered', 'Cancelled'].includes(selectedOrder.orderStatus) && (
                      <button
                        onClick={handleRefundClick}
                        className="flex-1 py-2.5 text-xs bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/20 text-pink-400 rounded-xl transition-all"
                      >
                        Refund Order
                      </button>
                    )}
                  </div>

                  {/* Return Approval Actions */}
                  {selectedOrder.returnInfo?.status === 'Requested' && (
                    <div className="bg-violet-600/5 border border-violet-500/10 p-4 rounded-xl space-y-3">
                      <p className="text-xs text-white/60">Return requested. Reason: <span className="font-semibold text-white">{selectedOrder.returnInfo.reason}</span></p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleApproveReturn}
                          className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
                        >
                          Approve Return
                        </button>
                        <button
                          onClick={handleRejectReturn}
                          className="flex-1 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold"
                        >
                          Reject Return
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Invoice / Billing Card */}
                  <div className="bg-white/3 border border-white/5 p-4 rounded-xl space-y-3">
                    <h4 className="text-xs font-semibold font-mono uppercase text-violet-400">Invoice & Billing</h4>
                    {loadingInvoice ? (
                      <p className="text-[10px] text-white/40 font-mono animate-pulse">Loading billing metadata...</p>
                    ) : selectedInvoice ? (
                      <div className="space-y-2">
                        <div className="text-xs space-y-1">
                          <p className="text-white/60">Invoice No: <span className="font-mono text-white font-semibold">{selectedInvoice.invoiceNumber}</span></p>
                          <p className="text-white/60">Amount: <span className="font-mono text-white">${selectedInvoice.totalAmount?.toFixed(2)}</span></p>
                        </div>
                        <div className="flex gap-2 pt-1.5">
                          <button
                            onClick={() => navigate(`/invoice/${selectedOrder._id}`)}
                            className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-[10px] font-mono uppercase tracking-wider rounded-lg border border-white/5 flex items-center justify-center gap-1"
                          >
                            <Eye size={12} /> View
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const response = await api.get(`invoice/download?id=${encodeURIComponent(selectedInvoice._id)}`, {
                                  responseType: 'blob'
                                })
                                const blob = new Blob([response.data], { type: 'application/pdf' })
                                const url = window.URL.createObjectURL(blob)
                                const link = document.createElement('a')
                                link.href = url
                                link.setAttribute('download', `${selectedInvoice.invoiceNumber}.pdf`)
                                document.body.appendChild(link)
                                link.click()
                                link.remove()
                                window.URL.revokeObjectURL(url)
                              } catch (err) {
                                alert("Failed to download PDF")
                              }
                            }}
                            className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-[10px] font-mono uppercase tracking-wider rounded-lg border border-white/5 flex items-center justify-center gap-1"
                          >
                            <Download size={12} /> PDF
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                setLoadingInvoice(true)
                                const res = await api.post(`invoice/${selectedInvoice._id}/regenerate`)
                                if (res.data && res.data.success) {
                                  alert("Invoice regenerated successfully!")
                                  setSelectedInvoice(res.data.invoice)
                                }
                              } catch (err) {
                                alert("Regeneration failed")
                              } finally {
                                setLoadingInvoice(false)
                              }
                            }}
                            className="flex-1 py-1.5 bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 text-[10px] font-mono uppercase tracking-wider rounded-lg border border-violet-500/20 flex items-center justify-center gap-1"
                          >
                            <RefreshCw size={12} /> Sync
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-[10px] text-white/40 font-mono">No invoice exists yet.</p>
                        <button
                          onClick={async () => {
                            try {
                              setLoadingInvoice(true)
                              const res = await api.post("invoice", { orderId: selectedOrder._id })
                              if (res.data && res.data.invoice) {
                                setSelectedInvoice(res.data.invoice)
                                alert("Invoice generated successfully!")
                              }
                            } catch (err) {
                              alert("Generation failed")
                            } finally {
                              setLoadingInvoice(false)
                            }
                          }}
                          className="w-full py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-semibold font-mono uppercase tracking-wider rounded-lg flex items-center justify-center gap-1"
                        >
                          <RefreshCw size={12} /> Generate Invoice
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Detailed Items list */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-mono uppercase tracking-widest text-white/40">Purchased Items</h4>
                    <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                      {(selectedOrder.orderItems || selectedOrder.items || []).map((item, idx) => (
                        <div key={idx} className="flex gap-3 text-xs items-center">
                          <img src={item.image || '/placeholder.jpg'} alt="" className="w-10 h-10 object-cover rounded bg-white/5 ring-1 ring-white/10" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{item.name}</p>
                            <p className="text-[10px] text-white/40">Qty: {item.quantity} | Size: {item.size || 'N/A'} | Color: {item.color || 'N/A'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Address details */}
                  <div className="text-xs space-y-2 border-t border-white/5 pt-4">
                    <p className="font-semibold text-white/50">Shipping Details</p>
                    <p>{selectedOrder.shippingInfo?.fullName}</p>
                    <p className="text-white/40">{selectedOrder.shippingInfo?.address}, {selectedOrder.shippingInfo?.city}, {selectedOrder.shippingInfo?.postalCode}</p>
                    <p className="text-white/40">Phone: {selectedOrder.shippingInfo?.phone}</p>
                  </div>

                </div>
              ) : (
                <div className="bg-white/3 border border-white/5 p-6 rounded-2xl text-center text-white/30 h-48 flex items-center justify-center">
                  Select an order to view detailed options and workflows.
                </div>
              )}
            </div>

          </div>
        ) : (
          /* =========================================================================
             RETURNS pipeline WORKFLOWS
             ========================================================================= */
          <div className="space-y-4">
            <div className="bg-white/3 border border-white/5 rounded-2xl overflow-hidden">
              {loadingReturns ? (
                <div className="py-20 flex flex-col items-center gap-3 text-white/40">
                  <RefreshCw size={24} className="animate-spin" />
                  <span className="text-xs font-mono">Querying returns queue...</span>
                </div>
              ) : returns.length === 0 ? (
                <div className="py-20 text-center text-white/30">
                  No return requests pending resolution.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] font-mono uppercase tracking-widest text-white/30">
                        <th className="p-4">Return ID</th>
                        <th className="p-4">Order ID</th>
                        <th className="p-4">Customer</th>
                        <th className="p-4">Reason</th>
                        <th className="p-4">Date</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                      {returns.map(r => (
                        <tr key={r._id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-mono font-bold text-white/70">
                            #{r._id.slice(-8).toUpperCase()}
                          </td>
                          <td className="p-4 font-mono text-white/50">
                            #{r.order?._id?.slice(-8).toUpperCase() || 'N/A'}
                          </td>
                          <td className="p-4">
                            <p className="font-semibold">{r.user?.name || 'Customer'}</p>
                            <p className="text-[10px] text-white/40">{r.user?.email || 'N/A'}</p>
                          </td>
                          <td className="p-4 text-white/80 max-w-[200px] truncate">
                            {r.reason}
                          </td>
                          <td className="p-4 text-white/55">
                            {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`text-[10px] font-mono px-2 py-0.5 border rounded-full uppercase tracking-wider ${
                              r.status === 'Approved' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' :
                              r.status === 'Rejected' ? 'text-red-400 border-red-400/20 bg-red-400/5' :
                              'text-violet-400 border-violet-400/20 bg-violet-400/5'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {r.status === 'Requested' && (
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={async () => {
                                    if (window.confirm('Approve return?')) {
                                      await api.put(`returns/${r._id}/approve`)
                                      fetchReturns()
                                    }
                                  }}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-[10px] font-semibold transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={async () => {
                                    const reasonNotes = window.prompt('Enter rejection notes:')
                                    if (reasonNotes !== null) {
                                      await api.put(`returns/${r._id}/reject`, { adminNotes: reasonNotes })
                                      fetchReturns()
                                    }
                                  }}
                                  className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-[10px] font-semibold transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {returnPages > 1 && (
              <div className="flex justify-between items-center bg-white/3 border border-white/5 p-4 rounded-2xl">
                <span className="text-xs text-white/40 font-mono">
                  Page {returnPage} of {returnPages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={returnPage === 1}
                    onClick={() => setReturnPage(prev => Math.max(prev - 1, 1))}
                    className="p-2 border border-white/8 hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-all"
                  >
                    <ArrowLeft size={14} />
                  </button>
                  <button
                    disabled={returnPage === returnPages}
                    onClick={() => setReturnPage(prev => Math.min(prev + 1, returnPages))}
                    className="p-2 border border-white/8 hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-all"
                  >
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </AdminLayout>
  )
}

export default AdminOrdersManager
