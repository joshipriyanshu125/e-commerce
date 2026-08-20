import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Sparkles } from 'lucide-react'
import { getCategoryLink } from '../../utils/categories'

const MegaMenuPanel = ({ category, onClose }) => {
  const columns = []
  const regular = []
  const nested = []

  category.children?.forEach((child) => {
    if (child.children?.length) {
      nested.push(child)
    } else {
      regular.push(child)
    }
  })

  if (regular.length) columns.push({ type: 'links', items: regular })
  nested.forEach((group) => columns.push({ type: 'group', group }))

  return (
    <div className="absolute left-0 right-0 top-full bg-atelier-beige border-b border-atelier-lightgray shadow-xl animate-fade-in">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        <div className="flex items-start justify-between gap-8 mb-8">
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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-10">
          {columns.map((col, idx) =>
            col.type === 'links' ? (
              <div key={idx} className="space-y-3">
                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atelier-gray">
                  Explore
                </p>
                <ul className="space-y-2.5">
                  {col.items.map((item) => (
                    <li key={item.slug}>
                      <Link
                        to={getCategoryLink(item.slug, category.slug)}
                        onClick={onClose}
                        className="font-serif text-base text-atelier-dark hover:text-atelier-accent transition-colors"
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
                  className="font-mono text-[10px] tracking-[0.2em] uppercase text-atelier-gray hover:text-atelier-dark transition-colors block"
                >
                  {col.group.name}
                </Link>
                <ul className="space-y-2.5">
                  {col.group.children.map((item) => (
                    <li key={item.slug}>
                      <Link
                        to={getCategoryLink(item.slug, category.slug)}
                        onClick={onClose}
                        className="font-serif text-base text-atelier-dark hover:text-atelier-accent transition-colors"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}

          {category.image?.url && (
            <div className="hidden lg:block col-span-1">
              <div className="aspect-[3/4] overflow-hidden bg-atelier-cream">
                <img
                  src={category.image.url}
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const FeaturedPanel = ({ collections, onClose }) => (
  <div className="absolute left-0 right-0 top-full bg-atelier-beige border-b border-atelier-lightgray shadow-xl animate-fade-in">
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
      <div className="flex items-center gap-2 mb-8">
        <Sparkles size={16} className="text-atelier-accent" />
        <h3 className="font-serif text-2xl text-atelier-dark">Featured Collections</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {collections.map((col) => (
          <Link
            key={col.slug}
            to={getCategoryLink(col.slug)}
            onClick={onClose}
            className="group relative aspect-[4/5] overflow-hidden bg-atelier-cream"
          >
            {col.image?.url ? (
              <img
                src={col.image.url}
                alt={col.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-atelier-lightgray/60 to-atelier-cream" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="font-serif text-lg text-white">{col.name}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </div>
)

const CategoryMegaMenu = ({ menu, onClose }) => {
  const [activePanel, setActivePanel] = useState(null)
  const timeoutRef = useRef(null)

  const handleEnter = (key) => {
    clearTimeout(timeoutRef.current)
    setActivePanel(key)
  }

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setActivePanel(null), 150)
  }

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  const men = menu.main?.find((c) => c.slug === 'men') || {
    name: 'Men',
    slug: 'men',
    children: [
      { name: 'Apparel & Clothing', slug: 'men-clothing' },
      { name: 'Footwear & Shoes', slug: 'men-shoes' },
      { name: 'New Arrivals', slug: 'men-new-arrivals' },
    ]
  }
  const women = menu.main?.find((c) => c.slug === 'women') || {
    name: 'Women',
    slug: 'women',
    children: [
      { name: 'Apparel & Dresses', slug: 'women-clothing' },
      { name: 'Footwear & Shoes', slug: 'women-shoes' },
      { name: 'Handbags & Totes', slug: 'women-bags' },
    ]
  }
  const featured = menu.featured || []

  return (
    <div
      className="relative hidden md:block"
      onMouseLeave={handleLeave}
    >
      <nav className="flex items-center space-x-8 font-mono text-base tracking-[0.2em] uppercase">
        <Link to="/shop" className="text-atelier-gray hover:text-atelier-dark pb-0.5 transition-colors">
          Shop All
        </Link>

        <button
          type="button"
          onMouseEnter={() => handleEnter('men')}
          onClick={() => activePanel === 'men' ? setActivePanel(null) : handleEnter('men')}
          className={`pb-0.5 transition-colors ${
            activePanel === 'men'
              ? 'text-atelier-dark font-medium border-b border-atelier-dark'
              : 'text-atelier-gray hover:text-atelier-dark'
          }`}
        >
          Men
        </button>

        <button
          type="button"
          onMouseEnter={() => handleEnter('women')}
          onClick={() => activePanel === 'women' ? setActivePanel(null) : handleEnter('women')}
          className={`pb-0.5 transition-colors ${
            activePanel === 'women'
              ? 'text-atelier-dark font-medium border-b border-atelier-dark'
              : 'text-atelier-gray hover:text-atelier-dark'
          }`}
        >
          Women
        </button>

        {featured.length > 0 && (
          <button
            type="button"
            onMouseEnter={() => handleEnter('featured')}
            onClick={() => activePanel === 'featured' ? setActivePanel(null) : handleEnter('featured')}
            className={`pb-0.5 transition-colors ${
              activePanel === 'featured'
                ? 'text-atelier-dark font-medium border-b border-atelier-dark'
                : 'text-atelier-gray hover:text-atelier-dark'
            }`}
          >
            Collections
          </button>
        )}

        <Link
          to="/journal"
          className="text-atelier-gray hover:text-atelier-dark pb-0.5 transition-colors"
        >
          Journal
        </Link>
      </nav>

      {activePanel === 'men' && men && (
        <div onMouseEnter={() => handleEnter('men')}>
          <MegaMenuPanel category={men} onClose={onClose} />
        </div>
      )}
      {activePanel === 'women' && women && (
        <div onMouseEnter={() => handleEnter('women')}>
          <MegaMenuPanel category={women} onClose={onClose} />
        </div>
      )}
      {activePanel === 'featured' && featured.length > 0 && (
        <div onMouseEnter={() => handleEnter('featured')}>
          <FeaturedPanel collections={featured} onClose={onClose} />
        </div>
      )}
    </div>
  )
}

export default CategoryMegaMenu
