import { ProtectedRoute } from '@/components/auth/protected-route'
import { ReceiptList } from '@/components/receipts/receipt-list'

export default function ReceiptsPage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'finance']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receipts</h1>
          <p className="text-muted-foreground">
            View and manage payment receipts for invoices
          </p>
        </div>

        <ReceiptList />
      </div>
    </ProtectedRoute>
  )
}