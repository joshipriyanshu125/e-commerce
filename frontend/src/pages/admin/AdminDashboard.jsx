import React, { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import AIAnalyticsChat from '../../components/admin/AIAnalyticsChat'
import AISalesInsightsCard from '../../components/admin/AISalesInsightsCard'
import {
  DollarSign, ShoppingBag, Users, Package,
  ArrowUpRight, RefreshCw, TrendingUp, TrendingDown,
  Eye, BarChart2, PieChart, ShoppingCart, Star, UserCheck, UserPlus, Heart
} from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../services/axiosInstance'
import { io } from 'socket.io-client'

// ─── Month name helper ────────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ─── SVG Bar Chart ────────────────────────────────────────────────────────────
const BarChart = ({ data, color = '#f59e0b', labelKey, valueKey, valuePrefix = '', valueSuffix = '', height = 160 }) => {
  const max = Math.max(...data.map(d => d[valueKey]), 1)
  const barWidth = Math.max(8, Math.floor(300 / data.length) - 4)

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${Math.max(data.length * (barWidth + 4), 300)} ${height + 32}`}
        width="100%"
        style={{ minWidth: Math.max(data.length * (barWidth + 4), 300) }}
      >
        {data.map((d, i) => {
          const barH = Math.max(2, Math.round((d[valueKey] / max) * height))
          const x = i * (barWidth + 4)
          const y = height - barH
          return (
            <g key={i}>
              {/* bg track */}
              <rect x={x} y={0} width={barWidth} height={height} rx={3} fill="rgba(255,255,255,0.03)" />
              {/* filled bar */}
              <rect x={x} y={y} width={barWidth} height={barH} rx={3} fill={color} opacity={0.85}>
                <title>{valuePrefix}{typeof d[valueKey] === 'number' ? d[valueKey].toLocaleString(undefined, { maximumFractionDigits: 0 }) : d[valueKey]}{valueSuffix}</title>
              </rect>
              {/* label */}
              <text
                x={x + barWidth / 2}
                y={height + 14}
                textAnchor="middle"
                fontSize={9}
                fill="rgba(255,255,255,0.35)"
                fontFamily="monospace"
              >
                {d[labelKey]}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ─── Horizontal Bar Chart ─────────────────────────────────────────────────────
const HBarChart = ({ data, color = '#8b5cf6', labelKey, valueKey, valuePrefix = '' }) => {
  const max = Math.max(...data.map(d => d[valueKey]), 1)
  return (
    <div className="space-y-2.5">
      {data.map((d, i) => {
        const pct = Math.max(2, Math.round((d[valueKey] / max) * 100))
        return (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-white/60 truncate max-w-[60%]">{d[labelKey] || 'Unknown'}</span>
              <span className="text-white/80">{valuePrefix}{typeof d[valueKey] === 'number' ? d[valueKey].toLocaleString(undefined, { maximumFractionDigits: 0 }) : d[valueKey]}</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────
const DonutChart = ({ slices, size = 120 }) => {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1
  let offset = 0
  const r = 42
  const circ = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
      {slices.map((s, i) => {
        const pct = s.value / total
        const dash = pct * circ
        const gap = circ - dash
        const el = (
          <circle
            key={i}
            cx="50" cy="50" r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="12"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset * circ}
            transform="rotate(-90 50 50)"
            opacity={0.85}
          />
        )
        offset += pct
        return el
      })}
    </svg>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, gradient, sub, loading }) => (
  <div className={`relative overflow-hidden rounded-2xl border border-white/[0.07] p-5 group hover:border-white/[0.13] transition-all duration-300`}
    style={{ background: 'rgba(19,19,26,0.9)' }}>
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      style={{ background: gradient, opacity: 0.04 }} />
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2">{label}</p>
        <p className="text-2xl font-bold text-white font-mono tracking-tight">
          {loading ? <span className="inline-block w-20 h-6 bg-white/10 rounded animate-pulse" /> : value}
        </p>
        {sub && !loading && (
          <p className="text-[10px] text-white/30 font-mono mt-1">{sub}</p>
        )}
      </div>
      <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: gradient }}>
        <Icon size={16} className="text-white" />
      </div>
    </div>
  </div>
)

// ─── Chart Panel ─────────────────────────────────────────────────────────────
const ChartPanel = ({ title, subtitle, children, className = '' }) => (
  <div className={`bg-[#13131a] border border-white/[0.07] rounded-2xl p-5 space-y-4 ${className}`}>
    <div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {subtitle && <p className="text-[10px] text-white/35 mt-0.5 font-mono">{subtitle}</p>}
    </div>
    {children}
  </div>
)

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [analyticsRes, ordersRes] = await Promise.all([
        api.get('admin/analytics'),
        api.get('orders')
      ])

      setAnalytics(analyticsRes.data.analytics)
      if (ordersRes.data.orders) {
        setRecentOrders(ordersRes.data.orders.slice(0, 5))
      }
    } catch (err) {
      console.error(err)
      setError('Failed to fetch dashboard data. Please make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadDashboardData() }, [loadDashboardData])

  // ── Real-Time Socket.IO Auto-Refresh ──────────────────────────────────────
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'
    const socket = io(socketUrl, { withCredentials: true, transports: ['websocket', 'polling'] })

    const handleRealTimeUpdate = () => {
      // Re-fetch analytics without showing full-page loader spinner
      api.get('admin/analytics').then(res => {
        if (res.data?.analytics) setAnalytics(res.data.analytics)
      }).catch(err => console.error('Realtime analytics update error:', err))

      api.get('orders').then(res => {
        if (res.data?.orders) setRecentOrders(res.data.orders.slice(0, 5))
      }).catch(err => console.error('Realtime orders update error:', err))
    }

    socket.on('newOrder', handleRealTimeUpdate)
    socket.on('orderStatusUpdated', handleRealTimeUpdate)
    socket.on('adminNotification', handleRealTimeUpdate)

    return () => {
      socket.off('newOrder', handleRealTimeUpdate)
      socket.off('orderStatusUpdated', handleRealTimeUpdate)
      socket.off('adminNotification', handleRealTimeUpdate)
      socket.disconnect()
    }
  }, [])

  // ── Derived chart data ────────────────────────────────────────────────────
  const revenueChartData = analytics?.revenueByMonth?.map(d => ({
    label: MONTHS[d._id.month - 1],
    value: d.revenue
  })) || []

  const ordersChartData = analytics?.ordersPerDay?.slice(-14).map(d => ({
    label: `${d._id.day}`,
    value: d.count
  })) || []

  const topProductsData = analytics?.topProducts?.map(p => ({
    label: p.name?.split(' ').slice(0, 2).join(' ') || 'N/A',
    value: p.totalSold || 0
  })) || []

  const topCategoriesData = analytics?.topCategories?.map(c => ({
    label: c._id || 'Other',
    value: c.totalSold || 0,
    revenue: c.totalRevenue || 0
  })) || []

  const mostWishlistedData = analytics?.mostWishlistedProducts?.map(p => ({
    label: p.name?.split(' ').slice(0, 3).join(' ') || 'Deleted product',
    value: p.wishlistCount || 0
  })) || []

  const newUsersData = analytics?.newUsersPerMonth?.map(d => ({
    label: MONTHS[d._id.month - 1],
    value: d.count
  })) || []

  const orderStatusData = analytics?.orderStatusAnalytics?.map((s, i) => {
    const colors = { Processing:'#f59e0b', Confirmed:'#3b82f6', Packed:'#8b5cf6', Shipped:'#06b6d4',
      'Out for Delivery':'#f97316', Delivered:'#10b981', Cancelled:'#ef4444', Refunded:'#6b7280' }
    return { label: s._id || 'Unknown', value: s.count, color: colors[s._id] || '#6b7280' }
  }) || []

  const newC = analytics?.newCustomers || 0
  const repC = analytics?.repeatCustomers || 0
  const custTotal = newC + repC || 1

  // ── Stat cards config ─────────────────────────────────────────────────────
  const stats = [
    {
      label: "Today's Sales",
      value: `$${(analytics?.todaySales || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      gradient: 'linear-gradient(135deg,#10b981,#059669)',
      sub: `${analytics?.todayOrders || 0} orders today`
    },
    {
      label: 'Monthly Sales',
      value: `$${(analytics?.monthlySales || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: BarChart2,
      gradient: 'linear-gradient(135deg,#f59e0b,#d97706)',
      sub: 'This month'
    },
    {
      label: 'Total Orders',
      value: (analytics?.totalOrders || 0).toLocaleString(),
      icon: ShoppingBag,
      gradient: 'linear-gradient(135deg,#3b82f6,#2563eb)',
      sub: `All time`
    },
    {
      label: 'Products',
      value: (analytics?.totalProducts || 0).toLocaleString(),
      icon: Package,
      gradient: 'linear-gradient(135deg,#8b5cf6,#7c3aed)',
      sub: 'Listed in store'
    },
    {
      label: 'Customers',
      value: (analytics?.totalUsers || 0).toLocaleString(),
      icon: Users,
      gradient: 'linear-gradient(135deg,#06b6d4,#0891b2)',
      sub: 'Registered users'
    },
    {
      label: 'Total Revenue',
      value: `$${(analytics?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      gradient: 'linear-gradient(135deg,#f43f5e,#e11d48)',
      sub: 'All time (paid)'
    },
    {
      label: 'Wishlisted Items',
      value: (analytics?.wishlistItems || 0).toLocaleString(),
      icon: Heart,
      gradient: 'linear-gradient(135deg,#ec4899,#be185d)',
      sub: `${analytics?.wishlistCustomers || 0} customers saving products`
    },
  ]

  return (
    <AdminLayout title="Dashboard">
      <div className="p-4 lg:p-7 space-y-6 max-w-[1400px] mx-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Business Analytics</h2>
            <p className="text-xs text-white/35 mt-0.5 font-mono">Real-time store performance & statistics</p>
          </div>
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white/60 hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl px-4 py-3 font-mono">
            {error}
          </div>
        )}

        {/* ── AI Sales & Business Insights ── */}
        <AISalesInsightsCard analytics={analytics} />

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {stats.map((s, i) => (
            <StatCard key={i} {...s} loading={loading} />
          ))}
        </div>

        {/* ── Charts Row 1: Revenue + Orders/Day ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <ChartPanel
            title="Revenue by Month"
            subtitle="Paid orders — last 12 months"
          >
            {loading ? (
              <div className="h-40 bg-white/5 rounded-xl animate-pulse" />
            ) : revenueChartData.length === 0 ? (
              <p className="text-white/20 text-xs text-center py-12 font-mono">No revenue data yet.</p>
            ) : (
              <>
                <BarChart
                  data={revenueChartData}
                  labelKey="label"
                  valueKey="value"
                  valuePrefix="$"
                  color="#f59e0b"
                  height={140}
                />
                <div className="flex justify-between text-[10px] font-mono text-white/30 pt-1">
                  <span>$0</span>
                  <span>${Math.max(...revenueChartData.map(d => d.value)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              </>
            )}
          </ChartPanel>

          <ChartPanel
            title="Orders Per Day"
            subtitle="Last 14 days"
          >
            {loading ? (
              <div className="h-40 bg-white/5 rounded-xl animate-pulse" />
            ) : ordersChartData.length === 0 ? (
              <p className="text-white/20 text-xs text-center py-12 font-mono">No orders data yet.</p>
            ) : (
              <>
                <BarChart
                  data={ordersChartData}
                  labelKey="label"
                  valueKey="value"
                  color="#3b82f6"
                  height={140}
                />
                <div className="flex justify-between text-[10px] font-mono text-white/30 pt-1">
                  <span>0</span>
                  <span>{Math.max(...ordersChartData.map(d => d.value))} orders</span>
                </div>
              </>
            )}
          </ChartPanel>
        </div>

        {/* ── Charts Row 2: Top Products + Top Categories ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <ChartPanel
            title="Top Products"
            subtitle="By units sold"
          >
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 bg-white/5 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : topProductsData.length === 0 ? (
              <p className="text-white/20 text-xs text-center py-10 font-mono">No sales data yet.</p>
            ) : (
              <HBarChart
                data={topProductsData}
                labelKey="label"
                valueKey="value"
                color="#f59e0b"
              />
            )}
          </ChartPanel>

          <ChartPanel
            title="Top Categories"
            subtitle="By units sold"
          >
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 bg-white/5 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : topCategoriesData.length === 0 ? (
              <p className="text-white/20 text-xs text-center py-10 font-mono">No category data yet.</p>
            ) : (
              <HBarChart
                data={topCategoriesData}
                labelKey="label"
                valueKey="value"
                color="#8b5cf6"
              />
            )}
          </ChartPanel>
        </div>

        {/* ── Charts Row 3: New Users + Customers + Order Status ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          <ChartPanel
            title="New Users"
            subtitle="Registrations per month"
          >
            {loading ? (
              <div className="h-32 bg-white/5 rounded-xl animate-pulse" />
            ) : newUsersData.length === 0 ? (
              <p className="text-white/20 text-xs text-center py-10 font-mono">No user data yet.</p>
            ) : (
              <BarChart
                data={newUsersData}
                labelKey="label"
                valueKey="value"
                color="#06b6d4"
                height={110}
              />
            )}
          </ChartPanel>

          <ChartPanel
            title="Customer Types"
            subtitle="New vs returning buyers"
          >
            {loading ? (
              <div className="h-32 bg-white/5 rounded-xl animate-pulse" />
            ) : (
              <div className="flex items-center gap-5">
                <DonutChart
                  size={120}
                  slices={[
                    { value: newC, color: '#06b6d4' },
                    { value: repC, color: '#f59e0b' },
                  ]}
                />
                <div className="space-y-3 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 flex-shrink-0" />
                    <div>
                      <p className="text-white/50">New</p>
                      <p className="text-white font-bold">{newC} <span className="text-white/30 font-normal">({Math.round(newC / custTotal * 100)}%)</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0" />
                    <div>
                      <p className="text-white/50">Repeat</p>
                      <p className="text-white font-bold">{repC} <span className="text-white/30 font-normal">({Math.round(repC / custTotal * 100)}%)</span></p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ChartPanel>

          <ChartPanel
            title="Order Status"
            subtitle="Breakdown by fulfillment state"
          >
            {loading ? (
              <div className="h-32 bg-white/5 rounded-xl animate-pulse" />
            ) : orderStatusData.length === 0 ? (
              <p className="text-white/20 text-xs text-center py-10 font-mono">No data.</p>
            ) : (
              <div className="space-y-2">
                {orderStatusData.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px] font-mono">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                      <span className="text-white/60 truncate max-w-[110px]">{s.label}</span>
                    </div>
                    <span className="text-white/80 font-bold">{s.value}</span>
                  </div>
                ))}
              </div>
            )}
          </ChartPanel>
        </div>

        {/* ── Recent Orders ── */}
        <ChartPanel
          title="Recent Orders"
          subtitle="Latest purchase requests from customers"
        >
          <div className="flex items-center justify-between -mt-2 mb-1">
            <span />
            <Link
              to="/admin/orders"
              className="text-[10px] text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1"
            >
              View all <ArrowUpRight size={11} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-white/30 uppercase tracking-wider font-mono text-[10px]">
                  <th className="pb-3 font-semibold">Order ID</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Total</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan="5" className="py-3">
                        <div className="h-4 bg-white/5 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-white/20 font-mono text-xs">No orders found yet.</td>
                  </tr>
                ) : (
                  recentOrders.map((order) => {
                    const statusStyles = {
                      Delivered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                      Cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
                      Shipped: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                    }
                    const style = statusStyles[order.orderStatus] || 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    return (
                      <tr key={order._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 font-mono font-medium text-white/80">#{order._id.slice(-6).toUpperCase()}</td>
                        <td className="py-3 text-white/60">{order.shippingInfo?.fullName || 'Guest'}</td>
                        <td className="py-3 font-mono text-white/80">${order.totalPrice?.toFixed(2)}</td>
                        <td className="py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-wide border ${style}`}>
                            {order.orderStatus}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <Link
                            to="/admin/orders"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all font-mono text-[10px]"
                          >
                            <Eye size={10} /> View
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </ChartPanel>

      </div>

      {/* ── AI Analytics Assistant (floating widget) ── */}
      <AIAnalyticsChat analytics={analytics} />
    </AdminLayout>
  )
}

export default AdminDashboard
