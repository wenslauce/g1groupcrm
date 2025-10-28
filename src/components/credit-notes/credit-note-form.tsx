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
    FileText,
    User,
    AlertTriangle,
    Minus
} from 'lucide-react'
import { InvoiceWithRelations, ClientWithRelations } from '@/types'
import { CreditNoteFormData } from '@/lib/validations/financial'
import { financialUtils } from '@/lib/financial-utils'
import { formatCurrency, formatDateTime } from '@/lib/utils'

interface CreditNoteFormProps {
    invoice?: InvoiceWithRelations | null
    onSave?: () => void
    onCancel?: () => void
}

export function CreditNoteForm({ invoice, onSave, onCancel }: CreditNoteFormProps) {
    const [formData, setFormData] = useState<CreditNoteFormData>({
        invoice_id: '',
        client_id: '',
        amount: 0,
        currency: 'USD',
        reason: 'error',
        description: '',
        notes: '',
        metadata: {}
    })
    const [invoices, setInvoices] = useState<InvoiceWithRelations[]>([])
    const [clients, setClients] = useState<ClientWithRelations[]>([])
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithRelations | null>(null)
    const [selectedClient, setSelectedClient] = useState<ClientWithRelations | null>(null)
    const [maxCreditAmount, setMaxCreditAmount] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingInvoices, setIsLoadingInvoices] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const router = useRouter()

    useEffect(() => {
        if (invoice) {
            // Pre-populate with invoice data
            setFormData({
                invoice_id: invoice.id,
                client_id: invoice.client_id || '',
                amount: 0,
                currency: invoice.currency || 'USD',
                reason: 'error',
                description: '',
                notes: '',
                metadata: {}
            })
            setSelectedInvoice(invoice)
            setSelectedClient(invoice.client || null)
            calculateMaxCreditAmount(invoice)
        } else {
            fetchInvoices()
            fetchClients()
        }
    }, [invoice])

    const fetchInvoices = async () => {
        setIsLoadingInvoices(true)
        try {
            const response = await fetch('/api/invoices?status=sent&status=paid&status=overdue&limit=100')
            const result = await response.json()

            if (response.ok) {
                // Only show invoices that can receive credit notes
                const creditableInvoices = result.data.filter(
                    (inv: InvoiceWithRelations) => inv.status !== 'cancelled'
                )
                setInvoices(creditableInvoices)
            }
        } catch (error) {
            console.error('Failed to fetch invoices:', error)
        } finally {
            setIsLoadingInvoices(false)
        }
    }

    const fetchClients = async () => {
        try {
            const response = await fetch('/api/clients?limit=100')
            const result = await response.json()

            if (response.ok) {
                setClients(result.data)
            }
        } catch (error) {
            console.error('Failed to fetch clients:', error)
        }
    }

    const calculateMaxCreditAmount = async (selectedInv: InvoiceWithRelations) => {
        try {
            const response = await fetch(`/api/credit-notes?invoice_id=${selectedInv.id}`)
            const result = await response.json()

            if (response.ok) {
                const totalCredited = result.data
                    .filter((cn: any) => cn.status === 'applied')
                    .reduce((sum: number, cn: any) => sum + cn.amount, 0)
                const maxCredit = selectedInv.amount - totalCredited
                setMaxCreditAmount(maxCredit)

                // Set default amount to max creditable amount
                setFormData(prev => ({ ...prev, amount: maxCredit }))
            }
        } catch (error) {
            console.error('Failed to calculate max credit amount:', error)
            setMaxCreditAmount(selectedInv.amount)
            setFormData(prev => ({ ...prev, amount: selectedInv.amount }))
        }
    }

    const handleInvoiceChange = (invoiceId: string) => {
        const selectedInv = invoices.find(inv => inv.id === invoiceId)
        if (selectedInv) {
            setSelectedInvoice(selectedInv)
            setSelectedClient(selectedInv.client || null)
            setFormData(prev => ({
                ...prev,
                invoice_id: invoiceId,
                client_id: selectedInv.client_id || '',
                currency: selectedInv.currency || 'USD'
            }))
            calculateMaxCreditAmount(selectedInv)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')
        setSuccess('')

        try {
            const response = await fetch('/api/credit-notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create credit note')
            }

            setSuccess('Credit note created successfully!')

            if (onSave) {
                setTimeout(() => onSave(), 1000)
            } else {
                setTimeout(() => {
                    router.push('/dashboard/credit-notes')
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
                            <Minus className="h-5 w-5" />
                            Create Credit Note
                        </CardTitle>
                        <CardDescription>
                            Issue a credit note for an invoice adjustment or refund
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
                                    disabled={isLoading || isLoadingInvoices}
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
                                    <div className="font-medium">{selectedClient?.name}</div>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">Invoice Amount:</span>
                                    <div className="font-medium">{formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}</div>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">Max Credit Amount:</span>
                                    <div className="font-medium text-orange-600">
                                        {formatCurrency(maxCreditAmount, selectedInvoice.currency)}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">Status:</span>
                                    <Badge className={financialUtils.getInvoiceStatusColor(selectedInvoice.status)}>
                                        {financialUtils.getInvoiceStatusDisplayName(selectedInvoice.status)}
                                    </Badge>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">Issue Date:</span>
                                    <div className="font-medium">
                                        {formatDateTime(selectedInvoice.created_at)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Credit Note Details */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle className="h-4 w-4" />
                            <h3 className="text-lg font-medium">Credit Note Details</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="reason">Reason *</Label>
                                <Select
                                    value={formData.reason}
                                    onValueChange={(value) => updateFormData('reason', value)}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {financialUtils.getAllCreditNoteReasons().map((reason) => (
                                            <SelectItem key={reason.value} value={reason.value}>
                                                {reason.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="amount">Credit Amount *</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={maxCreditAmount}
                                    value={formData.amount}
                                    onChange={(e) => updateFormData('amount', parseFloat(e.target.value) || 0)}
                                    disabled={isLoading}
                                    required
                                />
                                {maxCreditAmount > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        Maximum: {formatCurrency(maxCreditAmount, formData.currency)}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description *</Label>
                            <Input
                                id="description"
                                value={formData.description}
                                onChange={(e) => updateFormData('description', e.target.value)}
                                placeholder="Brief description of the credit note reason"
                                disabled={isLoading}
                                required
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Additional Notes</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => updateFormData('notes', e.target.value)}
                            placeholder="Additional details or internal notes"
                            rows={3}
                            disabled={isLoading}
                        />
                    </div>

                    {/* Credit Note Impact */}
                    {selectedInvoice && formData.amount > 0 && (
                        <div className="p-4 bg-yellow-50 rounded-lg">
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                Credit Note Impact
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Original Invoice Amount:</span>
                                    <span className="font-medium">{formatCurrency(selectedInvoice.amount, formData.currency)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Credit Amount:</span>
                                    <span className="font-medium text-red-600">-{formatCurrency(formData.amount, formData.currency)}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2">
                                    <span>Effective Invoice Amount:</span>
                                    <span className="font-medium">
                                        {formatCurrency(selectedInvoice.amount - formData.amount, formData.currency)}
                                    </span>
                                </div>
                                <div className="text-yellow-700 text-xs mt-2">
                                    ⚠️ This credit note will reduce the effective invoice amount. Ensure this is intentional.
                                </div>
                            </div>
                        </div>
                    )}

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
                            disabled={isLoading || !formData.invoice_id || formData.amount <= 0 || formData.amount > maxCreditAmount || !formData.description.trim()}
                            className="bg-g1-primary hover:bg-g1-primary/90"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Credit Note...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Create Credit Note
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}