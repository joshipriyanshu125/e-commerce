import React from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom'

import MainLayout from './components/layout/MainLayout'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ProductDetails from './pages/ProductDetails'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Account from './pages/Account'
import Journal from './pages/Journal'
import NotFound from './pages/NotFound'

// Route Protection
import ProtectedRoute from './components/routes/ProtectedRoute'
import AdminRoute from './components/routes/AdminRoute'

// Future Admin Dashboard
// import AdminDashboard from './admin/Dashboard'

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          {/* =========================
              Public Routes
          ========================= */}
          <Route path="/" element={<Home />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />

          {/* =========================
              Protected Routes
          ========================= */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />

          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />

          {/* =========================
              Admin Routes (Enable Later)
          ========================= */}

          {/*
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          */}

          {/* =========================
              404 Page
          ========================= */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MainLayout>
    </Router>
  )
}

export default App