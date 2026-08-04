import React, { useState, useRef } from 'react'
import { UploadCloud, X, Loader2, Camera } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { submitReturnRequest, resetReturnSuccess } from '../../features/orders/orderSlice'

const RETURN_REASONS = [
  'Defective / Damaged product',
  'Wrong item received',
  'Item not as described',
  'Size / Fit issue',
  'Changed my mind',
  'Quality not as expected',
  'Other',
]

const ReturnRequestForm = ({ order, onSuccess, onClose }) => {
  const dispatch = useDispatch()
  const { returnLoading, error } = useSelector(s => s.orders)

  const [reason, setReason] = useState('')
  const [additionalComments, setAdditionalComments] = useState('')
  const [photos, setPhotos] = useState([])
  const [previews, setPreviews] = useState([])
  const fileInputRef = useRef()

  const orderId = order._id || order.id
  const items = order.orderItems || order.items || []

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    const newPhotos = [...photos, ...files].slice(0, 5)
    setPhotos(newPhotos)

    // Preview URLs
    const newPreviews = newPhotos.map((f) =>
      f instanceof File ? URL.createObjectURL(f) : f
    )
    setPreviews(newPreviews)
  }

  const removePhoto = (idx) => {
    const newPhotos = photos.filter((_, i) => i !== idx)
    const newPreviews = previews.filter((_, i) => i !== idx)
    setPhotos(newPhotos)
    setPreviews(newPreviews)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reason) return

    const formData = new FormData()
    formData.append('orderId', orderId)
    formData.append('reason', reason)
    formData.append('additionalComments', additionalComments)
    formData.append(
      'items',
      JSON.stringify(
        items.map(i => ({ product: i.product || i._id, name: i.name, quantity: i.quantity }))
      )
    )
    for (const file of photos) {
      formData.append('photos', file)
    }

    const result = await dispatch(submitReturnRequest({ formData }))
    if (result.meta.requestStatus === 'fulfilled') {
      onSuccess?.()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Reason */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-widest text-white/50 mb-2">
          Return reason *
        </label>
        <div className="space-y-2">
          {RETURN_REASONS.map((r) => (
            <label
              key={r}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                reason === r
                  ? 'border-violet-500/40 bg-violet-500/5 text-white'
                  : 'border-white/8 bg-white/3 text-white/50 hover:border-white/15 hover:text-white/70'
              }`}
            >
              <input
                type="radio"
                name="returnReason"
                value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${
                reason === r ? 'border-violet-400 bg-violet-400' : 'border-white/20'
              }`} />
              <span className="text-sm">{r}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Additional comments */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-widest text-white/50 mb-2">
          Additional comments
        </label>
        <textarea
          value={additionalComments}
          onChange={e => setAdditionalComments(e.target.value)}
          placeholder="Describe the issue in more detail..."
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white
            placeholder-white/25 focus:outline-none focus:border-white/25 resize-none transition-colors"
        />
      </div>

      {/* Photo upload */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-widest text-white/50 mb-2">
          Upload photos (up to 5)
        </label>

        {/* Previews */}
        {previews.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {previews.map((url, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={url}
                  alt={`Photo ${idx + 1}`}
                  className="w-20 h-20 object-cover rounded-xl ring-1 ring-white/10"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white
                    flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        {photos.length < 5 && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed
              border-white/10 rounded-xl bg-white/3 cursor-pointer hover:border-white/20
              hover:bg-white/5 transition-all"
          >
            <Camera size={22} className="text-white/30" />
            <p className="text-sm text-white/40">Click to add photos</p>
            <p className="text-xs text-white/25">{photos.length}/5 added</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/10 bg-white/5 text-white/60
              text-sm font-medium hover:bg-white/8 hover:text-white/80 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!reason || returnLoading}
          className="flex-1 py-3 rounded-xl bg-violet-600/90 hover:bg-violet-600 text-white text-sm
            font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors
            flex items-center justify-center gap-2"
        >
          {returnLoading ? (
            <><Loader2 size={15} className="animate-spin" /> Submitting…</>
          ) : (
            'Submit Return'
          )}
        </button>
      </div>
    </form>
  )
}

export default ReturnRequestForm
