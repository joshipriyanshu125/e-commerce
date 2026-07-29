import React, { useState, useEffect } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { Star, MessageSquare, Trash2, Eye, EyeOff, ShieldAlert } from 'lucide-react'
import api from '../../services/axiosInstance'

const AdminReviewsModerator = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Selected product and its reviews
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [deletingId, setDeletingId] = useState(null)

  const fetchProductsWithReviews = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('products?limit=100')
      if (res.data.success) {
        setProducts(res.data.products || [])
      }
    } catch (err) {
      console.error(err)
      setError('Failed to fetch products registry.')
    } finally {
      setLoading(false)
    }
  }

  const handleProductSelect = (product) => {
    setSelectedProduct(product)
    setReviews(product.reviews || [])
  }

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return
    try {
      setDeletingId(reviewId)
      const res = await api.delete(`products/${selectedProduct._id}/reviews/${reviewId}`)
      if (res.data.success) {
        // Remove from local reviews state
        setReviews(prev => prev.filter(r => r._id !== reviewId))
        // Update product in list as well
        setProducts(prev => prev.map(p => {
          if (p._id === selectedProduct._id) {
            const updatedReviews = p.reviews.filter(r => r._id !== reviewId)
            const sum = updatedReviews.reduce((acc, r) => acc + r.rating, 0)
            const newRating = updatedReviews.length > 0 ? (sum / updatedReviews.length) : 0
            return {
              ...p,
              reviews: updatedReviews,
              numReviews: updatedReviews.length,
              rating: parseFloat(newRating.toFixed(1))
            }
          }
          return p
        }))
      }
    } catch (err) {
      alert('Failed to delete review. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    fetchProductsWithReviews()
  }, [])

  return (
    <AdminLayout title="Reviews">
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-white">Review Moderation</h2>
          <p className="text-xs text-white/40 mt-1">Audit customer feedback and moderate product reviews</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Products List (Left side) */}
          <div className={`bg-[#13131a] border border-white/5 rounded-xl p-6 ${selectedProduct ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
            <h3 className="font-semibold text-white mb-6">Products Reviews Catalog</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-white/40 uppercase tracking-wider font-mono">
                    <th className="pb-3 font-semibold">Product Name</th>
                    <th className="pb-3 font-semibold">Average Rating</th>
                    <th className="pb-3 font-semibold">Total Reviews</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="py-6 text-center text-white/20 font-mono">Loading catalog...</td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-6 text-center text-white/20 font-mono">No products in catalog.</td>
                    </tr>
                  ) : (
                    products.map(p => (
                      <tr 
                        key={p._id} 
                        className={`hover:bg-white/[0.01] transition-colors cursor-pointer ${selectedProduct?._id === p._id ? 'bg-white/[0.02]' : ''}`}
                        onClick={() => handleProductSelect(p)}
                      >
                        <td className="py-3.5 flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-white/5 border border-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {p.images?.[0]?.url || p.images?.[0] ? (
                              <img src={p.images?.[0]?.url || p.images?.[0]} alt={p.name} className="h-full w-full object-cover" />
                            ) : (
                              <MessageSquare size={14} className="text-white/20" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-white/90 truncate max-w-[200px]">{p.name}</p>
                            <p className="text-[10px] text-white/40 font-mono mt-0.5">{p.brand || 'No Brand'}</p>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-white/90">{p.rating?.toFixed(1) || '0.0'}</span>
                            <div className="flex text-amber-500">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  size={10} 
                                  fill={i < Math.round(p.rating || 0) ? 'currentColor' : 'none'} 
                                  className="stroke-1"
                                />
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 font-mono text-white/60">{p.reviews?.length || 0} reviews</td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProductSelect(p);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 border border-white/5 text-white/70 hover:bg-white/10 transition-all font-mono"
                          >
                            <Eye size={12} /> Inspect
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Product Reviews Inspector (Right side) */}
          {selectedProduct && (
            <div className="lg:col-span-6 bg-[#13131a] border border-white/5 rounded-xl p-6 space-y-6 relative">
              <button 
                onClick={() => setSelectedProduct(null)} 
                className="absolute top-4 right-4 text-white/40 hover:text-white text-xs font-mono"
              >
                ✕ Close
              </button>

              <div>
                <h3 className="font-semibold text-white">Reviews Audit Panel</h3>
                <p className="text-xs text-white/40 mt-1 font-mono">Product: {selectedProduct.name}</p>
              </div>

              {/* Reviews Feed */}
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {reviews.length === 0 ? (
                  <div className="py-12 text-center text-white/20 text-xs italic">
                    No reviews found for this product.
                  </div>
                ) : (
                  reviews.map((review, idx) => (
                    <div key={review._id || idx} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <p className="font-semibold text-white/90 text-xs">{review.name}</p>
                          <p className="text-[10px] text-white/40 font-mono mt-0.5">
                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Date Unknown'}
                          </p>
                        </div>
                        <div className="flex text-amber-500">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={11} 
                              fill={i < review.rating ? 'currentColor' : 'none'} 
                              className="stroke-1"
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-white/70 leading-relaxed font-sans bg-black/10 p-3 rounded border border-white/[0.02]">
                        {review.comment}
                      </p>

                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => handleDeleteReview(review._id || review.id)}
                          disabled={deletingId === (review._id || review.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-500/5 border border-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all font-mono text-[9px] uppercase tracking-wider"
                        >
                          <Trash2 size={10} /> Delete Review
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminReviewsModerator
