import React, { useState, useRef } from 'react'
import { X, Loader2, Camera } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { submitReturnRequest } from '../../features/orders/orderSlice'

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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Reason list */}
      <div>
        <label className="block text-[10px] font-mono uppercase tracking-widest text-atelier-gray mb-3">
          Return Reason *
        </label>
        <div className="space-y-2">
          {RETURN_REASONS.map((r) => (
            <label
              key={r}
              className={`flex items-center gap-3 p-3.5 border cursor-pointer transition-all ${
                reason === r
                  ? 'border-atelier-dark bg-atelier-dark text-white'
                  : 'border-atelier-lightgray bg-transparent text-atelier-gray hover:text-atelier-dark hover:border-atelier-gray'
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
              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                reason === r ? 'border-white bg-white' : 'border-atelier-gray/40 bg-transparent'
              }`}>
                {reason === r && <div className="w-1.5 h-1.5 rounded-full bg-atelier-dark" />}
              </div>
              <span className="text-xs font-mono uppercase tracking-widest font-semibold">{r}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Additional comments */}
      <div>
        <label className="block text-[10px] font-mono uppercase tracking-widest text-atelier-gray mb-2">
          Additional comments
        </label>
        <textarea
          value={additionalComments}
          onChange={e => setAdditionalComments(e.target.value)}
          placeholder="Please describe the issue in detail..."
          rows={3}
          className="w-full bg-transparent border border-atelier-lightgray p-3 text-xs text-atelier-dark
            placeholder-atelier-gray/30 focus:outline-none focus:border-atelier-dark resize-none transition-colors"
        />
      </div>

      {/* Photo upload */}
      <div>
        <label className="block text-[10px] font-mono uppercase tracking-widest text-atelier-gray mb-3">
          Upload Photos (up to 5)
        </label>

        {/* Previews */}
        {previews.length > 0 && (
          <div className="flex flex-wrap gap-2.5 mb-3">
            {previews.map((url, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={url}
                  alt={`Photo ${idx + 1}`}
                  className="w-20 h-20 object-cover border border-atelier-lightgray"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-700 text-white
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
              border-atelier-lightgray bg-atelier-cream/50 cursor-pointer hover:border-atelier-dark/45
              transition-all"
          >
            <Camera size={20} className="text-atelier-gray" />
            <p className="text-xs font-mono uppercase tracking-widest text-atelier-gray font-semibold">Add Image Attachment</p>
            <p className="text-[10px] text-atelier-gray/40 font-mono">{photos.length}/5 photos</p>
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

      {/* Error display */}
      {error && (
        <p className="text-xs font-mono uppercase text-rose-700 bg-rose-50 border border-rose-100 px-4 py-3">
          {error}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-atelier-lightgray text-atelier-gray text-xs font-mono
              uppercase tracking-widest hover:border-atelier-dark hover:text-atelier-dark transition-all"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!reason || returnLoading}
          className="flex-1 py-3 bg-atelier-dark hover:bg-opacity-95 text-white text-xs
            font-mono uppercase tracking-widest font-semibold disabled:opacity-40 transition-colors
            flex items-center justify-center gap-2"
        >
          {returnLoading ? (
            <><Loader2 size={13} className="animate-spin" /> Submitting</>
          ) : (
            'Request Return'
          )}
        </button>
      </div>
    </form>
  )
}

export default ReturnRequestForm
