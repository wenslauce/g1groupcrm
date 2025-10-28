import { ProtectedRoute } from '@/components/auth/protected-route'
import { CreditNoteForm } from '@/components/credit-notes/credit-note-form'

export default function CreateCreditNotePage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'finance']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Credit Note</h1>
          <p className="text-muted-foreground">
            Issue a credit note for refunds or adjustments
          </p>
        </div>

        <CreditNoteForm />
      </div>
    </ProtectedRoute>
  )
}