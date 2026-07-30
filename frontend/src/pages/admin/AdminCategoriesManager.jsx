import React, { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import api from '../../services/axiosInstance'
import {
  fetchCategoriesAdmin,
  invalidateCategoryMenuCache,
  flattenTreeForSelect,
} from '../../utils/categories'
import {
  FolderTree, Plus, GripVertical, ChevronRight, ChevronDown,
  Pencil, Trash2, Eye, EyeOff, Upload, Sparkles, Loader2, X,
} from 'lucide-react'

const emptyForm = {
  name: '',
  description: '',
  parent: '',
  navGroup: 'main',
  sortOrder: 0,
  isActive: true,
  showInMegaMenu: true,
  metaTitle: '',
  metaDescription: '',
  metaKeywords: '',
}

const CategoryTreeRow = ({
  node,
  depth,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onToggleActive,
  onDragStart,
  onDragOver,
  onDrop,
  dragOverId,
}) => {
  const hasChildren = node.children?.length > 0
  const isDragTarget = dragOverId === node._id

  return (
    <>
      <div
        draggable
        onDragStart={(e) => onDragStart(e, node)}
        onDragOver={(e) => onDragOver(e, node)}
        onDrop={(e) => onDrop(e, node)}
        className={`flex items-center gap-2 py-2.5 px-3 rounded-lg border transition-all group ${
          isDragTarget
            ? 'border-amber-500/50 bg-amber-500/5'
            : 'border-transparent hover:bg-white/[0.03]'
        }`}
        style={{ paddingLeft: `${depth * 20 + 12}px` }}
      >
        <GripVertical size={14} className="text-white/20 cursor-grab active:cursor-grabbing flex-shrink-0" />

        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(node._id)}
            className="text-white/40 hover:text-white p-0.5"
          >
            {expanded[node._id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="w-5" />
        )}

        {node.image?.url ? (
          <img src={node.image.url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center flex-shrink-0">
            <FolderTree size={12} className="text-white/30" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{node.name}</p>
          <p className="text-[10px] font-mono text-white/30 truncate">/{node.slug}</p>
        </div>

        <span className={`hidden sm:inline text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${
          node.navGroup === 'featured'
            ? 'bg-purple-500/10 text-purple-400'
            : 'bg-blue-500/10 text-blue-400'
        }`}>
          {node.navGroup}
        </span>

        <button
          type="button"
          onClick={() => onToggleActive(node)}
          className={`p-1.5 rounded transition-colors ${
            node.isActive ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-white/30 hover:bg-white/5'
          }`}
          title={node.isActive ? 'Disable' : 'Enable'}
        >
          {node.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>

        <button
          type="button"
          onClick={() => onEdit(node)}
          className="p-1.5 rounded text-white/40 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
        >
          <Pencil size={14} />
        </button>

        <button
          type="button"
          onClick={() => onDelete(node)}
          className="p-1.5 rounded text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {hasChildren && expanded[node._id] && node.children.map((child) => (
        <CategoryTreeRow
          key={child._id}
          node={child}
          depth={depth + 1}
          expanded={expanded}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleActive={onToggleActive}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDrop={onDrop}
          dragOverId={dragOverId}
        />
      ))}
    </>
  )
}

const AdminCategoriesManager = () => {
  const [tree, setTree] = useState([])
  const [flat, setFlat] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [seeding, setSeeding] = useState(false)
  const [dragItem, setDragItem] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchCategoriesAdmin()
      setTree(data.tree)
      setFlat(data.flat.length ? data.flat : flattenTreeForSelect(data.tree))
      const autoExpand = {}
      data.tree.forEach((n) => { autoExpand[n._id] = true })
      setExpanded((prev) => ({ ...autoExpand, ...prev }))
    } catch {
      setError('Failed to load categories.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const openCreate = (parentId = '') => {
    setEditing(null)
    setForm({ ...emptyForm, parent: parentId })
    setImageFile(null)
    setImagePreview('')
    setFormError(null)
    setShowForm(true)
  }

  const openEdit = (node) => {
    setEditing(node)
    setForm({
      name: node.name,
      description: node.description || '',
      parent: node.parent || '',
      navGroup: node.navGroup || 'main',
      sortOrder: node.sortOrder || 0,
      isActive: node.isActive,
      showInMegaMenu: node.showInMegaMenu,
      metaTitle: node.seo?.metaTitle || '',
      metaDescription: node.seo?.metaDescription || '',
      metaKeywords: node.seo?.metaKeywords || '',
    })
    setImageFile(null)
    setImagePreview(node.image?.url || '')
    setFormError(null)
    setShowForm(true)
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)

    if (!form.name.trim()) {
      setFormError('Category name is required.')
      return
    }

    try {
      setSaving(true)
      const formData = new FormData()
      formData.append('name', form.name.trim())
      formData.append('description', form.description)
      formData.append('parent', form.parent || '')
      formData.append('navGroup', form.navGroup)
      formData.append('sortOrder', form.sortOrder)
      formData.append('isActive', form.isActive)
      formData.append('showInMegaMenu', form.showInMegaMenu)
      formData.append('seo', JSON.stringify({
        metaTitle: form.metaTitle,
        metaDescription: form.metaDescription,
        metaKeywords: form.metaKeywords,
      }))

      if (imageFile) formData.append('image', imageFile)

      const res = editing
        ? await api.put(`categories/${editing._id}`, formData)
        : await api.post('categories', formData)

      if (res.data.success) {
        invalidateCategoryMenuCache()
        setShowForm(false)
        await loadCategories()
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save category.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (node) => {
    if (!window.confirm(`Delete "${node.name}"? Subcategories must be removed first.`)) return
    try {
      const res = await api.delete(`categories/${node._id}`)
      if (res.data.success) {
        invalidateCategoryMenuCache()
        await loadCategories()
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete category.')
    }
  }

  const handleToggleActive = async (node) => {
    try {
      const formData = new FormData()
      formData.append('isActive', !node.isActive)
      await api.put(`categories/${node._id}`, formData)
      invalidateCategoryMenuCache()
      await loadCategories()
    } catch {
      alert('Failed to update category status.')
    }
  }

  const handleSeed = async () => {
    const force = tree.length > 0
    const msg = force
      ? 'This will replace all existing categories with the Gen Z fashion structure. Continue?'
      : 'Seed the default Men, Women & Featured Collections structure?'

    if (!window.confirm(msg)) return

    try {
      setSeeding(true)
      const res = await api.post('categories/seed', { force })
      if (res.data.success) {
        invalidateCategoryMenuCache()
        await loadCategories()
        alert(res.data.message)
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Seed failed.')
    } finally {
      setSeeding(false)
    }
  }

  const handleToggle = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleDragStart = (e, node) => {
    setDragItem(node)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, node) => {
    e.preventDefault()
    if (dragItem?._id !== node._id) setDragOverId(node._id)
  }

  const handleDrop = async (e, target) => {
    e.preventDefault()
    setDragOverId(null)

    if (!dragItem || dragItem._id === target._id) return

    const siblings = flat.filter((c) => (c.parent || null) === (target.parent || null))
    const sorted = [...siblings].sort((a, b) => a.sortOrder - b.sortOrder)
    const without = sorted.filter((c) => c._id !== dragItem._id)
    const targetIdx = without.findIndex((c) => c._id === target._id)
    without.splice(targetIdx, 0, { ...dragItem, parent: target.parent || null })

    const items = without.map((c, i) => ({
      id: c._id,
      sortOrder: i,
      parent: target.parent || null,
    }))

    try {
      await api.patch('categories/reorder', { items })
      invalidateCategoryMenuCache()
      await loadCategories()
    } catch {
      alert('Failed to reorder categories.')
    }

    setDragItem(null)
  }

  const parentOptions = flat.filter((c) => !editing || c._id !== editing._id)

  return (
    <AdminLayout title="Categories">
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Category Management</h2>
            <p className="text-xs text-white/40 mt-1">
              Gen Z fashion navigation — nested categories, mega menu, SEO & ordering
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 rounded-lg text-xs font-mono uppercase tracking-wider transition-all"
            >
              {seeding ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {tree.length ? 'Re-seed' : 'Seed defaults'}
            </button>
            <button
              type="button"
              onClick={() => openCreate()}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg text-xs uppercase tracking-wider transition-all"
            >
              <Plus size={14} /> Add Category
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          <div className="xl:col-span-7 bg-[#13131a] border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-white">Category Tree</h3>
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider">
                Drag to reorder
              </p>
            </div>

            {loading ? (
              <p className="text-center text-white/20 font-mono py-10">Loading categories...</p>
            ) : tree.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <FolderTree size={32} className="mx-auto text-white/20" />
                <p className="text-white/30 font-mono text-sm">No categories yet.</p>
                <button
                  type="button"
                  onClick={handleSeed}
                  className="text-amber-400 text-xs font-mono uppercase tracking-wider hover:underline"
                >
                  Seed Gen Z fashion structure →
                </button>
              </div>
            ) : (
              <div className="space-y-0.5">
                {tree.map((node) => (
                  <CategoryTreeRow
                    key={node._id}
                    node={node}
                    depth={0}
                    expanded={expanded}
                    onToggle={handleToggle}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    dragOverId={dragOverId}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="xl:col-span-5 space-y-6">
            <div className="bg-[#13131a] border border-white/5 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-white">Quick Guide</h3>
              <ul className="space-y-3 text-xs text-white/50 font-mono">
                <li className="flex gap-2"><span className="text-amber-400">01</span> Seed defaults to load Men, Women & Featured Collections</li>
                <li className="flex gap-2"><span className="text-amber-400">02</span> Drag rows to reorder within the same level</li>
                <li className="flex gap-2"><span className="text-amber-400">03</span> Toggle eye icon to show/hide in storefront</li>
                <li className="flex gap-2"><span className="text-amber-400">04</span> Add subcategories anytime — unlimited nesting</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-xl p-6">
              <p className="text-xs font-mono uppercase tracking-widest text-amber-400 mb-2">Live Preview</p>
              <p className="text-sm text-white/70">
                Categories sync to the storefront mega menu automatically. Men & Women appear as hover panels; Featured Collections appear under Collections.
              </p>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-[#13131a] border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <h3 className="font-semibold text-white">
                  {editing ? 'Edit Category' : 'New Category'}
                </h3>
                <button type="button" onClick={() => setShowForm(false)} className="text-white/40 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {formError && (
                  <p className="bg-red-500/15 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-mono">
                    {formError}
                  </p>
                )}

                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-widest mb-1.5">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-[#0f0f14] border border-white/10 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500/50"
                    placeholder="e.g. Oversized T-Shirts"
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-widest mb-1.5">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="w-full bg-[#0f0f14] border border-white/10 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500/50 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-white/40 uppercase tracking-widest mb-1.5">Parent</label>
                    <select
                      value={form.parent}
                      onChange={(e) => setForm({ ...form, parent: e.target.value })}
                      className="w-full bg-[#0f0f14] border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-amber-500/50"
                    >
                      <option value="">None (top level)</option>
                      {parentOptions.map((c) => (
                        <option key={c._id} value={c._id}>{c.label || c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 uppercase tracking-widest mb-1.5">Group</label>
                    <select
                      value={form.navGroup}
                      onChange={(e) => setForm({ ...form, navGroup: e.target.value })}
                      className="w-full bg-[#0f0f14] border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-amber-500/50"
                    >
                      <option value="main">Main (Men/Women)</option>
                      <option value="featured">Featured Collection</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-widest mb-1.5">Category Image</label>
                  <div className="flex items-center gap-4">
                    {imagePreview && (
                      <img src={imagePreview} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    )}
                    <label className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-white/60 hover:text-white cursor-pointer transition-colors">
                      <Upload size={14} /> Upload
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4 space-y-3">
                  <p className="text-xs font-mono uppercase tracking-widest text-white/40">SEO</p>
                  <input
                    value={form.metaTitle}
                    onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                    placeholder="Meta title"
                    className="w-full bg-[#0f0f14] border border-white/10 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500/50"
                  />
                  <textarea
                    value={form.metaDescription}
                    onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                    placeholder="Meta description"
                    rows={2}
                    className="w-full bg-[#0f0f14] border border-white/10 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500/50 resize-none"
                  />
                  <input
                    value={form.metaKeywords}
                    onChange={(e) => setForm({ ...form, metaKeywords: e.target.value })}
                    placeholder="Keywords (comma separated)"
                    className="w-full bg-[#0f0f14] border border-white/10 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="rounded border-white/20"
                    />
                    Active
                  </label>
                  <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.showInMegaMenu}
                      onChange={(e) => setForm({ ...form, showInMegaMenu: e.target.checked })}
                      className="rounded border-white/20"
                    />
                    Show in mega menu
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 border border-white/10 text-white/60 rounded-lg text-xs font-mono uppercase tracking-wider hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    {editing ? 'Save Changes' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminCategoriesManager
