import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authServer } from '@/lib/auth-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require permission to view KYC documents
    const user = await authServer.requireRole(['admin', 'compliance', 'finance', 'operations'])
    
    const supabase = createClient()
    
    // Find client with this document
    const { data: clients, error } = await supabase
      .from('clients')
      .select('id, name, email, kyc_documents')
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    // Search for document in client kyc_documents
    for (const client of clients || []) {
      const docs = Array.isArray(client.kyc_documents) ? client.kyc_documents : []
      const doc = docs.find((d: any) => d.id === params.id)
      
      if (doc) {
        return NextResponse.json({
          data: {
            ...doc,
            client: {
              id: client.id,
              name: client.name,
              email: client.email
            }
          }
        })
      }
    }
    
    return NextResponse.json({ error: 'KYC document not found' }, { status: 404 })
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
    // Require compliance permission to review KYC documents
    const user = await authServer.requireRole(['admin', 'compliance'])
    
    const body = await request.json()
    const { status, review_notes } = body
    
    const supabase = createClient()
    
    // Find and update document
    const { data: clients } = await supabase
      .from('clients')
      .select('id, kyc_documents')
    
    for (const client of clients || []) {
      const docs = Array.isArray(client.kyc_documents) ? client.kyc_documents : []
      const docIndex = docs.findIndex((d: any) => d.id === params.id)
      
      if (docIndex !== -1) {
        docs[docIndex] = {
          ...docs[docIndex],
          status,
          review_notes,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        }
        
        const { data, error } = await supabase
          .from('clients')
          .update({ kyc_documents: docs })
          .eq('id', client.id)
          .select()
          .single()
        
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
        
        return NextResponse.json({ data: docs[docIndex] })
      }
    }
    
    return NextResponse.json({ error: 'KYC document not found' }, { status: 404 })
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
    // Require admin permission to delete KYC documents
    const user = await authServer.requireRole(['admin'])
    
    const supabase = createClient()
    
    // Find and delete document
    const { data: clients } = await supabase
      .from('clients')
      .select('id, kyc_documents')
    
    for (const client of clients || []) {
      const docs = Array.isArray(client.kyc_documents) ? client.kyc_documents : []
      const newDocs = docs.filter((d: any) => d.id !== params.id)
      
      if (newDocs.length < docs.length) {
        const { error } = await supabase
          .from('clients')
          .update({ kyc_documents: newDocs })
          .eq('id', client.id)
        
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
        
        return NextResponse.json({ message: 'KYC document deleted successfully' })
      }
    }
    
    return NextResponse.json({ error: 'KYC document not found' }, { status: 404 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
