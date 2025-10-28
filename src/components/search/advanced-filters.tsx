'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarIcon, Filter, X, Save, RotateCcw } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export interface FilterConfig {
  id: string
  name: string
  description?: string
  filters: FilterValues
  isDefault?: boolean
  createdAt: string
}

export interface FilterValues {
  types: string[]
  status: string[]
  dateFrom?: Date
  dateTo?: Date
  amountMin?: number
  amountMax?: number
  priority?: string
  assignedTo?: string
  tags: string[]
  customFields: Record<string, any>
}

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterValues) => void
  initialFilters?: Partial<FilterValues>
  availableTypes?: Array<{ value: string; label: string }>
  availableStatuses?: Array<{ value: string; label: string }>
  availableTags?: string[]
  availableUsers?: Array<{ id: string; name: string }>
  showSavePreset?: boolean
  savedPresets?: FilterConfig[]
  onSavePreset?: (name: string, filters: FilterValues) => void
  onLoadPreset?: (preset: FilterConfig) => void
  onDeletePreset?: (presetId: string) => void
}

const defaultTypes = [
  { value: 'client', label: 'Clients' },
  { value: 'skr', label: 'SKRs' },
  { value: 'asset', label: 'Assets' },
  { value: 'invoice', label: 'Invoices' }
]

const defaultStatuses = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
]

export function AdvancedFilters({
  onFiltersChange,
  initialFilters = {},
  availableTypes = defaultTypes,
  availableStatuses = defaultStatuses,
  availableTags = [],
  availableUsers = [],
  showSavePreset = true,
  savedPresets = [],
  onSavePreset,
  onLoadPreset,
  onDeletePreset
}: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<FilterValues>({
    types: [],
    status: [],
    tags: [],
    customFields: {},
    ...initialFilters
  })

  const [isExpanded, setIsExpanded] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  const updateFilters = (updates: Partial<FilterValues>) => {
    setFilters(prev => ({ ...prev, ...updates }))
  }

  const toggleType = (type: string) => {
    updateFilters({
      types: filters.types.includes(type)
        ? filters.types.filter(t => t !== type)
        : [...filters.types, type]
    })
  }

  const toggleStatus = (status: string) => {
    updateFilters({
      status: filters.status.includes(status)
        ? filters.status.filter(s => s !== status)
        : [...filters.status, status]
    })
  }

  const toggleTag = (tag: string) => {
    updateFilters({
      tags: filters.tags.includes(tag)
        ? filters.tags.filter(t => t !== tag)
        : [...filters.tags, tag]
    })
  }

  const clearFilters = () => {
    const clearedFilters: FilterValues = {
      types: [],
      status: [],
      tags: [],
      customFields: {}
    }
    setFilters(clearedFilters)
  }

  const hasActiveFilters = () => {
    return filters.types.length > 0 ||
           filters.status.length > 0 ||
           filters.dateFrom ||
           filters.dateTo ||
           filters.amountMin !== undefined ||
           filters.amountMax !== undefined ||
           filters.priority ||
           filters.assignedTo ||
           filters.tags.length > 0 ||
           Object.keys(filters.customFields).length > 0
  }

  const getActiveFilterCount = () => {
    let count = 0
    count += filters.types.length
    count += filters.status.length
    count += filters.tags.length
    if (filters.dateFrom) count++
    if (filters.dateTo) count++
    if (filters.amountMin !== undefined) count++
    if (filters.amountMax !== undefined) count++
    if (filters.priority) count++
    if (filters.assignedTo) count++
    count += Object.keys(filters.customFields).length
    return count
  }

  const handleSavePreset = () => {
    if (presetName.trim() && onSavePreset) {
      onSavePreset(presetName.trim(), filters)
      setPresetName('')
      setShowSaveDialog(false)
    }
  }

  const handleLoadPreset = (preset: FilterConfig) => {
    setFilters(preset.filters)
    if (onLoadPreset) {
      onLoadPreset(preset)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Filters
            {hasActiveFilters() && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFilterCount()} active
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters() && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-1"
              >
                <RotateCcw className="h-4 w-4" />
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Saved Presets */}
          {showSavePreset && savedPresets.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Saved Filter Presets</Label>
              <div className="flex flex-wrap gap-2">
                {savedPresets.map((preset) => (
                  <div key={preset.id} className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLoadPreset(preset)}
                      className="text-xs"
                    >
                      {preset.name}
                    </Button>
                    {onDeletePreset && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeletePreset(preset.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content Types */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Content Types</Label>
            <div className="flex flex-wrap gap-2">
              {availableTypes.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type.value}`}
                    checked={filters.types.includes(type.value)}
                    onCheckedChange={() => toggleType(type.value)}
                  />
                  <Label
                    htmlFor={`type-${type.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status</Label>
            <div className="flex flex-wrap gap-2">
              {availableStatuses.map((status) => (
                <div key={status.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status.value}`}
                    checked={filters.status.includes(status.value)}
                    onCheckedChange={() => toggleStatus(status.value)}
                  />
                  <Label
                    htmlFor={`status-${status.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {status.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateFrom ? format(filters.dateFrom, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) => updateFilters({ dateFrom: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateTo ? format(filters.dateTo, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) => updateFilters({ dateTo: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Amount Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount-min" className="text-sm font-medium">
                Minimum Amount
              </Label>
              <Input
                id="amount-min"
                type="number"
                placeholder="0.00"
                value={filters.amountMin || ''}
                onChange={(e) => updateFilters({ 
                  amountMin: e.target.value ? parseFloat(e.target.value) : undefined 
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount-max" className="text-sm font-medium">
                Maximum Amount
              </Label>
              <Input
                id="amount-max"
                type="number"
                placeholder="0.00"
                value={filters.amountMax || ''}
                onChange={(e) => updateFilters({ 
                  amountMax: e.target.value ? parseFloat(e.target.value) : undefined 
                })}
              />
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Priority</Label>
            <Select
              value={filters.priority || 'all'}
              onValueChange={(value) => updateFilters({ priority: value === 'all' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assigned To */}
          {availableUsers.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Assigned To</Label>
              <Select
                value={filters.assignedTo || 'all'}
                onValueChange={(value) => updateFilters({ assignedTo: value === 'all' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tags */}
          {availableTags.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tags</Label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <div key={tag} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag}`}
                      checked={filters.tags.includes(tag)}
                      onCheckedChange={() => toggleTag(tag)}
                    />
                    <Label
                      htmlFor={`tag-${tag}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {tag}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save Preset */}
          {showSavePreset && onSavePreset && (
            <div className="pt-4 border-t">
              {!showSaveDialog ? (
                <Button
                  variant="outline"
                  onClick={() => setShowSaveDialog(true)}
                  className="flex items-center gap-2"
                  disabled={!hasActiveFilters()}
                >
                  <Save className="h-4 w-4" />
                  Save Filter Preset
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Preset name"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSavePreset}
                    disabled={!presetName.trim()}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSaveDialog(false)
                      setPresetName('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}