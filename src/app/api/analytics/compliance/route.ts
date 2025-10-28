import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authServer } from '@/lib/auth-server'
import { analyticsFiltersSchema } from '@/lib/validations/analytics'
import { analyticsUtils } from '@/lib/analytics-utils'

export async function GET(request: NextRequest) {
  try {
    // Require permission to view compliance analytics
    const user = await authServer.requireRole(['admin', 'compliance'])
    
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    // Parse and validate filters
    const filters = analyticsFiltersSchema.parse({
      date_range: searchParams.get('start_date') && searchParams.get('end_date') ? {
        start_date: searchParams.get('start_date')!,
        end_date: searchParams.get('end_date')!
      } : undefined,
      client_type: searchParams.get('client_type') || undefined,
      group_by: (searchParams.get('group_by') as any) || 'month'
    })
    
    // Set default date range if not provided
    const dateRange = filters.date_range || analyticsUtils.getDateRange('year')
    
    // Normalize date range to ensure consistent format
    const startDate = 'start_date' in dateRange ? dateRange.start_date : dateRange.start.toISOString()
    const endDate = 'end_date' in dateRange ? dateRange.end_date : dateRange.end.toISOString()
    
    // Fetch compliance-related data
    const [clientsResult, auditLogsResult, complianceAssessmentsResult] = await Promise.all([
      // Clients with compliance status
      supabase
        .from('clients')
        .select(`
          id,
          name,
          type,
          country,
          compliance_status,
          risk_level,
          kyc_documents,
          created_at,
          updated_at
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      
      // Audit logs for compliance activities
      supabase
        .from('audit_logs')
        .select(`
          id,
          user_id,
          action,
          resource_type,
          resource_id,
          details,
          created_at,
          user_profiles(full_name, role)
        `)
        .in('action', [
          'kyc_document_uploaded',
          'kyc_document_approved',
          'kyc_document_rejected',
          'risk_assessment_created',
          'risk_assessment_updated',
          'compliance_status_changed',
          'client_approved',
          'client_rejected'
        ])
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false }),
      
      // Compliance assessments (if table exists)
      supabase
        .from('compliance_assessments')
        .select(`
          id,
          client_id,
          assessment_type,
          risk_score,
          status,
          findings,
          created_at,
          updated_at
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })
    ])
    
    // Handle potential errors (some tables might not exist)
    const clients = clientsResult.data || []
    const auditLogs = auditLogsResult.data || []
    const complianceAssessments = complianceAssessmentsResult.data || []
    
    // Calculate compliance metrics
    const totalClients = clients.length
    const approvedClients = clients.filter(c => c.compliance_status === 'approved').length
    const pendingClients = clients.filter(c => c.compliance_status === 'pending').length
    const rejectedClients = clients.filter(c => c.compliance_status === 'rejected').length
    const underReviewClients = clients.filter(c => c.compliance_status === 'under_review').length
    
    const complianceRate = totalClients > 0 ? (approvedClients / totalClients) * 100 : 0
    
    // Risk level distribution
    const riskDistribution = clients.reduce((acc, client) => {
      acc[client.risk_level] = (acc[client.risk_level] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Client type compliance breakdown
    const clientTypeCompliance = clients.reduce((acc, client) => {
      const type = client.type
      if (!acc[type]) {
        acc[type] = {
          total: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
          under_review: 0
        }
      }
      
      acc[type].total++
      acc[type][client.compliance_status]++
      
      return acc
    }, {} as Record<string, any>)
    
    // Country compliance breakdown
    const countryCompliance = clients.reduce((acc, client) => {
      const country = client.country
      if (!acc[country]) {
        acc[country] = {
          total: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
          under_review: 0
        }
      }
      
      acc[country].total++
      acc[country][client.compliance_status]++
      
      return acc
    }, {} as Record<string, any>)
    
    // KYC document analysis
    const kycAnalysis = clients.reduce((acc, client) => {
      const documents = client.kyc_documents || []
      const docCount = Array.isArray(documents) ? documents.length : 0
      
      if (docCount === 0) acc.no_documents++
      else if (docCount < 3) acc.incomplete++
      else acc.complete++
      
      return acc
    }, { no_documents: 0, incomplete: 0, complete: 0 })
    
    // Compliance activity timeline
    const timePoints = analyticsUtils.generateTimeSeriesPoints(
      startDate,
      endDate,
      filters.group_by
    )
    
    const complianceTimeSeries = timePoints.map(point => {
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
      
      const periodClients = clients.filter(client => {
        const createdAt = new Date(client.created_at)
        return createdAt >= pointDate && createdAt < nextPoint
      })
      
      const periodAuditLogs = auditLogs.filter(log => {
        const createdAt = new Date(log.created_at)
        return createdAt >= pointDate && createdAt < nextPoint
      })
      
      return {
        date: analyticsUtils.formatDateForGroup(point, filters.group_by),
        new_clients: periodClients.length,
        approved_clients: periodClients.filter(c => c.compliance_status === 'approved').length,
        compliance_activities: periodAuditLogs.length,
        kyc_approvals: periodAuditLogs.filter(log => log.action === 'kyc_document_approved').length,
        kyc_rejections: periodAuditLogs.filter(log => log.action === 'kyc_document_rejected').length
      }
    })
    
    // Compliance team activity
    const teamActivity = auditLogs.reduce((acc, log) => {
      const userProfile = Array.isArray(log.user_profiles) ? log.user_profiles[0] : log.user_profiles
      const userName = userProfile?.full_name || 'Unknown'
      const userRole = userProfile?.role || 'unknown'
      
      if (!acc[userName]) {
        acc[userName] = {
          user_name: userName,
          user_role: userRole,
          total_activities: 0,
          approvals: 0,
          rejections: 0,
          assessments: 0
        }
      }
      
      acc[userName].total_activities++
      
      if (log.action.includes('approved')) acc[userName].approvals++
      if (log.action.includes('rejected')) acc[userName].rejections++
      if (log.action.includes('assessment')) acc[userName].assessments++
      
      return acc
    }, {} as Record<string, any>)
    
    const topTeamMembers = Object.values(teamActivity)
      .sort((a: any, b: any) => b.total_activities - a.total_activities)
      .slice(0, 10)
    
    // Recent compliance activities
    const recentActivities = auditLogs.slice(0, 20).map(log => {
      const userProfile = Array.isArray(log.user_profiles) ? log.user_profiles[0] : log.user_profiles
      return {
        id: log.id,
        action: log.action,
        resource_type: log.resource_type,
        resource_id: log.resource_id,
        user_name: userProfile?.full_name || 'Unknown',
        user_role: userProfile?.role || 'unknown',
        details: log.details,
        created_at: log.created_at
      }
    })
    
    // Compliance issues and alerts
    const complianceIssues = {
      high_risk_clients: clients.filter(c => c.risk_level === 'high').length,
      pending_reviews: pendingClients + underReviewClients,
      rejected_applications: rejectedClients,
      incomplete_kyc: kycAnalysis.incomplete + kycAnalysis.no_documents,
      overdue_reviews: clients.filter(c => {
        if (c.compliance_status !== 'under_review') return false
        const daysSinceUpdate = Math.floor(
          (new Date().getTime() - new Date(c.updated_at).getTime()) / (1000 * 60 * 60 * 24)
        )
        return daysSinceUpdate > 30 // Consider overdue if under review for more than 30 days
      }).length
    }
    
    // Compliance performance metrics
    const performanceMetrics = {
      total_clients: totalClients,
      approved_clients: approvedClients,
      pending_clients: pendingClients,
      rejected_clients: rejectedClients,
      under_review_clients: underReviewClients,
      compliance_rate: complianceRate,
      avg_approval_time: calculateAverageApprovalTime(clients, auditLogs),
      total_compliance_activities: auditLogs.length,
      kyc_approval_rate: calculateKYCApprovalRate(auditLogs),
      risk_assessment_count: complianceAssessments.length
    }
    
    const analytics = {
      performance_metrics: performanceMetrics,
      distributions: {
        compliance_status: {
          approved: approvedClients,
          pending: pendingClients,
          rejected: rejectedClients,
          under_review: underReviewClients
        },
        risk_levels: riskDistribution,
        client_types: clientTypeCompliance,
        countries: countryCompliance,
        kyc_status: kycAnalysis
      },
      time_series: complianceTimeSeries,
      team_activity: topTeamMembers,
      compliance_issues: complianceIssues,
      recent_activities: recentActivities,
      date_range: dateRange,
      generated_at: new Date().toISOString()
    }
    
    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Compliance analytics API error:', error)
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to calculate average approval time
function calculateAverageApprovalTime(clients: any[], auditLogs: any[]): number {
  const approvedClients = clients.filter(c => c.compliance_status === 'approved')
  
  if (approvedClients.length === 0) return 0
  
  let totalDays = 0
  let count = 0
  
  approvedClients.forEach(client => {
    const approvalLog = auditLogs.find(log => 
      log.action === 'client_approved' && 
      log.resource_id === client.id
    )
    
    if (approvalLog) {
      const createdDate = new Date(client.created_at)
      const approvalDate = new Date(approvalLog.created_at)
      const daysDiff = Math.floor((approvalDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff >= 0) {
        totalDays += daysDiff
        count++
      }
    }
  })
  
  return count > 0 ? totalDays / count : 0
}

// Helper function to calculate KYC approval rate
function calculateKYCApprovalRate(auditLogs: any[]): number {
  const kycApprovals = auditLogs.filter(log => log.action === 'kyc_document_approved').length
  const kycRejections = auditLogs.filter(log => log.action === 'kyc_document_rejected').length
  const totalKYCDecisions = kycApprovals + kycRejections
  
  return totalKYCDecisions > 0 ? (kycApprovals / totalKYCDecisions) * 100 : 0
}
