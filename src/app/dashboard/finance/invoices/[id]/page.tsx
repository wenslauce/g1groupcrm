'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  FileText, 
  User, 
  Calendar,
  DollarSign,
  Download,
  Edit,
  Loader2,
  Send,
  CheckCircle
} from 'lucide-react'
import { InvoiceWithRelations } from '@/types'
import { financialUtils } from '@/lib/financial-utils'
import { formatCurrency, formatDateTime } from '@/lib/utils'

interface InvoiceDetailsPageProps {
  params: { id: string }
}

export default function InvoiceDetailsPage({ params }: InvoiceDetailsPageProps) {
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

  const handleGeneratePDF = async () => {
    if (!invoice) return
    
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'invoice',
          id: invoice.id
        })
      })

      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType === 'application/pdf') {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `Invoice-${invoice.invoice_number}.pdf`
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

  const handleStatusUpdate = async (newStatus: string) => {
    if (!invoice) return
    
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus
        })
      })

      if (response.ok) {
        fetchInvoice() // Refresh data
      } else {
        const error = await response.json()
        alert(`Failed to update status: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error updating status')
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

  if (error || !invoice) {
    return (
      <ProtectedRoute requiredRoles={['admin', 'finance', 'operations']}>
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
    <ProtectedRoute requiredRoles={['admin', 'finance', 'operations']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{invoice.invoice_number}</h1>
              <p className="text-muted-foreground">Invoice Details</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={financialUtils.getInvoiceStatusColor(invoice.status as any)}>
              {financialUtils.getInvoiceStatusDisplayName(invoice.status as any)}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/finance/invoices/${invoice.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={handleGeneratePDF}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Invoice Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Invoice Number</div>
                    <div className="text-lg font-mono font-bold">{invoice.invoice_number}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Status</div>
                    <Badge className={financialUtils.getInvoiceStatusColor(invoice.status as any)}>
                      {financialUtils.getInvoiceStatusDisplayName(invoice.status as any)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Amount</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Currency</div>
                    <div className="text-lg">{invoice.currency}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Issue Date</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDateTime(invoice.created_at)}
                    </div>
                  </div>
                  {invoice.due_date && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Due Date</div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDateTime(invoice.due_date)}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Client Information */}
            {invoice.client && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Client Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="text-lg font-semibold">{invoice.client.name}</div>
                      <div className="text-sm text-muted-foreground">{invoice.client.email}</div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Country:</span>
                      <span className="ml-2">{invoice.client.country}</span>
                    </div>
                    {invoice.client.phone && (
                      <div>
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="ml-2">{invoice.client.phone}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* SKR Information */}
            {invoice.skr && (
              <Card>
                <CardHeader>
                  <CardTitle>Related SKR</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{invoice.skr.skr_number}</div>
                      <div className="text-sm text-muted-foreground">
                        Status: {invoice.skr.status}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/dashboard/skrs/${invoice.skr.id}`}>
                        View SKR
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {invoice.status === 'draft' && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleStatusUpdate('sent')}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send Invoice
                  </Button>
                )}
                {invoice.status === 'sent' && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleStatusUpdate('paid')}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Paid
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleGeneratePDF}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {formatCurrency(invoice.amount, invoice.currency)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Amount</div>
                </div>
                
                {invoice.due_date && (
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Due Date</div>
                    <div className="font-medium">
                      {new Date(invoice.due_date).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}