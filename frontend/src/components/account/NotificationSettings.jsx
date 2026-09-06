import React, { useState, useEffect, useCallback } from 'react'
import {
  Mail, Smartphone, Bell, ShoppingBag, Truck, RotateCcw,
  Heart, TrendingDown, Package, Newspaper, Shield, Save,
  CheckCircle2, Loader2, ChevronDown, ChevronUp
} from 'lucide-react'
import axios from '../../services/axiosInstance'

/*
==================================================
PREFERENCE GROUPS DEFINITION
==================================================
*/
const PREF_GROUPS = [
  {
    id: 'transactional',
    label: 'Order & Delivery',
    icon: ShoppingBag,
    description: 'Essential updates about your orders',
    keys: [
      { key: 'orderUpdates',         label: 'Order Updates',          desc: 'Confirmations, packing, status changes' },
      { key: 'deliveryUpdates',      label: 'Delivery Updates',       desc: 'Shipping, out-for-delivery, delivered' },
      { key: 'returnRefundUpdates',  label: 'Returns & Refunds',      desc: 'Return status, refund confirmations' },
    ],
  },
  {
    id: 'alerts',
    label: 'Wishlist & Price Alerts',
    icon: Heart,
    description: 'Stay informed about items you love',
    keys: [
      { key: 'wishlistAlerts',       label: 'Wishlist Alerts',        desc: 'When wishlisted items go on sale' },
      { key: 'priceDropAlerts',      label: 'Price Drop Alerts',      desc: 'When prices drop on saved items' },
      { key: 'backInStockAlerts',    label: 'Back in Stock Alerts',   desc: 'When out-of-stock items return' },
    ],
  },
  {
    id: 'marketing',
    label: 'Promotions & Marketing',
    icon: TrendingDown,
    description: 'Offers, sales, and new arrivals',
    keys: [
      { key: 'promotions',           label: 'Promotions & Offers',    desc: 'Flash sales, festival deals, discounts' },
      { key: 'newArrivals',          label: 'New Arrivals',           desc: 'When new collections drop' },
      { key: 'newsletter',           label: 'Weekly Newsletter',      desc: 'Fashion tips, style guides, trends' },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    icon: Shield,
    description: 'Keep your account safe',
    keys: [
      { key: 'securityAlerts',       label: 'Security Alerts',        desc: 'Password changes, login alerts, account activity' },
    ],
  },
]

/*
==================================================
CHANNEL CONFIG
==================================================
*/
const CHANNELS = [
  { id: 'email', label: 'Email',  icon: Mail,       color: 'text-amber-600' },
  { id: 'inApp', label: 'In-App', icon: Bell,       color: 'text-blue-600' },
  { id: 'sms',   label: 'SMS',    icon: Smartphone, color: 'text-gray-400',  soon: true },
  { id: 'push',  label: 'Push',   icon: Package,    color: 'text-gray-400',  soon: true },
]

/*
==================================================
DEFAULT PREFERENCES
==================================================
*/
const defaultPrefs = () => ({
  email: {
    orderUpdates: true, deliveryUpdates: true, returnRefundUpdates: true,
    wishlistAlerts: true, priceDropAlerts: true, backInStockAlerts: true,
    promotions: true, newArrivals: true, newsletter: true, securityAlerts: true,
  },
  inApp: {
    orderUpdates: true, deliveryUpdates: true, returnRefundUpdates: true,
    wishlistAlerts: true, priceDropAlerts: true, backInStockAlerts: true,
    promotions: false, newArrivals: false, newsletter: false, securityAlerts: true,
  },
  sms:  { orderUpdates: false, deliveryUpdates: false },
  push: { orderUpdates: false, deliveryUpdates: false },
})

/*
==================================================
TOGGLE COMPONENT
==================================================
*/
const Toggle = ({ checked, onChange, disabled = false, id }) => (
  <button
    id={id}
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => !disabled && onChange(!checked)}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-atelier-dark ${
      disabled
        ? 'opacity-30 cursor-not-allowed bg-atelier-lightgray'
        : checked
          ? 'bg-atelier-dark cursor-pointer'
          : 'bg-atelier-lightgray/60 cursor-pointer'
    }`}
  >
    <span
      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${
        checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
      }`}
    />
  </button>
)

/*
==================================================
NOTIFICATION SETTINGS COMPONENT
==================================================
*/
const NotificationSettings = () => {
  const [prefs, setPrefs]           = useState(defaultPrefs())
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)
  const [error, setError]           = useState(null)
  const [expanded, setExpanded]     = useState({ transactional: true, alerts: true, marketing: true, security: true })

  /* ── Fetch current preferences ─────────────────────── */
  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        setLoading(true)
        const res = await axios.get('notifications/settings')
        const data = res.data?.preferences || res.data
        if (data) {
          setPrefs((prev) => ({
            email: { ...prev.email, ...(data.email || {}) },
            inApp: { ...prev.inApp, ...(data.inApp || {}) },
            sms:   { ...prev.sms,   ...(data.sms   || {}) },
            push:  { ...prev.push,  ...(data.push  || {}) },
          }))
        }
      } catch (err) {
        setError('Failed to load notification preferences.')
        console.error('NotificationSettings fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPrefs()
  }, [])

  /* ── Update individual preference ─────────────────── */
  const updatePref = useCallback((channel, key, value) => {
    setPrefs((prev) => ({
      ...prev,
      [channel]: { ...prev[channel], [key]: value },
    }))
    setSaved(false)
  }, [])

  /* ── Toggle all for a channel within a group ──────── */
  const toggleGroupChannel = useCallback((group, channel, value) => {
    const updates = {}
    group.keys.forEach(({ key }) => { updates[key] = value })
    setPrefs((prev) => ({
      ...prev,
      [channel]: { ...prev[channel], ...updates },
    }))
    setSaved(false)
  }, [])

  /* ── Save ─────────────────────────────────────────── */
  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      await axios.put('notifications/settings', { preferences: prefs })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError('Failed to save preferences. Please try again.')
      console.error('NotificationSettings save error:', err)
    } finally {
      setSaving(false)
    }
  }

  /* ── Group all toggled? ─────────────────────────────── */
  const isGroupAllOn = (group, channel) =>
    group.keys.every(({ key }) => prefs[channel]?.[key] === true)

  /* ── Loading skeleton ────────────────────────────────── */
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-atelier-lightgray/20 rounded" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="border-b border-atelier-lightgray/40 pb-4">
        <h3 className="font-mono text-sm tracking-widest uppercase text-atelier-gray mb-1">
          Notification Preferences
        </h3>
        <p className="text-xs text-atelier-gray/70 font-sans">
          Choose how and when you'd like to be notified.
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-xs font-mono rounded">
          {error}
        </div>
      )}

      {/* Channel Header Legend */}
      <div className="hidden sm:flex items-center justify-end gap-4 px-1 mb-2">
        {CHANNELS.map(({ id, label, icon: Icon, color, soon }) => (
          <div key={id} className={`flex items-center gap-1 w-14 justify-center ${soon ? 'opacity-40' : ''}`}>
            <Icon size={12} className={color} />
            <span className="text-[10px] font-mono tracking-wider uppercase text-atelier-gray">
              {label}
              {soon && <span className="ml-1 text-[9px] text-atelier-gray/50">(soon)</span>}
            </span>
          </div>
        ))}
      </div>

      {/* Preference Groups */}
      {PREF_GROUPS.map((group) => {
        const GroupIcon = group.icon
        const isOpen = expanded[group.id]

        return (
          <div key={group.id} className="border border-atelier-lightgray/50 bg-white/30">
            {/* Group Header */}
            <button
              onClick={() => setExpanded((prev) => ({ ...prev, [group.id]: !prev[group.id] }))}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-atelier-lightgray/10 transition-colors text-left"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3">
                <GroupIcon size={16} className="text-atelier-dark flex-shrink-0" />
                <div>
                  <p className="font-mono text-xs tracking-widest uppercase font-semibold text-atelier-dark">
                    {group.label}
                  </p>
                  <p className="text-[11px] text-atelier-gray/70 font-sans mt-0.5">
                    {group.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {/* Group-level toggles for email + in-app */}
                {['email', 'inApp'].map((ch) => {
                  return (
                    <div key={ch} className="hidden sm:flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Toggle
                        id={`group-${group.id}-${ch}`}
                        checked={isGroupAllOn(group, ch)}
                        onChange={(val) => toggleGroupChannel(group, ch, val)}
                      />
                    </div>
                  )
                })}
                {/* Placeholder columns for SMS + Push */}
                <div className="hidden sm:flex items-center gap-1 w-14 justify-center opacity-30">
                  <Toggle id={`group-${group.id}-sms`} checked={false} disabled={true} onChange={() => {}} />
                </div>
                <div className="hidden sm:flex items-center gap-1 w-14 justify-center opacity-30">
                  <Toggle id={`group-${group.id}-push`} checked={false} disabled={true} onChange={() => {}} />
                </div>
                {isOpen ? <ChevronUp size={14} className="text-atelier-gray ml-1" /> : <ChevronDown size={14} className="text-atelier-gray ml-1" />}
              </div>
            </button>

            {/* Individual Keys */}
            {isOpen && (
              <div className="border-t border-atelier-lightgray/30 divide-y divide-atelier-lightgray/20">
                {group.keys.map(({ key, label, desc }) => {
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between px-4 py-3 hover:bg-atelier-lightgray/5 transition-colors"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-sm font-serif text-atelier-dark font-medium">{label}</p>
                        <p className="text-[11px] text-atelier-gray/70 font-sans mt-0.5">{desc}</p>
                      </div>

                      {/* Mobile: stacked channel toggles */}
                      <div className="sm:hidden flex flex-col gap-2 items-end">
                        {['email', 'inApp'].map((ch) => {
                          const chLabels = { email: 'Email', inApp: 'In-App' }
                          return (
                            <label key={ch} className="flex items-center gap-2 text-[11px] font-mono text-atelier-gray">
                              {chLabels[ch]}
                              <Toggle
                                id={`pref-mobile-${key}-${ch}`}
                                checked={prefs[ch]?.[key] ?? false}
                                onChange={(val) => updatePref(ch, key, val)}
                              />
                            </label>
                          )
                        })}
                      </div>

                      {/* Desktop: channel toggle columns */}
                      <div className="hidden sm:flex items-center gap-4">
                        {/* Email */}
                        <div className="w-14 flex justify-center">
                          <Toggle
                            id={`pref-${key}-email`}
                            checked={prefs.email?.[key] ?? false}
                            onChange={(val) => updatePref('email', key, val)}
                          />
                        </div>
                        {/* In-App */}
                        <div className="w-14 flex justify-center">
                          <Toggle
                            id={`pref-${key}-inApp`}
                            checked={prefs.inApp?.[key] ?? false}
                            onChange={(val) => updatePref('inApp', key, val)}
                          />
                        </div>
                        {/* SMS — coming soon */}
                        <div className="w-14 flex justify-center opacity-30">
                          <Toggle id={`pref-${key}-sms`} checked={false} disabled={true} onChange={() => {}} />
                        </div>
                        {/* Push — coming soon */}
                        <div className="w-14 flex justify-center opacity-30">
                          <Toggle id={`pref-${key}-push`} checked={false} disabled={true} onChange={() => {}} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Save Button */}
      <div className="flex items-center justify-between pt-2">
        {saved && (
          <span className="flex items-center gap-1.5 text-emerald-700 text-xs font-mono">
            <CheckCircle2 size={14} />
            Preferences saved!
          </span>
        )}
        {!saved && <span />}
        <button
          id="save-notification-settings-btn"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-atelier-dark text-white font-mono text-xs tracking-widest uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? (
            <><Loader2 size={13} className="animate-spin" /> Saving…</>
          ) : (
            <><Save size={13} /> Save Preferences</>
          )}
        </button>
      </div>

      {/* Coming Soon Note */}
      <p className="text-[10px] text-atelier-gray/50 font-mono text-right">
        SMS & Push notifications coming soon
      </p>
    </div>
  )
}

export default NotificationSettings
