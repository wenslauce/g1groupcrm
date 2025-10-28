'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  FileText, 
  Calendar,
  Download,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { CreditNoteWithRelations } from '@/types'
import { formatCurrency, formatDateTime } from '@/lib/utils'

interface CreditNoteDetailsPageProps {
  params: { id: string }
}

export default function CreditNoteDetailsPage({ params }: CreditNoteDetailsPageProps) {
  const [creditNote, setCreditNote] = useState<CreditNoteWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchCreditNote()
  }, [params.id])

  const fetchCreditNote = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/credit-notes/${params.id}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch credit note')
      }
      
      setCreditNote(result.data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePDF = async () => {
    if (!creditNote) return
    
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'credit_note',
          id: creditNote.id
        })
      })

      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType === 'application/pdf') {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `CreditNote-${creditNote.credit_note_number}.pdf`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        } else {
          const result = await response.json()
          alert(result.message || 'PDF generation not available')
        }
      } else {
        const error = await response.json()
        alert(`Failed to generate PDF: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF')
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={['admin', 'finance', 'operations']}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !creditNote) {
    return (
      <ProtectedRoute requiredRoles={['admin', 'finance', 'operations']}>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Credit Note Not Found</h1>
              <p className="text-muted-foreground">{error || 'The requested credit note could not be found'}</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['admin', 'finance', 'operations']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{creditNote.credit_note_number}</h1>
              <p className="text-muted-foreground">Credit Note Details</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleGeneratePDF}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Credit Note Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Credit Note Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Credit Note Number</div>
                    <div className="text-lg font-mono font-bold">{creditNote.credit_note_number}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Amount</div>
                    <div className="text-2xl font-bold text-red-600">
                      -{formatCurrency(creditNote.amount, 'USD')}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Issue Date</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDateTime(creditNote.issue_date)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Reason</div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {creditNote.reason}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Related Invoice */}
            {creditNote.invoice && (
              <Card>
                <CardHeader>
                  <CardTitle>Related Invoice</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{creditNote.invoice.invoice_number}</div>
                      <div className="text-sm text-muted-foreground">
                        Original Amount: {formatCurrency(creditNote.invoice.amount, creditNote.invoice.currency)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Status: {creditNote.invoice.status}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/dashboard/finance/invoices/${creditNote.invoice.id}`}>
                        View Invoice
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Credit Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Credit Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    -{formatCurrency(creditNote.amount, 'USD')}
                  </div>
                  <div className="text-sm text-muted-foreground">Credit Amount</div>
                </div>
                
                <Separator />
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reason:</span>
                    <span>{creditNote.reason}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Issue Date:</span>
                    <span>{new Date(creditNote.issue_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleGeneratePDF}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                {creditNote.invoice && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    asChild
                  >
                    <a href={`/dashboard/finance/invoices/${creditNote.invoice.id}`}>
                      <FileText className="mr-2 h-4 w-4" />
                      View Original Invoice
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}