import { ProtectedRoute } from '@/components/auth/protected-route'
import { SystemSettings } from '@/components/admin'

export default function SettingsPage() {
  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <SystemSettings />
    </ProtectedRoute>
  )
}