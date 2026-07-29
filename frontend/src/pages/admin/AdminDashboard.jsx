import React, { useState, useEffect } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { 
  DollarSign, ShoppingBag, Users, Package, 
  ArrowUpRight, ArrowDownRight, RefreshCw, Eye 
} from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../services/axiosInstance'

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch analytics and orders in parallel
      const [analyticsRes, ordersRes] = await Promise.all([
        api.get('admin/analytics'),
        api.get('orders')
      ])

      setAnalytics(analyticsRes.data.analytics)
      // Grab the 5 most recent orders
      if (ordersRes.data.orders) {
        setRecentOrders(ordersRes.data.orders.slice(0, 5))
      }
    } catch (err) {
      console.error(err)
      setError('Failed to fetch dashboard data. Please make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const stats = [
    { 
      label: 'Total Revenue', 
      value: analytics ? `$${analytics.totalRevenue.toFixed(2)}` : '$0.00', 
      icon: DollarSign,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400' 
    },
    { 
      label: 'Total Orders', 
      value: analytics ? analytics.totalOrders : '0', 
      icon: ShoppingBag, 
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400' 
    },
    { 
      label: 'Registered Users', 
      value: analytics ? analytics.totalUsers : '0', 
      icon: Users, 
      color: 'from-blue-500/20 to-indigo-500/20 text-blue-400' 
    },
    { 
      label: 'Active Products', 
      value: analytics ? analytics.totalProducts : '0', 
      icon: Package, 
      color: 'from-purple-500/20 to-pink-500/20 text-purple-400' 
    },
  ]

  return (
    <AdminLayout title="Dashboard">
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Overview</h2>
            <p className="text-xs text-white/40 mt-1">Real-time store performance &amp; statistics</p>
          </div>
          <button 
            onClick={loadDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 text-xs text-white/70 hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <div 
                key={i} 
                className="bg-[#13131a] border border-white/5 p-6 rounded-xl relative overflow-hidden group hover:border-white/10 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <p className="text-xs font-mono uppercase tracking-wider text-white/40">{stat.label}</p>
                    <p className="text-2xl font-bold text-white font-mono">{loading ? '...' : stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
                    <Icon size={18} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Recent Orders */}
          <div className="lg:col-span-8 bg-[#13131a] border border-white/5 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white">Recent Orders</h3>
                <p className="text-xs text-white/40 mt-0.5">Latest purchase requests from customers</p>
              </div>
              <Link 
                to="/admin/orders" 
                className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 hover:underline"
              >
                View All <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-white/40 uppercase tracking-wider font-mono">
                    <th className="pb-3 font-semibold">Order ID</th>
                    <th className="pb-3 font-semibold">Customer</th>
                    <th className="pb-3 font-semibold">Total Price</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-white/20 font-mono">Loading recent orders...</td>
                    </tr>
                  ) : recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-white/20 font-mono">No orders found yet.</td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 font-mono font-medium text-white/90">#{order._id.slice(-6).toUpperCase()}</td>
                        <td className="py-3.5 text-white/70">{order.shippingInfo?.fullName || 'Guest'}</td>
                        <td className="py-3.5 font-mono text-white/90">${order.totalPrice.toFixed(2)}</td>
                        <td className="py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-wide border ${
                            order.orderStatus === 'Delivered' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : order.orderStatus === 'Cancelled'
                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {order.orderStatus}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <Link 
                            to="/admin/orders" 
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/5 text-white/70 hover:bg-white/10 transition-all font-mono"
                          >
                            <Eye size={12} /> View
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Products */}
          <div className="lg:col-span-4 bg-[#13131a] border border-white/5 rounded-xl p-6 space-y-6">
            <div>
              <h3 className="font-semibold text-white">Top Selling Products</h3>
              <p className="text-xs text-white/40 mt-0.5">Most popular items in terms of sales volume</p>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="py-6 text-center text-white/20 text-xs font-mono">Loading products...</div>
              ) : !analytics || !analytics.topProducts || analytics.topProducts.length === 0 ? (
                <div className="py-6 text-center text-white/20 text-xs font-mono">No sales recorded yet.</div>
              ) : (
                analytics.topProducts.map((p, i) => (
                  <div key={i} className="flex items-center gap-3.5 group">
                    <div className="h-10 w-10 bg-white/5 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border border-white/5">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <Package size={16} className="text-white/20" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-white group-hover:text-amber-400 transition-colors truncate">{p.name}</p>
                      <p className="text-[10px] text-white/40 font-mono mt-0.5">${p.price?.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs text-amber-400 font-semibold">{p.totalSold} sold</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </AdminLayout>
  )
}

export default AdminDashboard
