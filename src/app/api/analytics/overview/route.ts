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
    // NOTE: Fetch ALL data for totals, then filter by timeframe for "new" metrics
    const [
      allClientsResult,
      allSkrsResult,
      allAssetsResult,
      allInvoicesResult,
      allReceiptsResult,
      recentClientsResult,
      recentSkrsResult,
      recentInvoicesResult,
      auditLogsResult
    ] = await Promise.all([
      // ALL Clients (for total counts and compliance)
      supabase
        .from('clients')
        .select('id, name, type, compliance_status, risk_level, created_at'),
      
      // ALL SKRs (for total counts)
      supabase
        .from('skrs')
        .select('id, skr_number, status, issue_date, created_at'),
      
      // ALL Assets (for total value calculation)
      supabase
        .from('assets')
        .select('id, declared_value, asset_type, currency, created_at'),
      
      // ALL Invoices (for financial summary)
      supabase
        .from('invoices')
        .select('id, invoice_number, amount, currency, status, created_at'),
      
      // ALL Receipts (for financial summary)
      supabase
        .from('receipts')
        .select('id, amount, currency, created_at'),
      
      // Recent Clients (for growth calculation)
      supabase
        .from('clients')
        .select('id, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      
      // Recent SKRs (for growth calculation)
      supabase
        .from('skrs')
        .select('id, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      
      // Recent Invoices (for growth calculation)
      supabase
        .from('invoices')
        .select('id, amount, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      
      // Audit logs for activity (recent only)
      supabase
        .from('audit_logs')
        .select('id, action, resource_type, resource_id, user_id, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })
        .limit(100)
    ])
    
    // Handle potential errors
    const allClients = allClientsResult.data || []
    const allSkrs = allSkrsResult.data || []
    const allAssets = allAssetsResult.data || []
    const allInvoices = allInvoicesResult.data || []
    const allReceipts = allReceiptsResult.data || []
    const recentClients = recentClientsResult.data || []
    const recentSkrs = recentSkrsResult.data || []
    const recentInvoices = recentInvoicesResult.data || []
    const auditLogs = auditLogsResult.data || []
    
    // Calculate overview metrics using ALL data for totals
    const totalClients = allClients.length
    const newClients = recentClients.length // New clients in the selected timeframe
    
    const compliantClients = allClients.filter(c => c.compliance_status === 'compliant').length
    const complianceRate = totalClients > 0 ? (compliantClients / totalClients) * 100 : 0
    
    const totalSKRs = allSkrs.length
    const issuedSKRs = allSkrs.filter(s => s.status === 'issued').length
    const inTransitSKRs = allSkrs.filter(s => s.status === 'in_transit').length
    const deliveredSKRs = allSkrs.filter(s => s.status === 'delivered').length
    
    const totalInvoices = allInvoices.length
    const paidInvoices = allInvoices.filter(i => i.status === 'paid').length
    const overdueInvoices = allInvoices.filter(i => i.status === 'overdue').length
    
    // Financial summary using ALL invoices and receipts
    const totalInvoiceAmount = allInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
    const totalReceiptAmount = allReceipts.reduce((sum, rec) => sum + (rec.amount || 0), 0)
    const collectionRate = totalInvoiceAmount > 0 ? (totalReceiptAmount / totalInvoiceAmount) * 100 : 0
    
    // Calculate total asset value
    const totalAssetValue = allAssets.reduce((sum, asset) => sum + ((asset as any).declared_value || 0), 0)
    
    // Get asset type distribution
    const assetTypeDistribution = allAssets.reduce((acc, asset) => {
      const type = (asset as any).asset_type || 'other'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
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
    
    // Calculate growth based on recent vs previous period
    const recentInvoiceAmount = recentInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
    
    const clientGrowth = prevClients.length > 0 ? ((recentClients.length - prevClients.length) / prevClients.length) * 100 : (recentClients.length > 0 ? 100 : 0)
    const skrGrowth = prevSkrs.length > 0 ? ((recentSkrs.length - prevSkrs.length) / prevSkrs.length) * 100 : (recentSkrs.length > 0 ? 100 : 0)
    const revenueGrowth = prevInvoiceAmount > 0 ? ((recentInvoiceAmount - prevInvoiceAmount) / prevInvoiceAmount) * 100 : (recentInvoiceAmount > 0 ? 100 : 0)
    
    // Fetch user profiles for recent activities
    const userIds = Array.from(new Set(auditLogs.map(log => log.user_id).filter(Boolean)))
    let userProfilesMap: Record<string, any> = {}
    
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .in('id', userIds)
      
      profiles?.forEach(profile => {
        userProfilesMap[profile.id] = profile
      })
    }
    
    // Recent activity with user information
    const recentActivity = auditLogs.slice(0, 10).map(log => ({
      id: log.id,
      action: log.action,
      resource_type: log.resource_type,
      resource_id: log.resource_id,
      user_profiles: log.user_id ? (userProfilesMap[log.user_id] || { full_name: 'Unknown User' }) : { full_name: 'System' },
      created_at: log.created_at,
      timestamp: log.created_at
    }))
    
    // Status distributions using ALL data
    const clientStatusDistribution = allClients.reduce((acc, client) => {
      acc[client.compliance_status] = (acc[client.compliance_status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const skrStatusDistribution = allSkrs.reduce((acc, skr) => {
      acc[skr.status] = (acc[skr.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const invoiceStatusDistribution = allInvoices.reduce((acc, invoice) => {
      acc[invoice.status] = (acc[invoice.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Risk level distribution
    const riskLevelDistribution = allClients.reduce((acc, client) => {
      acc[client.risk_level] = (acc[client.risk_level] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Client type distribution
    const clientTypeDistribution = allClients.reduce((acc, client) => {
      acc[client.type] = (acc[client.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Generate time series data for charts using recent data
    const timePoints = analyticsUtils.generateTimeSeriesPoints(String(startDate), String(endDate), 'day')
    
    const timeSeriesData = timePoints.map(point => {
      const pointDate = new Date(String(point))
      const nextPoint = new Date(pointDate)
      nextPoint.setDate(nextPoint.getDate() + 1)
      
      const periodClients = recentClients.filter(c => {
        const createdDate = new Date(String(c.created_at))
        return createdDate >= pointDate && createdDate < nextPoint
      })
      
      const periodSKRs = recentSkrs.filter(s => {
        const createdDate = new Date(String(s.created_at))
        return createdDate >= pointDate && createdDate < nextPoint
      })
      
      const periodInvoices = recentInvoices.filter(i => {
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
        total_assets: allAssets.length,
        total_asset_value: totalAssetValue,
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
        client_types: clientTypeDistribution,
        asset_types: assetTypeDistribution
      },
      time_series: timeSeriesData,
      recent_activities: recentActivity,
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
