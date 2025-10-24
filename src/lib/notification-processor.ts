import { emailService } from './email-service'
import { smsService } from './sms-service'

/**
 * Background notification processor
 * This would typically run as a separate service or cron job
 */
export class NotificationProcessor {
  private isProcessing = false
  private processingInterval: NodeJS.Timeout | null = null

  /**
   * Start the notification processor
   */
  start(intervalMs = 30000): void { // Process every 30 seconds by default
    if (this.processingInterval) {
      console.log('Notification processor is already running')
      return
    }

    console.log('Starting notification processor...')
    
    // Process immediately
    this.processNotifications()
    
    // Set up interval processing
    this.processingInterval = setInterval(() => {
      this.processNotifications()
    }, intervalMs)
  }

  /**
   * Stop the notification processor
   */
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
      console.log('Notification processor stopped')
    }
  }

  /**
   * Process pending notifications
   */
  private async processNotifications(): Promise<void> {
    if (this.isProcessing) {
      console.log('Notification processing already in progress, skipping...')
      return
    }

    this.isProcessing = true

    try {
      console.log('Processing notification queues...')
      
      // Process email queue
      await this.processEmailQueue()
      
      // Process SMS queue
      await this.processSMSQueue()
      
      console.log('Notification queue processing completed')
    } catch (error) {
      console.error('Error processing notification queues:', error)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Process email queue
   */
  private async processEmailQueue(): Promise<void> {
    try {
      await emailService.processEmailQueue(10) // Process up to 10 emails at a time
    } catch (error) {
      console.error('Error processing email queue:', error)
    }
  }

  /**
   * Process SMS queue
   */
  private async processSMSQueue(): Promise<void> {
    try {
      await smsService.processSMSQueue(10) // Process up to 10 SMS at a time
    } catch (error) {
      console.error('Error processing SMS queue:', error)
    }
  }

  /**
   * Process notifications once (for manual triggering)
   */
  async processOnce(): Promise<void> {
    await this.processNotifications()
  }

  /**
   * Get processor status
   */
  getStatus(): {
    isRunning: boolean
    isProcessing: boolean
    hasInterval: boolean
  } {
    return {
      isRunning: this.processingInterval !== null,
      isProcessing: this.isProcessing,
      hasInterval: this.processingInterval !== null
    }
  }
}

// Export singleton instance
export const notificationProcessor = new NotificationProcessor()

// Auto-start in production (you might want to control this differently)
if (process.env.NODE_ENV === 'production' && process.env.AUTO_START_NOTIFICATION_PROCESSOR === 'true') {
  notificationProcessor.start()
}