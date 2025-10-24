import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authServer } from '@/lib/auth'
import { analyticsFiltersSchema } from '@/lib/validations/analytics'
import { analyticsUtils } from '@/lib/analytics-utils'

export async function GET(request: NextRequest) {
  try {
    // Require permission to view SKR analytics
    const user = await authServer.requireRole(['admin', 'finance', 'operations', 'compliance'])
    
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    // Parse and validate filters
    const filters = analyticsFiltersSchema.parse({
      date_range: searchParams.get('start_date') && searchParams.get('end_date') ? {
        start_date: searchParams.get('start_date')!,
        end_date: searchParams.get('end_date')!
      } : undefined,
      client_type: searchParams.get('client_type') || undefined,
      status: searchParams.get('status') || undefined,
      group_by: (searchParams.get('group_by') as any) || 'month'
    })
    
    // Set default date range if not provided
    const dateRange = filters.date_range || analyticsUtils.getDateRange('year')
    
    // Fetch SKR data with related information
    const { data: skrs, error: skrsError } = await supabase
      .from('skrs')
      .select(`
        id,
        skr_number,
        status,
        issue_date,
        created_at,
        updated_at,
        client:clients(id, name, type, country),
        asset:assets(id, asset_name, asset_type, declared_value, currency)
      `)
      .gte('created_at', dateRange.start_date)
      .lte('created_at', dateRange.end_date)
      .order('created_at', { ascending: false })
    
    if (skrsError) {
      console.error('SKR analytics fetch error:', skrsError)
      return NextResponse.json({ error: 'Failed to fetch SKR analytics data' }, { status: 500 })
    }
    
    const skrData = skrs || []
    
    // Calculate key metrics
    const totalSKRs = skrData.length
    const statusDistribution = skrData.reduce((acc, skr) => {
      acc[skr.status] = (acc[skr.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const clientTypeDistribution = skrData.reduce((acc, skr) => {
      const clientType = skr.client?.type || 'unknown'
      acc[clientType] = (acc[clientType] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const assetTypeDistribution = skrData.reduce((acc, skr) => {
      const assetType = skr.asset?.asset_type || 'unknown'
      acc[assetType] = (acc[assetType] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Calculate total asset value
    const totalAssetValue = skrData.reduce((sum, skr) => {
      return sum + (skr.asset?.declared_value || 0)
    }, 0)
    
    // Calculate average processing time (from creation to issuance)
    const issuedSKRs = skrData.filter(skr => skr.status === 'issued' && skr.issue_date)
    const avgProcessingTime = issuedSKRs.length > 0 
      ? issuedSKRs.reduce((sum, skr) => {
          const created = new Date(skr.created_at).getTime()
          const issued = new Date(skr.issue_date!).getTime()
          return sum + (issued - created)
        }, 0) / issuedSKRs.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0
    
    // Generate time series data
    const timePoints = analyticsUtils.generateTimeSeriesPoints(
      dateRange.start_date,
      dateRange.end_date,
      filters.group_by
    )
    
    const skrTimeSeries = timePoints.map(point => {
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
      
      const periodSKRs = skrData.filter(skr => {
        const createdAt = new Date(skr.created_at)
        return createdAt >= pointDate && createdAt < nextPoint
      })
      
      return {
        date: analyticsUtils.formatDateForGroup(point, filters.group_by),
        total: periodSKRs.length,
        issued: periodSKRs.filter(s => s.status === 'issued').length,
        in_transit: periodSKRs.filter(s => s.status === 'in_transit').length,
        delivered: periodSKRs.filter(s => s.status === 'delivered').length,
        value: periodSKRs.reduce((sum, s) => sum + (s.asset?.declared_value || 0), 0)
      }
    })
    
    // Calculate performance metrics
    const performanceMetrics = {
      total_skrs: totalSKRs,
      issued_skrs: statusDistribution.issued || 0,
      active_skrs: (statusDistribution.issued || 0) + (statusDistribution.in_transit || 0),
      completed_skrs: statusDistribution.delivered || 0,
      draft_skrs: statusDistribution.draft || 0,
      issuance_rate: totalSKRs > 0 ? ((statusDistribution.issued || 0) / totalSKRs) * 100 : 0,
      completion_rate: totalSKRs > 0 ? ((statusDistribution.delivered || 0) / totalSKRs) * 100 : 0,
      avg_processing_time_days: avgProcessingTime,
      total_asset_value: totalAssetValue
    }
    
    // Top clients by SKR count
    const clientSKRCounts = skrData.reduce((acc, skr) => {
      const clientName = skr.client?.name || 'Unknown'
      const clientId = skr.client?.id || 'unknown'
      
      if (!acc[clientId]) {
        acc[clientId] = {
          client_id: clientId,
          client_name: clientName,
          client_type: skr.client?.type || 'unknown',
          skr_count: 0,
          total_value: 0
        }
      }
      
      acc[clientId].skr_count++
      acc[clientId].total_value += skr.asset?.declared_value || 0
      
      return acc
    }, {} as Record<string, any>)
    
    const topClients = Object.values(clientSKRCounts)
      .sort((a: any, b: any) => b.skr_count - a.skr_count)
      .slice(0, 10)
    
    // Top asset types by value
    const assetTypeValues = skrData.reduce((acc, skr) => {
      const assetType = skr.asset?.asset_type || 'unknown'
      
      if (!acc[assetType]) {
        acc[assetType] = {
          asset_type: assetType,
          skr_count: 0,
          total_value: 0
        }
      }
      
      acc[assetType].skr_count++
      acc[assetType].total_value += skr.asset?.declared_value || 0
      
      return acc
    }, {} as Record<string, any>)
    
    const topAssetTypes = Object.values(assetTypeValues)
      .sort((a: any, b: any) => b.total_value - a.total_value)
      .slice(0, 10)
    
    // Country distribution
    const countryDistribution = skrData.reduce((acc, skr) => {
      const country = skr.client?.country || 'unknown'
      acc[country] = (acc[country] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Recent SKRs
    const recentSKRs = skrData
      .slice(0, 20)
      .map(skr => ({
        id: skr.id,
        skr_number: skr.skr_number,
        status: skr.status,
        client_name: skr.client?.name,
        asset_name: skr.asset?.asset_name,
        asset_value: skr.asset?.declared_value,
        currency: skr.asset?.currency,
        created_at: skr.created_at,
        issue_date: skr.issue_date
      }))
    
    const analytics = {
      performance_metrics: performanceMetrics,
      distributions: {
        status: statusDistribution,
        client_types: clientTypeDistribution,
        asset_types: assetTypeDistribution,
        countries: countryDistribution
      },
      time_series: skrTimeSeries,
      top_clients: topClients,
      top_asset_types: topAssetTypes,
      recent_skrs: recentSKRs,
      date_range: dateRange,
      generated_at: new Date().toISOString()
    }
    
    return NextResponse.json(analytics)
  } catch (error) {
    console.error('SKR analytics API error:', error)
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}