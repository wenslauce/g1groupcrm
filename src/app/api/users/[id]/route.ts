import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authServer } from '@/lib/auth-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin role
    const user = await authServer.requireRole(['admin'])
    
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin role
    const user = await authServer.requireRole(['admin'])
    
    const body = await request.json()
    const { name, role, department, status } = body
    
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        name,
        role,
        department,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin role
    const user = await authServer.requireRole(['admin'])
    
    const body = await request.json()
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ data })
  } catch (error) {
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
    // Require admin role
    const user = await authServer.requireRole(['admin'])
    
    // Prevent admin from deleting themselves
    if (user.id === params.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }
    
    const supabase = createClient()
    
    // Delete auth user (this will cascade to user_profiles due to foreign key)
    const { error: authError } = await supabase.auth.admin.deleteUser(params.id)
    
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }
    
    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}