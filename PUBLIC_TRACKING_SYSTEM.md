# Public SKR Verification & Tracking System

## Overview

A comprehensive public-facing system that allows anyone (without authentication) to verify SKR authenticity and track asset movements in real-time.

## 🌐 Public URLs

### Main Tracking Page
```
/verify
```
Landing page where users can input their SKR number to begin tracking.

### SKR Details & Tracking
```
/verify/skr/[skrNumber]
```
Complete verification and tracking information for a specific SKR.

**Example:**
- `https://yourdomain.com/verify/skr/SKR-2024-001`

## 📱 Features

### 1. Landing Page (`/verify`)

**Location:** `src/app/verify/page.tsx`

Features:
- ✅ Clean, professional interface with G1 Holding branding
- ✅ Large search input for SKR number entry
- ✅ Real-time search as you type (converts to uppercase)
- ✅ Feature showcase cards explaining the system
- ✅ Educational "What is an SKR?" section
- ✅ Support contact information
- ✅ Mobile responsive design

User Flow:
1. User lands on `/verify`
2. Enters SKR number (e.g., `SKR-2024-001`)
3. Clicks "Track & Verify SKR"
4. Redirected to `/verify/skr/SKR-2024-001`

### 2. Verification & Tracking Page (`/verify/skr/[skrNumber]`)

**Location:** `src/app/verify/skr/[skrNumber]/page.tsx`

Features three main tabs:

#### **Tab 1: Verification**
- ✅ SKR authenticity verification
- ✅ Valid/Invalid status display
- ✅ SKR basic information (status, issue date)
- ✅ Client information (name, country)
- ✅ Asset information (name, type, value)
- ✅ Digital hash verification (optional)
- ✅ Verification timestamp

#### **Tab 2: Tracking**
- ✅ Current shipment status
- ✅ Tracking number display
- ✅ Current location and country
- ✅ Estimated/actual delivery dates
- ✅ Status badges with color coding
- ✅ Additional notes and updates
- ✅ Last updated timestamp

#### **Tab 3: History**
- ✅ Complete timeline of all events
- ✅ Event types (picked up, in transit, customs, delivered, etc.)
- ✅ Event descriptions
- ✅ Location information for each event
- ✅ Timestamps for all events
- ✅ Visual timeline with icons
- ✅ "Latest" badge on most recent event

## 🔌 API Endpoints

### 1. SKR Verification API

**Endpoint:** `/api/verify/skr/[skrNumber]`  
**Location:** `src/app/api/verify/skr/[skrNumber]/route.ts`  
**Method:** `GET`  
**Authentication:** None (Public)

**Query Parameters:**
- `hash` (optional): Digital hash for verification

**Response:**
```json
{
  "valid": true,
  "skr_number": "SKR-2024-001",
  "status": "in_transit",
  "issue_date": "2024-01-15T10:00:00Z",
  "hash_valid": true,
  "verification_time": "2024-01-20T15:30:00Z",
  "client": {
    "name": "ABC Corporation",
    "country": "United States"
  },
  "asset": {
    "name": "Gold Bars",
    "type": "Precious Metals",
    "declared_value": 1000000,
    "currency": "USD"
  },
  "hash_provided": true,
  "hash_available": true
}
```

**Features:**
- ✅ CORS enabled (`Access-Control-Allow-Origin: *`)
- ✅ Caching (5 minutes)
- ✅ Only shows public information
- ✅ Validates SKR status
- ✅ Optional hash verification

### 2. Tracking Information API

**Endpoint:** `/api/verify/tracking/[skrNumber]`  
**Location:** `src/app/api/verify/tracking/[skrNumber]/route.ts`  
**Method:** `GET`  
**Authentication:** None (Public)

**Response:**
```json
{
  "success": true,
  "skr_number": "SKR-2024-001",
  "skr_status": "in_transit",
  "tracking": [
    {
      "id": "uuid",
      "tracking_number": "TRK-2024-001",
      "status": "in_transit",
      "current_location": "Los Angeles, CA",
      "current_country": "United States",
      "estimated_delivery": "2024-01-25T10:00:00Z",
      "actual_delivery": null,
      "notes": "Package cleared customs",
      "updated_at": "2024-01-20T14:00:00Z"
    }
  ],
  "events": [
    {
      "id": "uuid",
      "event_type": "picked_up",
      "event_date": "2024-01-15T08:00:00Z",
      "location": "New York, NY",
      "country": "United States",
      "description": "Package picked up from origin",
      "created_at": "2024-01-15T08:05:00Z"
    },
    {
      "event_type": "in_transit",
      "event_date": "2024-01-18T12:00:00Z",
      "location": "Chicago, IL",
      "country": "United States",
      "description": "Package in transit to destination",
      "created_at": "2024-01-18T12:10:00Z"
    }
  ],
  "last_updated": "2024-01-20T15:30:00Z"
}
```

**Features:**
- ✅ CORS enabled
- ✅ Caching (1 minute)
- ✅ Returns all tracking records for the SKR
- ✅ Returns complete event history
- ✅ Ordered by most recent first

## 🎨 UI Components

### Status Color Coding

```typescript
issued: Yellow (bg-yellow-100 text-yellow-800)
in_transit: Orange (bg-orange-100 text-orange-800)
delivered: Green (bg-green-100 text-green-800)
closed: Purple (bg-purple-100 text-purple-800)
pending: Gray (bg-gray-100 text-gray-800)
```

### Event Type Icons

- `picked_up` → Package icon
- `in_transit` → Truck icon
- `customs` → Shield icon
- `delivered` → CheckCircle icon
- `location_update` → MapPin icon
- Default → Navigation icon

## 🔒 Security Features

### Public Access Control

1. **No Authentication Required**
   - Anyone can access verification pages
   - No login or account needed

2. **Limited Information Exposure**
   - Only public/non-sensitive information shown
   - No internal IDs or sensitive client data
   - No financial transaction details

3. **Rate Limiting Ready**
   - API endpoints use caching to reduce load
   - Can easily add rate limiting middleware

4. **CORS Configuration**
   - Allows cross-origin requests
   - Enables embedding in other sites if needed

### Data Privacy

**Shown Publicly:**
- ✅ SKR number
- ✅ SKR status
- ✅ Basic client name and country
- ✅ Asset type and declared value
- ✅ Tracking location and status
- ✅ Event history

**NOT Shown:**
- ❌ Internal database IDs
- ❌ Client contact information
- ❌ Detailed financial information
- ❌ Internal notes/comments
- ❌ User information
- ❌ Complete asset serial numbers

## 🚀 Usage Examples

### For Clients

1. **Basic Tracking**
   ```
   1. Visit: https://yourdomain.com/verify
   2. Enter SKR number: SKR-2024-001
   3. Click "Track & Verify SKR"
   4. View verification status
   5. Switch to "Tracking" tab for location
   6. Switch to "History" tab for timeline
   ```

2. **Direct Link Access**
   ```
   Share direct link: https://yourdomain.com/verify/skr/SKR-2024-001
   ```

3. **Hash Verification**
   ```
   1. Go to SKR detail page
   2. Click "Verify Digital Hash" button
   3. Enter hash from original document
   4. Click "Verify Hash"
   5. See if document is authentic
   ```

### For Third Parties

**API Integration Example:**
```javascript
// Verify an SKR
const response = await fetch(
  'https://yourdomain.com/api/verify/skr/SKR-2024-001'
)
const verification = await response.json()

if (verification.valid) {
  console.log('SKR is valid')
  console.log('Status:', verification.status)
}

// Get tracking info
const trackingResponse = await fetch(
  'https://yourdomain.com/api/verify/tracking/SKR-2024-001'
)
const tracking = await trackingResponse.json()

console.log('Current location:', tracking.tracking[0]?.current_location)
console.log('Events:', tracking.events)
```

## 📄 PDF Integration

The PDF generator includes verification links:

**Location:** `src/lib/pdf-generator-simple.ts`

```typescript
doc.text(
  `For verification, visit: https://verify.g1group.com/skr/${skr.skr_number}`,
  105, 285,
  { align: 'center' }
)
```

This link is printed on every SKR PDF document, allowing recipients to easily verify authenticity.

## 🔄 Data Flow

```
User Input
    ↓
/verify page (Search)
    ↓
/verify/skr/[skrNumber] (Display)
    ↓
Parallel API Calls:
    ├→ /api/verify/skr/[skrNumber] (Verification data)
    └→ /api/verify/tracking/[skrNumber] (Tracking data)
    ↓
Display in Tabs:
    ├→ Verification Tab (SKR details)
    ├→ Tracking Tab (Current status)
    └→ History Tab (Event timeline)
```

## 🛠️ Technical Stack

- **Framework:** Next.js 14 (App Router)
- **UI Components:** shadcn/ui
- **Icons:** lucide-react
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS
- **Type Safety:** TypeScript

## 📱 Mobile Responsiveness

All pages are fully responsive:
- ✅ Touch-friendly buttons
- ✅ Readable on small screens
- ✅ Grid layouts adapt to screen size
- ✅ Font sizes scale appropriately

## 🔍 SEO & Accessibility

- ✅ Semantic HTML structure
- ✅ Descriptive headings
- ✅ Alt text for icons
- ✅ ARIA labels where needed
- ✅ Keyboard navigation support
- ✅ Color contrast compliance

## 🎯 Future Enhancements

Potential additions:
1. QR code scanning for SKR numbers
2. Email/SMS notifications for tracking updates
3. Multi-language support
4. Download tracking report as PDF
5. Real-time websocket updates
6. Map visualization of tracking route
7. Estimated delivery calculator
8. Subscription to tracking updates

## 📞 Support

For questions about public tracking:
- Email: verify@g1holding.com
- Support: support@g1holding.com

---

**System Status:** ✅ Production Ready  
**Last Updated:** November 2, 2024  
**Version:** 1.0.0

