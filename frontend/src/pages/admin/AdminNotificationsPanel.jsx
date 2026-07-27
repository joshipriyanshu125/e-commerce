import React from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { Bell } from 'lucide-react'

const AdminNotificationsPanel = () => (
  <AdminLayout title="Notifications">
    <div className="p-6 lg:p-8 flex items-center justify-center h-64">
      <div className="text-center text-white/20">
        <Bell size={40} className="mx-auto mb-3" />
        <p className="text-sm">Notifications Panel — Coming Soon</p>
      </div>
    </div>
  </AdminLayout>
)

export default AdminNotificationsPanel
