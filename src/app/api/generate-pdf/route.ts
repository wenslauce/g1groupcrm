import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth-server'
import { createClient } from '@/lib/supabase/server'
import { generateSKRPDF } from '@/lib/pdf-generator-simple'

export async function POST(request: NextRequest) {
  try {
    // Require authentication for PDF generation
    const user = await authServer.requireRole(['admin', 'finance', 'operations', 'compliance'])
    
    const body = await request.json()
    const { type, id, options = {} } = body

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Missing required fields: type and id' },
        { status: 400 }
      )
    }

    // Validate document type
    const validTypes = ['skr', 'invoice', 'receipt', 'credit_note']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid document type' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Generate PDF based on type
    if (type === 'skr') {
      // Fetch SKR data
      const { data: skr, error } = await supabase
        .from('skrs')
        .select(`
          *,
          client:clients(*),
          asset:assets(*)
        `)
        .eq('id', id)
        .single()

      if (error || !skr) {
        return NextResponse.json(
          { error: 'SKR not found' },
          { status: 404 }
        )
      }

      // Generate PDF
      const pdfBuffer = generateSKRPDF(skr)
      
      // Return PDF as response
      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="SKR-${skr.skr_number}.pdf"`,
          'Cache-Control': 'no-cache'
        }
      })
    }

    // For other document types, return a placeholder for now
    return NextResponse.json({
      success: false,
      message: `PDF generation for ${type} is not yet implemented`,
      document_id: id,
      type: type
    }, { status: 501 })

  } catch (error) {
    console.error('PDF generation error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
