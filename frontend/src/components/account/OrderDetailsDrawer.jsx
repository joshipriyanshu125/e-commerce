import React, { useState } from 'react'
import axios from 'axios'
import { X, Download, Trash2 } from 'lucide-react'

const OrderDetailsDrawer = ({ order, open, onClose }) => {
  const [uploading, setUploading] = useState(false)

  if (!open || !order) return null

  const handleDownloadInvoice = async () => {
    try {
      const orderId = order._id || order.id
      const res = await axios.post('/api/invoice', { orderId })
      if (res.data && res.data.filePath) {
        // backend returns invoice metadata; use its id to download
        const invoiceId = res.data.invoice._id || res.data.invoice.id
        if (invoiceId) {
          const link = document.createElement('a')
          link.href = `/api/invoice/download?id=${encodeURIComponent(invoiceId)}`
          link.click()
        } else {
          alert('Invoice generated but could not locate download')
        }
      }
    } catch (err) {
      console.error(err)
      alert('Failed to generate invoice')
    }
  }

  const handleCancel = async () => {
    try {
      const orderId = order._id || order.id
      await axios.put(`/api/orders/${orderId}/cancel`)
      alert('Order cancelled')
      onClose()
    } catch (err) {
      console.error(err)
      alert('Could not cancel order')
    }
  }

  const handleReturn = async (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const form = new FormData()
    form.append('orderId', order._id || order.id)
    form.append('items', JSON.stringify(order.items.map(i => ({ product: i.name, quantity: i.quantity }))))
    for (const f of files) form.append('photos', f)

    try {
      setUploading(true)
      await axios.post('/api/returns', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      alert('Return requested')
      onClose()
    } catch (err) {
      console.error(err)
      alert('Return request failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="w-full max-w-2xl ml-auto h-full bg-white shadow-xl p-6 overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg">Order {order.id}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-mono text-xs uppercase text-atelier-gray">Items</h4>
            <div className="divide-y mt-2">
              {order.items.map((it, i) => (
                <div key={i} className="py-3 flex justify-between">
                  <div>
                    <div className="font-serif">{it.name}</div>
                    <div className="text-xs text-atelier-gray">Qty: {it.quantity} {it.size ? `/ Size: ${it.size}` : ''}</div>
                  </div>
                  <div className="font-mono">${it.price * it.quantity}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-3 border-t">
            <strong>Total</strong>
            <strong>${order.total}</strong>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button onClick={handleDownloadInvoice} className="btn-atelier-outline flex items-center gap-2"><Download size={14}/> Download Invoice</button>
            {order.status !== 'Shipped' && order.status !== 'Delivered' && (
              <button onClick={handleCancel} className="px-4 py-2 bg-red-600 text-white rounded flex items-center gap-2"><Trash2 size={14}/> Cancel Order</button>
            )}
          </div>

          <div className="pt-4">
            <label className="block text-xs font-mono text-atelier-gray uppercase mb-2">Request Return (upload photos)</label>
            <input type="file" multiple accept="image/*" onChange={handleReturn} disabled={uploading} />
          </div>
        </div>
      </div>
      <div className="flex-1 bg-black/30" onClick={onClose}></div>
    </div>
  )
}

export default OrderDetailsDrawer
