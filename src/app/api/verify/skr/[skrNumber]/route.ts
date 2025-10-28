import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { skrUtils } from '@/lib/skr-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { skrNumber: string } }
) {
  try {
    const supabase = createClient()
    
    // Decode SKR number (in case it's URL encoded)
    const skrNumber = decodeURIComponent(params.skrNumber)
    
    // Fetch SKR data (public information only)
    const { data: skr, error } = await supabase
      .from('skrs')
      .select(`
        id,
        skr_number,
        status,
        issue_date,
        hash,
        created_at,
        client:clients(id, name, country),
        asset:assets(id, asset_name, asset_type, declared_value, currency)
      `)
      .eq('skr_number', skrNumber)
      .single()
    
    if (error || !skr) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'SKR not found',
          skr_number: skrNumber
        },
        { status: 404 }
      )
    }

    // Only allow verification of issued SKRs
    if (skr.status !== 'issued' && skr.status !== 'in_transit' && skr.status !== 'delivered' && skr.status !== 'closed') {
      return NextResponse.json(
        {
          valid: false,
          error: 'SKR is not in a verifiable state',
          skr_number: skrNumber,
          status: skr.status
        },
        { status: 400 }
      )
    }

    // Verify hash if provided in query params
    const { searchParams } = new URL(request.url)
    const providedHash = searchParams.get('hash')
    
    let hashValid = true
    if (providedHash && skr.hash) {
      hashValid = skrUtils.validateSKRHash(skr, providedHash)
    }

    // Return verification result with public information
    const verificationResult = {
      valid: true,
      skr_number: skr.skr_number,
      status: skr.status,
      issue_date: skr.issue_date,
      hash_valid: hashValid,
      verification_time: new Date().toISOString(),
      client: {
        name: Array.isArray(skr.client) ? (skr.client as any[])[0]?.name : (skr.client as any)?.name,
        country: Array.isArray(skr.client) ? (skr.client as any[])[0]?.country : (skr.client as any)?.country
      },
      asset: {
        name: Array.isArray(skr.asset) ? (skr.asset as any[])[0]?.asset_name : (skr.asset as any)?.asset_name,
        type: Array.isArray(skr.asset) ? (skr.asset as any[])[0]?.asset_type : (skr.asset as any)?.asset_type,
        declared_value: Array.isArray(skr.asset) ? (skr.asset as any[])[0]?.declared_value : (skr.asset as any)?.declared_value,
        currency: Array.isArray(skr.asset) ? (skr.asset as any[])[0]?.currency : (skr.asset as any)?.currency
      },
      // Include hash for verification but don't expose sensitive data
      hash_provided: !!providedHash,
      hash_available: !!skr.hash
    }

    return NextResponse.json(verificationResult, {
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  } catch (error) {
    console.error('SKR verification error:', error)
    
    return NextResponse.json(
      { 
        valid: false,
        error: 'Verification service temporarily unavailable',
        skr_number: params.skrNumber
      },
      { status: 500 }
    )
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}