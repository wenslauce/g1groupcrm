import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth'
import { smsService } from '@/lib/sms-service'
import { z } from 'zod'

const sendSMSSchema = z.object({
  to: z.string().min(1),
  message: z.string().min(1).max(160)
})

const optOutSchema = z.object({
  phone: z.string().min(1)
})

export async function POST(request: NextRequest) {
  try {
    // Require admin role to send SMS
    const user = await authServer.requireRole(['admin'])
    
    const body = await request.json()
    const { action } = body
    
    if (action === 'send') {
      const validatedData = sendSMSSchema.parse(body)
      
      const result = await smsService.sendSMS({
        to: validatedData.to,
        message: validatedData.message
      })
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          message_id: result.messageId,
          message: 'SMS sent successfully'
        }, { status: 201 })
      } else {
        return NextResponse.json({
          success: false,
          error: result.error
        }, { status: 400 })
      }
    } else if (action === 'opt_out') {
      const validatedData = optOutSchema.parse(body)
      
      const result = await smsService.addToOptOut(validatedData.phone)
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Phone number added to opt-out list'
        })
      } else {
        return NextResponse.json({
          success: false,
          error: result.error
        }, { status: 400 })
      }
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('SMS API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid SMS data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Require admin role to view SMS stats
    const user = await authServer.requireRole(['admin'])
    
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date') ? new Date(searchParams.get('start_date')!) : undefined
    const endDate = searchParams.get('end_date') ? new Date(searchParams.get('end_date')!) : undefined
    
    const stats = await smsService.getDeliveryStats(startDate, endDate)
    
    return NextResponse.json({
      stats,
      period: {
        start_date: startDate?.toISOString(),
        end_date: endDate?.toISOString()
      }
    })
  } catch (error) {
    console.error('SMS stats API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}