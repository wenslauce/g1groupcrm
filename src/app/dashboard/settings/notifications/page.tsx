import { ProtectedRoute } from '@/components/auth/protected-route'
import { NotificationPreferences } from '@/components/notifications/notification-preferences'

export default function NotificationSettingsPage() {
  return (
    <ProtectedRoute>
      <NotificationPreferences />
    </ProtectedRoute>
  )
}