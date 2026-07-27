import React from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { Settings } from 'lucide-react'

const AdminSettingsPanel = () => (
  <AdminLayout title="Settings">
    <div className="p-6 lg:p-8 flex items-center justify-center h-64">
      <div className="text-center text-white/20">
        <Settings size={40} className="mx-auto mb-3" />
        <p className="text-sm">Settings Panel — Coming Soon</p>
      </div>
    </div>
  </AdminLayout>
)

export default AdminSettingsPanel
