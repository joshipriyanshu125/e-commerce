import React, { useState, useEffect } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import {
  Store, CreditCard, Truck, Percent, Mail, Shield,
  Save, Check, AlertCircle, RefreshCw, Key, Lock, Eye, EyeOff
} from 'lucide-react'
import api from '../../services/axiosInstance'

const TABS = [
  { id: 'store',    label: 'Store Info',  icon: Store },
  { id: 'payment',  label: 'Payment',     icon: CreditCard },
  { id: 'shipping', label: 'Shipping',    icon: Truck },
  { id: 'tax',      label: 'Tax Settings',icon: Percent },
  { id: 'email',    label: 'Email SMTP',  icon: Mail },
  { id: 'security', label: 'Security',    icon: Shield },
]

const AdminSettingsPanel = () => {
  const [activeTab, setActiveTab] = useState('store')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Show/Hide Password fields
  const [showSmtpPass, setShowSmtpPass] = useState(false)
  const [showAdminPass, setShowAdminPass] = useState(false)

  // Full Settings State
  const [settings, setSettings] = useState({
    storeInfo: {
      name: 'Atelier Premium Store',
      logo: '',
      address: '123 Fashion Ave, Suite 500, New York, NY 10001',
      phone: '+1 (555) 234-5678',
      email: 'support@atelier.com'
    },
    payment: {
      stripeEnabled: true,
      stripeKey: '',
      stripeSecret: '',
      razorpayEnabled: false,
      razorpayKeyId: '',
      razorpaySecret: '',
      paypalEnabled: true,
      paypalClientId: '',
      paypalSecret: ''
    },
    shipping: {
      flatRate: 15,
      freeShippingEnabled: true,
      minFreeShippingAmount: 150,
      expressEnabled: true,
      expressRate: 35
    },
    tax: {
      taxType: 'GST',
      taxRate: 18,
      taxId: '29ABCDE1234F1Z5'
    },
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpMail: 'joshipriyanshu125@gmail.com',
      smtpPassword: '',
      sendOrderEmails: true,
      sendInvoiceEmails: true
    },
    security: {
      enable2FA: false,
      sessionTimeout: 60
    }
  })

  // Admin Security Password State
  const [passwordState, setPasswordState] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Fetch Settings from API
  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await api.get('settings')
      if (res.data?.success && res.data?.settings) {
        setSettings(prev => ({
          ...prev,
          ...res.data.settings
        }))
      }
    } catch (err) {
      console.error(err)
      setError('Failed to fetch settings from backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  // Handle Input Changes
  const updateField = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  // Save Settings to Backend
  const handleSaveSettings = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    setSaving(true)

    try {
      const res = await api.put('settings', settings)
      if (res.data?.success) {
        setMessage('Settings saved successfully!')
        setTimeout(() => setMessage(''), 4000)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  // Handle Admin Password Change
  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')

    if (!passwordState.newPassword) {
      setError('Please enter a new password.')
      return
    }
    if (passwordState.newPassword !== passwordState.confirmPassword) {
      setError('New passwords do not match.')
      return
    }

    try {
      setSaving(true)
      const res = await api.put('users/profile', {
        password: passwordState.newPassword
      })
      if (res.data?.success) {
        setMessage('Admin password updated successfully!')
        setPasswordState({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setTimeout(() => setMessage(''), 4000)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout title="Settings">
      <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Store Settings & Configuration</h2>
            <p className="text-xs text-white/40 mt-1">Manage global store parameters, payments, taxes, SMTP, and security</p>
          </div>
          <button
            onClick={fetchSettings}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70 hover:bg-white/10 active:scale-95 transition-all w-fit"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Status Alerts */}
        {message && (
          <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono rounded-xl px-4 py-3 flex items-center gap-2">
            <Check size={14} /> {message}
          </div>
        )}
        {error && (
          <div className="bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-mono rounded-xl px-4 py-3 flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-white/10 overflow-x-auto no-scrollbar pb-px">
          {TABS.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-medium font-mono uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                  active
                    ? 'border-amber-400 text-amber-400 bg-white/[0.03]'
                    : 'border-transparent text-white/50 hover:text-white hover:bg-white/[0.01]'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content Panels */}
        {loading ? (
          <div className="py-20 text-center text-white/30 text-xs font-mono animate-pulse">Loading settings...</div>
        ) : (
          <form onSubmit={handleSaveSettings} className="space-y-6">

            {/* TAB 1: STORE INFO */}
            {activeTab === 'store' && (
              <div className="bg-[#13131a] border border-white/5 rounded-2xl p-6 space-y-5 text-xs font-mono text-white/70">
                <h3 className="text-sm font-semibold text-white font-sans flex items-center gap-2">
                  <Store size={16} className="text-amber-400" /> Store Profile & Contact Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block uppercase tracking-wider text-white/40">Store Name</label>
                    <input
                      type="text"
                      value={settings.storeInfo.name}
                      onChange={e => updateField('storeInfo', 'name', e.target.value)}
                      className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 rounded-xl focus:outline-none focus:border-amber-500 text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block uppercase tracking-wider text-white/40">Store Logo URL</label>
                    <input
                      type="text"
                      value={settings.storeInfo.logo}
                      onChange={e => updateField('storeInfo', 'logo', e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 rounded-xl focus:outline-none focus:border-amber-500 text-white placeholder-white/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block uppercase tracking-wider text-white/40">Support Email</label>
                    <input
                      type="email"
                      value={settings.storeInfo.email}
                      onChange={e => updateField('storeInfo', 'email', e.target.value)}
                      className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 rounded-xl focus:outline-none focus:border-amber-500 text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block uppercase tracking-wider text-white/40">Support Phone</label>
                    <input
                      type="text"
                      value={settings.storeInfo.phone}
                      onChange={e => updateField('storeInfo', 'phone', e.target.value)}
                      className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 rounded-xl focus:outline-none focus:border-amber-500 text-white"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="block uppercase tracking-wider text-white/40">Physical Address</label>
                    <textarea
                      rows={2}
                      value={settings.storeInfo.address}
                      onChange={e => updateField('storeInfo', 'address', e.target.value)}
                      className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 rounded-xl focus:outline-none focus:border-amber-500 text-white resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PAYMENT GATEWAYS */}
            {activeTab === 'payment' && (
              <div className="space-y-6 text-xs font-mono text-white/70">
                {/* Stripe */}
                <div className="bg-[#13131a] border border-white/5 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-white font-sans">Stripe Payment Gateway</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.payment.stripeEnabled}
                        onChange={e => updateField('payment', 'stripeEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                  {settings.payment.stripeEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5">
                        <label className="block uppercase text-white/40">Publishable Key</label>
                        <input
                          type="text"
                          value={settings.payment.stripeKey}
                          onChange={e => updateField('payment', 'stripeKey', e.target.value)}
                          placeholder="pk_test_..."
                          className="w-full bg-[#1c1c24] border border-white/10 py-2 px-3 rounded-xl text-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block uppercase text-white/40">Secret Key</label>
                        <input
                          type="password"
                          value={settings.payment.stripeSecret}
                          onChange={e => updateField('payment', 'stripeSecret', e.target.value)}
                          placeholder="sk_test_..."
                          className="w-full bg-[#1c1c24] border border-white/10 py-2 px-3 rounded-xl text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Razorpay */}
                <div className="bg-[#13131a] border border-white/5 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-white font-sans">Razorpay Gateway</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.payment.razorpayEnabled}
                        onChange={e => updateField('payment', 'razorpayEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                  {settings.payment.razorpayEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5">
                        <label className="block uppercase text-white/40">Key ID</label>
                        <input
                          type="text"
                          value={settings.payment.razorpayKeyId}
                          onChange={e => updateField('payment', 'razorpayKeyId', e.target.value)}
                          placeholder="rzp_test_..."
                          className="w-full bg-[#1c1c24] border border-white/10 py-2 px-3 rounded-xl text-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block uppercase text-white/40">Key Secret</label>
                        <input
                          type="password"
                          value={settings.payment.razorpaySecret}
                          onChange={e => updateField('payment', 'razorpaySecret', e.target.value)}
                          className="w-full bg-[#1c1c24] border border-white/10 py-2 px-3 rounded-xl text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* PayPal */}
                <div className="bg-[#13131a] border border-white/5 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-white font-sans">PayPal Express</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.payment.paypalEnabled}
                        onChange={e => updateField('payment', 'paypalEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                  {settings.payment.paypalEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5">
                        <label className="block uppercase text-white/40">Client ID</label>
                        <input
                          type="text"
                          value={settings.payment.paypalClientId}
                          onChange={e => updateField('payment', 'paypalClientId', e.target.value)}
                          className="w-full bg-[#1c1c24] border border-white/10 py-2 px-3 rounded-xl text-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block uppercase text-white/40">Secret</label>
                        <input
                          type="password"
                          value={settings.payment.paypalSecret}
                          onChange={e => updateField('payment', 'paypalSecret', e.target.value)}
                          className="w-full bg-[#1c1c24] border border-white/10 py-2 px-3 rounded-xl text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: SHIPPING */}
            {activeTab === 'shipping' && (
              <div className="bg-[#13131a] border border-white/5 rounded-2xl p-6 space-y-5 text-xs font-mono text-white/70">
                <h3 className="text-sm font-semibold text-white font-sans flex items-center gap-2">
                  <Truck size={16} className="text-amber-400" /> Shipping & Delivery Rules
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block uppercase text-white/40">Standard Flat Rate ($)</label>
                    <input
                      type="number"
                      value={settings.shipping.flatRate}
                      onChange={e => updateField('shipping', 'flatRate', Number(e.target.value))}
                      className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 rounded-xl text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block uppercase text-white/40">Minimum Amount for Free Shipping ($)</label>
                    <input
                      type="number"
                      value={settings.shipping.minFreeShippingAmount}
                      onChange={e => updateField('shipping', 'minFreeShippingAmount', Number(e.target.value))}
                      className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 rounded-xl text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block uppercase text-white/40">Express Shipping Rate ($)</label>
                    <input
                      type="number"
                      value={settings.shipping.expressRate}
                      onChange={e => updateField('shipping', 'expressRate', Number(e.target.value))}
                      className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 rounded-xl text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-white/5 md:col-span-2">
                    <span className="text-white font-sans">Enable Free Shipping Option</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.shipping.freeShippingEnabled}
                        onChange={e => updateField('shipping', 'freeShippingEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: TAX SETTINGS */}
            {activeTab === 'tax' && (
              <div className="bg-[#13131a] border border-white/5 rounded-2xl p-6 space-y-5 text-xs font-mono text-white/70">
                <h3 className="text-sm font-semibold text-white font-sans flex items-center gap-2">
                  <Percent size={16} className="text-amber-400" /> Tax & VAT Configuration
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className="block uppercase text-white/40">Tax Type</label>
                    <select
                      value={settings.tax.taxType}
                      onChange={e => updateField('tax', 'taxType', e.target.value)}
                      className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 rounded-xl text-white"
                    >
                      <option value="GST">GST (Goods & Services Tax)</option>
                      <option value="VAT">VAT (Value Added Tax)</option>
                      <option value="SalesTax">Sales Tax</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block uppercase text-white/40">Tax Rate (%)</label>
                    <input
                      type="number"
                      value={settings.tax.taxRate}
                      onChange={e => updateField('tax', 'taxRate', Number(e.target.value))}
                      className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 rounded-xl text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block uppercase text-white/40">GSTIN / VAT Number</label>
                    <input
                      type="text"
                      value={settings.tax.taxId}
                      onChange={e => updateField('tax', 'taxId', e.target.value)}
                      className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 rounded-xl text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: EMAIL SMTP */}
            {activeTab === 'email' && (
              <div className="bg-[#13131a] border border-white/5 rounded-2xl p-6 space-y-5 text-xs font-mono text-white/70">
                <h3 className="text-sm font-semibold text-white font-sans flex items-center gap-2">
                  <Mail size={16} className="text-amber-400" /> SMTP Server & Automated Emails
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block uppercase text-white/40">SMTP Host</label>
                    <input
                      type="text"
                      value={settings.email.smtpHost}
                      onChange={e => updateField('email', 'smtpHost', e.target.value)}
                      className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 rounded-xl text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block uppercase text-white/40">SMTP Port</label>
                    <input
                      type="number"
                      value={settings.email.smtpPort}
                      onChange={e => updateField('email', 'smtpPort', Number(e.target.value))}
                      className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 rounded-xl text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block uppercase text-white/40">Sender Email</label>
                    <input
                      type="email"
                      value={settings.email.smtpMail}
                      onChange={e => updateField('email', 'smtpMail', e.target.value)}
                      className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 rounded-xl text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block uppercase text-white/40">SMTP App Password</label>
                    <div className="relative">
                      <input
                        type={showSmtpPass ? 'text' : 'password'}
                        value={settings.email.smtpPassword}
                        onChange={e => updateField('email', 'smtpPassword', e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 pr-10 rounded-xl text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSmtpPass(!showSmtpPass)}
                        className="absolute right-3 top-3 text-white/40 hover:text-white"
                      >
                        {showSmtpPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-sans">Send Order Confirmation Emails</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.email.sendOrderEmails}
                        onChange={e => updateField('email', 'sendOrderEmails', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-sans">Send Invoice PDF Attachments</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.email.sendInvoiceEmails}
                        onChange={e => updateField('email', 'sendInvoiceEmails', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: SECURITY & AUTHENTICATION */}
            {activeTab === 'security' && (
              <div className="space-y-6 text-xs font-mono text-white/70">
                {/* Admin Password Change Form */}
                <div className="bg-[#13131a] border border-white/5 rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-semibold text-white font-sans flex items-center gap-2">
                    <Lock size={16} className="text-amber-400" /> Change Admin Password
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block uppercase text-white/40">New Password</label>
                      <input
                        type={showAdminPass ? 'text' : 'password'}
                        value={passwordState.newPassword}
                        onChange={e => setPasswordState({ ...passwordState, newPassword: e.target.value })}
                        placeholder="Min 6 characters"
                        className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 rounded-xl text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block uppercase text-white/40">Confirm New Password</label>
                      <input
                        type={showAdminPass ? 'text' : 'password'}
                        value={passwordState.confirmPassword}
                        onChange={e => setPasswordState({ ...passwordState, confirmPassword: e.target.value })}
                        placeholder="Confirm password"
                        className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 rounded-xl text-white"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handlePasswordChange}
                    disabled={saving}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-mono uppercase tracking-wider transition-all flex items-center gap-2"
                  >
                    <Key size={13} /> Update Password
                  </button>
                </div>

                {/* Security Config */}
                <div className="bg-[#13131a] border border-white/5 rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-semibold text-white font-sans flex items-center gap-2">
                    <Shield size={16} className="text-amber-400" /> Security Controls
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block uppercase text-white/40">Session Timeout (Minutes)</label>
                      <input
                        type="number"
                        value={settings.security.sessionTimeout}
                        onChange={e => updateField('security', 'sessionTimeout', Number(e.target.value))}
                        className="w-full bg-[#1c1c24] border border-white/10 py-2.5 px-3 rounded-xl text-white"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-6">
                      <span className="text-white font-sans">Two-Factor Authentication (2FA)</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.security.enable2FA}
                          onChange={e => updateField('security', 'enable2FA', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button Bar */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-black font-semibold uppercase tracking-wider font-mono text-xs rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-amber-500/10"
              >
                <Save size={15} /> {saving ? 'Saving Changes...' : 'Save All Settings'}
              </button>
            </div>

          </form>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminSettingsPanel
