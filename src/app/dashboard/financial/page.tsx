import { ProtectedRoute } from '@/components/auth/protected-route'
import { FinancialDashboard } from '@/components/financial/financial-dashboard'

export default function FinancialPage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'finance', 'operations', 'compliance']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Management</h1>
          <p className="text-muted-foreground">
            Comprehensive financial document management and reporting
          </p>
        </div>

        <FinancialDashboard />
      </div>
    </ProtectedRoute>
  )
}