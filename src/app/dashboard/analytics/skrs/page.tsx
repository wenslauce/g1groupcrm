import { ProtectedRoute } from '@/components/auth/protected-route'
import { SKRAnalytics } from '@/components/analytics/skr-analytics'

export default function SKRAnalyticsPage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'finance', 'operations', 'compliance']}>
      <SKRAnalytics />
    </ProtectedRoute>
  )
}