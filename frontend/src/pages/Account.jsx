import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout } from '../features/auth/authSlice'
import { User, Package, MapPin, LogOut, CheckCircle2, ChevronRight } from 'lucide-react'

const Account = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  
  const { user, isAuthenticated } = useSelector(state => state.auth)
  const [activeTab, setActiveTab] = useState('profile') // 'profile', 'orders', 'addresses'
  
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

  // Mock orders list
  const mockOrders = [
    {
      id: 'AT-90382',
      date: '2026-07-15',
      items: [
        { name: 'Atelier Wool Coat', quantity: 1, price: 289, color: 'Camel', size: 'M' }
      ],
      total: 289,
      status: 'Delivered',
      deliveryDate: '2026-07-19'
    },
    {
      id: 'AT-83294',
      date: '2026-06-22',
      items: [
        { name: 'Leather Court Sneakers', quantity: 1, price: 178, color: 'Off-white', size: 'EU 42' },
        { name: 'Silk Blouse — Cream', quantity: 1, price: 145, color: 'Cream', size: 'S' }
      ],
      total: 323,
      status: 'Delivered',
      deliveryDate: '2026-06-25'
    }
  ]

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  if (!user) return null

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
  const username = user.email.split('@')[0]

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
              </div>
            </div>
          )}

          {/* 2. Orders History tab */}
          {activeTab === 'orders' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="font-mono text-sm tracking-widest uppercase text-atelier-gray border-b border-atelier-lightgray/40 pb-3 mb-4">
                Order History ({mockOrders.length})
              </h3>
              
              {mockOrders.length > 0 ? (
                <div className="space-y-4">
                  {mockOrders.map((order) => (
                    <div key={order.id} className="border border-atelier-lightgray p-6 bg-atelier-cream/30 space-y-4">
                      {/* Order info header */}
                      <div className="flex flex-col sm:flex-row justify-between border-b border-atelier-lightgray/40 pb-3 font-mono text-sm tracking-wider uppercase text-atelier-gray gap-2">
                        <div className="flex space-x-4">
                          <span>Order: <strong className="text-atelier-dark">{order.id}</strong></span>
                          <span>Placed: <strong className="text-atelier-dark">{order.date}</strong></span>
                        </div>
                        <div className="flex space-x-4 items-center">
                          <span className="flex items-center text-green-700">
                            <CheckCircle2 size={12} className="mr-1" /> {order.status}
                          </span>
                          {order.deliveryDate && (
                            <span>Delivered on: <strong className="text-atelier-dark">{order.deliveryDate}</strong></span>
                          )}
                        </div>
                      </div>

                      {/* Order items */}
                      <div className="space-y-3">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between items-start">
                            <div>
                              <h4 className="font-serif text-sm text-atelier-dark font-medium">{item.name}</h4>
                              <p className="font-mono text-xs text-atelier-gray uppercase mt-0.5">
                                Qty: {item.quantity} / Color: {item.color} {item.size && `/ Size: ${item.size}`}
                              </p>
                            </div>
                            <span className="font-mono text-xs text-atelier-dark font-medium">${item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {/* Total */}
                      <div className="border-t border-atelier-lightgray/30 pt-3 flex justify-between font-mono text-xs uppercase tracking-wider">
                        <span>Total Paid</span>
                        <strong className="text-atelier-dark">${order.total}</strong>
                      </div>
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
                        <span className="font-mono text-[7px] tracking-widest uppercase px-1.5 py-0.5 border border-atelier-accent text-atelier-accent font-semibold">
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

        </div>
      </div>

    </div>
  )
}

export default Account
