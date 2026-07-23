import React from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import CartDrawer from '../cart/CartDrawer'
import AnnouncementBar from './AnnouncementBar'

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-atelier-beige flex flex-col">
      <AnnouncementBar />
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
      <CartDrawer />
    </div>
  )
}

export default MainLayout
