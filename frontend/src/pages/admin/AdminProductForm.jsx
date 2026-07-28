import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import api from '../../services/axiosInstance'
import { ArrowLeft, Upload, X, Plus, Loader2, ImageOff } from 'lucide-react'

const CATEGORIES = ['Shoes', 'Clothing', 'Accessories', 'Bags', 'Hats', 'Jewelry', 'Sports', 'Electronics', 'Other']
const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active', desc: 'Visible to customers' },
  { value: 'Draft', label: 'Draft', desc: 'Hidden from store' },
  { value: 'OutOfStock', label: 'Out of Stock', desc: 'Visible but not purchasable' },
]

const initialForm = {
  name: '', description: '', price: '', discountPrice: '',
  countInStock: '', category: '', brand: '',
  status: 'Active', tags: [], sizes: [], colors: [],
}

const AdminProductForm = () => {
  const { id } = useParams()
  const isEdit = !!id && id !== 'new'
  const navigate = useNavigate()

  const [form, setForm] = useState(initialForm)
  const [images, setImages] = useState([])          // { file, preview } for new uploads
  const [existingImages, setExistingImages] = useState([]) // { public_id, url } from DB
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [error, setError] = useState('')

  // Tag / size / color input helpers
  const [tagInput, setTagInput] = useState('')
  const [sizeInput, setSizeInput] = useState('')
  const [colorInput, setColorInput] = useState('')

  const fileInputRef = useRef()

  // Fetch existing product for edit
  useEffect(() => {
    if (!isEdit) return
    const load = async () => {
      try {
        setFetching(true)
        const res = await api.get(`products/${id}`)
        const p = res.data.product
        setForm({
          name: p.name || '',
          description: p.description || '',
          price: p.price || '',
          discountPrice: p.discountPrice || '',
          countInStock: p.countInStock ?? '',
          category: p.category || '',
          brand: p.brand || '',
          status: p.status || 'Active',
          tags: p.tags || [],
          sizes: p.sizes || [],
          colors: p.colors || [],
        })
        setExistingImages(p.images || [])
      } catch (err) {
        setError('Failed to load product.')
      } finally {
        setFetching(false)
      }
    }
    load()
  }, [id, isEdit])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    const newImages = files.map(file => ({ file, preview: URL.createObjectURL(file) }))
    setImages(prev => [...prev, ...newImages])
    e.target.value = ''
  }

  const removeNewImage = (idx) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[idx].preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  const removeExistingImage = (idx) => {
    setExistingImages(prev => prev.filter((_, i) => i !== idx))
  }

  // Tag helpers
  const addTag = () => {
    const v = tagInput.trim()
    if (v && !form.tags.includes(v)) setForm(prev => ({ ...prev, tags: [...prev.tags, v] }))
    setTagInput('')
  }
  const removeTag = (t) => setForm(prev => ({ ...prev, tags: prev.tags.filter(x => x !== t) }))

  // Size helpers
  const addSize = () => {
    const v = sizeInput.trim()
    if (v && !form.sizes.includes(v)) setForm(prev => ({ ...prev, sizes: [...prev.sizes, v] }))
    setSizeInput('')
  }
  const removeSize = (s) => setForm(prev => ({ ...prev, sizes: prev.sizes.filter(x => x !== s) }))

  // Color helpers
  const addColor = () => {
    const v = colorInput.trim()
    if (v && !form.colors.includes(v)) setForm(prev => ({ ...prev, colors: [...prev.colors, v] }))
    setColorInput('')
  }
  const removeColor = (c) => setForm(prev => ({ ...prev, colors: prev.colors.filter(x => x !== c) }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.name || !form.description || !form.price || form.countInStock === '') {
      setError('Name, description, price, and stock are required.')
      return
    }

    if (!isEdit && images.length === 0) {
      setError('Please upload at least one image.')
      return
    }

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('description', form.description)
      formData.append('price', form.price)
      formData.append('discountPrice', form.discountPrice)
      formData.append('countInStock', form.countInStock)
      formData.append('category', form.category)
      formData.append('brand', form.brand)
      formData.append('status', form.status)
      formData.append('tags', JSON.stringify(form.tags))
      formData.append('sizes', JSON.stringify(form.sizes))
      formData.append('colors', JSON.stringify(form.colors))
      images.forEach(img => formData.append('images', img.file))

      if (isEdit) {
        await api.put(`products/${id}`, formData)
      } else {
        await api.post('products', formData)
      }

      navigate('/admin/products')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <AdminLayout title={isEdit ? 'Edit Product' : 'Add Product'}>
        <div className="flex items-center justify-center h-64 text-white/30 text-sm">Loading product…</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title={isEdit ? 'Edit Product' : 'Add New Product'}>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/admin/products')}
            className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-xl font-semibold text-white">{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
            <p className="text-sm text-white/40 mt-0.5">{isEdit ? `Editing: ${form.name}` : 'Fill in the details below'}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT COLUMN — Main Info */}
          <div className="lg:col-span-2 space-y-5">

            {/* Basic Info Card */}
            <div className="bg-[#13131a] rounded-xl border border-white/5 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest">Basic Information</h3>

              <div>
                <label className="block text-xs text-white/40 uppercase tracking-widest mb-1.5">Product Name *</label>
                <input
                  name="name" value={form.name} onChange={handleChange}
                  placeholder="e.g. Nike Air Max 90"
                  className="w-full bg-[#0f0f14] border border-white/10 text-white text-sm rounded-lg px-4 py-2.5 placeholder-white/20 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs text-white/40 uppercase tracking-widest mb-1.5">Description *</label>
                <textarea
                  name="description" value={form.description} onChange={handleChange}
                  rows={4} placeholder="Describe the product…"
                  className="w-full bg-[#0f0f14] border border-white/10 text-white text-sm rounded-lg px-4 py-2.5 placeholder-white/20 focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>
            </div>

            {/* Pricing Card */}
            <div className="bg-[#13131a] rounded-xl border border-white/5 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest">Pricing</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-widest mb-1.5">Price ($) *</label>
                  <input
                    name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange}
                    placeholder="120.00"
                    className="w-full bg-[#0f0f14] border border-white/10 text-white text-sm rounded-lg px-4 py-2.5 placeholder-white/20 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-widest mb-1.5">Discount Price ($)</label>
                  <input
                    name="discountPrice" type="number" min="0" step="0.01" value={form.discountPrice} onChange={handleChange}
                    placeholder="96.00 (optional)"
                    className="w-full bg-[#0f0f14] border border-white/10 text-white text-sm rounded-lg px-4 py-2.5 placeholder-white/20 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>
              {form.price && form.discountPrice && Number(form.discountPrice) < Number(form.price) && (
                <p className="text-xs text-amber-400">
                  Discount: {Math.round((1 - form.discountPrice / form.price) * 100)}% off
                </p>
              )}
            </div>

            {/* Variants Card */}
            <div className="bg-[#13131a] rounded-xl border border-white/5 p-5 space-y-5">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest">Variants</h3>

              {/* Sizes */}
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">Sizes</label>
                <div className="flex gap-2 mb-3">
                  <input
                    value={sizeInput} onChange={e => setSizeInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSize() } }}
                    placeholder='e.g. "S" or "7"'
                    className="flex-1 bg-[#0f0f14] border border-white/10 text-white text-sm rounded-lg px-4 py-2 placeholder-white/20 focus:outline-none focus:border-amber-500/50"
                  />
                  <button type="button" onClick={addSize} className="px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-white/60 hover:text-white transition-all">
                    <Plus size={15} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.sizes.map(s => (
                    <span key={s} className="flex items-center gap-1 text-xs bg-white/10 text-white px-3 py-1.5 rounded-full">
                      {s}
                      <button type="button" onClick={() => removeSize(s)} className="text-white/40 hover:text-white ml-1">
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">Colors</label>
                <div className="flex gap-2 mb-3">
                  <input
                    value={colorInput} onChange={e => setColorInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addColor() } }}
                    placeholder='e.g. "Black" or "Navy Blue"'
                    className="flex-1 bg-[#0f0f14] border border-white/10 text-white text-sm rounded-lg px-4 py-2 placeholder-white/20 focus:outline-none focus:border-amber-500/50"
                  />
                  <button type="button" onClick={addColor} className="px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-white/60 hover:text-white transition-all">
                    <Plus size={15} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.colors.map(c => (
                    <span key={c} className="flex items-center gap-1 text-xs bg-white/10 text-white px-3 py-1.5 rounded-full">
                      {c}
                      <button type="button" onClick={() => removeColor(c)} className="text-white/40 hover:text-white ml-1">
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">Tags</label>
                <div className="flex gap-2 mb-3">
                  <input
                    value={tagInput} onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                    placeholder='e.g. "running" or "summer"'
                    className="flex-1 bg-[#0f0f14] border border-white/10 text-white text-sm rounded-lg px-4 py-2 placeholder-white/20 focus:outline-none focus:border-amber-500/50"
                  />
                  <button type="button" onClick={addTag} className="px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-white/60 hover:text-white transition-all">
                    <Plus size={15} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.tags.map(t => (
                    <span key={t} className="flex items-center gap-1 text-xs bg-amber-500/15 text-amber-400 px-3 py-1.5 rounded-full">
                      #{t}
                      <button type="button" onClick={() => removeTag(t)} className="text-amber-400/60 hover:text-amber-300 ml-1">
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Images Card */}
            <div className="bg-[#13131a] rounded-xl border border-white/5 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest">Product Images</h3>

              {/* Existing images (edit mode) */}
              {existingImages.length > 0 && (
                <div>
                  <p className="text-xs text-white/30 mb-2">Current images</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {existingImages.map((img, idx) => (
                      <div key={img.public_id} className="relative group aspect-square rounded-lg overflow-hidden bg-white/5">
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button" onClick={() => removeExistingImage(idx)}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <X size={18} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New images preview */}
              {images.length > 0 && (
                <div>
                  <p className="text-xs text-white/30 mb-2">New images to upload</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden bg-white/5">
                        <img src={img.preview} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button" onClick={() => removeNewImage(idx)}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <X size={18} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload zone */}
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="w-full border-2 border-dashed border-white/10 hover:border-amber-500/40 rounded-xl py-8 flex flex-col items-center gap-2 text-white/30 hover:text-white/50 transition-all"
              >
                <Upload size={22} />
                <span className="text-sm">Click to upload images</span>
                <span className="text-xs">PNG, JPG, WEBP up to 5 files</span>
              </button>
              <input
                ref={fileInputRef} type="file" multiple accept="image/*"
                onChange={handleImageChange} className="hidden"
              />
            </div>
          </div>

          {/* RIGHT COLUMN — Meta */}
          <div className="space-y-5">

            {/* Status */}
            <div className="bg-[#13131a] rounded-xl border border-white/5 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest">Status</h3>
              {STATUS_OPTIONS.map(opt => (
                <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-all ${form.status === opt.value ? 'border-amber-500/40 bg-amber-500/5' : 'border-transparent hover:bg-white/5'}`}>
                  <input
                    type="radio" name="status" value={opt.value}
                    checked={form.status === opt.value}
                    onChange={handleChange}
                    className="mt-0.5 accent-amber-500"
                  />
                  <div>
                    <p className="text-sm text-white font-medium">{opt.label}</p>
                    <p className="text-xs text-white/30">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Organization */}
            <div className="bg-[#13131a] rounded-xl border border-white/5 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest">Organization</h3>

              <div>
                <label className="block text-xs text-white/40 uppercase tracking-widest mb-1.5">Category</label>
                <select
                  name="category" value={form.category} onChange={handleChange}
                  className="w-full bg-[#0f0f14] border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-amber-500/50"
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs text-white/40 uppercase tracking-widest mb-1.5">Brand</label>
                <input
                  name="brand" value={form.brand} onChange={handleChange}
                  placeholder="e.g. Nike"
                  className="w-full bg-[#0f0f14] border border-white/10 text-white text-sm rounded-lg px-4 py-2.5 placeholder-white/20 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs text-white/40 uppercase tracking-widest mb-1.5">Stock Quantity *</label>
                <input
                  name="countInStock" type="number" min="0" value={form.countInStock} onChange={handleChange}
                  placeholder="100"
                  className="w-full bg-[#0f0f14] border border-white/10 text-white text-sm rounded-lg px-4 py-2.5 placeholder-white/20 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Saving…' : isEdit ? 'Update Product' : 'Create Product'}
            </button>

            <button
              type="button" onClick={() => navigate('/admin/products')}
              className="w-full py-3 rounded-xl border border-white/10 text-sm text-white/40 hover:text-white hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}

export default AdminProductForm
