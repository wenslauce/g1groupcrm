import { ProtectedRoute } from '@/components/auth/protected-route'
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard'

export default function AnalyticsPage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'finance', 'operations', 'compliance']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Business intelligence and performance analytics
          </p>
        </div>

        <AnalyticsDashboard />
      </div>
    </ProtectedRoute>
  )
}