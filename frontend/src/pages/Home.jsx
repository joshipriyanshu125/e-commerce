import React, { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { setType, setCategory, setSortOption, fetchAPIProducts } from '../features/products/productSlice'
import ProductCard from '../components/product/ProductCard'
import { ArrowRight, SlidersHorizontal } from 'lucide-react'
import { IMAGES } from '../utils/images'
import PromotionStrip from '../components/common/PromotionStrip'

const Home = () => {
  const [searchParams] = useSearchParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  
  const typeParam = searchParams.get('type') // 'fashion'
  
  const { filteredProducts, allProducts = [], apiLoading, selectedType, selectedCategory, sortOption } = useSelector(state => state.products)

  // Fetch real products from backend on mount
  useEffect(() => {
    dispatch(fetchAPIProducts())
  }, [])

  // Synchronize URL parameters with Redux state
  useEffect(() => {
    if (typeParam) {
      dispatch(setType(typeParam))
    } else {
      dispatch(setType('all'))
    }
    dispatch(setCategory('all'))
  }, [typeParam, dispatch])

  // Featured sections: use first 4 and next 4 real products
  const covetedProducts = allProducts.slice(0, 4)
  const newArrivals = allProducts.slice(4, 8)

  // Determine if catalogue view is active
  const isCatalogueView = typeParam !== null

  const handleCategoryChange = (category) => {
    dispatch(setCategory(category))
  }

  const handleSortChange = (e) => {
    dispatch(setSortOption(e.target.value))
  }

  // Categories list based on active type
  const categories = isCatalogueView
    ? typeParam === 'fashion'
      ? ['all', 'Outerwear', 'Shoes', 'Bags', 'Tops', 'Bottoms', 'Accessories']
      : []
    : []

  if (isCatalogueView) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
        {/* Breadcrumb / Title */}
        <div className="border-b border-atelier-lightgray/60 pb-6 mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <span className="font-mono text-xs sm:text-sm tracking-[0.2em] uppercase text-atelier-gray block mb-1">
              Collection
            </span>
            <h1 className="font-serif text-4xl capitalize text-atelier-dark font-semibold">
              {typeParam} Archive
            </h1>
          </div>

          {/* Sorting / Controls */}
          <div className="flex items-center space-x-4 font-mono text-sm uppercase tracking-wider">
            <span className="flex items-center text-atelier-gray">
              <SlidersHorizontal size={12} className="mr-1.5" /> Filter & Sort
            </span>
            <select
              value={sortOption}
              onChange={handleSortChange}
              className="bg-transparent border border-atelier-lightgray px-3 py-2 text-atelier-dark focus:outline-none focus:border-atelier-dark font-medium"
            >
              <option value="featured">Featured</option>
              <option value="price-low-high">Price: Low to High</option>
              <option value="price-high-low">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar categories filter */}
          <div className="lg:col-span-3">
            <h3 className="font-mono text-xs sm:text-sm tracking-[0.2em] uppercase text-atelier-gray border-b border-atelier-lightgray/40 pb-3 mb-4">
              Categories
            </h3>
            <ul className="space-y-3 font-serif text-base text-atelier-dark">
              {categories.map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => handleCategoryChange(cat)}
                    className={`capitalize text-left hover:text-atelier-accent transition-colors ${
                      selectedCategory.toLowerCase() === cat.toLowerCase()
                        ? 'text-atelier-accent font-medium list-disc ml-1'
                        : 'text-atelier-dark font-light'
                    }`}
                  >
                    {cat === 'all' ? `All ${typeParam}` : cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Product list grid */}
          <div className="lg:col-span-9">
            {apiLoading ? (
              <div className="py-20 text-center">
                <p className="font-serif text-lg text-atelier-gray italic">Loading products...</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-12 gap-x-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id || product._id} product={product} />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <p className="font-serif text-lg text-atelier-gray italic">No products found in this category.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Standard Homepage view
  return (
    <div className="animate-fade-in">
      <PromotionStrip />
      {/* 1. Hero Section */}
      <section className="border-b border-atelier-lightgray/60 grid grid-cols-1 md:grid-cols-2 h-auto md:h-[600px] overflow-hidden bg-atelier-cream">
        {/* Left Side: Image */}
        <div className="relative h-[400px] md:h-full overflow-hidden border-r border-atelier-lightgray/40">
          <img 
            src={IMAGES.heroFashion} 
            alt="Atelier Autumn Edition Model" 
            className="h-full w-full object-cover object-center"
            onError={(e) => {
              e.target.onerror = null
              e.target.src = IMAGES.fallback
            }}
          />
          {/* Fallback pattern in case image doesn't load */}
          <div className="absolute inset-0 bg-[#E5DFD3]/40 mix-blend-multiply z-0 pointer-events-none" />
        </div>

        {/* Right Side: Copy & CTA */}
        <div className="flex flex-col justify-between p-8 sm:p-12 lg:p-20 py-16">
          <div className="space-y-6 max-w-md">
            <span className="font-mono text-xs sm:text-sm tracking-[0.3em] uppercase text-atelier-gray block">
              Autumn Edition 026
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-atelier-dark tracking-tight leading-[1.1] font-semibold">
              Objects worth keeping.
            </h1>
            <p className="text-atelier-gray text-sm sm:text-base leading-relaxed font-light font-sans pt-2">
              A slow collection of fashion and accessories — sourced, considered, and quietly built for the years ahead of you.
            </p>
          </div>

          <div className="space-y-8 mt-12 md:mt-0">
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => navigate('/?type=fashion')}
                className="btn-atelier-dark group"
              >
                <span>Explore the edit</span>
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => navigate('/?type=fashion')}
                className="btn-atelier-outline"
              >
                Fashion
              </button>
            </div>

            {/* Bottom mini announcement */}
            <div className="flex items-center space-x-6 font-mono text-xs sm:text-sm tracking-widest text-atelier-gray uppercase border-t border-atelier-lightgray/40 pt-6">
              <span>Free shipping over $150</span>
              <span>&bull;</span>
              <span>30-day returns</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Split Category Splits */}
      <section className="grid grid-cols-1 md:grid-cols-2 border-b border-atelier-lightgray/60">
        {/* Left Column: Fashion */}
        <div 
          onClick={() => navigate('/?type=fashion')}
          className="relative h-[350px] sm:h-[450px] group cursor-pointer overflow-hidden border-r border-atelier-lightgray/40 flex flex-col justify-end p-8 sm:p-12 transition-shadow duration-300 hover:shadow-2xl"
        >
          <img 
            src={IMAGES.categoryFashion} 
            alt="Tailoring, Knitwear, Leather Goods" 
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            onError={(e) => {
              e.target.onerror = null
              e.target.src = IMAGES.fallback
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative z-10 space-y-2">
            <span className="font-mono text-xs sm:text-sm tracking-[0.2em] uppercase text-white/80 block">
              Tailoring, Knitwear, Leather Goods
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-white font-medium flex items-center gap-2">
              <span>Fashion</span>
              <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" strokeWidth={1.5} />
            </h2>
          </div>
        </div>

        {/* Right Column: Accessories */}
        <div 
          onClick={() => navigate('/?type=fashion')}
          className="relative h-[350px] sm:h-[450px] group cursor-pointer overflow-hidden flex flex-col justify-end p-8 sm:p-12 transition-shadow duration-300 hover:shadow-2xl"
        >
          <img 
            src={IMAGES.categoryAccessories} 
            alt="Accessories, Bags, Jewelry" 
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            onError={(e) => {
              e.target.onerror = null
              e.target.src = IMAGES.fallback
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 space-y-2">
            <span className="font-mono text-xs sm:text-sm tracking-[0.2em] uppercase text-white/80 block">
              Accessories, Bags, Jewelry
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-white font-medium flex items-center gap-2">
              <span>Accessories</span>
              <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" strokeWidth={1.5} />
            </h2>
          </div>
        </div>
      </section>

      {/* 3. Currently Coveted Slider/Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-atelier-lightgray/60">
        <div className="flex items-end justify-between mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl text-atelier-dark font-semibold">
            Currently coveted
          </h2>
          <button 
            onClick={() => navigate('/?type=fashion')}
            className="font-mono text-sm tracking-[0.2em] uppercase text-atelier-dark hover:opacity-70 transition-opacity flex items-center gap-1.5 pb-1 border-b border-atelier-dark"
          >
            <span>View all</span>
            <ArrowRight size={12} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-6">
          {covetedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 4. Manifesto block (black bg) */}
      <section className="bg-atelier-dark text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left copy column */}
          <div className="lg:col-span-5 space-y-8">
            <span className="font-mono text-xs tracking-[0.25em] uppercase text-white/60 block">
              Manifesto &mdash; No. 04
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl leading-tight font-medium">
              We're allergic to noise. <span className="italic font-light opacity-80">Quietly.</span>
            </h2>
            <p className="text-white/70 text-sm sm:text-base leading-relaxed font-light font-sans max-w-md">
              Every piece in the store is chosen against a single question: will this still feel right in five years? If the answer is no, it doesn't ship. That's the whole rule.
            </p>
            <button 
              onClick={() => navigate('/journal')}
              className="px-6 py-3 border border-white text-white hover:bg-white hover:text-atelier-dark transition-all duration-300 font-mono text-sm tracking-[0.2em] uppercase font-medium flex items-center justify-center gap-2"
            >
              <span>Read the journal &rarr;</span>
            </button>
          </div>

          {/* Right layout column */}
          <div className="lg:col-span-7 grid grid-cols-12 gap-4 items-center">
            {/* Flatlay Shirt */}
            <div className="col-span-8 aspect-[4/5] bg-atelier-beige/10 overflow-hidden border border-white/10 relative">
              <img 
                src={IMAGES.manifestoFlatlay} 
                alt="Minimal Folded Shirt flatlay" 
                className="h-full w-full object-cover object-center transition-transform duration-700 ease-out hover:scale-105"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = IMAGES.fallback
                }}
              />
            </div>
            {/* Over-ear headphone layout */}
            <div className="col-span-4 aspect-[4/6] bg-atelier-beige/10 overflow-hidden border border-white/10 relative mt-16">
              <img 
                src={IMAGES.manifestoHeadphones} 
                alt="Headphones product layout" 
                className="h-full w-full object-cover object-center transition-transform duration-700 ease-out hover:scale-105"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = IMAGES.fallback
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 5. New arrivals */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-12">
          <span className="font-mono text-xs sm:text-sm tracking-[0.25em] uppercase text-atelier-gray block mb-1">
            Just landed
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-atelier-dark font-semibold">
            New arrivals
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-6">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  )
}

export default Home
