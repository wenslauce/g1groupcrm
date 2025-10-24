import { createClient } from '@/lib/supabase/server'

export interface SMSData {
  to: string
  message: string
}

export interface SMSTemplate {
  message: string
}

export class SMSService {
  private supabase = createClient()
  private maxMessageLength = 160 // Standard SMS length

  /**
   * Send SMS immediately (for testing/development)
   */
  async sendSMS(smsData: SMSData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Validate phone number format
      if (!this.isValidPhoneNumber(smsData.to)) {
        return {
          success: false,
          error: 'Invalid phone number format'
        }
      }

      // Validate message length
      if (smsData.message.length > this.maxMessageLength) {
        return {
          success: false,
          error: `Message too long. Maximum ${this.maxMessageLength} characters allowed.`
        }
      }

      // In a real implementation, you would integrate with an SMS service like:
      // - Twilio
      // - AWS SNS
      // - MessageBird
      // - Vonage (Nexmo)
      // - Plivo
      
      // For now, we'll simulate SMS sending and log the SMS
      console.log('📱 SMS would be sent:', {
        to: smsData.to,
        message: smsData.message,
        length: smsData.message.length
      })

      // Simulate SMS service response
      const messageId = `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      return {
        success: true,
        messageId
      }
    } catch (error) {
      console.error('SMS sending failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Queue SMS for reliable delivery
   */
  async queueSMS(
    notificationId: string,
    to: string,
    message: string,
    scheduledAt?: Date
  ): Promise<{ success: boolean; queueId?: string; error?: string }> {
    try {
      // Validate inputs
      if (!this.isValidPhoneNumber(to)) {
        return {
          success: false,
          error: 'Invalid phone number format'
        }
      }

      if (message.length > this.maxMessageLength) {
        return {
          success: false,
          error: `Message too long. Maximum ${this.maxMessageLength} characters allowed.`
        }
      }

      const { data, error } = await this.supabase
        .from('sms_queue')
        .insert({
          notification_id: notificationId,
          to_phone: to,
          message,
          scheduled_at: scheduledAt?.toISOString() || new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return {
        success: true,
        queueId: data.id
      }
    } catch (error) {
      console.error('SMS queueing failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Process SMS queue (would be called by a background job)
   */
  async processSMSQueue(limit = 10): Promise<void> {
    try {
      // Get pending SMS messages
      const { data: smsMessages, error } = await this.supabase
        .from('sms_queue')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_at', new Date().toISOString())
        .lt('retry_count', 3) // Don't retry more than 3 times
        .order('scheduled_at', { ascending: true })
        .limit(limit)

      if (error) {
        throw error
      }

      if (!smsMessages || smsMessages.length === 0) {
        return
      }

      // Process each SMS
      for (const sms of smsMessages) {
        try {
          const result = await this.sendSMS({
            to: sms.to_phone,
            message: sms.message
          })

          if (result.success) {
            // Mark as sent
            await this.supabase
              .from('sms_queue')
              .update({
                status: 'sent',
                sent_at: new Date().toISOString()
              })
              .eq('id', sms.id)

            // Update notification status
            await this.supabase
              .from('notifications')
              .update({
                status: 'sent',
                sent_at: new Date().toISOString()
              })
              .eq('id', sms.notification_id)
          } else {
            // Mark as failed and increment retry count
            await this.supabase
              .from('sms_queue')
              .update({
                status: sms.retry_count >= 2 ? 'failed' : 'pending',
                error_message: result.error,
                retry_count: sms.retry_count + 1
              })
              .eq('id', sms.id)

            if (sms.retry_count >= 2) {
              // Update notification status to failed
              await this.supabase
                .from('notifications')
                .update({
                  status: 'failed',
                  error_message: result.error
                })
                .eq('id', sms.notification_id)
            }
          }
        } catch (error) {
          console.error(`Failed to process SMS ${sms.id}:`, error)
          
          // Mark as failed
          await this.supabase
            .from('sms_queue')
            .update({
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error',
              retry_count: sms.retry_count + 1
            })
            .eq('id', sms.id)
        }
      }
    } catch (error) {
      console.error('SMS queue processing failed:', error)
    }
  }

  /**
   * Get SMS templates
   */
  async getTemplate(type: string, channel: 'sms'): Promise<SMSTemplate | null> {
    try {
      const { data, error } = await this.supabase
        .from('notification_templates')
        .select('body_template')
        .eq('type', type)
        .eq('channel', channel)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        return null
      }

      return {
        message: data.body_template
      }
    } catch (error) {
      console.error('Failed to get SMS template:', error)
      return null
    }
  }

  /**
   * Render template with variables
   */
  renderTemplate(template: string, variables: Record<string, any>): string {
    let rendered = template
    
    // Simple template variable replacement
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      rendered = rendered.replace(regex, String(value))
    })
    
    // Truncate if too long
    if (rendered.length > this.maxMessageLength) {
      rendered = rendered.substring(0, this.maxMessageLength - 3) + '...'
    }
    
    return rendered
  }

  /**
   * Validate phone number format
   */
  private isValidPhoneNumber(phone: string): boolean {
    // Basic phone number validation
    // In a real implementation, you might use a library like libphonenumber
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
  }

  /**
   * Format phone number for SMS sending
   */
  formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    let formatted = phone.replace(/[^\d+]/g, '')
    
    // Add + if not present and doesn't start with 00
    if (!formatted.startsWith('+') && !formatted.startsWith('00')) {
      formatted = '+' + formatted
    }
    
    return formatted
  }

  /**
   * Create default SMS templates
   */
  async createDefaultTemplates(): Promise<void> {
    const templates = [
      {
        name: 'SKR Created SMS',
        type: 'skr_created',
        channel: 'sms',
        body_template: 'G1 Holdings: Your SKR {{skr_number}} has been created for {{asset_name}}. Track status in your dashboard.'
      },
      {
        name: 'SKR Approved SMS',
        type: 'skr_approved',
        channel: 'sms',
        body_template: 'G1 Holdings: Your SKR {{skr_number}} has been approved and will be issued shortly.'
      },
      {
        name: 'SKR Issued SMS',
        type: 'skr_issued',
        channel: 'sms',
        body_template: 'G1 Holdings: Your SKR {{skr_number}} has been issued. Download from your dashboard.'
      },
      {
        name: 'Client Approved SMS',
        type: 'client_approved',
        channel: 'sms',
        body_template: 'G1 Holdings: Welcome! Your account has been approved. You can now access all services.'
      },
      {
        name: 'Invoice Overdue SMS',
        type: 'invoice_overdue',
        channel: 'sms',
        body_template: 'G1 Holdings: Invoice {{invoice_number}} is overdue. Please make payment ASAP to avoid service interruption.'
      },
      {
        name: 'Security Alert SMS',
        type: 'security_alert',
        channel: 'sms',
        body_template: 'G1 Holdings SECURITY ALERT: {{message}}. If this wasn\'t you, contact support immediately.'
      },
      {
        name: 'Compliance Alert SMS',
        type: 'compliance_alert',
        channel: 'sms',
        body_template: 'G1 Holdings: Compliance action required. {{message}}. Check your dashboard for details.'
      }
    ]

    for (const template of templates) {
      try {
        await this.supabase
          .from('notification_templates')
          .upsert(template, { onConflict: 'name,type,channel' })
      } catch (error) {
        console.error('Failed to create SMS template:', template.name, error)
      }
    }
  }

  /**
   * Get SMS delivery statistics
   */
  async getDeliveryStats(startDate?: Date, endDate?: Date): Promise<{
    total_sent: number
    total_delivered: number
    total_failed: number
    delivery_rate: number
  }> {
    try {
      let query = this.supabase
        .from('sms_queue')
        .select('status')

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString())
      }

      if (endDate) {
        query = query.lte('created_at', endDate.toISOString())
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      const stats = {
        total_sent: 0,
        total_delivered: 0,
        total_failed: 0,
        delivery_rate: 0
      }

      if (data) {
        stats.total_sent = data.filter(sms => sms.status === 'sent').length
        stats.total_delivered = data.filter(sms => sms.status === 'delivered').length
        stats.total_failed = data.filter(sms => sms.status === 'failed').length
        
        const totalAttempted = stats.total_sent + stats.total_delivered + stats.total_failed
        stats.delivery_rate = totalAttempted > 0 
          ? ((stats.total_sent + stats.total_delivered) / totalAttempted) * 100 
          : 0
      }

      return stats
    } catch (error) {
      console.error('Failed to get SMS delivery stats:', error)
      return {
        total_sent: 0,
        total_delivered: 0,
        total_failed: 0,
        delivery_rate: 0
      }
    }
  }

  /**
   * Check if user has opted out of SMS notifications
   */
  async hasOptedOut(phoneNumber: string): Promise<boolean> {
    try {
      // In a real implementation, you would maintain an opt-out list
      // For now, return false (no one has opted out)
      return false
    } catch (error) {
      console.error('Failed to check opt-out status:', error)
      return false
    }
  }

  /**
   * Add phone number to opt-out list
   */
  async addToOptOut(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    try {
      // In a real implementation, you would add to an opt-out table
      console.log(`Phone number ${phoneNumber} added to opt-out list`)
      
      return { success: true }
    } catch (error) {
      console.error('Failed to add to opt-out list:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Export singleton instance
export const smsService = new SMSService()