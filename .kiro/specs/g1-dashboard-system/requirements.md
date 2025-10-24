# Requirements Document

## Introduction

The G1 Dashboard System is a comprehensive secure transaction command center for G1 Group Companies that manages SKR (Secure Keeper Receipt) generation, tracking, CRM operations, financial document management, compliance workflows, and audit logging. The system serves as the central hub where all SKRs, shipments, and invoices originate from verified client profiles, ensuring complete traceability and security for high-value asset transactions.

## Requirements

### Requirement 1: SKR Generation and Management

**User Story:** As a Finance or Operations user, I want to create, sign, and store SKRs for client assets or consignments, so that I can securely document and track high-value transactions with proper authentication.

#### Acceptance Criteria

1. WHEN a Finance or Operations user initiates SKR creation THEN the system SHALL assign a unique SKR number in format G1-SKR-YYYY-XXXXX
2. WHEN an SKR is created THEN the system SHALL link it to a verified client profile and associated asset
3. WHEN an SKR is approved by Risk/Compliance THEN the system SHALL generate a digital hash and apply digital signature
4. WHEN an SKR is finalized THEN the system SHALL generate a PDF document with hash and signature
5. WHEN an SKR PDF is generated THEN the system SHALL store it securely in Supabase Storage
6. WHEN an SKR is issued THEN the system SHALL create a secure verification link for client access

### Requirement 2: SKR Tracking and Status Management

**User Story:** As an Operations user, I want to track SKR movement, verification, and delivery status, so that I can monitor the complete lifecycle of secure transactions and provide updates to stakeholders.

#### Acceptance Criteria

1. WHEN an SKR status changes THEN the system SHALL update the tracking record with timestamp and user information
2. WHEN tracking updates occur THEN the system SHALL support status progression: Created → In Transit → Delivered → Closed
3. WHEN location updates are made THEN the system SHALL store current location and movement history
4. WHEN clients access their SKR THEN the system SHALL provide read-only tracking information
5. IF optional map-based tracking is enabled THEN the system SHALL display location visualization

### Requirement 3: Client Relationship Management (CRM)

**User Story:** As a CRM user, I want to maintain central records of clients, assets, and associated documents, so that I can have a complete view of each client's transaction history and compliance status.

#### Acceptance Criteria

1. WHEN a client profile is created THEN the system SHALL capture name, type, email, country, risk level, and compliance status
2. WHEN viewing a client profile THEN the system SHALL display all associated SKRs, invoices, shipments, and compliance documents
3. WHEN client information is updated THEN the system SHALL maintain audit trail of changes
4. WHEN assets are registered THEN the system SHALL link them to client profiles with declared value and origin/destination
5. WHEN compliance status changes THEN the system SHALL update client risk assessment accordingly

### Requirement 4: Financial Document Management

**User Story:** As a Finance user, I want to issue invoices, receipts, and credit notes linked to SKRs or contracts, so that I can maintain accurate financial records with proper documentation and tracking.

#### Acceptance Criteria

1. WHEN financial documents are created THEN the system SHALL use automated PDF generation with sequential numbering
2. WHEN invoices are issued THEN the system SHALL link them to specific SKRs or client contracts
3. WHEN payments are received THEN the system SHALL generate receipts with payment method and amount details
4. WHEN credit notes are required THEN the system SHALL reference original invoices with reason and amount
5. WHEN financial documents are generated THEN the system SHALL apply digital signatures and store securely
6. WHEN document status changes THEN the system SHALL track payment status and completion

### Requirement 5: Compliance and Risk Management

**User Story:** As a Compliance officer, I want to manage KYC processes, asset risk ratings, and document verification, so that I can ensure regulatory compliance and maintain proper risk assessment for all transactions.

#### Acceptance Criteria

1. WHEN new clients are onboarded THEN the system SHALL trigger KYC compliance workflow
2. WHEN SKRs are created THEN the system SHALL initiate compliance verification process
3. WHEN assets are evaluated THEN the system SHALL assign risk ratings based on type, value, and origin
4. WHEN compliance documents are uploaded THEN the system SHALL verify and store them securely
5. WHEN compliance status changes THEN the system SHALL update client profiles and transaction permissions
6. WHEN audit requirements are triggered THEN the system SHALL provide complete compliance audit trail

### Requirement 6: User Management and Access Control

**User Story:** As a System Administrator, I want to manage user roles, permissions, and access controls, so that I can ensure secure access to sensitive financial and client information based on job responsibilities.

#### Acceptance Criteria

1. WHEN users are created THEN the system SHALL assign roles (Admin, Finance, Operations, Compliance, Read-only)
2. WHEN users access the system THEN the system SHALL enforce role-based permissions using Supabase RLS
3. WHEN sensitive operations are performed THEN the system SHALL require appropriate authorization levels
4. WHEN user sessions are established THEN the system SHALL implement secure authentication with Supabase Auth
5. WHEN user permissions change THEN the system SHALL update access controls immediately

### Requirement 7: Audit Logging and Activity Tracking

**User Story:** As an Audit manager, I want to record every transaction and user action in the system, so that I can maintain complete accountability and provide audit trails for regulatory compliance.

#### Acceptance Criteria

1. WHEN any system action occurs THEN the system SHALL log user, timestamp, action type, and affected records
2. WHEN SKR lifecycle events happen THEN the system SHALL record status changes with responsible users
3. WHEN financial transactions are processed THEN the system SHALL maintain immutable audit records
4. WHEN compliance actions are taken THEN the system SHALL log verification steps and outcomes
5. WHEN audit reports are requested THEN the system SHALL generate comprehensive activity logs
6. IF blockchain logging is enabled THEN the system SHALL hash SKR metadata on testnet for additional verification

### Requirement 8: Document Verification and Security

**User Story:** As a client or external auditor, I want to verify the authenticity of SKRs and financial documents, so that I can confirm the legitimacy of transactions and document integrity.

#### Acceptance Criteria

1. WHEN SKRs are generated THEN the system SHALL create unique digital hashes for verification
2. WHEN verification is requested THEN the system SHALL provide public endpoint for document authentication
3. WHEN documents are accessed THEN the system SHALL validate hash integrity and signature authenticity
4. WHEN QR codes are scanned THEN the system SHALL redirect to secure verification portal
5. WHEN verification fails THEN the system SHALL log security incidents and alert administrators

### Requirement 9: Notification and Communication System

**User Story:** As a stakeholder (client, internal user), I want to receive automated notifications about SKR status changes and important events, so that I can stay informed about transaction progress and required actions.

#### Acceptance Criteria

1. WHEN SKRs are issued THEN the system SHALL send email notifications to relevant clients
2. WHEN status changes occur THEN the system SHALL notify internal users based on their roles
3. WHEN compliance actions are required THEN the system SHALL alert appropriate personnel
4. WHEN delivery confirmations are received THEN the system SHALL notify all stakeholders
5. IF Telegram integration is enabled THEN the system SHALL support alternative notification channels