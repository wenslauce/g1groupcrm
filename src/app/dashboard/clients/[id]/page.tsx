import { ProtectedRoute } from '@/components/auth/protected-route'
import { ClientProfile } from '@/components/clients/client-profile'

interface ClientProfilePageProps {
  params: {
    id: string
  }
}

export default function ClientProfilePage({ params }: ClientProfilePageProps) {
  return (
    <ProtectedRoute requiredRoles={['admin', 'finance', 'operations', 'compliance']}>
      <ClientProfile clientId={params.id} />
    </ProtectedRoute>
  )
}