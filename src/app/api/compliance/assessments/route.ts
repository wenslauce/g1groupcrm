import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authServer } from '@/lib/auth-server'
import { z } from 'zod'

const complianceAssessmentSchema = z.object({
  client_id: z.string().uuid(),
  assessment_type: z.enum(['kyc', 'aml', 'risk', 'periodic_review', 'enhanced_due_diligence']),
  risk_factors: z.array(z.object({
    category: z.string(),
    description: z.string(),
    score: z.number().min(0).max(100),
    weight: z.number().min(0).max(1)
  })),
  overall_risk_score: z.number().min(0).max(100),
  risk_level: z.enum(['low', 'medium', 'high']),
  recommendations: z.array(z.string()),
  next_review_date: z.string().datetime().optional(),
  assessed_by: z.string().uuid(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

export async function GET(request: NextRequest) {
  try {
    // Require permission to view compliance assessments
    const user = await authServer.requireRole(['admin', 'compliance', 'finance', 'operations'])
    
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const clientId = searchParams.get('client_id')
    const riskLevel = searchParams.get('risk_level')
    const assessmentType = searchParams.get('assessment_type')
    
    const offset = (page - 1) * limit
    
    let query = supabase
      .from('compliance_assessments')
      .select(`
        *,
        client:clients(
          id,
          name,
          email,
          type,
          country,
          compliance_status
        ),
        assessed_by_user:user_profiles!assessed_by(
          id,
          full_name
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (clientId) {
      query = query.eq('client_id', clientId)
    }
    
    if (riskLevel) {
      query = query.eq('risk_level', riskLevel)
    }
    
    if (assessmentType) {
      query = query.eq('assessment_type', assessmentType)
    }
    
    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({
      data,
      count,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit)
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require compliance permission to create assessments
    const user = await authServer.requireRole(['admin', 'compliance'])
    
    const body = await request.json()
    
    // Validate request body
    const validatedData = complianceAssessmentSchema.parse({
      ...body,
      assessed_by: user.id
    })
    
    const supabase = createClient()
    
    // Verify client exists
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name, type, country')
      .eq('id', validatedData.client_id)
      .single()
    
    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }
    
    // Validate risk factors
    const totalWeight = validatedData.risk_factors.reduce((sum, factor) => sum + factor.weight, 0)
    if (Math.abs(totalWeight - 1) > 0.01) {
      return NextResponse.json(
        { error: 'Risk factor weights must sum to 1.0' },
        { status: 400 }
      )
    }
    
    // Verify calculated risk score matches
    const calculatedScore = calculateRiskScore(validatedData.risk_factors)
    if (Math.abs(calculatedScore - validatedData.overall_risk_score) > 5) {
      return NextResponse.json(
        { error: 'Calculated risk score does not match provided score' },
        { status: 400 }
      )
    }
    
    // Verify risk level matches score
    const expectedRiskLevel = getRiskLevelFromScore(validatedData.overall_risk_score)
    if (expectedRiskLevel !== validatedData.risk_level) {
      return NextResponse.json(
        { error: `Risk level should be '${expectedRiskLevel}' for score ${validatedData.overall_risk_score}` },
        { status: 400 }
      )
    }
    
    // Create assessment
    const { data, error } = await supabase
      .from('compliance_assessments')
      .insert({
        client_id: validatedData.client_id,
        assessment_type: validatedData.assessment_type,
        risk_factors: validatedData.risk_factors,
        overall_risk_score: validatedData.overall_risk_score,
        risk_level: validatedData.risk_level,
        recommendations: validatedData.recommendations,
        next_review_date: validatedData.next_review_date,
        assessed_by: validatedData.assessed_by,
        notes: validatedData.notes,
        metadata: validatedData.metadata || {}
      })
      .select(`
        *,
        client:clients(
          id,
          name,
          email,
          type
        ),
        assessed_by_user:user_profiles!assessed_by(
          id,
          full_name
        )
      `)
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    // Update client risk level
    await supabase
      .from('clients')
      .update({ risk_level: validatedData.risk_level })
      .eq('id', validatedData.client_id)
    
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions
function calculateRiskScore(riskFactors: any[]): number {
  return riskFactors.reduce((total, factor) => {
    return total + (factor.score * factor.weight)
  }, 0)
}

function getRiskLevelFromScore(score: number): 'low' | 'medium' | 'high' {
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}
