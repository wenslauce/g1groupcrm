import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authServer } from '@/lib/auth-server'
import { analyticsFiltersSchema } from '@/lib/validations/analytics'
import { analyticsUtils } from '@/lib/analytics-utils'

export async function GET(request: NextRequest) {
  try {
    // Require permission to view financial analytics
    const user = await authServer.requireRole(['admin', 'finance'])
    
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    // Parse and validate filters
    const filters = analyticsFiltersSchema.parse({
      date_range: searchParams.get('start_date') && searchParams.get('end_date') ? {
        start_date: searchParams.get('start_date')!,
        end_date: searchParams.get('end_date')!
      } : undefined,
      currency: searchParams.get('currency') || undefined,
      group_by: (searchParams.get('group_by') as any) || 'month'
    })
    
    // Set default date range if not provided
    const dateRange = filters.date_range || analyticsUtils.getDateRange('year')
    
    // Fetch financial data
    const [invoicesResult, receiptsResult, creditNotesResult] = await Promise.all([
      // Invoices
      supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          amount,
          currency,
          status,
          issue_date,
          due_date,
          created_at,
          client:clients(id, name, type, country)
        `)
        .gte('created_at', dateRange.start_date)
        .lte('created_at', dateRange.end_date),
      
      // Receipts
      supabase
        .from('receipts')
        .select(`
          id,
          receipt_number,
          amount,
          payment_method,
          issue_date,
          created_at,
          invoice:invoices(id, invoice_number, client_id)
        `)
        .gte('created_at', dateRange.start_date)
        .lte('created_at', dateRange.end_date),
      
      // Credit Notes
      supabase
        .from('credit_notes')
        .select(`
          id,
          credit_note_number,
          amount,
          reason,
          issue_date,
          created_at,
          reference_invoice:invoices(id, invoice_number, client_id)
        `)
        .gte('created_at', dateRange.start_date)
        .lte('created_at', dateRange.end_date)
    ])
    
    // Check for errors
    const errors = [invoicesResult.error, receiptsResult.error, creditNotesResult.error]
      .filter(Boolean)
    
    if (errors.length > 0) {
      console.error('Financial analytics fetch errors:', errors)
      return NextResponse.json({ error: 'Failed to fetch financial analytics data' }, { status: 500 })
    }
    
    const invoices = invoicesResult.data || []
    const receipts = receiptsResult.data || []
    const creditNotes = creditNotesResult.data || []
    
    // Calculate key financial metrics
    const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
    const totalPaid = receipts.reduce((sum, rec) => sum + (rec.amount || 0), 0)
    const totalCredited = creditNotes.reduce((sum, cn) => sum + (cn.amount || 0), 0)
    const outstandingAmount = totalInvoiced - totalPaid - totalCredited
    
    const paidInvoices = invoices.filter(inv => inv.status === 'paid').length
    const overdueInvoices = invoices.filter(inv => {
      if (inv.status === 'overdue') return true
      if (inv.due_date && inv.status !== 'paid') {
        return new Date(inv.due_date) < new Date()
      }
      return false
    }).length
    
    // Calculate collection metrics
    const collectionRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0
    const avgInvoiceAmount = invoices.length > 0 ? totalInvoiced / invoices.length : 0
    const avgPaymentTime = calculateAveragePaymentTime(invoices, receipts)
    
    // Invoice status distribution
    const invoiceStatusDistribution = invoices.reduce((acc, inv) => {
      acc[inv.status] = (acc[inv.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Currency distribution
    const currencyDistribution = invoices.reduce((acc, inv) => {
      acc[inv.currency] = (acc[inv.currency] || 0) + (inv.amount || 0)
      return acc
    }, {} as Record<string, number>)
    
    // Client type revenue distribution
    const clientTypeRevenue = invoices.reduce((acc, inv) => {
      const clientType = inv.client?.type || 'unknown'
      acc[clientType] = (acc[clientType] || 0) + (inv.amount || 0)
      return acc
    }, {} as Record<string, number>)
    
    // Payment method distribution
    const paymentMethodDistribution = receipts.reduce((acc, rec) => {
      acc[rec.payment_method] = (acc[rec.payment_method] || 0) + (rec.amount || 0)
      return acc
    }, {} as Record<string, number>)
    
    // Generate time series data
    const timePoints = analyticsUtils.generateTimeSeriesPoints(
      dateRange.start_date,
      dateRange.end_date,
      filters.group_by
    )
    
    const financialTimeSeries = timePoints.map(point => {
      const pointDate = new Date(point)
      const nextPoint = new Date(pointDate)
      
      switch (filters.group_by) {
        case 'day':
          nextPoint.setDate(nextPoint.getDate() + 1)
          break
        case 'week':
          nextPoint.setDate(nextPoint.getDate() + 7)
          break
        case 'month':
          nextPoint.setMonth(nextPoint.getMonth() + 1)
          break
        case 'quarter':
          nextPoint.setMonth(nextPoint.getMonth() + 3)
          break
        case 'year':
          nextPoint.setFullYear(nextPoint.getFullYear() + 1)
          break
      }
      
      const periodInvoices = invoices.filter(inv => {
        const createdAt = new Date(inv.created_at)
        return createdAt >= pointDate && createdAt < nextPoint
      })
      
      const periodReceipts = receipts.filter(rec => {
        const createdAt = new Date(rec.created_at)
        return createdAt >= pointDate && createdAt < nextPoint
      })
      
      const periodCreditNotes = creditNotes.filter(cn => {
        const createdAt = new Date(cn.created_at)
        return createdAt >= pointDate && createdAt < nextPoint
      })
      
      return {
        date: analyticsUtils.formatDateForGroup(point, filters.group_by),
        invoiced: periodInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
        paid: periodReceipts.reduce((sum, rec) => sum + (rec.amount || 0), 0),
        credited: periodCreditNotes.reduce((sum, cn) => sum + (cn.amount || 0), 0),
        invoice_count: periodInvoices.length,
        payment_count: periodReceipts.length
      }
    })
    
    // Top clients by revenue
    const clientRevenue = invoices.reduce((acc, inv) => {
      const clientId = inv.client?.id || 'unknown'
      const clientName = inv.client?.name || 'Unknown'
      
      if (!acc[clientId]) {
        acc[clientId] = {
          client_id: clientId,
          client_name: clientName,
          client_type: inv.client?.type || 'unknown',
          total_invoiced: 0,
          total_paid: 0,
          invoice_count: 0
        }
      }
      
      acc[clientId].total_invoiced += inv.amount || 0
      acc[clientId].invoice_count++
      
      return acc
    }, {} as Record<string, any>)
    
    // Add payment data to client revenue
    receipts.forEach(rec => {
      const clientId = rec.invoice?.client_id
      if (clientId && clientRevenue[clientId]) {
        clientRevenue[clientId].total_paid += rec.amount || 0
      }
    })
    
    const topClients = Object.values(clientRevenue)
      .sort((a: any, b: any) => b.total_invoiced - a.total_invoiced)
      .slice(0, 10)
    
    // Aging analysis
    const agingBuckets = {
      current: 0,      // 0-30 days
      days_31_60: 0,   // 31-60 days
      days_61_90: 0,   // 61-90 days
      over_90: 0       // 90+ days
    }
    
    const now = new Date()
    invoices.filter(inv => inv.status !== 'paid').forEach(inv => {
      const dueDate = inv.due_date ? new Date(inv.due_date) : new Date(inv.created_at)
      const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysPastDue <= 30) {
        agingBuckets.current += inv.amount || 0
      } else if (daysPastDue <= 60) {
        agingBuckets.days_31_60 += inv.amount || 0
      } else if (daysPastDue <= 90) {
        agingBuckets.days_61_90 += inv.amount || 0
      } else {
        agingBuckets.over_90 += inv.amount || 0
      }
    })
    
    // Recent transactions
    const recentTransactions = [
      ...invoices.slice(0, 10).map(inv => ({
        id: inv.id,
        type: 'invoice',
        number: inv.invoice_number,
        amount: inv.amount,
        currency: inv.currency,
        status: inv.status,
        client_name: inv.client?.name,
        date: inv.created_at
      })),
      ...receipts.slice(0, 10).map(rec => ({
        id: rec.id,
        type: 'receipt',
        number: rec.receipt_number,
        amount: rec.amount,
        currency: 'USD', // Assuming USD for receipts
        status: 'paid',
        client_name: 'N/A',
        date: rec.created_at
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20)
    
    const analytics = {
      financial_metrics: {
        total_invoiced: totalInvoiced,
        total_paid: totalPaid,
        total_credited: totalCredited,
        outstanding_amount: outstandingAmount,
        collection_rate: collectionRate,
        avg_invoice_amount: avgInvoiceAmount,
        avg_payment_time_days: avgPaymentTime,
        total_invoices: invoices.length,
        paid_invoices: paidInvoices,
        overdue_invoices: overdueInvoices,
        total_receipts: receipts.length,
        total_credit_notes: creditNotes.length
      },
      distributions: {
        invoice_status: invoiceStatusDistribution,
        currencies: currencyDistribution,
        client_types: clientTypeRevenue,
        payment_methods: paymentMethodDistribution
      },
      time_series: financialTimeSeries,
      top_clients: topClients,
      aging_analysis: agingBuckets,
      recent_transactions: recentTransactions,
      date_range: dateRange,
      generated_at: new Date().toISOString()
    }
    
    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Financial analytics API error:', error)
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to calculate average payment time
function calculateAveragePaymentTime(invoices: any[], receipts: any[]): number {
  const paidInvoices = invoices.filter(inv => inv.status === 'paid')
  
  if (paidInvoices.length === 0) return 0
  
  let totalDays = 0
  let count = 0
  
  paidInvoices.forEach(invoice => {
    const receipt = receipts.find(rec => rec.invoice?.id === invoice.id)
    if (receipt) {
      const invoiceDate = new Date(invoice.created_at)
      const paymentDate = new Date(receipt.created_at)
      const daysDiff = Math.floor((paymentDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff >= 0) {
        totalDays += daysDiff
        count++
      }
    }
  })
  
  return count > 0 ? totalDays / count : 0
}
