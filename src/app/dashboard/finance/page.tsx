import { ProtectedRoute } from '@/components/auth/protected-route'
import { FinancialDashboard } from '@/components/financial/financial-dashboard'

export default function FinancePage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'finance']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Operations</h1>
          <p className="text-muted-foreground">
            Manage invoices, receipts, credit notes, and financial reporting
          </p>
        </div>

        <FinancialDashboard />
      </div>
    </ProtectedRoute>
  )
}