import React from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom'

import MainLayout from './components/layout/MainLayout'

// Pages
import Home from './pages/Home'
import Shop from './pages/Shop'
import Login from './pages/Login'
import Register from './pages/Register'
import ProductDetails from './pages/ProductDetails'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Account from './pages/Account'
import Journal from './pages/Journal'
import MyOrders from './pages/MyOrders'
import OrderDetails from './pages/OrderDetails'
import InvoicePreview from './pages/InvoicePreview'
import NotFound from './pages/NotFound'

// Route Protection
import ProtectedRoute from './components/routes/ProtectedRoute'
import AdminRoute from './components/routes/AdminRoute'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProductsManager from './pages/admin/AdminProductsManager'
import AdminProductForm from './pages/admin/AdminProductForm'
import AdminOrdersManager from './pages/admin/AdminOrdersManager'
import AdminUsersManager from './pages/admin/AdminUsersManager'
import AdminReviewsModerator from './pages/admin/AdminReviewsModerator'
import AdminCouponsManager from './pages/admin/AdminCouponsManager'
import AdminNotificationsPanel from './pages/admin/AdminNotificationsPanel'
import AdminSettingsPanel from './pages/admin/AdminSettingsPanel'
import AdminCategoriesManager from './pages/admin/AdminCategoriesManager'
import AdminInvoiceHistory from './pages/admin/AdminInvoiceHistory'

function App() {
  return (
    <Router>
      <Routes>
        {/* =========================
            Public Routes (inside MainLayout)
        ========================= */}
        <Route element={<MainLayout><></></MainLayout>} path="__never__" />

        <Route path="/" element={<MainLayout><Home /></MainLayout>} />
        <Route path="/shop" element={<MainLayout><Shop /></MainLayout>} />
        <Route path="/shop/:slug" element={<MainLayout><Shop /></MainLayout>} />
        <Route path="/journal" element={<MainLayout><Journal /></MainLayout>} />
        <Route path="/login" element={<MainLayout><Login /></MainLayout>} />
        <Route path="/register" element={<MainLayout><Register /></MainLayout>} />
        <Route path="/product/:id" element={<MainLayout><ProductDetails /></MainLayout>} />
        <Route path="/cart" element={<MainLayout><Cart /></MainLayout>} />

        {/* =========================
            Protected Routes
        ========================= */}
        <Route
          path="/checkout"
          element={<MainLayout><ProtectedRoute><Checkout /></ProtectedRoute></MainLayout>}
        />
        <Route
          path="/account"
          element={<MainLayout><ProtectedRoute><Account /></ProtectedRoute></MainLayout>}
        />
        <Route
          path="/orders"
          element={<MainLayout><ProtectedRoute><MyOrders /></ProtectedRoute></MainLayout>}
        />
        <Route
          path="/orders/:id"
          element={<MainLayout><ProtectedRoute><OrderDetails /></ProtectedRoute></MainLayout>}
        />
        <Route
          path="/invoice/:orderId"
          element={<MainLayout><ProtectedRoute><InvoicePreview /></ProtectedRoute></MainLayout>}
        />

        {/* =========================
            Admin Routes (own AdminLayout — no MainLayout wrapper)
        ========================= */}
        <Route
          path="/admin"
          element={<AdminRoute><AdminDashboard /></AdminRoute>}
        />
        <Route
          path="/admin/products"
          element={<AdminRoute><AdminProductsManager /></AdminRoute>}
        />
        <Route
          path="/admin/products/new"
          element={<AdminRoute><AdminProductForm /></AdminRoute>}
        />
        <Route
          path="/admin/products/:id"
          element={<AdminRoute><AdminProductForm /></AdminRoute>}
        />
        <Route
          path="/admin/orders"
          element={<AdminRoute><AdminOrdersManager /></AdminRoute>}
        />
        <Route
          path="/admin/users"
          element={<AdminRoute><AdminUsersManager /></AdminRoute>}
        />
        <Route
          path="/admin/reviews"
          element={<AdminRoute><AdminReviewsModerator /></AdminRoute>}
        />
        <Route
          path="/admin/coupons"
          element={<AdminRoute><AdminCouponsManager /></AdminRoute>}
        />
        <Route
          path="/admin/notifications"
          element={<AdminRoute><AdminNotificationsPanel /></AdminRoute>}
        />
        <Route
          path="/admin/settings"
          element={<AdminRoute><AdminSettingsPanel /></AdminRoute>}
        />
        <Route
          path="/admin/invoices"
          element={<AdminRoute><AdminInvoiceHistory /></AdminRoute>}
        />
        <Route
          path="/admin/categories"
          element={<AdminRoute><AdminCategoriesManager /></AdminRoute>}
        />

        {/* =========================
            404
        ========================= */}
        <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
      </Routes>
    </Router>
  )
}

export default App