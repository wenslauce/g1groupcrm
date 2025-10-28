import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth-server'
import { notificationService } from '@/lib/notification-service'
import { z } from 'zod'

const notificationQuerySchema = z.object({
  channel: z.enum(['email', 'sms', 'in_app', 'push']).optional(),
  status: z.enum(['pending', 'sent', 'delivered', 'failed', 'read']).optional(),
  unread_only: z.coerce.boolean().default(false),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0)
})

const sendNotificationSchema = z.object({
  user_id: z.string().uuid().optional(), // If not provided, sends to current user
  type: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  subject: z.string().optional(),
  message: z.string().min(1),
  data: z.record(z.any()).optional(),
  scheduled_at: z.string().datetime().optional()
})

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await authServer.getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    
    // Parse and validate query parameters
    const query = notificationQuerySchema.parse({
      channel: searchParams.get('channel') || undefined,
      status: searchParams.get('status') || undefined,
      unread_only: searchParams.get('unread_only'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset')
    })
    
    // Get user notifications
    const result = await notificationService.getUserNotifications(user.id, {
      channel: query.channel,
      status: query.status,
      unreadOnly: query.unread_only,
      limit: query.limit,
      offset: query.offset
    })
    
    return NextResponse.json({
      notifications: result.notifications,
      total: result.total,
      limit: query.limit,
      offset: query.offset,
      has_more: result.total > query.offset + query.limit
    })
  } catch (error) {
    console.error('Notifications API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const user = await authServer.getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const validatedData = sendNotificationSchema.parse(body)
    
    // Use current user if no user_id provided
    const targetUserId = validatedData.user_id || user.id
    
    // Check if user has permission to send notifications to other users
    if (targetUserId !== user.id) {
      // For now, only allow sending to self - can be expanded later
      return NextResponse.json(
        { error: 'Can only send notifications to yourself' },
        { status: 403 }
      )
    }
    
    // Remove the getUserRole check for now since it doesn't exist
    /*
    if (targetUserId !== user.id) {
      const userRole = await authServer.getUserRole(user.id)
      if (!['admin', 'operations'].includes(userRole)) {
        return NextResponse.json(
          { error: 'Insufficient permissions to send notifications to other users' },
          { status: 403 }
        )
      }
    }
    */
    
    // Send notification
    const result = await notificationService.sendNotification({
      userId: targetUserId,
      type: validatedData.type,
      priority: validatedData.priority,
      subject: validatedData.subject,
      message: validatedData.message,
      data: validatedData.data,
      scheduledAt: validatedData.scheduled_at ? new Date(validatedData.scheduled_at) : undefined
    })
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        notification_ids: result.notificationIds,
        message: 'Notification sent successfully'
      }, { status: 201 })
    } else {
      return NextResponse.json({
        success: false,
        errors: result.errors
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Send notification API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid notification data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
