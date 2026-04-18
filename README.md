# E-Movers Frontend — Next.js

A professional, responsive management dashboard for the E-Movers moving company system.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **State**: Zustand (with persistence)
- **Forms**: React Hook Form
- **HTTP**: Axios with JWT auto-refresh interceptors
- **Charts**: Recharts
- **Toasts**: React Hot Toast
- **Icons**: Lucide React
- **Fonts**: Outfit (display) + DM Sans (body)

## Features
- ✅ Role-based layout (Admin vs Staff)
- ✅ JWT authentication with auto token refresh
- ✅ Dashboard with real-time KPIs & charts
- ✅ Full CRUD: Jobs, Customers, Fleet, Billing
- ✅ Auto-allocation trigger with modal
- ✅ Invoice generation & payment recording
- ✅ Bulk review submission
- ✅ Reports: Jobs, Billing, Staff Performance, Fleet
- ✅ User management (Admin)
- ✅ Toast notifications on all actions
- ✅ Confirm dialogs for destructive actions
- ✅ Skeleton loading states
- ✅ Fully responsive (mobile + desktop)

## Setup

### 1. Copy the project
```bash
# Navigate to the emovers folder and install
cd emovers-frontend
npm install
```

### 2. Configure environment
```bash
cp .env.local.example .env.local
# Edit .env.local and set your backend URL
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 3. Start development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 4. Login
- **Admin**: admin@emovers.co.ke / Admin1234!
- **Staff**: staff01@emovers.co.ke / Staff1234!

## Project Structure
```
src/
├── app/
│   ├── login/           # Login page
│   ├── dashboard/       # Dashboard with KPIs + charts
│   ├── jobs/            # Jobs list + detail
│   │   └── [id]/        # Job detail with allocations
│   ├── customers/       # Customer CRUD
│   ├── fleet/           # Truck management
│   ├── billing/         # Invoices + payments
│   │   └── [id]/        # Invoice detail
│   ├── reviews/         # Review management
│   ├── reports/         # Reports with charts
│   └── settings/        # Profile + user mgmt
├── components/
│   ├── ui/              # Reusable components
│   └── layout/          # Sidebar, Header, DashboardLayout
├── lib/
│   ├── api.ts           # All API calls (axios)
│   ├── store.ts         # Zustand auth store
│   └── utils.ts         # Helpers, formatters
└── types/               # TypeScript interfaces
```

## API Base URL
All calls go to `NEXT_PUBLIC_API_URL` (default: `http://localhost:8000/api/v1`).

## Roles
| Role | Access |
|------|--------|
| `mover-admin` | Full access — all CRUD, reports, user management |
| `mover-staff` | Read jobs/customers/fleet, start/complete own jobs, view own reviews |
