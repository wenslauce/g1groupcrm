import { ProtectedRoute } from '@/components/auth/protected-route'
import { MonitoringDashboard } from '@/components/monitoring'

export default function MonitoringPage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'operations', 'compliance']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time system health and performance monitoring
          </p>
        </div>

        <MonitoringDashboard />
      </div>
    </ProtectedRoute>
  )
}