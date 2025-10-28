import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth-server'
import { notificationService } from '@/lib/notification-service'
import { z } from 'zod'

const preferencesSchema = z.object({
  notification_type: z.string().min(1),
  email_enabled: z.boolean().optional(),
  sms_enabled: z.boolean().optional(),
  in_app_enabled: z.boolean().optional(),
  push_enabled: z.boolean().optional()
})

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await authServer.getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const notificationType = searchParams.get('type')
    
    if (!notificationType) {
      return NextResponse.json({ error: 'Notification type is required' }, { status: 400 })
    }
    
    const preferences = await notificationService.getUserPreferences(user.id, notificationType)
    
    return NextResponse.json({
      notification_type: notificationType,
      ...preferences
    })
  } catch (error) {
    console.error('Get preferences API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get current user
    const user = await authServer.getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const validatedData = preferencesSchema.parse(body)
    
    const { notification_type, ...preferences } = validatedData
    
    const result = await notificationService.updateUserPreferences(
      user.id,
      notification_type,
      preferences
    )
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Preferences updated successfully'
      })
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error('Update preferences API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid preferences data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
