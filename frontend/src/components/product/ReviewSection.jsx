import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Star, ThumbsUp, Flag, ChevronDown, ChevronUp,
  ShieldCheck, ImageIcon, X, Upload, Loader2,
} from 'lucide-react'
import api from '../../services/axiosInstance'

// ─── Helper: render star row ─────────────────────────────────────────────────
const Stars = ({ value, size = 14, interactive = false, onChange }) => (
  <div className="flex" aria-label={`${value} stars`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <button
        key={i}
        type="button"
        onClick={() => interactive && onChange && onChange(i)}
        className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
        aria-label={interactive ? `Rate ${i} star${i > 1 ? 's' : ''}` : undefined}
        disabled={!interactive}
      >
        <Star
          size={size}
          fill={i <= Math.round(value) ? 'currentColor' : 'none'}
          className={i <= Math.round(value) ? 'text-amber-500' : 'text-atelier-lightgray'}
          strokeWidth={1.5}
        />
      </button>
    ))}
  </div>
)

// ─── Rating Distribution Bar ─────────────────────────────────────────────────
const DistributionBar = ({ label, count, total, onClick, active }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 w-full text-left group ${active ? 'opacity-100' : 'opacity-70 hover:opacity-100'} transition-opacity`}
    >
      <span className="text-xs font-mono text-atelier-dark w-10 shrink-0">{label} ★</span>
      <div className="flex-1 h-1.5 bg-atelier-lightgray/30 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${active ? 'bg-amber-500' : 'bg-atelier-dark/40 group-hover:bg-atelier-dark/60'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-atelier-gray w-6 text-right shrink-0">{count}</span>
    </button>
  )
}

// ─── Verified Purchase Badge ──────────────────────────────────────────────────
const VerifiedBadge = () => (
  <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
    <ShieldCheck size={9} />
    Verified Purchase
  </span>
)

// ─── Single Review Card ───────────────────────────────────────────────────────
const ReviewCard = ({ review, currentUserId, productId, onVoteToggle, onReported, onDeleted }) => {
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount || 0)
  const [votedHelpful, setVotedHelpful] = useState(review.votedHelpful || false)
  const [reporting, setReporting] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [lightboxImg, setLightboxImg] = useState(null)

  const isOwner = currentUserId && review.user?._id?.toString() === currentUserId?.toString()

  const handleHelpful = async () => {
    if (!currentUserId) { alert('Please log in to vote.'); return }
    try {
      setLoading(true)
      const res = await api.post(`reviews/${review._id}/helpful`, { productId })
      if (res.data.success) {
        setHelpfulCount(res.data.helpfulCount)
        setVotedHelpful(res.data.votedHelpful)
        if (onVoteToggle) onVoteToggle(review._id, res.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReport = async (e) => {
    e.preventDefault()
    if (!reportReason.trim()) return
    try {
      setLoading(true)
      await api.post(`reviews/${review._id}/report`, { productId, reason: reportReason })
      setReporting(false)
      setReportReason('')
      if (onReported) onReported(review._id)
    } catch (err) {
      alert(err.response?.data?.message || 'Report failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete your review?')) return
    try {
      setLoading(true)
      await api.delete(`reviews/${review._id}`, { data: { productId } })
      if (onDeleted) onDeleted(review._id)
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed')
    } finally {
      setLoading(false)
    }
  }

  const PREVIEW_LENGTH = 200
  const longComment = review.comment.length > PREVIEW_LENGTH

  return (
    <article className="py-6 first:pt-0 space-y-3" aria-label={`Review by ${review.name}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-mono text-xs text-atelier-dark font-semibold">{review.name}</p>
          <Stars value={review.rating} size={12} />
          {review.title && (
            <p className="text-sm font-medium text-atelier-dark font-sans">{review.title}</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {review.isVerifiedPurchase && <VerifiedBadge />}
            <span className="text-[10px] font-mono text-atelier-gray">
              {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Comment */}
      <div className="text-xs sm:text-sm text-atelier-gray font-light leading-relaxed font-sans">
        {longComment && !expanded ? (
          <>
            <span>{review.comment.slice(0, PREVIEW_LENGTH)}… </span>
            <button type="button" onClick={() => setExpanded(true)} className="text-atelier-dark font-medium hover:underline inline-flex items-center gap-0.5 text-xs">
              Read more <ChevronDown size={12} />
            </button>
          </>
        ) : (
          <>
            <span>{review.comment}</span>
            {longComment && (
              <button type="button" onClick={() => setExpanded(false)} className="ml-1 text-atelier-dark font-medium hover:underline inline-flex items-center gap-0.5 text-xs">
                Show less <ChevronUp size={12} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Review images */}
      {review.images && review.images.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {review.images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setLightboxImg(img.url)}
              className="h-16 w-16 sm:h-20 sm:w-20 rounded-md border border-atelier-lightgray/40 overflow-hidden bg-atelier-cream hover:scale-105 transition-transform"
              aria-label={`Review image ${idx + 1}`}
            >
              <img src={img.url} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {/* Admin reply */}
      {review.reply && (
        <div className="ml-3 pl-3 border-l-2 border-atelier-dark/20 py-2 text-xs text-atelier-gray font-light leading-relaxed">
          <span className="font-mono font-semibold text-[10px] text-atelier-dark uppercase tracking-wider block mb-1">Atelier Response</span>
          {review.reply}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-4 pt-1">
        <button
          type="button"
          onClick={handleHelpful}
          disabled={loading}
          className={`inline-flex items-center gap-1.5 text-[11px] font-mono transition-colors ${
            votedHelpful ? 'text-atelier-dark font-semibold' : 'text-atelier-gray hover:text-atelier-dark'
          }`}
          aria-label="Mark as helpful"
          aria-pressed={votedHelpful}
        >
          <ThumbsUp size={12} fill={votedHelpful ? 'currentColor' : 'none'} />
          Helpful ({helpfulCount})
        </button>

        {currentUserId && !isOwner && (
          <button
            type="button"
            onClick={() => setReporting(true)}
            className="inline-flex items-center gap-1 text-[11px] font-mono text-atelier-gray hover:text-red-500 transition-colors"
            aria-label="Report review"
          >
            <Flag size={11} />
            Report
          </button>
        )}

        {isOwner && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="text-[11px] font-mono text-atelier-gray hover:text-red-500 transition-colors ml-auto"
            aria-label="Delete your review"
          >
            Delete
          </button>
        )}
      </div>

      {/* Report form */}
      {reporting && (
        <form onSubmit={handleReport} className="border border-atelier-lightgray/40 p-3 rounded-md bg-atelier-cream/60 space-y-2" role="dialog" aria-label="Report review">
          <p className="text-xs font-mono uppercase tracking-wider text-atelier-gray">Reason for report</p>
          <select
            value={reportReason}
            onChange={e => setReportReason(e.target.value)}
            required
            className="w-full bg-white border border-atelier-lightgray py-1.5 px-2 text-xs focus:outline-none focus:border-atelier-dark"
            aria-label="Select report reason"
          >
            <option value="">Select a reason</option>
            <option value="spam">Spam or advertising</option>
            <option value="inappropriate">Inappropriate content</option>
            <option value="fake">Fake or misleading review</option>
            <option value="off_topic">Off-topic</option>
            <option value="other">Other</option>
          </select>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="px-3 py-1.5 bg-atelier-dark text-white text-xs font-mono rounded transition-opacity hover:opacity-90 disabled:opacity-50">
              {loading ? 'Submitting…' : 'Submit'}
            </button>
            <button type="button" onClick={() => setReporting(false)} className="px-3 py-1.5 border border-atelier-lightgray text-xs font-mono rounded hover:border-atelier-dark transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Image lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <button
            type="button"
            onClick={() => setLightboxImg(null)}
            className="absolute top-4 right-4 text-white/60 hover:text-white"
            aria-label="Close image preview"
          >
            <X size={24} />
          </button>
          <img
            src={lightboxImg}
            alt="Review image"
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </article>
  )
}

// ─── Write Review Form ────────────────────────────────────────────────────────
const WriteReviewForm = ({ productId, onSuccess, onCancel }) => {
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files)
    const valid = selected.filter(f => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024)
    if (valid.length !== selected.length) {
      setError('Only images up to 5 MB are accepted')
    }
    if (files.length + valid.length > 5) {
      setError('Maximum 5 images per review')
      return
    }
    const newPreviews = valid.map(f => URL.createObjectURL(f))
    setFiles(prev => [...prev, ...valid])
    setPreviews(prev => [...prev, ...newPreviews])
  }

  const removeFile = (idx) => {
    URL.revokeObjectURL(previews[idx])
    setFiles(prev => prev.filter((_, i) => i !== idx))
    setPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!comment.trim()) { setError('Please write a comment'); return }

    const fd = new FormData()
    fd.append('productId', productId)
    fd.append('rating', rating)
    fd.append('title', title)
    fd.append('comment', comment)
    files.forEach(f => fd.append('images', f))

    try {
      setSubmitting(true)
      const res = await api.post('reviews', fd)
      if (res.data.success) {
        previews.forEach(p => URL.revokeObjectURL(p))
        onSuccess && onSuccess()
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-atelier-lightgray p-6 bg-atelier-cream/40 space-y-4" aria-label="Write a review form">
      <h3 className="font-mono text-sm tracking-widest uppercase text-atelier-dark font-semibold border-b border-atelier-lightgray pb-2">
        Write a Review
      </h3>

      {error && (
        <p className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded" role="alert">{error}</p>
      )}

      {/* Star rating */}
      <div className="space-y-1">
        <label className="block text-xs font-mono tracking-wider text-atelier-gray uppercase">
          Your Rating <span className="text-red-500">*</span>
        </label>
        <Stars value={rating} size={22} interactive onChange={setRating} />
      </div>

      {/* Title */}
      <div className="space-y-1">
        <label htmlFor="review-title" className="block text-xs font-mono tracking-wider text-atelier-gray uppercase">
          Review Title
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Summarise your experience"
          maxLength={100}
          className="w-full bg-atelier-beige border border-atelier-lightgray py-2 px-3 text-xs focus:outline-none focus:border-atelier-dark"
        />
      </div>

      {/* Comment */}
      <div className="space-y-1">
        <label htmlFor="review-comment" className="block text-xs font-mono tracking-wider text-atelier-gray uppercase">
          Your Review <span className="text-red-500">*</span>
        </label>
        <textarea
          id="review-comment"
          rows={4}
          required
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Tell others about your experience with this product…"
          className="w-full bg-atelier-beige border border-atelier-lightgray py-2 px-3 text-xs focus:outline-none focus:border-atelier-dark resize-none"
        />
      </div>

      {/* Image upload */}
      <div className="space-y-2">
        <label className="block text-xs font-mono tracking-wider text-atelier-gray uppercase">
          Add Photos <span className="text-atelier-gray/60">(optional, max 5)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {previews.map((src, idx) => (
            <div key={idx} className="relative h-16 w-16 rounded-md overflow-hidden border border-atelier-lightgray/40">
              <img src={src} alt={`Preview ${idx + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-black/60 text-white flex items-center justify-center"
                aria-label={`Remove image ${idx + 1}`}
              >
                <X size={8} />
              </button>
            </div>
          ))}
          {files.length < 5 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="h-16 w-16 rounded-md border-2 border-dashed border-atelier-lightgray/60 hover:border-atelier-dark/40 flex flex-col items-center justify-center gap-1 text-atelier-gray hover:text-atelier-dark transition-colors"
              aria-label="Add photo"
            >
              <Upload size={14} />
              <span className="text-[9px] font-mono uppercase">Add</span>
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFiles}
          aria-label="Upload review images"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-grow py-2.5 bg-atelier-dark text-white font-mono text-xs tracking-widest uppercase hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {submitting ? <><Loader2 size={12} className="animate-spin" /> Submitting…</> : 'Post Review'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="py-2.5 px-4 border border-atelier-lightgray font-mono text-xs tracking-widest uppercase hover:border-atelier-dark transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ─── Main ReviewSection ───────────────────────────────────────────────────────
const ReviewSection = ({ productId, productRating, productNumReviews }) => {
  const navigate = useNavigate()
  const { user } = useSelector(s => s.auth)
  const currentUserId = user?._id || user?.id

  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState({ average: 0, total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [sort, setSort] = useState('recent')
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [summaryData, setSummaryData] = useState(null)
  const [loadingSummary, setLoadingSummary] = useState(false)

  const LIMIT = 8

  const fetchReviews = useCallback(async (pg = 1) => {
    try {
      setLoading(true)
      const res = await api.get(`reviews/product/${productId}`, {
        params: { page: pg, limit: LIMIT, sort, filter },
      })
      if (res.data.success) {
        setReviews(pg === 1 ? res.data.reviews : prev => [...prev, ...res.data.reviews])
        setStats(res.data.stats)
        setPage(res.data.page)
        setPages(res.data.pages)
      }
    } catch (err) {
      console.error('Failed to fetch reviews', err)
    } finally {
      setLoading(false)
    }
  }, [productId, sort, filter])

  const fetchSummary = useCallback(async () => {
    try {
      setLoadingSummary(true)
      const res = await api.get(`reviews/product/${productId}/summary`)
      if (res.data.success) {
        setSummaryData(res.data.summary)
      }
    } catch (err) {
      console.error('Failed to fetch review summary', err)
    } finally {
      setLoadingSummary(false)
    }
  }, [productId])

  useEffect(() => {
    setReviews([])
    setStats({ average: productRating || 0, total: productNumReviews || 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } })
    setSummaryData(null)
    setPage(1)
    if (productId) {
      fetchReviews(1)
      fetchSummary()
    }
  }, [productId, fetchReviews, fetchSummary, productRating, productNumReviews])

  const handleReviewSuccess = () => {
    setShowForm(false)
    setSuccessMsg('Your review was submitted and is pending moderation.')
    setTimeout(() => setSuccessMsg(''), 5000)
    fetchReviews(1)
    fetchSummary()
  }

  const handleReviewDeleted = (id) => {
    setReviews(prev => prev.filter(r => r._id !== id))
    fetchReviews(1)
  }

  const loadMore = () => {
    const next = page + 1
    if (next <= pages) fetchReviews(next)
  }

  const handleFilterChange = (f) => {
    setFilter(f)
    setPage(1)
    setReviews([])
  }

  const handleSortChange = (s) => {
    setSort(s)
    setPage(1)
    setReviews([])
  }

  return (
    <section
      id="reviews"
      className="border-t border-atelier-lightgray/60 pt-6 pb-12"
      aria-labelledby="reviews-heading"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

        {/* ── Left: Summary ───────────────────────────────────────────────── */}
        <aside className="lg:col-span-4 space-y-6">
          <h2 id="reviews-heading" className="font-serif text-2xl text-atelier-dark font-medium">
            Customer Reviews
          </h2>

          {/* Average + stars */}
          <div className="flex items-center gap-4">
            <span className="text-5xl font-mono font-semibold text-atelier-dark tabular-nums" aria-label={`${stats.average} out of 5`}>
              {stats.average}
            </span>
            <div className="space-y-1">
              <Stars value={stats.average} size={18} />
              <p className="text-xs font-mono text-atelier-gray uppercase tracking-wider">
                Based on {stats.total} review{stats.total !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Distribution bars */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(star => (
              <DistributionBar
                key={star}
                label={star}
                count={stats.distribution[star] || 0}
                total={stats.total}
                onClick={() => handleFilterChange(filter === String(star) ? 'all' : String(star))}
                active={filter === String(star)}
              />
            ))}
          </div>

          {/* Customer review highlights */}
          {(loadingSummary || (summaryData && summaryData.count > 0)) && (
            <div className="border border-atelier-lightgray bg-white/40 p-5 sm:p-6 space-y-5 rounded">
              <div className="flex items-start justify-between gap-4 border-b border-atelier-lightgray pb-3">
                <div>
                  <h3 className="font-serif text-lg text-atelier-dark font-medium">
                    What customers are saying
                  </h3>
                  <p className="mt-1 text-xs text-atelier-gray">
                    A quick look at themes from verified reviews.
                  </p>
                </div>
                {loadingSummary && (
                  <span className="shrink-0 text-xs text-atelier-gray animate-pulse">Loading...</span>
                )}
              </div>

              {loadingSummary ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 bg-atelier-lightgray/20 rounded w-full" />
                  <div className="h-4 bg-atelier-lightgray/20 rounded w-5/6" />
                  <div className="h-8 bg-atelier-lightgray/20 rounded w-full" />
                </div>
              ) : (
                <>
                  <p className="text-sm sm:text-base text-atelier-gray font-light leading-relaxed font-sans">
                    {summaryData.summary}
                  </p>

                  {summaryData.praised && summaryData.praised.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-mono uppercase tracking-wider text-emerald-700 font-semibold flex items-center gap-1">
                        Most mentioned
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {summaryData.praised.map((aspect, idx) => (
                          <span
                            key={idx}
                            className="text-xs font-mono bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100"
                          >
                            {aspect}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {summaryData.complaints && summaryData.complaints.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-mono uppercase tracking-wider text-amber-700 font-semibold flex items-center gap-1">
                        Worth knowing
                      </span>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-atelier-gray">
                        {summaryData.complaints.map((item, idx) => (
                          <li key={idx} className="font-sans leading-5">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="text-xs text-atelier-gray pt-3 border-t border-atelier-lightgray/50">
                    Based on {summaryData.count} verified customer review{summaryData.count !== 1 ? 's' : ''}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Success / error messages */}
          {successMsg && (
            <p className="bg-atelier-cream border border-atelier-accent/40 text-atelier-accent px-4 py-3 text-xs font-mono uppercase tracking-wider" role="status">
              {successMsg}
            </p>
          )}

          {/* Write review CTA */}
          {!showForm ? (
            <button
              id="write-review-btn"
              type="button"
              onClick={() => {
                if (!user) { navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`); return }
                setShowForm(true)
              }}
              className="w-full btn-atelier-outline"
            >
              Write a Review
            </button>
          ) : (
            <WriteReviewForm
              productId={productId}
              onSuccess={handleReviewSuccess}
              onCancel={() => setShowForm(false)}
            />
          )}
        </aside>

        {/* ── Right: Reviews list ──────────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-4">

          {/* Sort + Filter controls */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            {/* Filter tabs */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: 'All' },
                { id: 'verified', label: 'Verified' },
                { id: '5', label: '5 ★' },
                { id: '4', label: '4 ★' },
                { id: '3', label: '3 ★' },
                { id: '2', label: '2 ★' },
                { id: '1', label: '1 ★' },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleFilterChange(f.id)}
                  className={`px-3 py-1 text-[11px] font-mono uppercase tracking-wider border transition-all rounded-sm ${
                    filter === f.id
                      ? 'border-atelier-dark bg-atelier-dark text-white'
                      : 'border-atelier-lightgray text-atelier-gray hover:border-atelier-dark/60 hover:text-atelier-dark'
                  }`}
                  aria-pressed={filter === f.id}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Sort select */}
            <select
              value={sort}
              onChange={e => handleSortChange(e.target.value)}
              className="bg-transparent border border-atelier-lightgray text-atelier-dark text-xs font-mono py-1.5 px-2 focus:outline-none focus:border-atelier-dark cursor-pointer"
              aria-label="Sort reviews"
            >
              <option value="recent">Most Recent</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>

          {/* Reviews */}
          <div className="divide-y divide-atelier-lightgray/40">
            {loading && reviews.length === 0 ? (
              // Skeleton
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="py-6 space-y-2 animate-pulse">
                  <div className="h-3 w-24 bg-atelier-lightgray/40 rounded" />
                  <div className="h-3 w-36 bg-atelier-lightgray/30 rounded" />
                  <div className="h-14 bg-atelier-lightgray/20 rounded" />
                </div>
              ))
            ) : reviews.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <ImageIcon size={32} className="mx-auto text-atelier-lightgray/60" />
                <p className="font-serif text-sm text-atelier-gray italic">
                  {filter !== 'all' ? 'No reviews match this filter.' : 'No reviews yet. Be the first to share your thoughts.'}
                </p>
                {filter !== 'all' && (
                  <button type="button" onClick={() => handleFilterChange('all')} className="text-xs font-mono uppercase tracking-wider text-atelier-dark hover:underline">
                    Clear filter
                  </button>
                )}
              </div>
            ) : (
              reviews.map(review => (
                <ReviewCard
                  key={review._id}
                  review={review}
                  currentUserId={currentUserId}
                  productId={productId}
                  onDeleted={handleReviewDeleted}
                />
              ))
            )}
          </div>

          {/* Load more */}
          {page < pages && !loading && (
            <button
              type="button"
              onClick={loadMore}
              className="w-full py-3 border border-atelier-lightgray font-mono text-xs uppercase tracking-widest text-atelier-gray hover:text-atelier-dark hover:border-atelier-dark transition-all"
            >
              Load More Reviews
            </button>
          )}

          {loading && reviews.length > 0 && (
            <div className="flex justify-center py-4">
              <Loader2 size={20} className="animate-spin text-atelier-gray" aria-label="Loading" />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default ReviewSection
