import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authServer } from '@/lib/auth-server'
import { analyticsUtils } from '@/lib/analytics-utils'

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await authServer.requireAuth()
    
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    // Parse timeframe parameter
    const timeframe = searchParams.get('timeframe') || 'month'
    const validTimeframes = ['day', 'week', 'month', 'quarter', 'year', 'custom'] as const
    const validTimeframe = validTimeframes.includes(timeframe as any) ? timeframe as any : 'month'
    
    // Set date range based on timeframe
    const dateRange = analyticsUtils.getDateRange(validTimeframe)
    const startDate = 'start_date' in dateRange ? dateRange.start_date : dateRange.start.toISOString()
    const endDate = 'end_date' in dateRange ? dateRange.end_date : dateRange.end.toISOString()
    
    // Fetch overview data in parallel
    const [
      clientsResult,
      skrsResult,
      invoicesResult,
      receiptsResult,
      auditLogsResult
    ] = await Promise.all([
      // Clients
      supabase
        .from('clients')
        .select('id, name, type, compliance_status, risk_level, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      
      // SKRs
      supabase
        .from('skrs')
        .select('id, skr_number, status, issue_date, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      
      // Invoices
      supabase
        .from('invoices')
        .select('id, invoice_number, amount, currency, status, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      
      // Receipts
      supabase
        .from('receipts')
        .select('id, amount, currency, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      
      // Audit logs for activity
      supabase
        .from('audit_logs')
        .select('id, action, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })
        .limit(100)
    ])
    
    // Handle potential errors
    const clients = clientsResult.data || []
    const skrs = skrsResult.data || []
    const invoices = invoicesResult.data || []
    const receipts = receiptsResult.data || []
    const auditLogs = auditLogsResult.data || []
    
    // Calculate overview metrics
    const totalClients = clients.length
    const newClients = clients.filter(c => {
      const createdDate = new Date(c.created_at)
      const now = new Date()
      const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
      return daysDiff <= 30
    }).length
    
    const compliantClients = clients.filter(c => c.compliance_status === 'compliant').length
    const complianceRate = totalClients > 0 ? (compliantClients / totalClients) * 100 : 0
    
    const totalSKRs = skrs.length
    const issuedSKRs = skrs.filter(s => s.status === 'issued').length
    const inTransitSKRs = skrs.filter(s => s.status === 'in_transit').length
    const deliveredSKRs = skrs.filter(s => s.status === 'delivered').length
    
    const totalInvoices = invoices.length
    const paidInvoices = invoices.filter(i => i.status === 'paid').length
    const overdueInvoices = invoices.filter(i => i.status === 'overdue').length
    
    const totalInvoiceAmount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
    const totalReceiptAmount = receipts.reduce((sum, rec) => sum + (rec.amount || 0), 0)
    const collectionRate = totalInvoiceAmount > 0 ? (totalReceiptAmount / totalInvoiceAmount) * 100 : 0
    
    // Calculate growth metrics (comparing with previous period)
    const startMs = new Date(String(startDate)).getTime()
    const endMs = new Date(String(endDate)).getTime()
    const previousStartDate = new Date(startMs - (endMs - startMs))
    const previousEndDate = new Date(String(startDate))
    
    const [
      prevClientsResult,
      prevSkrsResult,
      prevInvoicesResult
    ] = await Promise.all([
      supabase
        .from('clients')
        .select('id, created_at')
        .gte('created_at', previousStartDate.toISOString())
        .lte('created_at', previousEndDate.toISOString()),
      
      supabase
        .from('skrs')
        .select('id, created_at')
        .gte('created_at', previousStartDate.toISOString())
        .lte('created_at', previousEndDate.toISOString()),
      
      supabase
        .from('invoices')
        .select('id, amount, created_at')
        .gte('created_at', previousStartDate.toISOString())
        .lte('created_at', previousEndDate.toISOString())
    ])
    
    const prevClients = prevClientsResult.data || []
    const prevSkrs = prevSkrsResult.data || []
    const prevInvoices = prevInvoicesResult.data || []
    const prevInvoiceAmount = prevInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
    
    const clientGrowth = prevClients.length > 0 ? ((totalClients - prevClients.length) / prevClients.length) * 100 : 0
    const skrGrowth = prevSkrs.length > 0 ? ((totalSKRs - prevSkrs.length) / prevSkrs.length) * 100 : 0
    const revenueGrowth = prevInvoiceAmount > 0 ? ((totalInvoiceAmount - prevInvoiceAmount) / prevInvoiceAmount) * 100 : 0
    
    // Recent activity
    const recentActivity = auditLogs.slice(0, 10).map(log => ({
      id: log.id,
      action: log.action,
      timestamp: log.created_at
    }))
    
    // Status distributions
    const clientStatusDistribution = clients.reduce((acc, client) => {
      acc[client.compliance_status] = (acc[client.compliance_status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const skrStatusDistribution = skrs.reduce((acc, skr) => {
      acc[skr.status] = (acc[skr.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const invoiceStatusDistribution = invoices.reduce((acc, invoice) => {
      acc[invoice.status] = (acc[invoice.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Risk level distribution
    const riskLevelDistribution = clients.reduce((acc, client) => {
      acc[client.risk_level] = (acc[client.risk_level] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Client type distribution
    const clientTypeDistribution = clients.reduce((acc, client) => {
      acc[client.type] = (acc[client.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Generate time series data for charts
    const timePoints = analyticsUtils.generateTimeSeriesPoints(String(startDate), String(endDate), 'day')
    
    const timeSeriesData = timePoints.map(point => {
      const pointDate = new Date(String(point))
      const nextPoint = new Date(pointDate)
      nextPoint.setDate(nextPoint.getDate() + 1)
      
      const periodClients = clients.filter(c => {
        const createdDate = new Date(String(c.created_at))
        return createdDate >= pointDate && createdDate < nextPoint
      })
      
      const periodSKRs = skrs.filter(s => {
        const createdDate = new Date(String(s.created_at))
        return createdDate >= pointDate && createdDate < nextPoint
      })
      
      const periodInvoices = invoices.filter(i => {
        const createdDate = new Date(String(i.created_at))
        return createdDate >= pointDate && createdDate < nextPoint
      })
      
      const periodInvoiceAmount = periodInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
      
      return {
        date: point,
        clients: periodClients.length,
        skrs: periodSKRs.length,
        invoices: periodInvoices.length,
        revenue: periodInvoiceAmount
      }
    })
    
    const overview = {
      summary: {
        total_clients: totalClients,
        new_clients: newClients,
        compliant_clients: compliantClients,
        compliance_rate: Math.round(complianceRate * 100) / 100,
        total_skrs: totalSKRs,
        issued_skrs: issuedSKRs,
        in_transit_skrs: inTransitSKRs,
        delivered_skrs: deliveredSKRs,
        total_invoices: totalInvoices,
        paid_invoices: paidInvoices,
        overdue_invoices: overdueInvoices,
        total_revenue: totalInvoiceAmount,
        collected_revenue: totalReceiptAmount,
        collection_rate: Math.round(collectionRate * 100) / 100
      },
      growth: {
        client_growth: Math.round(clientGrowth * 100) / 100,
        skr_growth: Math.round(skrGrowth * 100) / 100,
        revenue_growth: Math.round(revenueGrowth * 100) / 100
      },
      distributions: {
        client_status: clientStatusDistribution,
        skr_status: skrStatusDistribution,
        invoice_status: invoiceStatusDistribution,
        risk_levels: riskLevelDistribution,
        client_types: clientTypeDistribution
      },
      time_series: timeSeriesData,
      recent_activity: recentActivity,
      timeframe: timeframe,
      date_range: {
        start: startDate,
        end: endDate
      },
      generated_at: new Date().toISOString()
    }
    
    return NextResponse.json(overview)
  } catch (error) {
    console.error('Overview analytics API error:', error)
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
