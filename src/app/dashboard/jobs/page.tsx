'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { jobService, customerService } from '@/lib/services'
import { Badge } from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/Spinner'
import { Pagination } from '@/components/ui/Pagination'
import { ConfirmModal, Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Job, Customer } from '@/types'

const STATUSES = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled']
const MOVE_SIZES = [['studio', 'Studio'], ['one_bedroom', '1 Bed'], ['two_bedroom', '2 Bed'], ['three_bedroom', '3 Bed'], ['four_bedroom', '4 Bed'], ['five_bedroom', '5 Bed'], ['six_bedroom', '6 Bed'], ['office_small', 'Sm. Office'], ['office_large', 'Lg. Office']]

const EMPTY_FORM = {
  title: '',
  customer: '',
  move_size: 'one_bedroom',
  pickup_address: '',
  dropoff_address: '',
  estimated_distance_km: '',
  scheduled_date: '',
  scheduled_time: '',
  requested_staff_count: '4',
  requested_truck_count: '1',
  application_deadline: '',
  max_applicants: '',
  notes: '',
  special_instructions: '',
}

function CreateJobModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const toast = useToast()
  const [form, setForm] = useState(EMPTY_FORM)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [customersLoading, setCustomersLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    setForm(EMPTY_FORM)
    setErrors({})
    setCustomersLoading(true)
    customerService.list({ page_size: 200 })
      .then(d => setCustomers(d.results || d))
      .catch(() => {})
      .finally(() => setCustomersLoading(false))
  }, [open])

  const f = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async () => {
    const required = ['title', 'customer', 'move_size', 'pickup_address', 'dropoff_address', 'estimated_distance_km', 'scheduled_date']
    const errs: Record<string, string> = {}
    required.forEach(k => { if (!form[k as keyof typeof form]) errs[k] = 'This field is required.' })
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true); setErrors({})
    const payload: Record<string, any> = {
      title: form.title,
      customer: parseInt(form.customer),
      move_size: form.move_size,
      pickup_address: form.pickup_address,
      dropoff_address: form.dropoff_address,
      estimated_distance_km: form.estimated_distance_km,
      scheduled_date: form.scheduled_date,
      requested_staff_count: parseInt(form.requested_staff_count) || 4,
      requested_truck_count: parseInt(form.requested_truck_count) || 1,
    }
    if (form.scheduled_time) payload.scheduled_time = form.scheduled_time
    if (form.application_deadline) payload.application_deadline = form.application_deadline
    if (form.max_applicants) payload.max_applicants = parseInt(form.max_applicants)
    if (form.notes) payload.notes = form.notes
    if (form.special_instructions) payload.special_instructions = form.special_instructions

    try {
      await jobService.create(payload)
      toast.success('Job Created', `"${form.title}" has been created.`)
      onSuccess()
      onClose()
    } catch (err: any) {
      const data = err.response?.data || {}
      const fe: Record<string, string> = {}
      Object.entries(data).forEach(([k, v]) => { fe[k] = Array.isArray(v) ? v.join(' ') : String(v) })
      setErrors(fe)
      toast.error('Failed', Object.values(fe)[0] || 'Could not create job.')
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create New Job" size="lg"
      footer={<>
        <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading && <span className="spinner spinner-sm" />}Create Job
        </button>
      </>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label className="form-label">Job Title *</label>
          <input className="form-input" value={form.title} onChange={f('title')} placeholder="e.g. 3-Bedroom Move — Westlands to Karen" disabled={loading} />
          {errors.title && <div className="field-error">{errors.title}</div>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label className="form-label">Customer *</label>
            <select className="form-select" value={form.customer} onChange={f('customer')} disabled={loading || customersLoading}>
              <option value="">Select customer…</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.full_name || `${c.first_name} ${c.last_name}`}</option>)}
            </select>
            {errors.customer && <div className="field-error">{errors.customer}</div>}
          </div>
          <div>
            <label className="form-label">Move Size *</label>
            <select className="form-select" value={form.move_size} onChange={f('move_size')} disabled={loading}>
              {MOVE_SIZES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="form-label">Pickup Address *</label>
          <input className="form-input" value={form.pickup_address} onChange={f('pickup_address')} placeholder="Street, Area, Nairobi" disabled={loading} />
          {errors.pickup_address && <div className="field-error">{errors.pickup_address}</div>}
        </div>

        <div>
          <label className="form-label">Drop-off Address *</label>
          <input className="form-input" value={form.dropoff_address} onChange={f('dropoff_address')} placeholder="Street, Area, Nairobi" disabled={loading} />
          {errors.dropoff_address && <div className="field-error">{errors.dropoff_address}</div>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label className="form-label">Distance (km) *</label>
            <input type="number" className="form-input" value={form.estimated_distance_km} onChange={f('estimated_distance_km')} placeholder="0.00" min="0" step="0.01" disabled={loading} />
            {errors.estimated_distance_km && <div className="field-error">{errors.estimated_distance_km}</div>}
          </div>
          <div>
            <label className="form-label">Scheduled Date *</label>
            <input type="date" className="form-input" value={form.scheduled_date} onChange={f('scheduled_date')} disabled={loading} />
            {errors.scheduled_date && <div className="field-error">{errors.scheduled_date}</div>}
          </div>
          <div>
            <label className="form-label">Scheduled Time</label>
            <input type="time" className="form-input" value={form.scheduled_time} onChange={f('scheduled_time')} disabled={loading} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label className="form-label">Staff Needed</label>
            <input type="number" className="form-input" value={form.requested_staff_count} onChange={f('requested_staff_count')} min="1" disabled={loading} />
          </div>
          <div>
            <label className="form-label">Trucks Needed</label>
            <input type="number" className="form-input" value={form.requested_truck_count} onChange={f('requested_truck_count')} min="1" disabled={loading} />
          </div>
          <div>
            <label className="form-label">Max Applicants</label>
            <input type="number" className="form-input" value={form.max_applicants} onChange={f('max_applicants')} min="1" placeholder="No limit" disabled={loading} />
          </div>
          <div>
            <label className="form-label">Application Deadline</label>
            <input type="datetime-local" className="form-input" value={form.application_deadline} onChange={f('application_deadline')} disabled={loading} />
          </div>
        </div>

        <div>
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" value={form.notes} onChange={f('notes')} placeholder="Internal notes…" style={{ minHeight: '3.5rem' }} disabled={loading} />
        </div>

        <div>
          <label className="form-label">Special Instructions</label>
          <textarea className="form-textarea" value={form.special_instructions} onChange={f('special_instructions')} placeholder="Instructions for the team on the day…" style={{ minHeight: '3.5rem' }} disabled={loading} />
        </div>

        {errors.non_field_errors && <div className="field-error">{errors.non_field_errors}</div>}
        {errors.error && <div className="field-error">{errors.error}</div>}
      </div>
    </Modal>
  )
}

export default function JobsPage() {
  const { isAdmin } = useAuth()
  const toast = useToast()
  const searchParams = useSearchParams()

  const [jobs, setJobs] = useState<Job[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'open' | 'mine'>('open')
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    move_size: '',
    search: '',
    scheduled_date_after: '',
    scheduled_date_before: '',
  })
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [allocating, setAllocating] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [refresh, setRefresh] = useState(0)

  // Listen for the openCreateJob event dispatched from the header button
  useEffect(() => {
    const handler = () => setShowCreate(true)
    document.addEventListener('openCreateJob', handler)
    return () => document.removeEventListener('openCreateJob', handler)
  }, [])

  useEffect(() => {
    setLoading(true)
    const params: Record<string, any> = { page, page_size: 15 }
    if (isAdmin) {
      if (filters.status) params.status = filters.status
      if (filters.move_size) params.move_size = filters.move_size
      if (filters.search) params.search = filters.search
      if (filters.scheduled_date_after) params.scheduled_date_after = filters.scheduled_date_after
      if (filters.scheduled_date_before) params.scheduled_date_before = filters.scheduled_date_before
    } else {
      if (tab === 'open') params.status = 'pending'
    }
    jobService.list(params).then(data => {
      setJobs(data.results || data)
      setTotal(data.count || (data.results || data).length)
    }).catch(() => toast.error('Load Error', 'Failed to load jobs.'))
      .finally(() => setLoading(false))
  }, [page, filters, tab, refresh, isAdmin])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await jobService.delete(deleteTarget.id)
      toast.success('Job Deleted', `"${deleteTarget.title}" has been deleted.`)
      setDeleteTarget(null)
      setRefresh(r => r + 1)
    } catch (err: any) {
      toast.error('Delete Failed', err.response?.data?.error || 'Could not delete job.')
    } finally { setDeleteLoading(false) }
  }

  const handleAutoAllocate = async (job: Job) => {
    setAllocating(job.id)
    try {
      await jobService.autoAllocate(job.id)
      toast.success('Auto-Allocated', `Staff and trucks assigned to "${job.title}".`)
      setRefresh(r => r + 1)
    } catch (err: any) {
      toast.error('Auto-Allocate Failed', err.response?.data?.error || 'Not enough available staff or trucks.')
    } finally { setAllocating(null) }
  }

  const updateFilter = (k: string, v: string) => { setFilters(p => ({ ...p, [k]: v })); setPage(1) }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Jobs</h1>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{total} total jobs</div>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <i className="fa-solid fa-plus" />New Job
          </button>
        )}
      </div>

      {/* Staff tabs */}
      {!isAdmin && (
        <div className="tab-bar" style={{ marginBottom: '1.25rem' }}>
          <button className={`tab-btn${tab === 'open' ? ' active' : ''}`} onClick={() => { setTab('open'); setPage(1) }}>
            <i className="fa-solid fa-list" />Open Jobs
          </button>
          <button className={`tab-btn${tab === 'mine' ? ' active' : ''}`} onClick={() => { setTab('mine'); setPage(1) }}>
            <i className="fa-solid fa-user-check" />My Jobs
          </button>
        </div>
      )}

      {/* Admin filters */}
      {isAdmin && (
        <div className="filter-bar">
          <input
            className="form-input"
            style={{ width: '220px' }}
            placeholder="Search jobs..."
            value={filters.search}
            onChange={e => updateFilter('search', e.target.value)}
          />
          <select className="form-select" style={{ width: '150px' }} value={filters.status} onChange={e => updateFilter('status', e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <select className="form-select" style={{ width: '150px' }} value={filters.move_size} onChange={e => updateFilter('move_size', e.target.value)}>
            <option value="">All Sizes</option>
            {MOVE_SIZES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <input type="date" className="form-input" style={{ width: '160px' }} value={filters.scheduled_date_after} onChange={e => updateFilter('scheduled_date_after', e.target.value)} placeholder="From date" />
          <input type="date" className="form-input" style={{ width: '160px' }} value={filters.scheduled_date_before} onChange={e => updateFilter('scheduled_date_before', e.target.value)} placeholder="To date" />
          {Object.values(filters).some(Boolean) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setFilters({ status: '', move_size: '', search: '', scheduled_date_after: '', scheduled_date_before: '' }); setPage(1) }}>
              <i className="fa-solid fa-xmark" />Clear
            </button>
          )}
        </div>
      )}

      <div className="card">
        {loading ? (
          <PageLoader />
        ) : jobs.length === 0 ? (
          <EmptyState
            icon="fa-truck-moving"
            title="No Jobs Found"
            description={isAdmin ? 'Create your first job to get started.' : 'No jobs match the current filters.'}
            action={isAdmin ? <button className="btn btn-primary" onClick={() => setShowCreate(true)}><i className="fa-solid fa-plus" />New Job</button> : undefined}
          />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Job</th>
                    {isAdmin && <th>Customer</th>}
                    <th>Size</th>
                    <th>Date</th>
                    <th>Status</th>
                    {isAdmin && <th>Staff</th>}
                    {isAdmin && <th>Trucks</th>}
                    <th style={{ width: '140px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(job => (
                    <tr key={job.id}>
                      <td>
                        <Link href={`/dashboard/jobs/${job.id}`} style={{ fontWeight: 600, color: 'var(--color-navy)', textDecoration: 'none' }}>
                          {job.title}
                        </Link>
                        <div style={{ fontSize: '0.775rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>
                          {job.pickup_address?.split(',')[0]} &rarr; {job.dropoff_address?.split(',')[0]}
                        </div>
                      </td>
                      {isAdmin && <td style={{ fontSize: '0.875rem' }}>{job.customer_detail?.full_name}</td>}
                      <td><Badge status={job.move_size} label={job.move_size_display} /></td>
                      <td style={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}>{job.scheduled_date}</td>
                      <td><Badge status={job.status} label={job.status_display} /></td>
                      {isAdmin && <td style={{ fontSize: '0.875rem' }}>{job.assigned_staff_count}/{job.requested_staff_count}</td>}
                      {isAdmin && <td style={{ fontSize: '0.875rem' }}>{job.assigned_truck_count}/{job.requested_truck_count}</td>}
                      <td>
                        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                          <Link href={`/dashboard/jobs/${job.id}`} className="btn btn-ghost btn-sm">
                            <i className="fa-solid fa-eye" />
                          </Link>
                          {isAdmin && job.status === 'pending' && job.assigned_staff_count === 0 && (
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => handleAutoAllocate(job)}
                              disabled={allocating === job.id}
                              title="Auto-Allocate"
                            >
                              {allocating === job.id ? <span className="spinner spinner-sm" /> : <i className="fa-solid fa-wand-magic-sparkles" />}
                            </button>
                          )}
                          {isAdmin && !['completed', 'cancelled'].includes(job.status) && (
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => setDeleteTarget(job)}>
                              <i className="fa-solid fa-trash" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageSize={15} total={total} onChange={setPage} />
          </>
        )}
      </div>

      <CreateJobModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => setRefresh(r => r + 1)}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Job"
        message={<>Are you sure you want to delete <strong>&ldquo;{deleteTarget?.title}&rdquo;</strong>? This action cannot be undone.</>}
        confirmLabel="Delete Job"
        danger
        loading={deleteLoading}
      />
    </div>
  )
}
