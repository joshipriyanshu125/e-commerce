import React from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { ShoppingCart } from 'lucide-react'

const AdminOrdersManager = () => (
  <AdminLayout title="Orders">
    <div className="p-6 lg:p-8 flex items-center justify-center h-64">
      <div className="text-center text-white/20">
        <ShoppingCart size={40} className="mx-auto mb-3" />
        <p className="text-sm">Order Management — Coming Soon</p>
      </div>
    </div>
  </AdminLayout>
)

export default AdminOrdersManager
