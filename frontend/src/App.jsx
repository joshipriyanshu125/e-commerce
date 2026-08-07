import React, { Suspense, lazy } from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom'

import MainLayout from './components/layout/MainLayout'
import RouteLoader from './components/common/RouteLoader'
import RouteSeo from './components/common/RouteSeo'

// Pages
const Home = lazy(() => import('./pages/Home'))
const Shop = lazy(() => import('./pages/Shop'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ProductDetails = lazy(() => import('./pages/ProductDetails'))
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const Account = lazy(() => import('./pages/Account'))
const Journal = lazy(() => import('./pages/Journal'))
const MyOrders = lazy(() => import('./pages/MyOrders'))
const OrderDetails = lazy(() => import('./pages/OrderDetails'))
const InvoicePreview = lazy(() => import('./pages/InvoicePreview'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Wishlist = lazy(() => import('./pages/Wishlist'))
const Notifications = lazy(() => import('./pages/Notifications'))
import ToastHost from './components/common/ToastHost'

// Route Protection
import ProtectedRoute from './components/routes/ProtectedRoute'
import AdminRoute from './components/routes/AdminRoute'

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminProductsManager = lazy(() => import('./pages/admin/AdminProductsManager'))
const AdminProductForm = lazy(() => import('./pages/admin/AdminProductForm'))
const AdminOrdersManager = lazy(() => import('./pages/admin/AdminOrdersManager'))
const AdminUsersManager = lazy(() => import('./pages/admin/AdminUsersManager'))
const AdminReviewsModerator = lazy(() => import('./pages/admin/AdminReviewsModerator'))
const AdminCouponsManager = lazy(() => import('./pages/admin/AdminCouponsManager'))
const AdminNotificationsPanel = lazy(() => import('./pages/admin/AdminNotificationsPanel'))
const AdminSettingsPanel = lazy(() => import('./pages/admin/AdminSettingsPanel'))
const AdminCategoriesManager = lazy(() => import('./pages/admin/AdminCategoriesManager'))
const AdminInvoiceHistory = lazy(() => import('./pages/admin/AdminInvoiceHistory'))

function App() {
  return (
    <Router>
      <RouteSeo />
      <ToastHost />
      <Suspense fallback={<RouteLoader />}>
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
            path="/wishlist"
            element={<MainLayout><ProtectedRoute><Wishlist /></ProtectedRoute></MainLayout>}
          />
          <Route
            path="/notifications"
            element={<MainLayout><ProtectedRoute><Notifications /></ProtectedRoute></MainLayout>}
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
      </Suspense>
    </Router>
  )
}

export default App
