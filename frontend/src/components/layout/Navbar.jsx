import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Search, ShoppingBag, User, LogOut, Menu, X } from 'lucide-react'
import { toggleCart } from '../../features/cart/cartSlice'
import { logout } from '../../features/auth/authSlice'
import SearchModal from '../common/SearchModal'

const Navbar = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const location = useLocation()
  
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const { user, isAuthenticated } = useSelector(state => state.auth)
  const { items } = useSelector(state => state.cart)
  
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0)

  const handleCartClick = () => {
    dispatch(toggleCart())
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
  }

  const activeLinkClass = (path) => {
    return location.pathname === path 
      ? "text-atelier-dark font-medium border-b border-atelier-dark pb-0.5" 
      : "text-atelier-gray hover:text-atelier-dark pb-0.5"
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-atelier-beige/90 backdrop-blur-md border-b border-atelier-lightgray/50 transition-all duration-300">
        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Mobile Menu Button (Hamburger) */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-atelier-dark hover:opacity-75"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Left Navigation (Desktop) */}
          <nav className="hidden md:flex items-center space-x-8 font-mono text-[10px] tracking-[0.2em] uppercase">
            <Link to="/" className={activeLinkClass('/')}>
              Shop All
            </Link>
            <Link to="/?type=fashion" className={activeLinkClass('/?type=fashion')}>
              Fashion
            </Link>
            <Link to="/?type=electronics" className={activeLinkClass('/?type=electronics')}>
              Electronics
            </Link>
            <Link to="/journal" className={activeLinkClass('/journal')}>
              Journal
            </Link>
          </nav>

          {/* Center Brand Name */}
          <div className="absolute left-1/2 -translate-x-1/2 flex justify-center">
            <Link to="/" className="font-serif text-3xl tracking-wide text-atelier-dark hover:opacity-90">
              Atelier
            </Link>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            {/* Search Icon */}
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-atelier-dark hover:opacity-70 transition-opacity"
              aria-label="Search products"
            >
              <Search size={20} strokeWidth={1.5} />
            </button>

            {/* Auth section */}
            {isAuthenticated ? (
              <div className="hidden sm:flex items-center space-x-3 font-mono text-[10px] tracking-wider text-atelier-dark">
                <Link to="/account" className="flex items-center space-x-1 hover:opacity-75">
                  <User size={18} strokeWidth={1.5} />
                  <span>{user?.name || user?.email?.split('@')[0] || 'Account'}</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-atelier-gray hover:text-atelier-dark"
                  title="Sign out"
                >
                  <LogOut size={16} strokeWidth={1.5} />
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="hidden sm:inline-block px-4 py-1.5 border border-atelier-dark text-[10px] tracking-widest uppercase font-mono bg-transparent hover:bg-atelier-dark hover:text-white transition-colors duration-200"
              >
                Sign in
              </Link>
            )}

            {/* Mobile Auth shortcut */}
            {isAuthenticated ? (
              <Link to="/account" className="sm:hidden p-2 text-atelier-dark">
                <User size={20} strokeWidth={1.5} />
              </Link>
            ) : (
              <Link to="/login" className="sm:hidden p-2 text-atelier-dark">
                <User size={20} strokeWidth={1.5} />
              </Link>
            )}

            {/* Bag Icon */}
            <button 
              onClick={handleCartClick}
              className="p-2 text-atelier-dark hover:opacity-70 transition-opacity relative"
              aria-label="Cart"
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-atelier-dark text-atelier-beige text-[8px] font-mono h-4 w-4 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-atelier-beige border-b border-atelier-lightgray px-6 py-8 animate-fade-in">
            <nav className="flex flex-col space-y-6 font-mono text-xs tracking-[0.2em] uppercase">
              <Link 
                to="/" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-atelier-dark border-b border-atelier-lightgray/40 pb-2"
              >
                Shop All
              </Link>
              <Link 
                to="/?type=fashion" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-atelier-dark border-b border-atelier-lightgray/40 pb-2"
              >
                Fashion
              </Link>
              <Link 
                to="/?type=electronics" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-atelier-dark border-b border-atelier-lightgray/40 pb-2"
              >
                Electronics
              </Link>
              <Link 
                to="/journal" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-atelier-dark border-b border-atelier-lightgray/40 pb-2"
              >
                Journal
              </Link>
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/account" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-atelier-dark border-b border-atelier-lightgray/40 pb-2"
                  >
                    My Account
                  </Link>
                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      handleLogout()
                    }}
                    className="text-left text-atelier-gray pb-2 uppercase tracking-[0.2em]"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link 
                  to="/login" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-atelier-dark"
                >
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Global Search Overlay */}
      {isSearchOpen && (
        <SearchModal onClose={() => setIsSearchOpen(false)} />
      )}
    </>
  )
}

export default Navbar
