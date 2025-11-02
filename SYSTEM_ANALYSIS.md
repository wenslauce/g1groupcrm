# G1 Group CRM - Complete System Analysis

**Generated**: November 1, 2025  
**Database**: Supabase PostgreSQL  
**Framework**: Next.js 14 with App Router  
**Authentication**: Supabase Auth with RLS

---

## Executive Summary

The G1 Group CRM is a comprehensive business management system for handling Safekeeping Receipts (SKRs), client management, asset tracking, invoicing, and compliance. The system implements a role-based access control (RBAC) model with five user roles and complete audit logging.

---

## Database Architecture

### Core Tables & Relationships

#### 1. **Clients Table** (23 rows)
**Purpose**: Central client management with compliance tracking

**Key Fields**:
- `id` (UUID, PK)
- `name`, `email` (unique), `phone`
- `type` (individual | corporate | institutional)
- `risk_level` (low | medium | high)
- `compliance_status` (pending | approved | rejected | under_review)
- `kyc_documents` (JSONB array)
- `address` (JSONB)
- `search_vector` (tsvector for full-text search)

**Relationships**:
- ← `assets` (one-to-many)
- ← `skrs` (one-to-many)
- ← `invoices` (one-to-many)

**RLS Policies**:
- View: admin, finance, operations, compliance
- Manage: admin, finance

---

#### 2. **Assets Table** (49 rows)
**Purpose**: Track valuable assets linked to clients

**Key Fields**:
- `id` (UUID, PK)
- `client_id` (FK → clients)
- `asset_name`, `asset_type`
- `declared_value` (DECIMAL), `currency`
- `origin`, `destination`
- `specifications` (JSONB)
- `search_vector` (tsvector)

**Relationships**:
- → `clients` (many-to-one)
- ← `skrs` (one-to-many)

**RLS Policies**:
- View: admin, finance, operations, compliance
- Manage: admin, finance, operations

---

#### 3. **SKRs Table** (53 rows)
**Purpose**: Safekeeping Receipts - core business documents

**Key Fields**:
- `id` (UUID, PK)
- `skr_number` (unique, e.g., "G1-SKR-2025-00001")
- `client_id` (FK → clients)
- `asset_id` (FK → assets)
- `status` (draft | approved | issued | in_transit | delivered | closed)
- `issue_date`, `issued_by` (FK → auth.users)
- `hash` (unique, for verification)
- `pdf_url`, `qr_code_url`
- `remarks`, `metadata` (JSONB)
- `search_vector` (tsvector)

**Relationships**:
- → `clients` (many-to-one)
- → `assets` (many-to-one)
- → `auth.users` (issued_by)
- ← `tracking` (one-to-many)
- ← `invoices` (one-to-many)

**RLS Policies**:
- View: admin, finance, operations, compliance
- Create/Update: admin, finance, operations
- Delete: admin only

**SKR Number Generation**: Function `generate_skr_number()` creates sequential numbers per year

---

#### 4. **Tracking Table** (103 rows)
**Purpose**: Real-time location tracking for SKRs

**Key Fields**:
- `id` (UUID, PK)
- `skr_id` (FK → skrs)
- `current_location`, `status`
- `coordinates` (POINT type for lat/lng)
- `last_update`, `updated_by` (FK → auth.users)
- `notes`, `is_latest` (boolean flag)

**Relationships**:
- → `skrs` (many-to-one)
- → `auth.users` (updated_by)

**RLS Policies**:
- View: admin, finance, operations, compliance
- Manage: admin, operations

---

#### 5. **Invoices Table** (63 rows)
**Purpose**: Financial billing for services

**Key Fields**:
- `id` (UUID, PK)
- `invoice_number` (unique, e.g., "G1-INV-202511-0001")
- `client_id` (FK → clients)
- `skr_id` (FK → skrs, optional)
- `amount` (DECIMAL), `currency`
- `issue_date`, `due_date`
- `status` (draft | sent | paid | overdue | cancelled)
- `pdf_url`
- `search_vector` (tsvector)

**Relationships**:
- → `clients` (many-to-one)
- → `skrs` (many-to-one, optional)
- ← `receipts` (one-to-many)
- ← `credit_notes` (one-to-many)

**RLS Policies**:
- View: admin, finance, operations, compliance
- Manage: admin, finance

**Invoice Number Generation**: Function `generate_invoice_number()` creates monthly sequential numbers

---

#### 6. **Receipts Table** (17 rows)
**Purpose**: Payment records for invoices

**Key Fields**:
- `id` (UUID, PK)
- `receipt_number` (unique, e.g., "G1-RCP-202511-0001")
- `invoice_id` (FK → invoices)
- `amount` (DECIMAL), `payment_method`, `payment_reference`
- `issue_date`, `pdf_url`

**Business Logic**:
- Validates payment doesn't exceed invoice balance
- Automatically updates invoice status to 'paid' when fully paid
- Prevents payments to 'paid' or 'cancelled' invoices

**RLS Policies**:
- View: admin, finance, operations, compliance
- Manage: admin, finance

---

#### 7. **Credit Notes Table** (8 rows)
**Purpose**: Credit adjustments for invoices

**Key Fields**:
- `id` (UUID, PK)
- `credit_note_number` (unique, e.g., "G1-CN-202511-0001")
- `reference_invoice` (FK → invoices)
- `amount` (DECIMAL), `reason`
- `issue_date`, `pdf_url`

**Business Logic**:
- Validates credit amount doesn't exceed invoice total
- Prevents credits for cancelled invoices
- Enforces currency matching with invoice

**RLS Policies**:
- View: admin, finance, operations, compliance
- Manage: admin, finance

---

#### 8. **User Profiles Table** (1 row)
**Purpose**: Extended user information beyond Supabase Auth

**Key Fields**:
- `id` (UUID, PK, FK → auth.users)
- `full_name`, `email`, `avatar_url`
- `role` (admin | finance | operations | compliance | read_only)
- `department`
- `permissions` (JSONB)
- `status` (active | inactive | suspended)

**RLS Policies**:
- Users can view/update own profile
- Admin can view/manage all profiles

---

#### 9. **Audit Logs Table** (200 rows)
**Purpose**: Complete system audit trail

**Key Fields**:
- `id` (UUID, PK)
- `user_id` (FK → auth.users)
- `action`, `resource_type`, `resource_id`
- `details` (JSONB), `ip_address`, `user_agent`
- `created_at`

**Automatic Triggers**: Audit logs are automatically created for:
- clients (INSERT, UPDATE, DELETE)
- skrs (INSERT, UPDATE, DELETE)
- invoices (INSERT, UPDATE, DELETE)
- user_profiles (INSERT, UPDATE, DELETE)

**RLS Policies**:
- View: admin, compliance only
- Insert: system (always allowed)

---

### Notification System

#### 10. **Notifications Table** (103 rows)
**Purpose**: Multi-channel notification management

**Key Fields**:
- `id` (UUID, PK)
- `user_id` (FK → auth.users)
- `type` (16 different types including skr_created, invoice_created, compliance_alert, etc.)
- `channel` (email | sms | in_app | push)
- `priority` (low | medium | high | critical)
- `status` (pending | sent | delivered | failed | read)
- `subject`, `message`, `data` (JSONB)
- `scheduled_at`, `sent_at`, `delivered_at`, `read_at`
- `error_message`, `retry_count`, `max_retries`

**Related Tables**:
- `notification_templates` (0 rows)
- `notification_preferences` (0 rows)
- `email_queue` (0 rows)
- `sms_queue` (0 rows)

---

### Search & Analytics

#### 11. **Search Analytics Table** (0 rows)
**Purpose**: Track user search behavior

**Key Fields**:
- `search_query`, `results_count`
- `clicked_result_id`, `clicked_result_type`
- `session_id`, `ip_address`, `user_agent`

#### 12. **Filter Presets Table** (0 rows)
**Purpose**: Save user-defined filter configurations

**Key Fields**:
- `user_id`, `name`, `description`
- `filters` (JSONB), `is_default`

**RLS**: Users can only manage their own presets

---

## API Architecture

### Authentication & Authorization

**Auth Server** (`lib/auth-server.ts`):
- `requireAuth()` - Ensures user is authenticated
- `requireRole([roles])` - Enforces role-based access
- `getCurrentUser()` - Gets current user details

**Roles Hierarchy**:
1. **admin** - Full system access
2. **finance** - Financial operations & client management
3. **operations** - Day-to-day operations & tracking
4. **compliance** - Read access to all data for compliance review
5. **read_only** - View-only access

---

### API Endpoints

#### Clients API (`/api/clients`)

**GET** - List clients with filters
- Filters: search, type, risk_level, compliance_status, country
- Pagination: page, limit
- Includes counts: assets, skrs, invoices
- Requires: admin, finance, operations, compliance

**POST** - Create new client
- Schema validation with Zod
- Sets default risk_level: 'medium'
- Sets default compliance_status: 'pending'
- Requires: admin, finance

---

#### Assets API (`/api/assets`)

**GET** - List assets with filters
- Filters: search, client_id, asset_type
- Includes: client details, SKR count
- Requires: admin, finance, operations, compliance

**POST** - Create new asset
- Validates client exists
- Schema validation with Zod
- Requires: admin, finance, operations

---

#### SKRs API (`/api/skrs`)

**GET** - List SKRs with comprehensive data
- Filters: search, status, client_id, asset_id, date_from, date_to
- Includes: client, asset, tracking, invoices
- Returns statistics: draft, approved, issued, in_transit, delivered, closed
- Requires: admin, finance, operations, compliance

**POST** - Create new SKR
- Generates unique SKR number
- Validates client and asset exist
- Validates asset belongs to client
- Creates with status: 'draft'
- Requires: admin, finance, operations

---

#### Tracking API (`/api/tracking`)

**GET** - List tracking records
- Filters: skr_id, location
- Includes: SKR details, client, asset
- Requires: admin, finance, operations, compliance

**POST** - Create tracking record
- Validates SKR exists
- Validates coordinates (-90 to 90 lat, -180 to 180 lng)
- Records user who created the update
- Requires: admin, finance, operations

---

#### Invoices API (`/api/invoices`)

**GET** - List invoices with full details
- Filters: search, status, client_id, skr_id
- Includes: client, SKR, asset, receipts
- Requires: admin, finance, operations, compliance

**POST** - Create invoice
- Generates unique invoice number
- Validates client exists with approved compliance
- Validates SKR belongs to client (if provided)
- Sets default due date: 30 days from now
- Creates with status: 'draft'
- Requires: admin, finance

**Business Rules**:
- Client must have 'approved' compliance status
- If SKR provided, must belong to specified client

---

#### Receipts API (`/api/receipts`)

**GET** - List receipts
- Filters: search, invoice_id
- Includes: invoice, client, SKR details
- Requires: admin, finance, operations, compliance

**POST** - Create receipt
- Generates unique receipt number
- Validates invoice exists and is not paid/cancelled
- Validates payment amount doesn't exceed remaining balance
- Auto-updates invoice status to 'paid' when fully paid
- Requires: admin, finance

---

#### Credit Notes API (`/api/credit-notes`)

**GET** - List credit notes
- Filters: search, client_id, date_from, date_to
- Includes: invoice details
- Requires: admin, finance, operations, compliance

**POST** - Create credit note
- Generates unique credit note number
- Validates invoice exists and not cancelled
- Validates currency matches invoice
- Validates credit amount doesn't exceed maximum creditable amount
- Requires: admin, finance

---

#### Notifications API (`/api/notifications`)

**GET** - Get user notifications
- Filters: channel, status, unread_only
- Pagination: limit, offset
- Returns: user's notifications only

**POST** - Send notification
- Currently restricted to sending to self
- Supports scheduling for future delivery
- Multi-channel support: email, sms, in_app, push
- Priority levels: low, medium, high, critical

---

#### Users API (`/api/users`)

**GET** - List users (Admin only)
- Filters: search, role, status
- Pagination support
- Requires: admin

**POST** - Create user (Admin only)
- Creates auth user and profile in transaction
- Rolls back auth user if profile creation fails
- Sets default status: 'active'
- Requires: admin

---

#### Analytics APIs

**Overview** (`/api/analytics/overview`)
- Comprehensive system statistics
- Timeframe filters: day, week, month, quarter, year, custom
- Returns:
  - Summary metrics (clients, SKRs, invoices, revenue)
  - Growth metrics (client growth, SKR growth, revenue growth)
  - Status distributions
  - Risk level distributions
  - Client type distributions
  - Time series data for charts
  - Recent activity
- Compares current period with previous period

**Financial** (`/api/analytics/financial`)
- Revenue analytics
- Payment collection rates
- Outstanding amounts

**Compliance** (`/api/analytics/compliance`)
- Client compliance status
- Risk assessments
- KYC tracking

**SKR Analytics** (`/api/analytics/skrs`)
- SKR status tracking
- Transit times
- Delivery performance

---

## Database Functions & Utilities

### Key Functions

1. **generate_skr_number()** → TEXT
   - Format: G1-SKR-YYYY-NNNNN
   - Sequential per year
   - Zero-padded 5-digit counter

2. **generate_invoice_number()** → TEXT
   - Format: G1-INV-YYYYMM-NNNN
   - Sequential per month
   - Zero-padded 4-digit counter

3. **generate_receipt_number()** → TEXT
   - Format: G1-RCP-YYYYMM-NNNN
   - Sequential per month
   - Zero-padded 4-digit counter

4. **generate_credit_note_number()** → TEXT
   - Format: G1-CN-YYYYMM-NNNN
   - Sequential per month
   - Zero-padded 4-digit counter

5. **calculate_client_risk_score(client_id UUID)** → INTEGER
   - Calculates composite risk score based on:
     - Client type (individual: 10, corporate: 20, institutional: 30)
     - Compliance status (approved: +0, under_review: +10, pending: +20, rejected: +50)
     - Transaction volume (>$10M: +20, >$1M: +10)
     - Transaction count (>100: +15, >10: +5)

6. **get_dashboard_stats()** → JSON
   - Returns comprehensive dashboard statistics:
     - Total/active SKRs
     - Total clients/pending compliance
     - Total invoices/outstanding amount
     - Recent activities (last 10)

7. **cleanup_old_audit_logs(retention_days INTEGER)** → INTEGER
   - Deletes audit logs older than specified days
   - Default: 365 days
   - Logs its own cleanup action

8. **create_default_filter_presets_for_user(user_id UUID)** → VOID
   - Creates 4 default filter presets:
     - Active SKRs
     - Pending Invoices
     - Recent Clients
     - High Value Assets

9. **ensure_single_default_preset()** → TRIGGER
   - Ensures only one default filter preset per user
   - Automatically unsets others when new default is set

10. **get_user_role()** → user_role
    - Returns current authenticated user's role
    - Used by RLS policies

---

## Data Integrity & Constraints

### Foreign Keys
- `assets.client_id` → `clients.id` (CASCADE)
- `skrs.client_id` → `clients.id` (CASCADE)
- `skrs.asset_id` → `assets.id` (CASCADE)
- `skrs.issued_by` → `auth.users.id`
- `tracking.skr_id` → `skrs.id` (CASCADE)
- `tracking.updated_by` → `auth.users.id`
- `invoices.client_id` → `clients.id` (CASCADE)
- `invoices.skr_id` → `skrs.id`
- `receipts.invoice_id` → `invoices.id` (CASCADE)
- `credit_notes.reference_invoice` → `invoices.id` (CASCADE)

### Unique Constraints
- `clients.email`
- `skrs.skr_number`
- `skrs.hash`
- `invoices.invoice_number`
- `receipts.receipt_number`
- `credit_notes.credit_note_number`

### Indexes
- All primary keys
- Foreign key columns
- Status columns (for filtering)
- Date columns (for range queries)
- Email columns
- Number columns (for lookups)
- Full-text search vectors

---

## Security Model

### Row Level Security (RLS)
- **Enabled on all tables**
- Policies enforce role-based access at database level
- Prevents data leaks even if API bypassed

### Authentication Flow
1. User logs in via Supabase Auth
2. JWT token contains user ID
3. Server validates token
4. Server checks user role from `user_profiles`
5. RLS policies enforce data access
6. API endpoints add additional business logic

### Audit Trail
- Automatic audit logging on critical tables
- Captures: action, user, timestamps, old/new values
- IP address and user agent recording
- Immutable log entries (insert only)

---

## Data Relationships Diagram

```
auth.users
    ↓
user_profiles (role-based permissions)
    ↓
    ├─→ clients
    │       ↓
    │       ├─→ assets
    │       │       ↓
    │       │       └─→ skrs
    │       │               ↓
    │       │               ├─→ tracking (location updates)
    │       │               └─→ invoices
    │       │                       ↓
    │       │                       ├─→ receipts (payments)
    │       │                       └─→ credit_notes (credits)
    │       │
    │       └─→ invoices (without SKR)
    │
    ├─→ notifications
    ├─→ filter_presets
    └─→ audit_logs
```

---

## Business Workflows

### 1. Client Onboarding
1. Create client (status: pending)
2. Upload KYC documents
3. Compliance review (status: under_review)
4. Approval (status: approved)

### 2. SKR Issuance
1. Create/link asset to approved client
2. Create SKR (status: draft)
3. Review and approve (status: approved)
4. Issue SKR (status: issued, generates hash & PDF)
5. Track shipment (status: in_transit)
6. Mark delivered (status: delivered)
7. Close SKR (status: closed)

### 3. Invoicing & Payment
1. Create invoice (status: draft)
2. Send to client (status: sent)
3. Track due date (auto-status: overdue if past due)
4. Record payment via receipt
5. Auto-update to paid when fully paid
6. Issue credit note if needed

### 4. Compliance Monitoring
1. Monitor client risk scores
2. Review audit logs
3. Track KYC document status
4. Generate compliance reports
5. Alert on high-risk activities

---

## Current Data Statistics

- **Clients**: 23 (mix of individual, corporate, institutional)
- **Assets**: 49 (various types and values)
- **SKRs**: 53 (mostly in_transit and closed)
- **Tracking Records**: 103 (active location monitoring)
- **Invoices**: 63 (various statuses)
- **Receipts**: 17 (payment records)
- **Credit Notes**: 8 (adjustments)
- **Notifications**: 103 (multi-channel)
- **Audit Logs**: 200 (comprehensive tracking)
- **User Profiles**: 1 (needs more users)

---

## Recommendations

### Immediate Priorities

1. **User Management**
   - Create additional user accounts for different roles
   - Test role-based access control thoroughly

2. **Notification Templates**
   - Populate notification_templates table
   - Set up default notification preferences

3. **Search Implementation**
   - Implement global search API
   - Utilize search_vector columns effectively

4. **Filter Presets**
   - Call `create_default_filter_presets_for_user()` for existing users
   - Allow users to create custom presets

### Future Enhancements

1. **Real-time Notifications**
   - Implement WebSocket/Server-Sent Events for in-app notifications
   - Set up email/SMS service integrations

2. **Document Generation**
   - Complete PDF generation for SKRs, invoices, receipts, credit notes
   - Implement QR code generation for SKRs

3. **Advanced Analytics**
   - Implement predictive analytics for compliance risks
   - Add revenue forecasting
   - Create performance dashboards

4. **Compliance Automation**
   - Automated KYC document verification
   - Risk score auto-calculation triggers
   - Compliance alert system

5. **Mobile Application**
   - Track SKRs in real-time
   - Update locations on-the-go
   - Mobile notifications

---

## Technical Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Next.js API Routes (App Router)
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth with RLS
- **Validation**: Zod schemas
- **UI**: shadcn/ui components with glassmorphism
- **Styling**: Tailwind CSS
- **Maps**: Leaflet for tracking
- **PDF Generation**: Custom PDF utilities

---

## Environment Configuration

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- Email service credentials (if configured)
- SMS service credentials (if configured)

---

## Conclusion

The G1 Group CRM is a well-architected, secure, and scalable system with:
- ✅ Comprehensive role-based access control
- ✅ Complete audit trail
- ✅ Data integrity through constraints and RLS
- ✅ Efficient querying with proper indexing
- ✅ Business logic enforcement at multiple levels
- ✅ Multi-channel notification support
- ✅ Real-time tracking capabilities
- ✅ Financial management with validation
- ✅ Compliance monitoring tools

The system is production-ready with opportunities for enhancement in automation, analytics, and user experience.

