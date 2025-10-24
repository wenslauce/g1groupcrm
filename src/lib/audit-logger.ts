import { createClient } from '@/lib/supabase/client'

export interface AuditLogEntry {
  action: string
  resource_type: string
  resource_id?: string
  details?: Record<string, any>
  ip_address?: string
  user_agent?: string
}

export class AuditLogger {
  private static instance: AuditLogger
  private supabase = createClient()

  private constructor() {}

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger()
    }
    return AuditLogger.instance
  }

  /**
   * Log an audit event
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      // Get current user
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        console.warn('Audit log attempted without authenticated user')
        return
      }

      // Get client info if available
      const ip = this.getClientIP()
      const userAgent = navigator?.userAgent || 'unknown'

      const auditData = {
        user_id: user.id,
        action: entry.action,
        resource_type: entry.resource_type,
        resource_id: entry.resource_id,
        details: entry.details || {},
        ip_address: entry.ip_address || ip,
        user_agent: entry.user_agent || userAgent
      }

      // Insert audit log
      const { error } = await this.supabase
        .from('audit_logs')
        .insert(auditData)

      if (error) {
        console.error('Failed to create audit log:', error)
      }
    } catch (error) {
      console.error('Audit logging error:', error)
    }
  }

  /**
   * Log user authentication events
   */
  async logAuth(action: 'login_success' | 'login_failed' | 'logout' | 'password_changed', details?: Record<string, any>): Promise<void> {
    await this.log({
      action,
      resource_type: 'auth',
      details
    })
  }

  /**
   * Log client-related actions
   */
  async logClient(action: 'created' | 'updated' | 'deleted' | 'viewed', clientId: string, details?: Record<string, any>): Promise<void> {
    await this.log({
      action: `client_${action}`,
      resource_type: 'client',
      resource_id: clientId,
      details
    })
  }

  /**
   * Log SKR-related actions
   */
  async logSKR(action: 'created' | 'updated' | 'approved' | 'issued' | 'status_changed' | 'viewed', skrId: string, details?: Record<string, any>): Promise<void> {
    await this.log({
      action: `skr_${action}`,
      resource_type: 'skr',
      resource_id: skrId,
      details
    })
  }

  /**
   * Log asset-related actions
   */
  async logAsset(action: 'created' | 'updated' | 'deleted' | 'viewed', assetId: string, details?: Record<string, any>): Promise<void> {
    await this.log({
      action: `asset_${action}`,
      resource_type: 'asset',
      resource_id: assetId,
      details
    })
  }

  /**
   * Log financial document actions
   */
  async logFinancial(action: 'invoice_created' | 'invoice_updated' | 'receipt_created' | 'credit_note_created' | 'payment_processed', documentId: string, details?: Record<string, any>): Promise<void> {
    await this.log({
      action,
      resource_type: 'financial_document',
      resource_id: documentId,
      details
    })
  }

  /**
   * Log KYC and compliance actions
   */
  async logCompliance(action: 'kyc_document_uploaded' | 'kyc_document_approved' | 'kyc_document_rejected' | 'risk_assessment_created' | 'risk_assessment_updated' | 'compliance_status_changed', resourceId: string, details?: Record<string, any>): Promise<void> {
    await this.log({
      action,
      resource_type: 'compliance',
      resource_id: resourceId,
      details
    })
  }

  /**
   * Log tracking actions
   */
  async logTracking(action: 'location_updated' | 'status_changed' | 'tracking_viewed', trackingId: string, details?: Record<string, any>): Promise<void> {
    await this.log({
      action: `tracking_${action}`,
      resource_type: 'tracking',
      resource_id: trackingId,
      details
    })
  }

  /**
   * Log system access and navigation
   */
  async logAccess(action: 'page_accessed' | 'api_called' | 'file_downloaded' | 'report_generated', resource?: string, details?: Record<string, any>): Promise<void> {
    await this.log({
      action,
      resource_type: 'system',
      resource_id: resource,
      details
    })
  }

  /**
   * Log security events
   */
  async logSecurity(action: 'suspicious_activity' | 'account_locked' | 'role_changed' | 'permission_denied', details?: Record<string, any>): Promise<void> {
    await this.log({
      action,
      resource_type: 'security',
      details
    })
  }

  /**
   * Log data export/import actions
   */
  async logDataTransfer(action: 'data_exported' | 'data_imported' | 'backup_created' | 'backup_restored', details?: Record<string, any>): Promise<void> {
    await this.log({
      action,
      resource_type: 'data_transfer',
      details
    })
  }

  /**
   * Get client IP address (best effort)
   */
  private getClientIP(): string {
    // This is a simplified approach - in a real application,
    // you might want to use a more sophisticated method
    return 'client-side'
  }

  /**
   * Batch log multiple entries
   */
  async logBatch(entries: AuditLogEntry[]): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        console.warn('Batch audit log attempted without authenticated user')
        return
      }

      const ip = this.getClientIP()
      const userAgent = navigator?.userAgent || 'unknown'

      const auditData = entries.map(entry => ({
        user_id: user.id,
        action: entry.action,
        resource_type: entry.resource_type,
        resource_id: entry.resource_id,
        details: entry.details || {},
        ip_address: entry.ip_address || ip,
        user_agent: entry.user_agent || userAgent
      }))

      const { error } = await this.supabase
        .from('audit_logs')
        .insert(auditData)

      if (error) {
        console.error('Failed to create batch audit logs:', error)
      }
    } catch (error) {
      console.error('Batch audit logging error:', error)
    }
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance()

// Export convenience functions
export const logAuth = (action: 'login_success' | 'login_failed' | 'logout' | 'password_changed', details?: Record<string, any>) => 
  auditLogger.logAuth(action, details)

export const logClient = (action: 'created' | 'updated' | 'deleted' | 'viewed', clientId: string, details?: Record<string, any>) => 
  auditLogger.logClient(action, clientId, details)

export const logSKR = (action: 'created' | 'updated' | 'approved' | 'issued' | 'status_changed' | 'viewed', skrId: string, details?: Record<string, any>) => 
  auditLogger.logSKR(action, skrId, details)

export const logAsset = (action: 'created' | 'updated' | 'deleted' | 'viewed', assetId: string, details?: Record<string, any>) => 
  auditLogger.logAsset(action, assetId, details)

export const logFinancial = (action: 'invoice_created' | 'invoice_updated' | 'receipt_created' | 'credit_note_created' | 'payment_processed', documentId: string, details?: Record<string, any>) => 
  auditLogger.logFinancial(action, documentId, details)

export const logCompliance = (action: 'kyc_document_uploaded' | 'kyc_document_approved' | 'kyc_document_rejected' | 'risk_assessment_created' | 'risk_assessment_updated' | 'compliance_status_changed', resourceId: string, details?: Record<string, any>) => 
  auditLogger.logCompliance(action, resourceId, details)

export const logTracking = (action: 'location_updated' | 'status_changed' | 'tracking_viewed', trackingId: string, details?: Record<string, any>) => 
  auditLogger.logTracking(action, trackingId, details)

export const logAccess = (action: 'page_accessed' | 'api_called' | 'file_downloaded' | 'report_generated', resource?: string, details?: Record<string, any>) => 
  auditLogger.logAccess(action, resource, details)

export const logSecurity = (action: 'suspicious_activity' | 'account_locked' | 'role_changed' | 'permission_denied', details?: Record<string, any>) => 
  auditLogger.logSecurity(action, details)

export const logDataTransfer = (action: 'data_exported' | 'data_imported' | 'backup_created' | 'backup_restored', details?: Record<string, any>) => 
  auditLogger.logDataTransfer(action, details)