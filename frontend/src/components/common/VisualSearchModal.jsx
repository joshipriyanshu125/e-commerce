import React, { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Upload, X, Sparkles, RefreshCw, Eye, Tag, ArrowRight, Zap, CheckCircle2 } from 'lucide-react'
import api from '../../services/axiosInstance'

export default function VisualSearchModal({ onClose }) {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [imagePreview, setImagePreview] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)

  // ── Handle image file selection ──────────────────────────────────────────
  const handleFileChange = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPEG, PNG, WEBP).')
      return
    }
    setError(null)
    setSelectedFile(file)

    const reader = new FileReader()
    reader.onload = () => {
      setImagePreview(reader.result)
      performVisualSearch(file, reader.result)
    }
    reader.readAsDataURL(file)
  }

  // ── Perform visual search API call ─────────────────────────────────────────
  const performVisualSearch = async (fileObj, base64Str) => {
    setAnalyzing(true)
    setResults(null)
    setError(null)

    try {
      let res
      if (fileObj) {
        const formData = new FormData()
        formData.append('image', fileObj)
        res = await api.post('ai/visual-search', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        res = await api.post('ai/visual-search', { imageBase64: base64Str })
      }

      if (res.data?.success) {
        setResults(res.data)
      } else {
        setError(res.data?.message || 'Failed to analyze image.')
      }
    } catch (err) {
      console.error('Visual search error:', err)
      setError('Visual search encountered an error. Please try another photo.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  const resetSearch = () => {
    setImagePreview(null)
    setSelectedFile(null)
    setResults(null)
    setError(null)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn"
      onMouseDown={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 space-y-6 text-white"
        style={{
          background: 'linear-gradient(135deg, rgba(17,17,26,0.98), rgba(10,10,16,0.99))',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 40px rgba(245,158,11,0.08)',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-purple-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Camera size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold font-serif tracking-wide text-white">
                  Image-Based Fashion Search
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  AI VISION
                </span>
              </div>
              <p className="text-xs text-white/50 font-mono mt-0.5">
                Upload any outfit photo to find visually similar items in our catalog
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-2xl p-4 font-mono">
            ⚠️ {error}
          </div>
        )}

        {/* Upload Zone (when no image selected) */}
        {!imagePreview && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-4 group ${
              isDragOver
                ? 'border-amber-400 bg-amber-400/10 scale-[1.01]'
                : 'border-white/15 hover:border-amber-500/50 hover:bg-white/[0.02]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files[0])}
            />
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload size={28} className="text-amber-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-white">
                Drag & drop your outfit photo here
              </p>
              <p className="text-xs text-white/40 font-mono mt-1">
                Supports JPG, PNG, WEBP up to 5MB · Or click to browse files
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {['📷 Black Oversized Hoodie', '👟 White Sneakers', '🧥 Denim Jacket', '👖 Cargo Pants'].map((sample, i) => (
                <span key={i} className="text-[11px] font-mono px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60">
                  {sample}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Active Analysis / Preview State */}
        {imagePreview && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center gap-6 bg-white/[0.02] border border-white/10 p-5 rounded-3xl">
              {/* Image Preview Container with Scanning Laser Effect */}
              <div className="relative w-44 h-44 rounded-2xl overflow-hidden flex-shrink-0 border border-amber-500/30 bg-black">
                <img
                  src={imagePreview}
                  alt="Uploaded query"
                  className="w-full h-full object-cover"
                />
                {analyzing && (
                  <div className="absolute inset-0 bg-gradient-to-b from-amber-500/20 via-transparent to-purple-500/20 animate-pulse flex flex-col items-center justify-center">
                    <div className="w-full h-1 bg-amber-400 shadow-[0_0_15px_#f59e0b] animate-bounce" />
                    <span className="text-[10px] font-mono uppercase font-bold text-amber-300 mt-auto mb-2 bg-black/60 px-2 py-0.5 rounded">
                      Scanning Vision Vectors...
                    </span>
                  </div>
                )}
              </div>

              {/* Detected Traits */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-semibold">
                    <Zap size={14} />
                    <span>AI Computer Vision Analysis</span>
                  </div>
                  <button
                    onClick={resetSearch}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white/60 hover:text-white transition-all"
                  >
                    <RefreshCw size={12} /> Change Photo
                  </button>
                </div>

                {analyzing ? (
                  <div className="space-y-2 py-2">
                    <div className="h-4 bg-white/5 rounded animate-pulse w-2/3" />
                    <div className="h-4 bg-white/5 rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-white/5 rounded animate-pulse w-1/2" />
                  </div>
                ) : results?.detectedTraits ? (
                  <div className="space-y-2 text-xs">
                    <p className="text-white/80 font-serif text-sm">
                      “{results.detectedTraits.visualDescription || 'Fashion item detected'}”
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1 font-mono">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        Category: {results.detectedTraits.primaryCategory} ({results.detectedTraits.subCategory})
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        Colors: {(results.detectedTraits.dominantColors || []).join(', ')}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        Style: {results.detectedTraits.stylePattern}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Results Grid */}
            {analyzing ? (
              <div className="text-center py-10 space-y-3 font-mono text-xs text-white/40">
                <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Matching visual vector embeddings against product catalog...</p>
              </div>
            ) : results?.matches?.length ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between font-mono text-xs text-white/40 uppercase tracking-wider">
                  <span>Visually Similar Products ({results.totalMatches})</span>
                  <span>Sorted by Visual Match %</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.matches.map(({ product, matchPercentage, matchReasons }, idx) => (
                    <div
                      key={product._id || idx}
                      onClick={() => {
                        onClose()
                        navigate(`/product/${product._id}`)
                      }}
                      className="group relative bg-white/[0.03] border border-white/10 hover:border-amber-500/50 rounded-2xl p-3 flex gap-3.5 cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                    >
                      {/* Product Image */}
                      <div className="relative w-20 h-24 rounded-xl overflow-hidden bg-black flex-shrink-0">
                        <img
                          src={product.images?.[0]?.url || product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500 text-black shadow">
                          {matchPercentage}
                        </span>
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <p className="text-xs font-semibold text-white truncate group-hover:text-amber-300 transition-colors">
                            {product.name}
                          </p>
                          <p className="text-[10px] font-mono text-white/40 uppercase mt-0.5">
                            {product.brand || product.category}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-xs font-bold font-mono text-white">
                              ${product.discountPrice || product.price}
                            </span>
                            {product.discountPrice && (
                              <span className="text-[10px] line-through text-white/30 font-mono">
                                ${product.price}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[9px] font-mono text-emerald-400">
                          <CheckCircle2 size={10} />
                          <span className="truncate">{matchReasons[0]}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center py-10 font-mono text-xs text-white/30">
                No visual matches found. Try uploading another photo.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
