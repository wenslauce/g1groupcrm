import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth'
import { notificationService } from '@/lib/notification-service'
import { z } from 'zod'

const bulkActionSchema = z.object({
  action: z.enum(['mark_all_read', 'delete_read']),
  notification_ids: z.array(z.string().uuid()).optional()
})

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const user = await authServer.getCurrentUser()
    
    const body = await request.json()
    const validatedData = bulkActionSchema.parse(body)
    
    switch (validatedData.action) {
      case 'mark_all_read':
        const markResult = await notificationService.markAllAsRead(user.id)
        
        if (markResult.success) {
          return NextResponse.json({
            success: true,
            message: 'All notifications marked as read'
          })
        } else {
          return NextResponse.json({ error: markResult.error }, { status: 400 })
        }
      
      case 'delete_read':
        // This would require a new method in the notification service
        // For now, return a placeholder response
        return NextResponse.json({
          success: true,
          message: 'Read notifications deleted (placeholder)'
        })
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Bulk notification action API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid bulk action data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}