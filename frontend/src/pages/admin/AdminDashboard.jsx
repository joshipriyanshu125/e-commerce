import React from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { LayoutDashboard } from 'lucide-react'

const AdminDashboard = () => (
  <AdminLayout title="Dashboard">
    <div className="p-6 lg:p-8 flex items-center justify-center h-64">
      <div className="text-center text-white/20">
        <LayoutDashboard size={40} className="mx-auto mb-3" />
        <p className="text-sm">Dashboard Analytics — Coming Soon</p>
      </div>
    </div>
  </AdminLayout>
)

export default AdminDashboard
