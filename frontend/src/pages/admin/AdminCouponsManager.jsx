import React from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { Tag } from 'lucide-react'

const AdminCouponsManager = () => (
  <AdminLayout title="Coupons">
    <div className="p-6 lg:p-8 flex items-center justify-center h-64">
      <div className="text-center text-white/20">
        <Tag size={40} className="mx-auto mb-3" />
        <p className="text-sm">Coupon Management — Coming Soon</p>
      </div>
    </div>
  </AdminLayout>
)

export default AdminCouponsManager
