# G1 Dashboard System

A comprehensive secure transaction command center for G1 Group Companies, built with Next.js and Supabase.

## Features

- **SKR Management**: Create, track, and manage Secure Keeper Receipts with digital signatures
- **Client Management**: Comprehensive CRM with KYC compliance and risk assessment
- **Financial Operations**: Automated invoicing, receipts, and financial document management
- **Compliance & Risk**: KYC workflows, risk assessment, and regulatory compliance
- **Audit & Security**: Complete audit trails and role-based access control
- **Real-time Updates**: Live tracking and notifications

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Authentication**: Supabase Auth with Row Level Security
- **Database**: PostgreSQL with advanced security policies
- **Deployment**: Vercel (Frontend) + Supabase Platform

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase CLI

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd g1-dashboard-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Fill in your Supabase project details in `.env.local`.

4. Start Supabase locally (optional for development):
```bash
supabase start
```

5. Run database migrations:
```bash
supabase db reset
```

6. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database Schema

The system uses a comprehensive PostgreSQL schema with the following main tables:

- `clients` - Client information and compliance status
- `assets` - Asset details and specifications
- `skrs` - Secure Keeper Receipts with tracking
- `tracking` - Location and status tracking
- `invoices` - Financial invoicing system
- `receipts` - Payment receipts
- `credit_notes` - Credit note management
- `user_profiles` - User roles and permissions
- `audit_logs` - Complete audit trail

## Security

- Row Level Security (RLS) enabled on all tables
- Role-based access control (Admin, Finance, Operations, Compliance, Read-only)
- Comprehensive audit logging
- Secure document storage
- Digital signatures and hash verification

## Development

### Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components
│   └── layout/         # Layout components
├── lib/                # Utility libraries
│   └── supabase/       # Supabase client configuration
├── types/              # TypeScript type definitions
└── utils/              # Helper functions

supabase/
├── migrations/         # Database migrations
├── seed.sql           # Sample data
└── config.toml        # Supabase configuration
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Database Development

- `supabase start` - Start local Supabase stack
- `supabase stop` - Stop local Supabase stack
- `supabase db reset` - Reset database with migrations and seed data
- `supabase db diff` - Generate migration from schema changes

## Deployment

### Frontend (Vercel)

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Supabase)

1. Create a new Supabase project
2. Run migrations: `supabase db push`
3. Set up Edge Functions: `supabase functions deploy`
4. Configure authentication and storage settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is proprietary software owned by G1 Group Companies.

## Support

For support and questions, contact the development team at dev@g1holdings.com.