'use client'

import { useState, useEffect, useRef } from 'react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, ChevronsUpDown, MapPin, Plane, Ship, Building2 } from 'lucide-react'
import { trackingUtils } from '@/lib/tracking-utils'
import { LocationData } from '@/lib/location-data'
import { cn } from '@/lib/utils'

interface SmartLocationInputProps {
  value: string
  onLocationSelect: (location: string, coordinates?: { lat: number; lng: number }) => void
  disabled?: boolean
}

export function SmartLocationInput({ value, onLocationSelect, disabled }: SmartLocationInputProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<LocationData[]>([])
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null)
  
  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      return
    }
    
    const timeout = setTimeout(() => {
      const results = trackingUtils.searchLocations(searchQuery)
      setSearchResults(results)
    }, 300)
    
    return () => clearTimeout(timeout)
  }, [searchQuery])

  const handleLocationSelect = (location: LocationData) => {
    setSelectedLocation(location)
    onLocationSelect(location.name, location.coordinates)
    setOpen(false)
  }

  const handleManualInput = (input: string) => {
    setSelectedLocation(null)
    onLocationSelect(input, undefined)
  }

  const getLocationIcon = (type: LocationData['type']) => {
    switch (type) {
      case 'port':
        return <Ship className="h-4 w-4" />
      case 'airport':
        return <Plane className="h-4 w-4" />
      case 'city':
        return <Building2 className="h-4 w-4" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  const getLocationBadge = (type: LocationData['type']) => {
    const colors = {
      port: 'bg-blue-100 text-blue-700',
      airport: 'bg-purple-100 text-purple-700',
      city: 'bg-green-100 text-green-700',
      warehouse: 'bg-orange-100 text-orange-700',
      border_crossing: 'bg-red-100 text-red-700'
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  // Show popular locations by default
  const popularLocations = [
    ...trackingUtils.getPopularLocationsByType('port', 5),
    ...trackingUtils.getPopularLocationsByType('airport', 5),
  ]

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {value || "Search ports, airports, cities..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Search locations..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            
            {searchResults.length > 0 ? (
              <>
                <CommandEmpty>No locations found.</CommandEmpty>
                <CommandGroup heading="Search Results">
                  {searchResults.map((location) => (
                    <CommandItem
                      key={location.id}
                      onSelect={() => handleLocationSelect(location)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === location.name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex items-center gap-2 flex-1">
                        {getLocationIcon(location.type)}
                        <div className="flex-1">
                          <div className="font-medium">{location.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {location.city && `${location.city}, `}{location.country}
                            {location.code && ` (${location.code})`}
                          </div>
                        </div>
                        <Badge className={getLocationBadge(location.type)} variant="secondary">
                          {location.type}
                        </Badge>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            ) : (
              <>
                <CommandGroup heading="Popular Ports">
                  {trackingUtils.getPopularLocationsByType('port', 5).map((location) => (
                    <CommandItem
                      key={location.id}
                      onSelect={() => handleLocationSelect(location)}
                      className="cursor-pointer"
                    >
                      <Ship className="mr-2 h-4 w-4 text-blue-500" />
                      <div className="flex-1">
                        <div className="font-medium">{location.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {location.country} {location.code && `(${location.code})`}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
                
                <CommandGroup heading="Popular Airports">
                  {trackingUtils.getPopularLocationsByType('airport', 5).map((location) => (
                    <CommandItem
                      key={location.id}
                      onSelect={() => handleLocationSelect(location)}
                      className="cursor-pointer"
                    >
                      <Plane className="mr-2 h-4 w-4 text-purple-500" />
                      <div className="flex-1">
                        <div className="font-medium">{location.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {location.country} {location.code && `(${location.code})`}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
                
                <CommandGroup heading="Other">
                  <CommandItem onSelect={() => handleManualInput('In Transit - Sea')}>
                    <MapPin className="mr-2 h-4 w-4" />
                    <span>In Transit - Sea</span>
                  </CommandItem>
                  <CommandItem onSelect={() => handleManualInput('In Transit - Air')}>
                    <MapPin className="mr-2 h-4 w-4" />
                    <span>In Transit - Air</span>
                  </CommandItem>
                  <CommandItem onSelect={() => handleManualInput('Customs Clearance')}>
                    <MapPin className="mr-2 h-4 w-4" />
                    <span>Customs Clearance</span>
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </Command>
        </PopoverContent>
      </Popover>

      {selectedLocation && (
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3" />
            <span>
              Coordinates: {selectedLocation.coordinates.lat.toFixed(4)}, {selectedLocation.coordinates.lng.toFixed(4)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

