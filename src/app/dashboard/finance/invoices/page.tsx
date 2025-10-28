import { ProtectedRoute } from '@/components/auth/protected-route'
import { InvoiceList } from '@/components/invoices/invoice-list'

export default function InvoicesPage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'finance']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Create, manage, and track invoices for clients and SKRs
          </p>
        </div>

        <InvoiceList />
      </div>
    </ProtectedRoute>
  )
}