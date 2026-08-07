import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout } from '../features/auth/authSlice'
import { User, Package, MapPin, LogOut, CheckCircle2, ChevronRight, Undo2, BellRing, Trash2, Star, Bell } from 'lucide-react'
import axios from '../services/axiosInstance'
import NotificationSettings from '../components/account/NotificationSettings'

const Account = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useSelector(state => state.auth)
  const [activeTab, setActiveTab] = useState('profile')

  // Addresses state
  const [addresses, setAddresses] = useState([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [newAddress, setNewAddress] = useState({ name: '', street: '', city: '', state: '', zip: '', country: '', phone: '' })

  // Returns state
  const [returns, setReturns] = useState([])
  const [loadingReturns, setLoadingReturns] = useState(false)

  // Push notifications
  const [pushEnabled, setPushEnabled] = useState(false)

  // Fetch addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!isAuthenticated || !user) return;
      try {
        setLoadingAddresses(true)
        const res = await axios.get('address')
        if (res && res.data && res.data.addresses) {
          setAddresses(res.data.addresses)
        }
      } catch (err) {
        console.error('Error fetching addresses', err)
      } finally {
        setLoadingAddresses(false)
      }
    }
    fetchAddresses()
  }, [isAuthenticated, user])

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  const enablePushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications are not supported in your browser.');
      return;
    }

    try {
      // Step 1: Request notification permission explicitly
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Notification permission denied. Please allow notifications in your browser settings and try again.');
        return;
      }

      // Step 2: Ensure service worker is registered and ready
      await navigator.serviceWorker.register('/push-sw.js');
      const reg = await navigator.serviceWorker.ready;

      // Clear any existing stale subscription to avoid key mismatch errors
      const existingSub = await reg.pushManager.getSubscription();
      if (existingSub) {
        await existingSub.unsubscribe();
      }

      // Step 3: Subscribe to push
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array('BOOyPRZuO_1zdkUK6dJ61oFuudYTIIvLwNMNPEFQeH6quBUDH06uJT81Bmjdyu3GehbrC47EZJJ3dfP4kqlUgD8')
      });

      // Step 4: Save subscription to backend
      await axios.post('push/subscribe', sub);
      setPushEnabled(true);
      alert('Delivery alerts enabled! You will now receive push notifications for your orders.');
    } catch (e) {
      console.error('Could not subscribe to push notifications:', e);
      if (e.name === 'NotAllowedError') {
        alert('Notification permission was denied. Please enable notifications in your browser settings.');
      } else {
        alert(`Failed to enable notifications. Please try again later. Error: ${e.message || e.toString()}`);
      }
    }
  }

  // Fetch returns when tab is active
  useEffect(() => {
    if (activeTab === 'returns' && returns.length === 0) {
      const fetchReturns = async () => {
        try {
          setLoadingReturns(true)
          const res = await axios.get('returns')
          if (res && res.data && res.data.returns) setReturns(res.data.returns)
        } catch (err) {
          console.error(err)
        } finally {
          setLoadingReturns(false)
        }
      }
      fetchReturns()
    }
  }, [activeTab, returns.length])

  // Show loading state while user data is being loaded
if (!user || !isAuthenticated) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-atelier-beige">
      <div className="text-center">
        <p className="text-atelier-gray font-mono mb-4">Loading account...</p>
        <p className="text-xs text-atelier-gray font-mono">
          Auth: {isAuthenticated ? 'Yes' : 'No'} | User: {user ? 'Yes' : 'No'}
        </p>
      </div>
    </div>
  );
} // <-- ADD THIS LINE

const handleLogout = () => {
    dispatch(logout())
    navigate('/')
  }

  const handleAddAddress = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        fullName: newAddress.name,
        street: newAddress.street,
        city: newAddress.city,
        state: newAddress.state,
        postalCode: newAddress.zip,
        country: newAddress.country,
        phone: newAddress.phone
      }
      const res = await axios.post('address', payload)
      setAddresses(prev => [...prev, res.data])
      setNewAddress({ name: '', street: '', city: '', state: '', zip: '', country: '', phone: '' })
      setShowAddAddress(false)
    } catch (err) {
      console.error('Error adding address', err)
      alert('Failed to save address')
    }
  }

  const handleSetDefault = async (id) => {
    try {
      await axios.patch(`address/${id}/default`)
      setAddresses(prev =>
        prev.map(a => ({ ...a, isDefault: (a._id || a.id) === id }))
      )
    } catch (err) {
      console.error('Error setting default address', err)
      alert('Failed to set default')
    }
  }

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Remove this address?')) return;
    try {
      await axios.delete(`address/${id}`)
      setAddresses(prev => prev.filter(a => (a._id || a.id) !== id))
    } catch (err) {
      console.error('Error deleting address', err)
      alert('Failed to remove address')
    }
  }

  // Display user's name, fallback to email prefix if name is not available
  const username = user.name || (user.email || "").split("@")[0] || "Member";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in font-sans">
      
      {/* Upper greetings & logout */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between border-b border-atelier-lightgray/50 pb-6 mb-8 gap-4">
        <div>
          <span className="font-mono text-xs sm:text-sm tracking-[0.25em] uppercase text-atelier-gray block mb-1">
            Your Account
          </span>
          <h1 className="font-serif text-4xl text-atelier-dark font-semibold">
            Hello, {username}
          </h1>
        </div>
        
        <button
          onClick={handleLogout}
          className="self-start md:self-auto px-4 py-2 border border-atelier-lightgray text-xs font-mono tracking-widest uppercase hover:border-atelier-dark flex items-center space-x-1.5 transition-colors"
        >
          <LogOut size={13} />
          <span>Sign out</span>
        </button>
      </div>

      {/* Main dashboard body */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Navigation Tabs */}
        <div className="md:col-span-3 flex md:flex-col overflow-x-auto md:overflow-x-visible border-b md:border-b-0 border-atelier-lightgray/40 pb-2 md:pb-0 gap-4 md:gap-2">
          
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center space-x-2.5 py-2 px-3 font-mono text-sm tracking-widest uppercase text-left whitespace-nowrap transition-colors ${
              activeTab === 'profile'
                ? 'text-atelier-dark border-b-2 md:border-b-0 md:border-l-2 border-atelier-dark font-semibold'
                : 'text-atelier-gray hover:text-atelier-dark'
            }`}
          >
            <User size={14} />
            <span>Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center space-x-2.5 py-2 px-3 font-mono text-sm tracking-widest uppercase text-left whitespace-nowrap transition-colors ${
              activeTab === 'orders'
                ? 'text-atelier-dark border-b-2 md:border-b-0 md:border-l-2 border-atelier-dark font-semibold'
                : 'text-atelier-gray hover:text-atelier-dark'
            }`}
          >
            <Package size={14} />
            <span>Orders</span>
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`flex items-center space-x-2.5 py-2 px-3 font-mono text-sm tracking-widest uppercase text-left whitespace-nowrap transition-colors ${
              activeTab === 'addresses'
                ? 'text-atelier-dark border-b-2 md:border-b-0 md:border-l-2 border-atelier-dark font-semibold'
                : 'text-atelier-gray hover:text-atelier-dark'
            }`}
          >
            <MapPin size={14} />
            <span>Addresses</span>
          </button>

          <button
            onClick={() => setActiveTab('returns')}
            className={`flex items-center space-x-2.5 py-2 px-3 font-mono text-sm tracking-widest uppercase text-left whitespace-nowrap transition-colors ${
              activeTab === 'returns'
                ? 'text-atelier-dark border-b-2 md:border-b-0 md:border-l-2 border-atelier-dark font-semibold'
                : 'text-atelier-gray hover:text-atelier-dark'
            }`}
          >
            <Undo2 size={14} />
            <span>Returns</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center space-x-2.5 py-2 px-3 font-mono text-sm tracking-widest uppercase text-left whitespace-nowrap transition-colors ${
              activeTab === 'notifications'
                ? 'text-atelier-dark border-b-2 md:border-b-0 md:border-l-2 border-atelier-dark font-semibold'
                : 'text-atelier-gray hover:text-atelier-dark'
            }`}
          >
            <Bell size={14} />
            <span>Notifications</span>
          </button>

        </div>

        {/* Tab contents */}
        <div className="md:col-span-9">
          
          {/* 1. Profile Details tab */}
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-fade-in max-w-xl">
              {/* User Identity Flatlay */}
              <div className="flex items-center space-x-5">
                {/* Large letter avatar */}
                <div className="h-16 w-16 rounded-full bg-[#5C4D3C] text-atelier-beige flex items-center justify-center font-serif text-2xl font-semibold uppercase">
                  {user.name ? user.name.charAt(0) : username.charAt(0)}
                </div>
                <div>
                  <h3 className="font-serif text-lg text-atelier-dark font-semibold leading-tight">
                    {user.name || 'Atelier Member'}
                  </h3>
                  <p className="text-xs text-atelier-gray font-mono">{user.email}</p>
                </div>
              </div>

              {/* Readonly profile details */}
              <div className="space-y-6 pt-4 border-t border-atelier-lightgray/40">
                <div className="space-y-1">
                  <label className="block font-mono text-xs sm:text-sm tracking-widest uppercase text-atelier-gray">
                    Full Name
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={user.name || 'Piyush'}
                    className="w-full bg-transparent border-b border-atelier-lightgray/40 py-2.5 px-1 text-sm text-atelier-dark focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-mono text-xs sm:text-sm tracking-widest uppercase text-atelier-gray">
                    Phone
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={user.phone || 'Not provided'}
                    className="w-full bg-transparent border-b border-atelier-lightgray/40 py-2.5 px-1 text-sm text-atelier-dark focus:outline-none placeholder-atelier-gray/40"
                    placeholder="Enter phone number"
                  />
                </div>

                {user.avatar && (
                  <div className="space-y-1">
                    <label className="block font-mono text-xs sm:text-sm tracking-widest uppercase text-atelier-gray">
                      Avatar URL
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={user.avatar}
                      className="w-full bg-transparent border-b border-atelier-lightgray/40 py-2.5 px-1 text-xs text-atelier-gray focus:outline-none overflow-x-auto font-mono"
                    />
                  </div>
                )}

                <div className="pt-4">
                  {!pushEnabled ? (
                    <button onClick={enablePushNotifications} className="px-4 py-2 bg-atelier-dark text-white font-mono text-xs tracking-widest uppercase flex items-center gap-2 hover:opacity-90 transition-opacity">
                      <BellRing size={14} />
                      Enable Delivery Alerts
                    </button>
                  ) : (
                    <span className="text-sm font-mono text-green-700 flex items-center gap-2"><CheckCircle2 size={14} /> Delivery Alerts Enabled</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. Orders — link to dedicated page */}
          {activeTab === 'orders' && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="font-mono text-sm tracking-widest uppercase text-atelier-gray border-b border-atelier-lightgray/40 pb-3 mb-4">
                Order History
              </h3>
              <div className="border border-atelier-lightgray/60 bg-atelier-cream/30 p-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-atelier-dark/5 border border-atelier-lightgray/50 flex items-center justify-center mx-auto">
                  <Package size={22} className="text-atelier-dark/50" />
                </div>
                <div>
                  <h4 className="font-serif text-lg text-atelier-dark mb-1">Track Your Orders</h4>
                  <p className="text-xs text-atelier-gray font-mono">
                    View real-time tracking, download invoices, manage returns and more on the Orders page.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/orders')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-atelier-dark text-white text-xs font-mono uppercase tracking-widest hover:opacity-90 transition-opacity"
                >
                  <Package size={14} /> View My Orders <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* 3. Addresses Management tab */}
          {activeTab === 'addresses' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-atelier-lightgray/40 pb-3 mb-4">
                <h3 className="font-mono text-sm tracking-widest uppercase text-atelier-gray">
                  Shipping Addresses
                </h3>
                {!showAddAddress && (
                  <button
                    onClick={() => setShowAddAddress(true)}
                    className="font-mono text-xs tracking-widest uppercase text-atelier-dark underline hover:opacity-75"
                  >
                    Add new address
                  </button>
                )}
              </div>

              {/* Add address form */}
              {showAddAddress && (
                <form onSubmit={handleAddAddress} className="border border-atelier-lightgray p-6 bg-atelier-cream/30 space-y-4 max-w-md">
                  <h4 className="font-mono text-sm tracking-widest uppercase text-atelier-dark font-semibold border-b border-atelier-lightgray pb-2">
                    New Address
                  </h4>
                  
                  <div className="space-y-1">
                    <label className="block text-xs font-mono tracking-wider text-atelier-gray uppercase">Name</label>
                    <input
                      type="text"
                      required
                      value={newAddress.name}
                      onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                      className="w-full bg-atelier-beige border border-atelier-lightgray py-1.5 px-3 text-xs focus:outline-none focus:border-atelier-dark"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-mono tracking-wider text-atelier-gray uppercase">Street Address</label>
                    <input
                      type="text"
                      required
                      value={newAddress.street}
                      onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                      className="w-full bg-atelier-beige border border-atelier-lightgray py-1.5 px-3 text-xs focus:outline-none focus:border-atelier-dark"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-mono tracking-wider text-atelier-gray uppercase">City</label>
                      <input
                        type="text"
                        required
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="w-full bg-atelier-beige border border-atelier-lightgray py-1.5 px-3 text-xs focus:outline-none focus:border-atelier-dark"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-mono tracking-wider text-atelier-gray uppercase">State</label>
                      <input
                        type="text"
                        required
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        className="w-full bg-atelier-beige border border-atelier-lightgray py-1.5 px-3 text-xs focus:outline-none focus:border-atelier-dark"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-mono tracking-wider text-atelier-gray uppercase">ZIP Code</label>
                      <input
                        type="text"
                        required
                        value={newAddress.zip}
                        onChange={(e) => setNewAddress({ ...newAddress, zip: e.target.value })}
                        className="w-full bg-atelier-beige border border-atelier-lightgray py-1.5 px-3 text-xs focus:outline-none focus:border-atelier-dark"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-mono tracking-wider text-atelier-gray uppercase">Country</label>
                      <input
                        type="text"
                        required
                        value={newAddress.country}
                        onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                        className="w-full bg-atelier-beige border border-atelier-lightgray py-1.5 px-3 text-xs focus:outline-none focus:border-atelier-dark"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-mono tracking-wider text-atelier-gray uppercase">Phone Number</label>
                    <input
                      type="text"
                      required
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      className="w-full bg-atelier-beige border border-atelier-lightgray py-1.5 px-3 text-xs focus:outline-none focus:border-atelier-dark"
                    />
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button
                      type="submit"
                      className="flex-grow py-2 bg-atelier-dark text-white font-mono text-xs tracking-widest uppercase hover:opacity-90 transition-opacity"
                    >
                      Save Address
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddAddress(false)}
                      className="py-2 px-3 border border-atelier-lightgray font-mono text-xs tracking-widest uppercase hover:border-atelier-dark transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Addresses list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {loadingAddresses ? (
                  <p className="text-sm text-atelier-gray col-span-full">Loading addresses…</p>
                ) : addresses.length === 0 && !showAddAddress ? (
                  <div className="col-span-full border border-dashed border-atelier-lightgray p-8 text-center">
                    <MapPin size={20} className="mx-auto text-atelier-gray mb-2" />
                    <p className="text-sm text-atelier-gray">No saved addresses yet.</p>
                  </div>
                ) : (
                  addresses.map((address) => {
                    const id = address._id || address.id;
                    const name = address.fullName || address.name;
                    const zip = address.postalCode || address.zip;
                    return (
                      <div key={id} className={`border p-5 bg-atelier-cream/20 space-y-3 relative text-sm transition-all ${
                        address.isDefault ? 'border-atelier-dark' : 'border-atelier-lightgray'
                      }`}>
                        <div className="flex justify-between items-start">
                          <span className="font-serif font-medium text-sm">{name}</span>
                          {address.isDefault && (
                            <span className="font-mono text-xs tracking-widest uppercase px-1.5 py-0.5 border border-atelier-dark text-atelier-dark bg-atelier-cream font-semibold">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="text-atelier-gray space-y-0.5 leading-relaxed font-light font-sans">
                          <p className="text-sm">{address.street}</p>
                          <p className="text-sm">{address.city}, {address.state} {zip}</p>
                          <p className="text-sm">{address.country}</p>
                          <p className="mt-2 font-mono text-sm text-atelier-dark">Phone: {address.phone}</p>
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-atelier-lightgray/40">
                          {!address.isDefault && (
                            <button
                              onClick={() => handleSetDefault(id)}
                              className="flex items-center gap-1 text-xs font-mono tracking-widest uppercase text-atelier-dark hover:opacity-70 transition-opacity"
                            >
                              <Star size={11} /> Set Default
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAddress(id)}
                            className="flex items-center gap-1 text-xs font-mono tracking-widest uppercase text-red-500 hover:opacity-70 transition-opacity ml-auto"
                          >
                            <Trash2 size={11} /> Remove
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* 4. Returns tab */}
          {activeTab === 'returns' && (
            <div className="space-y-6 animate-fade-in">
              {loadingReturns ? (
                <p className="text-sm text-atelier-gray">Loading returns…</p>
              ) : returns && returns.length > 0 ? (
                <div className="space-y-4">
                  {returns.map((ret) => (
                    <div key={ret._id} className="border border-atelier-lightgray p-6 bg-atelier-cream/30 space-y-4">
                      <div className="flex justify-between border-b border-atelier-lightgray/40 pb-3 font-mono text-sm tracking-wider uppercase text-atelier-gray">
                        <span>Return for Order: <strong className="text-atelier-dark">{ret.order}</strong></span>
                        <span className="flex items-center text-orange-700">
                          {ret.status}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {ret.items.map((item, i) => (
                          <div key={i} className="flex justify-between items-start">
                             <span className="font-serif text-sm text-atelier-dark font-medium">{item.product?.name || 'Item'} (Qty: {item.quantity})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-atelier-lightgray p-12 bg-atelier-cream/30 flex flex-col items-center justify-center text-center space-y-3">
                  <Undo2 size={24} className="text-atelier-gray" />
                  <h4 className="font-serif text-lg text-atelier-dark">No returns yet</h4>
                  <p className="text-sm text-atelier-gray">Start a return from an order's details.</p>
                </div>
              )}
            </div>
          )}

          {/* 5. Notifications Settings tab */}
          {activeTab === 'notifications' && (
            <div className="animate-fade-in">
              <NotificationSettings />
            </div>
          )}

        </div>
      </div>

    </div>
  )
}

export default Account
