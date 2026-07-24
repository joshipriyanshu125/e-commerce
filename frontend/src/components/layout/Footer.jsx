import React, { useState } from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (email.trim() !== '') {
      setSubscribed(true)
      setEmail('')
      setTimeout(() => setSubscribed(false), 5000)
    }
  }

  return (
    <footer className="bg-atelier-beige border-t border-atelier-lightgray/80 pt-16 pb-8 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 pb-16">
        
        {/* Brand & Newsletter Column (6 cols wide on md) */}
        <div className="md:col-span-6 flex flex-col justify-between space-y-8">
          <div className="space-y-4 max-w-sm">
            <h3 className="font-serif text-3xl text-atelier-dark tracking-wide">Atelier</h3>
            <p className="text-atelier-gray text-xs sm:text-sm leading-relaxed font-light">
              Considered objects for a considered life. Fashion and electronics, chosen with care, built to outlast the season.
            </p>
          </div>

          {/* Email Subscription Form */}
          <div className="max-w-md w-full">
            {subscribed ? (
              <p className="font-mono text-xs sm:text-sm uppercase text-atelier-accent tracking-wider animate-pulse">
                Thank you for subscribing.
              </p>
            ) : (
              <form onSubmit={handleSubscribe} className="relative flex items-center border-b border-atelier-dark py-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="appearance-none bg-transparent border-none w-full text-atelier-dark mr-3 py-1 px-1 leading-tight focus:outline-none text-xs sm:text-sm font-light placeholder-atelier-gray/60"
                  aria-label="Email Address"
                />
                <button
                  type="submit"
                  className="flex-shrink-0 font-mono text-[10px] tracking-[0.15em] uppercase text-atelier-dark font-medium hover:opacity-75 transition-opacity"
                >
                  Subscribe &rarr;
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Spacer Column (2 cols) */}
        <div className="hidden md:block md:col-span-2"></div>

        {/* Links Navigation Columns (4 cols total) */}
        <div className="md:col-span-4 grid grid-cols-2 gap-8 text-[11px] font-mono tracking-widest uppercase">
          
          {/* Shop links */}
          <div className="space-y-4">
            <h4 className="text-atelier-gray/70 text-xs tracking-[0.2em] mb-6">Shop</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/?type=fashion" className="text-atelier-dark hover:opacity-70 transition-opacity">
                  Fashion
                </Link>
              </li>
              <li>
                <Link to="/?type=electronics" className="text-atelier-dark hover:opacity-70 transition-opacity">
                  Electronics
                </Link>
              </li>
              <li>
                <Link to="/" className="text-atelier-dark hover:opacity-70 transition-opacity">
                  All Products
                </Link>
              </li>
            </ul>
          </div>

          {/* House links */}
          <div className="space-y-4">
            <h4 className="text-atelier-gray/70 text-xs tracking-[0.2em] mb-6">House</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/journal" className="text-atelier-dark hover:opacity-70 transition-opacity">
                  Journal
                </Link>
              </li>
              <li>
                <Link to="/account" className="text-atelier-dark hover:opacity-70 transition-opacity">
                  Account
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-atelier-dark hover:opacity-70 transition-opacity">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/returns" className="text-atelier-dark hover:opacity-70 transition-opacity">
                  Returns
                </Link>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Copyright Footer */}
      <div className="max-w-7xl mx-auto border-t border-atelier-lightgray/40 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-atelier-gray font-mono tracking-widest uppercase gap-4">
        <div>
          &copy; 2026 Atelier Studio. All rights reserved.
        </div>
        <div className="flex space-x-6">
          <Link to="/privacy" className="hover:text-atelier-dark transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-atelier-dark transition-colors">Terms</Link>
          <Link to="/cookies" className="hover:text-atelier-dark transition-colors">Cookies</Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer
