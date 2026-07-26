import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout } from '../features/auth/authSlice'
import { User, Package, MapPin, LogOut, CheckCircle2, ChevronRight, Undo2, BellRing } from 'lucide-react'
import OrderDetailsDrawer from '../components/account/OrderDetailsDrawer'
import axios from '../services/axiosInstance'
import { io } from 'socket.io-client'

const Account = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  
  const { user, isAuthenticated } = useSelector(state => state.auth)
  const [activeTab, setActiveTab] = useState('profile') // 'profile', 'orders', 'addresses', 'returns'
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  
  // Address states
  const [addresses, setAddresses] = useState([
    {
      id: 1,
      isDefault: true,
      name: 'Piyush Sharma',
      street: '102 Luxury Block, Quiet Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      zip: '400001',
      country: 'India',
      phone: '+91 98765 43210'
    }
  ])
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [newAddress, setNewAddress] = useState({ name: '', street: '', city: '', state: '', zip: '', country: '', phone: '' })

  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [error, setError] = useState("")

  const [returns, setReturns] = useState([])
  const [loadingReturns, setLoadingReturns] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)

  // Realtime updates & Push notifications
  useEffect(() => {
    let socket;
    if (isAuthenticated && user) {
      socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000')
      socket.emit("join", user._id || user.id)

      socket.on("orderStatusUpdated", (data) => {
        setOrders(prevOrders => 
          prevOrders.map(o => {
            if ((o._id || o.id) === data.orderId) {
              return { ...o, orderStatus: data.status, deliveredAt: data.deliveredAt || o.deliveredAt }
            }
            return o;
          })
        )
      })

      if ('serviceWorker' in navigator && 'PushManager' in window) {
        navigator.serviceWorker.register('/push-sw.js').then(async (reg) => {
          const sub = await reg.pushManager.getSubscription();
          if (sub) setPushEnabled(true);
        });
      }
    }
    return () => {
      if (socket) socket.disconnect()
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    if (activeTab === 'returns' && returns.length === 0) {
      const fetchReturns = async () => {
        try {
          setLoadingReturns(true)
          const res = await axios.get('returns')
          if (res && res.data && res.data.returns) {
            setReturns(res.data.returns)
          }
        } catch (err) {
          console.error(err)
        } finally {
          setLoadingReturns(false)
        }
      }
      fetchReturns()
    }
  }, [activeTab, returns.length])

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
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array('BCxQyetGgdcrl3YtU6PFu3sC5y0x-yWpyJ-Cg2HY5xZMNXbsb7W1brDlKoAmlJmda52Ra76csLc5mo8pZDG-FZk')
        });
        await axios.post('push/subscribe', sub);
        setPushEnabled(true);
        alert('Push notifications enabled!');
      } catch (e) {
        console.error('Could not subscribe', e);
        alert('Failed to enable notifications.');
      }
    } else {
      alert('Push notifications not supported in your browser.');
    }
  }

  // Debug: Check auth state
  useEffect(() => {
    console.log("Account Component Auth State:", { user, isAuthenticated, token: !!localStorage.getItem("token") })
  }, [user, isAuthenticated])

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoadingOrders(true)
        const res = await axios.get('orders/my-orders')
        if (res && res.data && res.data.orders) {
          setOrders(res.data.orders)
        }
      } catch (err) {
        console.error('Error fetching orders', err)
        setError(err.message)
      } finally {
        setLoadingOrders(false)
      }
    }

    if (isAuthenticated && user) {
      fetchOrders()
    }
  }, [isAuthenticated, user])

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

  const handleAddAddress = (e) => {
    e.preventDefault()
    setAddresses([...addresses, { id: Date.now(), isDefault: false, ...newAddress }])
    setNewAddress({ name: '', street: '', city: '', state: '', zip: '', country: '', phone: '' })
    setShowAddAddress(false)
  }

  // Display username or first part of email matching screenshot "Hello, p9464888"
  const username = (user.email || "").split("@")[0] || user.name?.split(" ")[0] || "Member";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in font-sans">
      
      {/* Upper greetings & logout */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between border-b border-atelier-lightgray/50 pb-6 mb-8 gap-4">
        <div>

      <OrderDetailsDrawer order={selectedOrder} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
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

          {/* 2. Orders History tab */}
          {activeTab === 'orders' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="font-mono text-sm tracking-widest uppercase text-atelier-gray border-b border-atelier-lightgray/40 pb-3 mb-4">
                Order History ({orders.length})
              </h3>
              
              {loadingOrders ? (
                <p className="text-sm text-atelier-gray">Loading orders…</p>
              ) : orders && orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order._id} className="border border-atelier-lightgray bg-atelier-cream/30 mb-6">
                      {/* Order info header */}
                      <div className="flex flex-col sm:flex-row justify-between border-b border-atelier-lightgray/40 p-6 pb-3 font-mono text-sm tracking-wider uppercase text-atelier-gray gap-2">
                        <div>
                          <span className="block text-xs">ORDER • {order._id.slice(-8).toUpperCase()}</span>
                          <span className="font-serif text-2xl text-atelier-dark font-medium capitalize mt-1 block">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}</span>
                          <span className="flex items-center text-atelier-dark mt-1 text-xs"><div className="w-1.5 h-1.5 rounded-full bg-atelier-dark mr-1.5"></div> {order.orderStatus}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-xs">TOTAL</span>
                          <span className="font-serif text-xl text-atelier-dark font-medium">${order.totalPrice || order.total}</span>
                        </div>
                      </div>

                      {/* Order Timeline Progress */}
                      {order.orderStatus !== 'Cancelled' && (
                        <div className="px-6 py-4 border-b border-atelier-lightgray/40 relative">
                          <div className="absolute top-1/2 left-6 right-6 h-[1px] bg-atelier-lightgray -translate-y-1/2 z-0 hidden sm:block"></div>
                          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center sm:items-start space-y-4 sm:space-y-0 text-center sm:text-left">
                            {['Processing', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered'].map((step, idx, arr) => {
                               const statusOrder = ['Processing', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered'];
                               const currentIdx = statusOrder.indexOf(order.orderStatus);
                               const isCompleted = idx <= currentIdx || currentIdx === -1 && order.orderStatus === 'Delivered';
                               return (
                                 <div key={step} className="flex flex-col items-center bg-transparent sm:bg-[#F3F1EC] sm:px-2">
                                   <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mb-2 ${isCompleted ? 'bg-atelier-dark border-atelier-dark text-white' : 'bg-transparent border-atelier-lightgray text-atelier-gray'}`}>
                                      {isCompleted ? <CheckCircle2 size={14} /> : <Package size={14} />}
                                   </div>
                                   <span className={`font-mono text-[10px] uppercase tracking-widest ${isCompleted ? 'text-atelier-dark font-bold' : 'text-atelier-gray'}`}>{step}</span>
                                 </div>
                               )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Order items */}
                      <div className="p-6">
                        {order.orderItems.map((item, i) => (
                          <div key={i} className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-4">
                              {item.image && <img src={item.image} alt={item.name} className="w-16 h-16 object-cover bg-atelier-lightgray" />}
                              <div>
                                <h4 className="font-serif text-sm text-atelier-dark font-medium">{item.name}</h4>
                                <p className="font-mono text-xs text-atelier-gray uppercase mt-0.5">
                                  Qty: {item.quantity}
                                </p>
                              </div>
                            </div>
                            <span className="font-mono text-sm text-atelier-dark font-medium">${item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {/* Total */}
                      <div className="px-6 flex justify-end pt-3">
                        <button onClick={() => { setSelectedOrder(order); setDrawerOpen(true) }} className="px-4 py-2 border border-atelier-dark text-sm font-mono uppercase bg-white hover:bg-atelier-lightgray transition-colors">View details</button>
                      </div>
                      <div className="pb-6"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-serif text-sm text-atelier-gray italic">You haven't placed any orders yet.</p>
              )}
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
                {addresses.map((address) => (
                  <div key={address.id} className="border border-atelier-lightgray p-5 bg-atelier-cream/20 space-y-3 relative text-sm">
                    <div className="flex justify-between items-start">
                      <span className="font-serif font-medium text-sm">{address.name}</span>
                      {address.isDefault && (
                        <span className="font-mono text-xs tracking-widest uppercase px-1.5 py-0.5 border border-atelier-accent text-atelier-accent font-semibold">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-atelier-gray space-y-0.5 leading-relaxed font-light font-sans">
                      <p className="text-sm">{address.street}</p>
                      <p className="text-sm">{address.city}, {address.state} {address.zip}</p>
                      <p className="text-sm">{address.country}</p>
                      <p className="mt-2 font-mono text-sm text-atelier-dark">Phone: {address.phone}</p>
                    </div>
                  </div>
                ))}
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

        </div>
      </div>

    </div>
  )
}

export default Account
