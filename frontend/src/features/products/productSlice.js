import { createSlice } from '@reduxjs/toolkit'
import { IMAGES } from '../../utils/images'

const mockProducts = [
  {
    id: 'wool-coat',
    name: 'Atelier Wool Coat',
    category: 'Outerwear',
    type: 'fashion',
    price: 289,
    originalPrice: 340,
    rating: 4.9,
    tag: 'SALE',
    description: 'A luxurious short wool coat crafted from premium, heavy wool blend. Featuring a double-breasted button front, notch lapels, and side welt pockets. A timeless silhouette built to outlast seasons.',
    details: [
      'Outer: 85% Virgin Wool, 15% Cashmere',
      'Lining: 100% Viscose (fully lined)',
      'Double-breasted front with horn-effect buttons',
      'Dry clean only',
      'Made in Italy'
    ],
    colors: [
      { name: 'Camel', hex: '#C29B70' },
      { name: 'Noir', hex: '#1C1C1C' }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    images: [
      IMAGES.woolCoat,
      IMAGES.categoryFashion
    ],
    reviews: [
      { id: 1, name: 'Sophia R.', rating: 5, comment: 'Absolutely stunning. The weight is perfect and it feels incredibly premium. True to size.', date: '2026-06-15' },
      { id: 2, name: 'James L.', rating: 4, comment: 'Purchased for my wife. The wool is soft and the tailoring is top-notch.', date: '2026-07-02' }
    ]
  },
  {
    id: 'court-sneakers',
    name: 'Leather Court Sneakers',
    category: 'Footwear',
    type: 'fashion',
    price: 178,
    rating: 4.7,
    description: 'Minimalist sneakers built for comfort and style. Handcrafted from top-grain Italian leather, featuring a stitched rubber cupsole and calfskin lining. Subtle branding details on the tongue.',
    details: [
      '100% Italian top-grain calfskin leather',
      'Margom rubber soles from Italy',
      'Reinforced stitching for durability',
      'Removable cushioned insole',
      'Handcrafted in Portugal'
    ],
    colors: [
      { name: 'Off-white', hex: '#EAE6DD' },
      { name: 'Black', hex: '#1C1C1C' }
    ],
    sizes: ['EU 39', 'EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44'],
    images: [IMAGES.sneakers],
    reviews: [
      { id: 1, name: 'Marcus T.', rating: 5, comment: 'Clean look, matches everything. Take about a week to break in, but very comfortable now.', date: '2026-05-20' }
    ]
  },
  {
    id: 'leather-tote',
    name: 'Structured Leather Tote',
    category: 'Bags',
    type: 'fashion',
    price: 245,
    rating: 4.8,
    description: 'A spacious, structured tote bag designed to carry all daily essentials. Made from scratch-resistant pebbled leather with raw edges and an interior zipper pocket for valuables.',
    details: [
      '100% Pebbled calf leather',
      'Dual top handles with 10" drop',
      'Raw suede-lined interior',
      'Internal zippered slip pocket',
      'Dimensions: 14" W x 11.5" H x 6" D'
    ],
    colors: [
      { name: 'Black', hex: '#1C1C1C' },
      { name: 'Cognac', hex: '#825633' }
    ],
    sizes: ['One Size'],
    images: [IMAGES.tote],
    reviews: [
      { id: 1, name: 'Elena B.', rating: 5, comment: 'Perfect work bag. Fits my 14 inch laptop, water bottle, and notebooks comfortably without losing its shape.', date: '2026-06-28' }
    ]
  },
  {
    id: 'automatic-watch',
    name: 'Noir Automatic Watch',
    category: 'Accessories',
    type: 'electronics',
    price: 395,
    rating: 4.9,
    description: 'An elegant timekeeper combining mechanical precision with minimalist aesthetics. Driven by an automatic self-winding movement with 40-hour power reserve, visible through the exhibition case back.',
    details: [
      '38mm Case in sandblasted matte black stainless steel',
      'Japanese automatic caliber movement (21 jewels)',
      'Sapphire crystal glass dial window',
      'Genuine Horween leather strap in black',
      '5 ATM water resistant'
    ],
    colors: [
      { name: 'Noir', hex: '#1C1C1C' },
      { name: 'Cognac', hex: '#634E3C' }
    ],
    sizes: ['38mm', '41mm'],
    images: [IMAGES.watch],
    reviews: [
      { id: 1, name: 'Thomas K.', rating: 5, comment: 'Stunning watch. The sweeping seconds hand is beautiful, and it keeps time wonderfully. Best value for an automatic.', date: '2026-07-10' }
    ]
  },
  {
    id: 'silk-blouse',
    name: 'Silk Blouse — Cream',
    category: 'Tops',
    type: 'fashion',
    price: 145,
    rating: 4.6,
    tag: 'NEW',
    description: 'A classic button-front blouse featuring an elegant relaxed fit, pointed collar, and mother-of-pearl buttons. Cut from fluid silk crepe de chine that drape beautifully.',
    details: [
      '100% Mulberry Silk Crepe de Chine',
      'Relaxed, fluid drape',
      'Mother-of-pearl buttons',
      'Double-button barrel cuffs',
      'Dry clean recommended'
    ],
    colors: [
      { name: 'Cream', hex: '#F0ECE3' },
      { name: 'Noir', hex: '#1C1C1C' }
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    images: [IMAGES.silkBlouse, IMAGES.manifestoFlatlay],
    reviews: [
      { id: 1, name: 'Chloe M.', rating: 4, comment: 'Beautiful texture and very elegant. The cream is slightly sheer but perfect with a nude bralette.', date: '2026-07-18' }
    ]
  },
  {
    id: 'round-sunglasses',
    name: 'Tortoise Round Sunglasses',
    category: 'Accessories',
    type: 'fashion',
    price: 165,
    rating: 4.8,
    tag: 'NEW',
    description: 'Vintage-inspired round sunglasses handmade from premium acetate with robust 5-barrel hinges. Equipped with 100% UVA/UVB protective dark lenses for active sunlight.',
    details: [
      'Premium bio-acetate frame',
      'CR-39 scratch-resistant lenses',
      '100% UVA/UVB protection',
      'Sturdy 5-barrel metal hinges',
      'Includes premium leather sleeve and cleaning cloth'
    ],
    colors: [
      { name: 'Tortoise', hex: '#87562D' },
      { name: 'Noir', hex: '#1C1C1C' }
    ],
    sizes: ['Standard'],
    images: [IMAGES.sunglasses],
    reviews: []
  },
  {
    id: 'pro-phone',
    name: 'Slate Pro Phone',
    category: 'Phones',
    type: 'electronics',
    price: 899,
    rating: 4.9,
    tag: 'NEW',
    description: 'A beautiful culmination of industrial design and state-of-the-art tech. Featuring a matte-textured glass back, a responsive LTPO display, and our most advanced dual-lens camera system.',
    details: [
      '6.2-inch LTPO OLED screen (1-120Hz dynamic refresh)',
      'Dual 50MP camera (Wide + Ultra-wide) with hybrid OIS',
      'Chassis in aerospace-grade matte black aluminum',
      '256GB / 512GB High-speed internal storage',
      'All-day battery with 30W wireless charging'
    ],
    colors: [
      { name: 'Matte Slate', hex: '#2A2B2D' },
      { name: 'Paper White', hex: '#FAF9F6' }
    ],
    sizes: ['256GB', '512GB'],
    images: [IMAGES.phone],
    reviews: [
      { id: 1, name: 'Devon P.', rating: 5, comment: 'The design is so clean. It feels like a piece of art in hand. No branding clutter, clean OS, and beautiful photos.', date: '2026-07-21' }
    ]
  },
  {
    id: 'linen-trousers',
    name: 'Wide Linen Trousers',
    category: 'Bottoms',
    type: 'fashion',
    price: 135,
    rating: 4.5,
    description: 'Tailored trousers cut with a wide, straight leg for relaxed elegant wearing. Made from breathable Belgian flax linen with an elasticated back waistband and discreet side slip pockets.',
    details: [
      '100% Belgian flax linen',
      'Wide-leg, high-rise silhouette',
      'Button and slide closure with zip fly',
      'Partial back elastic waistband for comfort',
      'Cold wash and hang dry'
    ],
    colors: [
      { name: 'Flax', hex: '#D2C3B2' },
      { name: 'Noir', hex: '#1C1C1C' }
    ],
    sizes: ['24', '26', '28', '30', '32'],
    images: [IMAGES.trousers],
    reviews: []
  },
  {
    id: 'headphones',
    name: 'Acoustic Over-Ear Headphones',
    category: 'Audio',
    type: 'electronics',
    price: 350,
    rating: 4.8,
    description: 'Immersive sound, quietly designed. Active noise-canceling headphones crafted with memory foam earcups covered in premium lambskin leather and brushed aluminum sliders. Up to 35 hours of pure audio.',
    details: [
      '40mm custom electro-dynamic drivers',
      'Advanced hybrid Active Noise Cancellation (ANC)',
      'Bluetooth 5.2 with aptX Adaptive codecs',
      'Lambskin leather and memory foam cushions',
      '35-hour playback with ANC active'
    ],
    colors: [
      { name: 'Charcoal Black', hex: '#1F1F1F' },
      { name: 'Sand Gold', hex: '#D7C7B7' }
    ],
    sizes: ['Standard'],
    images: [IMAGES.categoryElectronics, IMAGES.manifestoHeadphones],
    reviews: [
      { id: 1, name: 'Lucas W.', rating: 5, comment: 'Quiet is right. The ANC blocks out construction noise completely. Plus, it looks like a design item instead of cheap plastic.', date: '2026-07-09' }
    ]
  }
]

const initialState = {
  products: mockProducts,
  filteredProducts: mockProducts,
  selectedProduct: null,
  searchQuery: '',
  selectedCategory: 'all',
  selectedType: 'all',
  sortOption: 'featured'
}

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload
      state.filteredProducts = applyFiltersAndSort(state)
    },
    setCategory: (state, action) => {
      state.selectedCategory = action.payload
      state.filteredProducts = applyFiltersAndSort(state)
    },
    setType: (state, action) => {
      state.selectedType = action.payload
      state.filteredProducts = applyFiltersAndSort(state)
    },
    setSortOption: (state, action) => {
      state.sortOption = action.payload
      state.filteredProducts = applyFiltersAndSort(state)
    },
    selectProductById: (state, action) => {
      state.selectedProduct = state.products.find(p => p.id === action.payload) || null
    },
    addMockReview: (state, action) => {
      const { productId, review } = action.payload
      const product = state.products.find(p => p.id === productId)
      if (product) {
        const newReview = {
          id: product.reviews.length + 1,
          ...review,
          date: new Date().toISOString().split('T')[0]
        }
        product.reviews.unshift(newReview)
        const sum = product.reviews.reduce((acc, curr) => acc + curr.rating, 0)
        product.rating = parseFloat((sum / product.reviews.length).toFixed(1))
        if (state.selectedProduct && state.selectedProduct.id === productId) {
          state.selectedProduct = product
        }
        state.filteredProducts = applyFiltersAndSort(state)
      }
    }
  }
})

function applyFiltersAndSort(state) {
  let result = [...state.products]
  if (state.selectedType !== 'all') {
    result = result.filter(p => p.type === state.selectedType)
  }
  if (state.selectedCategory !== 'all') {
    result = result.filter(p => p.category.toLowerCase() === state.selectedCategory.toLowerCase())
  }
  if (state.searchQuery.trim() !== '') {
    const q = state.searchQuery.toLowerCase()
    result = result.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q) || 
      p.category.toLowerCase().includes(q)
    )
  }
  if (state.sortOption === 'price-low-high') {
    result.sort((a, b) => a.price - b.price)
  } else if (state.sortOption === 'price-high-low') {
    result.sort((a, b) => b.price - a.price)
  } else if (state.sortOption === 'rating') {
    result.sort((a, b) => b.rating - a.rating)
  }
  return result
}

export const { setSearchQuery, setCategory, setType, setSortOption, selectProductById, addMockReview } = productSlice.actions
export default productSlice.reducer
