import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth-server'
import { searchServiceServer } from '@/lib/search-service-server'

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await authServer.requireAuth()
    
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = searchParams.get('limit')

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    if (query.length < 2) {
      return NextResponse.json({
        suggestions: []
      })
    }

    const { suggestions, error } = await searchServiceServer.getSearchSuggestions(
      query,
      limit ? parseInt(limit) : 10
    )

    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      suggestions,
      query
    })

  } catch (error) {
    console.error('Search suggestions API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Suggestions failed' },
      { status: 500 }
    )
  }
}
