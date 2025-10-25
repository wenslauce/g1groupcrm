import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth-server'
import { searchServiceServer } from '@/lib/search-service-server'
import { z } from 'zod'

const analyticsRequestSchema = z.object({
  action: z.enum(['click', 'search']),
  query: z.string().min(1).max(500),
  resultId: z.string().uuid().optional(),
  resultType: z.enum(['client', 'skr', 'asset', 'invoice']).optional(),
  sessionId: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await authServer.requireAuth()
    
    const body = await request.json()
    const { action, query, resultId, resultType, sessionId } = analyticsRequestSchema.parse(body)

    if (action === 'click') {
      await searchServiceServer.recordSearchAnalytics({
        query,
        resultsCount: 0, // Not applicable for clicks
        clickedResultId: resultId,
        clickedResultType: resultType,
        sessionId
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Search analytics API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid analytics parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analytics failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Require admin role to view analytics
    const user = await authServer.requireRole(['admin'])
    
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const limit = searchParams.get('limit')

    if (action === 'popular') {
      const { terms, error } = await searchServiceServer.getPopularSearchTerms(
        limit ? parseInt(limit) : 20,
        dateFrom || undefined
      )

      if (error) {
        return NextResponse.json({ error }, { status: 500 })
      }

      return NextResponse.json({ terms })
    }

    // Default: get search analytics
    const { analytics, error } = await searchServiceServer.getSearchAnalytics(
      dateFrom || undefined,
      dateTo || undefined,
      limit ? parseInt(limit) : 100
    )

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ analytics })

  } catch (error) {
    console.error('Search analytics API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analytics failed' },
      { status: 500 }
    )
  }
}
