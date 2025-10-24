import { ProtectedRoute } from '@/components/auth/protected-route'
import { MainDashboard } from '@/components/dashboard/main-dashboard'

export default function DashboardPage() {

  return (
    <ProtectedRoute>
      <MainDashboard />
    </ProtectedRoute>
  )
}