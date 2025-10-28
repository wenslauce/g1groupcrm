'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  FileText, 
  Calendar,
  DollarSign,
  Download,
  Edit,
  Loader2,
  CreditCard
} from 'lucide-react'
import { ReceiptWithRelations } from '@/types'
import { formatCurrency, formatDateTime } from '@/lib/utils'

interface ReceiptDetailsPageProps {
  params: { id: string }
}

export default function ReceiptDetailsPage({ params }: ReceiptDetailsPageProps) {
  const [receipt, setReceipt] = useState<ReceiptWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchReceipt()
  }, [params.id])

  const fetchReceipt = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/receipts/${params.id}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch receipt')
      }
      
      setReceipt(result.data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePDF = async () => {
    if (!receipt) return
    
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'receipt',
          id: receipt.id
        })
      })

      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType === 'application/pdf') {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `Receipt-${receipt.receipt_number}.pdf`
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

  if (error || !receipt) {
    return (
      <ProtectedRoute requiredRoles={['admin', 'finance', 'operations']}>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Receipt Not Found</h1>
              <p className="text-muted-foreground">{error || 'The requested receipt could not be found'}</p>
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
              <h1 className="text-3xl font-bold tracking-tight">{receipt.receipt_number}</h1>
              <p className="text-muted-foreground">Payment Receipt Details</p>
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
            {/* Receipt Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Receipt Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Receipt Number</div>
                    <div className="text-lg font-mono font-bold">{receipt.receipt_number}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Amount</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(receipt.amount, 'USD')}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Payment Method</div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      {receipt.payment_method}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Issue Date</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDateTime(receipt.issue_date)}
                    </div>
                  </div>
                  {receipt.payment_reference && (
                    <div className="space-y-2 md:col-span-2">
                      <div className="text-sm font-medium text-muted-foreground">Payment Reference</div>
                      <div className="font-mono text-sm bg-muted p-2 rounded">
                        {receipt.payment_reference}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Related Invoice */}
            {receipt.invoice && (
              <Card>
                <CardHeader>
                  <CardTitle>Related Invoice</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{receipt.invoice.invoice_number}</div>
                      <div className="text-sm text-muted-foreground">
                        Amount: {formatCurrency(receipt.invoice.amount, receipt.invoice.currency)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Status: {receipt.invoice.status}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/dashboard/finance/invoices/${receipt.invoice.id}`}>
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
            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(receipt.amount, 'USD')}
                  </div>
                  <div className="text-sm text-muted-foreground">Amount Received</div>
                </div>
                
                <Separator />
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Method:</span>
                    <span>{receipt.payment_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date Received:</span>
                    <span>{new Date(receipt.issue_date).toLocaleDateString()}</span>
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
                {receipt.invoice && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    asChild
                  >
                    <a href={`/dashboard/finance/invoices/${receipt.invoice.id}`}>
                      <FileText className="mr-2 h-4 w-4" />
                      View Invoice
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