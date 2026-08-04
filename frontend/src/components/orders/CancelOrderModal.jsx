import React, { useState } from 'react'
import { AlertTriangle, X, Loader2 } from 'lucide-react'

const CANCEL_REASONS = [
  'Change of mind',
  'Found a better price elsewhere',
  'Ordered by mistake',
  'Delivery time too long',
  'Payment issue',
  'Other',
]

const CancelOrderModal = ({ isOpen, onClose, onConfirm, loading }) => {
  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')

  if (!isOpen) return null

  const finalReason = reason === 'Other' ? customReason : reason

  const handleSubmit = () => {
    if (!reason) return
    if (reason === 'Other' && !customReason.trim()) return
    onConfirm(finalReason)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl
            animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-white/40 hover:text-white/80
              hover:bg-white/5 transition-colors"
          >
            <X size={16} />
          </button>

          {/* Icon */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Cancel Order?</h3>
              <p className="text-xs text-white/40 mt-0.5">This action cannot be undone</p>
            </div>
          </div>

          {/* Reason select */}
          <div className="mb-4">
            <label className="block text-xs font-mono uppercase tracking-widest text-white/50 mb-2">
              Reason for cancellation *
            </label>
            <div className="space-y-2">
              {CANCEL_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    reason === r
                      ? 'border-red-500/40 bg-red-500/5 text-white'
                      : 'border-white/8 bg-white/3 text-white/50 hover:border-white/15 hover:text-white/70'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${
                    reason === r
                      ? 'border-red-400 bg-red-400'
                      : 'border-white/20'
                  }`} />
                  <span className="text-sm">{r}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom reason */}
          {reason === 'Other' && (
            <div className="mb-4">
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Please describe your reason..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white
                  placeholder-white/25 focus:outline-none focus:border-white/25 resize-none"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 rounded-xl border border-white/10 bg-white/5 text-white/60
                text-sm font-medium hover:bg-white/8 hover:text-white/80 transition-colors"
            >
              Keep Order
            </button>
            <button
              onClick={handleSubmit}
              disabled={!reason || (reason === 'Other' && !customReason.trim()) || loading}
              className="flex-1 py-3 rounded-xl bg-red-500/90 text-white text-sm font-semibold
                hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors
                flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /> Cancelling…</>
              ) : (
                'Cancel Order'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default CancelOrderModal
