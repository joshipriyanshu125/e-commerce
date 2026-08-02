import React, { useState, useEffect } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { Tag, Plus, Trash2, Calendar, Percent, DollarSign, ToggleLeft, ToggleRight, RefreshCw, AlertCircle, CheckCircle, X } from 'lucide-react'
import api from '../../services/axiosInstance'

// Toast Component
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
    {toasts.map(t => (
      <div
        key={t.id}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border pointer-events-auto backdrop-blur-xl animate-fade-in text-sm font-mono
          ${t.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'}`}
      >
        {t.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
        <span>{t.message}</span>
        <button onClick={() => removeToast(t.id)} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
      </div>
    ))}
  </div>
)

const AdminCouponsManager = () => {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState([])

  // Form states
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState('percentage')
  const [discountValue, setDiscountValue] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [minPurchase, setMinPurchase] = useState('')
  const [maxDiscount, setMaxDiscount] = useState('')
  const [usageLimit, setUsageLimit] = useState('')
  const [adding, setAdding] = useState(false)
  const [formError, setFormError] = useState(null)

  // Toast helpers
  const addToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => removeToast(id), 4000)
  }
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const res = await api.get('promocodes')
      if (res.data.success) setCoupons(res.data.coupons || [])
    } catch (err) {
      addToast('Failed to load coupons.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCoupon = async (e) => {
    e.preventDefault()
    setFormError(null)

    if (!code.trim() || !discountValue || !expiryDate) {
      setFormError('Code, discount value, and expiry date are required.')
      return
    }

    const val = parseFloat(discountValue)
    if (isNaN(val) || val <= 0) {
      setFormError('Discount value must be a positive number.')
      return
    }
    if (discountType === 'percentage' && (val <= 0 || val > 100)) {
      setFormError('Percentage must be between 1 and 100.')
      return
    }

    try {
      setAdding(true)
      const payload = {
        code: code.toUpperCase().trim(),
        discountType,
        discountValue: val,
        expiryDate,
      }
      if (minPurchase) payload.minPurchase = parseFloat(minPurchase)
      if (maxDiscount) payload.maxDiscount = parseFloat(maxDiscount)
      if (usageLimit) payload.usageLimit = parseInt(usageLimit)

      const res = await api.post('promocodes/create', payload)
      if (res.data.success) {
        setCoupons(prev => [res.data.coupon, ...prev])
        // Reset form
        setCode(''); setDiscountValue(''); setExpiryDate('')
        setMinPurchase(''); setMaxDiscount(''); setUsageLimit('')
        setDiscountType('percentage')
        addToast(`Coupon ${res.data.coupon.code} created!`, 'success')
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create coupon.')
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteCoupon = async (couponId, couponCode) => {
    if (!window.confirm(`Delete coupon "${couponCode}"? This cannot be undone.`)) return
    try {
      const res = await api.delete(`promocodes/${couponId}`)
      if (res.data.success) {
        setCoupons(prev => prev.filter(c => c._id !== couponId))
        addToast(`Coupon ${couponCode} deleted.`, 'success')
      }
    } catch (err) {
      addToast('Failed to delete coupon.', 'error')
    }
  }

  const handleToggleCoupon = async (couponId, currentActive, couponCode) => {
    try {
      const res = await api.patch(`promocodes/${couponId}/toggle`)
      if (res.data.success) {
        setCoupons(prev => prev.map(c => c._id === couponId ? { ...c, isActive: !currentActive } : c))
        addToast(`Coupon ${couponCode} ${!currentActive ? 'enabled' : 'disabled'}.`, 'success')
      }
    } catch (err) {
      addToast('Failed to toggle coupon status.', 'error')
    }
  }

  useEffect(() => { fetchCoupons() }, [])

  const formatDiscount = (c) => {
    if (c.discountType === 'flat') return `$${c.discountValue} OFF`
    // legacy percentage field support
    const pct = c.discountValue ?? c.discountPercentage
    return `${pct}% OFF`
  }

  const getCouponStatus = (c) => {
    const isExpired = new Date(c.expiryDate) < new Date()
    const isLimitReached = c.usageLimit !== null && c.usedCount >= c.usageLimit
    if (isExpired) return { label: 'Expired', cls: 'bg-red-500/10 text-red-400 border-red-500/20' }
    if (isLimitReached) return { label: 'Limit Reached', cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20' }
    if (!c.isActive) return { label: 'Disabled', cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20' }
    return { label: 'Active', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
  }

  return (
    <AdminLayout title="Coupons">
      <Toast toasts={toasts} removeToast={removeToast} />
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Coupon Management</h2>
            <p className="text-xs text-white/40 mt-1">Create and manage discount codes for your customers</p>
          </div>
          <button
            onClick={fetchCoupons}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all text-xs font-mono"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: coupons.length, color: 'text-white' },
            { label: 'Active', value: coupons.filter(c => c.isActive && new Date(c.expiryDate) > new Date()).length, color: 'text-emerald-400' },
            { label: 'Expired', value: coupons.filter(c => new Date(c.expiryDate) <= new Date()).length, color: 'text-red-400' },
            { label: 'Disabled', value: coupons.filter(c => !c.isActive && new Date(c.expiryDate) > new Date()).length, color: 'text-gray-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-[#13131a] border border-white/5 rounded-xl p-4">
              <p className="text-[10px] text-white/40 font-mono uppercase tracking-wider">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── Create Coupon Form ── */}
          <div className="lg:col-span-4 bg-[#13131a] border border-white/5 rounded-xl p-6 space-y-5">
            <div>
              <h3 className="font-semibold text-white">Create New Coupon</h3>
              <p className="text-xs text-white/40 mt-0.5">Generate a new discount code</p>
            </div>

            {formError && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-mono">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs font-mono text-white/70">

              {/* Coupon Code */}
              <div className="space-y-1.5">
                <label className="block uppercase tracking-wider text-white/40">Coupon Code</label>
                <div className="relative">
                  <Tag size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SUMMER20"
                    className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 pl-8 rounded-lg focus:outline-none focus:border-amber-500 text-white placeholder-white/20 uppercase tracking-widest"
                  />
                </div>
              </div>

              {/* Discount Type Toggle */}
              <div className="space-y-1.5">
                <label className="block uppercase tracking-wider text-white/40">Discount Type</label>
                <div className="flex rounded-lg overflow-hidden border border-white/10">
                  <button
                    type="button"
                    onClick={() => setDiscountType('percentage')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 transition-all text-[11px] uppercase tracking-wider ${discountType === 'percentage' ? 'bg-amber-500 text-black font-semibold' : 'bg-[#1c1c24] text-white/50 hover:text-white'}`}
                  >
                    <Percent size={11} /> Percentage
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('flat')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 transition-all text-[11px] uppercase tracking-wider ${discountType === 'flat' ? 'bg-amber-500 text-black font-semibold' : 'bg-[#1c1c24] text-white/50 hover:text-white'}`}
                  >
                    <DollarSign size={11} /> Flat
                  </button>
                </div>
              </div>

              {/* Discount Value */}
              <div className="space-y-1.5">
                <label className="block uppercase tracking-wider text-white/40">
                  {discountType === 'percentage' ? 'Discount % (1–100)' : 'Flat Discount ($)'}
                </label>
                <div className="relative">
                  {discountType === 'percentage'
                    ? <Percent size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    : <DollarSign size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  }
                  <input
                    type="number"
                    value={discountValue}
                    onChange={e => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percentage' ? 'e.g. 20' : 'e.g. 15.00'}
                    min="0.01"
                    max={discountType === 'percentage' ? '100' : undefined}
                    step="0.01"
                    className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 pl-8 rounded-lg focus:outline-none focus:border-amber-500 text-white placeholder-white/20"
                  />
                </div>
              </div>

              {/* Expiry Date */}
              <div className="space-y-1.5">
                <label className="block uppercase tracking-wider text-white/40">Expiry Date</label>
                <div className="relative">
                  <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={e => setExpiryDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 pl-8 rounded-lg focus:outline-none focus:border-amber-500 text-white"
                  />
                </div>
              </div>

              {/* Optional: Min Purchase */}
              <div className="space-y-1.5">
                <label className="block uppercase tracking-wider text-white/40">Min Purchase ($) <span className="text-white/20">optional</span></label>
                <div className="relative">
                  <DollarSign size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="number"
                    value={minPurchase}
                    onChange={e => setMinPurchase(e.target.value)}
                    placeholder="e.g. 50"
                    min="0"
                    step="0.01"
                    className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 pl-8 rounded-lg focus:outline-none focus:border-amber-500 text-white placeholder-white/20"
                  />
                </div>
              </div>

              {/* Optional: Max Discount (only for percentage) */}
              {discountType === 'percentage' && (
                <div className="space-y-1.5">
                  <label className="block uppercase tracking-wider text-white/40">Max Discount ($) <span className="text-white/20">optional</span></label>
                  <div className="relative">
                    <DollarSign size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="number"
                      value={maxDiscount}
                      onChange={e => setMaxDiscount(e.target.value)}
                      placeholder="e.g. 30"
                      min="0"
                      step="0.01"
                      className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 pl-8 rounded-lg focus:outline-none focus:border-amber-500 text-white placeholder-white/20"
                    />
                  </div>
                </div>
              )}

              {/* Optional: Usage Limit */}
              <div className="space-y-1.5">
                <label className="block uppercase tracking-wider text-white/40">Usage Limit <span className="text-white/20">optional</span></label>
                <input
                  type="number"
                  value={usageLimit}
                  onChange={e => setUsageLimit(e.target.value)}
                  placeholder="e.g. 100 (unlimited if blank)"
                  min="1"
                  className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 rounded-lg focus:outline-none focus:border-amber-500 text-white placeholder-white/20"
                />
              </div>

              <button
                type="submit"
                disabled={adding}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 text-xs disabled:opacity-50"
              >
                <Plus size={14} /> {adding ? 'Creating...' : 'Create Coupon'}
              </button>
            </form>
          </div>

          {/* ── Coupons Registry Table ── */}
          <div className="lg:col-span-8 bg-[#13131a] border border-white/5 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-6">Coupons Registry</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-white/40 uppercase tracking-wider font-mono">
                    <th className="pb-3 font-semibold">Code</th>
                    <th className="pb-3 font-semibold">Discount</th>
                    <th className="pb-3 font-semibold">Min / Max</th>
                    <th className="pb-3 font-semibold">Usage</th>
                    <th className="pb-3 font-semibold">Expires</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="py-10 text-center text-white/20 font-mono">
                        <RefreshCw size={18} className="animate-spin inline mr-2" />Loading coupons...
                      </td>
                    </tr>
                  ) : coupons.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-10 text-center text-white/20 font-mono">
                        No coupons created yet. Create your first one!
                      </td>
                    </tr>
                  ) : (
                    coupons.map(c => {
                      const status = getCouponStatus(c)
                      const isExpired = new Date(c.expiryDate) < new Date()
                      const isLimitReached = c.usageLimit !== null && c.usedCount >= c.usageLimit
                      const canToggle = !isExpired && !isLimitReached

                      return (
                        <tr key={c._id} className="hover:bg-white/[0.02] transition-colors">
                          {/* Code */}
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <Tag size={14} className="text-amber-400 flex-shrink-0" />
                              <span className="font-mono font-bold text-white tracking-widest">{c.code}</span>
                            </div>
                          </td>

                          {/* Discount */}
                          <td className="py-4">
                            <span className="font-mono font-semibold text-amber-400">{formatDiscount(c)}</span>
                            <div className="text-white/30 mt-0.5 capitalize text-[10px]">{c.discountType || 'percentage'}</div>
                          </td>

                          {/* Min / Max */}
                          <td className="py-4 font-mono text-white/50">
                            <div>Min: {c.minPurchase > 0 ? `$${c.minPurchase}` : '—'}</div>
                            <div>Cap: {c.maxDiscount ? `$${c.maxDiscount}` : '—'}</div>
                          </td>

                          {/* Usage */}
                          <td className="py-4 font-mono text-white/60">
                            {c.usedCount ?? 0} / {c.usageLimit ?? '∞'}
                          </td>

                          {/* Expires */}
                          <td className="py-4 font-mono text-white/60">
                            {new Date(c.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>

                          {/* Status */}
                          <td className="py-4">
                            <span className={`inline-flex px-2 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-wide border ${status.cls}`}>
                              {status.label}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Toggle Enable/Disable */}
                              {canToggle && (
                                <button
                                  onClick={() => handleToggleCoupon(c._id, c.isActive, c.code)}
                                  title={c.isActive ? 'Disable coupon' : 'Enable coupon'}
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded border transition-all text-[9px] uppercase tracking-wider font-mono active:scale-95
                                    ${c.isActive
                                      ? 'bg-amber-500/5 border-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                                      : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                    }`}
                                >
                                  {c.isActive
                                    ? <><ToggleRight size={12} /> Disable</>
                                    : <><ToggleLeft size={12} /> Enable</>
                                  }
                                </button>
                              )}
                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteCoupon(c._id, c.code)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500/5 border border-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all font-mono text-[9px] uppercase tracking-wider"
                              >
                                <Trash2 size={10} /> Delete
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
          </div>

        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminCouponsManager
