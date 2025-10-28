import { ProtectedRoute } from '@/components/auth/protected-route'
import { ReceiptForm } from '@/components/receipts/receipt-form'

export default function CreateReceiptPage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'finance']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Receipt</h1>
          <p className="text-muted-foreground">
            Record a payment receipt for an invoice
          </p>
        </div>

        <ReceiptForm />
      </div>
    </ProtectedRoute>
  )
}