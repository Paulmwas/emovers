# E-Movers Frontend SKILL

## What This Skill Is

This file is the definitive authoring guide for every frontend task in the E-Movers project.
Read it fully before writing a single line of code. It encodes every design tradeoff, every
user-flow decision, every API contract, and every component pattern chosen for this system.

E-Movers is an **internal operational tool** — not a public booking site. Two roles use it:
- **mover-admin** — creates jobs, approves staff, generates invoices, disburses payments, reads reports
- **mover-staff** — browses jobs, applies, confirms attendance, starts/completes jobs (supervisor), submits reviews

The landing page (`/`) is the **only public page**. Everything else requires authentication.

---

## 1. Project Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout — fonts, global CSS, providers
│   ├── globals.css                   # Design system tokens, component utilities
│   ├── page.tsx                      # Landing page (public, /)
│   ├── auth/
│   │   └── login/page.tsx            # Login (only auth page — no public register)
│   └── dashboard/
│       ├── layout.tsx                # Protected shell: Sidebar + Header + ToastProvider
│       ├── admin/page.tsx            # Admin dashboard (KPI cards + unassigned alert)
│       ├── staff/page.tsx            # Staff dashboard (my jobs + applications + notifications)
│       ├── jobs/
│       │   ├── page.tsx              # Job list (admin: all; staff: open/assigned to them)
│       │   └── [id]/page.tsx         # Job detail: assignments, applications, attendance, billing
│       ├── customers/page.tsx        # Customer CRUD (admin only)
│       ├── fleet/page.tsx            # Truck CRUD + status (admin only)
│       ├── billing/
│       │   ├── page.tsx              # Invoice list
│       │   └── [id]/page.tsx         # Invoice detail + downloadable PDF
│       ├── reviews/page.tsx          # Review list / my-reviews (role-gated)
│       ├── staff-management/page.tsx # Staff list + profiles + scores (admin only)
│       ├── reports/page.tsx          # All 5 report panels (admin only)
│       └── notifications/page.tsx   # Notification inbox (all users)
├── components/
│   ├── ui/
│   │   ├── Modal.tsx                 # Base Modal + ConfirmModal
│   │   ├── Toast.tsx                 # Exported from context — do not build separately
│   │   ├── Badge.tsx                 # Status badges for all domain statuses
│   │   ├── Spinner.tsx               # Spinner + PageLoader
│   │   ├── EmptyState.tsx            # Empty list states
│   │   ├── StatsCard.tsx             # KPI card with icon, value, label, optional trend
│   │   ├── Table.tsx                 # Reusable data table wrapper
│   │   ├── Pagination.tsx            # Page controls for paginated lists
│   │   └── InvoicePDF.tsx            # PDF invoice component (print-optimised)
│   ├── layout/
│   │   ├── Sidebar.tsx               # Role-aware sidebar navigation
│   │   ├── Header.tsx                # Top bar: page title + user avatar + notification bell
│   │   └── Navbar.tsx                # Public landing page navbar
│   ├── jobs/
│   │   ├── JobCard.tsx               # Job card used on staff dashboard open-jobs list
│   │   ├── JobForm.tsx               # Create/Edit job modal form (admin)
│   │   ├── ApplicationsPanel.tsx     # Applicant list + approve form (admin, job detail)
│   │   ├── AttendancePanel.tsx       # PIN generator + confirmation list (job detail)
│   │   ├── AssignmentPanel.tsx       # Staff + truck chips on job detail
│   │   └── ReviewForm.tsx            # Bulk review submission form (supervisor)
│   ├── billing/
│   │   ├── InvoiceCard.tsx           # Summary card on invoice list
│   │   ├── PaymentModal.tsx          # Simulate payment form
│   │   └── DisburseModal.tsx         # Confirm disbursement dialog
│   └── notifications/
│       └── NotificationItem.tsx      # Single notification row with read/unread state
├── contexts/
│   ├── AuthContext.tsx               # user, isAdmin, isStaff, login, logout, refreshUser
│   └── ToastContext.tsx              # toast.success / .error / .warning / .info
├── hooks/
│   ├── useJobs.ts                    # useSWR/fetch wrapper for job list with filters
│   ├── useJob.ts                     # Single job + mutations (status, apply, approve)
│   ├── useNotifications.ts           # Notification list + unread count polling
│   ├── useReports.ts                 # All report data
│   └── useInvoice.ts                 # Invoice + payment + disbursement
├── lib/
│   ├── api.ts                        # Axios instance with JWT interceptor + auto-refresh
│   └── services.ts                   # All API calls: authService, jobService, etc.
└── types/
    └── index.ts                      # All TypeScript interfaces (Job, User, Invoice, etc.)
```

---

## 2. Design System

### Reference Image
The design reference is the Moving Express landing page (navy + blue + yellow/orange palette).
Match it pixel-perfectly on the landing page. The dashboards share the same token system
but use a sidebar layout instead.

### Color Tokens (CSS variables in globals.css)

```css
--color-navy:        #0B1F3A;   /* Primary dark — headers, sidebar, heavy text */
--color-navy-light:  #132845;   /* Sidebar hover states */
--color-navy-mid:    #1A3A5C;   /* Secondary sections, card borders */
--color-orange:      #E8450A;   /* Primary CTA, active states, brand accent */
--color-orange-light:#FF5722;   /* Hover state for orange buttons */
--color-yellow:      #FFB800;   /* Secondary accent, "GET A QUOTE" button style */
--color-white:       #FFFFFF;
--color-gray-light:  #F5F7FA;   /* Page backgrounds, table alternates */
--color-gray-mid:    #E2E8F0;   /* Borders, dividers */
--color-text-muted:  #7A8A9A;   /* Placeholder, helper text, secondary labels */
--color-text-body:   #3D5166;   /* Body copy */
--color-success:     #22C55E;
--color-warning:     #F59E0B;
--color-danger:      #EF4444;
--color-info:        #3B82F6;
```

### Typography

```css
/* Display / headings */
font-family: 'Barlow Condensed', sans-serif;
font-weight: 800 | 900;
text-transform: uppercase;
letter-spacing: -0.02em;

/* Body / UI labels */
font-family: 'Barlow', sans-serif;
font-weight: 400 | 500 | 600 | 700;

/* Stat numbers */
font-family: 'Barlow Condensed', sans-serif;
font-weight: 800;
font-size: 2rem+;
```

Always load both from Google Fonts in `app/layout.tsx`:
```html
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

### Icons
Exclusively Font Awesome 6 via CDN:
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
```
**Never use emojis in code.** All icons are `<i className="fa-solid fa-..." />`.

### Buttons

| Class | Use case |
|---|---|
| `.btn-primary` | Primary CTA — orange fill, white text |
| `.btn-outline` | Secondary action — navy border |
| `.btn-ghost` | Tertiary/cancel — no border, muted text |
| `.btn-yellow` | Landing page "GET A QUOTE" style — yellow fill |

All buttons: Barlow Condensed, uppercase, letter-spacing. Icon left of text.

### Cards
`.card` — white background, `border-radius: 0.75rem`, subtle shadow, hover lift via transition.

### Status Badges
One component `<Badge status="..." />` covers all domain statuses.
CSS utility classes: `.badge-pending`, `.badge-assigned`, `.badge-in_progress`,
`.badge-completed`, `.badge-cancelled`, `.badge-paid`, `.badge-unpaid`,
`.badge-partial`, `.badge-available`, `.badge-on_job`, `.badge-maintenance`.
All badges: pill shape, uppercase, icon + label, coloured background at 10–12% opacity.

### Forms
`.form-input` — 1.5px border, focus ring in orange at 10% opacity.
`.form-label` — 0.75rem, uppercase, 700 weight, navy, letter-spacing.
Always include placeholder text. Always show inline field errors below the input.

### Spacing
Section padding: `section-pad` (5rem vertical, responsive horizontal).
Container: `container-wide` (max 1280px, centred).

### Animations
- Page load: `fadeUp` — elements stagger in with `animation-delay`
- Modal open: `scaleIn` (0.2s ease)
- Toast enter: `toastIn` (slide from right)
- Toast exit: `toastOut` (slide out right)
- Sidebar links: `transition: all 0.15s ease`

---

## 3. Landing Page (`/`) — Pixel-Perfect Sections

The landing page is public and marketing-focused. Match the reference design exactly.

### Sections in order:

1. **Navbar** — fixed top, white bg on scroll, navy links, orange phone number, "Login" orange button
2. **Hero** — large headline "Moving & Storage / Made Simple" (Barlow Condensed 900),
   blue/navy gradient bg, truck + movers image, search bar row (From / To / Date / Move Size + GET A QUOTE yellow button)
3. **Services** — "Our Moving Services", tab filter (Moving / Storage / Special Items),
   2-row icon grid: Local Moving, Long-Distance, Relocation, Full-Service, Cross-Country, Moving Supplies, International, Military
4. **Explore** — split layout: left image (movers + truck), right text "Explore Our Services / Moving and Storage", yellow "VIEW OUR SERVICES" button
5. **Stats** — full-width navy/blue band: 240+ Locations, 6M+ Long-distance moves, 300 across US/Canada, 15+ years
6. **Steps** — "4 Easy Steps Plan Your Move": 01 Plan, 02 Pack, 03 Load, 04 Delivery — step 01 is navy card, rest white
7. **CTA Banner** — full bleed truck photo, overlay text "Moving Express has your moving needs covered!", yellow "GET A QUOTE" button
8. **Partners** — logo row: Proline, Penta, Waveless, Automation, Vision
9. **Testimonials** — left "Feedback from our customers 9.1/10", right testimonial card with quote, stars, avatar, slider dots
10. **Blog** — 3 blog cards with category badges, images, titles
11. **Footer** — navy bg, 4 columns: 24/7 info, Services, About, Address, social icons row

### Landing page rules:
- No auth required. Show "Login" button in navbar → `/auth/login`
- No dashboard link until logged in
- Smooth-scroll anchors for section links
- All numbers in stats section animate counting up on scroll into view (IntersectionObserver + CSS counter animation)
- Mobile: hamburger menu, single column layouts

---

## 4. Auth Flow

### Login page (`/auth/login`)
- Split layout: left navy panel (logo + welcome + feature chips), right form
- Fields: Email, Password (with show/hide toggle)
- On submit: `POST /api/v1/auth/login/` → store `access_token` + `refresh_token` in localStorage
- On success: call `GET /api/v1/auth/me/` → redirect based on role:
  - `mover-admin` → `/dashboard/admin`
  - `mover-staff` → `/dashboard/staff`
- Error cases: show inline error message (not a separate page), never an alert()
- Toast: on success show `toast.success("Welcome back, [name]!")`
- No public registration — only admin creates accounts via `/dashboard/staff-management`

### Protected routes
- `dashboard/layout.tsx` reads auth state from `AuthContext`
- If no token → redirect to `/auth/login`
- If wrong role for the page → redirect to their dashboard root
- Show `<PageLoader />` while auth state resolves

### Logout
- Button in sidebar footer
- Call `POST /api/v1/auth/logout/` with refresh token
- Clear localStorage
- Redirect to `/auth/login`
- Toast: `toast.success("Signed out successfully.")`

---

## 5. Dashboard Shell

### Layout structure
```
┌─────────────────────────────────────────────────────┐
│  Sidebar (240px, sticky, full height, navy bg)       │
│  ┌───────────────────────────────────────────────┐   │
│  │ Logo                                          │   │
│  │ User chip (avatar initials + name + role)     │   │
│  │ ─────────────────────────────────────────     │   │
│  │ Nav links (role-filtered)                     │   │
│  │ ─────────────────────────────────────────     │   │
│  │ Homepage link                                 │   │
│  │ Sign Out                                      │   │
│  └───────────────────────────────────────────────┘   │
│                                                      │
│  Main area (flex-1, overflow-y-auto)                 │
│  ┌──────────────────────────────────────────────┐    │
│  │ Header (sticky, 64px, white, border-bottom)  │    │
│  │  Page title | time | notification bell | avatar│   │
│  └──────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────┐    │
│  │ Page content (padding 1.5rem)               │    │
│  └──────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### Sidebar navigation — Admin
```
fa-gauge-high      Dashboard
fa-truck-moving    Jobs
fa-users           Customers
fa-truck           Fleet
fa-file-invoice-dollar  Billing
fa-star            Reviews
fa-id-badge        Staff Management
fa-chart-bar       Reports
fa-bell            Notifications    [unread badge]
```

### Sidebar navigation — Staff
```
fa-gauge           My Dashboard
fa-truck-moving    Jobs (browse + my applications)
fa-star            My Reviews
fa-bell            Notifications    [unread badge]
```

### Notification bell
In `Header.tsx`, poll `GET /api/v1/notifications/unread-count/` every 60 seconds.
Show red badge with count. Click → `/dashboard/notifications`.

### Mobile
Below 768px: sidebar collapses, hamburger button in header opens drawer overlay.

---

## 6. Admin Dashboard (`/dashboard/admin`)

### KPI Cards row 1 (always visible)
| Icon | Metric | Source |
|---|---|---|
| fa-users | Available Staff | `reports.dashboard.staff.available` |
| fa-truck | Available Trucks | `reports.dashboard.fleet.available` |
| fa-clipboard-list | Total Jobs | `reports.dashboard.jobs.total` |
| fa-file-invoice-dollar | Outstanding | `reports.dashboard.billing.total_outstanding` |

### Alert banner — Unassigned Jobs
If `reports.dashboard.jobs.unassigned_needing_attention > 0`:
Show a prominent orange alert card:
"[N] jobs need staff assignment" with a "View Unassigned" button → filters job list.
This is the most important visual on the admin dashboard — put it at the top.

### Row 2 — Quick action cards
- "Create Job" → opens JobForm modal
- "Register Staff" → opens RegisterUserModal
- "Add Truck" → opens TruckForm modal
- "Generate Invoice" → opens GenerateInvoiceModal

### Row 3 — Recent Jobs table
Last 5 jobs with status, customer, date, assigned staff count.
"View All" → `/dashboard/jobs`

### Row 4 — Staff Availability overview
Top 6 staff by recommendation_score showing score bar, availability chip.
"View All Staff" → `/dashboard/staff-management`

---

## 7. Staff Dashboard (`/dashboard/staff`)

### Cards row
| Metric | Source |
|---|---|
| My Active Applications | count from `/jobs/my-applications/?status=applied` |
| Approved Jobs | count from `/jobs/my-applications/?status=approved` |
| My Rating | `auth.me.staff_profile.average_rating` |
| Recommendation Score | `auth.me.staff_profile.recommendation_score` |

### Open Jobs section
List of `GET /api/v1/jobs/?status=pending` jobs the staff can apply to.
Each shows: title, move size badge, location, scheduled date, applicant count vs max.
Apply button → `POST /api/v1/jobs/<id>/apply/` → optimistic update + toast.

**Apply logic:**
- If already applied: show "Applied — Withdraw" button (DELETE)
- If approved: show "Approved" badge — no action
- If deadline passed: show "Closed" chip
- If at max_applicants: show "Full" chip
- If staff is already assigned to another job on same date: show warning

### My Upcoming Assignments section
Jobs where staff has an `approved` application.
Each shows: job title, date, supervisor name, role (Supervisor / Mover), attendance status.
If job is `assigned` and PIN has been generated: show "Confirm Attendance" button.

### Attendance confirmation flow
1. Staff sees "Confirm Attendance" button on their assignment card
2. Opens a modal with a PIN input (6 digits)
3. `POST /api/v1/attendance/confirm/` with `{job_id, pin}`
4. On success: badge changes to green "Present", toast.success
5. On wrong PIN: inline error "Incorrect PIN. Try again."

### Notification strip
3 most recent unread notifications with "Mark All Read" button.
Link to full inbox `/dashboard/notifications`.

---

## 8. Jobs Page (`/dashboard/jobs`)

This page works differently for admin vs staff.

### Admin view
- Full job list with all statuses
- Filter bar: status | move_size | scheduled_date_after | scheduled_date_before | search
- "Create Job" button → JobForm modal
- Each row: title, customer, move size, date, status badge, staff count, truck count, actions
- Actions per job: View | Edit | Auto-Allocate | Delete

### Staff view
- Tabs: "Open Jobs" (pending, can apply) | "My Jobs" (approved/in_progress assignments)
- Open jobs show Apply button
- My jobs show status + attendance confirmation if needed

### Job Detail page (`/dashboard/jobs/[id]`)

This is the richest page. Uses tabs to organise content:

**Tab 1: Overview**
- Job info: title, customer, addresses, distance, dates, move size, notes
- Status badge + action buttons based on current status:
  - PENDING + no assignments → "Auto-Allocate" + "Assign Manually" buttons
  - ASSIGNED → "Start Job" button (admin or supervisor)
  - IN_PROGRESS → "Complete Job" button (admin or supervisor only)
  - COMPLETED → readonly
  - Any non-terminal → "Cancel Job" button (admin only, always red/destructive)
- Invoice status chip with "Generate Invoice" or "View Invoice" button

**Tab 2: Applications** (Admin only, shown when job is PENDING)
- Applicant list ordered by recommendation_score DESC
- Each applicant: avatar initials, name, score bar (coloured), rating stars, "applied_at" time
- "Approve Applications" button → opens ApproveModal:
  - Multi-select checkboxes for approved staff
  - Single-select radio for supervisor
  - Validation: supervisor must be in approved set, min 1 approved
  - On confirm: `POST /api/v1/jobs/<id>/approve-applications/`
  - On success: job status → assigned, toast, tab switches to Team

**Tab 3: Team / Assignments** (shown once assigned)
- Supervisor card (highlighted with crown icon fa-crown)
- Grid of mover cards: initials, name, rating, attendance status
- Each card shows: confirmed (green check), absent (red x), pending (grey clock)

**Tab 4: Attendance** (Admin only, shown once assigned)
- If no PIN yet: "Generate PIN" button → `POST /api/v1/attendance/generate-pin/<id>/`
  - Shows the 6-digit PIN in a large, copyable display after generation
  - Warning: "Share this PIN with your team. Regenerating will invalidate the old PIN."
- Attendance table: staff name | status badge | confirmed_at | notes
- "Mark Absent" action per row if status still pending
- Confirmation rate progress bar (e.g. "7 / 10 confirmed — 70%")

**Tab 5: Billing** (Admin + Staff can view)
- If no invoice: "Generate Invoice" button (admin only)
- Invoice card showing cost breakdown:
  - Base charge: KES 2,000
  - Distance: KES [X] (100 × km)
  - Staff: KES [X] (500 × count)
  - Trucks: KES [X] (1500 × count)
  - Subtotal | VAT 16% | **Total**
- Payment history table
- "Record Payment" button → PaymentModal
- "Disburse" button (only when paid) → DisburseModal
- "Download Invoice PDF" button → generates PDF client-side
- Disbursement records table (after disbursement)

**Tab 6: Reviews** (shown when completed)
- If user is supervisor: "Submit Reviews" button → opens ReviewForm
- ReviewForm: for each mover, rate across categories (overall, punctuality, teamwork, care_of_goods, physical_fitness, communication) with 1–5 star pickers
- If reviews exist: display review cards per mover with scores
- Admin can view all; staff can only view own reviews

---

## 9. Customers Page (`/dashboard/customers`)

Admin only — 403 redirect if staff.

- Search bar + "Add Customer" button
- Table: name | email | phone | address | active jobs count | created date | actions
- Row actions: View | Edit | Delete (blocked if active jobs)
- Add/Edit: inline slide-over panel or modal with form fields
- Delete: ConfirmModal with "This customer has [N] active jobs" warning if applicable

---

## 10. Fleet Page (`/dashboard/fleet`)

Admin + Staff can view. Only admin can create/edit/delete.

- Filter by status (available / on_job / maintenance) using tab pills
- Available trucks stat card at top
- Table: plate | type badge | make/model | capacity | status badge | next service | actions (admin)
- Status alert: trucks with `next_service_date <= today` shown with warning chip
- "Add Truck" button → TruckForm modal

---

## 11. Billing Page (`/dashboard/billing`)

### Invoice list
- Filter: payment_status | date range | search
- KPI row: Total Invoiced | Total Collected | Outstanding | Unpaid count
- Table: invoice ID | job title | customer | total | paid | balance | status | due date | actions
- "Generate Invoice" button → modal with job_id selector + due_date + notes

### Invoice detail (`/dashboard/billing/[id]`)
- Cost breakdown card (line items exactly as per formula)
- Payment history table
- Payment status progress indicator
- Action buttons (role-gated): Record Payment | Disburse | Download PDF

### Download Invoice PDF
Use `window.print()` with a print-specific CSS class, OR use `jspdf` + `html2canvas` to
generate a PDF from the InvoicePDF component.

The invoice PDF must include:
- E-Movers logo + company details
- Invoice number, job title, customer info
- Itemised cost breakdown table (matches formula)
- Payment history
- Disbursement status
- Footer: "This is a simulated payment environment."

Button: `<button onClick={handleDownloadPDF}><i className="fa-solid fa-download" /> Download Invoice</button>`

---

## 12. Staff Management Page (`/dashboard/staff-management`)

Admin only.

### List view
- Table: name | email | phone | rating stars | recommendation score bar | availability badge | actions
- Score bar: coloured from red (0.2) to green (1.0), fills proportionally
- "Add Staff" button → RegisterUserModal (POST /api/v1/auth/register/ with role=mover-staff)
- Row actions: View Profile | Edit | Deactivate

### Staff Profile modal/panel
- Personal info
- StaffProfile: is_available toggle (admin can override), notes textarea
- Rating summary: average + category breakdown bars
- Recent reviews list (last 5)
- Jobs completed count
- Recommendation score visualised as a gauge

---

## 13. Reviews Page (`/dashboard/reviews`)

### Admin view
- Full review list with filters: category, rating, job, reviewer, reviewee
- Sortable by rating and date
- Shows: reviewer name | reviewee name | job | category | rating stars | comment | date

### Staff view
- "My Reviews" — only reviews where reviewee = current user
- Summary card: overall avg, recommendation_score, category breakdown
- Review history table

---

## 14. Reports Page (`/dashboard/reports`)

Admin only. Tabs for each report type.

**Tab: Dashboard** — `GET /api/v1/reports/dashboard/?days=N`
- Day range selector: 7 / 30 / 90 / 365
- KPI cards grid
- Unassigned jobs alert

**Tab: Jobs** — `GET /api/v1/reports/jobs/?days=N`
- Status breakdown bar chart (CSS-only, no chart library needed)
- Daily completions list
- Move-size distribution
- Average duration

**Tab: Billing** — `GET /api/v1/reports/billing/?days=N`
- Revenue totals row
- Payment method breakdown (visual percentage bars)
- Monthly trend (simple bar chart)
- Top unpaid invoices table

**Tab: Staff Performance** — `GET /api/v1/reports/staff-performance/`
- Sorted table: rank, name, score bar, avg rating, total reviews, jobs completed, supervised
- "Available only" toggle filter
- Score bar colours: red < 0.5, yellow 0.5–0.75, green > 0.75

**Tab: Fleet** — `GET /api/v1/reports/fleet/`
- Utilisation rate circular indicator (CSS)
- Status breakdown
- Currently on-job trucks list
- Service-due trucks alert list

**Tab: Attendance** — `GET /api/v1/reports/attendance/?days=N`
- Confirmation rate percentage (big number)
- Per-job attendance breakdown table
- Top absent staff list

**Tab: Applications** — `GET /api/v1/reports/applications/?days=N`
- Total applications, approval rate
- Status breakdown bars
- Jobs with open applications (needs admin attention)

---

## 15. Notifications Page (`/dashboard/notifications`)

All roles. Newest first.

- "Mark All Read" button at top right
- Filter: all / unread
- Each notification:
  - Unread: left orange accent bar + slightly lighter bg
  - Read: white bg
  - Icon based on notification_type (see type→icon map)
  - Title (bold) + body text + relative time ("2h ago")
  - Click → mark as read + navigate to relevant resource if `job` is set

### Notification type → icon map
```
application_approved  → fa-circle-check (green)
application_rejected  → fa-circle-xmark (red)
job_team_announced    → fa-users (blue)
payment_disbursed     → fa-money-bill-transfer (green)
review_received       → fa-star (yellow)
general               → fa-bell (orange)
attendance_reminder   → fa-clock (blue)
```

---

## 16. Toast System — Usage Contract

Import: `const toast = useToast()` from `@/contexts/ToastContext`

**Call every API action with a toast result.**

| Situation | Toast type | Title pattern |
|---|---|---|
| Create success | success | "Customer Created" |
| Update success | success | "Changes Saved" |
| Delete success | success | "Deleted Successfully" |
| API error | error | Use `err.response?.data?.error` or "Something went wrong" |
| Business rule blocked | warning | Describe the rule: "Cannot delete customer with active jobs" |
| Pending action | info | "Processing..." (rare — prefer loading state on button) |

Toast duration: 4.5 seconds. Auto-dismiss. Position: bottom-right.
Max 4 visible at once (FIFO queue).
Never use `window.alert()`, `console.log()` for user-facing messages, or browser confirms.

---

## 17. Modal System — Usage Contract

Import: `import { Modal, ConfirmModal } from '@/components/ui/Modal'`

**Use Modal for:**
- Create / Edit forms
- Detail views inline (not full-page if fits in modal size `lg`)
- PIN display
- Review submission form
- Payment recording

**Use ConfirmModal for:**
- Delete (always `danger=true`)
- Cancel job (destructive, `danger=true`)
- Disburse (not destructive but irreversible — use standard confirm)
- Approve applications (consequential)

**Modal sizes:** sm (420px) | md (560px) | lg (720px) | xl (900px)

**Every form modal must:**
1. Show loading state on confirm button during API call
2. Disable form fields while loading
3. On success: close modal + show toast + refresh list
4. On error: keep modal open + show inline error + show error toast
5. Support Escape key to close

---

## 18. API Services — Full Contract

All calls live in `src/lib/services.ts`. Views never call `api` directly.

### authService
```typescript
login(email, password)                   → POST /auth/login/
logout(refresh)                          → POST /auth/logout/
me()                                     → GET /auth/me/
updateMe(data)                           → PATCH /auth/me/
changePassword(old, new, confirm)        → POST /auth/change-password/
register(data)                           → POST /auth/register/
tokenRefresh(refresh)                    → POST /auth/token/refresh/
```

### userService
```typescript
list(params?)                            → GET /users/
availableStaff()                         → GET /users/available-staff/
get(id)                                  → GET /users/<id>/
update(id, data)                         → PATCH /users/<id>/
deactivate(id)                           → DELETE /users/<id>/
getStaffProfile(id)                      → GET /users/<id>/staff-profile/
updateStaffProfile(id, data)             → PATCH /users/<id>/staff-profile/
```

### customerService
```typescript
list(params?)                            → GET /customers/
get(id)                                  → GET /customers/<id>/
create(data)                             → POST /customers/
update(id, data)                         → PATCH /customers/<id>/
delete(id)                               → DELETE /customers/<id>/
```

### fleetService
```typescript
list(params?)                            → GET /fleet/
available()                              → GET /fleet/available/
get(id)                                  → GET /fleet/<id>/
create(data)                             → POST /fleet/
update(id, data)                         → PATCH /fleet/<id>/
delete(id)                               → DELETE /fleet/<id>/
```

### jobService
```typescript
list(params?)                            → GET /jobs/
unassigned()                             → GET /jobs/unassigned/
myApplications(params?)                  → GET /jobs/my-applications/
get(id)                                  → GET /jobs/<id>/
create(data)                             → POST /jobs/
update(id, data)                         → PATCH /jobs/<id>/
delete(id)                               → DELETE /jobs/<id>/
autoAllocate(id, num_movers, num_trucks) → POST /jobs/<id>/auto-allocate/
assignStaff(id, staff_ids)              → POST /jobs/<id>/assign-staff/
assignTrucks(id, truck_ids)             → POST /jobs/<id>/assign-trucks/
changeStatus(id, action)                 → POST /jobs/<id>/status/
apply(id)                                → POST /jobs/<id>/apply/
withdrawApplication(id)                  → DELETE /jobs/<id>/apply/
listApplications(id, params?)            → GET /jobs/<id>/applications/
approveApplications(id, approved_ids, supervisor_id) → POST /jobs/<id>/approve-applications/
```

### attendanceService
```typescript
generatePin(jobId)                       → POST /attendance/generate-pin/<jobId>/
confirm(job_id, pin)                     → POST /attendance/confirm/
list(jobId)                              → GET /attendance/<jobId>/
markAbsent(jobId, staff_id, notes)      → POST /attendance/<jobId>/mark-absent/
```

### billingService
```typescript
listInvoices(params?)                    → GET /billing/invoices/
getInvoice(id)                           → GET /billing/invoices/<id>/
generateInvoice(job_id, due_date, notes) → POST /billing/invoices/generate/
updateInvoice(id, data)                  → PATCH /billing/invoices/<id>/
pay(id, amount, method, notes)           → POST /billing/invoices/<id>/pay/
disburse(id)                             → POST /billing/invoices/<id>/disburse/
listPayments(params?)                    → GET /billing/payments/
listDisbursements(params?)               → GET /billing/disbursements/
```

### reviewService
```typescript
list(params?)                            → GET /reviews/
myReviews()                              → GET /reviews/my-reviews/
staffSummary(staffId)                    → GET /reviews/staff/<id>/summary/
jobReviews(jobId)                        → GET /reviews/job/<id>/
create(data)                             → POST /reviews/create/
bulkCreate(job_id, reviews)             → POST /reviews/bulk-create/
```

### notificationService
```typescript
list(params?)                            → GET /notifications/
unreadCount()                            → GET /notifications/unread-count/
markAllRead()                            → POST /notifications/mark-all-read/
markRead(id)                             → PATCH /notifications/<id>/read/
```

### reportService
```typescript
dashboard(days?)                         → GET /reports/dashboard/
jobs(days?)                              → GET /reports/jobs/
billing(days?)                           → GET /reports/billing/
staffPerformance(available_only?)        → GET /reports/staff-performance/
fleet()                                  → GET /reports/fleet/
attendance(days?)                        → GET /reports/attendance/
applications(days?)                      → GET /reports/applications/
```

---

## 19. TypeScript Types (`src/types/index.ts`)

```typescript
export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  full_name: string
  phone: string
  role: 'mover-admin' | 'mover-staff'
  is_active: boolean
  date_joined: string
  staff_profile?: StaffProfile
}

export interface StaffProfile {
  is_available: boolean
  average_rating: string
  total_reviews: number
  recommendation_score: string
  notes: string
  updated_at: string
}

export interface Customer {
  id: number
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string
  address: string
  notes: string
  created_by: number | null
  created_by_name: string | null
  created_at: string
  updated_at: string
}

export interface Truck {
  id: number
  plate_number: string
  truck_type: 'small' | 'medium' | 'large' | 'extra_large'
  truck_type_display: string
  make: string
  model: string
  year: number
  color: string
  capacity_tons: string
  status: 'available' | 'on_job' | 'maintenance'
  status_display: string
  mileage_km: number
  next_service_date: string | null
  notes: string
}

export interface Job {
  id: number
  title: string
  customer: number
  customer_detail: Pick<Customer, 'id' | 'full_name' | 'email' | 'phone'>
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  status_display: string
  move_size: string
  move_size_display: string
  pickup_address: string
  dropoff_address: string
  estimated_distance_km: string
  scheduled_date: string
  scheduled_time: string | null
  started_at: string | null
  completed_at: string | null
  requested_staff_count: number
  requested_truck_count: number
  assigned_staff_count: number
  assigned_truck_count: number
  is_unassigned: boolean
  application_deadline: string | null
  max_applicants: number | null
  notes: string
  special_instructions: string
  assignments: JobAssignment[]
  trucks: JobTruck[]
  created_by: number | null
  created_by_name: string | null
  created_at: string
  updated_at: string
}

export interface JobAssignment {
  id: number
  staff: number
  staff_name: string
  staff_email: string
  staff_phone: string
  role: 'supervisor' | 'mover'
  role_display: string
  recommendation_score: number | null
  assigned_at: string
}

export interface JobTruck {
  id: number
  truck: number
  plate_number: string
  truck_type: string
  make: string
  model: string
  capacity_tons: string
  assigned_at: string
}

export interface JobApplication {
  id: number
  job: number
  job_title: string
  job_scheduled_date: string
  staff: number
  staff_name: string
  staff_email: string
  recommendation_score: number
  average_rating: number
  status: 'applied' | 'approved' | 'rejected' | 'withdrawn'
  applied_at: string
}

export interface AttendanceRecord {
  id: number
  job: number
  job_title: string
  staff: number
  staff_name: string
  status: 'confirmed' | 'absent'
  confirmed_at: string | null
  notes: string
}

export interface Invoice {
  id: number
  job: number
  job_title: string
  customer_name: string
  base_charge: string
  distance_charge: string
  staff_charge: string
  truck_charge: string
  subtotal: string
  tax_rate: string
  tax_amount: string
  total_amount: string
  amount_paid: string
  balance_due: string
  payment_status: 'unpaid' | 'partial' | 'paid' | 'waived'
  payment_status_display: string
  due_date: string | null
  notes: string
  payments: Payment[]
  created_at: string
  updated_at: string
}

export interface Payment {
  id: number
  invoice: number
  amount: string
  method: 'cash' | 'mpesa' | 'bank_transfer' | 'card'
  method_display: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  transaction_id: string
  payment_date: string
  notes: string
  recorded_by_name: string | null
}

export interface Disbursement {
  id: number
  invoice: number
  job_title: string
  staff: number
  staff_name: string
  staff_email: string
  amount: string
  status: 'disbursed'
  disbursed_at: string
  transaction_ref: string
}

export interface StaffReview {
  id: number
  job: number
  job_title: string
  reviewer: number
  reviewer_name: string
  reviewee: number
  reviewee_name: string
  category: 'overall' | 'punctuality' | 'teamwork' | 'care_of_goods' | 'physical_fitness' | 'communication'
  category_display: string
  rating: 1 | 2 | 3 | 4 | 5
  rating_display: string
  comment: string
  created_at: string
}

export interface Notification {
  id: number
  notification_type: string
  type_display: string
  title: string
  body: string
  is_read: boolean
  job: number | null
  job_title: string | null
  created_at: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
```

---

## 20. User Flow Rules — Non-Negotiable

These rules govern how users move through the system. Violating them breaks the product story.

### Admin flow
```
Login → Admin Dashboard
  → See unassigned jobs alert → click → Job list filtered to unassigned
  → Click job → Job Detail
  → Tab: Applications → Review applicants sorted by score
  → Click "Approve Applications" → select staff + supervisor → confirm
  → Morning of move: Tab: Attendance → Generate PIN → share with team
  → Job automatically transitions: assigned → in_progress (supervisor starts)
  → Job completed → Tab: Billing → Generate Invoice → Record Payment
  → Disburse (only after paid) → staff each get notification
  → Reviews appear in Tab: Reviews (supervisor submitted)
```

### Staff flow
```
Login → Staff Dashboard
  → See open jobs → Apply
  → Receive notification when approved → see team list in notification body
  → Morning of move: see "Confirm Attendance" button → enter PIN → confirmed
  → If supervisor: see "Start Job" button → start → "Complete Job" button
  → After completion → see "Submit Reviews" button → bulk review form
  → Receive payment disbursement notification
  → Rating updates → affects future job ranking
```

### Never build these patterns:
- Staff sees admin reports (403 — redirect with toast.error)
- Staff can approve applications (must be admin)
- Non-supervisor staff can submit reviews (must be supervisor of that job)
- Admin can confirm attendance for staff (staff must do it themselves with PIN)
- Disburse before invoice is fully paid (400 — show toast.warning)
- Apply for a job after deadline (show "Applications Closed" chip)
- Multiple applications from same staff to same job (show "Withdraw" instead)

---

## 21. Form Field Reference

### Job Create/Edit form
```
title                    text input, required
customer                 searchable select (load /customers/), required
move_size                select: studio|one_bedroom|two_bedroom|three_bedroom|office_small|office_large
pickup_address           textarea, required
dropoff_address          textarea, required
estimated_distance_km    number input (km), required
scheduled_date           date picker, required
scheduled_time           time picker, optional
requested_staff_count    number, default 10
requested_truck_count    number, default 1
application_deadline     datetime-local, optional
max_applicants           number, optional
notes                    textarea, optional
special_instructions     textarea, optional
```

### Customer Create/Edit form
```
first_name    text, required
last_name     text, required
email         email, required, unique
phone         tel (+254...), required
address       textarea, required
notes         textarea, optional
```

### Truck Create/Edit form
```
plate_number        text uppercase, required, unique
make                text, required
model               text, required
year                number (1990–2030), required
truck_type          select: small|medium|large|extra_large
capacity_tons       number (decimal), required
color               text, optional
status              select: available|on_job|maintenance (edit only)
mileage_km          number, default 0
next_service_date   date, optional
notes               textarea, optional
```

### Register Staff form (admin only)
```
first_name      text, required
last_name       text, required
email           email, required
phone           tel, optional
role            select: mover-admin|mover-staff
password        min 8 chars
password_confirm must match password
```

### Simulate Payment form
```
amount    number (max = balance_due), required
method    select: cash|mpesa|bank_transfer|card
notes     textarea, optional
```

### Review form (bulk, supervisor only)
For each mover on the job, show:
```
[Mover name + avatar]
Categories: overall | punctuality | teamwork | care_of_goods | physical_fitness | communication
Each: star picker 1–5 + optional comment textarea
```
Submit all at once via `/reviews/bulk-create/`.

---

## 22. Error Handling Patterns

### API errors → toast
```typescript
try {
  await jobService.create(data)
  toast.success("Job Created", "The job has been added successfully.")
  onClose()
  refetch()
} catch (err: any) {
  const msg = err.response?.data?.error
    || Object.values(err.response?.data || {}).flat().join(' ')
    || "Something went wrong. Please try again."
  toast.error("Failed to Create Job", msg)
}
```

### 403 Forbidden → redirect
In `dashboard/layout.tsx` or page-level, check role and redirect with:
```typescript
toast.error("Access Denied", "You do not have permission to view this page.")
router.push('/dashboard/staff')
```

### 404 Not Found → inline empty state
Do not redirect. Show `<EmptyState icon="fa-circle-exclamation" title="Not Found" />`.

### Validation errors (DRF format) → field-level display
Parse `err.response?.data` as `Record<string, string[]>` and display each array under its field.

### Network error → toast.error
```typescript
if (!err.response) {
  toast.error("Connection Error", "Check your internet connection and try again.")
}
```

---

## 23. Loading States

- **Page load**: `<PageLoader />` centred in content area while fetching initial data
- **Button action**: set `isLoading = true`, show `fa-spinner fa-spin` icon in button, disable button
- **Table refresh**: show subtle skeleton rows (alternating gray bars) — not full-page loader
- **Infinite scroll / pagination**: show spinner at bottom of list

---

## 24. Responsive Breakpoints

| Breakpoint | Layout change |
|---|---|
| < 640px (mobile) | Single column, sidebar hidden behind drawer |
| 640–768px (sm) | 2-column grids, sidebar still drawer |
| 768–1024px (md) | Sidebar visible, 2–3 column grids |
| > 1024px (lg) | Full sidebar + 3–4 column grids |

Dashboard always uses `flex` row: sidebar (240px fixed) + main (flex-1).
On mobile, sidebar is a drawer (fixed, z-200, overlay).

---

## 25. Invoice PDF Generation

Use `jspdf` + `html2canvas` approach. The `<InvoicePDF />` component is rendered off-screen,
then captured and converted to PDF.

The PDF layout:
```
Header: E-Movers logo left | "INVOICE" title right | Invoice #ID
──────────────────────────────────────────────────────────────────
Bill To:                         Invoice Details:
[Customer Name]                  Date: [created_at]
[Customer Email]                 Due Date: [due_date]
[Customer Phone]                 Status: [payment_status]

Job: [job.title]
Scheduled: [scheduled_date] | [pickup] → [dropoff]
──────────────────────────────────────────────────────────────────
ITEM                             AMOUNT
Base Charge                      KES 2,000.00
Distance ([N] km × KES 100)      KES [X]
Staff ([N] staff × KES 500)      KES [X]
Trucks ([N] trucks × KES 1,500)  KES [X]
──────────────────────────────────────────────────────────────────
Subtotal                         KES [X]
VAT (16%)                        KES [X]
TOTAL                            KES [X]
──────────────────────────────────────────────────────────────────
PAYMENTS RECORDED
[date] | [method] | SIM-[ref]    KES [amount]
──────────────────────────────────────────────────────────────────
BALANCE DUE                      KES [balance_due]
──────────────────────────────────────────────────────────────────
This is a simulated payment environment. No real transaction occurred.
E-Movers | Nairobi, Kenya | hello@emovers.co.ke
```

---

## 26. Score Visualisation

`recommendation_score` runs 0.200 → 1.000. Display as:

```
Score bar:
  < 0.50  → red bar
  0.50–0.75 → yellow bar
  > 0.75  → green bar

Width: score * 100%
Label: score.toFixed(3) + " / 1.000"

Star rating:
  average_rating / 5 → convert to 0–5 star display
  Show filled stars + half star + empty stars
  Label: "[avg] / 5.00 — [N] reviews"
```

---

## 27. Accessibility

- All form inputs have associated `<label>`
- Buttons have descriptive text (not just icon)
- Focus rings visible (orange, 3px)
- Modal traps focus within
- `aria-label` on icon-only buttons
- Loading states announced via `aria-live="polite"`
- Color is never the only indicator — always pair with icon or text

---

## 28. Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

In production:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

---

## 29. File Naming Conventions

- Pages: `page.tsx` (Next.js App Router)
- Components: PascalCase (`JobCard.tsx`, `AttendancePanel.tsx`)
- Hooks: camelCase prefixed with `use` (`useJob.ts`, `useNotifications.ts`)
- Services: camelCase (`services.ts`)
- Types: `types/index.ts` (single file, named exports)
- CSS: globals only — no CSS modules, no styled-components. Use Tailwind utilities + CSS custom properties.

---

## 30. Things Never To Do

- Never use `alert()`, `confirm()`, `prompt()`
- Never use emojis in code (use Font Awesome icons only)
- Never use `Inter`, `Roboto`, `Arial`, or `system-ui` font families — use Barlow + Barlow Condensed only
- Never hardcode colours — always use CSS custom properties (`var(--color-orange)`)
- Never show raw API error objects to users — always extract the human-readable message
- Never store sensitive data beyond `access_token` and `refresh_token` in localStorage
- Never skip the loading state on a button that triggers an API call
- Never build a page without a mobile layout
- Never let staff access admin endpoints — always check role in UI AND rely on API returning 403
- Never skip toasts on success — every mutation (create, update, delete, status change) gets a toast
- Never use chart libraries (Recharts, Chart.js) — all data visualisation is CSS-only bars and counters