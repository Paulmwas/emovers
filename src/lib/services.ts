import api from './api'

// ─── AUTH SERVICE ────────────────────────────────────────────────────
export const authService = {
  login: (email: string, password: string) =>
    api.post('/auth/login/', { email, password }).then(r => r.data),
  logout: (refresh: string) =>
    api.post('/auth/logout/', { refresh }).then(r => r.data),
  me: () => api.get('/auth/me/').then(r => r.data),
  updateMe: (data: object) => api.patch('/auth/me/', data).then(r => r.data),
  changePassword: (old_password: string, new_password: string, confirm_password: string) =>
    api.post('/auth/change-password/', { old_password, new_password, confirm_password }).then(r => r.data),
  register: (data: object) => api.post('/auth/register/', data).then(r => r.data),
  tokenRefresh: (refresh: string) =>
    api.post('/auth/token/refresh/', { refresh }).then(r => r.data),
}

// ─── USER SERVICE ────────────────────────────────────────────────────
export const userService = {
  list: (params?: object) => api.get('/users/', { params }).then(r => r.data),
  availableStaff: () => api.get('/users/available-staff/').then(r => r.data),
  get: (id: number) => api.get(`/users/${id}/`).then(r => r.data),
  update: (id: number, data: object) => api.patch(`/users/${id}/`, data).then(r => r.data),
  deactivate: (id: number) => api.delete(`/users/${id}/`).then(r => r.data),
  getStaffProfile: (id: number) => api.get(`/users/${id}/staff-profile/`).then(r => r.data),
  updateStaffProfile: (id: number, data: object) =>
    api.patch(`/users/${id}/staff-profile/`, data).then(r => r.data),
}

// ─── CUSTOMER SERVICE ────────────────────────────────────────────────
export const customerService = {
  list: (params?: object) => api.get('/customers/', { params }).then(r => r.data),
  get: (id: number) => api.get(`/customers/${id}/`).then(r => r.data),
  create: (data: object) => api.post('/customers/', data).then(r => r.data),
  update: (id: number, data: object) => api.patch(`/customers/${id}/`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/customers/${id}/`).then(r => r.data),
}

// ─── FLEET SERVICE ───────────────────────────────────────────────────
export const fleetService = {
  list: (params?: object) => api.get('/fleet/', { params }).then(r => r.data),
  available: () => api.get('/fleet/available/').then(r => r.data),
  get: (id: number) => api.get(`/fleet/${id}/`).then(r => r.data),
  create: (data: object) => api.post('/fleet/', data).then(r => r.data),
  update: (id: number, data: object) => api.patch(`/fleet/${id}/`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/fleet/${id}/`).then(r => r.data),
}

// ─── JOB SERVICE ─────────────────────────────────────────────────────
export const jobService = {
  list: (params?: object) => api.get('/jobs/', { params }).then(r => r.data),
  unassigned: () => api.get('/jobs/unassigned/').then(r => r.data),
  myApplications: (params?: object) => api.get('/jobs/my-applications/', { params }).then(r => r.data),
  get: (id: number) => api.get(`/jobs/${id}/`).then(r => r.data),
  create: (data: object) => api.post('/jobs/', data).then(r => r.data),
  update: (id: number, data: object) => api.patch(`/jobs/${id}/`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/jobs/${id}/`).then(r => r.data),
  autoAllocate: (id: number, num_movers?: number, num_trucks?: number) =>
    api.post(`/jobs/${id}/auto-allocate/`, { num_movers, num_trucks }).then(r => r.data),
  assignStaff: (id: number, staff_ids: number[]) =>
    api.post(`/jobs/${id}/assign-staff/`, { staff_ids }).then(r => r.data),
  assignTrucks: (id: number, truck_ids: number[]) =>
    api.post(`/jobs/${id}/assign-trucks/`, { truck_ids }).then(r => r.data),
  changeStatus: (id: number, action: string) =>
    api.post(`/jobs/${id}/status/`, { action }).then(r => r.data),
  apply: (id: number) => api.post(`/jobs/${id}/apply/`).then(r => r.data),
  withdrawApplication: (id: number) => api.delete(`/jobs/${id}/apply/`).then(r => r.data),
  listApplications: (id: number, params?: object) =>
    api.get(`/jobs/${id}/applications/`, { params }).then(r => r.data),
  approveApplications: (id: number, approved_ids: number[], supervisor_id: number) =>
    api.post(`/jobs/${id}/approve-applications/`, { approved_ids, supervisor_id }).then(r => r.data),
}

// ─── ATTENDANCE SERVICE ──────────────────────────────────────────────
export const attendanceService = {
  generatePin: (jobId: number) =>
    api.post(`/attendance/generate-pin/${jobId}/`).then(r => r.data),
  confirm: (job_id: number, pin: string) =>
    api.post('/attendance/confirm/', { job_id, pin }).then(r => r.data),
  list: (jobId: number) => api.get(`/attendance/${jobId}/`).then(r => r.data),
  markAbsent: (jobId: number, staff_id: number, notes: string) =>
    api.post(`/attendance/${jobId}/mark-absent/`, { staff_id, notes }).then(r => r.data),
}

// ─── BILLING SERVICE ─────────────────────────────────────────────────
export const billingService = {
  listInvoices: (params?: object) => api.get('/billing/invoices/', { params }).then(r => r.data),
  getInvoice: (id: number) => api.get(`/billing/invoices/${id}/`).then(r => r.data),
  generateInvoice: (job_id: number, due_date?: string, notes?: string) =>
    api.post('/billing/invoices/generate/', { job_id, due_date, notes }).then(r => r.data),
  updateInvoice: (id: number, data: object) =>
    api.patch(`/billing/invoices/${id}/`, data).then(r => r.data),
  pay: (id: number, amount: number, method: string, notes?: string) =>
    api.post(`/billing/invoices/${id}/pay/`, { amount, method, notes }).then(r => r.data),
  disburse: (id: number) =>
    api.post(`/billing/invoices/${id}/disburse/`).then(r => r.data),
  listPayments: (params?: object) => api.get('/billing/payments/', { params }).then(r => r.data),
  listDisbursements: (params?: object) =>
    api.get('/billing/disbursements/', { params }).then(r => r.data),
}

// ─── REVIEW SERVICE ──────────────────────────────────────────────────
export const reviewService = {
  list: (params?: object) => api.get('/reviews/', { params }).then(r => r.data),
  myReviews: () => api.get('/reviews/my-reviews/').then(r => r.data),
  staffSummary: (staffId: number) =>
    api.get(`/reviews/staff/${staffId}/summary/`).then(r => r.data),
  jobReviews: (jobId: number) => api.get(`/reviews/job/${jobId}/`).then(r => r.data),
  create: (data: object) => api.post('/reviews/create/', data).then(r => r.data),
  bulkCreate: (job_id: number, reviews: object[]) =>
    api.post('/reviews/bulk-create/', { job_id, reviews }).then(r => r.data),
}

// ─── NOTIFICATION SERVICE ────────────────────────────────────────────
export const notificationService = {
  list: (params?: object) => api.get('/notifications/', { params }).then(r => r.data),
  unreadCount: () => api.get('/notifications/unread-count/').then(r => r.data),
  markAllRead: () => api.post('/notifications/mark-all-read/').then(r => r.data),
  markRead: (id: number) => api.patch(`/notifications/${id}/read/`).then(r => r.data),
}

// ─── REPORT SERVICE ──────────────────────────────────────────────────
export const reportService = {
  dashboard: (params?: Record<string, any>) =>
    api.get('/reports/dashboard/', { params }).then(r => r.data),
  jobs: (params?: Record<string, any>) =>
    api.get('/reports/jobs/', { params }).then(r => r.data),
  billing: (params?: Record<string, any>) =>
    api.get('/reports/billing/', { params }).then(r => r.data),
  staffPerformance: (params?: Record<string, any>) =>
    api.get('/reports/staff-performance/', { params }).then(r => r.data),
  fleet: (params?: Record<string, any>) =>
    api.get('/reports/fleet/', { params }).then(r => r.data),
  attendance: (params?: Record<string, any>) =>
    api.get('/reports/attendance/', { params }).then(r => r.data),
  applications: (params?: Record<string, any>) =>
    api.get('/reports/applications/', { params }).then(r => r.data),
}
