import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth-server'
import { notificationProcessor } from '@/lib/notification-processor'

export async function POST(request: NextRequest) {
  try {
    // Require admin role to trigger notification processing
    const user = await authServer.requireRole(['admin'])
    
    const body = await request.json()
    const { action } = body
    
    switch (action) {
      case 'process_once':
        await notificationProcessor.processOnce()
        return NextResponse.json({
          success: true,
          message: 'Notification processing triggered successfully'
        })
      
      case 'start':
        notificationProcessor.start()
        return NextResponse.json({
          success: true,
          message: 'Notification processor started'
        })
      
      case 'stop':
        notificationProcessor.stop()
        return NextResponse.json({
          success: true,
          message: 'Notification processor stopped'
        })
      
      case 'status':
        const status = notificationProcessor.getStatus()
        return NextResponse.json({
          success: true,
          status
        })
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Notification processor API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Require admin role to view processor status
    const user = await authServer.requireRole(['admin'])
    
    const status = notificationProcessor.getStatus()
    
    return NextResponse.json({
      success: true,
      status
    })
  } catch (error) {
    console.error('Notification processor status API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
