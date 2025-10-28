'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react'

interface Client {
  id: string
  name: string
  email: string
  company_name?: string
  compliance_status: 'compliant' | 'non_compliant' | 'pending'
}

interface SKR {
  id: string
  skr_number: string
  client_id: string
  asset_description: string
  status: string
}

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

interface InvoiceFormData {
  client_id: string
  skr_id?: string
  due_date: string
  currency: string
  notes?: string
  items: InvoiceItem[]
}

export function InvoiceForm({ invoiceId }: { invoiceId?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [skrs, setSkrs] = useState<SKR[]>([])
  const [formData, setFormData] = useState<InvoiceFormData>({
    client_id: '',
    skr_id: '',
    due_date: '',
    currency: 'USD',
    notes: '',
    items: [
      {
        id: '1',
        description: '',
        quantity: 1,
        unit_price: 0,
        total: 0
      }
    ]
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchClients()
    if (invoiceId) {
      fetchInvoice()
    }
  }, [invoiceId])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const fetchInvoice = async () => {
    if (!invoiceId) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/invoices/${invoiceId}`)
      if (response.ok) {
        const data = await response.json()
        setFormData({
          client_id: data.client_id,
          skr_id: data.skr_id || '',
          due_date: data.due_date,
          currency: data.currency,
          notes: data.notes || '',
          items: data.items || [
            {
              id: '1',
              description: '',
              quantity: 1,
              unit_price: 0,
              total: 0
            }
          ]
        })
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSKRs = async (clientId: string) => {
    if (!clientId) {
      setSkrs([])
      return
    }

    try {
      const response = await fetch(`/api/skrs?client_id=${clientId}`)
      if (response.ok) {
        const data = await response.json()
        setSkrs(data.skrs || [])
      }
    } catch (error) {
      console.error('Error fetching SKRs:', error)
    }
  }

  const handleClientChange = (clientId: string) => {
    setFormData(prev => ({ ...prev, client_id: clientId, skr_id: '' }))
    fetchSKRs(clientId)
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleItemChange = (itemId: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId
          ? { ...item, [field]: value, total: field === 'quantity' || field === 'unit_price' 
              ? (field === 'quantity' ? value : item.quantity) * (field === 'unit_price' ? value : item.unit_price)
              : item.total
            }
          : item
      )
    }))
  }

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unit_price: 0,
      total: 0
    }
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))
  }

  const removeItem = (itemId: string) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== itemId)
      }))
    }
  }

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + item.total, 0)
  }

  const calculateTax = () => {
    // Assuming 10% tax rate
    return calculateSubtotal() * 0.1
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax()
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.client_id) {
      newErrors.client_id = 'Client is required'
    }

    if (!formData.due_date) {
      newErrors.due_date = 'Due date is required'
    }

    if (!formData.currency) {
      newErrors.currency = 'Currency is required'
    }

    formData.items.forEach((item, index) => {
      if (!item.description) {
        newErrors[`item_${index}_description`] = 'Item description is required'
      }
      if (item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0'
      }
      if (item.unit_price <= 0) {
        newErrors[`item_${index}_unit_price`] = 'Unit price must be greater than 0'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setSaving(true)
      
      const invoiceData = {
        ...formData,
        amount: calculateTotal(),
        subtotal: calculateSubtotal(),
        tax_amount: calculateTax(),
        status: 'draft'
      }

      const url = invoiceId ? `/api/invoices/${invoiceId}` : '/api/invoices'
      const method = invoiceId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invoiceData)
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/dashboard/invoices/${data.id || invoiceId}`)
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to save invoice')
      }
    } catch (error) {
      console.error('Error saving invoice:', error)
      alert('Error saving invoice')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading invoice...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {invoiceId ? 'Edit Invoice' : 'Create Invoice'}
            </h1>
            <p className="text-gray-600">
              {invoiceId ? 'Update invoice details' : 'Create a new invoice for a client'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client and SKR Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Client & SKR Information</CardTitle>
              <CardDescription>Select the client and optional SKR for this invoice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="client_id">Client *</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={handleClientChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{client.name}</span>
                          <Badge 
                            className={`ml-2 ${
                              client.compliance_status === 'compliant' 
                                ? 'bg-green-100 text-green-800' 
                                : client.compliance_status === 'non_compliant'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {client.compliance_status}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.client_id && (
                  <p className="text-sm text-red-600 mt-1">{errors.client_id}</p>
                )}
              </div>

              <div>
                <Label htmlFor="skr_id">SKR (Optional)</Label>
                <Select
                  value={formData.skr_id}
                  onValueChange={(value) => handleInputChange('skr_id', value)}
                  disabled={!formData.client_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an SKR" />
                  </SelectTrigger>
                  <SelectContent>
                    {skrs.map((skr) => (
                      <SelectItem key={skr.id} value={skr.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{skr.skr_number}</span>
                          <Badge className="ml-2 bg-blue-100 text-blue-800">
                            {skr.status}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
              <CardDescription>Set due date and currency for this invoice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="due_date">Due Date *</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleInputChange('due_date', e.target.value)}
                />
                {errors.due_date && (
                  <p className="text-sm text-red-600 mt-1">{errors.due_date}</p>
                )}
              </div>

              <div>
                <Label htmlFor="currency">Currency *</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => handleInputChange('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                    <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                  </SelectContent>
                </Select>
                {errors.currency && (
                  <p className="text-sm text-red-600 mt-1">{errors.currency}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Invoice Items</CardTitle>
                <CardDescription>Add items and services to this invoice</CardDescription>
              </div>
              <Button type="button" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.items.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Input
                        value={item.description}
                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                        placeholder="Item description"
                      />
                      {errors[`item_${index}_description`] && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors[`item_${index}_description`]}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                      />
                      {errors[`item_${index}_quantity`] && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors[`item_${index}_quantity`]}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                      />
                      {errors[`item_${index}_unit_price`] && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors[`item_${index}_unit_price`]}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(item.total, formData.currency)}
                    </TableCell>
                    <TableCell>
                      {formData.items.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
            <CardDescription>Add any additional notes or terms to this invoice</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Enter any additional notes or terms..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Invoice Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(calculateSubtotal(), formData.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (10%):</span>
                <span>{formatCurrency(calculateTax(), formData.currency)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(calculateTotal(), formData.currency)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {invoiceId ? 'Update Invoice' : 'Create Invoice'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}