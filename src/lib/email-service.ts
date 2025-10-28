import { createClient } from '@/lib/supabase/server'

export interface EmailTemplate {
  subject: string
  html: string
  text?: string
}

export interface EmailData {
  to: string
  from?: string
  subject: string
  html?: string
  text?: string
  attachments?: Array<{
    filename: string
    content: string | Buffer
    contentType?: string
  }>
}

export class EmailService {
  private _supabase: ReturnType<typeof createClient> | null = null
  private defaultFrom = process.env.DEFAULT_FROM_EMAIL || 'noreply@g1holdings.com'

  private get supabase() {
    if (!this._supabase) {
      this._supabase = createClient()
    }
    return this._supabase
  }

  /**
   * Send email immediately (for testing/development)
   */
  async sendEmail(emailData: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // In a real implementation, you would integrate with an email service like:
      // - SendGrid
      // - AWS SES
      // - Mailgun
      // - Resend
      // - Nodemailer with SMTP
      
      // For now, we'll simulate email sending and log the email
      console.log('📧 Email would be sent:', {
        to: emailData.to,
        from: emailData.from || this.defaultFrom,
        subject: emailData.subject,
        hasHtml: !!emailData.html,
        hasText: !!emailData.text,
        attachments: emailData.attachments?.length || 0
      })

      // Simulate email service response
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      return {
        success: true,
        messageId
      }
    } catch (error) {
      console.error('Email sending failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Queue email for reliable delivery
   */
  async queueEmail(
    notificationId: string,
    to: string,
    subject: string,
    htmlBody?: string,
    textBody?: string,
    scheduledAt?: Date
  ): Promise<{ success: boolean; queueId?: string; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('email_queue')
        .insert({
          notification_id: notificationId,
          to_email: to,
          from_email: this.defaultFrom,
          subject,
          html_body: htmlBody,
          text_body: textBody,
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
      console.error('Email queueing failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Process email queue (would be called by a background job)
   */
  async processEmailQueue(limit = 10): Promise<void> {
    try {
      // Get pending emails
      const { data: emails, error } = await this.supabase
        .from('email_queue')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_at', new Date().toISOString())
        .lt('retry_count', 3) // Don't retry more than 3 times
        .order('scheduled_at', { ascending: true })
        .limit(limit)

      if (error) {
        throw error
      }

      if (!emails || emails.length === 0) {
        return
      }

      // Process each email
      for (const email of emails) {
        try {
          const result = await this.sendEmail({
            to: email.to_email,
            from: email.from_email,
            subject: email.subject,
            html: email.html_body || undefined,
            text: email.text_body || undefined
          })

          if (result.success) {
            // Mark as sent
            await this.supabase
              .from('email_queue')
              .update({
                status: 'sent',
                sent_at: new Date().toISOString()
              })
              .eq('id', email.id)

            // Update notification status
            await this.supabase
              .from('notifications')
              .update({
                status: 'sent',
                sent_at: new Date().toISOString()
              })
              .eq('id', email.notification_id)
          } else {
            // Mark as failed and increment retry count
            await this.supabase
              .from('email_queue')
              .update({
                status: email.retry_count >= 2 ? 'failed' : 'pending',
                error_message: result.error,
                retry_count: email.retry_count + 1
              })
              .eq('id', email.id)

            if (email.retry_count >= 2) {
              // Update notification status to failed
              await this.supabase
                .from('notifications')
                .update({
                  status: 'failed',
                  error_message: result.error
                })
                .eq('id', email.notification_id)
            }
          }
        } catch (error) {
          console.error(`Failed to process email ${email.id}:`, error)
          
          // Mark as failed
          await this.supabase
            .from('email_queue')
            .update({
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error',
              retry_count: email.retry_count + 1
            })
            .eq('id', email.id)
        }
      }
    } catch (error) {
      console.error('Email queue processing failed:', error)
    }
  }

  /**
   * Get email templates
   */
  async getTemplate(type: string, channel: 'email'): Promise<EmailTemplate | null> {
    try {
      const { data, error } = await this.supabase
        .from('notification_templates')
        .select('subject_template, body_template')
        .eq('type', type)
        .eq('channel', channel)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        return null
      }

      return {
        subject: data.subject_template || '',
        html: data.body_template,
        text: this.htmlToText(data.body_template)
      }
    } catch (error) {
      console.error('Failed to get email template:', error)
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
    
    return rendered
  }

  /**
   * Convert HTML to plain text (simple implementation)
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * Create default email templates
   */
  async createDefaultTemplates(): Promise<void> {
    const templates = [
      {
        name: 'SKR Created',
        type: 'skr_created',
        channel: 'email',
        subject_template: 'New SKR Created - {{skr_number}}',
        body_template: `
          <h2>New SKR Created</h2>
          <p>Dear {{client_name}},</p>
          <p>A new Secure Keeper Receipt (SKR) has been created for your asset.</p>
          <p><strong>SKR Number:</strong> {{skr_number}}</p>
          <p><strong>Asset:</strong> {{asset_name}}</p>
          <p><strong>Value:</strong> {{asset_value}} {{currency}}</p>
          <p><strong>Status:</strong> {{status}}</p>
          <p>You can track your SKR status in your dashboard.</p>
          <p>Best regards,<br>G1 Holdings Team</p>
        `
      },
      {
        name: 'SKR Approved',
        type: 'skr_approved',
        channel: 'email',
        subject_template: 'SKR Approved - {{skr_number}}',
        body_template: `
          <h2>SKR Approved</h2>
          <p>Dear {{client_name}},</p>
          <p>Your Secure Keeper Receipt has been approved and is ready for issuance.</p>
          <p><strong>SKR Number:</strong> {{skr_number}}</p>
          <p><strong>Asset:</strong> {{asset_name}}</p>
          <p>The SKR will be issued shortly and you will receive another notification.</p>
          <p>Best regards,<br>G1 Holdings Team</p>
        `
      },
      {
        name: 'SKR Issued',
        type: 'skr_issued',
        channel: 'email',
        subject_template: 'SKR Issued - {{skr_number}}',
        body_template: `
          <h2>SKR Issued</h2>
          <p>Dear {{client_name}},</p>
          <p>Your Secure Keeper Receipt has been officially issued.</p>
          <p><strong>SKR Number:</strong> {{skr_number}}</p>
          <p><strong>Asset:</strong> {{asset_name}}</p>
          <p><strong>Issue Date:</strong> {{issue_date}}</p>
          <p>You can download your SKR document from your dashboard.</p>
          <p>Best regards,<br>G1 Holdings Team</p>
        `
      },
      {
        name: 'Client Approved',
        type: 'client_approved',
        channel: 'email',
        subject_template: 'Welcome to G1 Holdings - Account Approved',
        body_template: `
          <h2>Account Approved</h2>
          <p>Dear {{client_name}},</p>
          <p>Congratulations! Your account has been approved and you can now access all G1 Holdings services.</p>
          <p>You can now:</p>
          <ul>
            <li>Submit assets for SKR creation</li>
            <li>Track your SKRs</li>
            <li>Access your dashboard</li>
          </ul>
          <p>Welcome to G1 Holdings!</p>
          <p>Best regards,<br>G1 Holdings Team</p>
        `
      },
      {
        name: 'Invoice Created',
        type: 'invoice_created',
        channel: 'email',
        subject_template: 'New Invoice - {{invoice_number}}',
        body_template: `
          <h2>New Invoice</h2>
          <p>Dear {{client_name}},</p>
          <p>A new invoice has been generated for your account.</p>
          <p><strong>Invoice Number:</strong> {{invoice_number}}</p>
          <p><strong>Amount:</strong> {{amount}} {{currency}}</p>
          <p><strong>Due Date:</strong> {{due_date}}</p>
          <p>Please log in to your dashboard to view and pay the invoice.</p>
          <p>Best regards,<br>G1 Holdings Team</p>
        `
      }
    ]

    for (const template of templates) {
      try {
        await this.supabase
          .from('notification_templates')
          .upsert(template, { onConflict: 'name,type,channel' })
      } catch (error) {
        console.error('Failed to create template:', template.name, error)
      }
    }
  }
}

// Export singleton instance (lazy initialization)
let _emailService: EmailService | null = null

export const emailService = {
  get instance() {
    if (!_emailService) {
      _emailService = new EmailService()
    }
    return _emailService
  },
  
  // Proxy methods for convenience
  async sendEmail(emailData: EmailData) {
    return this.instance.sendEmail(emailData)
  },
  
  async processEmailQueue(limit?: number) {
    return this.instance.processEmailQueue(limit)
  },
  
  async getTemplate(type: string, channel: 'email') {
    return this.instance.getTemplate(type, channel)
  },
  
  async createDefaultTemplates() {
    return this.instance.createDefaultTemplates()
  }
}