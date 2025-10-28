'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Save, 
  X, 
  Loader2, 
  Receipt, 
  FileText,
  CreditCard
} from 'lucide-react'
import { InvoiceWithRelations } from '@/types'
import { financialUtils } from '@/lib/financial-utils'
import { formatCurrency, formatDateTime } from '@/lib/utils'

interface ReceiptFormProps {
  invoice?: InvoiceWithRelations | null
  onSave?: () => void
  onCancel?: () => void
}

export function ReceiptForm({ invoice, onSave, onCancel }: ReceiptFormProps) {
  const [formData, setFormData] = useState({
    invoice_id: '',
    amount: 0,
    payment_method: 'bank_transfer',
    payment_reference: '',
    payment_date: new Date().toISOString().slice(0, 16),
    notes: ''
  })
  const [invoices, setInvoices] = useState<InvoiceWithRelations[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithRelations | null>(null)
  const [remainingAmount, setRemainingAmount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const router = useRouter()

  useEffect(() => {
    if (invoice) {
      setFormData(prev => ({
        ...prev,
        invoice_id: invoice.id,
        amount: invoice.amount
      }))
      setSelectedInvoice(invoice)
      setRemainingAmount(invoice.amount)
    } else {
      fetchInvoices()
    }
  }, [invoice])

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/invoices?status=sent&status=overdue&limit=100')
      const result = await response.json()
      
      if (response.ok) {
        const payableInvoices = result.data.filter(
          (inv: InvoiceWithRelations) => ['sent', 'overdue'].includes(inv.status)
        )
        setInvoices(payableInvoices)
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
    }
  }

  const handleInvoiceChange = (invoiceId: string) => {
    const selectedInv = invoices.find(inv => inv.id === invoiceId)
    if (selectedInv) {
      setSelectedInvoice(selectedInv)
      setFormData(prev => ({
        ...prev,
        invoice_id: invoiceId,
        amount: selectedInv.amount
      }))
      setRemainingAmount(selectedInv.amount)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/receipts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          payment_date: new Date(formData.payment_date).toISOString()
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create receipt')
      }

      setSuccess('Receipt created successfully!')
      
      if (onSave) {
        setTimeout(() => onSave(), 1000)
      } else {
        setTimeout(() => {
          router.push('/dashboard/finance/receipts')
        }, 1000)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Record Payment Receipt
            </CardTitle>
            <CardDescription>
              Record a payment received for an invoice
            </CardDescription>
          </div>
          {onCancel && (
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invoice Selection */}
          {!invoice && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-4 w-4" />
                <h3 className="text-lg font-medium">Invoice Information</h3>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="invoice_id">Invoice *</Label>
                <Select
                  value={formData.invoice_id}
                  onValueChange={handleInvoiceChange}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an invoice" />
                  </SelectTrigger>
                  <SelectContent>
                    {invoices.map((inv) => (
                      <SelectItem key={inv.id} value={inv.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{inv.invoice_number}</span>
                          <Badge className={financialUtils.getInvoiceStatusColor(inv.status)}>
                            {financialUtils.getInvoiceStatusDisplayName(inv.status)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(inv.amount, inv.currency)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Selected Invoice Details */}
          {selectedInvoice && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-3">Invoice Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Invoice Number:</span>
                  <div className="font-medium">{selectedInvoice.invoice_number}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Client:</span>
                  <div className="font-medium">{selectedInvoice.client?.name}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Invoice Amount:</span>
                  <div className="font-medium">{formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge className={financialUtils.getInvoiceStatusColor(selectedInvoice.status)}>
                    {financialUtils.getInvoiceStatusDisplayName(selectedInvoice.status)}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Payment Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-4 w-4" />
              <h3 className="text-lg font-medium">Payment Details</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => updateFormData('amount', parseFloat(e.target.value) || 0)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">Payment Method *</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => updateFormData('payment_method', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="debit_card">Debit Card</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="wire_transfer">Wire Transfer</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_reference">Payment Reference</Label>
                <Input
                  id="payment_reference"
                  value={formData.payment_reference}
                  onChange={(e) => updateFormData('payment_reference', e.target.value)}
                  placeholder="Transaction ID, check number, etc."
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_date">Payment Date *</Label>
                <Input
                  id="payment_date"
                  type="datetime-local"
                  value={formData.payment_date}
                  onChange={(e) => updateFormData('payment_date', e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateFormData('notes', e.target.value)}
              placeholder="Additional notes about this payment"
              rows={3}
              disabled={isLoading}
            />
          </div>

          {success && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
              {success}
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading || !formData.invoice_id || formData.amount <= 0}
              className="bg-g1-primary hover:bg-g1-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording Payment...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Record Payment
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}