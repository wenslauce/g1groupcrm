import { ProtectedRoute } from '@/components/auth/protected-route'
import { ComplianceDashboard } from '@/components/compliance/compliance-dashboard'

export default function CompliancePage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'compliance', 'finance', 'operations']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance Management</h1>
          <p className="text-muted-foreground">
            Comprehensive compliance monitoring, KYC management, and risk assessment
          </p>
        </div>

        <ComplianceDashboard />
      </div>
    </ProtectedRoute>
  )
}