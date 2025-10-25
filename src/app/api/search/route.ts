import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth-server'
import { searchServiceServer } from '@/lib/search-service-server'
import { z } from 'zod'

const searchRequestSchema = z.object({
  query: z.string().min(1).max(500),
  filters: z.object({
    types: z.array(z.enum(['client', 'skr', 'asset', 'invoice'])).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    status: z.array(z.string()).optional(),
    limit: z.number().min(1).max(100).optional()
  }).optional()
})

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await authServer.requireAuth()
    
    const body = await request.json()
    const { query, filters } = searchRequestSchema.parse(body)

    // Perform search
    const { results, error } = await searchServiceServer.globalSearch(query, filters)

    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      )
    }

    // Record search analytics
    await searchServiceServer.recordSearchAnalytics({
      query,
      resultsCount: results.length,
      sessionId: request.headers.get('x-session-id') || undefined
    })

    return NextResponse.json({
      results,
      query,
      total: results.length
    })

  } catch (error) {
    console.error('Search API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await authServer.requireAuth()
    
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const types = searchParams.get('types')?.split(',')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const limit = searchParams.get('limit')

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    const filters = {
      types: types as any,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      limit: limit ? parseInt(limit) : undefined
    }

    // Perform search
    const { results, error } = await searchServiceServer.globalSearch(query, filters)

    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      )
    }

    // Record search analytics
    await searchServiceServer.recordSearchAnalytics({
      query,
      resultsCount: results.length,
      sessionId: request.headers.get('x-session-id') || undefined
    })

    return NextResponse.json({
      results,
      query,
      total: results.length
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    )
  }
}
