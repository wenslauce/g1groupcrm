import { ProtectedRoute } from '@/components/auth/protected-route'
import { ReportsDashboard } from '@/components/reports/reports-dashboard'

export default function ReportsPage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'finance', 'operations', 'compliance']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate and view comprehensive business reports
          </p>
        </div>

        <ReportsDashboard />
      </div>
    </ProtectedRoute>
  )
}