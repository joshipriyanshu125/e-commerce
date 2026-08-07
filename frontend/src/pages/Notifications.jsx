import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Package,
  Truck,
  RotateCcw,
  Tag,
  Zap,
  Shield,
  Info
} from 'lucide-react'
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../features/notifications/notificationSlice'

/*
==================================================
NOTIFICATION TYPE → ICON + COLOR MAP
==================================================
*/
const typeConfig = {
  order:        { icon: ShoppingBag,  color: 'text-amber-500',  bg: 'bg-amber-500/10', label: 'Orders' },
  payment:      { icon: Tag,          color: 'text-emerald-500',bg: 'bg-emerald-500/10', label: 'Payments' },
  shipping:     { icon: Truck,        color: 'text-blue-500',   bg: 'bg-blue-500/10', label: 'Shipping' },
  delivery:     { icon: Truck,        color: 'text-blue-500',   bg: 'bg-blue-500/10', label: 'Delivery' },
  return:       { icon: RotateCcw,    color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Returns' },
  refund:       { icon: RotateCcw,    color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Refunds' },
  wishlist:     { icon: Zap,          color: 'text-pink-500',   bg: 'bg-pink-500/10', label: 'Wishlist' },
  price_drop:   { icon: Tag,          color: 'text-green-500',  bg: 'bg-green-500/10', label: 'Price Drops' },
  back_in_stock:{ icon: Package,      color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Restocks' },
  promotion:    { icon: Zap,          color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Offers' },
  security:     { icon: Shield,       color: 'text-red-500',    bg: 'bg-red-500/10', label: 'Security' },
  admin:        { icon: Shield,       color: 'text-red-500',    bg: 'bg-red-500/10', label: 'System' },
  general:      { icon: Info,         color: 'text-atelier-gray',bg: 'bg-atelier-lightgray/20', label: 'General' }
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
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const Notifications = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const { items, loading, currentPage, totalPages, totalCount, unreadCount } = useSelector((s) => s.notifications)
  const { user } = useSelector((s) => s.auth)

  const activeFilter = searchParams.get('filter') || 'all'
  const page = parseInt(searchParams.get('page') || '1', 10)

  // Filters configuration for history tabs
  const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'order', label: 'Orders' },
    { key: 'wishlist', label: 'Wishlist & Price' },
    { key: 'promotion', label: 'Offers' },
    { key: 'security', label: 'Security' }
  ]

  useEffect(() => {
    dispatch(fetchNotifications({ page, limit: 10, filter: activeFilter }))
  }, [dispatch, page, activeFilter])

  const handleFilterChange = (filterKey) => {
    setSearchParams({ filter: filterKey, page: '1' })
  }

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return
    setSearchParams({ filter: activeFilter, page: newPage.toString() })
  }

  const handleNotificationClick = (notif) => {
    if (!notif.read) {
      dispatch(markAsRead(notif._id))
    }
    if (notif.link) {
      navigate(notif.link)
    }
  }

  const handleMarkAllRead = () => {
    dispatch(markAllAsRead())
  }

  const handleMarkSingleRead = (e, id) => {
    e.stopPropagation()
    dispatch(markAsRead(id))
  }

  const handleDeleteSingle = (e, id) => {
    e.stopPropagation()
    if (window.confirm('Delete this notification permanently?')) {
      dispatch(deleteNotification(id))
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in font-sans min-h-[60vh]">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between border-b border-atelier-lightgray/50 pb-6 mb-8 gap-4">
        <div>
          <span className="font-mono text-xs sm:text-sm tracking-[0.25em] uppercase text-atelier-gray block mb-1">
            Updates & Alerts
          </span>
          <h1 className="font-serif text-4xl text-atelier-dark font-semibold flex items-center gap-3">
            Notifications
            {unreadCount > 0 && (
              <span className="text-xs font-mono font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
                {unreadCount} New
              </span>
            )}
          </h1>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-4 py-2 border border-atelier-dark text-xs font-mono tracking-widest uppercase hover:bg-atelier-dark hover:text-white transition-all duration-200"
          >
            <CheckCheck size={14} />
            Mark all as read
          </button>
        )}
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex border-b border-atelier-lightgray/30 mb-8 overflow-x-auto gap-6 pb-0.5 no-scrollbar">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleFilterChange(tab.key)}
            className={`font-mono text-xs sm:text-sm tracking-widest uppercase pb-3 border-b-2 whitespace-nowrap transition-colors ${
              activeFilter === tab.key
                ? 'border-atelier-dark text-atelier-dark font-bold'
                : 'border-transparent text-atelier-gray hover:text-atelier-dark'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Notifications List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-atelier-lightgray/20 rounded border border-atelier-lightgray/30" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="border border-dashed border-atelier-lightgray p-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-atelier-lightgray/10 flex items-center justify-center mx-auto">
              <Bell size={24} className="text-atelier-gray" />
            </div>
            <div>
              <h3 className="font-serif text-lg text-atelier-dark font-medium">No Notifications</h3>
              <p className="text-xs text-atelier-gray font-mono mt-1">
                {activeFilter === 'all'
                  ? 'We will update you when things happen.'
                  : `No ${activeFilter} alerts found at the moment.`}
              </p>
            </div>
          </div>
        ) : (
          <div className="border border-atelier-lightgray/40 divide-y divide-atelier-lightgray/30 bg-white/30">
            {items.map((notif) => {
              const { icon: Icon, color, bg, label } = getTypeConfig(notif.type)
              return (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex items-start gap-4 p-5 cursor-pointer transition-all group relative ${
                    notif.read ? 'bg-transparent' : 'bg-amber-50/20'
                  } hover:bg-atelier-lightgray/5`}
                >
                  {/* Left Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full ${bg} flex items-center justify-center`}>
                    <Icon size={18} className={color} />
                  </div>

                  {/* Body details */}
                  <div className="flex-1 min-w-0 pr-12">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-mono tracking-wider uppercase px-1.5 py-0.5 rounded ${bg} ${color} font-medium`}>
                        {label}
                      </span>
                      <span className="text-[10px] text-atelier-gray/50 font-mono">
                        {relativeTime(notif.createdAt)}
                      </span>
                    </div>

                    <h4 className={`text-sm font-serif ${notif.read ? 'text-atelier-gray' : 'text-atelier-dark font-semibold'} leading-snug`}>
                      {notif.title}
                    </h4>
                    <p className="text-xs text-atelier-gray/80 font-sans leading-relaxed mt-1">
                      {notif.message}
                    </p>
                  </div>

                  {/* Actions & Unread Indicator */}
                  <div className="absolute right-4 top-4 bottom-4 flex flex-col justify-between items-end">
                    {!notif.read && (
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 block" aria-label="Unread" />
                    )}
                    <span className="flex-grow" />
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notif.read && (
                        <button
                          onClick={(e) => handleMarkSingleRead(e, notif._id)}
                          className="p-1.5 rounded border border-atelier-lightgray hover:border-emerald-600 hover:text-emerald-600 transition-all text-atelier-gray"
                          title="Mark as read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDeleteSingle(e, notif._id)}
                        className="p-1.5 rounded border border-atelier-lightgray hover:border-red-500 hover:text-red-500 transition-all text-atelier-gray"
                        title="Delete notification"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-atelier-lightgray/40 pt-6 mt-8 font-mono text-xs">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-1.5 border border-atelier-lightgray uppercase hover:border-atelier-dark transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft size={14} /> Prev
          </button>

          <span className="text-atelier-gray font-mono">
            Page {currentPage} of {totalPages} ({totalCount} items)
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 border border-atelier-lightgray uppercase hover:border-atelier-dark transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

export default Notifications
