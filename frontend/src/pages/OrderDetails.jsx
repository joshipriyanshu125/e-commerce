import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { 
  ArrowLeft, Download, Trash2, Undo2, Truck, 
  MapPin, CreditCard, Calendar, ShieldCheck, Mail, Phone, Receipt
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
        setToastMessage(`Fulfillment updated: ${data.status}`)
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
      <div className="min-h-screen bg-atelier-beige text-atelier-dark py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <OrderDetailSkeleton />
        </div>
      </div>
    )
  }

  if (orderDetailError || !selectedOrder) {
    return (
      <div className="min-h-screen bg-atelier-beige text-atelier-dark flex flex-col items-center justify-center p-4">
        <h3 className="text-xl font-serif font-medium mb-1">Failed to load order details</h3>
        <p className="text-xs text-atelier-gray font-mono uppercase mb-6">{orderDetailError || 'Order not found'}</p>
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center gap-2 px-5 py-2.5 border border-atelier-dark font-mono text-[10px] uppercase tracking-widest text-atelier-dark hover:bg-atelier-dark hover:text-white transition-all"
        >
          <ArrowLeft size={14} /> Back to My Orders
        </button>
      </div>
    )
  }

  const items = selectedOrder.orderItems || selectedOrder.items || []
  const canCancel = ["Pending", "Confirmed"].includes(selectedOrder.orderStatus)
  const canReturn = selectedOrder.orderStatus === "Delivered" && !selectedOrder.returnInfo?.status

  return (
    <div className="min-h-screen bg-atelier-beige text-atelier-dark py-12 px-4 relative overflow-hidden font-sans">
      
      {/* Real-time Update Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-atelier-dark text-white px-5 py-3 border border-white/10 shadow-2xl animate-fade-in flex items-center gap-3">
          <ShieldCheck size={16} className="text-atelier-accent" />
          <span className="text-xs font-mono uppercase tracking-widest">{toastMessage}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <button
          onClick={() => navigate('/orders')}
          className="group flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-atelier-gray hover:text-atelier-dark mb-8 transition-colors"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Back to Orders
        </button>

        {/* Order Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-atelier-lightgray pb-6 mb-8">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-serif font-semibold">
                ORDER #{selectedOrder._id.slice(-8).toUpperCase()}
              </h1>
              <StatusBadge status={selectedOrder.orderStatus} />
            </div>
            <p className="text-[11px] text-atelier-gray font-mono uppercase tracking-wider mt-1.5 flex items-center gap-2">
              <Calendar size={13} />
              Placed {new Date(selectedOrder.createdAt).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/invoice/${id}`)}
              className="flex items-center gap-2 px-4 py-2.5 bg-atelier-cream border border-atelier-lightgray text-atelier-gray hover:text-atelier-dark hover:border-atelier-dark text-[10px] font-mono uppercase tracking-wider transition-all"
            >
              <Receipt size={13} /> View Invoice
            </button>
            <button
              onClick={handleDownloadInvoice}
              className="flex items-center gap-2 px-4 py-2.5 bg-atelier-cream border border-atelier-lightgray text-atelier-gray hover:text-atelier-dark hover:border-atelier-dark text-[10px] font-mono uppercase tracking-wider transition-all"
            >
              <Download size={13} /> Download Invoice
            </button>
            {canCancel && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 border border-rose-100 text-rose-800 hover:bg-rose-100 text-[10px] font-mono uppercase tracking-wider transition-all"
              >
                <Trash2 size={13} /> Cancel Order
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main items, shipping & payment details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Products grid */}
            <div className="bg-atelier-cream border border-atelier-lightgray p-6">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-atelier-gray border-b border-atelier-lightgray/55 pb-3 mb-4">
                Items Summary
              </h3>
              <div className="divide-y divide-atelier-lightgray/40">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    <img 
                      src={item.image || '/placeholder.jpg'} 
                      alt={item.name} 
                      className="w-16 h-16 object-cover bg-atelier-beige border border-atelier-lightgray shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif text-base text-atelier-dark font-medium truncate">{item.name}</h4>
                      <p className="text-[10px] text-atelier-gray font-mono mt-1 uppercase tracking-wider">
                        QTY: {item.quantity} {item.size && `| SIZE: ${item.size}`} {item.color && `| COLOR: ${item.color}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-mono font-semibold text-atelier-dark">${((item.price || 0) * item.quantity).toFixed(2)}</p>
                      <p className="text-[10px] text-atelier-gray/60 font-mono mt-0.5">${(item.price || 0).toFixed(2)} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Address & contact flatlay */}
            <div className="bg-atelier-cream border border-atelier-lightgray p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-atelier-gray border-b border-atelier-lightgray/55 pb-3 mb-4 flex items-center gap-1.5">
                  <MapPin size={12} /> Shipping Address
                </h3>
                <p className="text-sm font-serif text-atelier-dark font-semibold">{selectedOrder.shippingInfo?.fullName}</p>
                <p className="text-xs text-atelier-gray mt-2 leading-relaxed">
                  {selectedOrder.shippingInfo?.address}<br />
                  {selectedOrder.shippingInfo?.city}, {selectedOrder.shippingInfo?.state || ''} {selectedOrder.shippingInfo?.postalCode}<br />
                  {selectedOrder.shippingInfo?.country}
                </p>
              </div>
              <div>
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-atelier-gray border-b border-atelier-lightgray/55 pb-3 mb-4 flex items-center gap-1.5">
                  <Phone size={12} /> Contact Info
                </h3>
                <p className="text-xs text-atelier-gray flex items-center gap-2">
                  <Mail size={12} className="text-atelier-gray/45" />
                  {selectedOrder.user?.email || 'N/A'}
                </p>
                <p className="text-xs text-atelier-gray mt-2.5 flex items-center gap-2">
                  <Phone size={12} className="text-atelier-gray/45" />
                  {selectedOrder.shippingInfo?.phone || 'N/A'}
                </p>
              </div>
            </div>

            {/* Courier Info */}
            {selectedOrder.courierName && (
              <div className="bg-atelier-cream border border-atelier-lightgray p-6">
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-atelier-gray border-b border-atelier-lightgray/55 pb-3 mb-4 flex items-center gap-1.5">
                  <Truck size={12} /> Courier Tracking
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[9px] font-mono text-atelier-gray/65 uppercase tracking-wider block">Carrier</span>
                    <span className="text-xs font-semibold text-atelier-dark mt-1 block">{selectedOrder.courierName}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-atelier-gray/65 uppercase tracking-wider block">Tracking ID</span>
                    <span className="text-xs font-mono font-semibold text-atelier-dark mt-1 block tracking-widest">{selectedOrder.trackingNumber}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-atelier-gray/65 uppercase tracking-wider block">Est. Delivery</span>
                    <span className="text-xs font-semibold text-atelier-dark mt-1 block">
                      {selectedOrder.estimatedDelivery 
                        ? new Date(selectedOrder.estimatedDelivery).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Pending'
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Return info panel */}
            {selectedOrder.returnInfo?.status && (
              <div className="bg-atelier-cream border border-atelier-lightgray p-6">
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-atelier-gray border-b border-atelier-lightgray/55 pb-3 mb-4 flex items-center gap-1.5">
                  <Undo2 size={12} /> Return Request
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono uppercase text-atelier-gray">Status</span>
                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 uppercase tracking-wider border ${
                      selectedOrder.returnInfo.status === 'Approved' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' :
                      selectedOrder.returnInfo.status === 'Rejected' ? 'text-rose-700 bg-rose-50 border-rose-100' :
                      'text-violet-855 bg-violet-50 border-violet-100'
                    }`}>
                      {selectedOrder.returnInfo.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono uppercase text-atelier-gray">Reason</span>
                    <span className="text-xs font-serif font-medium text-atelier-dark">{selectedOrder.returnInfo.reason}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Return form trigger */}
            {canReturn && (
              <div className="bg-atelier-cream border border-atelier-lightgray p-6">
                {!showReturnForm ? (
                  <div className="text-center py-4">
                    <p className="text-xs text-atelier-gray font-mono uppercase tracking-wider mb-4">Problem with your product?</p>
                    <button
                      onClick={() => setShowReturnForm(true)}
                      className="px-6 py-3 bg-atelier-dark text-white font-mono text-xs tracking-widest uppercase hover:opacity-90 transition-opacity"
                    >
                      File Return Request
                    </button>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-atelier-gray border-b border-atelier-lightgray/55 pb-3 mb-5">
                      Request Return
                    </h3>
                    <ReturnRequestForm 
                      order={selectedOrder}
                      onSuccess={() => {
                        setShowReturnForm(false)
                        dispatch(fetchOrderById(id))
                      }}
                      onClose={() => setShowReturnForm(false)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stepper Timeline & Bill breakdown */}
          <div className="space-y-6">
            
            {/* Stepper */}
            <div className="bg-atelier-cream border border-atelier-lightgray p-6">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-atelier-gray border-b border-atelier-lightgray/55 pb-3 mb-5">
                Fulfillment Path
              </h3>
              <OrderTimeline 
                orderStatus={selectedOrder.orderStatus} 
                trackingHistory={selectedOrder.trackingHistory || []}
              />
            </div>

            {/* Bill Info */}
            <div className="bg-atelier-cream border border-atelier-lightgray p-6">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-atelier-gray border-b border-atelier-lightgray/55 pb-3 mb-4 flex items-center gap-1.5">
                <CreditCard size={12} /> Bill Details
              </h3>
              <div className="space-y-2.5 text-xs font-mono text-atelier-gray">
                <div className="flex justify-between">
                  <span>Subtotal</span><span>${(selectedOrder.itemsPrice || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span><span>${(selectedOrder.shippingPrice || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b border-atelier-lightgray/50 pb-2.5">
                  <span>Tax</span><span>${(selectedOrder.taxPrice || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-atelier-dark font-bold pt-1.5 text-sm">
                  <span>Total Amount</span><span>${(selectedOrder.totalPrice || 0).toFixed(2)}</span>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-atelier-lightgray/50">
                <div className="flex items-center justify-between text-[10px] font-mono text-atelier-gray/70">
                  <span>Method</span>
                  <span className="uppercase text-atelier-dark font-semibold">{selectedOrder.paymentInfo?.method || 'COD'}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-atelier-gray/70 mt-2">
                  <span>Status</span>
                  <span className={`uppercase font-semibold ${selectedOrder.isPaid ? 'text-emerald-700' : 'text-amber-800'}`}>
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
