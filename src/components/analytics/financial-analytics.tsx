'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  CreditCard, 
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  BarChart3,
  PieChart,
  Users,
  Receipt,
  FileText,
  Calendar
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { formatCurrency } from '@/lib/utils'

interface FinancialAnalytics {
  financial_metrics: {
    total_invoiced: number
    total_paid: number
    total_credited: number
    outstanding_amount: number
    collection_rate: number
    avg_invoice_amount: number
    avg_payment_time_days: number
    total_invoices: number
    paid_invoices: number
    overdue_invoices: number
    total_receipts: number
    total_credit_notes: number
  }
  distributions: {
    invoice_status: Record<string, number>
    currencies: Record<string, number>
    client_types: Record<string, number>
    payment_methods: Record<string, number>
  }
  time_series: Array<{
    date: string
    invoiced: number
    paid: number
    credited: number
    invoice_count: number
    payment_count: number
  }>
  top_clients: Array<{
    client_id: string
    client_name: string
    client_type: string
    total_invoiced: number
    total_paid: number
    invoice_count: number
  }>
  aging_analysis: {
    current: number
    days_31_60: number
    days_61_90: number
    over_90: number
  }
  recent_transactions: Array<{
    id: string
    type: 'invoice' | 'receipt'
    number: string
    amount: number
    currency: string
    status: string
    client_name: string
    date: string
  }>
  date_range: {
    start_date: string
    end_date: string
  }
  generated_at: string
}

interface FinancialAnalyticsProps {
  className?: string
}

export function FinancialAnalytics({ className }: FinancialAnalyticsProps) {
  const [data, setData] = useState<FinancialAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeframe, setTimeframe] = useState('year')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [timeframe])

  const fetchAnalytics = async () => {
    if (!refreshing) setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        group_by: timeframe === 'week' ? 'day' : timeframe === 'month' ? 'week' : 'month'
      })

      if (timeframe !== 'all') {
        const range = getDateRange(timeframe)
        params.append('start_date', range.start_date)
        params.append('end_date', range.end_date)
      }

      const response = await fetch(`/api/analytics/financial?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch financial analytics')
      }

      setData(result)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchAnalytics()
  }

  const getDateRange = (period: string) => {
    const now = new Date()
    const start = new Date()

    switch (period) {
      case 'week':
        start.setDate(now.getDate() - 7)
        break
      case 'month':
        start.setMonth(now.getMonth() - 1)
        break
      case 'quarter':
        start.setMonth(now.getMonth() - 3)
        break
      case 'year':
        start.setFullYear(now.getFullYear() - 1)
        break
      default:
        start.setFullYear(now.getFullYear() - 1)
    }

    return {
      start_date: start.toISOString(),
      end_date: now.toISOString()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'invoice':
        return <FileText className="h-4 w-4 text-blue-500" />
      case 'receipt':
        return <Receipt className="h-4 w-4 text-green-500" />
      default:
        return <DollarSign className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{error}</p>
            <Button onClick={fetchAnalytics} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const { financial_metrics, distributions, time_series, top_clients, aging_analysis, recent_transactions } = data

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive financial performance and revenue analysis
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Invoiced</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(financial_metrics.total_invoiced, 'USD')}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(financial_metrics.total_paid, 'USD')}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(financial_metrics.outstanding_amount, 'USD')}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Collection Rate</p>
                <p className="text-2xl font-bold">{financial_metrics.collection_rate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Invoice Amount</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(financial_metrics.avg_invoice_amount, 'USD')}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Payment Time</p>
                <p className="text-2xl font-bold">{financial_metrics.avg_payment_time_days.toFixed(1)}</p>
                <p className="text-xs text-gray-500">days</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue Invoices</p>
                <p className="text-2xl font-bold">{financial_metrics.overdue_invoices}</p>
                <p className="text-xs text-gray-500">
                  of {financial_metrics.total_invoices} total
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Credit Notes</p>
                <p className="text-2xl font-bold">{financial_metrics.total_credit_notes}</p>
                <p className="text-xs text-gray-500">
                  {formatCurrency(financial_metrics.total_credited, 'USD')} total
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Invoice Status Distribution
            </CardTitle>
            <CardDescription>Current status of all invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(distributions.invoice_status).map(([status, count]) => {
                const total = Object.values(distributions.invoice_status).reduce((sum, val) => sum + val, 0)
                const percentage = total > 0 ? (count / total) * 100 : 0
                
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-sm font-medium capitalize">
                        {status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-8">{count}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Methods
            </CardTitle>
            <CardDescription>Revenue by payment method</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(distributions.payment_methods).map(([method, amount]) => {
                const total = Object.values(distributions.payment_methods).reduce((sum, val) => sum + val, 0)
                const percentage = total > 0 ? (amount / total) * 100 : 0
                
                return (
                  <div key={method} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm font-medium capitalize">{method}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">
                        {formatCurrency(amount, 'USD')}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aging Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Accounts Receivable Aging
          </CardTitle>
          <CardDescription>Outstanding amounts by age</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-800">Current (0-30 days)</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(aging_analysis.current, 'USD')}
              </p>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm font-medium text-yellow-800">31-60 days</p>
              <p className="text-2xl font-bold text-yellow-600">
                {formatCurrency(aging_analysis.days_31_60, 'USD')}
              </p>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-sm font-medium text-orange-800">61-90 days</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(aging_analysis.days_61_90, 'USD')}
              </p>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm font-medium text-red-800">Over 90 days</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(aging_analysis.over_90, 'USD')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Clients and Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Clients by Revenue
            </CardTitle>
            <CardDescription>Clients with highest total invoiced amount</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {top_clients.slice(0, 5).map((client, index) => (
                <div key={client.client_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{client.client_name}</p>
                      <p className="text-sm text-gray-600">
                        {client.invoice_count} invoices • {client.client_type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {formatCurrency(client.total_invoiced, 'USD')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(client.total_paid, 'USD')} paid
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest financial transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recent_transactions.slice(0, 8).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <p className="text-sm font-medium">{transaction.number}</p>
                      <p className="text-xs text-gray-500">
                        {transaction.client_name} • {formatDistanceToNow(new Date(transaction.date), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </p>
                    <Badge className={getStatusColor(transaction.status)}>
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}