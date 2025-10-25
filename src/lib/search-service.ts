import { createClient as createBrowserClient } from '@/lib/supabase/client'

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
 * Client-side search service
 */
export class ClientSearchService {
  private supabase = createBrowserClient()

  /**
   * Perform search from client-side
   */
  async search(
    query: string, 
    filters: SearchFilters = {}
  ): Promise<{ results: SearchResult[]; error?: string }> {
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, filters }),
      })

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Client search error:', error)
      return { 
        results: [], 
        error: error instanceof Error ? error.message : 'Search failed' 
      }
    }
  }

  /**
   * Get search suggestions from client-side
   */
  async getSuggestions(
    query: string, 
    limit: number = 10
  ): Promise<{ suggestions: SearchSuggestion[]; error?: string }> {
    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`)

      if (!response.ok) {
        throw new Error(`Suggestions failed: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Client suggestions error:', error)
      return { 
        suggestions: [], 
        error: error instanceof Error ? error.message : 'Suggestions failed' 
      }
    }
  }

  /**
   * Record search click analytics
   */
  async recordClick(
    query: string,
    resultId: string,
    resultType: string,
    sessionId?: string
  ): Promise<void> {
    try {
      await fetch('/api/search/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'click',
          query,
          resultId,
          resultType,
          sessionId
        }),
      })
    } catch (error) {
      console.error('Search click analytics error:', error)
    }
  }
}

// Singleton instances
export const clientSearchService = new ClientSearchService()

// Search utilities
export const searchUtils = {
  /**
   * Highlight search terms in text
   */
  highlightSearchTerms(text: string, searchQuery: string): string {
    if (!searchQuery.trim()) return text
    
    const terms = searchQuery.trim().split(/\s+/)
    let highlightedText = text
    
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi')
      highlightedText = highlightedText.replace(
        regex, 
        '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>'
      )
    })
    
    return highlightedText
  },

  /**
   * Generate search result excerpt
   */
  generateExcerpt(content: string, searchQuery: string, maxLength: number = 150): string {
    if (!searchQuery.trim()) {
      return content.length > maxLength 
        ? content.substring(0, maxLength) + '...' 
        : content
    }

    const terms = searchQuery.trim().toLowerCase().split(/\s+/)
    const contentLower = content.toLowerCase()
    
    // Find the first occurrence of any search term
    let firstIndex = -1
    for (const term of terms) {
      const index = contentLower.indexOf(term)
      if (index !== -1 && (firstIndex === -1 || index < firstIndex)) {
        firstIndex = index
      }
    }

    if (firstIndex === -1) {
      return content.length > maxLength 
        ? content.substring(0, maxLength) + '...' 
        : content
    }

    // Extract excerpt around the found term
    const start = Math.max(0, firstIndex - 50)
    const end = Math.min(content.length, start + maxLength)
    
    let excerpt = content.substring(start, end)
    
    if (start > 0) excerpt = '...' + excerpt
    if (end < content.length) excerpt = excerpt + '...'
    
    return excerpt
  },

  /**
   * Get search result icon based on type
   */
  getResultIcon(type: string): string {
    switch (type) {
      case 'client':
        return '👤'
      case 'skr':
        return '📋'
      case 'asset':
        return '📦'
      case 'invoice':
        return '💰'
      default:
        return '📄'
    }
  },

  /**
   * Format search result type for display
   */
  formatResultType(type: string): string {
    switch (type) {
      case 'client':
        return 'Client'
      case 'skr':
        return 'SKR'
      case 'asset':
        return 'Asset'
      case 'invoice':
        return 'Invoice'
      default:
        return 'Document'
    }
  }
}