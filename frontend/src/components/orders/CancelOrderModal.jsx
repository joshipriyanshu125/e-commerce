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
        className="fixed inset-0 z-50 bg-atelier-dark/40 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative bg-atelier-cream border border-atelier-lightgray p-8 w-full max-w-md shadow-xl
            animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1 rounded hover:bg-atelier-lightgray/40 text-atelier-gray transition-colors"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} className="text-rose-700" />
            </div>
            <div>
              <h3 className="text-lg font-serif text-atelier-dark font-semibold">Cancel Order</h3>
              <p className="text-xs text-atelier-gray font-mono uppercase tracking-wider mt-1">This operation is permanent</p>
            </div>
          </div>

          {/* Reason radio buttons */}
          <div className="mb-6 space-y-2">
            <label className="block text-[10px] font-mono uppercase tracking-widest text-atelier-gray mb-3">
              Reason for cancellation *
            </label>
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 no-scrollbar">
              {CANCEL_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-3 p-3 border cursor-pointer transition-all ${
                    reason === r
                      ? 'border-atelier-dark bg-atelier-dark text-white'
                      : 'border-atelier-lightgray bg-transparent text-atelier-gray hover:text-atelier-dark hover:border-atelier-gray'
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
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                    reason === r ? 'border-white bg-white' : 'border-atelier-gray/40 bg-transparent'
                  }`}>
                    {reason === r && <div className="w-1.5 h-1.5 rounded-full bg-atelier-dark" />}
                  </div>
                  <span className="text-xs font-mono uppercase tracking-wider font-semibold">{r}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom textarea */}
          {reason === 'Other' && (
            <div className="mb-6 animate-fade-in">
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Describe your cancellation reason..."
                rows={3}
                className="w-full bg-transparent border border-atelier-lightgray p-3 text-xs text-atelier-dark
                  placeholder-atelier-gray/30 focus:outline-none focus:border-atelier-dark resize-none transition-colors"
              />
            </div>
          )}

          {/* Modal buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 border border-atelier-lightgray text-atelier-gray text-xs font-mono
                uppercase tracking-widest hover:border-atelier-dark hover:text-atelier-dark transition-all"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={!reason || (reason === 'Other' && !customReason.trim()) || loading}
              className="flex-1 py-3 bg-rose-700 hover:bg-rose-800 disabled:bg-rose-300 text-white text-xs
                font-mono uppercase tracking-widest font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 size={13} className="animate-spin" /> Processing</>
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
