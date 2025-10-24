import { ProtectedRoute } from '@/components/auth/protected-route'
import { FinancialAnalytics } from '@/components/analytics/financial-analytics'

export default function FinancialAnalyticsPage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'finance']}>
      <FinancialAnalytics />
    </ProtectedRoute>
  )
}