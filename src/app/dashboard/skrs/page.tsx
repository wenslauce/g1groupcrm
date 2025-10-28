import { ProtectedRoute } from '@/components/auth/protected-route'
import { SKRList } from '@/components/skrs/skr-list'

export default function SKRsPage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'finance', 'operations', 'compliance']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SKR Management</h1>
          <p className="text-muted-foreground">
            Manage Secure Keeper Receipts and track asset custody
          </p>
        </div>

        <SKRList />
      </div>
    </ProtectedRoute>
  )
}
