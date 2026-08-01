import React, { useState, useEffect, useRef } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import {
  Users, Trash2, Search, ShieldOff, ShieldCheck,
  Eye, X, Package, MapPin, RefreshCw, ChevronRight,
  Mail, Calendar, Hash, Phone, Home, KeyRound,
  AlertTriangle, CheckCircle2, Clock, Truck, XCircle, RotateCcw,
  UserX, UserCheck, ShoppingBag, Filter,
} from 'lucide-react'
import api from '../../services/axiosInstance'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_META = {
  Processing:         { color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/20',  icon: Clock },
  Confirmed:          { color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    icon: CheckCircle2 },
  Packed:             { color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/20',  icon: Package },
  Shipped:            { color: 'text-indigo-400',  bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20',  icon: Truck },
  'Out for Delivery': { color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20',  icon: Truck },
  Delivered:          { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle2 },
  Cancelled:          { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     icon: XCircle },
  Refunded:           { color: 'text-pink-400',    bg: 'bg-pink-500/10',    border: 'border-pink-500/20',    icon: RotateCcw },
}

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.Processing
  const Icon = meta.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border font-semibold ${meta.color} ${meta.bg} ${meta.border}`}>
      <Icon size={9} strokeWidth={2.5} />{status}
    </span>
  )
}

const Avatar = ({ name, size = 10, textSize = 'text-sm' }) => {
  const colors = [
    'from-violet-500 to-indigo-500',
    'from-amber-500 to-orange-500',
    'from-emerald-500 to-teal-500',
    'from-pink-500 to-rose-500',
    'from-blue-500 to-cyan-500',
  ]
  const idx = (name?.charCodeAt(0) || 0) % colors.length
  return (
    <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br ${colors[idx]} flex items-center justify-center font-bold text-white uppercase ${textSize} flex-shrink-0`}>
      {name?.charAt(0) || 'U'}
    </div>
  )
}

// ─── Modal Wrapper ────────────────────────────────────────────────────────────
const Modal = ({ open, onClose, title, children, width = 'max-w-2xl' }) => {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${width} bg-[#0f0f17] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0">
          <h3 className="font-semibold text-white text-sm">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
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

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminUsersManager = () => {
  const [users, setUsers]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [search, setSearch]         = useState('')
  const [filterStatus, setFilter]   = useState('all')  // all | active | blocked
  const [toast, setToast]           = useState(null)
  const toastTimer                  = useRef(null)

  // Modal state
  const [detailUser, setDetailUser]       = useState(null)  // full detail panel
  const [ordersModal, setOrdersModal]     = useState(null)  // { user, orders, loading }
  const [addressModal, setAddressModal]   = useState(null)  // { user, addresses, loading }
  const [resetModal, setResetModal]       = useState(null)  // { user }
  const [newPassword, setNewPassword]     = useState('')
  const [resetLoading, setResetLoading]   = useState(false)
  const [actionLoading, setActionLoading] = useState(null)

  const showToast = (msg, type = 'success') => {
    clearTimeout(toastTimer.current)
    setToast({ msg, type })
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  const fetchUsers = async () => {
    try {
      setLoading(true); setError(null)
      const res = await api.get('users')
      if (res.data.success) setUsers(res.data.users || [])
    } catch { setError('Failed to load users.') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [])

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleBlock = async (user) => {
    const isBlocked = user.isBlocked
    try {
      setActionLoading(user._id + (isBlocked ? '_unblock' : '_block'))
      const endpoint = isBlocked ? `users/${user._id}/unblock` : `users/${user._id}/block`
      const res = await api.put(endpoint)
      if (res.data.success) {
        setUsers(prev => prev.map(u => u._id === user._id ? { ...u, isBlocked: !isBlocked } : u))
        showToast(`User ${isBlocked ? 'unblocked' : 'blocked'} successfully`)
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed', 'error')
    } finally { setActionLoading(null) }
  }

  const handleDelete = async (user) => {
    if (!window.confirm(`Permanently delete ${user.name}'s account? This cannot be undone.`)) return
    try {
      setActionLoading(user._id + '_delete')
      const res = await api.delete(`users/${user._id}`)
      if (res.data.success) {
        setUsers(prev => prev.filter(u => u._id !== user._id))
        if (detailUser?._id === user._id) setDetailUser(null)
        showToast('User account deleted')
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed', 'error')
    } finally { setActionLoading(null) }
  }

  const openOrders = async (user) => {
    setOrdersModal({ user, orders: [], loading: true })
    try {
      const res = await api.get(`users/${user._id}/orders`)
      setOrdersModal({ user, orders: res.data.orders || [], loading: false })
    } catch {
      setOrdersModal(prev => ({ ...prev, loading: false }))
    }
  }

  const openAddresses = async (user) => {
    setAddressModal({ user, addresses: [], loading: true })
    try {
      const res = await api.get(`users/${user._id}/addresses`)
      setAddressModal({ user, addresses: res.data.addresses || [], loading: false })
    } catch {
      setAddressModal(prev => ({ ...prev, loading: false }))
    }
  }

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error'); return
    }
    try {
      setResetLoading(true)
      const res = await api.put(`users/${resetModal.user._id}/reset-password`, { newPassword })
      if (res.data.success) {
        showToast('Password reset successfully')
        setResetModal(null); setNewPassword('')
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Reset failed', 'error')
    } finally { setResetLoading(false) }
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const filtered = users.filter(u => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) ||
                        u.email?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filterStatus === 'all' ||
                        (filterStatus === 'active' && !u.isBlocked) ||
                        (filterStatus === 'blocked' && u.isBlocked)
    return matchSearch && matchFilter
  })

  const totalCount   = users.length
  const activeCount  = users.filter(u => !u.isBlocked && u.role !== 'admin').length
  const blockedCount = users.filter(u => u.isBlocked).length
  const adminCount   = users.filter(u => u.role === 'admin').length

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <AdminLayout title="Users">
      <style>{`
        @keyframes slide-up { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .animate-slide-up { animation: slide-up 0.3s ease forwards; }
        .scrollbar-thin::-webkit-scrollbar { width:4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background:transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background:#ffffff18; border-radius:99px; }
      `}</style>

      <div className="p-6 lg:p-8 space-y-7 max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">User Management</h2>
            <p className="text-xs text-white/40 mt-1">Manage customer accounts, access, and order history</p>
          </div>
          <button
            onClick={fetchUsers}
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

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Users',  value: totalCount,   color: 'text-white',        accent: 'from-white/10 to-white/5' },
            { label: 'Active',        value: activeCount,  color: 'text-emerald-400',  accent: 'from-emerald-500/10 to-transparent' },
            { label: 'Blocked',       value: blockedCount, color: 'text-red-400',       accent: 'from-red-500/10 to-transparent' },
            { label: 'Admins',        value: adminCount,   color: 'text-indigo-400',    accent: 'from-indigo-500/10 to-transparent' },
          ].map(s => (
            <div key={s.label} className={`bg-gradient-to-br ${s.accent} border border-white/5 rounded-xl p-5 space-y-1`}>
              <p className="text-[10px] font-mono uppercase tracking-wider text-white/40">{s.label}</p>
              <p className={`text-3xl font-bold font-mono ${s.color}`}>{loading ? '—' : s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Search + Filter ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'blocked'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider border transition-all ${
                  filterStatus === f
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-white/3 border-white/5 text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* ── Users Table ── */}
        <div className="bg-[#13131a] border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-white/30 uppercase tracking-wider font-mono text-[10px]">
                  <th className="px-5 py-3.5 font-semibold">Customer</th>
                  <th className="px-5 py-3.5 font-semibold hidden md:table-cell">Email</th>
                  <th className="px-5 py-3.5 font-semibold hidden lg:table-cell">Joined</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="px-5 py-4">
                        <div className="h-9 bg-white/[0.03] rounded-lg animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-white/20 font-mono text-xs">
                      <Users size={32} className="mx-auto mb-3 opacity-30" />
                      No users found
                    </td>
                  </tr>
                ) : filtered.map(u => (
                  <tr key={u._id} className="hover:bg-white/[0.015] transition-colors group">
                    {/* User info */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} size={9} textSize="text-xs" />
                        <div>
                          <p className="font-semibold text-white/90 text-xs leading-tight">{u.name}</p>
                          <p className="text-[10px] text-white/30 font-mono mt-0.5">#{u._id.slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="font-mono text-white/60 text-[11px]">{u.email}</span>
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-white/40 font-mono text-[10px]">{new Date(u.createdAt).toLocaleDateString()}</span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {u.role === 'admin' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-mono uppercase tracking-wider">
                            Admin
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border ${
                          u.isBlocked
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {u.isBlocked ? <UserX size={9} /> : <UserCheck size={9} />}
                          {u.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Detail */}
                        <button
                          title="View Profile"
                          onClick={() => setDetailUser(u)}
                          className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                        >
                          <Eye size={12} />
                        </button>

                        {/* View Orders */}
                        <button
                          title="View Orders"
                          onClick={() => openOrders(u)}
                          className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-white/40 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                        >
                          <ShoppingBag size={12} />
                        </button>

                        {/* Block / Unblock */}
                        {u.role !== 'admin' && (
                          <button
                            title={u.isBlocked ? 'Unblock User' : 'Block User'}
                            onClick={() => handleBlock(u)}
                            disabled={!!actionLoading}
                            className={`p-1.5 rounded-lg border transition-all disabled:opacity-40 ${
                              u.isBlocked
                                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-orange-500/5 border-orange-500/20 text-orange-400 hover:bg-orange-500/20'
                            }`}
                          >
                            {u.isBlocked ? <ShieldCheck size={12} /> : <ShieldOff size={12} />}
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          title="Delete Account"
                          onClick={() => handleDelete(u)}
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

          {/* Table footer */}
          {!loading && filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-white/[0.04] flex items-center justify-between">
              <p className="text-[10px] text-white/30 font-mono">
                Showing {filtered.length} of {totalCount} users
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          USER DETAIL MODAL
      ════════════════════════════════════════════════════════════════════════ */}
      <Modal
        open={!!detailUser}
        onClose={() => setDetailUser(null)}
        title="User Profile"
        width="max-w-lg"
      >
        {detailUser && (
          <div className="p-6 space-y-5">
            {/* Avatar + name */}
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${
                ['from-violet-500 to-indigo-500','from-amber-500 to-orange-500','from-emerald-500 to-teal-500','from-pink-500 to-rose-500','from-blue-500 to-cyan-500'][(detailUser.name?.charCodeAt(0)||0)%5]
              } flex items-center justify-center text-2xl font-bold text-white uppercase`}>
                {detailUser.name?.charAt(0)}
              </div>
              <div>
                <h4 className="text-white font-bold text-base">{detailUser.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase border ${
                    detailUser.isBlocked ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {detailUser.isBlocked ? <UserX size={9}/> : <UserCheck size={9}/>}
                    {detailUser.isBlocked ? 'Blocked' : 'Active'}
                  </span>
                  {detailUser.role === 'admin' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Info rows */}
            <div className="space-y-2">
              {[
                { icon: Mail, label: 'Email', value: detailUser.email },
                { icon: Hash, label: 'User ID', value: detailUser._id },
                { icon: Calendar, label: 'Joined', value: new Date(detailUser.createdAt).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }) },
              ].map(row => (
                <div key={row.label} className="flex items-start gap-3 bg-white/[0.03] rounded-xl px-4 py-3">
                  <row.icon size={14} className="text-white/30 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-white/30 font-mono uppercase">{row.label}</p>
                    <p className="text-xs text-white/80 font-mono mt-0.5 break-all">{row.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => { openOrders(detailUser); setDetailUser(null) }}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono uppercase tracking-wider hover:bg-amber-500/20 transition-all"
              >
                <ShoppingBag size={13} /> Orders
              </button>
              <button
                onClick={() => { openAddresses(detailUser); setDetailUser(null) }}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono uppercase tracking-wider hover:bg-blue-500/20 transition-all"
              >
                <MapPin size={13} /> Addresses
              </button>
              {detailUser.role !== 'admin' && (
                <button
                  onClick={() => handleBlock(detailUser)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all border ${
                    detailUser.isBlocked
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20'
                  }`}
                >
                  {detailUser.isBlocked ? <ShieldCheck size={13}/> : <ShieldOff size={13}/>}
                  {detailUser.isBlocked ? 'Unblock' : 'Block'}
                </button>
              )}
              <button
                onClick={() => { setResetModal({ user: detailUser }); setDetailUser(null) }}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-mono uppercase tracking-wider hover:bg-purple-500/20 transition-all"
              >
                <KeyRound size={13} /> Reset Pass
              </button>
              <button
                onClick={() => { handleDelete(detailUser); }}
                className="col-span-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono uppercase tracking-wider hover:bg-red-500/20 transition-all"
              >
                <Trash2 size={13} /> Delete Account
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          ORDER HISTORY MODAL
      ════════════════════════════════════════════════════════════════════════ */}
      <Modal
        open={!!ordersModal}
        onClose={() => setOrdersModal(null)}
        title={ordersModal ? `Orders — ${ordersModal.user.name}` : ''}
        width="max-w-2xl"
      >
        {ordersModal && (
          <div className="p-6 space-y-4">
            {ordersModal.loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 bg-white/[0.03] rounded-xl animate-pulse" />
                ))}
              </div>
            ) : ordersModal.orders.length === 0 ? (
              <div className="py-16 text-center">
                <ShoppingBag size={36} className="mx-auto text-white/10 mb-3" />
                <p className="text-white/30 text-sm font-mono">No orders found</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-white/30 font-mono">{ordersModal.orders.length} order{ordersModal.orders.length > 1 ? 's' : ''} total</p>
                {ordersModal.orders.map(order => (
                  <div key={order._id} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-mono text-white/80 font-semibold">#{order._id.slice(-8).toUpperCase()}</p>
                        <p className="text-[10px] text-white/30 mt-0.5 font-mono">{new Date(order.createdAt).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatusBadge status={order.status} />
                        <p className="text-xs font-bold text-white font-mono">₹{(order.totalPrice || 0).toLocaleString()}</p>
                      </div>
                    </div>
                    {order.orderItems?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {order.orderItems.slice(0, 3).map((item, idx) => (
                          <span key={idx} className="text-[10px] font-mono bg-white/5 border border-white/5 text-white/50 px-2 py-0.5 rounded-md">
                            {item.name || item.product?.name || 'Product'} ×{item.qty}
                          </span>
                        ))}
                        {order.orderItems.length > 3 && (
                          <span className="text-[10px] font-mono text-white/30">+{order.orderItems.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          ADDRESS MODAL
      ════════════════════════════════════════════════════════════════════════ */}
      <Modal
        open={!!addressModal}
        onClose={() => setAddressModal(null)}
        title={addressModal ? `Addresses — ${addressModal.user.name}` : ''}
        width="max-w-lg"
      >
        {addressModal && (
          <div className="p-6 space-y-4">
            {addressModal.loading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-24 bg-white/[0.03] rounded-xl animate-pulse" />
                ))}
              </div>
            ) : addressModal.addresses.length === 0 ? (
              <div className="py-16 text-center">
                <MapPin size={36} className="mx-auto text-white/10 mb-3" />
                <p className="text-white/30 text-sm font-mono">No addresses saved</p>
              </div>
            ) : (
              <div className="space-y-3">
                {addressModal.addresses.map(addr => (
                  <div key={addr._id} className={`bg-white/[0.03] border rounded-xl p-4 space-y-1 ${addr.isDefault ? 'border-emerald-500/30' : 'border-white/5'}`}>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-white/80 font-mono">{addr.fullName || addr.name || 'Address'}</p>
                      {addr.isDefault && (
                        <span className="text-[9px] font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">Default</span>
                      )}
                    </div>
                    <p className="text-[11px] text-white/50">
                      {[addr.address || addr.street, addr.city, addr.state, addr.pincode || addr.postalCode, addr.country].filter(Boolean).join(', ')}
                    </p>
                    {addr.phone && <p className="text-[10px] font-mono text-white/30">{addr.phone}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          RESET PASSWORD MODAL
      ════════════════════════════════════════════════════════════════════════ */}
      <Modal
        open={!!resetModal}
        onClose={() => { setResetModal(null); setNewPassword('') }}
        title="Reset Password"
        width="max-w-sm"
      >
        {resetModal && (
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-3 bg-purple-500/5 border border-purple-500/20 rounded-xl px-4 py-3">
              <KeyRound size={16} className="text-purple-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-white/60">Resetting password for</p>
                <p className="text-sm font-semibold text-white">{resetModal.user.name}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-wider text-white/30">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-purple-500/40 transition-colors"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setResetModal(null); setNewPassword('') }}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white/50 text-xs font-mono uppercase tracking-wider hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={resetLoading || !newPassword}
                className="flex-1 py-2.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-mono uppercase tracking-wider hover:bg-purple-500/30 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {resetLoading ? <RefreshCw size={12} className="animate-spin" /> : <KeyRound size={12} />}
                {resetLoading ? 'Resetting…' : 'Reset'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Toast ── */}
      <Toast toast={toast} />
    </AdminLayout>
  )
}

export default AdminUsersManager
