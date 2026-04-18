export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  full_name?: string
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
  full_name?: string
  email: string
  phone: string
  address: string
  notes?: string
  created_by?: number | null
  created_by_name?: string | null
  created_at: string
  updated_at?: string
}

export interface Truck {
  id: number
  plate_number: string
  truck_type: 'small' | 'medium' | 'large' | 'extra_large'
  truck_type_display?: string
  make: string
  model: string
  year: number
  color?: string
  capacity_tons: string
  status: 'available' | 'on_job' | 'maintenance'
  status_display?: string
  mileage_km?: number
  next_service_date: string | null
  notes?: string
  created_at?: string
}

export interface JobAssignment {
  id: number
  staff: {
    id: number
    first_name: string
    last_name: string
    email: string
    phone?: string
    staff_profile?: { average_rating: string }
  }
  // Flat fields for legacy dashboard pages
  staff_name?: string
  staff_email?: string
  staff_phone?: string
  role: 'supervisor' | 'mover'
  role_display?: string
  recommendation_score?: number | null
  assigned_at?: string
}

export interface JobTruck {
  id: number
  truck: {
    id: number
    plate_number: string
    make: string
    model: string
    truck_type: string
    capacity_tons: string
    status: string
  }
  assigned_at?: string
}

export interface Job {
  id: number
  title: string
  customer: {
    id: number
    first_name: string
    last_name: string
    email: string
    phone: string
  }
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  status_display?: string
  move_size: string
  move_size_display?: string
  pickup_address: string
  dropoff_address: string
  estimated_distance_km: string
  scheduled_date: string
  scheduled_time?: string | null
  started_at: string | null
  completed_at: string | null
  notes?: string
  special_instructions?: string
  assignments: JobAssignment[]
  job_trucks: JobTruck[]
  created_by?: number | null
  created_by_name?: string | null
  created_at?: string
  updated_at?: string
}

export interface Payment {
  id: number
  invoice?: number
  amount: string
  method: 'cash' | 'mpesa' | 'bank_transfer' | 'card'
  method_display?: string
  status?: 'pending' | 'completed' | 'failed' | 'refunded'
  transaction_id: string
  payment_date: string
  notes?: string
  recorded_by_name?: string | null
}

export interface Invoice {
  id: number
  // Nested object (new pages)
  job?: {
    id: number
    title: string
    estimated_distance_km: string
    customer: { id: number; first_name: string; last_name: string }
    assignments?: { id: number }[]
    job_trucks?: { id: number }[]
  }
  // Flat fields (old dashboard pages)
  job_title?: string
  customer_name?: string
  base_charge: string
  distance_charge: string
  staff_charge: string
  truck_charge: string
  subtotal: string
  vat_amount?: string
  tax_amount?: string
  total_amount: string
  amount_paid: string
  balance_due: string
  payment_status: 'unpaid' | 'partial' | 'paid' | 'waived'
  payment_status_display?: string
  due_date: string | null
  notes?: string
  payments: Payment[]
  created_at: string
  updated_at?: string
}

export interface StaffReview {
  id: number
  job: number
  job_title?: string
  reviewer: {
    id?: number
    first_name: string
    last_name: string
  }
  reviewee: {
    id?: number
    first_name: string
    last_name: string
  }
  category: 'overall' | 'punctuality' | 'teamwork' | 'care_of_goods' | 'physical_fitness' | 'communication'
  category_display?: string
  rating: 1 | 2 | 3 | 4 | 5
  rating_display?: string
  comment: string
  created_at: string
}

export interface DashboardSummary {
  staff: {
    total_active: number
    available: number
    on_job: number
  }
  fleet: {
    total: number
    available: number
    on_job: number
  }
  jobs: {
    total: number
    pending: number
    assigned: number
    in_progress: number
    completed: number
    cancelled?: number
    unassigned_needing_attention: number
  }
  billing: {
    total_invoiced: string
    total_collected: string
    total_outstanding: string
    unpaid_invoices: number
  }
  customers: {
    total: number
  }
}

export interface Notification {
  id: number
  notification_type: string
  type_display?: string
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

export interface DashboardReport {
  staff: { total: number; available: number; on_job: number }
  fleet: { total: number; available: number; on_job: number; maintenance: number }
  jobs: { total: number; pending: number; assigned: number; in_progress: number; completed: number; cancelled: number; unassigned_needing_attention: number }
  billing: { total_invoiced: string; total_collected: string; total_outstanding: string; unpaid_count: number }
}

export interface JobsReport {
  status_breakdown: Record<string, number>
  daily_completions: { date: string; count: number }[]
  move_size_distribution: Record<string, number>
  avg_duration_hours: number | null
}

export interface BillingReport {
  total_invoiced: string
  total_collected: string
  outstanding: string
  payment_method_breakdown: Record<string, string>
  monthly_trend: { month: string; revenue: string }[]
  top_unpaid: Invoice[]
}

export interface StaffPerformanceReport {
  staff: {
    id: number
    full_name: string
    email: string
    recommendation_score: string
    average_rating: string
    total_reviews: number
    jobs_completed: number
    jobs_supervised: number
    is_available: boolean
  }[]
}

export interface FleetReport {
  utilisation_rate: number
  status_breakdown: Record<string, number>
  on_job_trucks: Truck[]
  service_due: Truck[]
}

export interface AttendanceReport {
  confirmation_rate: number
  per_job: { job_id: number; job_title: string; confirmed: number; total: number }[]
  top_absent: { staff_id: number; staff_name: string; absent_count: number }[]
}

export interface ApplicationsReport {
  total: number
  approval_rate: number
  status_breakdown: Record<string, number>
  open_jobs: { job_id: number; job_title: string; application_count: number }[]
}
