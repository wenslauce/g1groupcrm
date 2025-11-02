# G1 Group CRM - API Quick Reference Guide

**Generated**: November 1, 2025  
**Base URL**: `/api`  
**Authentication**: Supabase JWT via cookies

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Clients API](#clients-api)
3. [Assets API](#assets-api)
4. [SKRs API](#skrs-api)
5. [Tracking API](#tracking-api)
6. [Invoices API](#invoices-api)
7. [Receipts API](#receipts-api)
8. [Credit Notes API](#credit-notes-api)
9. [Users API](#users-api)
10. [Notifications API](#notifications-api)
11. [Analytics API](#analytics-api)
12. [Search API](#search-api)
13. [Error Handling](#error-handling)
14. [Rate Limits](#rate-limits)

---

## Authentication

All endpoints require authentication via Supabase JWT in cookies (set automatically by Supabase client).

### User Roles
- `admin` - Full access
- `finance` - Financial operations & client management
- `operations` - Day-to-day operations & tracking
- `compliance` - Read-only access for compliance review
- `read_only` - View-only access

---

## Clients API

### GET `/api/clients`
**Access**: admin, finance, operations, compliance

**Query Parameters**:
```typescript
{
  page?: number         // Default: 1
  limit?: number        // Default: 10
  search?: string       // Search name/email
  type?: 'individual' | 'corporate' | 'institutional'
  risk_level?: 'low' | 'medium' | 'high'
  compliance_status?: 'pending' | 'approved' | 'rejected' | 'under_review'
  country?: string
}
```

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "type": "corporate",
      "email": "string",
      "phone": "string",
      "country": "string",
      "address": {
        "street": "string",
        "city": "string",
        "postal_code": "string"
      },
      "risk_level": "medium",
      "compliance_status": "approved",
      "kyc_documents": [],
      "created_at": "timestamp",
      "assets": [{ "count": 5 }],
      "skrs": [{ "count": 10 }],
      "invoices": [{ "count": 8 }]
    }
  ],
  "count": 100,
  "page": 1,
  "limit": 10,
  "total_pages": 10
}
```

### POST `/api/clients`
**Access**: admin, finance

**Body**:
```json
{
  "name": "string",
  "type": "individual" | "corporate" | "institutional",
  "email": "string",
  "phone": "string",
  "country": "string",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "postal_code": "string",
    "country": "string"
  },
  "risk_level": "low" | "medium" | "high"
}
```

### PUT `/api/clients/[id]`
**Access**: admin, finance

### DELETE `/api/clients/[id]`
**Access**: admin

---

## Assets API

### GET `/api/assets`
**Access**: admin, finance, operations, compliance

**Query Parameters**:
```typescript
{
  page?: number
  limit?: number
  search?: string       // Search name/type
  client_id?: string
  asset_type?: string
}
```

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "asset_name": "string",
      "asset_type": "string",
      "declared_value": 10000.00,
      "currency": "USD",
      "origin": "string",
      "destination": "string",
      "specifications": {},
      "created_at": "timestamp",
      "client": { "id": "uuid", "name": "string" },
      "skrs": [{ "count": 3 }]
    }
  ],
  "count": 50,
  "page": 1,
  "limit": 10,
  "total_pages": 5
}
```

### POST `/api/assets`
**Access**: admin, finance, operations

**Body**:
```json
{
  "client_id": "uuid",
  "asset_name": "string",
  "asset_type": "string",
  "declared_value": 10000.00,
  "currency": "USD",
  "origin": "string",
  "destination": "string",
  "specifications": {}
}
```

---

## SKRs API

### GET `/api/skrs`
**Access**: admin, finance, operations, compliance

**Query Parameters**:
```typescript
{
  page?: number
  limit?: number
  search?: string       // Search SKR number/remarks
  status?: 'draft' | 'approved' | 'issued' | 'in_transit' | 'delivered' | 'closed'
  client_id?: string
  asset_id?: string
  date_from?: string    // ISO 8601
  date_to?: string      // ISO 8601
}
```

**Response**:
```json
{
  "skrs": [
    {
      "id": "uuid",
      "skr_number": "G1-SKR-2025-00001",
      "client_id": "uuid",
      "client_name": "string",
      "asset_id": "uuid",
      "asset_description": "string",
      "status": "in_transit",
      "issue_date": "timestamp",
      "created_at": "timestamp",
      "hash": "string"
    }
  ],
  "stats": {
    "total": 100,
    "draft": 5,
    "approved": 10,
    "issued": 20,
    "in_transit": 30,
    "delivered": 25,
    "closed": 10
  },
  "count": 100,
  "page": 1,
  "limit": 10,
  "total_pages": 10
}
```

### POST `/api/skrs`
**Access**: admin, finance, operations

**Body**:
```json
{
  "client_id": "uuid",
  "asset_id": "uuid",
  "remarks": "string",
  "metadata": {}
}
```

**Note**: SKR number is auto-generated

### GET `/api/skrs/[id]`
**Access**: admin, finance, operations, compliance

**Response**:
```json
{
  "id": "uuid",
  "skr_number": "G1-SKR-2025-00001",
  "client": {
    "id": "uuid",
    "name": "string",
    "email": "string"
  },
  "asset": {
    "id": "uuid",
    "asset_name": "string",
    "declared_value": 10000.00
  },
  "status": "in_transit",
  "issue_date": "timestamp",
  "issued_by": "uuid",
  "hash": "string",
  "pdf_url": "string",
  "qr_code_url": "string",
  "remarks": "string",
  "metadata": {},
  "tracking": [
    {
      "id": "uuid",
      "current_location": "string",
      "status": "string",
      "last_update": "timestamp"
    }
  ],
  "invoices": []
}
```

### PUT `/api/skrs/[id]`
**Access**: admin, finance, operations

### DELETE `/api/skrs/[id]`
**Access**: admin

---

## Tracking API

### GET `/api/tracking`
**Access**: admin, finance, operations, compliance

**Query Parameters**:
```typescript
{
  page?: number
  limit?: number
  skr_id?: string
  location?: string     // Search location
}
```

### POST `/api/tracking`
**Access**: admin, finance, operations

**Body**:
```json
{
  "skr_id": "uuid",
  "location": "string",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "notes": "string",
  "metadata": {}
}
```

### GET `/api/skrs/[id]/tracking`
**Access**: admin, finance, operations, compliance

**Response**: Array of tracking records for specific SKR

---

## Invoices API

### GET `/api/invoices`
**Access**: admin, finance, operations, compliance

**Query Parameters**:
```typescript
{
  page?: number
  limit?: number
  search?: string       // Search invoice number
  status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  client_id?: string
  skr_id?: string
}
```

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "invoice_number": "G1-INV-202511-0001",
      "client_id": "uuid",
      "skr_id": "uuid",
      "amount": 5000.00,
      "currency": "USD",
      "issue_date": "timestamp",
      "due_date": "timestamp",
      "status": "sent",
      "clients": {
        "id": "uuid",
        "name": "string",
        "email": "string"
      },
      "skrs": {
        "id": "uuid",
        "skr_number": "string",
        "status": "issued",
        "assets": {
          "asset_name": "string"
        }
      },
      "receipts": []
    }
  ],
  "count": 63,
  "page": 1,
  "limit": 10,
  "total_pages": 7
}
```

### POST `/api/invoices`
**Access**: admin, finance

**Body**:
```json
{
  "client_id": "uuid",
  "skr_id": "uuid",           // Optional
  "amount": 5000.00,
  "currency": "USD",
  "due_date": "timestamp",    // Optional, defaults to 30 days
  "description": "string",
  "notes": "string",
  "metadata": {}
}
```

**Validation**:
- Client must have `compliance_status = 'approved'`
- If `skr_id` provided, must belong to the specified client
- Invoice number is auto-generated

### PUT `/api/invoices/[id]`
**Access**: admin, finance

### DELETE `/api/invoices/[id]`
**Access**: admin

---

## Receipts API

### GET `/api/receipts`
**Access**: admin, finance, operations, compliance

**Query Parameters**:
```typescript
{
  page?: number
  limit?: number
  search?: string       // Search receipt number/payment reference
  invoice_id?: string
}
```

### POST `/api/receipts`
**Access**: admin, finance

**Body**:
```json
{
  "invoice_id": "uuid",
  "amount": 2500.00,
  "payment_method": "string",
  "payment_reference": "string",
  "notes": "string"
}
```

**Validation**:
- Invoice must exist and not be `paid` or `cancelled`
- Amount cannot exceed remaining balance
- Auto-updates invoice to `paid` when fully paid
- Receipt number is auto-generated

---

## Credit Notes API

### GET `/api/credit-notes`
**Access**: admin, finance, operations, compliance

**Query Parameters**:
```typescript
{
  page?: number
  limit?: number
  search?: string       // Search credit note number/reason
  client_id?: string
  date_from?: string
  date_to?: string
}
```

### POST `/api/credit-notes`
**Access**: admin, finance

**Body**:
```json
{
  "invoice_id": "uuid",
  "client_id": "uuid",
  "amount": 1000.00,
  "currency": "USD",
  "reason": "return" | "discount" | "error" | "cancellation" | "other",
  "description": "string",
  "items": [
    {
      "description": "string",
      "quantity": 1,
      "unit_price": 1000.00,
      "total": 1000.00
    }
  ],
  "notes": "string",
  "metadata": {}
}
```

**Validation**:
- Invoice must exist and not be `cancelled`
- Currency must match invoice
- Amount cannot exceed maximum creditable amount
- Credit note number is auto-generated

---

## Users API

### GET `/api/users`
**Access**: admin only

**Query Parameters**:
```typescript
{
  page?: number
  limit?: number
  search?: string       // Search name/email
  role?: 'admin' | 'finance' | 'operations' | 'compliance' | 'read_only'
  status?: 'active' | 'inactive' | 'suspended'
}
```

### POST `/api/users`
**Access**: admin only

**Body**:
```json
{
  "email": "string",
  "password": "string",
  "name": "string",
  "role": "finance",
  "department": "string"
}
```

**Note**: Creates both auth user and profile in a transaction

### PUT `/api/users/[id]`
**Access**: admin only

### DELETE `/api/users/[id]`
**Access**: admin only

---

## Notifications API

### GET `/api/notifications`
**Access**: authenticated users (own notifications only)

**Query Parameters**:
```typescript
{
  channel?: 'email' | 'sms' | 'in_app' | 'push'
  status?: 'pending' | 'sent' | 'delivered' | 'failed' | 'read'
  unread_only?: boolean     // Default: false
  limit?: number            // Default: 20, Max: 100
  offset?: number           // Default: 0
}
```

**Response**:
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "skr_created",
      "channel": "in_app",
      "priority": "medium",
      "status": "delivered",
      "subject": "string",
      "message": "string",
      "data": {},
      "created_at": "timestamp",
      "read_at": null
    }
  ],
  "total": 50,
  "limit": 20,
  "offset": 0,
  "has_more": true
}
```

### POST `/api/notifications`
**Access**: authenticated users

**Body**:
```json
{
  "user_id": "uuid",              // Optional, defaults to current user
  "type": "custom",
  "priority": "medium",
  "subject": "string",
  "message": "string",
  "data": {},
  "scheduled_at": "timestamp"     // Optional
}
```

**Note**: Currently restricted to sending to self only

### PUT `/api/notifications/[id]`
**Access**: authenticated users (own notifications only)

**Body**:
```json
{
  "status": "read"
}
```

### GET `/api/notifications/preferences`
**Access**: authenticated users (own preferences only)

### PUT `/api/notifications/preferences`
**Access**: authenticated users (own preferences only)

---

## Analytics API

### GET `/api/analytics/overview`
**Access**: authenticated users

**Query Parameters**:
```typescript
{
  timeframe?: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom'
  start_date?: string     // For custom timeframe
  end_date?: string       // For custom timeframe
}
```

**Response**:
```json
{
  "summary": {
    "total_clients": 23,
    "new_clients": 5,
    "compliant_clients": 18,
    "compliance_rate": 78.26,
    "total_skrs": 53,
    "issued_skrs": 20,
    "in_transit_skrs": 25,
    "delivered_skrs": 5,
    "total_invoices": 63,
    "paid_invoices": 30,
    "overdue_invoices": 10,
    "total_revenue": 315000.00,
    "collected_revenue": 200000.00,
    "collection_rate": 63.49
  },
  "growth": {
    "client_growth": 15.5,
    "skr_growth": 20.3,
    "revenue_growth": -5.2
  },
  "distributions": {
    "client_status": {
      "pending": 2,
      "approved": 18,
      "rejected": 1,
      "under_review": 2
    },
    "skr_status": {
      "draft": 3,
      "approved": 5,
      "issued": 10,
      "in_transit": 20,
      "delivered": 10,
      "closed": 5
    },
    "invoice_status": {
      "draft": 10,
      "sent": 20,
      "paid": 25,
      "overdue": 8
    },
    "risk_levels": {
      "low": 10,
      "medium": 10,
      "high": 3
    },
    "client_types": {
      "individual": 8,
      "corporate": 12,
      "institutional": 3
    }
  },
  "time_series": [
    {
      "date": "2025-10-01",
      "clients": 2,
      "skrs": 5,
      "invoices": 8,
      "revenue": 40000.00
    }
  ],
  "recent_activity": [
    {
      "id": "uuid",
      "action": "CREATE",
      "timestamp": "timestamp"
    }
  ],
  "timeframe": "month",
  "date_range": {
    "start": "2025-10-01",
    "end": "2025-10-31"
  },
  "generated_at": "timestamp"
}
```

### GET `/api/analytics/financial`
**Access**: admin, finance

**Response**: Financial metrics (revenue, outstanding, collection rates)

### GET `/api/analytics/compliance`
**Access**: admin, compliance

**Response**: Compliance metrics (client status, risk distribution, KYC tracking)

### GET `/api/analytics/skrs`
**Access**: admin, finance, operations

**Response**: SKR metrics (status distribution, transit times, delivery performance)

---

## Search API

### GET `/api/search/global`
**Access**: authenticated users (based on role permissions)

**Query Parameters**:
```typescript
{
  q: string               // Search query
  types?: string[]        // Filter by types: client, skr, invoice, asset
  limit?: number          // Default: 20
  offset?: number         // Default: 0
}
```

**Response**:
```json
{
  "results": [
    {
      "id": "uuid",
      "type": "client",
      "title": "string",
      "description": "string",
      "url": "string",
      "metadata": {}
    }
  ],
  "total": 50,
  "limit": 20,
  "offset": 0
}
```

---

## Error Handling

### Error Response Format
```json
{
  "error": "string",
  "details": []           // Optional, for validation errors
}
```

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | OK | Successful GET/PUT request |
| 201 | Created | Successful POST request |
| 400 | Bad Request | Validation error, invalid data |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate data (e.g., email already exists) |
| 422 | Unprocessable Entity | Business logic error |
| 500 | Internal Server Error | Server-side error |

### Common Error Messages

**Authentication Errors**:
```json
{ "error": "Unauthorized" }
{ "error": "Insufficient permissions" }
```

**Validation Errors**:
```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```

**Business Logic Errors**:
```json
{ "error": "Client not found" }
{ "error": "Asset does not belong to the specified client" }
{ "error": "Client must have approved compliance status" }
{ "error": "Payment amount exceeds remaining balance" }
{ "error": "Cannot add payment to paid invoice" }
```

---

## Rate Limits

**Not currently implemented**, but recommended limits:

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| GET requests | 100 | per minute |
| POST/PUT/DELETE | 30 | per minute |
| Authentication | 10 | per minute |
| Search | 50 | per minute |

---

## Pagination

### Standard Pagination
All list endpoints support pagination:

```typescript
{
  page: number      // 1-indexed
  limit: number     // Items per page
}
```

Response includes:
```json
{
  "data": [],
  "count": 100,       // Total items
  "page": 1,          // Current page
  "limit": 10,        // Items per page
  "total_pages": 10   // Total pages
}
```

### Cursor-Based Pagination
For real-time data (notifications):

```typescript
{
  limit: number
  offset: number
}
```

Response includes:
```json
{
  "data": [],
  "total": 50,
  "limit": 20,
  "offset": 0,
  "has_more": true
}
```

---

## Sorting

Most endpoints sort by `created_at DESC` by default.

Future enhancement: Add `sort` and `order` query parameters:
```typescript
{
  sort?: 'created_at' | 'updated_at' | 'name' | 'amount'
  order?: 'asc' | 'desc'
}
```

---

## Filtering

### Date Range Filtering
```typescript
{
  date_from?: string    // ISO 8601 format
  date_to?: string      // ISO 8601 format
}
```

### Status Filtering
```typescript
{
  status?: 'draft' | 'sent' | 'paid' | ...
}
```

### Search Filtering
```typescript
{
  search?: string       // Searches across relevant fields
}
```

---

## WebHooks (Future)

Not yet implemented, but planned:

### Events
- `client.created`
- `client.updated`
- `client.compliance_approved`
- `skr.created`
- `skr.status_changed`
- `skr.delivered`
- `invoice.created`
- `invoice.sent`
- `invoice.paid`
- `invoice.overdue`
- `payment.received`

---

## SDK Examples

### JavaScript/TypeScript (with Supabase Client)

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Fetch clients
const { data, error } = await fetch('/api/clients?page=1&limit=10')
  .then(res => res.json())

// Create client
const { data, error } = await fetch('/api/clients', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Acme Corp',
    type: 'corporate',
    email: 'info@acme.com',
    country: 'USA'
  })
}).then(res => res.json())

// Create SKR
const { data, error } = await fetch('/api/skrs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_id: 'uuid',
    asset_id: 'uuid',
    remarks: 'Urgent shipment'
  })
}).then(res => res.json())

// Get analytics
const { data, error } = await fetch('/api/analytics/overview?timeframe=month')
  .then(res => res.json())
```

---

## Testing

### Example cURL Commands

**Get clients**:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://your-domain.com/api/clients?page=1&limit=10
```

**Create client**:
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Corp","type":"corporate","email":"test@example.com","country":"USA"}' \
  https://your-domain.com/api/clients
```

**Create SKR**:
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"client_id":"uuid","asset_id":"uuid","remarks":"Test SKR"}' \
  https://your-domain.com/api/skrs
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-01 | Initial API release |

---

## Support

For API issues or questions:
- **Technical Support**: dev@g1groupofcompanies.com
- **Documentation**: https://docs.g1groupofcompanies.com
- **Status Page**: https://status.g1groupofcompanies.com

---

**Last Updated**: November 1, 2025  
**API Version**: 1.0  
**Documentation Format**: Markdown

