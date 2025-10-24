import { ProtectedRoute } from '@/components/auth/protected-route'
import { SKRForm } from '@/components/skrs/skr-form'

export default function CreateSKRPage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'finance', 'operations']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New SKR</h1>
          <p className="text-muted-foreground">
            Generate a new Secure Keeper Receipt for client assets
          </p>
        </div>

        <SKRForm />
      </div>
    </ProtectedRoute>
  )
}