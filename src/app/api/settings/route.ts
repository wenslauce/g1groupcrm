import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authServer } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    // Require admin role
    const user = await authServer.requireRole(['admin'])
    
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    // Return default settings if none exist
    const defaultSettings = {
      company_name: 'G1 Group',
      company_email: 'admin@g1groupofcompanies.com',
      company_phone: '',
      company_address: '',
      timezone: 'UTC',
      currency: 'USD',
      date_format: 'YYYY-MM-DD',
      email_notifications: true,
      sms_notifications: false,
      audit_retention_days: 365,
      session_timeout_minutes: 60,
      max_login_attempts: 5,
      require_2fa: false,
      backup_frequency: 'daily',
      maintenance_mode: false
    }
    
    return NextResponse.json({ 
      data: data || defaultSettings 
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Require admin role
    const user = await authServer.requireRole(['admin'])
    
    const body = await request.json()
    const supabase = createClient()
    
    // Check if settings exist
    const { data: existing } = await supabase
      .from('system_settings')
      .select('id')
      .single()
    
    let result
    if (existing) {
      // Update existing settings
      const { data, error } = await supabase
        .from('system_settings')
        .update({
          ...body,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      result = data
    } else {
      // Create new settings
      const { data, error } = await supabase
        .from('system_settings')
        .insert({
          ...body,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      result = data
    }
    
    return NextResponse.json({ data: result })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}