import React, { useState, useEffect } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { Users, Trash2, Calendar, Mail, ShieldAlert, ShieldCheck } from 'lucide-react'
import api from '../../services/axiosInstance'

const AdminUsersManager = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('users')
      if (res.data.success) {
        setUsers(res.data.users || [])
      }
    } catch (err) {
      console.error(err)
      setError('Failed to fetch users from the server.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user account? This action is permanent.')) return
    try {
      setDeletingId(userId)
      const res = await api.delete(`users/${userId}`)
      if (res.data.success) {
        setUsers(prev => prev.filter(u => u._id !== userId))
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Calculate stats
  const totalUsersCount = users.length
  const adminUsersCount = users.filter(u => u.role === 'admin').length
  const regularUsersCount = totalUsersCount - adminUsersCount

  return (
    <AdminLayout title="Users">
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-white">User Registry</h2>
          <p className="text-xs text-white/40 mt-1">Manage customer profiles, roles, and platform permissions</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* User Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-[#13131a] border border-white/5 p-6 rounded-xl space-y-2">
            <p className="text-xs font-mono uppercase tracking-wider text-white/40">Total Registered Users</p>
            <p className="text-3xl font-bold text-white font-mono">{loading ? '...' : totalUsersCount}</p>
          </div>
          <div className="bg-[#13131a] border border-white/5 p-6 rounded-xl space-y-2">
            <p className="text-xs font-mono uppercase tracking-wider text-white/40">Customer Accounts</p>
            <p className="text-3xl font-bold text-amber-400 font-mono">{loading ? '...' : regularUsersCount}</p>
          </div>
          <div className="bg-[#13131a] border border-white/5 p-6 rounded-xl space-y-2">
            <p className="text-xs font-mono uppercase tracking-wider text-white/40">Administrators</p>
            <p className="text-3xl font-bold text-indigo-400 font-mono">{loading ? '...' : adminUsersCount}</p>
          </div>
        </div>

        {/* Users Registry Table */}
        <div className="bg-[#13131a] border border-white/5 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-6">User Accounts Registry</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-white/40 uppercase tracking-wider font-mono">
                  <th className="pb-3 font-semibold">User Details</th>
                  <th className="pb-3 font-semibold">Email Address</th>
                  <th className="pb-3 font-semibold">Account Role</th>
                  <th className="pb-3 font-semibold">Date Joined</th>
                  <th className="pb-3 font-semibold text-right">Delete Account</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-white/20 font-mono">Loading users registry...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-white/20 font-mono">No registered users found.</td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u._id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-3.5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center font-bold text-white/80 font-mono uppercase text-xs">
                          {u.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-white/90">{u.name}</p>
                          <p className="text-[10px] text-white/40 font-mono mt-0.5">ID: {u._id.slice(-6).toUpperCase()}</p>
                        </div>
                      </td>
                      <td className="py-3.5 font-mono text-white/70">{u.email}</td>
                      <td className="py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-wide border ${
                          u.role === 'admin' 
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {u.role === 'admin' ? <ShieldAlert size={10} /> : <ShieldCheck size={10} />}
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 font-mono text-white/60">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          disabled={deletingId === u._id}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/5 border border-red-500/10 text-red-400 hover:bg-red-500/20 transition-all font-mono text-[10px] uppercase tracking-wider disabled:opacity-50"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AdminLayout>
  )
}

export default AdminUsersManager
