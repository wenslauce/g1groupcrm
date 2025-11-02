# G1 Group CRM - Enhanced Tracking System Guide

## Overview

The G1 Group CRM now includes an **advanced tracking system** with real-world location data, automatic coordinate population, and precise distance calculations.

## Key Features

### 1. **Real Location Database**
- **60+ Major Seaports** worldwide (Shanghai, Singapore, Rotterdam, Los Angeles, Dubai, Mombasa, Lagos, Istanbul, etc.)
- **55+ International Airports** (Heathrow, JFK, Changi, Dubai, Frankfurt, Nairobi, Addis Ababa, etc.)
- **Major Cities** (London, New York, Tokyo, Paris, Dubai, etc.)
- **Comprehensive Africa Coverage**: East Africa (Kenya, Tanzania, Ethiopia, Uganda, Rwanda, Somalia, Djibouti, Eritrea), West Africa (Nigeria, Ghana, Senegal, Ivory Coast, etc.), and Southern Africa
- **Complete Turkey Coverage**: Istanbul, Ankara, Izmir, Mersin, Antalya
- Each location includes:
  - Precise GPS coordinates (latitude/longitude)
  - Country & country code
  - IATA/ICAO codes for airports
  - UN/LOCODE for ports
  - Timezone information
  - Searchable terms

### 2. **Smart Location Input**
The `SmartLocationInput` component provides:
- **Autocomplete search** - Type to find ports, airports, or cities
- **Automatic coordinates** - GPS coordinates populate automatically when selecting a location
- **Type filtering** - Filter by port, airport, or city
- **Visual indicators** - Icons and badges for different location types
- **Popular locations** - Quick access to frequently used locations
- **Manual entry** - Option to enter custom locations for special cases

### 3. **Real Distance Calculations**
- **Haversine formula** - Calculates actual distance between GPS coordinates
- **Kilometer measurements** - All distances in kilometers (KM)
- **Cumulative tracking** - Total distance traveled displayed in summary
- **Segment distances** - Distance between each location update

## Using the Enhanced Tracking System

### Adding a Location Update

1. **Navigate to SKR Tracking Page**
   ```
   /dashboard/skrs/[id]/tracking
   ```

2. **Click "Add Location" Button**

3. **Search for Location**
   - Click the location dropdown
   - Type to search (e.g., "singapore", "heathrow", "rotterdam")
   - Select from search results

4. **Coordinates Auto-Populate**
   - When you select a location from the database, coordinates fill automatically
   - You can also use the "Get Current Location" button for GPS

5. **Add Additional Details**
   - Select status (In Transit, At Destination, etc.)
   - Add notes (optional)
   - Review coordinates (editable if needed)

6. **Submit**
   - Click "Update Location"
   - New record appears in timeline with distance from previous location

### Viewing Tracking History

The **Tracking Timeline** displays:
- **All location updates** in chronological order
- **Distance traveled** between each location (in KM)
- **Current location** highlighted with badge
- **GPS coordinates** for each tracked location
- **User who recorded** each update
- **Status** at each location (In Vault, In Transit, At Destination, etc.)

### Tracking Summary Statistics

At the bottom of the tracking page, you'll see:
- **Total Updates** - Number of location records
- **Unique Locations** - Number of different places visited
- **GPS Coordinates** - How many updates have precise coordinates
- **Total Distance (KM)** - Sum of all distances traveled

## Location Database Structure

### Ports
```typescript
{
  id: 'port-singapore',
  name: 'Port of Singapore',
  type: 'port',
  country: 'Singapore',
  countryCode: 'SG',
  coordinates: { lat: 1.2644, lng: 103.8220 },
  code: 'SGSIN', // UN/LOCODE
  timezone: 'Asia/Singapore'
}
```

### Airports
```typescript
{
  id: 'airport-heathrow',
  name: 'London Heathrow Airport',
  type: 'airport',
  country: 'United Kingdom',
  countryCode: 'GB',
  coordinates: { lat: 51.4700, lng: -0.4543 },
  code: 'LHR', // IATA code
  timezone: 'Europe/London'
}
```

### Cities
```typescript
{
  id: 'city-dubai',
  name: 'Dubai',
  type: 'city',
  country: 'United Arab Emirates',
  countryCode: 'AE',
  coordinates: { lat: 25.2048, lng: 55.2708 },
  timezone: 'Asia/Dubai'
}
```

## Regional Coverage

### Africa (58 locations)
- **East Africa**: Mombasa, Dar es Salaam, Nairobi, Addis Ababa, Djibouti, Kigali, Entebbe, Zanzibar, Kilimanjaro, Mogadishu, Berbera, Massawa
- **West Africa**: Lagos, Abidjan, Accra, Dakar, Tema, Cotonou, Lomé, Douala, Luanda, Conakry, Freetown, Monrovia
- **North Africa**: Cairo, Alexandria, Suez, Port Said, Tangier
- **Southern Africa**: Johannesburg, Cape Town, Durban

### Turkey (10 locations)
- **Ports**: Istanbul (Ambarlı), Izmir, Mersin, Gemlik, Iskenderun
- **Airports**: Istanbul (IST & SAW), Ankara, Antalya, Izmir

## Distance Calculation

The system uses the **Haversine formula** to calculate the great-circle distance between two points on Earth:

```typescript
function calculateDistance(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(coord2.lat - coord1.lat)
  const dLon = toRadians(coord2.lng - coord1.lng)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.lat)) *
    Math.cos(toRadians(coord2.lat)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distance in kilometers
}
```

### Example Distances

| From | To | Distance |
|------|-----|----------|
| Port of Shanghai | Port of Singapore | ~3,900 KM |
| Singapore Changi Airport | Dubai International Airport | ~6,000 KM |
| London Heathrow | New York JFK | ~5,540 KM |
| Port of Los Angeles | Port of Shanghai | ~10,000 KM |
| Rotterdam Port | Hamburg Port | ~360 KM |
| **Nairobi (NBO)** | **Addis Ababa (ADD)** | **~1,250 KM** |
| **Port of Mombasa** | **Port of Dar es Salaam** | **~750 KM** |
| **Lagos (LOS)** | **Accra (ACC)** | **~360 KM** |
| **Istanbul Airport** | **Cairo Airport** | **~1,200 KM** |
| **Port of Mersin** | **Port of Alexandria** | **~550 KM** |

## API Integration

### Get Tracking History
```typescript
GET /api/skrs/[id]/tracking

Response:
{
  "data": [
    {
      "id": "uuid",
      "skr_id": "uuid",
      "location": "Port of Singapore",
      "current_location": "Port of Singapore",
      "status": "in_transit",
      "latitude": 1.2644,
      "longitude": 103.8220,
      "coordinates": "(103.8220,1.2644)",
      "notes": "Container loaded onto vessel",
      "is_latest": true,
      "created_at": "2025-11-01T10:00:00Z",
      "updated_by": "uuid",
      "recorded_by_user": {
        "id": "uuid",
        "name": "John Smith"
      },
      "distanceTraveled": 3900.5
    }
  ],
  "count": 5
}
```

### Add Tracking Update
```typescript
POST /api/skrs/[id]/tracking

Body:
{
  "location": "Port of Rotterdam",
  "status": "at_destination",
  "latitude": 51.9244,
  "longitude": 4.4777,
  "notes": "Arrived at destination port"
}

Response:
{
  "data": {
    "id": "uuid",
    "location": "Port of Rotterdam",
    ...
  }
}
```

## Components

### `<SmartLocationInput />`
Intelligent location search and selection component.

**Props:**
- `value: string` - Current location value
- `onLocationSelect: (location: string, coordinates?: { lat, lng }) => void` - Callback when location selected
- `disabled?: boolean` - Disable input

**Features:**
- Debounced search (300ms)
- Type-ahead suggestions
- Grouped results (Ports, Airports, Cities)
- Automatic coordinate population
- Visual type indicators

### `<LocationUpdateForm />`
Form for adding new tracking updates.

**Props:**
- `skr: SKRWithRelations` - The SKR being tracked
- `onUpdate?: () => void` - Callback after successful update
- `onCancel?: () => void` - Callback when cancelled

**Features:**
- Smart location input
- Status selection
- Coordinate management
- Current GPS location button
- Form validation
- Error handling

### `<TrackingTimeline />`
Displays tracking history with distances.

**Props:**
- `skr: SKRWithRelations` - The SKR to display tracking for
- `initialRecords?: TrackingRecord[]` - Optional initial records
- `showAddButton?: boolean` - Show "Add Location" button

**Features:**
- Chronological timeline
- Distance calculations
- Status filtering
- Location search
- Summary statistics
- Visual timeline with current location highlighted

## Utilities

### `trackingUtils`

Located in `src/lib/tracking-utils.ts`

**Methods:**
- `searchLocations(query, types?)` - Search location database
- `getAllPorts()` - Get all port locations
- `getAllAirports()` - Get all airport locations
- `getAllCities()` - Get all city locations
- `findLocationByName(name)` - Find specific location
- `calculateDistance(lat1, lon1, lat2, lon2)` - Calculate distance in KM
- `formatCoordinates(lat, lng)` - Format coordinates for display
- `validateCoordinates(lat, lng)` - Validate coordinate ranges

### Location Data

Located in `src/lib/location-data.ts`

**Exports:**
- `MAJOR_PORTS` - Array of 25 major seaports
- `MAJOR_AIRPORTS` - Array of 25 major airports
- `MAJOR_CITIES` - Array of major cities
- `ALL_LOCATIONS` - Combined array of all locations
- `searchLocations(query, types?)` - Search function
- `calculateDistance(coord1, coord2)` - Distance calculator
- `getAllCountries()` - Get unique countries list

## Extending the Location Database

To add new locations, edit `src/lib/location-data.ts`:

```typescript
export const MAJOR_PORTS: LocationData[] = [
  // ... existing ports
  {
    id: 'port-new-location',
    name: 'Port of New Location',
    type: 'port',
    country: 'Country Name',
    countryCode: 'CC',
    city: 'City Name',
    coordinates: { lat: 12.3456, lng: 78.9012 },
    code: 'CCNEW',
    timezone: 'Region/City',
    searchTerms: ['search', 'terms', 'for', 'location']
  }
]
```

## Best Practices

1. **Always use real locations** when possible (ports, airports, cities)
2. **Add notes** to provide context for each update
3. **Verify coordinates** if manually entered
4. **Use status updates** to reflect actual asset status
5. **Regular updates** provide better tracking history

## Transit Statuses

For assets in transit without specific locations, use:
- "In Transit - Sea"
- "In Transit - Air"
- "In Transit - Road"
- "In Transit - Rail"
- "Customs Clearance"
- "Border Crossing"
- "Distribution Center"
- "Warehouse - Main"

## Future Enhancements

Potential additions:
- **Route planning** - Suggested routes between locations
- **ETA calculations** - Estimated time of arrival
- **Weather integration** - Real-time weather at locations
- **Port congestion data** - Live port status
- **Flight/vessel tracking** - Integration with real-time transport data
- **Map visualization** - Interactive map showing route
- **Geofencing** - Alerts when entering/leaving zones
- **More locations** - Expand database with smaller ports, warehouses, etc.

## Support

For issues or questions about the tracking system:
1. Check this documentation
2. Review the API reference (`API_QUICK_REFERENCE.md`)
3. Consult the system analysis (`SYSTEM_ANALYSIS.md`)
4. Contact the development team

---

**Version:** 2.0  
**Last Updated:** November 1, 2025  
**Author:** G1 Group Development Team

