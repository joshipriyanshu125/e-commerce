import React, { useState } from "react";
import api from "../../services/axiosInstance";
import { X, Download, Trash2, Undo2 } from "lucide-react";

const OrderDetailsDrawer = ({ order, open, onClose, onOrderUpdated }) => {
  const [uploading, setUploading] = useState(false);

  if (!open || !order) return null;

  const handleDownloadInvoice = async () => {
    try {
      const orderId = order._id || order.id;
      const res = await api.post("invoice", { orderId });

      if (res.data && res.data.filePath) {
        const invoiceId = res.data.invoice._id || res.data.invoice.id;
        if (invoiceId) {
          const link = document.createElement("a");
          link.href = `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/api/invoice/download?id=${encodeURIComponent(invoiceId)}`;
          link.click();
        } else {
          alert("Invoice generated but could not locate download");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate invoice");
    }
  };

  const handleCancel = async () => {
    try {
      const orderId = order._id || order.id;
      const res = await api.put(`orders/${orderId}/cancel`);
      alert("Order cancelled");
      if (onOrderUpdated && res.data && res.data.order) {
        onOrderUpdated(res.data.order);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert("Could not cancel order");
    }
  };

  const handleReturn = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const form = new FormData();
    form.append("orderId", order._id || order.id);

    const itemsArr = order.items || order.orderItems || [];
    form.append(
      "items",
      JSON.stringify(
        itemsArr.map((i) => ({
          product: i.name || i.product,
          quantity: i.quantity,
        }))
      )
    );

    for (const f of files) {
      form.append("photos", f);
    }

    try {
      setUploading(true);
      await api.post("returns", form);
      alert("Return requested successfully! Check the Returns tab.");
      onClose();
    } catch (err) {
      console.error(err);
      alert("Return request failed");
    } finally {
      setUploading(false);
    }
  };

  const items = order.items || order.orderItems || [];
  
  // Calculate subtotal
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-atelier-dark/20 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl transition-transform duration-300 transform translate-x-0 border-l border-atelier-lightgray flex flex-col h-full overflow-hidden">
        
        <div className="flex items-center justify-between border-b border-atelier-lightgray px-6 py-5 bg-white shrink-0">
          <div>
            <h2 className="text-xl font-serif text-atelier-dark">Order Details</h2>
            <p className="text-xs font-mono tracking-widest text-atelier-gray uppercase mt-1">ID: {order._id || order.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-atelier-gray transition hover:text-atelier-dark"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-atelier-cream/10">
          
          <div className="space-y-4">
            <h3 className="text-sm font-mono tracking-widest text-atelier-dark uppercase border-b border-atelier-lightgray/50 pb-2">Items summary</h3>
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item._id || item.id || item.product || item.name}
                  className="flex items-start justify-between"
                >
                  <div className="flex items-start gap-4">
                    {item.image && <img src={item.image} alt={item.name} className="w-16 h-16 object-cover bg-atelier-lightgray" />}
                    <div>
                      <span className="block text-sm font-serif text-atelier-dark">{item.name || item.product || "Item"}</span>
                      <span className="block text-xs font-mono text-atelier-gray uppercase mt-1">Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <span className="text-sm font-mono text-atelier-dark">${((item.price || 0) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-mono tracking-widest text-atelier-dark uppercase border-b border-atelier-lightgray/50 pb-2">Receipt</h3>
            <div className="space-y-2 text-sm font-mono text-atelier-dark">
              <div className="flex justify-between text-atelier-gray"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-atelier-gray"><span>Shipping</span><span>${order.shippingPrice?.toFixed(2) || '0.00'}</span></div>
              <div className="flex justify-between text-atelier-gray"><span>Tax</span><span>${order.taxPrice?.toFixed(2) || '0.00'}</span></div>
              <div className="flex justify-between font-bold pt-2 border-t border-atelier-lightgray/50">
                <span>Total</span><span>${(order.totalPrice || order.total || subtotal)?.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3 pt-4">
            <button
              onClick={handleDownloadInvoice}
              className="w-full flex items-center justify-center gap-2 bg-atelier-dark px-4 py-3 text-sm font-mono uppercase tracking-widest text-white transition hover:opacity-90"
            >
              <Download size={16} /> Download Invoice
            </button>
            
            {order.orderStatus !== 'Shipped' && order.orderStatus !== 'Delivered' && order.orderStatus !== 'Cancelled' && order.orderStatus !== 'Out for Delivery' && (
              <button
                onClick={handleCancel}
                className="w-full flex items-center justify-center gap-2 border border-atelier-dark bg-white px-4 py-3 text-sm font-mono uppercase tracking-widest text-atelier-dark transition hover:bg-atelier-lightgray"
              >
                <Trash2 size={16} /> Cancel Order
              </button>
            )}
          </div>

          {(order.orderStatus === 'Delivered' || order.orderStatus === 'Shipped') && (
            <div className="pt-6 border-t border-atelier-lightgray">
              <h3 className="text-sm font-mono tracking-widest text-atelier-dark uppercase mb-2">Request Return</h3>
              <p className="text-xs text-atelier-gray mb-4">Upload photos of the items to initiate a return request.</p>
              
              <div className="relative border-2 border-dashed border-atelier-lightgray bg-white p-6 text-center hover:bg-atelier-cream/50 transition">
                <input
                  type="file"
                  multiple
                  onChange={handleReturn}
                  disabled={uploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Undo2 size={24} className="mx-auto text-atelier-gray mb-2" />
                <span className="block text-sm font-serif text-atelier-dark">
                  {uploading ? "Uploading..." : "Click or drag photos here"}
                </span>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default OrderDetailsDrawer;