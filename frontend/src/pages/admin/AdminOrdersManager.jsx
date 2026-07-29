import React, { useState, useEffect } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { ShoppingBag, Eye, Calendar, User, DollarSign, Edit2, CheckCircle2, XCircle } from 'lucide-react'
import api from '../../services/axiosInstance'

const AdminOrdersManager = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('orders')
      if (res.data.success) {
        setOrders(res.data.orders || [])
      }
    } catch (err) {
      console.error(err)
      setError('Failed to load orders from the server.')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId)
      const res = await api.put(`orders/${orderId}/status`, { status: newStatus })
      if (res.data.success) {
        // Update local state
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, orderStatus: newStatus } : o))
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(prev => ({ ...prev, orderStatus: newStatus }))
        }
      }
    } catch (err) {
      alert('Failed to update order status. Please try again.')
    } finally {
      setUpdatingId(null)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  return (
    <AdminLayout title="Orders">
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-white">Order Management</h2>
          <p className="text-xs text-white/40 mt-1">Track payments, status, and shipping information</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Orders List */}
          <div className={`bg-[#13131a] border border-white/5 rounded-xl p-6 ${selectedOrder ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
            <h3 className="font-semibold text-white mb-6">All Orders ({orders.length})</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-white/40 uppercase tracking-wider font-mono">
                    <th className="pb-3 font-semibold">Order ID</th>
                    <th className="pb-3 font-semibold">Customer</th>
                    <th className="pb-3 font-semibold">Items</th>
                    <th className="pb-3 font-semibold">Total</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="py-6 text-center text-white/20 font-mono">Loading orders...</td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-6 text-center text-white/20 font-mono">No orders placed yet.</td>
                    </tr>
                  ) : (
                    orders.map(order => (
                      <tr key={order._id} className={`hover:bg-white/[0.01] transition-colors ${selectedOrder?._id === order._id ? 'bg-white/[0.02]' : ''}`}>
                        <td className="py-3.5 font-mono font-medium text-white/90">#{order._id.slice(-6).toUpperCase()}</td>
                        <td className="py-3.5 text-white/70">{order.shippingInfo?.fullName || 'Guest'}</td>
                        <td className="py-3.5 text-white/50">{order.orderItems?.reduce((a, b) => a + b.quantity, 0) || 0} items</td>
                        <td className="py-3.5 font-mono text-white/90">${order.totalPrice.toFixed(2)}</td>
                        <td className="py-3.5">
                          <select
                            value={order.orderStatus}
                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            disabled={updatingId === order._id}
                            className={`px-2 py-1 rounded bg-[#1c1c24] border border-white/10 font-mono text-[10px] uppercase tracking-wider focus:outline-none focus:border-amber-500 text-white cursor-pointer ${
                              order.orderStatus === 'Delivered' 
                                ? 'text-emerald-400'
                                : order.orderStatus === 'Cancelled'
                                ? 'text-red-400'
                                : 'text-amber-400'
                            }`}
                          >
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 border border-white/5 text-white/70 hover:bg-white/10 transition-all font-mono"
                          >
                            <Eye size={12} /> Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Details Panel */}
          {selectedOrder && (
            <div className="lg:col-span-5 bg-[#13131a] border border-white/5 rounded-xl p-6 space-y-6 relative">
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="absolute top-4 right-4 text-white/40 hover:text-white text-xs font-mono"
              >
                ✕ Close
              </button>
              
              <div>
                <h3 className="font-semibold text-white">Order Details</h3>
                <p className="text-xs font-mono text-white/40 mt-1">ID: #{selectedOrder._id.toUpperCase()}</p>
              </div>

              {/* Status and Summary */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/40 font-mono">Date Placed</span>
                  <span className="text-white/80 font-mono">{new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/40 font-mono">Payment Mode</span>
                  <span className="text-white/80 font-mono">{selectedOrder.paymentInfo?.method || 'COD'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/40 font-mono">Payment Status</span>
                  <span className={`font-mono font-medium ${selectedOrder.paymentInfo?.paymentStatus === 'Paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {selectedOrder.paymentInfo?.paymentStatus || 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/40 font-mono">Order Status</span>
                  <span className={`font-mono font-medium ${
                    selectedOrder.orderStatus === 'Delivered' ? 'text-emerald-400' : selectedOrder.orderStatus === 'Cancelled' ? 'text-red-400' : 'text-amber-400'
                  }`}>
                    {selectedOrder.orderStatus}
                  </span>
                </div>
              </div>

              {/* Items list */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-white/40">Items Summary</h4>
                <div className="divide-y divide-white/5 max-h-48 overflow-y-auto pr-1">
                  {selectedOrder.orderItems?.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white/90 truncate">{item.name}</p>
                        <p className="text-[10px] text-white/40 font-mono mt-0.5">${item.price?.toFixed(2)} × {item.quantity}</p>
                      </div>
                      <span className="font-mono text-white/80">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between items-center text-sm font-semibold">
                  <span className="text-white/60">Total Bill</span>
                  <span className="font-mono text-amber-400">${selectedOrder.totalPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-3 border-t border-white/5 pt-4">
                <h4 className="text-xs font-mono uppercase tracking-wider text-white/40">Shipping Address</h4>
                {selectedOrder.shippingInfo ? (
                  <div className="text-xs text-white/70 space-y-1 bg-white/[0.02] border border-white/5 p-4 rounded-lg font-mono">
                    <p className="font-medium text-white">{selectedOrder.shippingInfo.fullName}</p>
                    <p>Phone: {selectedOrder.shippingInfo.phone}</p>
                    <p>{selectedOrder.shippingInfo.address}</p>
                    <p>{selectedOrder.shippingInfo.city}, {selectedOrder.shippingInfo.postalCode}</p>
                    <p>{selectedOrder.shippingInfo.country}</p>
                  </div>
                ) : (
                  <p className="text-xs text-white/30 italic">No shipping address provided.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminOrdersManager
