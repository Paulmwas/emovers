import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — attach access token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Response interceptor — auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        if (!refresh) throw new Error('No refresh token')
        const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh })
        localStorage.setItem('access_token', data.access)
        if (original.headers) original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/auth/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/token/', { email, password }),
  register: (data: object) =>
    api.post('/auth/register/', data),
  me: () =>
    api.get('/auth/me/'),
  updateMe: (data: object) =>
    api.patch('/auth/me/', data),
  changePassword: (old_password: string, new_password: string) =>
    api.post('/auth/change-password/', { old_password, new_password }),
}

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  list: (params?: object) =>
    api.get('/accounts/users/', { params }),
  availableStaff: () =>
    api.get('/accounts/users/', { params: { role: 'mover-staff', is_available: true } }),
  deactivate: (id: number) =>
    api.post(`/accounts/users/${id}/deactivate/`),
}

// ── Customers ─────────────────────────────────────────────────────────────────
export const customersApi = {
  list: (params?: object) =>
    api.get('/customers/', { params }),
  create: (data: object) =>
    api.post('/customers/', data),
  update: (id: number, data: object) =>
    api.patch(`/customers/${id}/`, data),
  delete: (id: number) =>
    api.delete(`/customers/${id}/`),
}

// ── Jobs ──────────────────────────────────────────────────────────────────────
export const jobsApi = {
  list: (params?: object) =>
    api.get('/jobs/', { params }),
  create: (data: object) =>
    api.post('/jobs/', data),
  detail: (id: number) =>
    api.get(`/jobs/${id}/`),
  delete: (id: number) =>
    api.delete(`/jobs/${id}/`),
  unassigned: () =>
    api.get('/jobs/unassigned/'),
  autoAllocate: (id: number, data: object) =>
    api.post(`/jobs/${id}/auto-allocate/`, data),
  assignStaff: (id: number, staffIds: number[]) =>
    api.post(`/jobs/${id}/assign-staff/`, { staff_ids: staffIds }),
  assignTrucks: (id: number, truckIds: number[]) =>
    api.post(`/jobs/${id}/assign-trucks/`, { truck_ids: truckIds }),
  transition: (id: number, action: 'start' | 'complete' | 'cancel') =>
    api.post(`/jobs/${id}/${action}/`),
}

// ── Fleet ─────────────────────────────────────────────────────────────────────
export const fleetApi = {
  list: (params?: object) =>
    api.get('/fleet/', { params }),
  create: (data: object) =>
    api.post('/fleet/', data),
  update: (id: number, data: object) =>
    api.patch(`/fleet/${id}/`, data),
  delete: (id: number) =>
    api.delete(`/fleet/${id}/`),
  available: () =>
    api.get('/fleet/', { params: { status: 'available' } }),
}

// ── Billing ───────────────────────────────────────────────────────────────────
export const billingApi = {
  invoices: (params?: object) =>
    api.get('/billing/invoices/', { params }),
  invoiceDetail: (id: number) =>
    api.get(`/billing/invoices/${id}/`),
  generateInvoice: (data: object) =>
    api.post('/billing/generate-invoice/', data),
  pay: (id: number, data: object) =>
    api.post(`/billing/invoices/${id}/pay/`, data),
}

// ── Reviews ───────────────────────────────────────────────────────────────────
export const reviewsApi = {
  list: (params?: object) =>
    api.get('/reviews/', { params }),
  myReviews: () =>
    api.get('/reviews/my-reviews/'),
  bulkCreate: (data: object) =>
    api.post('/reviews/bulk/', data),
}

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsApi = {
  dashboard: (days = 30) =>
    api.get('/reports/dashboard/', { params: { days } }),
  jobs: (days = 30) =>
    api.get('/reports/jobs/', { params: { days } }),
  billing: (days = 30) =>
    api.get('/reports/billing/', { params: { days } }),
  staffPerformance: () =>
    api.get('/reports/staff-performance/'),
  fleet: () =>
    api.get('/reports/fleet/'),
}
