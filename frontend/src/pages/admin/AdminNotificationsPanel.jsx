import React, { useState, useEffect } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { Bell, Eye, Calendar, Mail, CheckCircle, Trash } from 'lucide-react'
import api from '../../services/axiosInstance'

const AdminNotificationsPanel = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [markingId, setMarkingId] = useState(null)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('notifications')
      if (res.data.success) {
        setNotifications(res.data.notifications || [])
      }
    } catch (err) {
      console.error(err)
      setError('Failed to fetch notifications.')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id) => {
    try {
      setMarkingId(id)
      const res = await api.put(`notifications/${id}/read`)
      if (res.data.success) {
        // Update local status
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
        // Trigger a custom event to notify AdminLayout header to update immediately
        window.dispatchEvent(new Event('storage')) 
      }
    } catch (err) {
      alert('Failed to mark notification as read.')
    } finally {
      setMarkingId(null)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const unreadNotifications = notifications.filter(n => !n.read)
  const readNotifications = notifications.filter(n => n.read)

  return (
    <AdminLayout title="Notifications">
      <div className="p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Notifications Panel</h2>
            <p className="text-xs text-white/40 mt-1">Audit order updates, system alerts, and customer messages</p>
          </div>
          {unreadNotifications.length > 0 && (
            <span className="bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-[10px] px-3 py-1 rounded-full uppercase tracking-wider font-semibold animate-pulse">
              {unreadNotifications.length} Unread Alerts
            </span>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <div className="bg-[#13131a] border border-white/5 rounded-xl p-6 space-y-6">
          <h3 className="font-semibold text-white">Inbox Feed</h3>
          
          <div className="space-y-4">
            {loading ? (
              <div className="py-12 text-center text-white/20 text-xs font-mono">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-white/20 text-xs italic">
                No notifications in your inbox.
              </div>
            ) : (
              notifications.map((n, idx) => (
                <div 
                  key={n._id || idx} 
                  className={`p-5 rounded-xl border transition-all flex items-start justify-between gap-6 ${
                    n.read 
                      ? 'bg-[#15151e]/40 border-white/5 opacity-60' 
                      : 'bg-[#1c1c24] border-white/10 shadow-lg'
                  }`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-lg ${n.read ? 'bg-white/5 text-white/40' : 'bg-amber-500/10 text-amber-400'}`}>
                        <Bell size={14} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-xs">{n.title}</h4>
                        <p className="text-[9px] text-white/30 font-mono mt-0.5">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!n.read && (
                        <span className="bg-red-500 text-white text-[8px] font-mono font-bold px-1 py-0.5 rounded uppercase tracking-wider">
                          New
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-white/80 leading-relaxed font-sans pl-1">
                      {n.message}
                    </p>
                  </div>

                  {!n.read && (
                    <button
                      onClick={() => handleMarkAsRead(n._id)}
                      disabled={markingId === n._id}
                      className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-600 active:scale-95 text-black font-semibold font-mono text-[9px] uppercase tracking-wider transition-all disabled:opacity-50"
                    >
                      <CheckCircle size={10} /> Mark Read
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </AdminLayout>
  )
}

export default AdminNotificationsPanel
