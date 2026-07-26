import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { clearCart } from '../features/cart/cartSlice'
import { CheckCircle, ArrowLeft, CreditCard, Shield, Lock, MapPin, Plus, CheckCircle2 } from 'lucide-react'
import axios from '../services/axiosInstance'

const Checkout = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  
  const { items, discountPercent } = useSelector(state => state.cart)
  const { user } = useSelector(state => state.auth)

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [useNewAddress, setUseNewAddress] = useState(false)

  // Form inputs states
  const [email, setEmail] = useState(user?.email || '')
  const [firstName, setFirstName] = useState(user?.name?.split(' ')[0] || '')
  const [lastName, setLastName] = useState(user?.name?.split(' ')[1] || '')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [zip, setZip] = useState('')
  const [phone, setPhone] = useState('')
  
  const [cardName, setCardName] = useState(user?.name || '')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')

  // Checkout status
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [generatedOrderId, setGeneratedOrderId] = useState('')

  // Load saved addresses
  useEffect(() => {
    if (user) {
      axios.get('address').then(res => {
        if (res.data && res.data.addresses) {
          const addrs = res.data.addresses
          setSavedAddresses(addrs)
          // Auto-select default address
          const defaultAddr = addrs.find(a => a.isDefault) || addrs[0]
          if (defaultAddr) {
            applyAddress(defaultAddr)
            setSelectedAddressId(defaultAddr._id || defaultAddr.id)
          } else if (addrs.length === 0) {
            setUseNewAddress(true)
          }
        }
      }).catch(() => {
        // No addresses saved yet — show new form
        setUseNewAddress(true)
      })
    }
  }, [user])

  const applyAddress = (addr) => {
    const nameParts = (addr.fullName || addr.name || '').split(' ')
    setFirstName(nameParts[0] || '')
    setLastName(nameParts.slice(1).join(' ') || '')
    setAddress(addr.street || '')
    setCity(addr.city || '')
    setZip(addr.postalCode || addr.zip || '')
    setPhone(addr.phone || '')
    setUseNewAddress(false)
  }

  const handleSelectSavedAddress = (addr) => {
    applyAddress(addr)
    setSelectedAddressId(addr._id || addr.id)
  }

  const handleUseNewAddress = () => {
    setSelectedAddressId(null)
    setAddress('')
    setCity('')
    setZip('')
    setPhone('')
    setFirstName(user?.name?.split(' ')[0] || '')
    setLastName(user?.name?.split(' ')[1] || '')
    setUseNewAddress(true)
  }

  if (items.length === 0 && !orderSuccess) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center font-sans">
        <p className="font-serif text-xl text-atelier-gray italic">Your shopping bag is empty.</p>
        <p className="text-xs text-atelier-gray mt-2 font-mono uppercase tracking-wider">Cannot proceed to checkout without items.</p>
        <Link to="/" className="btn-atelier-outline mt-6 inline-block">Back to Shop</Link>
      </div>
    )
  }

  // Cost calculations
  const subtotal = items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0)
  const discountAmount = Math.round(subtotal * (discountPercent / 100))
  const shipping = subtotal >= 150 ? 0 : 15
  const finalTotal = subtotal - discountAmount + shipping

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    
    setIsProcessing(true)

    try {
      let savedAddressId = selectedAddressId;
      
      // 1. Save new address if applicable
      if (useNewAddress || savedAddresses.length === 0) {
        const addrRes = await axios.post('address', {
          fullName: `${firstName} ${lastName}`.trim(),
          street: address,
          city,
          state: 'N/A',
          postalCode: zip,
          country: 'N/A',
          phone
        });
        savedAddressId = addrRes.data._id || addrRes.data.id;
      }

      // 2. Prepare Order Payload
      const orderPayload = {
        orderItems: items.map(item => ({
          product: item.product._id || item.product.id,
          name: item.product.name,
          image: item.product.images?.[0],
          price: item.product.price,
          quantity: item.quantity
        })),
        shippingInfo: {
          fullName: `${firstName} ${lastName}`.trim(),
          address: address,
          city: city,
          postalCode: zip,
          country: 'N/A',
          phone: phone,
        },
        itemsPrice: subtotal,
        shippingPrice: shipping,
        taxPrice: 0,
        totalPrice: finalTotal,
        addressId: savedAddressId
      };

      // 3. Create Order
      const orderRes = await axios.post('orders', orderPayload);
      
      // Complete mock payment process visual delay
      setTimeout(() => {
        setGeneratedOrderId(orderRes.data.order._id || orderRes.data.order.id);
        setIsProcessing(false);
        setOrderSuccess(true);
        dispatch(clearCart());
      }, 1800);
      
    } catch (err) {
      console.error("Order creation failed", err);
      setIsProcessing(false);
      alert(err?.response?.data?.message || 'Order failed to process. Please try again.');
    }
  }

  if (orderSuccess) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 animate-fade-in font-sans">
        <div className="max-w-md w-full text-center space-y-8 bg-atelier-cream border border-atelier-lightgray p-8 sm:p-12">
          <div className="flex justify-center text-atelier-accent">
            <CheckCircle size={60} strokeWidth={1} />
          </div>
          
          <div className="space-y-3">
            <span className="font-mono text-xs sm:text-sm tracking-[0.25em] uppercase text-atelier-gray block">
                Payment Successful
              </span>
            <h1 className="font-serif text-3xl text-atelier-dark font-medium leading-tight">
              Thank you for your order.
            </h1>
            <p className="text-xs font-mono text-atelier-gray uppercase tracking-widest pt-2">
              Order ID: <span className="text-atelier-dark font-semibold font-mono">{generatedOrderId}</span>
            </p>
          </div>

          <p className="text-atelier-gray text-xs sm:text-sm leading-relaxed font-light font-sans max-w-sm mx-auto">
            A confirmation email has been dispatched to <strong className="text-atelier-dark font-normal">{email}</strong>. We will notify you as soon as your items are dispatched from our studio.
          </p>

          <div className="pt-4">
            <button
              onClick={() => navigate('/')}
              className="w-full btn-atelier-dark"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in font-sans relative">
      {/* Processing Loader */}
      {isProcessing && (
        <div className="fixed inset-0 bg-atelier-beige/80 backdrop-blur-xs z-50 flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-atelier-dark border-r-2" />
          <p className="font-mono text-sm uppercase tracking-[0.25em] text-atelier-dark font-medium">
            Processing Secure Payment...
          </p>
        </div>
      )}

      {/* Title block */}
      <div className="border-b border-atelier-lightgray/50 pb-6 mb-10 flex items-center justify-between">
        <div>
          <span className="font-mono text-xs sm:text-sm tracking-[0.25em] uppercase text-atelier-gray block mb-1">
            Secure Gateway
          </span>
          <h1 className="font-serif text-3xl text-atelier-dark font-semibold">
            Checkout
          </h1>
        </div>
        <Link to="/" className="text-atelier-gray hover:text-atelier-dark flex items-center gap-1 text-sm font-mono tracking-widest uppercase">
          <ArrowLeft size={12} />
          <span>Cancel</span>
        </Link>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start pb-20">
        
        {/* Left shipping & billing forms */}
        <div className="lg:col-span-7 space-y-12">
          {/* Shipping Address Section */}
          <div className="space-y-6">
            <h2 className="font-serif text-xl text-atelier-dark font-medium border-b border-atelier-lightgray/40 pb-2">
              1. Delivery Address
            </h2>

            {/* Saved addresses picker */}
            {savedAddresses.length > 0 && (
              <div className="space-y-3">
                <p className="font-mono text-xs tracking-widest uppercase text-atelier-gray">Saved Addresses</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedAddresses.map((addr) => {
                    const id = addr._id || addr.id;
                    const name = addr.fullName || addr.name;
                    const zip = addr.postalCode || addr.zip;
                    const isSelected = selectedAddressId === id && !useNewAddress;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleSelectSavedAddress(addr)}
                        className={`w-full text-left p-4 border transition-all duration-200 relative ${
                          isSelected
                            ? 'border-atelier-dark bg-atelier-cream shadow-sm'
                            : 'border-atelier-lightgray bg-white hover:border-atelier-dark/50 hover:bg-atelier-cream/40'
                        }`}
                      >
                        {isSelected && (
                          <CheckCircle2 size={14} className="absolute top-3 right-3 text-atelier-dark" />
                        )}
                        {addr.isDefault && (
                          <span className="absolute top-3 right-3 font-mono text-[9px] tracking-widest uppercase px-1 py-0.5 border border-atelier-dark text-atelier-dark bg-atelier-cream">
                            {isSelected ? '' : 'Default'}
                          </span>
                        )}
                        <div className="flex items-start gap-2">
                          <MapPin size={12} className="text-atelier-gray mt-0.5 shrink-0" />
                          <div>
                            <p className="font-serif text-sm text-atelier-dark font-medium">{name}</p>
                            <p className="font-mono text-xs text-atelier-gray mt-0.5">{addr.street}</p>
                            <p className="font-mono text-xs text-atelier-gray">{addr.city}, {addr.state} {zip}</p>
                            <p className="font-mono text-xs text-atelier-gray">{addr.country}</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}

                  {/* "Use a new address" card */}
                  <button
                    type="button"
                    onClick={handleUseNewAddress}
                    className={`w-full text-left p-4 border transition-all duration-200 flex items-center gap-3 ${
                      useNewAddress
                        ? 'border-atelier-dark bg-atelier-cream shadow-sm'
                        : 'border-dashed border-atelier-lightgray bg-white hover:border-atelier-dark/50'
                    }`}
                  >
                    <Plus size={14} className="text-atelier-gray shrink-0" />
                    <span className="font-mono text-xs tracking-widest uppercase text-atelier-gray">Use a new address</span>
                  </button>
                </div>
              </div>
            )}

            {/* Manual form — always shown if no saved, or when "new address" selected */}
            {(useNewAddress || savedAddresses.length === 0) && (
              <div className="space-y-4 pt-2">
                {savedAddresses.length > 0 && (
                  <p className="font-mono text-xs tracking-widest uppercase text-atelier-gray border-b border-atelier-lightgray/40 pb-2">Enter New Address</p>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block font-mono text-xs tracking-widest uppercase text-atelier-gray">First Name</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-transparent border-b border-atelier-lightgray focus:border-atelier-dark py-2 px-1 text-sm text-atelier-dark focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-mono text-xs tracking-widest uppercase text-atelier-gray">Last Name</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-transparent border-b border-atelier-lightgray focus:border-atelier-dark py-2 px-1 text-sm text-atelier-dark focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-mono text-xs tracking-widest uppercase text-atelier-gray">Street Address</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-transparent border-b border-atelier-lightgray focus:border-atelier-dark py-2 px-1 text-sm text-atelier-dark focus:outline-none transition-colors"
                    placeholder="Apartment, suite, unit, etc."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block font-mono text-xs tracking-widest uppercase text-atelier-gray">City</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-transparent border-b border-atelier-lightgray focus:border-atelier-dark py-2 px-1 text-sm text-atelier-dark focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-mono text-xs tracking-widest uppercase text-atelier-gray">ZIP / Postal Code</label>
                    <input
                      type="text"
                      required
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      className="w-full bg-transparent border-b border-atelier-lightgray focus:border-atelier-dark py-2 px-1 text-sm text-atelier-dark focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-mono text-xs tracking-widest uppercase text-atelier-gray">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-transparent border-b border-atelier-lightgray focus:border-atelier-dark py-2 px-1 text-sm text-atelier-dark focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            {/* When a saved address is selected, show its fields pre-filled (read-only display) */}
            {!useNewAddress && selectedAddressId && savedAddresses.length > 0 && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block font-mono text-xs tracking-widest uppercase text-atelier-gray">First Name</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-transparent border-b border-atelier-lightgray focus:border-atelier-dark py-2 px-1 text-sm text-atelier-dark focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-mono text-xs tracking-widest uppercase text-atelier-gray">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-transparent border-b border-atelier-lightgray focus:border-atelier-dark py-2 px-1 text-sm text-atelier-dark focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block font-mono text-xs tracking-widest uppercase text-atelier-gray">Street Address</label>
                  <input type="text" required value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-transparent border-b border-atelier-lightgray focus:border-atelier-dark py-2 px-1 text-sm text-atelier-dark focus:outline-none transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block font-mono text-xs tracking-widest uppercase text-atelier-gray">City</label>
                    <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} className="w-full bg-transparent border-b border-atelier-lightgray focus:border-atelier-dark py-2 px-1 text-sm text-atelier-dark focus:outline-none transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-mono text-xs tracking-widest uppercase text-atelier-gray">ZIP / Postal Code</label>
                    <input type="text" required value={zip} onChange={(e) => setZip(e.target.value)} className="w-full bg-transparent border-b border-atelier-lightgray focus:border-atelier-dark py-2 px-1 text-sm text-atelier-dark focus:outline-none transition-colors" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block font-mono text-xs tracking-widest uppercase text-atelier-gray">Phone Number</label>
                  <input type="text" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-transparent border-b border-atelier-lightgray focus:border-atelier-dark py-2 px-1 text-sm text-atelier-dark focus:outline-none transition-colors" />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="block font-mono text-xs tracking-widest uppercase text-atelier-gray">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b border-atelier-lightgray focus:border-atelier-dark py-2 px-1 text-sm text-atelier-dark focus:outline-none transition-colors"
                placeholder="name@domain.com"
              />
            </div>
          </div>

          {/* Payment Details Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-atelier-lightgray/40 pb-2">
              <h2 className="font-serif text-xl text-atelier-dark font-medium">
                2. Payment Details
              </h2>
              <div className="flex items-center space-x-1.5 text-atelier-gray text-xs font-mono tracking-widest uppercase">
                <Lock size={10} />
                <span>SSL Encrypted</span>
              </div>
            </div>

            <div className="bg-atelier-cream border border-atelier-lightgray p-6 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs text-atelier-dark font-medium flex items-center gap-1.5">
                  <CreditCard size={14} className="text-atelier-gray" /> Credit Card (Stripe Sandbox)
                </span>
                <div className="flex space-x-1">
                  <span className="h-5 w-8 bg-atelier-beige border border-atelier-lightgray/60 rounded flex items-center justify-center text-xs font-bold font-mono tracking-tighter">VISA</span>
                  <span className="h-5 w-8 bg-atelier-beige border border-atelier-lightgray/60 rounded flex items-center justify-center text-xs font-bold font-mono tracking-tighter">MC</span>
                  <span className="h-5 w-8 bg-atelier-beige border border-atelier-lightgray/60 rounded flex items-center justify-center text-xs font-bold font-mono tracking-tighter">AMEX</span>
                </div>
              </div>

              {/* Cardholder name */}
              <div className="space-y-1">
                <label className="block font-mono text-xs tracking-widest uppercase text-atelier-gray">Cardholder Name</label>
                <input
                  type="text"
                  required
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full bg-transparent border-b border-atelier-lightgray/60 focus:border-atelier-dark py-2 px-1 text-xs text-atelier-dark focus:outline-none transition-colors"
                  placeholder="Piyush Sharma"
                />
              </div>

              {/* Card Number */}
              <div className="space-y-1">
                <label className="block font-mono text-xs tracking-widest uppercase text-atelier-gray">Card Number</label>
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full bg-transparent border-b border-atelier-lightgray/60 focus:border-atelier-dark py-2 px-1 text-xs text-atelier-dark focus:outline-none transition-colors font-mono"
                  placeholder="•••• •••• •••• ••••"
                  maxLength="19"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Expiry Date */}
                <div className="space-y-1">
                  <label className="block font-mono text-xs tracking-widest uppercase text-atelier-gray">Expiration Date</label>
                  <input
                    type="text"
                    required
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full bg-transparent border-b border-atelier-lightgray/60 focus:border-atelier-dark py-2 px-1 text-xs text-atelier-dark focus:outline-none transition-colors font-mono"
                    placeholder="MM / YY"
                    maxLength="5"
                  />
                </div>
                {/* CVC Code */}
                <div className="space-y-1">
                  <label className="block font-mono text-xs tracking-widest uppercase text-atelier-gray">CVC Code</label>
                  <input
                    type="password"
                    required
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="w-full bg-transparent border-b border-atelier-lightgray/60 focus:border-atelier-dark py-2 px-1 text-xs text-atelier-dark focus:outline-none transition-colors font-mono"
                    placeholder="•••"
                    maxLength="4"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right order summary list (Sticky) */}
        <div className="lg:col-span-5 lg:sticky lg:top-28">
          <div className="bg-atelier-cream border border-atelier-lightgray p-6 space-y-6">
            <h2 className="font-serif text-lg text-atelier-dark font-medium border-b border-atelier-lightgray/60 pb-3 uppercase tracking-wide">
              Order Summary
            </h2>

            {/* List of items */}
            <div className="divide-y divide-atelier-lightgray/40 max-h-60 overflow-y-auto pr-1 no-scrollbar">
              {items.map((item, index) => (
                <div key={index} className="py-4 first:pt-0 flex items-start space-x-3">
                  <div className="h-12 w-12 bg-atelier-lightgray flex-shrink-0 overflow-hidden rounded-md">
                    <img
                      src={item.product.images[0] || 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80'}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80'
                      }}
                    />
                  </div>
                  <div className="flex-grow text-xs leading-tight">
                    <h3 className="font-serif text-atelier-dark font-medium line-clamp-1">{item.product.name}</h3>
                    <p className="font-mono text-xs text-atelier-gray uppercase mt-0.5">
                      Qty: {item.quantity} / Color: {item.color.name}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-atelier-dark font-medium">
                    ${item.product.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            {/* Subtotal calculation details */}
            <div className="space-y-2 text-xs font-mono tracking-wider text-atelier-gray border-t border-atelier-lightgray/40 pt-4 uppercase">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-atelier-dark font-medium">${subtotal}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-atelier-accent">
                  <span>Discount</span>
                  <span>-${discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-atelier-dark font-medium">{shipping === 0 ? 'FREE' : `$${shipping}`}</span>
              </div>
              <div className="flex justify-between border-t border-atelier-lightgray/40 pt-4 text-sm tracking-widest text-atelier-dark">
                <span className="font-serif capitalize font-medium text-base">Grand Total</span>
                <span className="font-medium">${finalTotal}</span>
              </div>
            </div>

            {/* Submit Action CTA */}
            <div className="space-y-4 pt-2">
              <button
                type="submit"
                className="w-full btn-atelier-dark py-4 text-center"
              >
                Place Order (${finalTotal})
              </button>
              
              <div className="flex items-center justify-center space-x-2 text-xs font-mono tracking-widest text-atelier-gray uppercase">
                <Shield size={12} />
                <span>Secure Payments &bull; No actual billing</span>
              </div>
            </div>
          </div>
        </div>

      </form>
    </div>
  )
}

export default Checkout
