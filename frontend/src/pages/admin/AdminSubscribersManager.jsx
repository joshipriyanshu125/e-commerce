import React, { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import {
  Mail, Users, CheckCircle, XCircle, RefreshCw,
  Search, Filter, Trash2, Send, Download, Plus,
  TrendingUp, Clock, AlertTriangle, Check, X,
  ExternalLink, Sparkles
} from 'lucide-react'
import api from '../../services/axiosInstance'

const timeAgo = (dateStr) => {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export default function AdminSubscribersManager() {
  const [subscribers, setSubscribers] = useState([])
  const [stats, setStats] = useState({ total: 0, active: 0, unsubscribed: 0, newThisMonth: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'active' | 'unsubscribed'
  const [sourceFilter, setSourceFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Broadcast Modal State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false)
  const [broadcastData, setBroadcastData] = useState({
    subject: '',
    headline: '',
    message: '',
    buttonText: 'Shop Atelier',
    buttonUrl: '',
    testEmail: '',
  })
  const [sendingBroadcast, setSendingBroadcast] = useState(false)
  const [broadcastResult, setBroadcastResult] = useState(null)

  // Action Loading states
  const [actionLoadingId, setActionLoadingId] = useState(null)

  /* ── Fetch Stats ── */
  const fetchStats = async () => {
    try {
      const res = await api.get('newsletter/admin/stats')
      if (res.data?.success) {
        setStats(res.data.stats)
      }
    } catch (err) {
      console.error('Failed to load subscriber stats:', err)
    }
  }

  /* ── Fetch Subscribers ── */
  const fetchSubscribers = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      setError(null)

      const params = {
        page,
        limit: 15,
      }
      if (search.trim()) params.search = search.trim()
      if (statusFilter !== 'all') params.status = statusFilter
      if (sourceFilter !== 'all') params.source = sourceFilter

      const res = await api.get('newsletter/admin/subscribers', { params })
      if (res.data?.success) {
        setSubscribers(res.data.subscribers || [])
        setTotal(res.data.total || 0)
        setPages(res.data.pages || 1)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load subscribers list')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, sourceFilter])

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    fetchSubscribers()
  }, [fetchSubscribers])

  /* ── Toggle Subscription Status ── */
  const handleToggleStatus = async (sub) => {
    setActionLoadingId(sub._id)
    try {
      const res = await api.put(`newsletter/admin/subscribers/${sub._id}/toggle`)
      if (res.data?.success) {
        setSubscribers(prev =>
          prev.map(s => (s._id === sub._id ? res.data.subscriber : s))
        )
        fetchStats()
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update subscriber status')
    } finally {
      setActionLoadingId(null)
    }
  }

  /* ── Delete Subscriber ── */
  const handleDelete = async (id, email) => {
    if (!window.confirm(`Are you sure you want to remove ${email} from subscribers?`)) return

    setActionLoadingId(id)
    try {
      const res = await api.delete(`newsletter/admin/subscribers/${id}`)
      if (res.data?.success) {
        setSubscribers(prev => prev.filter(s => s._id !== id))
        fetchStats()
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete subscriber')
    } finally {
      setActionLoadingId(null)
    }
  }

  /* ── Export CSV ── */
  const handleExportCSV = () => {
    if (!subscribers.length) return
    const headers = ['Email', 'Name', 'Status', 'Source', 'Subscribed Date', 'Unsubscribed Date']
    const rows = subscribers.map(s => [
      s.email,
      s.name || '',
      s.isSubscribed ? 'Active' : 'Unsubscribed',
      s.source || 'footer',
      s.createdAt ? new Date(s.createdAt).toISOString() : '',
      s.unsubscribedAt ? new Date(s.unsubscribedAt).toISOString() : '',
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].map(e => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `atelier_subscribers_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  /* ── Send Broadcast ── */
  const handleSendBroadcast = async (e) => {
    e.preventDefault()
    if (!broadcastData.subject || !broadcastData.message) {
      alert('Please fill in both the Subject and Message.')
      return
    }

    setSendingBroadcast(true)
    setBroadcastResult(null)
    try {
      const res = await api.post('newsletter/admin/broadcast', broadcastData)
      if (res.data?.success) {
        setBroadcastResult({
          type: 'success',
          message: res.data.message,
        })
        if (!broadcastData.testEmail) {
          setTimeout(() => {
            setShowBroadcastModal(false)
            setBroadcastResult(null)
            setBroadcastData({
              subject: '',
              headline: '',
              message: '',
              buttonText: 'Shop Atelier',
              buttonUrl: '',
              testEmail: '',
            })
          }, 2500)
        }
      }
    } catch (err) {
      setBroadcastResult({
        type: 'error',
        message: err.response?.data?.message || 'Failed to send broadcast.',
      })
    } finally {
      setSendingBroadcast(false)
    }
  }

  return (
    <AdminLayout title="Newsletter Subscribers">
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

        {/* ── Top Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
              <Mail size={18} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Newsletter Subscribers</h2>
              <p className="text-[11px] text-white/40">Manage audience list and dispatch email notification broadcasts</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => { fetchStats(); fetchSubscribers(true) }}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-medium transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={handleExportCSV}
              disabled={!subscribers.length}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-medium transition-all active:scale-95 disabled:opacity-50"
            >
              <Download size={12} />
              Export CSV
            </button>
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold font-mono tracking-wide transition-all shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <Send size={13} />
              Send Broadcast Email
            </button>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#13131a] border border-white/5 p-4 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-white/40">
              <span className="text-[11px] uppercase tracking-wider font-mono">Total Audience</span>
              <Users size={15} className="text-sky-400" />
            </div>
            <p className="text-2xl font-bold text-white tracking-tight">{stats.total}</p>
          </div>

          <div className="bg-[#13131a] border border-white/5 p-4 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-white/40">
              <span className="text-[11px] uppercase tracking-wider font-mono">Active Subscribers</span>
              <CheckCircle size={15} className="text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400 tracking-tight">{stats.active}</p>
          </div>

          <div className="bg-[#13131a] border border-white/5 p-4 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-white/40">
              <span className="text-[11px] uppercase tracking-wider font-mono">Unsubscribed</span>
              <XCircle size={15} className="text-red-400" />
            </div>
            <p className="text-2xl font-bold text-white/60 tracking-tight">{stats.unsubscribed}</p>
          </div>

          <div className="bg-[#13131a] border border-white/5 p-4 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-white/40">
              <span className="text-[11px] uppercase tracking-wider font-mono">New (30d)</span>
              <TrendingUp size={15} className="text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-400 tracking-tight">+{stats.newThisMonth}</p>
          </div>
        </div>

        {/* ── Search & Filter Controls ── */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-[#13131a] border border-white/5 p-3 rounded-xl">
          
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by email or name..."
              className="w-full bg-[#1c1c27] border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50"
            />
          </div>

          {/* Status Tabs & Filters */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            {/* Status Pills */}
            <div className="flex items-center bg-[#1c1c27] p-1 rounded-lg border border-white/5 text-xs">
              {[
                { key: 'all', label: 'All' },
                { key: 'active', label: 'Active' },
                { key: 'unsubscribed', label: 'Unsubscribed' },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => { setStatusFilter(t.key); setPage(1) }}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    statusFilter === t.key
                      ? 'bg-amber-500/20 text-amber-400 font-semibold'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Source Dropdown */}
            <select
              value={sourceFilter}
              onChange={(e) => { setSourceFilter(e.target.value); setPage(1) }}
              className="bg-[#1c1c27] border border-white/10 text-white/70 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400/50"
            >
              <option value="all">All Sources</option>
              <option value="footer">Footer</option>
              <option value="checkout">Checkout</option>
              <option value="registration">Registration</option>
              <option value="popup">Popup</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 text-xs">
            <AlertTriangle size={16} />
            <span>{error}</span>
            <button onClick={() => fetchSubscribers()} className="ml-auto underline">Retry</button>
          </div>
        )}

        {/* ── Subscribers Table ── */}
        <div className="bg-[#13131a] border border-white/5 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-white/70">
              <thead className="bg-white/[0.02] border-b border-white/5 text-[10px] uppercase font-mono tracking-widest text-white/40">
                <tr>
                  <th className="py-3.5 px-4 font-medium">Subscriber</th>
                  <th className="py-3.5 px-4 font-medium">Status</th>
                  <th className="py-3.5 px-4 font-medium">Source</th>
                  <th className="py-3.5 px-4 font-medium">Subscribed Date</th>
                  <th className="py-3.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="py-4 px-4 h-14 bg-white/[0.01]"></td>
                    </tr>
                  ))
                ) : subscribers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-white/30 font-sans">
                      <Mail size={32} className="mx-auto mb-2 opacity-20" />
                      <p className="text-sm font-medium">No subscribers found</p>
                      <p className="text-xs text-white/20 mt-1">
                        {search || statusFilter !== 'all' || sourceFilter !== 'all'
                          ? 'Try adjusting your search query or filters'
                          : 'Users who subscribe via the footer form will appear here.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  subscribers.map((sub) => {
                    const isBusy = actionLoadingId === sub._id
                    return (
                      <tr key={sub._id} className="hover:bg-white/[0.02] transition-colors group">
                        
                        {/* Subscriber info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-bold text-amber-400 uppercase text-xs font-sans">
                              {sub.email.charAt(0)}
                            </div>
                            <div>
                              <p className="text-white font-medium font-sans text-xs flex items-center gap-1.5">
                                {sub.email}
                              </p>
                              {sub.name && (
                                <p className="text-[10px] text-white/40 font-sans">{sub.name}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {sub.isSubscribed ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-semibold uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] bg-red-500/10 border border-red-500/25 text-red-400 uppercase">
                              Unsubscribed
                            </span>
                          )}
                        </td>

                        {/* Source */}
                        <td className="py-3.5 px-4">
                          <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] text-white/60 uppercase">
                            {sub.source || 'footer'}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-white/40 text-[11px]">
                          <div>{new Date(sub.createdAt).toLocaleDateString()}</div>
                          <div className="text-[9px] text-white/20">{timeAgo(sub.createdAt)}</div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleStatus(sub)}
                              disabled={isBusy}
                              title={sub.isSubscribed ? 'Mark Unsubscribed' : 'Reactivate Subscription'}
                              className={`px-2 py-1 rounded text-[10px] font-sans border transition-all active:scale-95 disabled:opacity-50 ${
                                sub.isSubscribed
                                  ? 'border-white/10 text-white/40 hover:text-amber-400 hover:border-amber-400/30'
                                  : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                              }`}
                            >
                              {sub.isSubscribed ? 'Deactivate' : 'Activate'}
                            </button>

                            <button
                              onClick={() => handleDelete(sub._id, sub.email)}
                              disabled={isBusy}
                              title="Delete Subscriber"
                              className="p-1.5 rounded hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors disabled:opacity-50"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {pages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-white/5 text-xs text-white/40">
              <span>Showing page {page} of {pages} ({total} subscribers)</span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-mono"
                >
                  Prev
                </button>
                <button
                  disabled={page >= pages}
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-mono"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Broadcast Newsletter Modal ── */}
        {showBroadcastModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[#161622] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#13131a]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400">
                    <Send size={15} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">Send Newsletter Broadcast</h3>
                    <p className="text-[10px] text-white/40">Dispatches branded notification email to all {stats.active} active subscribers</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBroadcastModal(false)}
                  className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSendBroadcast} className="p-6 space-y-4">
                
                {broadcastResult && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2.5 ${
                    broadcastResult.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/10 border border-red-500/20 text-red-400'
                  }`}>
                    {broadcastResult.type === 'success' ? <Check size={14} /> : <AlertTriangle size={14} />}
                    <span>{broadcastResult.message}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-white/50">
                    Email Subject <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={broadcastData.subject}
                    onChange={(e) => setBroadcastData(d => ({ ...d, subject: e.target.value }))}
                    placeholder="e.g. Atelier Special Edition — Winter Collection Drop"
                    className="w-full bg-[#12121a] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-400/60 font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-white/50">
                    Headline / Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={broadcastData.headline}
                    onChange={(e) => setBroadcastData(d => ({ ...d, headline: e.target.value }))}
                    placeholder="e.g. Exclusive First Look: New Arrivals Are Live"
                    className="w-full bg-[#12121a] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-400/60 font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-white/50">
                    Message Body <span className="text-amber-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={broadcastData.message}
                    onChange={(e) => setBroadcastData(d => ({ ...d, message: e.target.value }))}
                    placeholder="Write your announcement, styling notes, or discount coupon details..."
                    className="w-full bg-[#12121a] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-400/60 leading-relaxed font-sans"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-white/50">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={broadcastData.buttonText}
                      onChange={(e) => setBroadcastData(d => ({ ...d, buttonText: e.target.value }))}
                      placeholder="e.g. Shop Atelier"
                      className="w-full bg-[#12121a] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-400/60 font-sans"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-white/50">
                      Button URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={broadcastData.buttonUrl}
                      onChange={(e) => setBroadcastData(d => ({ ...d, buttonUrl: e.target.value }))}
                      placeholder="https://atelier.com/shop"
                      className="w-full bg-[#12121a] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-400/60 font-sans"
                    />
                  </div>
                </div>

                {/* Test Email Option */}
                <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-center gap-3">
                  <div className="w-full sm:w-2/3">
                    <input
                      type="email"
                      value={broadcastData.testEmail}
                      onChange={(e) => setBroadcastData(d => ({ ...d, testEmail: e.target.value }))}
                      placeholder="Send a test email first (e.g. your@email.com)"
                      className="w-full bg-[#12121a] border border-white/10 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-400/60"
                    />
                  </div>
                  <div className="w-full sm:w-1/3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBroadcastModal(false)}
                      className="px-3 py-1.5 rounded-xl border border-white/10 text-white/60 hover:text-white text-xs font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={sendingBroadcast}
                      className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold font-mono tracking-wide transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {sendingBroadcast ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" />
                          Sending...
                        </>
                      ) : broadcastData.testEmail ? (
                        'Send Test Email'
                      ) : (
                        `Send to ${stats.active} Subscribers`
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  )
}
