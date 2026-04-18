'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { reportService, jobService, userService } from '@/lib/services'
import { StatsCard } from '@/components/ui/StatsCard'
import { PageLoader } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import type { DashboardReport, Job, User } from '@/types'

// Modals (inline — avoid separate modal components for simple forms)
import { Modal } from '@/components/ui/Modal'

// ── Quick-action sub-modals ──────────────────────────────────────────
function CreateJobModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<{ id: number; full_name: string }[]>([])
  const [form, setForm] = useState({ title: '', customer: '', move_size: 'one_bedroom', pickup_address: '', dropoff_address: '', estimated_distance_km: '', scheduled_date: '', requested_staff_count: 10, requested_truck_count: 1, notes: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      import('@/lib/services').then(({ customerService }) => {
        customerService.list({ page_size: 100 }).then((d: any) => setCustomers(d.results || d))
      })
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    try {
      const { jobService } = await import('@/lib/services')
      await jobService.create({ ...form, customer: parseInt(form.customer), estimated_distance_km: parseFloat(form.estimated_distance_km) })
      toast.success('Job Created', 'New job has been added successfully.')
      onSuccess(); onClose()
    } catch (err: any) {
      const data = err.response?.data || {}
      const fieldErrors: Record<string, string> = {}
      Object.entries(data).forEach(([k, v]) => { fieldErrors[k] = Array.isArray(v) ? v.join(' ') : String(v) })
      setErrors(fieldErrors)
      toast.error('Failed to Create Job', fieldErrors.error || Object.values(fieldErrors)[0] || 'Something went wrong.')
    } finally { setLoading(false) }
  }

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <Modal open={open} onClose={onClose} title="Create New Job" size="lg"
      footer={<>
        <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
        <button className="btn btn-primary" onClick={e => handleSubmit(e as any)} disabled={loading}>
          {loading && <span className="spinner spinner-sm" />} Create Job
        </button>
      </>}
    >
      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ gridColumn: '1/-1' }}>
          <label className="form-label">Job Title *</label>
          <input className="form-input" value={form.title} onChange={f('title')} placeholder="e.g. Westlands to Karen Move" required disabled={loading} />
          {errors.title && <div className="field-error">{errors.title}</div>}
        </div>
        <div>
          <label className="form-label">Customer *</label>
          <select className="form-select" value={form.customer} onChange={f('customer')} required disabled={loading}>
            <option value="">Select customer</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
          {errors.customer && <div className="field-error">{errors.customer}</div>}
        </div>
        <div>
          <label className="form-label">Move Size</label>
          <select className="form-select" value={form.move_size} onChange={f('move_size')} disabled={loading}>
            {[['studio', 'Studio'], ['one_bedroom', '1 Bedroom'], ['two_bedroom', '2 Bedroom'], ['three_bedroom', '3 Bedroom'], ['office_small', 'Small Office'], ['office_large', 'Large Office']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Pickup Address *</label>
          <input className="form-input" value={form.pickup_address} onChange={f('pickup_address')} placeholder="From location" required disabled={loading} />
        </div>
        <div>
          <label className="form-label">Dropoff Address *</label>
          <input className="form-input" value={form.dropoff_address} onChange={f('dropoff_address')} placeholder="To location" required disabled={loading} />
        </div>
        <div>
          <label className="form-label">Distance (km) *</label>
          <input type="number" className="form-input" value={form.estimated_distance_km} onChange={f('estimated_distance_km')} placeholder="e.g. 25" required disabled={loading} min="0" step="0.1" />
        </div>
        <div>
          <label className="form-label">Scheduled Date *</label>
          <input type="date" className="form-input" value={form.scheduled_date} onChange={f('scheduled_date')} required disabled={loading} />
        </div>
        <div>
          <label className="form-label">Staff Needed</label>
          <input type="number" className="form-input" value={form.requested_staff_count} onChange={f('requested_staff_count')} min={1} disabled={loading} />
        </div>
        <div>
          <label className="form-label">Trucks Needed</label>
          <input type="number" className="form-input" value={form.requested_truck_count} onChange={f('requested_truck_count')} min={1} disabled={loading} />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" value={form.notes} onChange={f('notes') as any} placeholder="Additional notes" disabled={loading} />
        </div>
      </form>
    </Modal>
  )
}

function RegisterStaffModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', role: 'mover-staff', password: '', password_confirm: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.password_confirm) { setErrors({ password_confirm: 'Passwords do not match.' }); return }
    setLoading(true); setErrors({})
    try {
      const { authService } = await import('@/lib/services')
      await authService.register(form)
      toast.success('Staff Registered', `${form.first_name} ${form.last_name} has been added.`)
      onSuccess(); onClose()
    } catch (err: any) {
      const data = err.response?.data || {}
      const fieldErrors: Record<string, string> = {}
      Object.entries(data).forEach(([k, v]) => { fieldErrors[k] = Array.isArray(v) ? v.join(' ') : String(v) })
      setErrors(fieldErrors)
      toast.error('Registration Failed', Object.values(fieldErrors)[0] || 'Something went wrong.')
    } finally { setLoading(false) }
  }

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <Modal open={open} onClose={onClose} title="Register Staff Member" size="md"
      footer={<>
        <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
        <button className="btn btn-primary" onClick={e => handleSubmit(e as any)} disabled={loading}>
          {loading && <span className="spinner spinner-sm" />} Register
        </button>
      </>}
    >
      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div><label className="form-label">First Name *</label><input className="form-input" value={form.first_name} onChange={f('first_name')} required disabled={loading} />{errors.first_name && <div className="field-error">{errors.first_name}</div>}</div>
        <div><label className="form-label">Last Name *</label><input className="form-input" value={form.last_name} onChange={f('last_name')} required disabled={loading} /></div>
        <div style={{ gridColumn: '1/-1' }}><label className="form-label">Email *</label><input type="email" className="form-input" value={form.email} onChange={f('email')} required disabled={loading} />{errors.email && <div className="field-error">{errors.email}</div>}</div>
        <div><label className="form-label">Phone</label><input type="tel" className="form-input" value={form.phone} onChange={f('phone')} placeholder="+254..." disabled={loading} /></div>
        <div><label className="form-label">Role</label><select className="form-select" value={form.role} onChange={f('role')} disabled={loading}><option value="mover-staff">Staff</option><option value="mover-admin">Admin</option></select></div>
        <div><label className="form-label">Password *</label><input type="password" className="form-input" value={form.password} onChange={f('password')} required minLength={8} disabled={loading} /></div>
        <div><label className="form-label">Confirm Password *</label><input type="password" className="form-input" value={form.password_confirm} onChange={f('password_confirm')} required disabled={loading} />{errors.password_confirm && <div className="field-error">{errors.password_confirm}</div>}</div>
      </form>
    </Modal>
  )
}

// ── Main component ───────────────────────────────────────────────────
export default function AdminDashboard() {
  const { isAdmin } = useAuth()
  const router = useRouter()
  const toast = useToast()
  const [report, setReport] = useState<DashboardReport | null>(null)
  const [recentJobs, setRecentJobs] = useState<Job[]>([])
  const [topStaff, setTopStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showJobModal, setShowJobModal] = useState(false)
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [showTruckModal, setShowTruckModal] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    if (!isAdmin) return
    setLoading(true)
    Promise.all([
      reportService.dashboard({ days: 30 }),
      jobService.list({ page_size: 5, ordering: '-created_at' }),
      reportService.staffPerformance(),
    ]).then(([dash, jobs, perf]) => {
      setReport(dash)
      setRecentJobs(jobs.results || jobs)
      setTopStaff((perf.staff || []).slice(0, 6))
    }).catch(() => toast.error('Load Error', 'Failed to load dashboard data.'))
      .finally(() => setLoading(false))
  }, [isAdmin, refresh])

  if (loading) return <PageLoader />

  const dash = report
  const unassigned = dash?.jobs?.unassigned_needing_attention ?? 0

  const scoreClass = (s: number) => s < 0.5 ? 'low' : s < 0.75 ? 'mid' : 'high'

  return (
    <div>
      {/* Unassigned alert banner */}
      {unassigned > 0 && (
        <div className="alert-banner alert-orange">
          <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '1.25rem', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong>{unassigned} job{unassigned !== 1 ? 's' : ''} need staff assignment</strong>
            <div style={{ fontSize: '0.875rem', marginTop: '0.125rem', opacity: 0.85 }}>
              Review unassigned jobs and approve applications to keep operations on track.
            </div>
          </div>
          <Link href="/dashboard/jobs?status=pending" className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
            <i className="fa-solid fa-eye" />
            View Unassigned
          </Link>
        </div>
      )}

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <StatsCard icon="fa-users" value={dash?.staff.available ?? 0} label="Available Staff" iconBg="rgba(34,197,94,0.1)" iconColor="var(--color-success)" />
        <StatsCard icon="fa-truck" value={dash?.fleet.available ?? 0} label="Available Trucks" iconBg="rgba(59,130,246,0.1)" iconColor="var(--color-info)" />
        <StatsCard icon="fa-clipboard-list" value={dash?.jobs.total ?? 0} label="Total Jobs" iconBg="rgba(232,69,10,0.1)" iconColor="var(--color-orange)" />
        <StatsCard icon="fa-file-invoice-dollar" value={`KES ${parseInt(dash?.billing.total_outstanding || '0').toLocaleString()}`} label="Outstanding" iconBg="rgba(245,158,11,0.1)" iconColor="var(--color-warning)" />
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { icon: 'fa-plus', label: 'Create Job', color: 'var(--color-orange)', onClick: () => setShowJobModal(true) },
          { icon: 'fa-user-plus', label: 'Register Staff', color: 'var(--color-info)', onClick: () => setShowStaffModal(true) },
          { icon: 'fa-truck', label: 'Add Truck', color: 'var(--color-success)', onClick: () => router.push('/dashboard/fleet') },
          { icon: 'fa-file-invoice', label: 'Generate Invoice', color: 'var(--color-warning)', onClick: () => router.push('/dashboard/billing') },
        ].map(action => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="card"
            style={{
              padding: '1.25rem', textAlign: 'center', cursor: 'pointer',
              border: 'none', background: 'white', transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
          >
            <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.625rem', background: `${action.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', fontSize: '1.125rem', color: action.color }}>
              <i className={`fa-solid ${action.icon}`} />
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--color-navy)' }}>
              {action.label}
            </div>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Recent Jobs */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><i className="fa-solid fa-truck-moving" style={{ marginRight: '0.5rem', color: 'var(--color-orange)' }} />Recent Jobs</span>
            <Link href="/dashboard/jobs" className="btn btn-ghost btn-sm">View All <i className="fa-solid fa-arrow-right" /></Link>
          </div>
          <div>
            {recentJobs.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No jobs yet</div>
            ) : (
              recentJobs.map(job => (
                <Link key={job.id} href={`/dashboard/jobs/${job.id}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--color-gray-mid)', textDecoration: 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-gray-light)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-navy)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>{job.customer_detail?.full_name} &bull; {job.scheduled_date}</div>
                  </div>
                  <Badge status={job.status} label={job.status_display} />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Staff Overview */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><i className="fa-solid fa-id-badge" style={{ marginRight: '0.5rem', color: 'var(--color-orange)' }} />Staff Overview</span>
            <Link href="/dashboard/staff-management" className="btn btn-ghost btn-sm">View All <i className="fa-solid fa-arrow-right" /></Link>
          </div>
          <div style={{ padding: '0.75rem 1.25rem' }}>
            {topStaff.length === 0 ? (
              <div style={{ padding: '1.25rem 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>No staff data</div>
            ) : (
              topStaff.map((s, i) => {
                const score = parseFloat(s.recommendation_score || '0')
                const pct = Math.round(score * 100)
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.625rem 0', borderBottom: i < topStaff.length - 1 ? '1px solid var(--color-gray-mid)' : 'none' }}>
                    <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: 'var(--color-navy)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>
                      {s.full_name?.[0] || 'U'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.full_name}</div>
                      <div style={{ marginTop: '0.25rem' }}>
                        <div className="score-bar-track">
                          <div className={`score-bar-fill ${scoreClass(score)}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                    <Badge status={s.is_available ? 'available' : 'on_job'} label={s.is_available ? 'Available' : 'On Job'} />
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateJobModal open={showJobModal} onClose={() => setShowJobModal(false)} onSuccess={() => setRefresh(r => r + 1)} />
      <RegisterStaffModal open={showStaffModal} onClose={() => setShowStaffModal(false)} onSuccess={() => setRefresh(r => r + 1)} />
    </div>
  )
}
