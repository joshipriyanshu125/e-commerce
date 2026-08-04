import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAPIProducts } from '../features/products/productSlice'
import ProductCard from '../components/product/ProductCard'
import api from '../services/axiosInstance'
import {
  ChevronRight, SlidersHorizontal, Loader2, FolderOpen, X, ChevronDown,
} from 'lucide-react'

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Recursively collect all slugs in a subtree */
const collectSlugs = (node) => {
  const slugs = [node.slug]
  node.children?.forEach((c) => slugs.push(...collectSlugs(c)))
  return slugs
}

/** Find a node anywhere in the tree by slug */
const findNode = (nodes, slug) => {
  for (const n of nodes) {
    if (n.slug === slug) return n
    const found = findNode(n.children || [], slug)
    if (found) return found
  }
  return null
}

/** Build breadcrumb path from root to a slug */
const buildBreadcrumb = (nodes, slug, path = []) => {
  for (const n of nodes) {
    const next = [...path, n]
    if (n.slug === slug) return next
    const found = buildBreadcrumb(n.children || [], slug, next)
    if (found) return found
  }
  return null
}

// ─── Sub-components ─────────────────────────────────────────────────────────

const SidebarCategory = ({ node, activeSlug, depth = 0 }) => {
  const [open, setOpen] = useState(depth < 2)
  const hasChildren = node.children?.length > 0
  const isActive = node.slug === activeSlug

  return (
    <div>
      <div
        className="flex items-center justify-between group"
        style={{ paddingLeft: `${depth * 14}px` }}
      >
        <Link
          to={`/shop/${node.slug}`}
          className={`flex-1 py-1.5 text-sm font-serif transition-colors ${
            isActive
              ? 'text-atelier-accent font-semibold'
              : 'text-atelier-dark hover:text-atelier-accent'
          }`}
        >
          {node.name}
        </Link>
        {hasChildren && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="p-1 text-atelier-gray hover:text-atelier-dark"
          >
            <ChevronDown
              size={12}
              className={`transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </button>
        )}
      </div>
      {hasChildren && open && (
        <div>
          {node.children.map((child) => (
            <SidebarCategory
              key={child.slug}
              node={child}
              activeSlug={activeSlug}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

const Shop = () => {
  const { slug } = useParams()            // e.g. "men", "men-t-shirts"
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const { allProducts, apiLoading } = useSelector((s) => s.products)

  // Category tree state
  const [tree, setTree] = useState([])
  const [treeLoading, setTreeLoading] = useState(true)

  // UI state
  const [sortOption, setSortOption] = useState('featured')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // ── Load category tree ────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        setTreeLoading(true)
        const res = await api.get('categories/menu')
        if (res.data.success) {
          const { main = [], featured = [] } = res.data.menu
          setTree([...main, ...featured])
        }
      } catch {
        setTree([])
      } finally {
        setTreeLoading(false)
      }
    }
    load()
  }, [])

  // ── Load products ────────────────────────────────────────────────
  useEffect(() => {
    if (allProducts.length === 0) dispatch(fetchAPIProducts())
  }, [dispatch, allProducts.length])

  // ── Derived values ────────────────────────────────────────────────
  const activeNode = slug ? findNode(tree, slug) : null
  const breadcrumb = slug ? buildBreadcrumb(tree, slug) : []

  // All slugs under the active category (itself + all descendants)
  const activeSlugSet = activeNode ? new Set(collectSlugs(activeNode)) : null

  // Filter products: match by category slug case-insensitively
  let displayProducts = allProducts.filter((p) => {
    if (!activeSlugSet) return true  // "All" – show everything
    const productCat = (p.category || '').toLowerCase()
    const lowerSlugSet = new Set(Array.from(activeSlugSet).map(s => s.toLowerCase()))
    return lowerSlugSet.has(productCat)
  })

  // Sort
  if (sortOption === 'price-low-high') displayProducts = [...displayProducts].sort((a, b) => a.price - b.price)
  else if (sortOption === 'price-high-low') displayProducts = [...displayProducts].sort((a, b) => b.price - a.price)
  else if (sortOption === 'rating') displayProducts = [...displayProducts].sort((a, b) => b.rating - a.rating)

  // Page title
  const pageTitle = activeNode?.name || 'All Products'

  // ─── Sidebar tree (main nav groups only) ─────────────────────────
  const mainCategories = tree.filter((c) => c.navGroup === 'main')
  const featuredCategories = tree.filter((c) => c.navGroup === 'featured')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">

      {/* ── Breadcrumb ─────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 font-mono text-xs tracking-widest uppercase text-atelier-gray mb-6">
        <Link to="/" className="hover:text-atelier-dark transition-colors">Home</Link>
        <ChevronRight size={10} />
        <Link to="/shop" className="hover:text-atelier-dark transition-colors">Shop</Link>
        {breadcrumb?.map((crumb, i) => (
          <React.Fragment key={crumb.slug}>
            <ChevronRight size={10} />
            {i === breadcrumb.length - 1 ? (
              <span className="text-atelier-dark font-semibold">{crumb.name}</span>
            ) : (
              <Link to={`/shop/${crumb.slug}`} className="hover:text-atelier-dark transition-colors">
                {crumb.name}
              </Link>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="border-b border-atelier-lightgray/60 pb-6 mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-atelier-gray block mb-1">
            {activeNode?.navGroup === 'featured' ? 'Collection' : 'Category'}
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-atelier-dark font-semibold">
            {pageTitle}
          </h1>
          {activeNode?.description && (
            <p className="text-sm text-atelier-gray mt-1 font-light max-w-lg">{activeNode.description}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile sidebar toggle */}
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="flex items-center gap-1.5 lg:hidden font-mono text-xs tracking-widest uppercase text-atelier-dark border border-atelier-lightgray px-3 py-2"
          >
            <SlidersHorizontal size={12} /> Browse
          </button>

          {/* Sort */}
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-atelier-gray">
            <SlidersHorizontal size={12} className="hidden sm:block" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-transparent border border-atelier-lightgray px-3 py-2 text-atelier-dark focus:outline-none focus:border-atelier-dark font-medium text-xs"
            >
              <option value="featured">Featured</option>
              <option value="price-low-high">Price: Low to High</option>
              <option value="price-high-low">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
        <aside className="hidden lg:block lg:col-span-3 space-y-6">
          {treeLoading ? (
            <div className="flex items-center gap-2 text-atelier-gray text-sm">
              <Loader2 size={14} className="animate-spin" /> Loading…
            </div>
          ) : (
            <>
              {/* All Products */}
              <div>
                <Link
                  to="/shop"
                  className={`block py-1.5 text-sm font-serif transition-colors ${
                    !slug ? 'text-atelier-accent font-semibold' : 'text-atelier-dark hover:text-atelier-accent'
                  }`}
                >
                  All Products
                </Link>
              </div>

              {mainCategories.length > 0 && (
                <div>
                  <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atelier-gray border-b border-atelier-lightgray/40 pb-2 mb-3">
                    Shop
                  </p>
                  {mainCategories.map((cat) => (
                    <SidebarCategory key={cat.slug} node={cat} activeSlug={slug} depth={0} />
                  ))}
                </div>
              )}

              {featuredCategories.length > 0 && (
                <div>
                  <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atelier-gray border-b border-atelier-lightgray/40 pb-2 mb-3">
                    Collections
                  </p>
                  {featuredCategories.map((cat) => (
                    <SidebarCategory key={cat.slug} node={cat} activeSlug={slug} depth={0} />
                  ))}
                </div>
              )}
            </>
          )}
        </aside>

        {/* ── Mobile Sidebar Drawer ───────────────────────────────────── */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <aside className="absolute left-0 top-0 bottom-0 w-72 bg-atelier-beige border-r border-atelier-lightgray overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl text-atelier-dark">Browse</h2>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="text-atelier-gray hover:text-atelier-dark"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-6">
                <Link
                  to="/shop"
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`block py-1.5 text-sm font-serif ${!slug ? 'text-atelier-accent font-semibold' : 'text-atelier-dark'}`}
                >
                  All Products
                </Link>

                {mainCategories.length > 0 && (
                  <div>
                    <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atelier-gray border-b border-atelier-lightgray/40 pb-2 mb-3">Shop</p>
                    {mainCategories.map((cat) => (
                      <SidebarCategory key={cat.slug} node={cat} activeSlug={slug} depth={0} />
                    ))}
                  </div>
                )}

                {featuredCategories.length > 0 && (
                  <div>
                    <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atelier-gray border-b border-atelier-lightgray/40 pb-2 mb-3">Collections</p>
                    {featuredCategories.map((cat) => (
                      <SidebarCategory key={cat.slug} node={cat} activeSlug={slug} depth={0} />
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}

        {/* ── Product Grid ─────────────────────────────────────────────── */}
        <div className="lg:col-span-9">

          {/* Subcategory quick-nav pills (when browsing a parent like "men") */}
          {activeNode?.children?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              <Link
                to={`/shop/${activeNode.slug}`}
                className="font-mono text-[10px] tracking-[0.2em] uppercase px-4 py-2 border transition-all border-atelier-dark bg-atelier-dark text-white"
              >
                All {activeNode.name}
              </Link>
              {activeNode.children.map((child) => (
                <Link
                  key={child.slug}
                  to={`/shop/${child.slug}`}
                  className="font-mono text-[10px] tracking-[0.2em] uppercase px-4 py-2 border border-atelier-lightgray text-atelier-gray hover:border-atelier-dark hover:text-atelier-dark transition-all"
                >
                  {child.name}
                </Link>
              ))}
            </div>
          )}

          {/* If there's no parent slug, show the main gender/collection groups as entry cards */}
          {!slug && !treeLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12">
              {tree.filter((c) => !c.parent).map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/shop/${cat.slug}`}
                  className="group relative aspect-[4/3] overflow-hidden bg-atelier-cream border border-atelier-lightgray/40 hover:border-atelier-dark transition-all"
                >
                  {cat.image?.url ? (
                    <img
                      src={cat.image.url}
                      alt={cat.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-atelier-beige to-atelier-cream flex items-center justify-center">
                      <FolderOpen size={32} className="text-atelier-lightgray" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="font-serif text-xl text-white">{cat.name}</p>
                    {cat.children?.length > 0 && (
                      <p className="font-mono text-[10px] tracking-wider uppercase text-white/70 mt-0.5">
                        {cat.children.length} subcategories
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Products */}
          {(apiLoading) ? (
            <div className="py-20 flex items-center justify-center gap-3 text-atelier-gray">
              <Loader2 size={20} className="animate-spin" />
              <span className="font-serif italic">Loading products…</span>
            </div>
          ) : displayProducts.length > 0 ? (
            <>
              <p className="font-mono text-xs tracking-[0.2em] uppercase text-atelier-gray mb-6">
                {displayProducts.length} {displayProducts.length === 1 ? 'item' : 'items'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-12 gap-x-6">
                {displayProducts.map((product) => (
                  <ProductCard key={product._id || product.id} product={product} />
                ))}
              </div>
            </>
          ) : (
            <div className="py-20 text-center space-y-4">
              <FolderOpen size={40} className="mx-auto text-atelier-lightgray" />
              <p className="font-serif text-xl text-atelier-gray italic">
                {slug ? `No products in "${pageTitle}" yet.` : 'No products found.'}
              </p>
              <p className="font-mono text-xs tracking-widest uppercase text-atelier-gray/60">
                Check back soon or explore other categories
              </p>
              <Link
                to="/shop"
                className="inline-block mt-4 font-mono text-xs tracking-widest uppercase text-atelier-dark border-b border-atelier-dark pb-0.5 hover:opacity-70 transition-opacity"
              >
                Browse all categories →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Shop
