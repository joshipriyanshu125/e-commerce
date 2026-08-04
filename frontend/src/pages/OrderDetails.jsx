import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { 
  ArrowLeft, Download, Trash2, Undo2, Truck, 
  MapPin, CreditCard, Calendar, ShieldCheck, Mail, Phone, ExternalLink 
} from 'lucide-react'
import { io } from 'socket.io-client'

import { 
  fetchOrderById, cancelOrder, updateOrderInList, clearSelectedOrder 
} from '../features/orders/orderSlice'
import { OrderDetailSkeleton } from '../components/orders/OrderSkeleton'
import StatusBadge from '../components/orders/StatusBadge'
import OrderTimeline from '../components/orders/OrderTimeline'
import CancelOrderModal from '../components/orders/CancelOrderModal'
import ReturnRequestForm from '../components/orders/ReturnRequestForm'
import api from '../services/axiosInstance'

const OrderDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  
  const { user } = useSelector(s => s.auth)
  const { selectedOrder, orderDetailLoading, orderDetailError, cancelLoading } = useSelector(s => s.orders)

  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showReturnForm, setShowReturnForm] = useState(false)
  const [returnSuccess, setReturnSuccess] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  // Fetch Order
  useEffect(() => {
    dispatch(fetchOrderById(id))
    return () => {
      dispatch(clearSelectedOrder())
    }
  }, [dispatch, id])

  // Real-time updates
  useEffect(() => {
    if (!user || !id) return
    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'
    const socket = io(socketUrl, { withCredentials: true, transports: ['websocket', 'polling'] })

    socket.emit('join', user._id || user.id)
    
    socket.on('orderStatusUpdated', (data) => {
      if (data.orderId === id) {
        dispatch(updateOrderInList(data))
        setToastMessage(`Order status updated to: ${data.status}`)
        setTimeout(() => setToastMessage(null), 5000)
      }
    })

    return () => {
      socket.off('orderStatusUpdated')
      socket.disconnect()
    }
  }, [user, id, dispatch])

  const handleCancelOrder = async (reason) => {
    try {
      const result = await dispatch(cancelOrder({ orderId: id, reason })).unwrap()
      if (result) {
        setShowCancelModal(false)
        setToastMessage("Order cancelled successfully")
        setTimeout(() => setToastMessage(null), 4000)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDownloadInvoice = async () => {
    try {
      const res = await api.post("invoice", { orderId: id })
      if (res.data && res.data.invoice) {
        const invoiceId = res.data.invoice._id || res.data.invoice.id
        const downloadUrl = `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/api/invoice/download?id=${encodeURIComponent(invoiceId)}`
        const link = document.createElement("a")
        link.href = downloadUrl
        link.setAttribute("download", `INV-${id}.pdf`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (err) {
      console.error(err)
      alert("Failed to download invoice")
    }
  }

  if (orderDetailLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <OrderDetailSkeleton />
        </div>
      </div>
    )
  }

  if (orderDetailError || !selectedOrder) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4">
        <h3 className="text-xl font-semibold mb-2">Error Loading Order</h3>
        <p className="text-white/40 mb-6 text-sm">{orderDetailError || 'Order not found.'}</p>
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/8 transition-all"
        >
          <ArrowLeft size={16} /> Back to My Orders
        </button>
      </div>
    )
  }

  const items = selectedOrder.orderItems || selectedOrder.items || []
  const canCancel = ["Pending", "Confirmed"].includes(selectedOrder.orderStatus)
  const canReturn = selectedOrder.orderStatus === "Delivered" && !selectedOrder.returnInfo?.status

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-12 px-4 relative overflow-hidden">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-violet-600 border border-violet-500/30 text-white px-5 py-3 rounded-xl shadow-2xl animate-bounce flex items-center gap-3">
          <ShieldCheck size={18} />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Back navigation */}
        <button
          onClick={() => navigate('/orders')}
          className="group flex items-center gap-2 text-sm text-white/55 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Orders
        </button>

        {/* Order Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/8 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold font-mono">
                ORDER #{selectedOrder._id.slice(-8).toUpperCase()}
              </h1>
              <StatusBadge status={selectedOrder.orderStatus} />
            </div>
            <p className="text-sm text-white/40 mt-1.5 flex items-center gap-2">
              <Calendar size={14} />
              Placed on {new Date(selectedOrder.createdAt).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleDownloadInvoice}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/8 rounded-xl hover:bg-white/10 text-xs font-mono uppercase tracking-wider transition-all"
            >
              <Download size={14} /> Invoice
            </button>
            {canCancel && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 text-red-400 text-xs font-mono uppercase tracking-wider transition-all"
              >
                <Trash2 size={14} /> Cancel Order
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main info (items, shipping, payment) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Products */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
              <h3 className="text-xs font-mono uppercase tracking-widest text-white/40 border-b border-white/8 pb-3 mb-4">
                Items Summary
              </h3>
              <div className="divide-y divide-white/6">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    <img 
                      src={item.image || '/placeholder.jpg'} 
                      alt={item.name} 
                      className="w-16 h-16 object-cover rounded-xl bg-white/5 ring-1 ring-white/10 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate">{item.name}</h4>
                      <p className="text-xs text-white/40 mt-1 font-mono">
                        QTY: {item.quantity} {item.size && `| SIZE: ${item.size}`} {item.color && `| COLOR: ${item.color}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">${((item.price || 0) * item.quantity).toFixed(2)}</p>
                      <p className="text-[10px] text-white/35 font-mono mt-0.5">${(item.price || 0).toFixed(2)} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery address & Contact info */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-white/40 border-b border-white/8 pb-3 mb-4 flex items-center gap-2">
                  <MapPin size={12} /> Shipping Address
                </h3>
                <p className="text-sm font-semibold text-white">{selectedOrder.shippingInfo?.fullName}</p>
                <p className="text-sm text-white/60 mt-1.5 leading-relaxed">
                  {selectedOrder.shippingInfo?.address}<br />
                  {selectedOrder.shippingInfo?.city}, {selectedOrder.shippingInfo?.state || ''} {selectedOrder.shippingInfo?.postalCode}<br />
                  {selectedOrder.shippingInfo?.country}
                </p>
              </div>
              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-white/40 border-b border-white/8 pb-3 mb-4 flex items-center gap-2">
                  <Phone size={12} /> Contact Details
                </h3>
                <p className="text-sm text-white/60 flex items-center gap-2">
                  <Mail size={12} className="text-white/30" />
                  {selectedOrder.user?.email || 'N/A'}
                </p>
                <p className="text-sm text-white/60 mt-2 flex items-center gap-2">
                  <Phone size={12} className="text-white/30" />
                  {selectedOrder.shippingInfo?.phone || 'N/A'}
                </p>
              </div>
            </div>

            {/* Courier Tracking Details */}
            {selectedOrder.courierName && (
              <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
                <h3 className="text-xs font-mono uppercase tracking-widest text-white/40 border-b border-white/8 pb-3 mb-4 flex items-center gap-2">
                  <Truck size={12} /> Delivery Courier Info
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider block">Courier</span>
                    <span className="text-sm font-semibold mt-1 block">{selectedOrder.courierName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider block font-semibold">Tracking Number</span>
                    <span className="text-sm font-mono mt-1 block text-violet-400 font-semibold">{selectedOrder.trackingNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider block">Est. Delivery Date</span>
                    <span className="text-sm font-semibold mt-1 block">
                      {selectedOrder.estimatedDelivery 
                        ? new Date(selectedOrder.estimatedDelivery).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Pending update'
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Return details if any */}
            {selectedOrder.returnInfo?.status && (
              <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
                <h3 className="text-xs font-mono uppercase tracking-widest text-white/40 border-b border-white/8 pb-3 mb-4 flex items-center gap-2">
                  <Undo2 size={12} /> Return Request
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/60">Status</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border font-mono ${
                      selectedOrder.returnInfo.status === 'Approved' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' :
                      selectedOrder.returnInfo.status === 'Rejected' ? 'text-red-400 bg-red-400/10 border-red-400/20' :
                      'text-violet-400 bg-violet-400/10 border-violet-400/20'
                    }`}>
                      {selectedOrder.returnInfo.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-white/60">Reason</span>
                    <span className="text-sm font-semibold">{selectedOrder.returnInfo.reason}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Return trigger button/form */}
            {canReturn && (
              <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
                {!showReturnForm ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-white/60 mb-4">Not satisfied with your order? You can request a return within 7 days.</p>
                    <button
                      onClick={() => setShowReturnForm(true)}
                      className="inline-flex items-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white text-xs font-mono uppercase tracking-widest font-semibold rounded-xl transition-all"
                    >
                      <Undo2 size={14} /> Request Return / Refund
                    </button>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-xs font-mono uppercase tracking-widest text-white/40 border-b border-white/8 pb-3 mb-5">
                      Request Return
                    </h3>
                    <ReturnRequestForm 
                      order={selectedOrder}
                      onSuccess={() => {
                        setShowReturnForm(false)
                        setReturnSuccess(true)
                        dispatch(fetchOrderById(id))
                      }}
                      onClose={() => setShowReturnForm(false)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Tracking Timeline & Bill summary */}
          <div className="space-y-6">
            
            {/* Timeline */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
              <h3 className="text-xs font-mono uppercase tracking-widest text-white/40 border-b border-white/8 pb-3 mb-5">
                Tracking Details
              </h3>
              <OrderTimeline 
                orderStatus={selectedOrder.orderStatus} 
                trackingHistory={selectedOrder.trackingHistory || []}
              />
            </div>

            {/* Bill Summary */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
              <h3 className="text-xs font-mono uppercase tracking-widest text-white/40 border-b border-white/8 pb-3 mb-4 flex items-center gap-2">
                <CreditCard size={12} /> Payment summary
              </h3>
              <div className="space-y-2.5 text-sm font-mono text-white/70">
                <div className="flex justify-between">
                  <span>Subtotal</span><span>${(selectedOrder.itemsPrice || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span><span>${(selectedOrder.shippingPrice || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b border-white/6 pb-2.5">
                  <span>Tax</span><span>${(selectedOrder.taxPrice || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white font-bold pt-1.5 text-base">
                  <span>Total</span><span>${(selectedOrder.totalPrice || 0).toFixed(2)}</span>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-white/6">
                <div className="flex items-center justify-between text-xs font-mono text-white/45">
                  <span>Method</span>
                  <span className="uppercase">{selectedOrder.paymentInfo?.method || 'COD'}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-white/45 mt-2">
                  <span>Status</span>
                  <span className={`uppercase font-semibold ${selectedOrder.isPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {selectedOrder.paymentInfo?.paymentStatus || 'Pending'}
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      <CancelOrderModal 
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelOrder}
        loading={cancelLoading}
      />
    </div>
  )
}

export default OrderDetails
