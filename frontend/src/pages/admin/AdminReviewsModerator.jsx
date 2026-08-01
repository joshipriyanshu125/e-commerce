import React, { useState, useEffect, useRef } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import {
  Star, MessageSquare, Trash2, CheckCircle2, EyeOff,
  CornerDownRight, RefreshCw, AlertTriangle, Send,
  Clock, Check, X, ShieldAlert,
} from 'lucide-react'
import api from '../../services/axiosInstance'
import { io } from 'socket.io-client'

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const meta = {
    Pending:  { color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/20',  icon: Clock },
    Approved: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle2 },
    Hidden:   { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     icon: EyeOff },
  }[status] || { color: 'text-white/60', bg: 'bg-white/5', border: 'border-white/10', icon: Clock }

  const Icon = meta.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border font-semibold ${meta.color} ${meta.bg} ${meta.border}`}>
      <Icon size={10} strokeWidth={2.5} />
      {status}
    </span>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ toast }) => {
  if (!toast) return null
  const isErr = toast.type === 'error'
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-2xl text-sm font-medium animate-slide-up ${
      isErr ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
    }`}>
      {isErr ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
      {toast.msg}
    </div>
  )
}

const AdminReviewsModerator = () => {
  const [reviews, setReviews]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [filterStatus, setFilter]   = useState('all') // all | Pending | Approved | Hidden
  const [replyTarget, setReplyTarget] = useState(null)  // { reviewId, productId, name, comment }
  const [replyText, setReplyText]     = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [toast, setToast]           = useState(null)
  const toastTimer                  = useRef(null)

  const showToast = (msg, type = 'success') => {
    clearTimeout(toastTimer.current)
    setToast({ msg, type })
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  const fetchReviews = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('products/reviews/all')
      if (res.data.success) {
        setReviews(res.data.reviews || [])
      }
    } catch (err) {
      console.error(err)
      setError('Failed to fetch reviews registry.')
    } finally {
      setLoading(false)
    }
  }

  // Socket Connection for Real-Time Updates
  useEffect(() => {
    fetchReviews()

    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'
    const socket = io(socketUrl, { withCredentials: true })

    socket.on('reviewUpdate', () => {
      // Refresh list silently
      api.get('products/reviews/all')
        .then(res => {
          if (res.data.success) setReviews(res.data.reviews || [])
        })
        .catch(console.error)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  // ── Moderation Actions ──────────────────────────────────────────────────────
  const handleUpdateStatus = async (review, newStatus) => {
    try {
      setActionLoading(review._id + '_' + newStatus)
      const res = await api.put(`products/${review.product._id}/reviews/${review._id}/status`, { status: newStatus })
      if (res.data.success) {
        setReviews(prev => prev.map(r => r._id === review._id ? { ...r, status: newStatus } : r))
        showToast(`Review status updated to ${newStatus}`)
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Update failed', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteReview = async (review) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return
    try {
      setActionLoading(review._id + '_delete')
      const res = await api.delete(`products/${review.product._id}/reviews/${review._id}`)
      if (res.data.success) {
        setReviews(prev => prev.filter(r => r._id !== review._id))
        showToast('Review deleted successfully')
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReplySubmit = async (e) => {
    e.preventDefault()
    if (!replyText.trim()) return
    try {
      setActionLoading(replyTarget._id + '_reply')
      const res = await api.put(`products/${replyTarget.productId}/reviews/${replyTarget._id}/reply`, { reply: replyText })
      if (res.data.success) {
        setReviews(prev => prev.map(r => r._id === replyTarget._id ? { ...r, reply: replyText } : r))
        showToast('Reply submitted successfully')
        setReplyTarget(null)
        setReplyText('')
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Reply failed', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const filtered = reviews.filter(r => {
    if (filterStatus === 'all') return true
    return r.status === filterStatus
  })

  const pendingCount  = reviews.filter(r => r.status === 'Pending').length
  const approvedCount = reviews.filter(r => r.status === 'Approved').length
  const hiddenCount   = reviews.filter(r => r.status === 'Hidden').length

  return (
    <AdminLayout title="Reviews">
      <style>{`
        @keyframes slide-up { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .animate-slide-up { animation: slide-up 0.3s ease forwards; }
      `}</style>

      <div className="p-6 lg:p-8 space-y-7 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Review Moderation</h2>
            <p className="text-xs text-white/40 mt-1">Audit customer feedback and moderate product reviews in real-time</p>
          </div>
          <button
            onClick={fetchReviews}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all text-xs font-mono uppercase tracking-wider"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
            <AlertTriangle size={14} />{error}
          </div>
        )}

        {/* Stats / Filters */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all',      label: 'All Reviews',      count: reviews.length },
            { id: 'Pending',  label: 'Pending',          count: pendingCount,  color: 'border-yellow-500/20 text-yellow-400 bg-yellow-500/5' },
            { id: 'Approved', label: 'Approved',         count: approvedCount, color: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' },
            { id: 'Hidden',   label: 'Hidden',           count: hiddenCount,   color: 'border-red-500/20 text-red-400 bg-red-500/5' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider border transition-all flex items-center gap-2 ${
                filterStatus === f.id
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-white/3 border-white/5 text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              {f.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono ${
                filterStatus === f.id ? 'bg-white/10 text-white' : 'bg-white/5 text-white/40'
              }`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Reviews Table */}
        <div className="bg-[#13131a] border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-white/30 uppercase tracking-wider font-mono text-[10px]">
                  <th className="px-5 py-3.5 font-semibold">Product</th>
                  <th className="px-5 py-3.5 font-semibold">User</th>
                  <th className="px-5 py-3.5 font-semibold">Rating</th>
                  <th className="px-5 py-3.5 font-semibold">Comment</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {loading && reviews.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-5 py-4">
                        <div className="h-9 bg-white/[0.03] rounded-lg animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-white/20 font-mono text-xs">
                      <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
                      No reviews found in this filter
                    </td>
                  </tr>
                ) : filtered.map(r => (
                  <tr key={r._id} className="hover:bg-white/[0.015] transition-colors align-top">
                    {/* Product */}
                    <td className="px-5 py-4 max-w-[150px]">
                      <p className="font-semibold text-white/90 truncate">{r.product?.name}</p>
                      <p className="text-[10px] text-white/30 font-mono mt-0.5">#{r.product?._id?.slice(-6).toUpperCase()}</p>
                    </td>

                    {/* User */}
                    <td className="px-5 py-4 font-mono text-white/80">
                      {r.name}
                    </td>

                    {/* Rating */}
                    <td className="px-5 py-4">
                      <div className="flex text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={11}
                            fill={i < r.rating ? 'currentColor' : 'none'}
                            className="stroke-1"
                          />
                        ))}
                      </div>
                    </td>

                    {/* Comment + Reply */}
                    <td className="px-5 py-4 max-w-xs md:max-w-md">
                      <p className="text-white/70 leading-relaxed break-words">{r.comment}</p>
                      {r.reply && (
                        <div className="mt-2.5 flex items-start gap-2 text-[10px] text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-2.5 font-mono">
                          <CornerDownRight size={12} className="mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-indigo-400/50 block mb-0.5">Admin Reply</span>
                            <span>{r.reply}</span>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <StatusBadge status={r.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {r.status !== 'Approved' && (
                          <button
                            title="Approve Review"
                            onClick={() => handleUpdateStatus(r, 'Approved')}
                            disabled={!!actionLoading}
                            className="p-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-40"
                          >
                            <Check size={12} />
                          </button>
                        )}
                        {r.status !== 'Hidden' && (
                          <button
                            title="Hide Review"
                            onClick={() => handleUpdateStatus(r, 'Hidden')}
                            disabled={!!actionLoading}
                            className="p-1.5 rounded-lg bg-yellow-500/5 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20 transition-all disabled:opacity-40"
                          >
                            <EyeOff size={12} />
                          </button>
                        )}
                        <button
                          title="Reply to Review"
                          onClick={() => setReplyTarget({ _id: r._id, productId: r.product._id, name: r.name, comment: r.comment })}
                          className="p-1.5 rounded-lg bg-indigo-500/5 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all"
                        >
                          <MessageSquare size={12} />
                        </button>
                        <button
                          title="Delete Review"
                          onClick={() => handleDeleteReview(r)}
                          disabled={!!actionLoading}
                          className="p-1.5 rounded-lg bg-red-500/5 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-40"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Reply Modal ── */}
      {replyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setReplyTarget(null)} />
          <div className="relative w-full max-w-md bg-[#0f0f17] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="font-semibold text-white text-sm">Reply to {replyTarget.name}</h3>
              <button onClick={() => setReplyTarget(null)} className="text-white/40 hover:text-white">
                <X size={16} />
              </button>
            </div>
            
            <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 space-y-1">
              <p className="text-[10px] text-white/30 font-mono">User Comment</p>
              <p className="text-xs text-white/70 italic leading-relaxed">"{replyTarget.comment}"</p>
            </div>

            <form onSubmit={handleReplySubmit} className="space-y-3.5">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-wider text-white/30">Your Reply</label>
                <textarea
                  required
                  rows="3"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type your reply here..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/40 transition-colors"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setReplyTarget(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white/50 text-xs font-mono uppercase tracking-wider hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === replyTarget._id + '_reply' || !replyText.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-mono uppercase tracking-wider hover:bg-indigo-500/30 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <Send size={12} />
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      <Toast toast={toast} />
    </AdminLayout>
  )
}

export default AdminReviewsModerator
