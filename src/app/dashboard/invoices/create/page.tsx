import { ProtectedRoute } from '@/components/auth/protected-route'
import { InvoiceForm } from '@/components/invoices/invoice-form'

export default function CreateInvoicePage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'finance']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Invoice</h1>
          <p className="text-muted-foreground">
            Generate a new invoice for client services
          </p>
        </div>

        <InvoiceForm />
      </div>
    </ProtectedRoute>
  )
}