import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth-server'
import { notificationService } from '@/lib/notification-service'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current user
    const user = await authServer.getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { action } = body
    
    if (action === 'mark_read') {
      const result = await notificationService.markAsRead(params.id, user.id)
      
      if (result.success) {
        return NextResponse.json({ success: true, message: 'Notification marked as read' })
      } else {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Notification update API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current user
    const user = await authServer.getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const result = await notificationService.deleteNotification(params.id, user.id)
    
    if (result.success) {
      return NextResponse.json({ success: true, message: 'Notification deleted' })
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error('Notification delete API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}