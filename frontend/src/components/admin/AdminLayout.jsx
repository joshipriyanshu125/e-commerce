import React, { useState, useEffect, useRef, useCallback } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../features/auth/authSlice'
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  Star, Tag, Bell, Settings, LogOut, Menu, X, ChevronRight, FolderTree,
  CheckCircle, Trash2, CheckCheck, AlertTriangle, UserPlus, CreditCard,
  RotateCcw, TrendingDown, Info, Package as PackageIcon, FileText
} from 'lucide-react'
import api from '../../services/axiosInstance'
import { io } from 'socket.io-client'

/* ── Type config (mirrors NotificationsPanel) ────────── */
const TYPE_CFG = {
  new_order:        { icon: PackageIcon,   text: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  new_user:         { icon: UserPlus,      text: 'text-sky-400',     bg: 'bg-sky-500/15' },
  out_of_stock:     { icon: AlertTriangle, text: 'text-red-400',     bg: 'bg-red-500/15' },
  low_inventory:    { icon: TrendingDown,  text: 'text-orange-400',  bg: 'bg-orange-500/15' },
  coupon_expired:   { icon: Tag,           text: 'text-purple-400',  bg: 'bg-purple-500/15' },
  payment_failed:   { icon: CreditCard,    text: 'text-rose-400',    bg: 'bg-rose-500/15' },
  refund_requested: { icon: RotateCcw,     text: 'text-amber-400',   bg: 'bg-amber-500/15' },
  order_status:     { icon: PackageIcon,   text: 'text-blue-400',    bg: 'bg-blue-500/15' },
  general:          { icon: Info,          text: 'text-white/60',    bg: 'bg-white/5' },
}

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const navItems = [
  { to: '/admin',               label: 'Dashboard',    icon: LayoutDashboard, end: true },
  { to: '/admin/products',      label: 'Products',     icon: Package },
  { to: '/admin/categories',    label: 'Categories',   icon: FolderTree },
  { to: '/admin/orders',        label: 'Orders',       icon: ShoppingCart },
  { to: '/admin/users',         label: 'Users',        icon: Users },
  { to: '/admin/reviews',       label: 'Reviews',      icon: Star },
  { to: '/admin/coupons',       label: 'Coupons',      icon: Tag },
  { to: '/admin/invoices',      label: 'Invoices',     icon: FileText },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
  { to: '/admin/settings',      label: 'Settings',     icon: Settings },
]

/* ── Notification Dropdown ───────────────────────────── */
const NotificationDropdown = ({ notifications, unreadCount, onMarkRead, onDelete, onMarkAll, onViewAll, onClose }) => {
  const preview = notifications.slice(0, 8)

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-[#1a1a24] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 z-[100] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-amber-400" />
          <span className="text-sm font-semibold text-white">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAll}
              className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-emerald-400 transition-colors"
              title="Mark all read"
            >
              <CheckCheck size={13} />
            </button>
          )}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
            <X size={13} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto no-scrollbar">
        {notifications.length === 0 ? (
          <div className="py-10 text-center">
            <Bell size={24} className="mx-auto text-white/10 mb-2" />
            <p className="text-xs text-white/25">No notifications</p>
          </div>
        ) : (
          preview.map((n) => {
            const cfg = TYPE_CFG[n.type] || TYPE_CFG.general
            const Icon = cfg.icon
            return (
              <div
                key={n._id}
                className={`group flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] transition-colors hover:bg-white/[0.03] ${!n.read ? 'bg-white/[0.02]' : ''}`}
              >
                {/* Type icon */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center mt-0.5`}>
                  <Icon size={13} className={cfg.text} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />}
                    <p className={`text-xs font-semibold truncate ${n.read ? 'text-white/50' : 'text-white'}`}>
                      {n.title}
                    </p>
                  </div>
                  <p className="text-[10px] text-white/35 line-clamp-2 leading-relaxed">{n.message}</p>
                  <p className="text-[9px] text-white/20 font-mono mt-1">{timeAgo(n.createdAt)}</p>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!n.read && (
                    <button
                      onClick={() => onMarkRead(n._id)}
                      className="w-5 h-5 flex items-center justify-center rounded bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 transition-colors"
                    >
                      <CheckCircle size={10} />
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(n._id)}
                    className="w-5 h-5 flex items-center justify-center rounded bg-red-500/10 hover:bg-red-500/25 text-red-400 transition-colors"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2.5 border-t border-white/5">
          <button
            onClick={onViewAll}
            className="w-full text-center text-[11px] text-amber-400 hover:text-amber-300 font-semibold transition-colors"
          >
            View all notifications →
          </button>
        </div>
      )}
    </div>
  )
}

/* ── AdminLayout ─────────────────────────────────────── */
const AdminLayout = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector(state => state.auth)

  const unreadCount = notifications.filter(n => !n.read).length

  /* ── Fetch ── */
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('notifications', { params: { view: 'admin' } })
      if (res.data.success) {
        setNotifications(res.data.notifications || [])
      }
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)

    // Socket.IO real-time notification listener
    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'
    const socket = io(socketUrl, { withCredentials: true, transports: ['websocket', 'polling'] })

    if (user?._id || user?.id) {
      socket.emit('join', user._id || user.id)
    }

    const handleNewNotif = () => {
      fetchNotifications()
    }

    socket.on('newNotification', handleNewNotif)
    socket.on('adminNotification', handleNewNotif)
    socket.on('newOrder', handleNewNotif)

    // Listen for updates from the notifications panel
    const onUpdate = () => fetchNotifications()
    window.addEventListener('notificationsUpdated', onUpdate)
    window.addEventListener('storage', onUpdate)

    return () => {
      clearInterval(interval)
      socket.off('newNotification', handleNewNotif)
      socket.off('adminNotification', handleNewNotif)
      socket.off('newOrder', handleNewNotif)
      socket.disconnect()
      window.removeEventListener('notificationsUpdated', onUpdate)
      window.removeEventListener('storage', onUpdate)
    }
  }, [fetchNotifications, user])

  /* ── Close dropdown on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  /* ── Dropdown handlers ── */
  const handleMarkRead = async (id) => {
    try {
      await api.put(`notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
      window.dispatchEvent(new Event('notificationsUpdated'))
    } catch { /* silent */ }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`notifications/${id}`)
      setNotifications(prev => prev.filter(n => n._id !== id))
      window.dispatchEvent(new Event('notificationsUpdated'))
    } catch { /* silent */ }
  }

  const handleMarkAll = async () => {
    try {
      await api.put('notifications/mark-all-read')
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      window.dispatchEvent(new Event('notificationsUpdated'))
    } catch { /* silent */ }
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-[#0f0f14] text-white overflow-hidden font-sans">

      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#13131a] border-r border-white/5
        flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <span className="text-black font-bold text-xs">A</span>
            </div>
            <div>
              <p className="font-semibold text-sm text-white tracking-wide">Atelier Admin</p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">Control Panel</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/40 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} className={isActive ? 'text-amber-400' : 'text-white/40 group-hover:text-white/70'} />
                  <span>{label}</span>
                  {label === 'Notifications' && unreadCount > 0 && (
                    <span className="absolute right-8 top-1/2 -translate-y-1/2 bg-red-500 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[15px] text-center shadow-md animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                  {isActive && <ChevronRight size={14} className="ml-auto text-amber-400/60" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="px-3 py-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-black font-bold text-xs uppercase flex-shrink-0">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'Admin'}</p>
              <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-[#13131a] border-b border-white/5 flex items-center px-4 lg:px-6 gap-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-white/50 hover:text-white"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-sm font-semibold text-white/80 tracking-wide">{title || 'Admin'}</h1>

          <div className="ml-auto flex items-center gap-3">
            {/* Notification bell */}
            <div className="relative" ref={dropdownRef}>
              <button
                id="admin-notification-bell"
                onClick={() => setDropdownOpen(v => !v)}
                className={`
                  relative w-9 h-9 flex items-center justify-center rounded-xl transition-all
                  ${dropdownOpen
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-transparent'
                  }
                `}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white font-mono text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {dropdownOpen && (
                <NotificationDropdown
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onMarkRead={handleMarkRead}
                  onDelete={handleDelete}
                  onMarkAll={handleMarkAll}
                  onViewAll={() => { navigate('/admin/notifications'); setDropdownOpen(false) }}
                  onClose={() => setDropdownOpen(false)}
                />
              )}
            </div>

            <span className="text-[10px] font-mono bg-amber-500/15 text-amber-400 px-2 py-1 rounded-full uppercase tracking-widest">
              Admin Mode
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-[#0f0f14]">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
