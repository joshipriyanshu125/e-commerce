import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, Sparkles } from 'lucide-react'
import { getCategoryLink, defaultMenGroups, defaultWomenGroups } from '../../utils/categories'
import { COLLECTION_IMAGES, IMAGES } from '../../utils/images'

const MegaMenuPanel = ({ category, onClose }) => {
  const isMen = category.slug === 'men'
  const isWomen = category.slug === 'women'

  // Resolve subcategory columns (fallback to default groups if backend tree returned empty children)
  const effectiveChildren =
    category.children && category.children.length > 0
      ? category.children
      : isMen
      ? defaultMenGroups
      : isWomen
      ? defaultWomenGroups
      : []

  const columns = []
  const regular = []
  const nested = []

  effectiveChildren.forEach((child) => {
    if (child.children?.length) {
      nested.push(child)
    } else {
      regular.push(child)
    }
  })

  if (regular.length) columns.push({ type: 'links', items: regular })
  nested.forEach((group) => columns.push({ type: 'group', group }))

  // Showcase product photo for Men or Women
  const showcaseImage =
    category.image?.url ||
    COLLECTION_IMAGES[category.slug] ||
    (isMen ? COLLECTION_IMAGES.men : isWomen ? COLLECTION_IMAGES.women : IMAGES.fallback)

  return (
    <div className="absolute left-0 right-0 top-full bg-atelier-beige border-b border-atelier-lightgray shadow-xl animate-fade-in">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        <div className="flex items-start justify-between gap-8 mb-8 border-b border-atelier-lightgray/50 pb-4">
          <div>
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-atelier-gray">
              Shop {category.name}
            </span>
            <h3 className="font-serif text-3xl text-atelier-dark mt-1">{category.name}</h3>
          </div>
          <Link
            to={getCategoryLink(category.slug)}
            onClick={onClose}
            className="font-mono text-xs tracking-[0.2em] uppercase text-atelier-dark border-b border-atelier-dark pb-0.5 hover:opacity-70 transition-opacity flex items-center gap-1.5"
          >
            View all <ChevronRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-10 items-start">
          {columns.map((col, idx) =>
            col.type === 'links' ? (
              <div key={idx} className="space-y-3">
                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atelier-gray font-semibold">
                  Explore
                </p>
                <ul className="space-y-2.5">
                  {col.items.map((item) => (
                    <li key={item.slug}>
                      <Link
                        to={getCategoryLink(item.slug, category.slug)}
                        onClick={onClose}
                        className="font-serif text-base text-atelier-dark hover:text-atelier-accent transition-colors block"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div key={col.group.slug} className="space-y-3">
                <Link
                  to={getCategoryLink(col.group.slug, category.slug)}
                  onClick={onClose}
                  className="font-mono text-[10px] tracking-[0.2em] uppercase text-atelier-gray hover:text-atelier-dark transition-colors block font-semibold"
                >
                  {col.group.name}
                </Link>
                <ul className="space-y-2.5">
                  {col.group.children.map((item) => (
                    <li key={item.slug}>
                      <Link
                        to={getCategoryLink(item.slug, category.slug)}
                        onClick={onClose}
                        className="font-serif text-base text-atelier-dark hover:text-atelier-accent transition-colors block"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}

          {showcaseImage && (
            <div className="hidden lg:block col-span-1">
              <Link
                to={getCategoryLink(category.slug)}
                onClick={onClose}
                className="group block relative aspect-[3/4] overflow-hidden rounded bg-atelier-cream shadow-sm hover:shadow-md transition-all"
              >
                <img
                  src={showcaseImage}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = IMAGES.fallback
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-4">
                  <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-white/80 block">
                    Featured Collection
                  </span>
                  <p className="font-serif text-lg text-white font-medium mt-0.5">
                    Shop {category.name}
                  </p>
                  <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-white/90 group-hover:text-white transition-colors mt-1 inline-flex items-center gap-1">
                    Explore &rarr;
                  </span>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const FeaturedPanel = ({ collections, onClose }) => {
  // Fallback list of 5 featured collections if none returned
  const defaultCollections = [
    { name: 'Best Sellers', slug: 'best-sellers' },
    { name: 'Streetwear', slug: 'streetwear' },
    { name: 'Co-ord Sets', slug: 'co-ord-sets' },
    { name: 'Summer Collection', slug: 'summer-collection' },
    { name: 'Winter Collection', slug: 'winter-collection' },
  ]

  const items = collections && collections.length > 0 ? collections : defaultCollections

  return (
    <div className="absolute left-0 right-0 top-full bg-atelier-beige border-b border-atelier-lightgray shadow-xl animate-fade-in">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        <div className="flex items-center gap-2 mb-8 border-b border-atelier-lightgray/50 pb-4">
          <Sparkles size={16} className="text-atelier-accent" />
          <h3 className="font-serif text-2xl text-atelier-dark">Featured Collections</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {items.map((col) => {
            const imgUrl =
              col.image?.url || COLLECTION_IMAGES[col.slug] || IMAGES.fallback
            return (
              <Link
                key={col.slug}
                to={getCategoryLink(col.slug)}
                onClick={onClose}
                className="group relative aspect-[4/5] overflow-hidden rounded bg-atelier-cream shadow-sm hover:shadow-md transition-shadow"
              >
                <img
                  src={imgUrl}
                  alt={col.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = IMAGES.fallback
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/80 block">
                    Collection
                  </span>
                  <p className="font-serif text-lg text-white font-medium mt-0.5">{col.name}</p>
                  <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-white/90 group-hover:text-white transition-colors mt-1 inline-flex items-center gap-1">
                    Explore &rarr;
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const CategoryMegaMenu = ({ menu, onClose }) => {
  const [activePanel, setActivePanel] = useState(null)
  const timeoutRef = useRef(null)
  const navigate = useNavigate()

  const handleEnter = (key) => {
    clearTimeout(timeoutRef.current)
    setActivePanel(key)
  }

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setActivePanel(null), 180)
  }

  const handlePanelClose = () => {
    setActivePanel(null)
    if (onClose) onClose()
  }

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  const men = menu.main?.find((c) => c.slug === 'men') || {
    name: 'Men',
    slug: 'men',
    image: { url: COLLECTION_IMAGES.men },
    children: defaultMenGroups,
  }

  const women = menu.main?.find((c) => c.slug === 'women') || {
    name: 'Women',
    slug: 'women',
    image: { url: COLLECTION_IMAGES.women },
    children: defaultWomenGroups,
  }

  const featured = menu.featured && menu.featured.length > 0
    ? menu.featured
    : [
        { name: 'Best Sellers', slug: 'best-sellers', image: { url: COLLECTION_IMAGES['best-sellers'] } },
        { name: 'Streetwear', slug: 'streetwear', image: { url: COLLECTION_IMAGES['streetwear'] } },
        { name: 'Co-ord Sets', slug: 'co-ord-sets', image: { url: COLLECTION_IMAGES['co-ord-sets'] } },
        { name: 'Summer Collection', slug: 'summer-collection', image: { url: COLLECTION_IMAGES['summer-collection'] } },
        { name: 'Winter Collection', slug: 'winter-collection', image: { url: COLLECTION_IMAGES['winter-collection'] } },
      ]

  return (
    <div className="relative hidden md:block" onMouseLeave={handleLeave}>
      <nav className="flex items-center space-x-8 font-mono text-base tracking-[0.2em] uppercase">
        <Link
          to="/shop"
          onClick={handlePanelClose}
          className="text-atelier-gray hover:text-atelier-dark pb-0.5 transition-colors"
        >
          Shop All
        </Link>

        {/* Men Nav Link + MegaMenu Trigger */}
        <div
          className="relative inline-block"
          onMouseEnter={() => handleEnter('men')}
        >
          <Link
            to="/shop/men"
            onClick={handlePanelClose}
            className={`pb-0.5 transition-colors cursor-pointer ${
              activePanel === 'men'
                ? 'text-atelier-dark font-medium border-b border-atelier-dark'
                : 'text-atelier-gray hover:text-atelier-dark'
            }`}
          >
            Men
          </Link>
        </div>

        {/* Women Nav Link + MegaMenu Trigger */}
        <div
          className="relative inline-block"
          onMouseEnter={() => handleEnter('women')}
        >
          <Link
            to="/shop/women"
            onClick={handlePanelClose}
            className={`pb-0.5 transition-colors cursor-pointer ${
              activePanel === 'women'
                ? 'text-atelier-dark font-medium border-b border-atelier-dark'
                : 'text-atelier-gray hover:text-atelier-dark'
            }`}
          >
            Women
          </Link>
        </div>

        {/* Collections Dropdown Trigger */}
        <div
          className="relative inline-block"
          onMouseEnter={() => handleEnter('featured')}
        >
          <button
            type="button"
            onClick={() =>
              activePanel === 'featured' ? setActivePanel(null) : handleEnter('featured')
            }
            className={`pb-0.5 transition-colors cursor-pointer ${
              activePanel === 'featured'
                ? 'text-atelier-dark font-medium border-b border-atelier-dark'
                : 'text-atelier-gray hover:text-atelier-dark'
            }`}
          >
            Collections
          </button>
        </div>

        <Link
          to="/journal"
          onClick={handlePanelClose}
          className="text-atelier-gray hover:text-atelier-dark pb-0.5 transition-colors"
        >
          Journal
        </Link>
      </nav>

      {/* Active Panels */}
      {activePanel === 'men' && men && (
        <div onMouseEnter={() => handleEnter('men')}>
          <MegaMenuPanel category={men} onClose={handlePanelClose} />
        </div>
      )}
      {activePanel === 'women' && women && (
        <div onMouseEnter={() => handleEnter('women')}>
          <MegaMenuPanel category={women} onClose={handlePanelClose} />
        </div>
      )}
      {activePanel === 'featured' && (
        <div onMouseEnter={() => handleEnter('featured')}>
          <FeaturedPanel collections={featured} onClose={handlePanelClose} />
        </div>
      )}
    </div>
  )
}

export default CategoryMegaMenu
