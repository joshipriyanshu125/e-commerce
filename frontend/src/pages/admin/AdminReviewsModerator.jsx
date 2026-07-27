import React from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { Star } from 'lucide-react'

const AdminReviewsModerator = () => (
  <AdminLayout title="Reviews">
    <div className="p-6 lg:p-8 flex items-center justify-center h-64">
      <div className="text-center text-white/20">
        <Star size={40} className="mx-auto mb-3" />
        <p className="text-sm">Review Moderation — Coming Soon</p>
      </div>
    </div>
  </AdminLayout>
)

export default AdminReviewsModerator
