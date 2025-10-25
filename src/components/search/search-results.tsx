'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, SortAsc, SortDesc, ExternalLink, Clock, Loader2 } from 'lucide-react'
import { clientSearchService, SearchResult, SearchFilters, searchUtils } from '@/lib/search-service'
import { AdvancedFilters, FilterValues } from './advanced-filters'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface SearchResultsProps {
  initialQuery?: string
  initialFilters?: SearchFilters
  showFilters?: boolean
  showSorting?: boolean
  resultsPerPage?: number
}

type SortOption = 'relevance' | 'date_desc' | 'date_asc' | 'title_asc' | 'title_desc'

export function SearchResults({
  initialQuery = '',
  initialFilters = {},
  showFilters = true,
  showSorting = true,
  resultsPerPage = 20
}: SearchResultsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [query, setQuery] = useState(initialQuery || searchParams.get('q') || '')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalResults, setTotalResults] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<SortOption>('relevance')
  const [filters, setFilters] = useState<FilterValues>({
    types: initialFilters.types || [],
    status: initialFilters.status || [],
    tags: [],
    customFields: {}
  })
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Perform search
  const performSearch = async (searchQuery: string, searchFilters: SearchFilters = {}, page: number = 1) => {
    if (!searchQuery.trim()) {
      setResults([])
      setTotalResults(0)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { results: searchResults, error: searchError } = await clientSearchService.search(
        searchQuery,
        {
          ...searchFilters,
          limit: resultsPerPage
        }
      )

      if (searchError) {
        setError(searchError)
        setResults([])
        setTotalResults(0)
      } else {
        // Apply client-side sorting since the API doesn't support it yet
        const sortedResults = sortResults(searchResults, sortBy)
        setResults(sortedResults)
        setTotalResults(sortedResults.length)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
      setTotalResults(0)
    } finally {
      setIsLoading(false)
    }
  }

  // Sort results
  const sortResults = (results: SearchResult[], sortOption: SortOption): SearchResult[] => {
    const sorted = [...results]
    
    switch (sortOption) {
      case 'relevance':
        return sorted.sort((a, b) => b.rank - a.rank)
      case 'date_desc':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      case 'date_asc':
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      case 'title_asc':
        return sorted.sort((a, b) => a.title.localeCompare(b.title))
      case 'title_desc':
        return sorted.sort((a, b) => b.title.localeCompare(a.title))
      default:
        return sorted
    }
  }

  // Convert FilterValues to SearchFilters
  const convertFiltersToSearchFilters = (filterValues: FilterValues): SearchFilters => {
    return {
      types: filterValues.types.length > 0 ? filterValues.types as any : undefined,
      status: filterValues.status.length > 0 ? filterValues.status : undefined,
      dateFrom: filterValues.dateFrom?.toISOString(),
      dateTo: filterValues.dateTo?.toISOString(),
      limit: resultsPerPage
    }
  }

  // Handle search
  const handleSearch = (newQuery?: string) => {
    const searchQuery = newQuery || query
    const searchFilters = convertFiltersToSearchFilters(filters)
    
    // Update URL
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (filters.types.length > 0) params.set('types', filters.types.join(','))
    if (filters.status.length > 0) params.set('status', filters.status.join(','))
    if (sortBy !== 'relevance') params.set('sort', sortBy)
    
    router.push(`/dashboard/search?${params.toString()}`)
    
    performSearch(searchQuery, searchFilters, 1)
    setCurrentPage(1)
  }

  // Handle filter change
  const handleFiltersChange = (newFilters: FilterValues) => {
    setFilters(newFilters)
    const searchFilters = convertFiltersToSearchFilters(newFilters)
    performSearch(query, searchFilters, 1)
    setCurrentPage(1)
  }

  // Handle sort change
  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort)
    const sortedResults = sortResults(results, newSort)
    setResults(sortedResults)
  }

  // Handle result click
  const handleResultClick = async (result: SearchResult) => {
    // Record click analytics
    await clientSearchService.recordClick(
      query,
      result.id,
      result.type
    )
    
    router.push(result.url)
  }

  // Initial search on mount
  useEffect(() => {
    if (query) {
      const searchFilters = convertFiltersToSearchFilters(filters)
      performSearch(query, searchFilters)
    }
  }, []) // Only run on mount

  // Update query from URL params
  useEffect(() => {
    const urlQuery = searchParams.get('q')
    const urlTypes = searchParams.get('types')?.split(',')
    const urlStatus = searchParams.get('status')?.split(',')
    const urlSort = searchParams.get('sort') as SortOption

    if (urlQuery && urlQuery !== query) {
      setQuery(urlQuery)
    }

    if (urlTypes || urlStatus) {
      setFilters(prev => ({
        ...prev,
        types: urlTypes || [],
        status: urlStatus || []
      }))
    }

    if (urlSort && urlSort !== sortBy) {
      setSortBy(urlSort)
    }
  }, [searchParams])

  const getResultTypeColor = (type: string) => {
    switch (type) {
      case 'client':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'skr':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'asset':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'invoice':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search clients, SKRs, assets, invoices..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={() => handleSearch()}>
            Search
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showFilters && (
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {(filters.types.length > 0 || filters.status.length > 0) && (
                  <Badge variant="secondary" className="ml-1">
                    {filters.types.length + filters.status.length}
                  </Badge>
                )}
              </Button>
            )}

            {query && (
              <div className="text-sm text-muted-foreground">
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching...
                  </div>
                ) : (
                  `${totalResults} results for "${query}"`
                )}
              </div>
            )}
          </div>

          {showSorting && results.length > 0 && (
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Relevance
                  </div>
                </SelectItem>
                <SelectItem value="date_desc">
                  <div className="flex items-center gap-2">
                    <SortDesc className="h-4 w-4" />
                    Newest First
                  </div>
                </SelectItem>
                <SelectItem value="date_asc">
                  <div className="flex items-center gap-2">
                    <SortAsc className="h-4 w-4" />
                    Oldest First
                  </div>
                </SelectItem>
                <SelectItem value="title_asc">
                  <div className="flex items-center gap-2">
                    <SortAsc className="h-4 w-4" />
                    Title A-Z
                  </div>
                </SelectItem>
                <SelectItem value="title_desc">
                  <div className="flex items-center gap-2">
                    <SortDesc className="h-4 w-4" />
                    Title Z-A
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <AdvancedFilters
          onFiltersChange={handleFiltersChange}
          initialFilters={filters}
          showSavePreset={true}
        />
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="text-center text-destructive">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium">Search Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((result, index) => (
            <Card key={result.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="text-2xl mt-1">
                    {searchUtils.getResultIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 
                            className="font-semibold text-lg truncate cursor-pointer hover:text-primary"
                            onClick={() => handleResultClick(result)}
                            dangerouslySetInnerHTML={{
                              __html: searchUtils.highlightSearchTerms(result.title, query)
                            }}
                          />
                          <Badge className={cn("text-xs", getResultTypeColor(result.type))}>
                            {searchUtils.formatResultType(result.type)}
                          </Badge>
                        </div>
                        {result.subtitle && (
                          <p 
                            className="text-muted-foreground text-sm mb-2"
                            dangerouslySetInnerHTML={{
                              __html: searchUtils.highlightSearchTerms(result.subtitle, query)
                            }}
                          />
                        )}
                        {result.content && (
                          <p 
                            className="text-sm text-muted-foreground line-clamp-2"
                            dangerouslySetInnerHTML={{
                              __html: searchUtils.highlightSearchTerms(
                                searchUtils.generateExcerpt(result.content, query, 200),
                                query
                              )
                            }}
                          />
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResultClick(result)}
                        className="flex items-center gap-1 shrink-0"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View
                      </Button>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(result.created_at), 'MMM d, yyyy')}
                      </div>
                      {result.rank > 0 && (
                        <div>
                          Relevance: {Math.round(result.rank * 100)}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Results */}
      {!isLoading && query && results.length === 0 && !error && (
        <Card>
          <CardContent className="p-12">
            <div className="text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-medium text-lg mb-2">No results found</h3>
              <p className="text-sm mb-4">
                We couldn't find anything matching "{query}"
              </p>
              <div className="text-xs space-y-1">
                <p>Try:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Checking your spelling</li>
                  <li>Using different keywords</li>
                  <li>Using fewer or more general terms</li>
                  <li>Adjusting your filters</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!query && (
        <Card>
          <CardContent className="p-12">
            <div className="text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-medium text-lg mb-2">Search G1 Holdings</h3>
              <p className="text-sm">
                Find clients, SKRs, assets, invoices, and more across your entire system
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}