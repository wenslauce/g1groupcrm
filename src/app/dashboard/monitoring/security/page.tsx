import { ProtectedRoute } from '@/components/auth/protected-route'
import { SecurityMonitor } from '@/components/monitoring/security-monitor'

export default function SecurityMonitoringPage() {
  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <SecurityMonitor />
    </ProtectedRoute>
  )
}