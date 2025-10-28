import { ProtectedRoute } from '@/components/auth/protected-route'
import { ClientForm } from '@/components/clients/client-form'

export default function CreateClientPage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'finance']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Client</h1>
          <p className="text-muted-foreground">
            Add a new client to the system with contact and compliance details
          </p>
        </div>

        <ClientForm />
      </div>
    </ProtectedRoute>
  )
}