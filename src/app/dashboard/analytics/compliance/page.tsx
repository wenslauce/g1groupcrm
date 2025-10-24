import { ProtectedRoute } from '@/components/auth/protected-route'
import { ComplianceAnalytics } from '@/components/analytics/compliance-analytics'

export default function ComplianceAnalyticsPage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'compliance']}>
      <ComplianceAnalytics />
    </ProtectedRoute>
  )
}