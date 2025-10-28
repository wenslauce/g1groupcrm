import { ProtectedRoute } from '@/components/auth/protected-route'
import { CreditNoteList } from '@/components/credit-notes/credit-note-list'

export default function CreditNotesPage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'finance']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credit Notes</h1>
          <p className="text-muted-foreground">
            Create and manage credit notes for invoice adjustments and refunds
          </p>
        </div>

        <CreditNoteList />
      </div>
    </ProtectedRoute>
  )
}