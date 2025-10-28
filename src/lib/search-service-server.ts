import { createClient } from '@/lib/supabase/server'

export interface SearchResult {
  id: string
  type: 'client' | 'skr' | 'asset' | 'invoice'
  title: string
  subtitle: string
  content: string
  url: string
  rank: number
  created_at: string
}

export interface SearchSuggestion {
  suggestion: string
  type: string
  count: number
}

export interface SearchFilters {
  types?: string[]
  dateFrom?: string
  dateTo?: string
  status?: string[]
  limit?: number
}

export interface SearchAnalytics {
  query: string
  resultsCount: number
  clickedResultId?: string
  clickedResultType?: string
  sessionId?: string
}

/**
 * Server-side search service
 */
export class SearchServiceServer {
  private _supabase: ReturnType<typeof createClient> | null = null

  private get supabase() {
    if (!this._supabase) {
      this._supabase = createClient()
    }
    return this._supabase
  }

  /**
   * Perform global search across all modules
   */
  async globalSearch(
    query: string, 
    filters: SearchFilters = {}
  ): Promise<{ results: SearchResult[]; error?: string }> {
    try {
      if (!query.trim()) {
        return { results: [] }
      }

      const limit = filters.limit || 50
      
      // Call the database function for global search
      const { data, error } = await this.supabase
        .rpc('global_search', {
          search_query: query.trim(),
          result_limit: limit
        })

      if (error) {
        console.error('Global search error:', error)
        return { results: [], error: error.message }
      }

      let results = data || []

      // Apply additional filters
      if (filters.types && filters.types.length > 0) {
        results = results.filter((result: SearchResult) => 
          filters.types!.includes(result.type)
        )
      }

      if (filters.dateFrom) {
        results = results.filter((result: SearchResult) => 
          new Date(result.created_at) >= new Date(filters.dateFrom!)
        )
      }

      if (filters.dateTo) {
        results = results.filter((result: SearchResult) => 
          new Date(result.created_at) <= new Date(filters.dateTo!)
        )
      }

      return { results }
    } catch (error) {
      console.error('Search service error:', error)
      return { 
        results: [], 
        error: error instanceof Error ? error.message : 'Search failed' 
      }
    }
  }

  /**
   * Get search suggestions for autocomplete
   */
  async getSearchSuggestions(
    query: string, 
    limit: number = 10
  ): Promise<{ suggestions: SearchSuggestion[]; error?: string }> {
    try {
      if (!query.trim() || query.length < 2) {
        return { suggestions: [] }
      }

      const { data, error } = await this.supabase
        .rpc('search_suggestions', {
          search_query: query.trim(),
          suggestion_limit: limit
        })

      if (error) {
        console.error('Search suggestions error:', error)
        return { suggestions: [], error: error.message }
      }

      return { suggestions: data || [] }
    } catch (error) {
      console.error('Search suggestions service error:', error)
      return { 
        suggestions: [], 
        error: error instanceof Error ? error.message : 'Suggestions failed' 
      }
    }
  }

  /**
   * Record search analytics
   */
  async recordSearchAnalytics(analytics: SearchAnalytics): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('search_analytics')
        .insert({
          search_query: analytics.query,
          results_count: analytics.resultsCount,
          clicked_result_id: analytics.clickedResultId,
          clicked_result_type: analytics.clickedResultType,
          session_id: analytics.sessionId
        })

      if (error) {
        console.error('Search analytics error:', error)
      }
    } catch (error) {
      console.error('Search analytics service error:', error)
    }
  }

  /**
   * Get search analytics for admin dashboard
   */
  async getSearchAnalytics(
    dateFrom?: string,
    dateTo?: string,
    limit: number = 100
  ): Promise<{ analytics: any[]; error?: string }> {
    try {
      let query = this.supabase
        .from('search_analytics')
        .select(`
          *,
          user_profiles!inner(name, email)
        `)
        .order('search_timestamp', { ascending: false })
        .limit(limit)

      if (dateFrom) {
        query = query.gte('search_timestamp', dateFrom)
      }

      if (dateTo) {
        query = query.lte('search_timestamp', dateTo)
      }

      const { data, error } = await query

      if (error) {
        console.error('Search analytics query error:', error)
        return { analytics: [], error: error.message }
      }

      return { analytics: data || [] }
    } catch (error) {
      console.error('Search analytics service error:', error)
      return { 
        analytics: [], 
        error: error instanceof Error ? error.message : 'Analytics failed' 
      }
    }
  }

  /**
   * Get popular search terms
   */
  async getPopularSearchTerms(
    limit: number = 20,
    dateFrom?: string
  ): Promise<{ terms: Array<{ query: string; count: number }>; error?: string }> {
    try {
      let query = this.supabase
        .from('search_analytics')
        .select('search_query')
        .order('search_timestamp', { ascending: false })

      if (dateFrom) {
        query = query.gte('search_timestamp', dateFrom)
      }

      const { data, error } = await query

      if (error) {
        console.error('Popular search terms error:', error)
        return { terms: [], error: error.message }
      }

      // Aggregate search terms
      const termCounts = (data || []).reduce((acc: Record<string, number>, item) => {
        const term = item.search_query.toLowerCase().trim()
        if (term.length > 0) {
          acc[term] = (acc[term] || 0) + 1
        }
        return acc
      }, {})

      const terms = Object.entries(termCounts)
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)

      return { terms }
    } catch (error) {
      console.error('Popular search terms service error:', error)
      return { 
        terms: [], 
        error: error instanceof Error ? error.message : 'Popular terms failed' 
      }
    }
  }
}

// Singleton instance
export const searchServiceServer = new SearchServiceServer()