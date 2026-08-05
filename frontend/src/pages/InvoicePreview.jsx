import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Printer, Download, Receipt, Building, CreditCard, ShoppingBag, ShieldAlert } from 'lucide-react'
import api from '../services/axiosInstance'

const InvoicePreview = () => {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [storeSettings, setStoreSettings] = useState(null)

  // Fetch store settings & invoice details
  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch invoice first
        const invoiceRes = await api.get(`invoice/order/${orderId}`)
        if (invoiceRes.data && invoiceRes.data.invoice) {
          setInvoice(invoiceRes.data.invoice)
        }

        // Fetch store settings for company details
        const settingsRes = await api.get('settings')
        if (settingsRes.data && settingsRes.data.settings) {
          setStoreSettings(settingsRes.data.settings)
        }
      } catch (err) {
        console.error('Invoice load error:', err)
        setError(err.response?.data?.message || 'Failed to load invoice. Please ensure you are authorized.')
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      fetchInvoiceData()
    }
  }, [orderId])

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = async () => {
    if (!invoice) return
    try {
      setDownloading(true)
      const invoiceId = invoice._id || invoice.id
      
      const response = await api.get(`invoice/download?id=${encodeURIComponent(invoiceId)}`, {
        responseType: 'blob'
      })
      
      // Create local URL for the downloaded blob
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${invoice.invoiceNumber}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download error:', err)
      alert('Failed to download invoice PDF. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse space-y-8 font-sans">
        <div className="h-8 bg-gray-250 w-1/4 rounded"></div>
        <div className="bg-white border border-gray-100 p-8 space-y-6 shadow-sm rounded-xl">
          <div className="flex justify-between">
            <div className="space-y-2 w-1/3">
              <div className="h-6 bg-gray-250 rounded"></div>
              <div className="h-4 bg-gray-250 rounded w-5/6"></div>
              <div className="h-4 bg-gray-250 rounded w-2/3"></div>
            </div>
            <div className="space-y-2 w-1/4">
              <div className="h-8 bg-gray-250 rounded"></div>
              <div className="h-4 bg-gray-250 rounded"></div>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-6 grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-100 rounded"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
          </div>
          <div className="h-40 bg-gray-100 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center font-sans">
        <div className="flex justify-center text-red-500 mb-4">
          <ShieldAlert size={48} strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-serif font-medium text-gray-800 mb-2">Invoice Access Restrained</h3>
        <p className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-6">{error || 'Invoice not found'}</p>
        <button
          onClick={() => navigate('/orders')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white font-mono text-[10px] uppercase tracking-widest hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={12} /> Back to My Orders
        </button>
      </div>
    )
  }

  const order = invoice.order || {}
  const user = invoice.user || {}
  const items = order.orderItems || []
  const shippingInfo = order.shippingInfo || {}
  const company = storeSettings?.storeInfo || {
    name: 'Atelier Premium Store',
    address: '123 Fashion Ave, Suite 500, New York, NY 10001',
    phone: '+1 (555) 234-5678',
    email: 'support@atelier.com'
  }
  const taxSettings = storeSettings?.tax || {
    taxType: 'GST',
    taxRate: 18,
    taxId: ''
  }

  const discountAmount = order.discountAmount || 0
  const subtotal = order.itemsPrice || 0
  const shippingCharge = order.shippingPrice || 0
  const taxPrice = order.taxPrice || 0
  const grandTotal = order.totalPrice || 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 font-sans text-gray-850">
      
      {/* Top Action Bar (hidden on print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-gray-100 pb-5 print:hidden">
        <button
          onClick={() => navigate(`/orders/${orderId}`)}
          className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Order details
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-400 text-xs font-mono uppercase tracking-wider rounded-lg transition-all shadow-xs"
          >
            <Printer size={13} />
            Print Invoice
          </button>
          
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-900 text-white hover:bg-gray-800 text-xs font-mono uppercase tracking-wider rounded-lg transition-all shadow-sm disabled:opacity-50"
          >
            {downloading ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Download size={13} />
            )}
            Download PDF
          </button>
        </div>
      </div>

      {/* Actual Printable Invoice Container */}
      <div className="bg-white border border-gray-200/80 p-6 sm:p-10 md:p-12 shadow-sm rounded-2xl print:border-none print:shadow-none print:p-0">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-gray-100 pb-8">
          {/* Logo / Company Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Receipt className="text-gray-900" size={24} />
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-gray-900">{company.name}</span>
            </div>
            <div className="text-xs text-gray-500 font-light leading-relaxed max-w-sm">
              <p>{company.address}</p>
              <p className="mt-1">Phone: {company.phone} | Email: {company.email}</p>
              {taxSettings.taxId && (
                <p className="font-mono text-gray-700 font-medium mt-1.5 uppercase">
                  {taxSettings.taxType}IN: {taxSettings.taxId}
                </p>
              )}
            </div>
          </div>

          {/* Invoice Details */}
          <div className="text-left md:text-right space-y-1.5 md:self-stretch md:flex md:flex-col md:justify-between">
            <h1 className="font-serif text-2xl font-semibold text-gray-900 tracking-tight">INVOICE</h1>
            <div className="text-xs space-y-1">
              <p className="text-gray-500">Invoice No: <span className="font-mono text-gray-900 font-semibold">{invoice.invoiceNumber}</span></p>
              <p className="text-gray-500">Order ID: <span className="font-mono text-gray-900 font-semibold">#{orderId.slice(-8).toUpperCase()}</span></p>
              <p className="text-gray-500">Date: <span className="text-gray-900">{new Date(invoice.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span></p>
              <p className="text-gray-500">Payment status: <span className={`font-semibold ${order.paymentInfo?.paymentStatus === 'Paid' ? 'text-green-600' : 'text-amber-600'}`}>{order.paymentInfo?.paymentStatus || 'Pending'}</span></p>
              <p className="text-gray-500">Payment method: <span className="text-gray-900 font-medium">{order.paymentInfo?.method || 'COD'}</span></p>
            </div>
          </div>
        </div>

        {/* Addresses Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b border-gray-100">
          {/* Bill To */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
              <Building size={12} />
              Billing Address
            </h3>
            <div className="text-xs space-y-1">
              <p className="font-semibold text-gray-900">{shippingInfo.fullName || user.name}</p>
              <p className="text-gray-500 font-light leading-relaxed">{shippingInfo.address}</p>
              <p className="text-gray-500 font-light">{shippingInfo.city}, {shippingInfo.state || 'N/A'} {shippingInfo.postalCode}</p>
              <p className="text-gray-500 font-light">Phone: {shippingInfo.phone}</p>
              <p className="text-gray-500 font-light">Email: {user.email}</p>
            </div>
          </div>

          {/* Ship To */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
              <CreditCard size={12} />
              Shipping Address
            </h3>
            <div className="text-xs space-y-1">
              <p className="font-semibold text-gray-900">{shippingInfo.fullName}</p>
              <p className="text-gray-500 font-light leading-relaxed">{shippingInfo.address}</p>
              <p className="text-gray-500 font-light">{shippingInfo.city}, {shippingInfo.state || 'N/A'} {shippingInfo.postalCode}</p>
              <p className="text-gray-500 font-light">Phone: {shippingInfo.phone}</p>
            </div>
          </div>
        </div>

        {/* Order Items Table */}
        <div className="py-8">
          <h3 className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-1.5">
            <ShoppingBag size={12} />
            Order Summary
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-mono text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 font-medium">Item Description</th>
                  <th className="pb-3 text-center font-medium">Size/Color</th>
                  <th className="pb-3 text-center font-medium">Qty</th>
                  <th className="pb-3 text-right font-medium">Price</th>
                  <th className="pb-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {items.map((item, idx) => {
                  const unitPrice = item.price || 0
                  const itemTotal = unitPrice * item.quantity

                  return (
                    <tr key={idx} className="align-middle">
                      {/* Product details & thumbnail */}
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={item.image || '/placeholder.jpg'} 
                            alt="" 
                            className="w-10 h-10 object-cover bg-gray-50 border border-gray-100 rounded print:hidden" 
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5 print:block hidden">
                              {item.size ? `Size: ${item.size}` : ''} {item.color ? `| Color: ${item.color}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Options */}
                      <td className="py-4 text-center font-mono text-gray-600">
                        {item.size || '-'}/{item.color || '-'}
                      </td>

                      {/* Quantity */}
                      <td className="py-4 text-center font-mono text-gray-900">
                        {item.quantity}
                      </td>

                      {/* Unit Price */}
                      <td className="py-4 text-right font-mono text-gray-600">
                        ${unitPrice.toFixed(2)}
                      </td>

                      {/* Subtotal */}
                      <td className="py-4 text-right font-mono text-gray-900 font-semibold">
                        ${itemTotal.toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Section */}
        <div className="border-t border-gray-200 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notes */}
          <div className="text-[11px] text-gray-400 font-light leading-relaxed max-w-sm">
            <p className="font-mono uppercase tracking-wider mb-1 font-semibold text-gray-500">Invoice Note</p>
            <p>This is a computer generated invoice and does not require a physical signature. Goods once sold cannot be returned, unless subject to damage policy.</p>
          </div>

          {/* Pricing Totals */}
          <div className="space-y-2.5 max-w-xs md:ml-auto w-full">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtotal</span>
              <span className="font-mono">${subtotal.toFixed(2)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>Discount Code</span>
                <span className="font-mono text-green-600">-${discountAmount.toFixed(2)}</span>
              </div>
            )}

            {shippingCharge > 0 ? (
              <div className="flex justify-between text-xs text-gray-500">
                <span>Shipping</span>
                <span className="font-mono">${shippingCharge.toFixed(2)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-xs text-gray-500">
                <span>Shipping</span>
                <span className="font-mono text-green-600">Free</span>
              </div>
            )}

            {taxPrice > 0 && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>{taxSettings.taxType} ({taxSettings.taxRate}%)</span>
                <span className="font-mono">${taxPrice.toFixed(2)}</span>
              </div>
            )}

            <div className="border-t border-gray-100 pt-3 flex justify-between text-sm font-semibold text-gray-900">
              <span className="font-serif">Grand Total</span>
              <span className="font-mono text-base">${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer info message */}
        <div className="border-t border-gray-100 mt-10 pt-6 text-center text-[10px] text-gray-400 font-light">
          <p>Thank you for placing your order with {company.name}. We look forward to seeing you again.</p>
        </div>

      </div>
    </div>
  )
}

export default InvoicePreview
