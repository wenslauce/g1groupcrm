import { ProtectedRoute } from '@/components/auth/protected-route'
import { ClientList } from '@/components/clients/client-list'

export default function ClientsPage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'finance', 'operations', 'compliance']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Manage client profiles, compliance status, and business relationships
          </p>
        </div>

        <ClientList />
      </div>
    </ProtectedRoute>
  )
}