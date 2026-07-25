import React, { useState } from "react";
import api from "../../utils/api";
import { X, Download, Trash2 } from "lucide-react";

const OrderDetailsDrawer = ({ order, open, onClose }) => {
  const [uploading, setUploading] = useState(false);

  if (!open || !order) return null;

  const handleDownloadInvoice = async () => {
    try {
      const orderId = order._id || order.id;

      const res = await api.post("invoice", {
        orderId,
      });

      if (res.data && res.data.filePath) {
        const invoiceId = res.data.invoice._id || res.data.invoice.id;

        if (invoiceId) {
          const link = document.createElement("a");
          link.href = `${import.meta.env.VITE_API_URL}/invoice/download?id=${encodeURIComponent(invoiceId)}`;
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

      await api.put(`/orders/${orderId}/cancel`);

      alert("Order cancelled");
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

    form.append(
      "items",
      JSON.stringify(
        order.items.map((i) => ({
          product: i.name,
          quantity: i.quantity,
        }))
      )
    );

    for (const f of files) {
      form.append("photos", f);
    }

    try {
      setUploading(true);

      await api.post("returns", form, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Return requested");
      onClose();
    } catch (err) {
      console.error(err);
      alert("Return request failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 py-6 sm:items-center sm:px-6">
      <div className="w-full max-w-2xl overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Order Details</h2>
            <p className="text-sm text-slate-500">Order ID: {order._id || order.id}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Status</p>
            <p className="mt-1 text-sm text-slate-600">{order.status || "Pending"}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Items</p>
              <p className="text-sm text-slate-500">{(order.items || []).length} item(s)</p>
            </div>
            <div className="mt-3 space-y-3">
              {(order.items || []).map((item) => (
                <div
                  key={item._id || item.id || item.product || item.name}
                  className="flex items-center justify-between rounded-2xl bg-white px-3 py-3 shadow-sm"
                >
                  <span className="text-sm text-slate-700">{item.name || item.product || "Item"}</span>
                  <span className="text-sm text-slate-500">x{item.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleDownloadInvoice}
              className="inline-flex items-center justify-center gap-2 rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <Download size={16} /> Download Invoice
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center justify-center gap-2 rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              <Trash2 size={16} /> Cancel Order
            </button>
          </div>

          <div className="rounded-3xl border border-slate-200 p-4">
            <label className="block text-sm font-semibold text-slate-900">Return photos</label>
            <input
              type="file"
              multiple
              onChange={handleReturn}
              disabled={uploading}
              className="mt-3 w-full rounded-3xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-700 focus:border-slate-900 focus:outline-none"
            />
            {uploading && <p className="mt-2 text-sm text-slate-500">Uploading files...</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsDrawer;