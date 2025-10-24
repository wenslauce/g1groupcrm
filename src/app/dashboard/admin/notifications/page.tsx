import { ProtectedRoute } from '@/components/auth/protected-route'
import { NotificationManagement } from '@/components/notifications/notification-management'

export default function NotificationManagementPage() {
  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <NotificationManagement />
    </ProtectedRoute>
  )
}