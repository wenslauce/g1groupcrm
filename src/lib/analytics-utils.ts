import { createClient } from '@/lib/supabase/server'

/**
 * Get date range based on period
 */
export function getDateRange(period: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom' = 'month'): { start: Date; end: Date } {
  const end = new Date()
  const start = new Date()

  switch (period) {
    case 'day':
      start.setDate(start.getDate() - 1)
      break
    case 'week':
      start.setDate(start.getDate() - 7)
      break
    case 'month':
      start.setMonth(start.getMonth() - 1)
      break
    case 'quarter':
      start.setMonth(start.getMonth() - 3)
      break
    case 'year':
      start.setFullYear(start.getFullYear() - 1)
      break
    default:
      start.setMonth(start.getMonth() - 1)
  }

  return { start, end }
}

/**
 * Format analytics response
 */
export function formatAnalyticsResponse<T>(data: T, metadata?: Record<string, any>) {
  return {
    data,
    metadata: {
      generated_at: new Date().toISOString(),
      ...metadata
    }
  }
}

/**
 * Get SKR analytics
 */
export async function getSKRAnalytics(filters: {
  start_date?: string
  end_date?: string
  status?: string[]
  client_id?: string
  group_by?: 'status' | 'client' | 'date' | 'asset_type'
}) {
  const supabase = createClient()

  let query = supabase
    .from('skrs')
    .select('id, status, created_at, client_id, asset_id, assets(asset_type, declared_value, currency)')

  // Apply filters
  if (filters.start_date) {
    query = query.gte('created_at', filters.start_date)
  }
  if (filters.end_date) {
    query = query.lte('created_at', filters.end_date)
  }
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status)
  }
  if (filters.client_id) {
    query = query.eq('client_id', filters.client_id)
  }

  const { data, error } = await query

  if (error) throw error

  // Group and aggregate data
  const grouped = groupSKRData(data || [], filters.group_by || 'status')

  return grouped
}

/**
 * Group SKR data by specified dimension
 */
function groupSKRData(data: any[], groupBy: string) {
  const grouped: Record<string, any> = {}

  data.forEach(item => {
    let key = ''

    switch (groupBy) {
      case 'status':
        key = item.status
        break
      case 'client':
        key = item.client_id
        break
      case 'date':
        key = new Date(item.created_at).toISOString().split('T')[0]
        break
      case 'asset_type':
        key = item.assets?.asset_type || 'Unknown'
        break
      default:
        key = item.status
    }

    if (!grouped[key]) {
      grouped[key] = {
        count: 0,
        total_value: 0,
        items: []
      }
    }

    grouped[key].count++
    grouped[key].total_value += parseFloat(item.assets?.declared_value || 0)
    grouped[key].items.push(item.id)
  })

  return {
    summary: Object.entries(grouped).map(([key, value]) => ({
      group: key,
      ...value
    })),
    total_count: data.length,
    group_by: groupBy
  }
}

/**
 * Get financial analytics
 */
export async function getFinancialAnalytics(filters: {
  start_date?: string
  end_date?: string
  client_id?: string
  currency?: string
  metric?: string
  group_by?: 'client' | 'date' | 'currency' | 'status'
}) {
  const supabase = createClient()

  let query = supabase
    .from('invoices')
    .select('id, status, amount, currency, issue_date, client_id, clients(name)')

  // Apply filters
  if (filters.start_date) {
    query = query.gte('issue_date', filters.start_date)
  }
  if (filters.end_date) {
    query = query.lte('issue_date', filters.end_date)
  }
  if (filters.client_id) {
    query = query.eq('client_id', filters.client_id)
  }
  if (filters.currency) {
    query = query.eq('currency', filters.currency)
  }

  const { data, error } = await query

  if (error) throw error

  // Calculate metrics
  const metrics = calculateFinancialMetrics(data || [], filters.metric)
  const grouped = groupFinancialData(data || [], filters.group_by || 'status')

  return {
    metrics,
    grouped,
    total_count: data?.length || 0
  }
}

/**
 * Calculate financial metrics
 */
function calculateFinancialMetrics(data: any[], metric?: string) {
  const metrics: Record<string, any> = {
    total_revenue: 0,
    total_outstanding: 0,
    total_paid: 0,
    total_overdue: 0
  }

  data.forEach(invoice => {
    const amount = parseFloat(invoice.amount)

    switch (invoice.status) {
      case 'paid':
        metrics.total_paid += amount
        metrics.total_revenue += amount
        break
      case 'sent':
        metrics.total_outstanding += amount
        break
      case 'overdue':
        metrics.total_overdue += amount
        metrics.total_outstanding += amount
        break
    }
  })

  return metric ? { [metric]: metrics[`total_${metric}`] } : metrics
}

/**
 * Group financial data
 */
function groupFinancialData(data: any[], groupBy: string) {
  const grouped: Record<string, any> = {}

  data.forEach(item => {
    let key = ''

    switch (groupBy) {
      case 'client':
        key = item.clients?.name || 'Unknown'
        break
      case 'date':
        key = new Date(item.issue_date).toISOString().split('T')[0]
        break
      case 'currency':
        key = item.currency
        break
      case 'status':
        key = item.status
        break
      default:
        key = item.status
    }

    if (!grouped[key]) {
      grouped[key] = {
        count: 0,
        total_amount: 0,
        items: []
      }
    }

    grouped[key].count++
    grouped[key].total_amount += parseFloat(item.amount)
    grouped[key].items.push(item.id)
  })

  return Object.entries(grouped).map(([key, value]) => ({
    group: key,
    ...value
  }))
}

/**
 * Get compliance analytics
 */
export async function getComplianceAnalytics(filters: {
  start_date?: string
  end_date?: string
  compliance_status?: string[]
  risk_level?: string[]
  client_type?: string[]
  country?: string
  group_by?: 'status' | 'risk_level' | 'type' | 'country' | 'date'
}) {
  const supabase = createClient()

  let query = supabase
    .from('clients')
    .select('id, name, type, compliance_status, risk_level, country, created_at')

  // Apply filters
  if (filters.start_date) {
    query = query.gte('created_at', filters.start_date)
  }
  if (filters.end_date) {
    query = query.lte('created_at', filters.end_date)
  }
  if (filters.compliance_status && filters.compliance_status.length > 0) {
    query = query.in('compliance_status', filters.compliance_status)
  }
  if (filters.risk_level && filters.risk_level.length > 0) {
    query = query.in('risk_level', filters.risk_level)
  }
  if (filters.client_type && filters.client_type.length > 0) {
    query = query.in('type', filters.client_type)
  }
  if (filters.country) {
    query = query.eq('country', filters.country)
  }

  const { data, error } = await query

  if (error) throw error

  // Calculate compliance metrics
  const metrics = calculateComplianceMetrics(data || [])
  const grouped = groupComplianceData(data || [], filters.group_by || 'status')

  return {
    metrics,
    grouped,
    total_count: data?.length || 0
  }
}

/**
 * Calculate compliance metrics
 */
function calculateComplianceMetrics(data: any[]) {
  const metrics = {
    total_clients: data.length,
    pending: 0,
    approved: 0,
    rejected: 0,
    under_review: 0,
    high_risk: 0,
    medium_risk: 0,
    low_risk: 0,
    compliance_rate: 0
  }

  data.forEach(client => {
    // Count by compliance status
    if (client.compliance_status === 'pending') metrics.pending++
    if (client.compliance_status === 'approved') metrics.approved++
    if (client.compliance_status === 'rejected') metrics.rejected++
    if (client.compliance_status === 'under_review') metrics.under_review++

    // Count by risk level
    if (client.risk_level === 'high') metrics.high_risk++
    if (client.risk_level === 'medium') metrics.medium_risk++
    if (client.risk_level === 'low') metrics.low_risk++
  })

  // Calculate compliance rate (approved / total)
  metrics.compliance_rate = data.length > 0 
    ? Math.round((metrics.approved / data.length) * 100) 
    : 0

  return metrics
}

/**
 * Group compliance data
 */
function groupComplianceData(data: any[], groupBy: string) {
  const grouped: Record<string, any> = {}

  data.forEach(item => {
    let key = ''

    switch (groupBy) {
      case 'status':
        key = item.compliance_status
        break
      case 'risk_level':
        key = item.risk_level
        break
      case 'type':
        key = item.type
        break
      case 'country':
        key = item.country
        break
      case 'date':
        key = new Date(item.created_at).toISOString().split('T')[0]
        break
      default:
        key = item.compliance_status
    }

    if (!grouped[key]) {
      grouped[key] = {
        count: 0,
        items: []
      }
    }

    grouped[key].count++
    grouped[key].items.push(item.id)
  })

  return Object.entries(grouped).map(([key, value]) => ({
    group: key,
    ...value
  }))
}

