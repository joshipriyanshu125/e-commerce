import React from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { Users } from 'lucide-react'

const AdminUsersManager = () => (
  <AdminLayout title="Users">
    <div className="p-6 lg:p-8 flex items-center justify-center h-64">
      <div className="text-center text-white/20">
        <Users size={40} className="mx-auto mb-3" />
        <p className="text-sm">User Management — Coming Soon</p>
      </div>
    </div>
  </AdminLayout>
)

export default AdminUsersManager
