import { ProtectedRoute } from '@/components/auth/protected-route'
import { AssetList } from '@/components/assets/asset-list'

export default function AssetsPage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'operations']}>
      <AssetList />
    </ProtectedRoute>
  )
}