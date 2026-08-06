import React, { useState, useEffect } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { FileText, Eye, Download, RefreshCw, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/axiosInstance'

const AdminInvoiceHistory = () => {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  

  // Pagination & Search
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('invoice/history', {
        params: {
          page,
          limit: 10
        }
      })
      if (res.data && res.data.success) {
        setInvoices(res.data.invoices || [])
        setPages(res.data.pages || 1)
        setTotal(res.data.total || 0)
      }
    } catch (err) {
      console.error(err)
      setError('Failed to fetch invoice history from backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [page])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchInvoices()
  }

  // Filter invoices locally based on search if desired
  const filteredInvoices = invoices.filter(inv => {
    if (!search.trim()) return true
    const s = search.toLowerCase()
    const matchNo = (inv.invoiceNumber || '').toLowerCase().includes(s)
    const matchOrderId = (inv.order?._id || inv.order || '').toString().toLowerCase().includes(s)
    const matchUser = (inv.user?.email || '').toLowerCase().includes(s) || (inv.user?.name || '').toLowerCase().includes(s)
    return matchNo || matchOrderId || matchUser
  })

  const handleDownload = async (invoice) => {
    try {
      setActionLoading(invoice._id)
      const downloadUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/invoice/download?id=${encodeURIComponent(invoice._id)}`
      
      const response = await api.get(`invoice/download?id=${encodeURIComponent(invoice._id)}`, {
        responseType: 'blob'
      })
      
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
      console.error(err)
      alert('Failed to download invoice PDF.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRegenerate = async (invoiceId) => {
    try {
      setActionLoading(invoiceId)
      const res = await api.post(`invoice/${invoiceId}/regenerate`)
      if (res.data && res.data.success) {
        alert('Invoice PDF regenerated successfully.')
        fetchInvoices()
      }
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Failed to regenerate invoice.')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <AdminLayout title="Invoices">
      <div className="min-h-screen bg-[#0a0a0a] text-white p-6 space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-5">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 tracking-tight">
              <FileText className="text-violet-500" /> Invoice Logs
            </h1>
            <p className="text-xs text-white/40 mt-1">Audit automatically generated invoices, view online pages, and trigger regeneration</p>
          </div>
        </div>

        {/* Filter Bar */}
        <form onSubmit={handleSearchSubmit} className="bg-white/3 border border-white/5 p-4 rounded-2xl flex gap-3 items-center max-w-xl">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search Invoice No, Order ID, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-white/15"
            />
          </div>
          <button
            type="button"
            onClick={fetchInvoices}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </form>

        {/* History Table */}
        <div className="bg-white/3 border border-white/5 rounded-2xl overflow-hidden">
          {loading && invoices.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-3 text-white/40">
              <RefreshCw size={24} className="animate-spin" />
              <span className="text-xs font-mono">Loading invoices...</span>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-20 text-center text-white/30 text-xs font-mono">
              No invoice records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-mono uppercase tracking-widest text-white/30">
                    <th className="p-4">Invoice No</th>
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Customer Details</th>
                    <th className="p-4 text-right">Value</th>
                    <th className="p-4 text-center">Date</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono font-bold text-white/80">
                        {inv.invoiceNumber}
                      </td>
                      <td className="p-4 font-mono text-white/50">
                        #{inv.order?._id ? inv.order._id.slice(-8).toUpperCase() : (inv.order || '').toString().slice(-8).toUpperCase()}
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-white/90">{inv.user?.name || 'Customer'}</p>
                        <p className="text-[10px] text-white/40 font-mono">{inv.user?.email || 'N/A'}</p>
                      </td>
                      <td className="p-4 text-right font-mono font-semibold text-white/90">
                        ${inv.totalAmount ? inv.totalAmount.toFixed(2) : '0.00'}
                      </td>
                      <td className="p-4 text-center text-white/50 font-mono">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* View Online */}
                          <button
                            onClick={() => navigate(`/invoice/${inv.order?._id || inv.order}`)}
                            title="View Online"
                            className="p-2 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-lg transition-all"
                          >
                            <Eye size={13} />
                          </button>
                          
                          {/* Download PDF */}
                          <button
                            onClick={() => handleDownload(inv)}
                            disabled={actionLoading === inv._id}
                            title="Download PDF"
                            className="p-2 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-lg transition-all disabled:opacity-50"
                          >
                            <Download size={13} />
                          </button>

                          {/* Regenerate */}
                          <button
                            onClick={() => handleRegenerate(inv._id)}
                            disabled={actionLoading === inv._id}
                            title="Regenerate Invoice PDF"
                            className="p-2 bg-white/5 hover:bg-white/10 text-violet-400 hover:text-violet-300 rounded-lg transition-all disabled:opacity-50"
                          >
                            <RefreshCw size={13} className={actionLoading === inv._id ? 'animate-spin' : ''} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-between items-center bg-white/3 border border-white/5 p-4 rounded-2xl">
            <span className="text-xs text-white/40 font-mono">
              Page {page} of {pages} ({total} invoices)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                className="p-2 border border-white/8 hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-all"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                disabled={page === pages}
                onClick={() => setPage(prev => Math.min(prev + 1, pages))}
                className="p-2 border border-white/8 hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-all"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminInvoiceHistory
