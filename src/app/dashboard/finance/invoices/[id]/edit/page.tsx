'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { InvoiceForm } from '@/components/invoices/invoice-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { InvoiceWithRelations } from '@/types'

interface EditInvoicePageProps {
  params: { id: string }
}

export default function EditInvoicePage({ params }: EditInvoicePageProps) {
  const [invoice, setInvoice] = useState<InvoiceWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchInvoice()
  }, [params.id])

  const fetchInvoice = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/invoices/${params.id}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch invoice')
      }
      
      setInvoice(result.data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    router.push(`/dashboard/finance/invoices/${params.id}`)
  }

  const handleCancel = () => {
    router.back()
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={['admin', 'finance']}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !invoice) {
    return (
      <ProtectedRoute requiredRoles={['admin', 'finance']}>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Invoice Not Found</h1>
              <p className="text-muted-foreground">{error || 'The requested invoice could not be found'}</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['admin', 'finance']}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Invoice</h1>
            <p className="text-muted-foreground">
              Update invoice details for {invoice.invoice_number}
            </p>
          </div>
        </div>

        <InvoiceForm invoiceId={params.id} />
      </div>
    </ProtectedRoute>
  )
}