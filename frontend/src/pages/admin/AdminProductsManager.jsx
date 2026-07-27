import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import api from '../../services/axiosInstance'
import { Plus, Pencil, Trash2, Search, ImageOff, ChevronLeft, ChevronRight } from 'lucide-react'

const STATUS_COLORS = {
  Active: 'bg-emerald-500/15 text-emerald-400',
  Draft: 'bg-yellow-500/15 text-yellow-400',
  OutOfStock: 'bg-red-500/15 text-red-400',
}

const AdminProductsManager = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [deletingId, setDeletingId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const fetchProducts = async (kw = '', pg = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (kw) params.set('keyword', kw)
      params.set('page', pg)
      params.set('limit', 10)
      const res = await api.get(`products?${params.toString()}`)
      setProducts(res.data.products || [])
      setPages(res.data.pages || 1)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProducts(search, page) }, [page])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchProducts(search, 1)
  }

  const handleDelete = async (id) => {
    try {
      setDeletingId(id)
      await api.delete(`products/${id}`)
      setProducts(prev => prev.filter(p => (p._id || p.id) !== id))
      setConfirmDeleteId(null)
    } catch (err) {
      alert('Failed to delete product')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AdminLayout title="Product Management">
      <div className="p-6 lg:p-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-semibold text-white">Products</h2>
            <p className="text-sm text-white/40 mt-0.5">Manage your product catalog</p>
          </div>
          <button
            onClick={() => navigate('/admin/products/new')}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Add Product
          </button>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-[#1a1a24] border border-white/10 text-white text-sm rounded-lg pl-9 pr-4 py-2.5 placeholder-white/25 focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-sm text-white rounded-lg transition-colors">
            Search
          </button>
        </form>

        {/* Table */}
        <div className="bg-[#13131a] rounded-xl border border-white/5 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-white/30 text-sm">Loading products…</div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center text-white/30 text-sm">No products found.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-white/40 text-left text-xs uppercase tracking-widest">
                      <th className="px-5 py-4">Product</th>
                      <th className="px-5 py-4">Category</th>
                      <th className="px-5 py-4">Price</th>
                      <th className="px-5 py-4">Stock</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {products.map(product => {
                      const id = product._id || product.id
                      const img = product.images?.[0]?.url
                      return (
                        <tr key={id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {img
                                  ? <img src={img} alt={product.name} className="w-full h-full object-cover" />
                                  : <ImageOff size={16} className="text-white/20" />
                                }
                              </div>
                              <div>
                                <p className="font-medium text-white leading-snug">{product.name}</p>
                                <p className="text-white/30 text-xs mt-0.5">{product.brand || '—'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-white/50">{product.category || '—'}</td>
                          <td className="px-5 py-4">
                            <div>
                              {product.discountPrice
                                ? <>
                                    <span className="text-white font-medium">${product.discountPrice}</span>
                                    <span className="text-white/30 line-through text-xs ml-2">${product.price}</span>
                                  </>
                                : <span className="text-white font-medium">${product.price}</span>
                              }
                            </div>
                          </td>
                          <td className="px-5 py-4 text-white/60">{product.countInStock}</td>
                          <td className="px-5 py-4">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[product.status] || STATUS_COLORS.Active}`}>
                              {product.status || 'Active'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => navigate(`/admin/products/${id}`)}
                                className="p-2 rounded-lg text-white/40 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                                title="Edit"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(id)}
                                className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                title="Delete"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-white/5">
                  <p className="text-xs text-white/30">Page {page} of {pages}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(pages, p + 1))}
                      disabled={page === pages}
                      className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1a1a24] border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-400" />
            </div>
            <h3 className="text-white font-semibold text-center mb-1">Delete Product?</h3>
            <p className="text-white/40 text-sm text-center mb-6">This action cannot be undone. Images will be permanently removed from Cloudinary.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 rounded-lg border border-white/10 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={!!deletingId}
                className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-400 text-sm text-white font-medium transition-all disabled:opacity-60"
              >
                {deletingId ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminProductsManager
