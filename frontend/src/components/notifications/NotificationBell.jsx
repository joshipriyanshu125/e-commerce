import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Bell, X, Check, CheckCheck, Trash2, ShoppingBag, Package, Truck, RotateCcw, Tag, Zap, Shield, Info } from 'lucide-react'
import { io } from 'socket.io-client'
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  addNotification,
  setUnreadCount,
} from '../../features/notifications/notificationSlice'

/*
==================================================
SOCKET SINGLETON
==================================================
A single socket connection is shared across the app.
==================================================
*/
let socket = null

const getSocket = () => {
  if (!socket) {
    socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      withCredentials: true,
      autoConnect: false,
    })
  }
  return socket
}

/*
==================================================
NOTIFICATION TYPE → ICON + COLOR MAP
==================================================
*/
const typeConfig = {
  order:        { icon: ShoppingBag,  color: 'text-amber-500',  bg: 'bg-amber-500/10' },
  payment:      { icon: Tag,          color: 'text-emerald-500',bg: 'bg-emerald-500/10' },
  shipping:     { icon: Truck,        color: 'text-blue-500',   bg: 'bg-blue-500/10' },
  delivery:     { icon: Truck,        color: 'text-blue-500',   bg: 'bg-blue-500/10' },
  return:       { icon: RotateCcw,    color: 'text-orange-500', bg: 'bg-orange-500/10' },
  refund:       { icon: RotateCcw,    color: 'text-orange-500', bg: 'bg-orange-500/10' },
  wishlist:     { icon: Zap,          color: 'text-pink-500',   bg: 'bg-pink-500/10' },
  price_drop:   { icon: Tag,          color: 'text-green-500',  bg: 'bg-green-500/10' },
  back_in_stock:{ icon: Package,      color: 'text-purple-500', bg: 'bg-purple-500/10' },
  promotion:    { icon: Zap,          color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  security:     { icon: Shield,       color: 'text-red-500',    bg: 'bg-red-500/10' },
  admin:        { icon: Shield,       color: 'text-red-500',    bg: 'bg-red-500/10' },
  general:      { icon: Info,         color: 'text-atelier-gray',bg: 'bg-atelier-lightgray/20' },
}

const getTypeConfig = (type) => typeConfig[type] || typeConfig.general

/*
==================================================
RELATIVE TIME HELPER
==================================================
*/
const relativeTime = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  if (d < 7)  return `${d}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

/*
==================================================
NOTIFICATION BELL COMPONENT
==================================================
*/
const NotificationBell = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { items, unreadCount, loading } = useSelector((s) => s.notifications)
  const { user, isAuthenticated }       = useSelector((s) => s.auth)

  const [isOpen, setIsOpen] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const panelRef = useRef(null)

  /* ── Initial data load ──────────────────────────────────── */
  useEffect(() => {
    if (!isAuthenticated || !user) return
    if (!initialized) {
      dispatch(fetchNotifications({ page: 1, limit: 15, view: 'user' }))
      dispatch(fetchUnreadCount({ view: 'user' }))
      setInitialized(true)
    }
  }, [isAuthenticated, user, initialized, dispatch])

  /* ── Socket.IO real-time listener ──────────────────────── */
  useEffect(() => {
    if (!isAuthenticated || !user?._id) return

    const sock = getSocket()

    if (!sock.connected) {
      sock.connect()
    }

    // Join user's private room
    sock.emit('join', user._id)

    const handleNew = (notification) => {
      const adminTypes = ["new_order", "new_user", "payment_failed", "return_requested", "refund_requested", "low_inventory", "out_of_stock", "coupon_expired", "negative_review", "admin"]
      if (!adminTypes.includes(notification.type)) {
        dispatch(addNotification(notification))
      }
    }

    const handleCount = (count) => {
      dispatch(setUnreadCount(count))
    }

    sock.on('newNotification', handleNew)
    sock.on('unreadCountUser', handleCount)

    return () => {
      sock.off('newNotification', handleNew)
      sock.off('unreadCountUser', handleCount)
    }
  }, [isAuthenticated, user?._id, dispatch])

  /* ── Cleanup socket on logout ───────────────────────────── */
  useEffect(() => {
    if (!isAuthenticated && socket?.connected) {
      socket.disconnect()
    }
  }, [isAuthenticated])

  /* ── Close panel when clicking outside ─────────────────── */
  useEffect(() => {
    const handleOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleOutside)
    }
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [isOpen])

  /* ── Handlers ────────────────────────────────────────────── */
  const handleBellClick = () => {
    setIsOpen((prev) => !prev)
  }

  const handleMarkRead = useCallback(async (e, id) => {
    e.stopPropagation()
    dispatch(markAsRead(id))
  }, [dispatch])

  const handleDelete = useCallback(async (e, id) => {
    e.stopPropagation()
    dispatch(deleteNotification(id))
  }, [dispatch])

  const handleMarkAll = useCallback(() => {
    dispatch(markAllAsRead())
  }, [dispatch])

  const handleNotificationClick = useCallback((notif) => {
    if (!notif.read) dispatch(markAsRead(notif._id))
    setIsOpen(false)
    if (notif.link) {
      navigate(notif.link)
    }
  }, [dispatch, navigate])

  const handleViewAll = () => {
    setIsOpen(false)
    navigate('/notifications')
  }

  if (!isAuthenticated) return null

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        onClick={handleBellClick}
        className="p-2 text-atelier-dark hover:opacity-70 transition-opacity relative"
        aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell size={20} strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span
            className="absolute top-0.5 right-0.5 bg-red-500 text-white text-xs font-mono min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-bold leading-none"
            aria-hidden="true"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          id="notification-dropdown"
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-atelier-beige border border-atelier-lightgray shadow-2xl z-50 animate-fade-in flex flex-col"
          style={{ maxHeight: '520px' }}
          role="region"
          aria-label="Notifications panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-atelier-lightgray/60 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-atelier-dark" />
              <span className="font-mono text-xs tracking-widest uppercase text-atelier-dark font-semibold">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="p-1.5 text-atelier-gray hover:text-atelier-dark transition-colors"
                  title="Mark all as read"
                  aria-label="Mark all notifications as read"
                >
                  <CheckCheck size={15} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-atelier-gray hover:text-atelier-dark transition-colors"
                aria-label="Close notifications"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto flex-1 divide-y divide-atelier-lightgray/30">
            {loading && items.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-atelier-dark border-t-transparent rounded-full animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-12 h-12 bg-atelier-lightgray/20 rounded-full flex items-center justify-center mb-3">
                  <Bell size={20} className="text-atelier-gray/50" />
                </div>
                <p className="font-serif text-sm text-atelier-gray">All caught up!</p>
                <p className="text-xs text-atelier-gray/60 font-mono mt-1">No notifications yet</p>
              </div>
            ) : (
              items.map((notif) => {
                const { icon: Icon, color, bg } = getTypeConfig(notif.type)
                return (
                  <div
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors group ${
                      notif.read
                        ? 'bg-transparent hover:bg-atelier-lightgray/10'
                        : 'bg-amber-50/40 hover:bg-amber-50/60'
                    }`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleNotificationClick(notif)}
                  >
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full ${bg} flex items-center justify-center mt-0.5`}>
                      <Icon size={14} className={color} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold leading-snug truncate ${notif.read ? 'text-atelier-gray' : 'text-atelier-dark'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-atelier-gray/80 leading-snug mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-atelier-gray/50 font-mono mt-1">
                        {relativeTime(notif.createdAt)}
                      </p>
                    </div>

                    {/* Unread dot + actions */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-1.5 pt-0.5">
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" aria-hidden="true" />
                      )}
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notif.read && (
                          <button
                            onClick={(e) => handleMarkRead(e, notif._id)}
                            className="p-1 rounded text-atelier-gray hover:text-emerald-600 transition-colors"
                            title="Mark as read"
                            aria-label="Mark as read"
                          >
                            <Check size={12} />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(e, notif._id)}
                          className="p-1 rounded text-atelier-gray hover:text-red-500 transition-colors"
                          title="Delete notification"
                          aria-label="Delete notification"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="px-4 py-2.5 border-t border-atelier-lightgray/60 flex-shrink-0">
              <button
                onClick={handleViewAll}
                className="w-full text-center font-mono text-xs tracking-widest uppercase text-atelier-dark hover:underline transition-all"
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell
