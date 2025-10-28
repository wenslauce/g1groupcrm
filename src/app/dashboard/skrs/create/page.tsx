import { ProtectedRoute } from '@/components/auth/protected-route'
import { SKRForm } from '@/components/skrs/skr-form'

export default function CreateSKRPage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'finance', 'operations']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create SKR</h1>
          <p className="text-muted-foreground">
            Create a new Secure Keeper Receipt for asset custody
          </p>
        </div>

        <SKRForm />
      </div>
    </ProtectedRoute>
  )
}