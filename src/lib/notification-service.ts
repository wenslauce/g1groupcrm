import { createClient } from '@/lib/supabase/server'
import { emailService } from './email-service'
import { smsService } from './sms-service'

export interface NotificationData {
  userId: string
  type: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  subject?: string
  message: string
  data?: Record<string, any>
  scheduledAt?: Date
}

export interface NotificationPreferences {
  email_enabled: boolean
  sms_enabled: boolean
  in_app_enabled: boolean
  push_enabled: boolean
}

export class NotificationService {
  private supabase = createClient()

  /**
   * Send notification through all enabled channels
   */
  async sendNotification(notificationData: NotificationData): Promise<{ success: boolean; notificationIds: string[]; errors: string[] }> {
    const results = {
      success: true,
      notificationIds: [] as string[],
      errors: [] as string[]
    }

    try {
      // Get user preferences
      const preferences = await this.getUserPreferences(notificationData.userId, notificationData.type)
      
      // Get user profile for email/phone
      const { data: userProfile, error: userError } = await this.supabase
        .from('user_profiles')
        .select('email, full_name, phone')
        .eq('id', notificationData.userId)
        .single()

      if (userError || !userProfile) {
        results.errors.push('User profile not found')
        results.success = false
        return results
      }

      // Send through enabled channels
      const channels = []
      if (preferences.email_enabled) channels.push('email')
      if (preferences.sms_enabled) channels.push('sms')
      if (preferences.in_app_enabled) channels.push('in_app')

      for (const channel of channels) {
        try {
          const notificationId = await this.createNotification({
            ...notificationData,
            channel: channel as any
          })

          if (notificationId) {
            results.notificationIds.push(notificationId)

            // Process the notification based on channel
            switch (channel) {
              case 'email':
                await this.sendEmailNotification(notificationId, userProfile.email, userProfile.full_name, notificationData)
                break
              case 'sms':
                await this.sendSMSNotification(notificationId, userProfile.phone, userProfile.full_name, notificationData)
                break
              case 'in_app':
                // In-app notifications are already created, no additional processing needed
                break
            }
          }
        } catch (error) {
          results.errors.push(`Failed to send ${channel} notification: ${error instanceof Error ? error.message : 'Unknown error'}`)
          results.success = false
        }
      }

      return results
    } catch (error) {
      results.errors.push(error instanceof Error ? error.message : 'Unknown error')
      results.success = false
      return results
    }
  }

  /**
   * Create notification record in database
   */
  private async createNotification(data: NotificationData & { channel: string }): Promise<string | null> {
    try {
      const { data: notification, error } = await this.supabase
        .from('notifications')
        .insert({
          user_id: data.userId,
          type: data.type,
          channel: data.channel,
          priority: data.priority || 'medium',
          subject: data.subject,
          message: data.message,
          data: data.data || {},
          scheduled_at: data.scheduledAt?.toISOString() || new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return notification.id
    } catch (error) {
      console.error('Failed to create notification:', error)
      return null
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    notificationId: string,
    email: string,
    userName: string,
    data: NotificationData
  ): Promise<void> {
    try {
      // Get email template
      const template = await emailService.getTemplate(data.type, 'email')
      
      let subject = data.subject || `Notification from G1 Holdings`
      let htmlBody = data.message
      let textBody = data.message

      if (template) {
        // Prepare template variables
        const variables = {
          user_name: userName,
          client_name: userName,
          ...data.data
        }

        subject = emailService.renderTemplate(template.subject, variables)
        htmlBody = emailService.renderTemplate(template.html, variables)
        textBody = template.text ? emailService.renderTemplate(template.text, variables) : htmlBody
      }

      // Queue email for delivery
      await emailService.queueEmail(
        notificationId,
        email,
        subject,
        htmlBody,
        textBody,
        data.scheduledAt
      )
    } catch (error) {
      console.error('Failed to send email notification:', error)
      throw error
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(
    notificationId: string,
    phone: string,
    userName: string,
    data: NotificationData
  ): Promise<void> {
    try {
      if (!phone) {
        throw new Error('User phone number not available')
      }

      // Check if user has opted out
      const hasOptedOut = await smsService.hasOptedOut(phone)
      if (hasOptedOut) {
        console.log(`User ${userName} has opted out of SMS notifications`)
        
        // Mark notification as delivered but note the opt-out
        await this.supabase
          .from('notifications')
          .update({
            status: 'delivered',
            sent_at: new Date().toISOString(),
            error_message: 'User opted out of SMS notifications'
          })
          .eq('id', notificationId)
        
        return
      }

      // Get SMS template
      const template = await smsService.getTemplate(data.type, 'sms')
      
      let message = data.message

      if (template) {
        // Prepare template variables
        const variables = {
          user_name: userName,
          client_name: userName,
          ...data.data
        }

        message = smsService.renderTemplate(template.message, variables)
      }

      // Format phone number
      const formattedPhone = smsService.formatPhoneNumber(phone)

      // Queue SMS for delivery
      await smsService.queueSMS(
        notificationId,
        formattedPhone,
        message,
        data.scheduledAt
      )
    } catch (error) {
      console.error('Failed to send SMS notification:', error)
      throw error
    }
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string, notificationType: string): Promise<NotificationPreferences> {
    try {
      const { data, error } = await this.supabase
        .from('notification_preferences')
        .select('email_enabled, sms_enabled, in_app_enabled, push_enabled')
        .eq('user_id', userId)
        .eq('notification_type', notificationType)
        .single()

      if (error || !data) {
        // Return default preferences if none found
        return {
          email_enabled: true,
          sms_enabled: false,
          in_app_enabled: true,
          push_enabled: true
        }
      }

      return data
    } catch (error) {
      console.error('Failed to get user preferences:', error)
      // Return default preferences on error
      return {
        email_enabled: true,
        sms_enabled: false,
        in_app_enabled: true,
        push_enabled: true
      }
    }
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(
    userId: string,
    notificationType: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          notification_type: notificationType,
          ...preferences
        }, {
          onConflict: 'user_id,notification_type'
        })

      if (error) {
        throw error
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to update user preferences:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    options: {
      channel?: string
      status?: string
      limit?: number
      offset?: number
      unreadOnly?: boolean
    } = {}
  ): Promise<{ notifications: any[]; total: number }> {
    try {
      let query = this.supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (options.channel) {
        query = query.eq('channel', options.channel)
      }

      if (options.status) {
        query = query.eq('status', options.status)
      }

      if (options.unreadOnly) {
        query = query.is('read_at', null)
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
      }

      const { data, error, count } = await query

      if (error) {
        throw error
      }

      return {
        notifications: data || [],
        total: count || 0
      }
    } catch (error) {
      console.error('Failed to get user notifications:', error)
      return {
        notifications: [],
        total: 0
      }
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', userId)

      if (error) {
        throw error
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .is('read_at', null)

      if (error) {
        throw error
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId)

      if (error) {
        throw error
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to delete notification:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send SKR-related notifications
   */
  async sendSKRNotification(
    type: 'skr_created' | 'skr_approved' | 'skr_issued' | 'skr_status_changed',
    userId: string,
    skrData: {
      skr_number: string
      asset_name: string
      asset_value: number
      currency: string
      status: string
      client_name: string
      issue_date?: string
    }
  ): Promise<{ success: boolean; notificationIds: string[]; errors: string[] }> {
    const messages = {
      skr_created: `Your SKR ${skrData.skr_number} has been created for asset ${skrData.asset_name}`,
      skr_approved: `Your SKR ${skrData.skr_number} has been approved and is ready for issuance`,
      skr_issued: `Your SKR ${skrData.skr_number} has been officially issued`,
      skr_status_changed: `Your SKR ${skrData.skr_number} status has been updated to ${skrData.status}`
    }

    return this.sendNotification({
      userId,
      type,
      priority: type === 'skr_issued' ? 'high' : 'medium',
      message: messages[type],
      data: skrData
    })
  }

  /**
   * Send compliance-related notifications
   */
  async sendComplianceNotification(
    type: 'client_approved' | 'client_rejected' | 'kyc_document_approved' | 'kyc_document_rejected',
    userId: string,
    data: Record<string, any>
  ): Promise<{ success: boolean; notificationIds: string[]; errors: string[] }> {
    const messages = {
      client_approved: 'Your account has been approved! Welcome to G1 Holdings.',
      client_rejected: 'Your account application requires additional information.',
      kyc_document_approved: 'Your KYC document has been approved.',
      kyc_document_rejected: 'Your KYC document requires revision.'
    }

    return this.sendNotification({
      userId,
      type,
      priority: type.includes('approved') ? 'high' : 'medium',
      message: messages[type],
      data
    })
  }

  /**
   * Send financial notifications
   */
  async sendFinancialNotification(
    type: 'invoice_created' | 'invoice_overdue' | 'payment_received',
    userId: string,
    data: {
      invoice_number?: string
      amount: number
      currency: string
      due_date?: string
      client_name: string
    }
  ): Promise<{ success: boolean; notificationIds: string[]; errors: string[] }> {
    const messages = {
      invoice_created: `New invoice ${data.invoice_number} for ${data.amount} ${data.currency} has been created`,
      invoice_overdue: `Invoice ${data.invoice_number} is overdue. Please make payment as soon as possible.`,
      payment_received: `Payment of ${data.amount} ${data.currency} has been received. Thank you!`
    }

    return this.sendNotification({
      userId,
      type,
      priority: type === 'invoice_overdue' ? 'high' : 'medium',
      message: messages[type],
      data
    })
  }
}

// Export singleton instance
export const notificationService = new NotificationService()