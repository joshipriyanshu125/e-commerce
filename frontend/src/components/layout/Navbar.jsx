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
} from 'lucide-react'

import { toggleCart } from '../../features/cart/cartSlice'
import { logout } from '../../features/auth/authSlice'
import SearchModal from '../common/SearchModal'

const Navbar = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const location = useLocation()

  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const { items } = useSelector((state) => state.cart)

  const cartCount = items.reduce(
    (acc, item) => acc + item.quantity,
    0
  )

  // Close overlays whenever route changes
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

  const activeLinkClass = (path) => {
    return location.pathname + location.search === path
      ? 'text-atelier-dark font-medium border-b border-atelier-dark pb-0.5'
      : 'text-atelier-gray hover:text-atelier-dark pb-0.5'
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-atelier-beige/90 backdrop-blur-md border-b border-atelier-lightgray/50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-atelier-dark hover:opacity-75"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 font-mono text-base tracking-[0.2em] uppercase">
            <Link to="/" className={activeLinkClass('/')}>
              Shop All
            </Link>

            <Link
              to="/?type=fashion"
              className={activeLinkClass('/?type=fashion')}
            >
              Fashion
            </Link>

            <Link
              to="/journal"
              className={activeLinkClass('/journal')}
            >
              Journal
            </Link>
          </nav>

          {/* Logo */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <Link
              to="/"
              className="font-serif text-3xl tracking-wide text-atelier-dark hover:opacity-90"
            >
              Atelier
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-3 sm:space-x-5">

            {/* Search */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-atelier-dark hover:opacity-70 transition-opacity"
              aria-label="Search products"
            >
              <Search size={20} strokeWidth={1.5} />
            </button>

            {/* Desktop Auth */}
            {isAuthenticated ? (
              <div className="hidden sm:flex items-center space-x-3 font-mono text-sm tracking-wider text-atelier-dark">

                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="hover:opacity-75"
                  >
                    Admin Panel
                  </Link>
                )}

                <Link
                  to="/account"
                  className="flex items-center space-x-1 hover:opacity-75"
                >
                  <User size={18} strokeWidth={1.5} />
                  <span>
                    {user?.name ||
                      user?.email?.split('@')[0] ||
                      'Account'}
                  </span>
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

            {/* Mobile User Icon */}
            <Link
              to={isAuthenticated ? '/account' : '/login'}
              className="sm:hidden p-2 text-atelier-dark"
            >
              <User size={20} strokeWidth={1.5} />
            </Link>

            {/* Cart */}
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

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-atelier-beige border-b border-atelier-lightgray px-6 py-8 animate-fade-in">
            <nav className="flex flex-col space-y-6 font-mono text-sm tracking-[0.2em] uppercase">

              <Link
                to="/"
                className="text-atelier-dark border-b border-atelier-lightgray/40 pb-2"
              >
                Shop All
              </Link>

              <Link
                to="/?type=fashion"
                className="text-atelier-dark border-b border-atelier-lightgray/40 pb-2"
              >
                Fashion
              </Link>

              <Link
                to="/journal"
                className="text-atelier-dark border-b border-atelier-lightgray/40 pb-2"
              >
                Journal
              </Link>

              {isAuthenticated && user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="text-atelier-dark border-b border-atelier-lightgray/40 pb-2"
                >
                  Admin Dashboard
                </Link>
              )}

              {isAuthenticated ? (
                <>
                  <Link
                    to="/account"
                    className="text-atelier-dark border-b border-atelier-lightgray/40 pb-2"
                  >
                    My Account
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="text-left text-atelier-gray uppercase tracking-[0.2em]"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="text-atelier-dark"
                >
                  Sign In
                </Link>
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