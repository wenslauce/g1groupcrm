import { ProtectedRoute } from '@/components/auth/protected-route'
import { KYCPendingList } from '@/components/clients/kyc-pending-list'

export default function KYCPendingPage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'finance', 'compliance']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">KYC Pending</h1>
          <p className="text-muted-foreground">
            Review and manage clients with pending KYC documentation
          </p>
        </div>

        <KYCPendingList />
      </div>
    </ProtectedRoute>
  )
}