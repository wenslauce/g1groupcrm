'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Search, Clock, TrendingUp, X, Loader2 } from 'lucide-react'
import { clientSearchService, SearchResult, SearchSuggestion, searchUtils } from '@/lib/search-service'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-debounce'

interface GlobalSearchBarProps {
  placeholder?: string
  className?: string
  showRecentSearches?: boolean
  showSuggestions?: boolean
  maxResults?: number
  onResultClick?: (result: SearchResult) => void
  onSearchSubmit?: (query: string) => void
}

export function GlobalSearchBar({
  placeholder = "Search clients, SKRs, assets, invoices...",
  className,
  showRecentSearches = true,
  showSuggestions = true,
  maxResults = 10,
  onResultClick,
  onSearchSubmit
}: GlobalSearchBarProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [popularTerms, setPopularTerms] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  // Generate session ID for analytics
  const sessionId = useRef(Math.random().toString(36).substring(7))

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to parse recent searches:', error)
      }
    }

    // Load popular terms (this could be from an API)
    setPopularTerms(['SKR-2024', 'pending invoices', 'active clients', 'high value assets'])
  }, [])

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return

    setRecentSearches(prev => {
      const updated = [searchQuery, ...prev.filter(s => s !== searchQuery)].slice(0, 10)
      localStorage.setItem('recentSearches', JSON.stringify(updated))
      return updated
    })
  }, [])

  // Perform search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      // Get search results and suggestions in parallel
      const [searchResponse, suggestionsResponse] = await Promise.all([
        clientSearchService.search(searchQuery, { limit: maxResults }),
        showSuggestions ? clientSearchService.getSuggestions(searchQuery, 5) : Promise.resolve({ suggestions: [] })
      ])

      if (searchResponse.error) {
        console.error('Search error:', searchResponse.error)
        setResults([])
      } else {
        setResults(searchResponse.results)
      }

      if ('error' in suggestionsResponse && suggestionsResponse.error) {
        console.error('Suggestions error:', suggestionsResponse.error)
        setSuggestions([])
      } else {
        setSuggestions(suggestionsResponse.suggestions)
      }
    } catch (error) {
      console.error('Search failed:', error)
      setResults([])
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [maxResults, showSuggestions])

  // Handle debounced search
  useEffect(() => {
    if (debouncedQuery && isOpen) {
      performSearch(debouncedQuery)
    } else {
      setResults([])
      setSuggestions([])
    }
  }, [debouncedQuery, isOpen, performSearch])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setSelectedIndex(-1)
    
    if (value.trim()) {
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }

  // Handle search submit
  const handleSearchSubmit = (searchQuery: string = query) => {
    if (!searchQuery.trim()) return

    saveRecentSearch(searchQuery)
    setIsOpen(false)
    setQuery('')

    if (onSearchSubmit) {
      onSearchSubmit(searchQuery)
    } else {
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  // Handle result click
  const handleResultClick = async (result: SearchResult) => {
    saveRecentSearch(query)
    
    // Record click analytics
    await clientSearchService.recordClick(
      query,
      result.id,
      result.type,
      sessionId.current
    )

    setIsOpen(false)
    setQuery('')

    if (onResultClick) {
      onResultClick(result)
    } else if (result.url) {
      router.push(result.url)
    }
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    handleSearchSubmit(suggestion)
  }

  // Handle recent search click
  const handleRecentSearchClick = (recentQuery: string) => {
    setQuery(recentQuery)
    handleSearchSubmit(recentQuery)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    const totalItems = results.length + suggestions.length + recentSearches.length

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % totalItems)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          if (selectedIndex < results.length) {
            handleResultClick(results[selectedIndex])
          } else if (selectedIndex < results.length + suggestions.length) {
            const suggestionIndex = selectedIndex - results.length
            handleSuggestionClick(suggestions[suggestionIndex].suggestion)
          } else {
            const recentIndex = selectedIndex - results.length - suggestions.length
            handleRecentSearchClick(recentSearches[recentIndex])
          }
        } else {
          handleSearchSubmit()
        }
        break
      case 'Escape':
        setIsOpen(false)
        inputRef.current?.blur()
        break
    }
  }

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('recentSearches')
  }

  return (
    <div ref={searchRef} className={cn("relative w-full max-w-2xl", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {query && !isLoading && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery('')
              setIsOpen(false)
              inputRef.current?.focus()
            }}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-hidden">
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {/* Search Results */}
              {results.length > 0 && (
                <div className="p-2">
                  <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
                    Search Results
                  </div>
                  {results.map((result, index) => (
                    <div
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className={cn(
                        "flex items-start gap-3 p-2 rounded-md cursor-pointer hover:bg-accent",
                        selectedIndex === index && "bg-accent"
                      )}
                    >
                      <div className="text-lg mt-0.5">
                        {searchUtils.getResultIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span 
                            className="font-medium text-sm truncate"
                            dangerouslySetInnerHTML={{
                              __html: searchUtils.highlightSearchTerms(result.title, query)
                            }}
                          />
                          <Badge variant="secondary" className="text-xs">
                            {searchUtils.formatResultType(result.type)}
                          </Badge>
                        </div>
                        {result.subtitle && (
                          <div 
                            className="text-xs text-muted-foreground truncate"
                            dangerouslySetInnerHTML={{
                              __html: searchUtils.highlightSearchTerms(result.subtitle, query)
                            }}
                          />
                        )}
                        {result.content && (
                          <div 
                            className="text-xs text-muted-foreground mt-1 line-clamp-2"
                            dangerouslySetInnerHTML={{
                              __html: searchUtils.highlightSearchTerms(
                                searchUtils.generateExcerpt(result.content, query, 100),
                                query
                              )
                            }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <>
                  {results.length > 0 && <Separator />}
                  <div className="p-2">
                    <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
                      Suggestions
                    </div>
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={`suggestion-${index}`}
                        onClick={() => handleSuggestionClick(suggestion.suggestion)}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-accent",
                          selectedIndex === results.length + index && "bg-accent"
                        )}
                      >
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{suggestion.suggestion}</span>
                        <Badge variant="outline" className="text-xs ml-auto">
                          {searchUtils.formatResultType(suggestion.type)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Recent Searches */}
              {showRecentSearches && recentSearches.length > 0 && !query && (
                <>
                  {(results.length > 0 || suggestions.length > 0) && <Separator />}
                  <div className="p-2">
                    <div className="flex items-center justify-between mb-2 px-2">
                      <div className="text-xs font-medium text-muted-foreground">
                        Recent Searches
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearRecentSearches}
                        className="text-xs h-auto p-1"
                      >
                        Clear
                      </Button>
                    </div>
                    {recentSearches.slice(0, 5).map((recentQuery, index) => (
                      <div
                        key={`recent-${index}`}
                        onClick={() => handleRecentSearchClick(recentQuery)}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-accent",
                          selectedIndex === results.length + suggestions.length + index && "bg-accent"
                        )}
                      >
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{recentQuery}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Popular Terms */}
              {popularTerms.length > 0 && !query && recentSearches.length === 0 && (
                <div className="p-2">
                  <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
                    Popular Searches
                  </div>
                  {popularTerms.slice(0, 5).map((term, index) => (
                    <div
                      key={`popular-${index}`}
                      onClick={() => handleRecentSearchClick(term)}
                      className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-accent"
                    >
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{term}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* No Results */}
              {query && !isLoading && results.length === 0 && suggestions.length === 0 && (
                <div className="p-4 text-center text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No results found for "{query}"</p>
                  <p className="text-xs mt-1">Try different keywords or check spelling</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}