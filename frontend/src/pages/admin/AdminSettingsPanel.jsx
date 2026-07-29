import React, { useState, useEffect } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { Settings, User, Shield, Check, Save } from 'lucide-react'
import api from '../../services/axiosInstance'

const AdminSettingsPanel = () => {
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  
  // Store Config Mock Settings
  const [storeConfig, setStoreConfig] = useState({
    storeName: 'Atelier Premium',
    currency: 'USD',
    taxRate: '15',
    freeShippingThreshold: '150'
  })

  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const res = await api.get('users/profile')
      if (res.data.success && res.data.user) {
        setProfile({
          name: res.data.user.name || '',
          email: res.data.user.email || '',
          phone: res.data.user.phone || ''
        })
      }
    } catch (err) {
      console.error(err)
      setError('Failed to fetch profile settings.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')

    if (!profile.name || !profile.email) {
      setError('Name and Email are required.')
      return
    }

    try {
      setSavingProfile(true)
      // Call update endpoint
      const payload = {
        name: profile.name,
        email: profile.email,
        phone: profile.phone
      }
      if (passwordForm.newPassword) {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
          setError('New passwords do not match.')
          setSavingProfile(false)
          return
        }
        payload.password = passwordForm.newPassword
      }

      const res = await api.put('users/profile', payload)
      if (res.data.success) {
        setMessage('Profile settings updated successfully!')
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleUpdateConfig = (e) => {
    e.preventDefault()
    setSavingConfig(true)
    setTimeout(() => {
      setMessage('Store preferences updated successfully!')
      setSavingConfig(false)
    }, 800)
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  return (
    <AdminLayout title="Settings">
      <div className="p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-white">System Settings</h2>
          <p className="text-xs text-white/40 mt-1">Configure admin accounts and core store preferences</p>
        </div>

        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl px-4 py-3">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Account Settings */}
          <div className="bg-[#13131a] border border-white/5 rounded-xl p-6 space-y-6">
            <div className="flex items-center gap-2">
              <User className="text-amber-400" size={18} />
              <h3 className="font-semibold text-white">Account Information</h3>
            </div>

            {loading ? (
              <div className="py-6 text-center text-white/20 text-xs font-mono">Loading preferences...</div>
            ) : (
              <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs font-mono text-white/70">
                <div className="space-y-1.5">
                  <label className="block uppercase tracking-wider text-white/40">Full Name</label>
                  <input 
                    type="text" 
                    value={profile.name} 
                    onChange={e => setProfile({...profile, name: e.target.value})}
                    placeholder="e.g. John Doe"
                    className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 rounded-lg focus:outline-none focus:border-amber-500 text-white placeholder-white/25"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block uppercase tracking-wider text-white/40">Email Address</label>
                  <input 
                    type="email" 
                    value={profile.email} 
                    onChange={e => setProfile({...profile, email: e.target.value})}
                    placeholder="e.g. admin@atelier.com"
                    className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 rounded-lg focus:outline-none focus:border-amber-500 text-white placeholder-white/25"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block uppercase tracking-wider text-white/40">Phone Number</label>
                  <input 
                    type="text" 
                    value={profile.phone} 
                    onChange={e => setProfile({...profile, phone: e.target.value})}
                    placeholder="e.g. +1 555-0199"
                    className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 rounded-lg focus:outline-none focus:border-amber-500 text-white placeholder-white/25"
                  />
                </div>

                {/* Change Password Sub-section */}
                <div className="border-t border-white/5 pt-4 mt-2 space-y-4">
                  <h4 className="text-white/60 font-semibold uppercase tracking-wider text-[10px]">Change Password (Optional)</h4>
                  
                  <div className="space-y-1.5">
                    <label className="block uppercase tracking-wider text-white/40">New Password</label>
                    <input 
                      type="password" 
                      value={passwordForm.newPassword} 
                      onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      placeholder="Minimum 6 characters"
                      className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 rounded-lg focus:outline-none focus:border-amber-500 text-white placeholder-white/25"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block uppercase tracking-wider text-white/40">Confirm New Password</label>
                    <input 
                      type="password" 
                      value={passwordForm.confirmPassword} 
                      onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      placeholder="Confirm your new password"
                      className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 rounded-lg focus:outline-none focus:border-amber-500 text-white placeholder-white/25"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-black font-semibold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs"
                >
                  <Save size={14} /> {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </form>
            )}
          </div>

          {/* Store Settings */}
          <div className="bg-[#13131a] border border-white/5 rounded-xl p-6 space-y-6">
            <div className="flex items-center gap-2">
              <Shield className="text-amber-400" size={18} />
              <h3 className="font-semibold text-white">Store Configuration</h3>
            </div>

            <form onSubmit={handleUpdateConfig} className="space-y-4 text-xs font-mono text-white/70">
              <div className="space-y-1.5">
                <label className="block uppercase tracking-wider text-white/40">Store Name</label>
                <input 
                  type="text" 
                  value={storeConfig.storeName} 
                  onChange={e => setStoreConfig({...storeConfig, storeName: e.target.value})}
                  className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 rounded-lg focus:outline-none focus:border-amber-500 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block uppercase tracking-wider text-white/40">Default Currency</label>
                <select 
                  value={storeConfig.currency} 
                  onChange={e => setStoreConfig({...storeConfig, currency: e.target.value})}
                  className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 rounded-lg focus:outline-none focus:border-amber-500 text-white"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block uppercase tracking-wider text-white/40">Tax / VAT Rate (%)</label>
                <input 
                  type="number" 
                  value={storeConfig.taxRate} 
                  onChange={e => setStoreConfig({...storeConfig, taxRate: e.target.value})}
                  className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 rounded-lg focus:outline-none focus:border-amber-500 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block uppercase tracking-wider text-white/40">Free Shipping Threshold ($)</label>
                <input 
                  type="number" 
                  value={storeConfig.freeShippingThreshold} 
                  onChange={e => setStoreConfig({...storeConfig, freeShippingThreshold: e.target.value})}
                  className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 rounded-lg focus:outline-none focus:border-amber-500 text-white"
                />
              </div>

              <button
                type="submit"
                disabled={savingConfig}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-black font-semibold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs"
              >
                <Save size={14} /> {savingConfig ? 'Saving...' : 'Save Store Config'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminSettingsPanel
