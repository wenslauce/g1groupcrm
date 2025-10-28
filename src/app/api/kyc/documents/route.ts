import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authServer } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    // Require permission to view KYC documents
    const user = await authServer.requireRole(['admin', 'compliance', 'finance', 'operations'])
    
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const clientId = searchParams.get('client_id')
    
    // Get client's KYC documents from their kyc_documents JSON field
    let query = supabase
      .from('clients')
      .select('id, name, email, kyc_documents, compliance_status')
    
    if (clientId) {
      query = query.eq('id', clientId)
    }
    
    const { data, error } = await query
    
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

export async function POST(request: NextRequest) {
  try {
    // Require permission to upload KYC documents
    const user = await authServer.requireRole(['admin', 'compliance', 'finance', 'operations'])
    
    const body = await request.json()
    const { client_id, document } = body
    
    if (!client_id || !document) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    const supabase = createClient()
    
    // Get current client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, kyc_documents')
      .eq('id', client_id)
      .single()
    
    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }
    
    // Add document to kyc_documents array
    const currentDocs = Array.isArray(client.kyc_documents) ? client.kyc_documents : []
    const newDoc = {
      id: crypto.randomUUID(),
      ...document,
      uploaded_at: new Date().toISOString(),
      uploaded_by: user.id,
      status: 'pending'
    }
    
    const { data, error } = await supabase
      .from('clients')
      .update({
        kyc_documents: [...currentDocs, newDoc]
      })
      .eq('id', client_id)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ data: newDoc }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
