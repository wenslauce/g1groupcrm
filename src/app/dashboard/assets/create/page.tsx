import { ProtectedRoute } from '@/components/auth/protected-route'
import { AssetForm } from '@/components/assets/asset-form'

export default function CreateAssetPage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'operations']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Asset</h1>
          <p className="text-muted-foreground">
            Add a new asset to your inventory
          </p>
        </div>

        <AssetForm />
      </div>
    </ProtectedRoute>
  )
}