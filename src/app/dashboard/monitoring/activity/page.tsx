import { ProtectedRoute } from '@/components/auth/protected-route'
import { ActivityMonitor } from '@/components/monitoring/activity-monitor'

export default function ActivityMonitoringPage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'compliance']}>
      <ActivityMonitor />
    </ProtectedRoute>
  )
}