import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  Search,
  ShoppingBag,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react'

import { toggleCart } from '../../features/cart/cartSlice'
import { logout } from '../../features/auth/authSlice'
import SearchModal from '../common/SearchModal'
import CategoryMegaMenu from './CategoryMegaMenu'
import { useCategoryMenu, getCategoryLink } from '../../utils/categories'

const Navbar = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const location = useLocation()

  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState({})

  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const { items } = useSelector((state) => state.cart)
  const { menu, loading: menuLoading } = useCategoryMenu()

  const cartCount = items.reduce(
    (acc, item) => acc + item.quantity,
    0
  )

  useEffect(() => {
    setIsMobileMenuOpen(false)
    setIsSearchOpen(false)
  }, [location.pathname, location.search])

  const handleCartClick = () => {
    dispatch(toggleCart())
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    dispatch(logout())
    navigate('/')
  }

  const closeMenus = () => {
    setIsMobileMenuOpen(false)
  }

  const toggleMobileSection = (key) => {
    setMobileExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const men = menu.main?.find((c) => c.slug === 'men')
  const women = menu.main?.find((c) => c.slug === 'women')
  const featured = menu.featured || []

  const renderMobileCategory = (node, parentSlug, depth = 0) => (
    <div key={node.slug} style={{ paddingLeft: depth * 12 }}>
      <Link
        to={getCategoryLink(node.slug, parentSlug)}
        onClick={closeMenus}
        className="block py-2 text-atelier-dark font-serif capitalize hover:text-atelier-accent transition-colors"
      >
        {node.name}
      </Link>
      {node.children?.map((child) => renderMobileCategory(child, node.slug === 'men' || node.slug === 'women' ? node.slug : parentSlug, depth + 1))}
    </div>
  )

  return (
    <>
      <header className="sticky top-0 z-40 bg-atelier-beige/90 backdrop-blur-md border-b border-atelier-lightgray/50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-atelier-dark hover:opacity-75"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {!menuLoading && (menu.main?.length > 0 || menu.featured?.length > 0) ? (
            <CategoryMegaMenu menu={menu} onClose={closeMenus} />
          ) : (
            <nav className="hidden md:flex items-center space-x-8 font-mono text-base tracking-[0.2em] uppercase">
              <Link to="/shop" className="text-atelier-gray hover:text-atelier-dark pb-0.5">Shop All</Link>
              <Link to="/shop/men" className="text-atelier-gray hover:text-atelier-dark pb-0.5">Men</Link>
              <Link to="/shop/women" className="text-atelier-gray hover:text-atelier-dark pb-0.5">Women</Link>
              <Link to="/journal" className="text-atelier-gray hover:text-atelier-dark pb-0.5">Journal</Link>
            </nav>
          )}

          <div className="absolute left-1/2 -translate-x-1/2">
            <Link
              to="/"
              className="font-serif text-3xl tracking-wide text-atelier-dark hover:opacity-90"
            >
              Atelier
            </Link>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-5">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-atelier-dark hover:opacity-70 transition-opacity"
              aria-label="Search products"
            >
              <Search size={20} strokeWidth={1.5} />
            </button>

            {isAuthenticated ? (
              <div className="hidden sm:flex items-center space-x-3 font-mono text-sm tracking-wider text-atelier-dark">
                {user?.role === 'admin' && (
                  <Link to="/admin" className="hover:opacity-75">Admin Panel</Link>
                )}
                <Link to="/account" className="flex items-center space-x-1 hover:opacity-75">
                  <User size={18} strokeWidth={1.5} />
                  <span>{user?.name || user?.email?.split('@')[0] || 'Account'}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-atelier-gray hover:text-atelier-dark"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut size={16} strokeWidth={1.5} />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden sm:inline-block px-4 py-1.5 border border-atelier-dark text-sm tracking-widest uppercase font-mono bg-transparent hover:bg-atelier-dark hover:text-white transition-colors duration-200"
              >
                Sign In
              </Link>
            )}

            <Link
              to={isAuthenticated ? '/account' : '/login'}
              className="sm:hidden p-2 text-atelier-dark"
            >
              <User size={20} strokeWidth={1.5} />
            </Link>

            <button
              onClick={handleCartClick}
              className="p-2 text-atelier-dark hover:opacity-70 transition-opacity relative"
              aria-label="Shopping cart"
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-atelier-dark text-atelier-beige text-xs font-mono min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-bold">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-atelier-beige border-b border-atelier-lightgray px-6 py-8 animate-fade-in max-h-[80vh] overflow-y-auto">
            <nav className="flex flex-col space-y-4 font-mono text-sm tracking-[0.2em] uppercase">

              <Link to="/shop" onClick={closeMenus} className="text-atelier-dark border-b border-atelier-lightgray/40 pb-3">
                Shop All
              </Link>

              {men && (
                <div className="border-b border-atelier-lightgray/40 pb-3">
                  <button
                    type="button"
                    onClick={() => toggleMobileSection('men')}
                    className="flex items-center justify-between w-full text-atelier-dark"
                  >
                    Men
                    <ChevronDown size={16} className={`transition-transform ${mobileExpanded.men ? 'rotate-180' : ''}`} />
                  </button>
                  {mobileExpanded.men && (
                    <div className="mt-3 space-y-1 normal-case tracking-normal">
                      <Link to={getCategoryLink('men')} onClick={closeMenus} className="block py-1.5 font-serif text-atelier-accent">All Men</Link>
                      {men.children?.map((child) => renderMobileCategory(child, 'men'))}
                    </div>
                  )}
                </div>
              )}

              {women && (
                <div className="border-b border-atelier-lightgray/40 pb-3">
                  <button
                    type="button"
                    onClick={() => toggleMobileSection('women')}
                    className="flex items-center justify-between w-full text-atelier-dark"
                  >
                    Women
                    <ChevronDown size={16} className={`transition-transform ${mobileExpanded.women ? 'rotate-180' : ''}`} />
                  </button>
                  {mobileExpanded.women && (
                    <div className="mt-3 space-y-1 normal-case tracking-normal">
                      <Link to={getCategoryLink('women')} onClick={closeMenus} className="block py-1.5 font-serif text-atelier-accent">All Women</Link>
                      {women.children?.map((child) => renderMobileCategory(child, 'women'))}
                    </div>
                  )}
                </div>
              )}

              {featured.length > 0 && (
                <div className="border-b border-atelier-lightgray/40 pb-3">
                  <button
                    type="button"
                    onClick={() => toggleMobileSection('featured')}
                    className="flex items-center justify-between w-full text-atelier-dark"
                  >
                    Collections
                    <ChevronDown size={16} className={`transition-transform ${mobileExpanded.featured ? 'rotate-180' : ''}`} />
                  </button>
                  {mobileExpanded.featured && (
                    <div className="mt-3 space-y-2 normal-case tracking-normal">
                      {featured.map((col) => (
                        <Link
                          key={col.slug}
                          to={getCategoryLink(col.slug)}
                          onClick={closeMenus}
                          className="block py-1.5 font-serif text-atelier-dark hover:text-atelier-accent"
                        >
                          {col.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Link to="/journal" onClick={closeMenus} className="text-atelier-dark border-b border-atelier-lightgray/40 pb-3">
                Journal
              </Link>

              {isAuthenticated && user?.role === 'admin' && (
                <Link to="/admin" onClick={closeMenus} className="text-atelier-dark border-b border-atelier-lightgray/40 pb-3">
                  Admin Dashboard
                </Link>
              )}

              {isAuthenticated ? (
                <>
                  <Link to="/account" onClick={closeMenus} className="text-atelier-dark border-b border-atelier-lightgray/40 pb-3">
                    My Account
                  </Link>
                  <button onClick={handleLogout} className="text-left text-atelier-gray uppercase tracking-[0.2em]">
                    Sign Out
                  </button>
                </>
              ) : (
                <Link to="/login" onClick={closeMenus} className="text-atelier-dark">Sign In</Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {isSearchOpen && (
        <SearchModal onClose={() => setIsSearchOpen(false)} />
      )}
    </>
  )
}

export default Navbar
