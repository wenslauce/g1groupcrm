import { ProtectedRoute } from '@/components/auth/protected-route'
import { AuditDashboard } from '@/components/audit/audit-dashboard'

export default function AuditPage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'compliance']}>
      <AuditDashboard />
    </ProtectedRoute>
  )
}