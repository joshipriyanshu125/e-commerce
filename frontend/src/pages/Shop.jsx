import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { SlidersHorizontal, X, ChevronRight, RotateCcw } from 'lucide-react'
import api from '../services/axiosInstance'
import ProductCard from '../components/product/ProductCard'

const initial = {
  category: [],
  brand: [],
  gender: [],
  size: [],
  color: [],
  rating: '',
  discount: false,
  availability: false,
  minPrice: '',
  maxPrice: '',
}

const title = (s) =>
  String(s || '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

// Client-side section guard: only checks category slug prefix, matching the
// backend's strict sectionCondition.  The backend is the primary filter; this
// just prevents stale or miscategorised products from leaking through.
const belongsToSection = (product, section) => {
  const cat = String(product.category || '').toLowerCase()
  const gender = String(product.gender || '').toLowerCase()
  if (section === 'women') return cat.startsWith('women') || gender === 'women'
  if (section === 'men') return cat.startsWith('men') || gender === 'men'
  return true
}

// Keep the page route as the source of truth.  This is deliberately also
// applied after the API response: it prevents an older in-flight request (or
// stale cached response) from ever showing products from another submenu.
const belongsToCategory = (product, categorySlug) => {
  if (!categorySlug || categorySlug === 'men' || categorySlug === 'women') return true

  const normalize = (value) => String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .replace(/(^|-)(topwear|bottom-wear|bottomwear|footwear|collections)(?=-|$)/g, '$1')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')

  const category = normalize(product.category)
  const target = normalize(categorySlug)
  return category === target ||
    category.startsWith(`${target}-`) ||
    target.endsWith(`-${category}`) ||
    category.endsWith(`-${target}`)
}

function FilterPanel({ filters, setFilters, options, clear, isWomenSection, isMenSection }) {
  const toggle = (key, value) =>
    setFilters((f) => ({
      ...f,
      [key]: f[key]?.includes(value) ? f[key].filter((v) => v !== value) : [...(f[key] || []), value],
    }))

  const group = (key, label, filteredOptions) => {
    const list = filteredOptions || options[key] || []
    if (!list.length) return null

    return (
      <div className="border-t border-atelier-lightgray/50 pt-4">
        <p className="font-mono text-xs uppercase tracking-widest mb-2 text-atelier-gray font-semibold">
          {label}
        </p>
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
          {list.map((value) => (
            <label
              key={value}
              className="flex items-center py-1 text-sm text-atelier-dark hover:text-black cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={filters[key]?.includes(value)}
                onChange={() => toggle(key, value)}
                className="mr-2 accent-atelier-dark"
              />
              <span className="truncate">{title(value)}</span>
            </label>
          ))}
        </div>
      </div>
    )
  }

  // Filter category list based on section — strict prefix matching
  const categoryOptions = useMemo(() => {
    const raw = options.category || []
    if (isWomenSection) {
      return raw.filter((c) => String(c).toLowerCase().startsWith('women'))
    }
    if (isMenSection) {
      return raw.filter((c) => String(c).toLowerCase().startsWith('men'))
    }
    return raw
  }, [options.category, isWomenSection, isMenSection])

  return (
    <div className="space-y-5 bg-atelier-cream/40 p-5 rounded-xl border border-atelier-lightgray/40">
      <div className="flex justify-between items-center pb-2">
        <b className="font-serif text-lg text-atelier-dark">Filters</b>
        <button
          onClick={clear}
          className="font-mono text-xs uppercase tracking-wider text-atelier-gray hover:text-atelier-dark underline flex items-center gap-1 transition-colors"
        >
          <RotateCcw size={11} /> Clear all
        </button>
      </div>

      {/* Price Range */}
      <div className="border-t border-atelier-lightgray/50 pt-4">
        <p className="font-mono text-xs uppercase tracking-widest mb-2 text-atelier-gray font-semibold">
          Price range
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            value={filters.minPrice}
            onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))}
            placeholder="Min ($)"
            className="w-1/2 border border-atelier-lightgray/80 rounded px-2.5 py-1.5 text-sm bg-white/80 focus:outline-none focus:border-atelier-dark"
          />
          <span className="text-atelier-gray text-xs">—</span>
          <input
            type="number"
            min="0"
            value={filters.maxPrice}
            onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
            placeholder="Max ($)"
            className="w-1/2 border border-atelier-lightgray/80 rounded px-2.5 py-1.5 text-sm bg-white/80 focus:outline-none focus:border-atelier-dark"
          />
        </div>
      </div>

      {/* Categories */}
      {group('category', 'Category', categoryOptions)}

      {/* Brand */}
      {group('brand', 'Brand')}

      {/* Gender (only show if not already strictly inside men or women section) */}
      {!isWomenSection && !isMenSection && group('gender', 'Gender')}

      {/* Size */}
      {group('size', 'Size')}

      {/* Color */}
      {group('color', 'Color')}

      {/* Rating */}
      <div className="border-t border-atelier-lightgray/50 pt-4">
        <p className="font-mono text-xs uppercase tracking-widest mb-2 text-atelier-gray font-semibold">
          Customer Rating
        </p>
        <div className="space-y-1">
          {[4, 3, 2].map((n) => (
            <label
              key={n}
              className="flex items-center py-1 text-sm text-atelier-dark hover:text-black cursor-pointer"
            >
              <input
                type="radio"
                name="rating"
                checked={filters.rating === String(n)}
                onChange={() =>
                  setFilters((f) => ({
                    ...f,
                    rating: f.rating === String(n) ? '' : String(n),
                  }))
                }
                className="mr-2 accent-atelier-dark"
              />
              <span>{n}★ & above</span>
            </label>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="border-t border-atelier-lightgray/50 pt-4 space-y-2">
        <label className="flex items-center text-sm text-atelier-dark hover:text-black cursor-pointer">
          <input
            type="checkbox"
            checked={filters.discount}
            onChange={(e) => setFilters((f) => ({ ...f, discount: e.target.checked }))}
            className="mr-2 accent-atelier-dark"
          />
          <span>On sale</span>
        </label>
        <label className="flex items-center text-sm text-atelier-dark hover:text-black cursor-pointer">
          <input
            type="checkbox"
            checked={filters.availability}
            onChange={(e) => setFilters((f) => ({ ...f, availability: e.target.checked }))}
            className="mr-2 accent-atelier-dark"
          />
          <span>In stock only</span>
        </label>
      </div>
    </div>
  )
}

export default function Shop() {
  const { slug } = useParams()
  const [params] = useSearchParams()
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(initial)
  const [sort, setSort] = useState('newest')
  const [mobile, setMobile] = useState(false)
  const [page, setPage] = useState(1)

  const query = params.get('q') || ''

  // Section determinations based on slug
  const normalizedSlug = (slug || '').toLowerCase()
  const isWomenSection = normalizedSlug === 'women' || normalizedSlug.startsWith('women-')
  const isMenSection = normalizedSlug === 'men' || normalizedSlug.startsWith('men-')

  // Reset filters and page whenever the route slug changes
  useEffect(() => {
    setFilters(initial)
    setPage(1)
  }, [slug])

  // Compute available filter options dynamically from current product list
  const options = useMemo(
    () => ({
      category: [...new Set(products.map((p) => p.category).filter(Boolean))],
      brand: [...new Set(products.map((p) => p.brand).filter(Boolean))],
      gender: [...new Set(products.map((p) => p.gender).filter(Boolean))],
      size: [...new Set(products.flatMap((p) => p.sizes || []))],
      color: [...new Set(products.flatMap((p) => p.colors || []))],
    }),
    [products]
  )

  // Fetch products with section isolation
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const sp = new URLSearchParams({ page, limit: 24, sort })
        if (query) sp.set('q', query)

        // Apply strict section isolation for Men or Women
        if (normalizedSlug === 'women') {
          sp.set('gender', 'women')
        } else if (normalizedSlug === 'men') {
          sp.set('gender', 'men')
        } else if (normalizedSlug) {
          // Specific category / subcategory slug
          sp.set('category', normalizedSlug)
          if (isWomenSection) sp.set('gender', 'women')
          else if (isMenSection) sp.set('gender', 'men')
        }

        // Apply user-selected filters
        Object.entries(filters).forEach(([k, v]) => {
          // A submenu route must never be overwritten by a category filter
          // left over from the previously viewed shop page.
          if (k === 'category' && normalizedSlug) return

          if (Array.isArray(v) && v.length) {
            sp.set(k, v.join(','))
          } else if (v && k !== 'discount' && k !== 'availability') {
            sp.set(k, v)
          } else if (v && k === 'discount') {
            sp.set(k, 'true')
          } else if (v && k === 'availability') {
            sp.set(k, 'in-stock')
          }
        })

        const { data } = await api.get(`products?${sp}`)
        const section = isWomenSection ? 'women' : isMenSection ? 'men' : null
        const visibleProducts = (data.products || []).filter((product) =>
          (!section || belongsToSection(product, section)) &&
          belongsToCategory(product, normalizedSlug)
        )

        if (cancelled) return
        setProducts(visibleProducts)
        setTotal(section || normalizedSlug ? visibleProducts.length : (data.totalProducts || 0))
      } catch (err) {
        if (cancelled) return
        console.error('Failed to load shop products:', err)
        setProducts([])
        setTotal(0)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [slug, normalizedSlug, isWomenSection, isMenSection, query, filters, sort, page])

  const clear = () => {
    setFilters(initial)
    setPage(1)
  }

  const chips = Object.entries(filters).flatMap(([k, v]) =>
    Array.isArray(v) ? v.map((x) => [k, x]) : v ? [[k, v]] : []
  )

  // Format dynamic section title
  const sectionTitle = useMemo(() => {
    if (query) return `Search: “${query}”`
    if (normalizedSlug === 'women') return "Women's Collection"
    if (normalizedSlug === 'men') return "Men's Collection"
    if (normalizedSlug) return title(normalizedSlug)
    return 'All Products'
  }, [query, normalizedSlug])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-atelier-gray mb-4">
        <Link to="/" className="hover:text-atelier-dark transition-colors">Home</Link>
        <ChevronRight size={12} />
        <Link to="/shop" className="hover:text-atelier-dark transition-colors">Shop</Link>
        {normalizedSlug && (
          <>
            <ChevronRight size={12} />
            {isWomenSection && normalizedSlug !== 'women' && (
              <>
                <Link to="/shop/women" className="hover:text-atelier-dark transition-colors">Women</Link>
                <ChevronRight size={12} />
              </>
            )}
            {isMenSection && normalizedSlug !== 'men' && (
              <>
                <Link to="/shop/men" className="hover:text-atelier-dark transition-colors">Men</Link>
                <ChevronRight size={12} />
              </>
            )}
            <span className="text-atelier-dark font-medium">{title(normalizedSlug)}</span>
          </>
        )}
      </nav>

      {/* Header bar */}
      <div className="flex flex-wrap justify-between items-end gap-4 border-b border-atelier-lightgray/60 pb-6 mb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-atelier-gray mb-1">
            Catalogue
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl text-atelier-dark font-normal">
            {sectionTitle}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobile(true)}
            className="lg:hidden flex items-center gap-2 border border-atelier-lightgray bg-white/60 px-3.5 py-2 text-xs font-mono uppercase tracking-wider text-atelier-dark rounded hover:bg-atelier-lightgray/30 transition-colors"
          >
            <SlidersHorizontal size={14} /> Filters
          </button>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline font-mono text-xs uppercase text-atelier-gray tracking-wider">
              Sort:
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border border-atelier-lightgray/80 rounded px-3 py-2 text-xs font-mono uppercase tracking-wider bg-transparent text-atelier-dark focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="lowToHigh">Price: Low to High</option>
              <option value="highToLow">Price: High to Low</option>
              <option value="popularity">Popularity</option>
              <option value="bestSelling">Best Selling</option>
              <option value="highestRated">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-atelier-cream/50 rounded-lg border border-atelier-lightgray/30">
          <span className="text-xs font-mono uppercase tracking-wider text-atelier-gray mr-1">
            Active Filters:
          </span>
          {chips.map(([k, v]) => (
            <button
              key={`${k}-${v}`}
              onClick={() =>
                Array.isArray(filters[k])
                  ? setFilters((f) => ({ ...f, [k]: f[k].filter((x) => x !== v) }))
                  : setFilters((f) => ({
                      ...f,
                      [k]: k === 'discount' || k === 'availability' ? false : '',
                    }))
              }
              className="inline-flex items-center gap-1.5 bg-white border border-atelier-lightgray/80 px-2.5 py-1 rounded text-xs font-mono text-atelier-dark hover:border-red-400 hover:text-red-500 transition-colors"
            >
              <span>{title(String(v))}</span>
              <X size={12} />
            </button>
          ))}
          <button
            onClick={clear}
            className="text-xs font-mono uppercase tracking-wider text-atelier-gray hover:text-atelier-dark underline ml-2"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Main Grid layout */}
      <div className="grid lg:grid-cols-4 gap-8 items-start">
        {/* Left Filter Sidebar */}
        <aside className="hidden lg:block sticky top-24">
          <FilterPanel
            filters={filters}
            setFilters={setFilters}
            options={options}
            clear={clear}
            isWomenSection={isWomenSection}
            isMenSection={isMenSection}
          />
        </aside>

        {/* Product Cards */}
        <main className="lg:col-span-3">
          <div className="flex justify-between items-center mb-6">
            <p className="text-xs font-mono uppercase tracking-widest text-atelier-gray">
              {loading ? 'Searching catalogue…' : `${total} products found`}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-atelier-lightgray/30 rounded-lg" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
              {products.map((p) => (
                <ProductCard
                  key={p._id}
                  product={{
                    ...p,
                    id: p._id,
                    price: p.discountPrice || p.price,
                    originalPrice: p.discountPrice ? p.price : null,
                    images: (p.images || []).map((i) => i.url || i),
                    colors: (p.colors || []).map((name) => ({ name, hex: '#888' })),
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border border-dashed border-atelier-lightgray/60 rounded-xl p-8">
              <p className="font-serif text-2xl text-atelier-dark mb-2">No products found</p>
              <p className="text-sm text-atelier-gray mb-6 max-w-md mx-auto">
                We couldn't find any products matching your selected criteria in this section.
              </p>
              <button onClick={clear} className="btn-atelier-outline px-6 py-2 text-xs font-mono uppercase">
                Reset filters
              </button>
            </div>
          )}

          {/* Pagination / Load more */}
          {!loading && products.length === 24 && (
            <div className="mt-12 text-center">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="btn-atelier-outline px-8 py-3 text-xs font-mono uppercase tracking-widest"
              >
                Load more products
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filters Drawer */}
      {mobile && (
        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden backdrop-blur-sm animate-fade-in">
          <aside className="absolute bottom-0 inset-x-0 max-h-[85vh] overflow-y-auto bg-atelier-beige p-6 rounded-t-2xl shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-atelier-lightgray/40">
              <h2 className="font-serif text-xl text-atelier-dark">Filters</h2>
              <button
                onClick={() => setMobile(false)}
                className="p-1.5 text-atelier-dark hover:opacity-75"
                aria-label="Close filters"
              >
                <X size={20} />
              </button>
            </div>
            <FilterPanel
              filters={filters}
              setFilters={setFilters}
              options={options}
              clear={clear}
              isWomenSection={isWomenSection}
              isMenSection={isMenSection}
            />
            <button
              onClick={() => setMobile(false)}
              className="btn-atelier-dark w-full py-3 mt-4 text-xs font-mono uppercase tracking-widest"
            >
              View {total} results
            </button>
          </aside>
        </div>
      )}
    </div>
  )
}
