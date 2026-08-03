import React, { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import {
  Bell, CheckCircle, Trash2, RefreshCw, Package,
  UserPlus, AlertTriangle, Tag, CreditCard, RotateCcw,
  TrendingDown, Info, Filter, CheckCheck, X, Inbox
} from 'lucide-react'
import api from '../../services/axiosInstance'

/* ── Type Config ─────────────────────────────────────── */
const TYPE_CONFIG = {
  new_order:       { label: 'New Order',       icon: Package,    color: 'emerald', bg: 'bg-emerald-500/15', border: 'border-emerald-500/25', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  new_user:        { label: 'New User',         icon: UserPlus,   color: 'sky',     bg: 'bg-sky-500/15',     border: 'border-sky-500/25',     text: 'text-sky-400',     dot: 'bg-sky-400' },
  out_of_stock:    { label: 'Out of Stock',     icon: AlertTriangle, color: 'red',  bg: 'bg-red-500/15',     border: 'border-red-500/25',     text: 'text-red-400',     dot: 'bg-red-400' },
  low_inventory:   { label: 'Low Inventory',   icon: TrendingDown, color: 'orange', bg: 'bg-orange-500/15', border: 'border-orange-500/25',  text: 'text-orange-400',  dot: 'bg-orange-400' },
  coupon_expired:  { label: 'Coupon Expired',  icon: Tag,        color: 'purple',  bg: 'bg-purple-500/15',  border: 'border-purple-500/25',  text: 'text-purple-400',  dot: 'bg-purple-400' },
  payment_failed:  { label: 'Payment Failed',  icon: CreditCard, color: 'rose',    bg: 'bg-rose-500/15',    border: 'border-rose-500/25',    text: 'text-rose-400',    dot: 'bg-rose-400' },
  refund_requested:{ label: 'Refund',          icon: RotateCcw,  color: 'amber',   bg: 'bg-amber-500/15',   border: 'border-amber-500/25',   text: 'text-amber-400',   dot: 'bg-amber-400' },
  order_status:    { label: 'Order Status',    icon: Package,    color: 'blue',    bg: 'bg-blue-500/15',    border: 'border-blue-500/25',    text: 'text-blue-400',    dot: 'bg-blue-400' },
  general:         { label: 'General',         icon: Info,       color: 'white',   bg: 'bg-white/5',        border: 'border-white/10',       text: 'text-white/60',    dot: 'bg-white/40' },
}

const FILTER_TABS = [
  { key: 'all',              label: 'All' },
  { key: 'new_order',        label: 'Orders' },
  { key: 'new_user',         label: 'Users' },
  { key: 'out_of_stock',     label: 'Stock' },
  { key: 'low_inventory',    label: 'Inventory' },
  { key: 'payment_failed',   label: 'Payments' },
  { key: 'refund_requested', label: 'Refunds' },
  { key: 'coupon_expired',   label: 'Coupons' },
]

/* ── Time formatter ──────────────────────────────────── */
const timeAgo = (dateStr) => {
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

/* ── Single Notification Card ────────────────────────── */
const NotificationCard = ({ n, onMarkRead, onDelete, isDeleting, isMarking }) => {
  const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.general
  const Icon = cfg.icon

  return (
    <div
      className={`
        group relative flex items-start gap-4 p-4 rounded-xl border transition-all duration-300
        ${n.read
          ? 'bg-[#16161f]/60 border-white/5 opacity-60 hover:opacity-80'
          : `${cfg.bg} ${cfg.border} shadow-lg hover:shadow-xl`
        }
      `}
    >
      {/* Unread pulse dot */}
      {!n.read && (
        <span className={`absolute top-4 right-4 w-2 h-2 rounded-full ${cfg.dot} animate-pulse`} />
      )}

      {/* Icon */}
      <div className={`
        flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
        ${n.read ? 'bg-white/5 text-white/30' : `${cfg.bg} ${cfg.text}`}
      `}>
        <Icon size={18} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-8">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className={`text-[10px] font-bold uppercase tracking-widest font-mono ${n.read ? 'text-white/30' : cfg.text}`}>
            {cfg.label}
          </span>
          {!n.read && (
            <span className="bg-white/10 text-white/60 text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider">
              New
            </span>
          )}
        </div>
        <h4 className={`font-semibold text-sm leading-snug mb-0.5 ${n.read ? 'text-white/40' : 'text-white'}`}>
          {n.title}
        </h4>
        <p className={`text-xs leading-relaxed ${n.read ? 'text-white/30' : 'text-white/60'}`}>
          {n.message}
        </p>
        <p className="text-[10px] text-white/25 font-mono mt-2">
          {timeAgo(n.createdAt)} · {new Date(n.createdAt).toLocaleString()}
        </p>
      </div>

      {/* Actions (appear on hover) */}
      <div className="absolute right-3 bottom-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {!n.read && (
          <button
            onClick={() => onMarkRead(n._id)}
            disabled={isMarking}
            title="Mark as read"
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 transition-all active:scale-95 disabled:opacity-50"
          >
            <CheckCircle size={13} />
          </button>
        )}
        <button
          onClick={() => onDelete(n._id)}
          disabled={isDeleting}
          title="Delete"
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 transition-all active:scale-95 disabled:opacity-50"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

/* ── Main Panel ──────────────────────────────────────── */
const AdminNotificationsPanel = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [actionIds, setActionIds] = useState({ marking: null, deleting: null })
  const [bulkLoading, setBulkLoading] = useState(false)
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  /* ── Fetch ── */
  const fetchNotifications = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      setError(null)
      const res = await api.get('notifications')
      if (res.data.success) {
        setNotifications(res.data.notifications || [])
      }
    } catch {
      setError('Failed to load notifications.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()

    // Listen for real-time mark-read events from AdminLayout
    const onStorage = () => fetchNotifications(true)
    window.addEventListener('storage', onStorage)
    window.addEventListener('notificationsUpdated', onStorage)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('notificationsUpdated', onStorage)
    }
  }, [fetchNotifications])

  /* ── Computed ── */
  const filtered = notifications
    .filter(n => activeFilter === 'all' || n.type === activeFilter)
    .filter(n => !showUnreadOnly || !n.read)

  const unreadCount = notifications.filter(n => !n.read).length
  const unreadFiltered = filtered.filter(n => !n.read).length

  /* ── Stats by type ── */
  const stats = Object.entries(TYPE_CONFIG).map(([key, cfg]) => ({
    key,
    cfg,
    count: notifications.filter(n => n.type === key).length,
    unread: notifications.filter(n => n.type === key && !n.read).length,
  })).filter(s => s.count > 0)

  /* ── Handlers ── */
  const handleMarkRead = async (id) => {
    setActionIds(p => ({ ...p, marking: id }))
    try {
      await api.put(`notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
      window.dispatchEvent(new Event('notificationsUpdated'))
    } catch { alert('Failed to mark as read.') }
    finally { setActionIds(p => ({ ...p, marking: null })) }
  }

  const handleDelete = async (id) => {
    setActionIds(p => ({ ...p, deleting: id }))
    try {
      await api.delete(`notifications/${id}`)
      setNotifications(prev => prev.filter(n => n._id !== id))
      window.dispatchEvent(new Event('notificationsUpdated'))
    } catch { alert('Failed to delete notification.') }
    finally { setActionIds(p => ({ ...p, deleting: null })) }
  }

  const handleMarkAllRead = async () => {
    setBulkLoading(true)
    try {
      await api.put('notifications/mark-all-read')
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      window.dispatchEvent(new Event('notificationsUpdated'))
    } catch { alert('Failed to mark all as read.') }
    finally { setBulkLoading(false) }
  }

  const handleClearRead = async () => {
    if (!window.confirm('Clear all read notifications? This cannot be undone.')) return
    setBulkLoading(true)
    try {
      await api.delete('notifications/clear-read')
      setNotifications(prev => prev.filter(n => !n.read))
      window.dispatchEvent(new Event('notificationsUpdated'))
    } catch { alert('Failed to clear notifications.') }
    finally { setBulkLoading(false) }
  }

  return (
    <AdminLayout title="Notifications">
      <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
              <Bell size={18} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Notifications</h2>
              <p className="text-[11px] text-white/40">Real-time alerts for orders, users, inventory &amp; more</p>
            </div>
            {unreadCount > 0 && (
              <span className="ml-2 bg-red-500 text-white font-mono text-[10px] font-bold px-2.5 py-1 rounded-full animate-pulse">
                {unreadCount} unread
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => fetchNotifications()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-medium transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={bulkLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-semibold font-mono transition-all active:scale-95 disabled:opacity-50"
              >
                <CheckCheck size={12} />
                Mark All Read
              </button>
            )}
            {notifications.some(n => n.read) && (
              <button
                onClick={handleClearRead}
                disabled={bulkLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold font-mono transition-all active:scale-95 disabled:opacity-50"
              >
                <Trash2 size={12} />
                Clear Read
              </button>
            )}
          </div>
        </div>

        {/* ── Stats Cards ── */}
        {stats.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {stats.map(({ key, cfg, count, unread }) => {
              const Icon = cfg.icon
              return (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key === activeFilter ? 'all' : key)}
                  className={`
                    text-left p-3.5 rounded-xl border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                    ${activeFilter === key ? `${cfg.bg} ${cfg.border}` : 'bg-[#13131a] border-white/5 hover:border-white/10'}
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cfg.bg}`}>
                      <Icon size={14} className={cfg.text} />
                    </div>
                    {unread > 0 && (
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                        {unread} new
                      </span>
                    )}
                  </div>
                  <p className="text-xl font-bold text-white">{count}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-wide">{cfg.label}</p>
                </button>
              )
            })}
          </div>
        )}

        {/* ── Filter Tabs + Toggle ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-1 bg-[#13131a] border border-white/5 rounded-xl p-1 overflow-x-auto no-scrollbar flex-1">
            {FILTER_TABS.map(tab => {
              const count = tab.key === 'all'
                ? notifications.length
                : notifications.filter(n => n.type === tab.key).length
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`
                    flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap
                    ${activeFilter === tab.key
                      ? 'bg-amber-500/20 text-amber-400 shadow-sm'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                    }
                  `}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className={`text-[9px] font-mono font-bold ${activeFilter === tab.key ? 'text-amber-400/70' : 'text-white/25'}`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => setShowUnreadOnly(v => !v)}
            className={`
              flex-shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all
              ${showUnreadOnly
                ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400'
                : 'bg-[#13131a] border border-white/5 text-white/40 hover:text-white/70'
              }
            `}
          >
            <Filter size={12} />
            Unread only
          </button>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
            <AlertTriangle size={16} />
            {error}
            <button onClick={() => fetchNotifications()} className="ml-auto text-xs underline">Retry</button>
          </div>
        )}

        {/* ── Notification List ── */}
        <div className="space-y-2">
          {loading ? (
            /* Skeleton */
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-white/[0.03] border border-white/5 animate-pulse" />
            ))
          ) : filtered.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                <Inbox size={28} className="text-white/15" />
              </div>
              <p className="text-white/30 font-medium">No notifications</p>
              <p className="text-xs text-white/20 max-w-xs">
                {showUnreadOnly
                  ? 'You\'re all caught up! No unread notifications.'
                  : activeFilter !== 'all'
                    ? `No ${TYPE_CONFIG[activeFilter]?.label || activeFilter} notifications yet.`
                    : 'No notifications in your inbox yet.'
                }
              </p>
              {(showUnreadOnly || activeFilter !== 'all') && (
                <button
                  onClick={() => { setShowUnreadOnly(false); setActiveFilter('all') }}
                  className="mt-1 text-xs text-amber-400 hover:text-amber-300 underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Section label */}
              <div className="flex items-center justify-between px-1 pb-1">
                <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider">
                  {filtered.length} notification{filtered.length !== 1 ? 's' : ''}
                  {unreadFiltered > 0 && ` · ${unreadFiltered} unread`}
                </p>
              </div>

              {filtered.map((n) => (
                <NotificationCard
                  key={n._id}
                  n={n}
                  onMarkRead={handleMarkRead}
                  onDelete={handleDelete}
                  isMarking={actionIds.marking === n._id}
                  isDeleting={actionIds.deleting === n._id}
                />
              ))}
            </>
          )}
        </div>

      </div>
    </AdminLayout>
  )
}

export default AdminNotificationsPanel
