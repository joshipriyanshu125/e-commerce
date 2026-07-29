import React, { useState, useEffect } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { Tag, Plus, Trash2, Calendar, Percent } from 'lucide-react'
import api from '../../services/axiosInstance'

const AdminCouponsManager = () => {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // New coupon form states
  const [code, setCode] = useState('')
  const [discountPercentage, setDiscountPercentage] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [adding, setAdding] = useState(false)
  const [formError, setFormError] = useState(null)

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('coupons')
      if (res.data.success) {
        setCoupons(res.data.coupons || [])
      }
    } catch (err) {
      console.error(err)
      setError('Failed to fetch coupons registry.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCoupon = async (e) => {
    e.preventDefault()
    setFormError(null)

    if (!code.trim() || !discountPercentage || !expiryDate) {
      setFormError('All fields are required.')
      return
    }

    const pct = parseFloat(discountPercentage)
    if (isNaN(pct) || pct <= 0 || pct > 100) {
      setFormError('Discount percentage must be between 1 and 100.')
      return
    }

    try {
      setAdding(true)
      const res = await api.post('coupons/create', {
        code: code.toUpperCase().trim(),
        discountPercentage: pct,
        expiryDate
      })

      if (res.data.success) {
        // Add to local state
        setCoupons(prev => [res.data.coupon, ...prev])
        // Reset form
        setCode('')
        setDiscountPercentage('')
        setExpiryDate('')
        alert('Coupon created successfully!')
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create coupon.')
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteCoupon = async (couponId) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return
    try {
      const res = await api.delete(`coupons/${couponId}`)
      if (res.data.success) {
        setCoupons(prev => prev.filter(c => c._id !== couponId))
      }
    } catch (err) {
      alert('Failed to delete coupon. Please try again.')
    }
  }

  useEffect(() => {
    fetchCoupons()
  }, [])

  return (
    <AdminLayout title="Coupons">
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-white">Coupon Management</h2>
          <p className="text-xs text-white/40 mt-1">Configure, activate, and manage user discount coupons</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Create Coupon Form (Left/Smaller side) */}
          <div className="lg:col-span-4 bg-[#13131a] border border-white/5 rounded-xl p-6 space-y-5">
            <div>
              <h3 className="font-semibold text-white">Create New Coupon</h3>
              <p className="text-xs text-white/40 mt-0.5">Generate a new active discount code</p>
            </div>

            {formError && (
              <p className="bg-red-500/15 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-mono">
                {formError}
              </p>
            )}

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs font-mono text-white/70">
              <div className="space-y-1.5">
                <label className="block uppercase tracking-wider text-white/40">Coupon Code</label>
                <input 
                  type="text" 
                  value={code} 
                  onChange={e => setCode(e.target.value)}
                  placeholder="e.g. SUMMER50" 
                  className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 rounded-lg focus:outline-none focus:border-amber-500 text-white placeholder-white/20 uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block uppercase tracking-wider text-white/40">Discount Percentage (%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={discountPercentage} 
                    onChange={e => setDiscountPercentage(e.target.value)}
                    placeholder="e.g. 15" 
                    min="1"
                    max="100"
                    className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 pl-8 rounded-lg focus:outline-none focus:border-amber-500 text-white placeholder-white/20"
                  />
                  <Percent size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block uppercase tracking-wider text-white/40">Expiry Date</label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={expiryDate} 
                    onChange={e => setExpiryDate(e.target.value)}
                    className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 pl-8 rounded-lg focus:outline-none focus:border-amber-500 text-white"
                  />
                  <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                </div>
              </div>

              <button
                type="submit"
                disabled={adding}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-black font-semibold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs"
              >
                <Plus size={14} /> {adding ? 'Creating...' : 'Create Coupon'}
              </button>
            </form>
          </div>

          {/* Coupons Registry List (Right/Larger side) */}
          <div className="lg:col-span-8 bg-[#13131a] border border-white/5 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-6">Active Coupons Registry</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-white/40 uppercase tracking-wider font-mono">
                    <th className="pb-3 font-semibold">Coupon Code</th>
                    <th className="pb-3 font-semibold">Discount</th>
                    <th className="pb-3 font-semibold">Expiry Date</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-white/20 font-mono">Loading registry...</td>
                    </tr>
                  ) : coupons.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-white/20 font-mono">No active coupons created yet.</td>
                    </tr>
                  ) : (
                    coupons.map(c => {
                      const isExpired = new Date(c.expiryDate) < new Date()
                      return (
                        <tr key={c._id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="py-3.5 flex items-center gap-2">
                            <Tag size={14} className="text-amber-400" />
                            <span className="font-mono font-bold text-white tracking-wider">{c.code}</span>
                          </td>
                          <td className="py-3.5 font-mono text-white/90 font-semibold">{c.discountPercentage}% OFF</td>
                          <td className="py-3.5 font-mono text-white/60">{new Date(c.expiryDate).toLocaleDateString()}</td>
                          <td className="py-3.5">
                            <span className={`inline-flex px-2 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-wide border ${
                              isExpired 
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                              {isExpired ? 'Expired' : 'Active'}
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                            <button
                              onClick={() => handleDeleteCoupon(c._id)}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/5 border border-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all font-mono text-[9px] uppercase tracking-wider"
                            >
                              <Trash2 size={10} /> Delete
                            </button>
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
