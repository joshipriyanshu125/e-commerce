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
  const { user, isAuthenticated } = useSelector(state => state.auth || {})

  // Fetch real products from backend on mount
  useEffect(() => {
    dispatch(fetchAPIProducts())
  }, [])

  // Personalized recommendations based on AI Fashion Profile
  const recommendedProducts = React.useMemo(() => {
    if (!isAuthenticated || !user || !user.styleProfile || !user.onboardingCompleted) {
      return []
    }
    const profile = user.styleProfile
    const styles = Array.isArray(profile.styles) ? profile.styles.map(s => s.toLowerCase()) : []
    const preferredColors = Array.isArray(profile.preferredColors) ? profile.preferredColors.map(c => c.toLowerCase()) : []
    const favoriteCategories = Array.isArray(profile.favoriteCategories) ? profile.favoriteCategories.map(c => c.toLowerCase()) : []
    const priceRange = profile.priceRange

    // Parse price range e.g. "₹1000-₹2500"
    let minPrice = 0
    let maxPrice = Infinity
    if (priceRange) {
      const match = priceRange.match(/\d+/g)
      if (match) {
        minPrice = parseInt(match[0], 10)
        maxPrice = match[1] ? parseInt(match[1], 10) : Infinity
      }
    }

    const scored = allProducts.map(product => {
      let score = 0

      // Match styles with tags, name, or description
      const tags = Array.isArray(product.tags) ? product.tags.map(t => t.toLowerCase()) : []
      const prodName = (product.name || '').toLowerCase()
      const prodDesc = (product.description || '').toLowerCase()
      const prodCat = (product.category || '').toLowerCase()

      styles.forEach(s => {
        if (tags.includes(s) || prodName.includes(s) || prodDesc.includes(s)) {
          score += 3
        }
      })

      // Match preferredColors with colors
      if (Array.isArray(product.colors)) {
        product.colors.forEach(c => {
          const colorName = (typeof c === 'string' ? c : c.name || '').toLowerCase()
          if (preferredColors.includes(colorName)) {
            score += 2
          }
        })
      }

      // Match favoriteCategories with category or tags
      favoriteCategories.forEach(cat => {
        if (prodCat.includes(cat) || tags.includes(cat) || prodName.includes(cat)) {
          score += 3
        }
      })

      // Match price range (convert if product price is in USD vs INR range)
      const checkPrice = product.price < 500 ? product.price * 83 : product.price
      if (checkPrice >= minPrice && checkPrice <= maxPrice) {
        score += 4
      }

      return { product, score }
    })

    // Filter products with score > 0, sort by score desc, and take top 4
    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.product)
      .slice(0, 4)
  }, [allProducts, user, isAuthenticated])

  // Synchronize URL parameters with Redux state
  useEffect(() => {
    if (typeParam) {
      dispatch(setType(typeParam))
    } else {
      dispatch(setType('all'))
    }
    dispatch(setCategory('all'))
  }, [typeParam, dispatch])

  // Featured sections: use real products loaded from database
  const covetedProducts = allProducts.slice(0, 4)
  const newArrivals = allProducts.slice(4, 8)

  // Helper to extract image URL from product object
  const getProductImg = (product) => {
    if (!product) return null
    const raw = product.images?.[0]
    if (!raw) return null
    return typeof raw === 'string' ? raw : raw.url
  }

  // 1. Hero Product (Funky Fashion Oversized Tshirt)
  const heroProduct = React.useMemo(() => {
    return allProducts.find(p => {
      const name = (p.name || '').toLowerCase()
      return name.includes('oversized') || name.includes('tshirt') || name.includes('t-shirt')
    }) || allProducts[0] || null
  }, [allProducts])

  // 2. Footwear Product (Nike Air Max 90)
  const footwearProduct = React.useMemo(() => {
    return allProducts.find(p => {
      const cat = (p.category || '').toLowerCase()
      const name = (p.name || '').toLowerCase()
      const tags = Array.isArray(p.tags) ? p.tags.map(t => String(t).toLowerCase()) : []
      return cat.includes('shoe') || cat.includes('footwear') || cat.includes('sneaker') ||
             name.includes('nike') || name.includes('shoe') || name.includes('sneaker') || name.includes('boot') ||
             tags.some(t => ['shoe', 'shoes', 'sneaker', 'sneakers', 'footwear', 'boot', 'boots'].includes(t))
    }) || allProducts.find(p => p !== heroProduct) || allProducts[1] || null
  }, [allProducts, heroProduct])

  // 3. Fashion Product (VD Looks Casual Striped Shirt)
  const fashionProduct = React.useMemo(() => {
    return allProducts.find(p => {
      const name = (p.name || '').toLowerCase()
      return name.includes('shirt') && p !== heroProduct && p !== footwearProduct
    }) || allProducts.find(p => p !== heroProduct && p !== footwearProduct) || allProducts[2] || null
  }, [allProducts, heroProduct, footwearProduct])

  // 4. Manifesto Product 1 (METRONAUT Cargo Pants)
  const manifestoProduct1 = React.useMemo(() => {
    return allProducts.find(p => {
      const name = (p.name || '').toLowerCase()
      return (name.includes('cargo') || name.includes('pants')) && p !== heroProduct && p !== footwearProduct && p !== fashionProduct
    }) || allProducts.find(p => p !== heroProduct && p !== footwearProduct && p !== fashionProduct) || allProducts[3] || null
  }, [allProducts, heroProduct, footwearProduct, fashionProduct])

  // 5. Manifesto Product 2 (KOTTY Low Rise Black Jeans / Joshua Jenny Joggers)
  const manifestoProduct2 = React.useMemo(() => {
    return allProducts.find(p => {
      const name = (p.name || '').toLowerCase()
      return (name.includes('jeans') || name.includes('jogger')) && p !== heroProduct && p !== footwearProduct && p !== fashionProduct && p !== manifestoProduct1
    }) || allProducts.find(p => p !== heroProduct && p !== footwearProduct && p !== fashionProduct && p !== manifestoProduct1) || allProducts[4] || null
  }, [allProducts, heroProduct, footwearProduct, fashionProduct, manifestoProduct1])

  const heroImgSrc = getProductImg(heroProduct) || IMAGES.heroFashion
  const footwearImgSrc = getProductImg(footwearProduct) || IMAGES.sneakers
  const fashionImgSrc = getProductImg(fashionProduct) || IMAGES.categoryFashion
  const manifestoImg1 = getProductImg(manifestoProduct1) || IMAGES.manifestoFlatlay
  const manifestoImg2 = getProductImg(manifestoProduct2) || IMAGES.manifestoHeadphones

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
      ? ['all', 'Outerwear', 'Shoes', 'Bags', 'Tops', 'Bottoms']
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

          <div className="flex items-center space-x-4">
            <SlidersHorizontal size={16} className="text-atelier-gray" />
            <select
              value={sortOption}
              onChange={handleSortChange}
              className="bg-transparent border border-atelier-lightgray px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-atelier-dark focus:outline-none cursor-pointer"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        {/* Category Pills Filter */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-10 pb-4 border-b border-atelier-lightgray/40">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`font-mono text-xs uppercase tracking-widest px-4 py-2 transition-colors duration-200 border ${
                  selectedCategory === cat
                    ? 'bg-atelier-dark text-white border-atelier-dark'
                    : 'bg-transparent text-atelier-gray border-atelier-lightgray hover:border-atelier-dark hover:text-atelier-dark'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {apiLoading ? (
          <div className="py-20 text-center">
            <p className="font-serif text-lg text-atelier-gray italic">Loading products...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-6">
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
    )
  }

  return (
    <div className="space-y-0">
      <PromotionStrip />
      {/* 1. Hero Section */}
      <section className="border-b border-atelier-lightgray/60 grid grid-cols-1 md:grid-cols-2 h-auto md:h-[600px] overflow-hidden bg-atelier-cream">
        {/* Left Side: Image */}
        <div 
          onClick={() => heroProduct && navigate(`/product/${heroProduct._id || heroProduct.id}`)}
          className="relative h-[400px] md:h-full overflow-hidden border-r border-atelier-lightgray/40 cursor-pointer group"
        >
          <img 
            src={heroImgSrc} 
            alt={heroProduct ? heroProduct.name : "Atelier Autumn Collection"} 
            className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            onError={(e) => {
              e.target.onerror = null
              e.target.src = IMAGES.fallback
            }}
          />
          {heroProduct && (
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/70 to-transparent text-white font-mono text-xs tracking-widest uppercase truncate opacity-90 group-hover:opacity-100 transition-opacity z-10">
              Featured: {heroProduct.name}
            </div>
          )}
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
              A slow collection of fashion and footwear — sourced, considered, and quietly built for the years ahead of you.
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
          onClick={() => navigate(fashionProduct ? `/product/${fashionProduct._id || fashionProduct.id}` : '/?type=fashion')}
          className="relative h-[350px] sm:h-[450px] group cursor-pointer overflow-hidden border-r border-atelier-lightgray/40 flex flex-col justify-end p-8 sm:p-12 transition-shadow duration-300 hover:shadow-2xl"
        >
          <img 
            src={fashionImgSrc} 
            alt={fashionProduct ? fashionProduct.name : "Tailoring & Outerwear"} 
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            onError={(e) => {
              e.target.onerror = null
              e.target.src = IMAGES.fallback
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent pointer-events-none" />
          
          <div className="relative z-10 space-y-2">
            <span className="font-mono text-xs sm:text-sm tracking-[0.2em] uppercase text-white/90 block font-medium drop-shadow-sm">
              {fashionProduct ? fashionProduct.name : 'Tailoring, Knitwear, Outerwear'}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-white font-medium flex items-center gap-2 drop-shadow-md">
              <span>Fashion</span>
              <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" strokeWidth={1.5} />
            </h2>
          </div>
        </div>

        {/* Right Column: Footwear */}
        <div 
          onClick={() => navigate(footwearProduct ? `/product/${footwearProduct._id || footwearProduct.id}` : '/?type=fashion')}
          className="relative h-[350px] sm:h-[450px] group cursor-pointer overflow-hidden flex flex-col justify-end p-8 sm:p-12 transition-shadow duration-300 hover:shadow-2xl"
        >
          <img 
            src={footwearImgSrc} 
            alt={footwearProduct ? footwearProduct.name : "Footwear & Shoes"} 
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            onError={(e) => {
              e.target.onerror = null
              e.target.src = IMAGES.fallback
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent pointer-events-none" />

          <div className="relative z-10 space-y-2">
            <span className="font-mono text-xs sm:text-sm tracking-[0.2em] uppercase text-white/90 block font-medium drop-shadow-sm">
              {footwearProduct ? footwearProduct.name : 'Sneakers, Boots, Footwear'}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-white font-medium flex items-center gap-2 drop-shadow-md">
              <span>Footwear</span>
              <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" strokeWidth={1.5} />
            </h2>
          </div>
        </div>
      </section>

      {/* AI Personalized Recommendations Section */}
      {recommendedProducts.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-atelier-lightgray/60 bg-atelier-cream/20 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="font-mono text-xs sm:text-sm tracking-[0.25em] uppercase text-atelier-accent block mb-1">
                Picked for your style
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-atelier-dark font-semibold">
                Your AI Style Edit
              </h2>
            </div>
            <div className="font-mono text-xs uppercase tracking-widest text-atelier-gray max-w-md">
              Curated styling for your {user.styleProfile.styles.join(' & ')} aesthetic with {user.styleProfile.preferredColors.join(', ')} colors.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-6">
            {recommendedProducts.map((product) => (
              <ProductCard key={product.id || product._id} product={product} />
            ))}
          </div>
        </section>
      )}

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
            <ProductCard key={product.id || product._id} product={product} />
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

          {/* Right layout column featuring real store products */}
          <div className="lg:col-span-7 grid grid-cols-12 gap-4 items-center">
            {/* Primary store product image */}
            <div 
              onClick={() => manifestoProduct1 && navigate(`/product/${manifestoProduct1._id || manifestoProduct1.id}`)}
              className="col-span-8 aspect-[4/5] bg-atelier-beige/10 overflow-hidden border border-white/10 relative cursor-pointer group"
            >
              <img 
                src={manifestoImg1} 
                alt={manifestoProduct1 ? manifestoProduct1.name : "Store product"} 
                className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = IMAGES.fallback
                }}
              />
              {manifestoProduct1 && (
                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white font-mono text-xs tracking-widest uppercase truncate opacity-90 group-hover:opacity-100 transition-opacity">
                  {manifestoProduct1.name}
                </div>
              )}
            </div>

            {/* Secondary store product image */}
            <div 
              onClick={() => manifestoProduct2 && navigate(`/product/${manifestoProduct2._id || manifestoProduct2.id}`)}
              className="col-span-4 aspect-[4/6] bg-atelier-beige/10 overflow-hidden border border-white/10 relative mt-16 cursor-pointer group"
            >
              <img 
                src={manifestoImg2} 
                alt={manifestoProduct2 ? manifestoProduct2.name : "Store product"} 
                className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = IMAGES.fallback
                }}
              />
              {manifestoProduct2 && (
                <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-white font-mono text-[10px] tracking-widest uppercase truncate opacity-90 group-hover:opacity-100 transition-opacity">
                  {manifestoProduct2.name}
                </div>
              )}
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
