'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Search, Filter, Download, Plus, Eye, Edit, Trash2 } from 'lucide-react'

interface Invoice {
  id: string
  invoice_number: string
  client_id: string
  client_name: string
  skr_id?: string
  skr_number?: string
  amount: number
  currency: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  due_date: string
  created_at: string
  items: Array<{
    description: string
    quantity: number
    unit_price: number
    total: number
  }>
}

interface Receipt {
  id: string
  receipt_number: string
  invoice_id: string
  invoice_number: string
  amount: number
  currency: string
  payment_method: string
  payment_reference: string
  created_at: string
}

interface CreditNote {
  id: string
  credit_note_number: string
  invoice_id: string
  invoice_number: string
  amount: number
  currency: string
  reason: string
  status: 'draft' | 'issued' | 'applied'
  created_at: string
}

interface FinancialStats {
  totalInvoices: number
  totalAmount: number
  paidAmount: number
  overdueAmount: number
  pendingAmount: number
  totalReceipts: number
  totalCreditNotes: number
  averageInvoiceValue: number
  collectionRate: number
}

export function FinancialDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([])
  const [stats, setStats] = useState<FinancialStats>({
    totalInvoices: 0,
    totalAmount: 0,
    paidAmount: 0,
    overdueAmount: 0,
    pendingAmount: 0,
    totalReceipts: 0,
    totalCreditNotes: 0,
    averageInvoiceValue: 0,
    collectionRate: 0
  })
  
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    fetchFinancialData()
  }, [activeTab, searchTerm, statusFilter, dateFilter, currentPage])

  const fetchFinancialData = async () => {
    try {
      setLoading(true)
      
      // Fetch invoices
      const invoiceParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : '',
        date_range: dateFilter !== 'all' ? dateFilter : ''
      })
      
      const invoiceResponse = await fetch(`/api/invoices?${invoiceParams}`)
      if (invoiceResponse.ok) {
        const invoiceData = await invoiceResponse.json()
        setInvoices(invoiceData.invoices || [])
      }

      // Fetch receipts
      const receiptResponse = await fetch(`/api/receipts?${invoiceParams}`)
      if (receiptResponse.ok) {
        const receiptData = await receiptResponse.json()
        setReceipts(receiptData.receipts || [])
      }

      // Fetch credit notes
      const creditNoteResponse = await fetch(`/api/credit-notes?${invoiceParams}`)
      if (creditNoteResponse.ok) {
        const creditNoteData = await creditNoteResponse.json()
        setCreditNotes(creditNoteData.credit_notes || [])
      }

      // Fetch financial analytics
      const analyticsResponse = await fetch('/api/analytics/financial')
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json()
        setStats(analyticsData.summary || stats)
      }
    } catch (error) {
      console.error('Error fetching financial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      issued: 'bg-blue-100 text-blue-800',
      applied: 'bg-green-100 text-green-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const handleViewInvoice = (invoiceId: string) => {
    // Navigate to invoice details
    window.open(`/dashboard/invoices/${invoiceId}`, '_blank')
  }

  const handleEditInvoice = (invoiceId: string) => {
    // Navigate to edit invoice
    window.open(`/dashboard/invoices/${invoiceId}/edit`, '_blank')
  }

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      try {
        const response = await fetch(`/api/invoices/${invoiceId}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          fetchFinancialData()
        } else {
          alert('Failed to delete invoice')
        }
      } catch (error) {
        console.error('Error deleting invoice:', error)
        alert('Error deleting invoice')
      }
    }
  }

  const handleGeneratePDF = async (type: string, id: string) => {
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          document_type: type,
          document_id: id
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}-${id}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Failed to generate PDF')
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF')
    }
  }

  const renderInvoicesTable = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Invoices</h3>
        <Button onClick={() => window.open('/dashboard/invoices/create', '_blank')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>SKR #</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
              <TableCell>{invoice.client_name}</TableCell>
              <TableCell>{invoice.skr_number || '-'}</TableCell>
              <TableCell>{formatCurrency(invoice.amount, invoice.currency)}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(invoice.status)}>
                  {invoice.status.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(invoice.due_date)}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewInvoice(invoice.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditInvoice(invoice.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGeneratePDF('invoice', invoice.id)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteInvoice(invoice.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  const renderReceiptsTable = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Receipts</h3>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Receipt #</TableHead>
            <TableHead>Invoice #</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {receipts.map((receipt) => (
            <TableRow key={receipt.id}>
              <TableCell className="font-medium">{receipt.receipt_number}</TableCell>
              <TableCell>{receipt.invoice_number}</TableCell>
              <TableCell>{formatCurrency(receipt.amount, receipt.currency)}</TableCell>
              <TableCell>{receipt.payment_method}</TableCell>
              <TableCell>{receipt.payment_reference}</TableCell>
              <TableCell>{formatDate(receipt.created_at)}</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGeneratePDF('receipt', receipt.id)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  const renderCreditNotesTable = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Credit Notes</h3>
        <Button onClick={() => window.open('/dashboard/credit-notes/create', '_blank')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Credit Note
        </Button>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Credit Note #</TableHead>
            <TableHead>Invoice #</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {creditNotes.map((creditNote) => (
            <TableRow key={creditNote.id}>
              <TableCell className="font-medium">{creditNote.credit_note_number}</TableCell>
              <TableCell>{creditNote.invoice_number}</TableCell>
              <TableCell>{formatCurrency(creditNote.amount, creditNote.currency)}</TableCell>
              <TableCell>{creditNote.reason}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(creditNote.status)}>
                  {creditNote.status.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(creditNote.created_at)}</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGeneratePDF('credit_note', creditNote.id)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading financial data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Dashboard</h1>
          <p className="text-gray-600">Manage invoices, receipts, and credit notes</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.totalAmount, 'USD')} total value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.paidAmount, 'USD')}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.collectionRate.toFixed(1)}% collection rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.overdueAmount, 'USD')}
            </div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Invoice</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.averageInvoiceValue, 'USD')}
            </div>
            <p className="text-xs text-muted-foreground">
              Per invoice
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search invoices, clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
          <TabsTrigger value="credit-notes">Credit Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>Latest invoice activity</CardDescription>
              </CardHeader>
              <CardContent>
                {renderInvoicesTable()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Receipts</CardTitle>
                <CardDescription>Latest payment receipts</CardDescription>
              </CardHeader>
              <CardContent>
                {renderReceiptsTable()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoices">
          {renderInvoicesTable()}
        </TabsContent>

        <TabsContent value="receipts">
          {renderReceiptsTable()}
        </TabsContent>

        <TabsContent value="credit-notes">
          {renderCreditNotesTable()}
        </TabsContent>
      </Tabs>
    </div>
  )
}