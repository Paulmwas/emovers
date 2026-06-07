'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { jobService, attendanceService, billingService, reviewService } from '@/lib/services'
import { Badge } from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/Spinner'
import { ConfirmModal, Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Job, JobApplication, AttendanceRecord, Invoice, StaffReview } from '@/types'

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="star-rating">
      {[1,2,3,4,5].map(s => (
        <i key={s} className={`fa-solid fa-star${s > rating ? ' star-empty' : ''}`} />
      ))}
    </span>
  )
}

// ── Approve Applications Modal ───────────────────────────────────────
function ApproveModal({ open, onClose, applications, onApprove }: {
  open: boolean; onClose: () => void;
  applications: JobApplication[];
  onApprove: (approvedIds: number[], supervisorId: number) => Promise<void>;
}) {
  const [approved, setApproved] = useState<Set<number>>(new Set())
  const [supervisor, setSupervisor] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggle = (id: number) => setApproved(prev => {
    const s = new Set(prev)
    if (s.has(id)) { s.delete(id); if (supervisor === id) setSupervisor(null) }
    else s.add(id)
    return s
  })

  const handleConfirm = async () => {
    if (!supervisor) { setError('Please select a Team Lead.'); return }
    if (!approved.has(supervisor)) { setError('Team Lead must be in the approved set.'); return }
    if (approved.size === 0) { setError('Select at least one staff member.'); return }
    setLoading(true); setError('')
    try { await onApprove(Array.from(approved), supervisor) }
    catch (e: any) { setError(e.message || 'Failed to approve.') }
    finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Approve Applications" size="lg"
      footer={<>
        <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
        <button className="btn btn-primary" onClick={handleConfirm} disabled={loading || approved.size === 0}>
          {loading && <span className="spinner spinner-sm" />}Approve & Assign
        </button>
      </>}
    >
      {error && <div style={{ marginBottom: '1rem', color: 'var(--color-danger)', fontSize: '0.875rem', background: 'rgba(239,68,68,0.08)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>{error}</div>}
      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
        Select staff to approve and designate one as Team Lead.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {applications.map(app => (
          <div key={app.id} style={{
            display: 'flex', alignItems: 'center', gap: '1rem',
            padding: '0.875rem 1rem', borderRadius: 'var(--radius-sm)',
            border: `1.5px solid ${approved.has(app.staff) ? 'var(--color-orange)' : 'var(--color-gray-mid)'}`,
            background: approved.has(app.staff) ? 'rgba(232,69,10,0.04)' : 'white',
            cursor: 'pointer',
          }} onClick={() => toggle(app.staff)}>
            <input type="checkbox" checked={approved.has(app.staff)} onChange={() => toggle(app.staff)} style={{ width: '1rem', height: '1rem', accentColor: 'var(--color-orange)' }} />
            <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: 'var(--color-navy)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>
              {app.staff_name?.[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-navy)' }}>{app.staff_name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>{app.staff_email}</div>
            </div>
            {approved.has(app.staff) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}>
                  <input type="radio" name="supervisor" checked={supervisor === app.staff} onChange={() => setSupervisor(app.staff)} style={{ accentColor: 'var(--color-orange)' }} />
                  <i className="fa-solid fa-crown" style={{ color: 'var(--color-yellow)' }} /> Team Lead
                </label>
              </div>
            )}
          </div>
        ))}
      </div>
    </Modal>
  )
}

// ── Star Picker ──────────────────────────────────────────────────────
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="star-picker">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button" className={s <= value ? 'filled' : ''} onClick={() => onChange(s)}>
          <i className="fa-solid fa-star" />
        </button>
      ))}
    </div>
  )
}

// ── Review Form Modal ─────────────────────────────────────────────────
function ReviewFormModal({ open, onClose, job, onSuccess }: { open: boolean; onClose: () => void; job: Job; onSuccess: () => void }) {
  const toast = useToast()
  const CATS = ['overall', 'punctuality', 'teamwork', 'care_of_goods', 'physical_fitness', 'communication']
  const movers = job.assignments.filter(a => a.role === 'mover')
  const [reviews, setReviews] = useState<Record<number, Record<string, { rating: number; comment: string }>>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const init: typeof reviews = {}
    movers.forEach(m => {
      init[m.staff] = {}
      CATS.forEach(c => { init[m.staff][c] = { rating: 0, comment: '' } })
    })
    setReviews(init)
  }, [open])

  const setRating = (staffId: number, cat: string, v: number) =>
    setReviews(p => ({ ...p, [staffId]: { ...p[staffId], [cat]: { ...p[staffId][cat], rating: v } } }))
  const setComment = (staffId: number, cat: string, v: string) =>
    setReviews(p => ({ ...p, [staffId]: { ...p[staffId], [cat]: { ...p[staffId][cat], comment: v } } }))

  const handleSubmit = async () => {
    const payload: object[] = []
    Object.entries(reviews).forEach(([staffId, cats]) => {
      Object.entries(cats).forEach(([cat, data]) => {
        if (data.rating > 0) payload.push({ reviewee_id: parseInt(staffId), category: cat, rating: data.rating, comment: data.comment })
      })
    })
    if (payload.length === 0) { toast.warning('No Ratings', 'Please rate at least one category.'); return }
    setLoading(true)
    try {
      await reviewService.bulkCreate(job.id, payload)
      toast.success('Reviews Submitted', 'All reviews have been saved.')
      onSuccess(); onClose()
    } catch (err: any) {
      toast.error('Submit Failed', err.response?.data?.error || 'Could not submit reviews.')
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Submit Reviews" size="xl"
      footer={<>
        <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading && <span className="spinner spinner-sm" />}Submit All Reviews
        </button>
      </>}
    >
      {movers.length === 0 ? (
        <EmptyState icon="fa-users" title="No Movers" description="No movers assigned to this job." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {movers.map(m => (
            <div key={m.staff} style={{ borderBottom: '1px solid var(--color-gray-mid)', paddingBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: 'var(--color-navy)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
                  {m.staff_name?.[0]}
                </div>
                <div style={{ fontWeight: 700, color: 'var(--color-navy)' }}>{m.staff_name}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {CATS.map(cat => (
                  <div key={cat}>
                    <label className="form-label">{cat.replace(/_/g, ' ')}</label>
                    <StarPicker value={reviews[m.staff]?.[cat]?.rating || 0} onChange={v => setRating(m.staff, cat, v)} />
                    <input
                      className="form-input"
                      style={{ marginTop: '0.375rem' }}
                      placeholder="Optional comment"
                      value={reviews[m.staff]?.[cat]?.comment || ''}
                      onChange={e => setComment(m.staff, cat, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

// ── Payment Modal ─────────────────────────────────────────────────────
function PaymentModal({ invoiceId, maxAmount, open, onClose, onSuccess }: { invoiceId: number; maxAmount: number; open: boolean; onClose: () => void; onSuccess: () => void }) {
  const toast = useToast()
  const [form, setForm] = useState({ amount: '', method: 'mpesa', notes: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    const amt = parseFloat(form.amount)
    if (!amt || amt <= 0 || amt > maxAmount) { toast.warning('Invalid Amount', `Amount must be between 1 and KES ${maxAmount.toLocaleString()}.`); return }
    setLoading(true)
    try {
      await billingService.pay(invoiceId, amt, form.method, form.notes)
      toast.success('Payment Recorded', `KES ${amt.toLocaleString()} recorded successfully.`)
      onSuccess(); onClose()
    } catch (err: any) {
      toast.error('Payment Failed', err.response?.data?.error || 'Could not record payment.')
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Record Payment" size="sm"
      footer={<>
        <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !form.amount}>
          {loading && <span className="spinner spinner-sm" />}Record Payment
        </button>
      </>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label className="form-label">Amount (KES) — max {maxAmount.toLocaleString()}</label>
          <input type="number" className="form-input" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} max={maxAmount} min={1} step={0.01} placeholder="0.00" disabled={loading} />
        </div>
        <div>
          <label className="form-label">Payment Method</label>
          <select className="form-select" value={form.method} onChange={e => setForm(p => ({ ...p, method: e.target.value }))} disabled={loading}>
            <option value="cash">Cash</option>
            <option value="mpesa">M-Pesa</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="card">Card</option>
          </select>
        </div>
        <div>
          <label className="form-label">Notes (optional)</label>
          <textarea className="form-textarea" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Reference number, etc." disabled={loading} style={{ minHeight: '3.5rem' }} />
        </div>
      </div>
    </Modal>
  )
}

// ── Main page ─────────────────────────────────────────────────────────
export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { isAdmin, user } = useAuth()
  const toast = useToast()
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [invoiceError, setInvoiceError] = useState(false)
  const [reviews, setReviews] = useState<StaffReview[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [actionLoading, setActionLoading] = useState(false)
  const [showApprove, setShowApprove] = useState(false)
  const [showReviews, setShowReviews] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [showDisburse, setShowDisburse] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [showChangeSupervisor, setShowChangeSupervisor] = useState(false)
  const [changeSupervisorStaffId, setChangeSupervisorStaffId] = useState<number | null>(null)
  const [changeSupervisorLoading, setChangeSupervisorLoading] = useState(false)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    const jobId = parseInt(id)
    Promise.all([
      jobService.get(jobId),
      isAdmin ? jobService.listApplications(jobId) : Promise.resolve([]),
      attendanceService.list(jobId).catch(() => []),
      billingService.listInvoices({ job: jobId }).catch(() => ({ results: [] })),
      reviewService.jobReviews(jobId).catch(() => []),
    ]).then(async ([j, apps, att, inv, revs]) => {
      setJob(j)
      setApplications(isAdmin ? (apps.results || apps) : [])
      setAttendance(att.results || att)
      const invList = inv.results || inv
      if (invList.length > 0) {
        const full = await billingService.getInvoice(invList[0].id).catch(() => invList[0])
        setInvoice(full)
      } else {
        setInvoice(null)
      }
      setReviews(revs.results || revs)
    }).catch(() => toast.error('Load Error', 'Failed to load job details.'))
      .finally(() => setLoading(false))
  }, [id, refresh])

  const doStatus = async (action: string) => {
    if (!job) return
    setActionLoading(true)
    try {
      await jobService.changeStatus(job.id, action)
      toast.success('Status Updated', `Job is now ${action === 'start' ? 'in progress' : action === 'complete' ? 'completed' : 'cancelled'}.`)
      setRefresh(r => r + 1)
    } catch (err: any) {
      toast.error('Action Failed', err.response?.data?.error || 'Could not update status.')
    } finally { setActionLoading(false) }
  }

  const handleAutoAllocate = async () => {
    if (!job) return
    setActionLoading(true)
    try {
      await jobService.autoAllocate(job.id)
      toast.success('Auto-Allocated', 'Staff and trucks have been assigned.')
      setRefresh(r => r + 1)
    } catch (err: any) {
      toast.error('Failed', err.response?.data?.error || 'Not enough resources.')
    } finally { setActionLoading(false) }
  }

  const handleDownloadPdf = async () => {
    if (!job) return
    try {
      const blob = await jobService.teamPdf(job.id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `team_${job.id}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      toast.error('Download Failed', err.response?.data?.error || 'Could not download team PDF.')
    }
  }

  const handleMarkAbsent = async (staffId: number) => {
    if (!job) return
    try {
      await attendanceService.markAbsent(job.id, staffId, 'Marked absent by admin')
      toast.success('Marked Absent', 'Staff member marked as absent.')
      setRefresh(r => r + 1)
    } catch (err: any) {
      toast.error('Failed', err.response?.data?.error || 'Could not mark absent.')
    }
  }

  const handleGenerateInvoice = async () => {
    if (!job) return
    setActionLoading(true)
    try {
      const inv = await billingService.generateInvoice(job.id)
      setInvoice(inv)
      toast.success('Invoice Generated', 'Invoice created successfully.')
      setRefresh(r => r + 1)
    } catch (err: any) {
      toast.error('Failed', err.response?.data?.error || 'Could not generate invoice.')
    } finally { setActionLoading(false) }
  }

  const handleDisburse = async () => {
    if (!invoice) return
    try {
      await billingService.disburse(invoice.id)
      toast.success('Disbursed', 'Staff payments have been disbursed.')
      setShowDisburse(false)
      setRefresh(r => r + 1)
    } catch (err: any) {
      toast.error('Failed', err.response?.data?.error || 'Could not disburse.')
    }
  }

  const handleApprove = async (approvedIds: number[], supervisorId: number) => {
    if (!job) return
    await jobService.approveApplications(job.id, approvedIds, supervisorId)
    toast.success('Applications Approved', 'Team has been assigned.')
    setShowApprove(false)
    setTab('team')
    setRefresh(r => r + 1)
  }

  const handleChangeSupervisor = async () => {
    if (!job || !changeSupervisorStaffId) return
    setChangeSupervisorLoading(true)
    try {
      await jobService.changeSupervisor(job.id, changeSupervisorStaffId)
      toast.success('Team Lead Updated', 'The supervisor has been changed.')
      setShowChangeSupervisor(false)
      setChangeSupervisorStaffId(null)
      setRefresh(r => r + 1)
    } catch (err: any) {
      toast.error('Failed', err.response?.data?.error || 'Could not change supervisor.')
    } finally { setChangeSupervisorLoading(false) }
  }

  const fmt = (v: string | number | undefined | null) => {
    const n = parseFloat(String(v ?? 0))
    return `KES ${(isNaN(n) ? 0 : n).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`
  }

  const isSupervisor = job?.assignments.some(a => a.staff === user?.id && a.role === 'supervisor')

  const TABS = [
    { key: 'overview', label: 'Overview', icon: 'fa-info-circle' },
    ...(isAdmin && job?.status === 'pending' ? [{ key: 'applications', label: `Applications (${applications.length})`, icon: 'fa-paper-plane' }] : []),
    ...(['assigned', 'in_progress', 'completed', 'cancelled'].includes(job?.status || '') ? [{ key: 'team', label: 'Team', icon: 'fa-users' }] : []),
    ...(isAdmin && ['assigned', 'in_progress'].includes(job?.status || '') ? [{ key: 'attendance', label: 'Attendance', icon: 'fa-clipboard-check' }] : []),
    { key: 'billing', label: 'Billing', icon: 'fa-file-invoice-dollar' },
    ...(job?.status === 'completed' ? [{ key: 'reviews', label: 'Reviews', icon: 'fa-star' }] : []),
  ]

  if (loading) return <PageLoader />
  if (!job) return <EmptyState icon="fa-circle-exclamation" title="Not Found" description="This job does not exist." />

  return (
    <div>
      {/* Back + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => router.push('/dashboard/jobs')}>
          <i className="fa-solid fa-arrow-left" />Back
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.375rem', marginBottom: '0.125rem' }}>{job.title}</h1>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Badge status={job.status} label={job.status_display} />
            <Badge status={job.move_size} label={job.move_size_display} />
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Job #{job.id}</span>
          </div>
        </div>
        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
          {isAdmin && job.status === 'pending' && job.assigned_staff_count === 0 && (
            <button className="btn btn-outline btn-sm" onClick={handleAutoAllocate} disabled={actionLoading}>
              <i className="fa-solid fa-wand-magic-sparkles" />Auto-Allocate
            </button>
          )}
          {(isAdmin || isSupervisor) && job.status === 'assigned' && (
            <button className="btn btn-primary btn-sm" onClick={() => doStatus('start')} disabled={actionLoading}>
              <i className="fa-solid fa-play" />Start Job
            </button>
          )}
          {(isAdmin || isSupervisor) && job.status === 'in_progress' && (
            <button className="btn btn-primary btn-sm" onClick={() => doStatus('complete')} disabled={actionLoading}>
              <i className="fa-solid fa-flag-checkered" />Complete Job
            </button>
          )}
          {isAdmin && !['completed', 'cancelled'].includes(job.status) && (
            <button className="btn btn-danger btn-sm" onClick={() => setShowCancel(true)}>
              <i className="fa-solid fa-ban" />Cancel
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {TABS.map(t => (
          <button key={t.key} className={`tab-btn${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
            <i className={`fa-solid ${t.icon}`} />{t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="card card-body">
            <div className="card-title" style={{ marginBottom: '1rem' }}>Job Details</div>
            {[
              ['Customer', job.customer_detail?.full_name],
              ['From', job.pickup_address],
              ['To', job.dropoff_address],
              ['Distance', `${job.estimated_distance_km} km`],
              ['Scheduled', `${job.scheduled_date}${job.scheduled_time ? ' at ' + job.scheduled_time : ''}`],
              ['Started', job.started_at ? new Date(job.started_at).toLocaleString('en-KE') : '—'],
              ['Completed', job.completed_at ? new Date(job.completed_at).toLocaleString('en-KE') : '—'],
              ['Created by', job.created_by_name || '—'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.625rem', fontSize: '0.9rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-navy)', minWidth: '100px', flexShrink: 0 }}>{label}</span>
                <span style={{ color: 'var(--color-text-body)' }}>{value}</span>
              </div>
            ))}
          </div>
          <div className="card card-body">
            <div className="card-title" style={{ marginBottom: '1rem' }}>Assignment Summary</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Staff Assigned</span>
                <span style={{ fontWeight: 700, color: 'var(--color-navy)' }}>{job.assigned_staff_count} / {job.requested_staff_count}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Trucks Assigned</span>
                <span style={{ fontWeight: 700, color: 'var(--color-navy)' }}>{job.assigned_truck_count} / {job.requested_truck_count}</span>
              </div>
            </div>

            {/* Assigned truck details */}
            {job.job_trucks && job.job_trucks.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Trucks</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {job.job_trucks.map(t => (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--color-gray-light)', border: '1px solid var(--color-gray-mid)' }}>
                      <i className="fa-solid fa-truck" style={{ color: 'var(--color-navy)', fontSize: '0.875rem', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-navy)', fontSize: '0.875rem' }}>
                          {t.plate_number || `Truck #${t.truck}`}
                        </div>
                        <div style={{ fontSize: '0.775rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>
                          {[t.make, t.model].filter(Boolean).join(' ')}
                          {t.truck_type ? ` · ${t.truck_type}` : ''}
                          {t.capacity_tons ? ` · ${t.capacity_tons}t` : ''}
                        </div>
                      </div>
                      {t.allocation_method && (
                        <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '999px', background: t.allocation_method === 'auto' ? 'rgba(59,130,246,0.1)' : 'rgba(34,197,94,0.1)', color: t.allocation_method === 'auto' ? 'var(--color-info)' : 'var(--color-success)', fontWeight: 700, flexShrink: 0 }}>
                          {t.allocation_method_display || t.allocation_method}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {job.notes && (
              <div style={{ marginBottom: '1rem' }}>
                <div className="form-label">Notes</div>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-body)', lineHeight: 1.6 }}>{job.notes}</p>
              </div>
            )}
            {job.special_instructions && (
              <div>
                <div className="form-label">Special Instructions</div>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-body)', lineHeight: 1.6 }}>{job.special_instructions}</p>
              </div>
            )}
            {/* Invoice status */}
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-gray-mid)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-navy)', fontSize: '0.9rem' }}>Invoice</span>
                {invoice ? (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Badge status={invoice.payment_status} label={invoice.payment_status_display} />
                    <Link href={`/dashboard/billing/${invoice.id}`} className="btn btn-ghost btn-sm">View</Link>
                  </div>
                ) : isAdmin && job.status === 'completed' ? (
                  <button className="btn btn-primary btn-sm" onClick={handleGenerateInvoice} disabled={actionLoading}>
                    <i className="fa-solid fa-plus" />Generate Invoice
                  </button>
                ) : (
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Not generated</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── APPLICATIONS TAB ── */}
      {tab === 'applications' && isAdmin && (
        <div>
          {(() => {
            const appliedOnly = applications.filter(a => a.status === 'applied')
              .sort((a, b) => b.recommendation_score - a.recommendation_score)
            return (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    {appliedOnly.length} pending applicant{appliedOnly.length !== 1 ? 's' : ''} · {applications.length} total
                  </div>
                  {appliedOnly.length > 0 && (
                    <button className="btn btn-primary" onClick={() => setShowApprove(true)}>
                      <i className="fa-solid fa-check" />Approve Applications
                    </button>
                  )}
                </div>
                {applications.length === 0 ? (
                  <EmptyState icon="fa-paper-plane" title="No Applications" description="No staff have applied for this job yet." />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {applications.sort((a, b) => b.recommendation_score - a.recommendation_score).map(app => (
                      <div key={app.id} className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: 'var(--color-navy)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
                          {app.staff_name?.[0]}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: 'var(--color-navy)' }}>{app.staff_name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', gap: '1rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                            <span>{app.staff_email}</span>
                            <span>Applied {new Date(app.applied_at).toLocaleDateString('en-KE')}</span>
                          </div>
                        </div>
                        <Badge status={app.status} label={app.status} />
                      </div>
                    ))}
                  </div>
                )}
                <ApproveModal open={showApprove} onClose={() => setShowApprove(false)} applications={appliedOnly} onApprove={handleApprove} />
              </>
            )
          })()}
        </div>
      )}

      {/* ── TEAM TAB ── */}
      {tab === 'team' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.625rem', alignItems: 'center', marginBottom: '1rem' }}>
            {isAdmin && ['assigned', 'in_progress'].includes(job.status) && job.assignments.some(a => a.role === 'mover') && (
              <button className="btn btn-outline btn-sm" onClick={() => setShowChangeSupervisor(true)}>
                <i className="fa-solid fa-crown" />Change Team Lead
              </button>
            )}
            <button className="btn btn-outline btn-sm" onClick={handleDownloadPdf}>
              <i className="fa-solid fa-file-pdf" />Download Team PDF
            </button>
          </div>
          {job.assignments.length === 0 ? (
            <EmptyState icon="fa-users" title="No Team Assigned" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {job.assignments.map(a => (
                <div key={a.id} className="card" style={{ padding: '1.25rem', textAlign: 'center', borderTop: a.role === 'supervisor' ? '3px solid var(--color-yellow)' : '3px solid var(--color-gray-mid)' }}>
                  <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'var(--color-navy)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.125rem', margin: '0 auto 0.75rem' }}>
                    {a.staff_name?.[0]}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-navy)', marginBottom: '0.25rem' }}>{a.staff_name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                    {a.role === 'supervisor' && <i className="fa-solid fa-crown" style={{ color: 'var(--color-yellow)', fontSize: '0.75rem' }} />}
                    <Badge status={a.role} label={a.role === 'supervisor' ? 'Team Lead' : (a.role_display || a.role)} />
                  </div>
                  {attendance.find(x => x.staff === a.staff) && (
                    <div style={{ marginTop: '0.5rem' }}><Badge status="absent" label="Absent" /></div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Truck assignments */}
          {job.job_trucks && job.job_trucks.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <div className="card-title" style={{ marginBottom: '0.75rem' }}>Assigned Trucks</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                {job.job_trucks.map(t => (
                  <div key={t.id} className="card" style={{ padding: '1.25rem' }}>
                    {/* Header row: plate + allocation badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className="fa-solid fa-truck" style={{ color: 'var(--color-navy)', fontSize: '1rem' }} />
                        <span style={{ fontWeight: 800, color: 'var(--color-navy)', fontSize: '1rem', fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>
                          {t.plate_number || `Truck #${t.truck}`}
                        </span>
                      </div>
                      {t.allocation_method && (
                        <span style={{ fontSize: '0.7rem', padding: '0.125rem 0.5rem', borderRadius: '999px', background: t.allocation_method === 'auto' ? 'rgba(59,130,246,0.1)' : 'rgba(34,197,94,0.1)', color: t.allocation_method === 'auto' ? 'var(--color-info)' : 'var(--color-success)', fontWeight: 600 }}>
                          {t.allocation_method_display || t.allocation_method}
                        </span>
                      )}
                    </div>
                    {/* Detail rows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      {(t.make || t.model) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--color-text-muted)' }}>Make / Model</span>
                          <span style={{ fontWeight: 600, color: 'var(--color-navy)' }}>{[t.make, t.model].filter(Boolean).join(' ')}</span>
                        </div>
                      )}
                      {t.truck_type && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--color-text-muted)' }}>Type</span>
                          <span style={{ fontWeight: 600, color: 'var(--color-navy)' }}>{t.truck_type}</span>
                        </div>
                      )}
                      {t.capacity_tons && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--color-text-muted)' }}>Capacity</span>
                          <span style={{ fontWeight: 600, color: 'var(--color-navy)' }}>{t.capacity_tons} tons</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Change supervisor modal */}
          {showChangeSupervisor && (() => {
            const currentSupervisor = job.assignments.find(a => a.role === 'supervisor')
            const movers = job.assignments.filter(a => a.role === 'mover')
            return (
              <Modal
                open={showChangeSupervisor}
                onClose={() => { setShowChangeSupervisor(false); setChangeSupervisorStaffId(null) }}
                title="Change Team Lead"
                size="sm"
                footer={<>
                  <button className="btn btn-ghost" onClick={() => { setShowChangeSupervisor(false); setChangeSupervisorStaffId(null) }} disabled={changeSupervisorLoading}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleChangeSupervisor} disabled={changeSupervisorLoading || !changeSupervisorStaffId}>
                    {changeSupervisorLoading ? <span className="spinner spinner-sm" /> : <i className="fa-solid fa-crown" />}
                    Promote to Team Lead
                  </button>
                </>}
              >
                {/* Current team lead */}
                {currentSupervisor && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                      Current Team Lead
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(245,158,11,0.06)', border: '1.5px solid rgba(245,158,11,0.3)' }}>
                      <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '50%', background: 'var(--color-navy)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>
                        {currentSupervisor.staff_name?.[0]}
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-navy)', flex: 1 }}>{currentSupervisor.staff_name}</span>
                      <i className="fa-solid fa-crown" style={{ color: 'var(--color-yellow)', fontSize: '0.875rem' }} />
                    </div>
                  </div>
                )}

                {/* Mover list */}
                <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                  Promote a Mover
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {movers.map(a => {
                    const selected = changeSupervisorStaffId === a.staff
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setChangeSupervisorStaffId(a.staff)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.75rem',
                          padding: '0.75rem', borderRadius: 'var(--radius-sm)',
                          border: `1.5px solid ${selected ? 'var(--color-orange)' : 'var(--color-gray-mid)'}`,
                          background: selected ? 'rgba(232,69,10,0.05)' : 'white',
                          cursor: 'pointer', textAlign: 'left', width: '100%',
                          transition: 'border-color 0.15s, background 0.15s',
                        }}
                      >
                        <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '50%', background: selected ? 'var(--color-orange)' : 'var(--color-navy)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0, transition: 'background 0.15s' }}>
                          {selected ? <i className="fa-solid fa-check" style={{ fontSize: '0.75rem' }} /> : a.staff_name?.[0]}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-navy)', flex: 1 }}>{a.staff_name}</span>
                        {selected && <i className="fa-solid fa-circle-check" style={{ color: 'var(--color-orange)', fontSize: '1rem' }} />}
                      </button>
                    )
                  })}
                </div>
              </Modal>
            )
          })()}
        </div>
      )}

      {/* ── ATTENDANCE TAB ── */}
      {tab === 'attendance' && isAdmin && (
        <div>
          <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            {attendance.length} no-show{attendance.length !== 1 ? 's' : ''} recorded out of {job.assignments.length} assigned staff
          </div>
          <div className="card">
            <table className="data-table">
              <thead>
                <tr><th>Staff</th><th>Role</th><th>No-show</th><th>Notes</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {job.assignments.map(a => {
                  const absentRecord = attendance.find(x => x.staff === a.staff)
                  return (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 600 }}>{a.staff_name}</td>
                      <td>
                        {a.role === 'supervisor'
                          ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-navy)' }}>
                              <i className="fa-solid fa-crown" style={{ color: 'var(--color-yellow)' }} />Team Lead
                            </span>
                          : <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Mover</span>
                        }
                      </td>
                      <td>
                        {absentRecord
                          ? <Badge status="absent" label="Absent" />
                          : <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>—</span>
                        }
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{absentRecord?.notes || '—'}</td>
                      <td>
                        {!absentRecord && (
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleMarkAbsent(a.staff)}>
                            <i className="fa-solid fa-user-xmark" />Mark Absent
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {job.assignments.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>No team assigned to this job</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── BILLING TAB ── */}
      {tab === 'billing' && (
        <div>
          {!invoice ? (
            isAdmin && job.status === 'completed' ? (
              <div className="alert-banner alert-blue">
                <i className="fa-solid fa-file-invoice-dollar" style={{ fontSize: '1.25rem' }} />
                <div style={{ flex: 1 }}>No invoice generated yet.</div>
                <button className="btn btn-primary btn-sm" onClick={handleGenerateInvoice} disabled={actionLoading}>
                  {actionLoading ? <span className="spinner spinner-sm" /> : <i className="fa-solid fa-plus" />}
                  Generate Invoice
                </button>
              </div>
            ) : (
              <EmptyState icon="fa-file-invoice-dollar" title="No Invoice" description={job.status !== 'completed' ? 'Invoice is generated after the job is completed.' : 'No invoice generated.'} />
            )
          ) : (
            <div>
              {/* Cost breakdown */}
              <div className="card card-body" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div className="card-title">Invoice #{invoice.id}</div>
                  <div style={{ display: 'flex', gap: '0.625rem' }}>
                    <Badge status={invoice.payment_status} label={invoice.payment_status_display} />
                    <Link href={`/dashboard/billing/${invoice.id}`} className="btn btn-outline btn-sm">
                      <i className="fa-solid fa-eye" />Full Invoice
                    </Link>
                  </div>
                </div>
                <table className="invoice-line-table" style={{ marginBottom: '0.5rem' }}>
                  <tbody>
                    <tr>
                      <td style={{ color: 'var(--color-text-body)' }}>Base Charge</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(invoice.base_charge)}</td>
                    </tr>
                    <tr>
                      <td style={{ color: 'var(--color-text-body)' }}>Distance Charge</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(invoice.distance_charge)}</td>
                    </tr>
                    {parseFloat(invoice.staff_charge) > 0 && (
                      <tr>
                        <td style={{ color: 'var(--color-text-body)' }}>Staff Charge</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(invoice.staff_charge)}</td>
                      </tr>
                    )}
                    {parseFloat(invoice.truck_charge) > 0 && (
                      <tr>
                        <td style={{ color: 'var(--color-text-body)' }}>Truck Charge</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(invoice.truck_charge)}</td>
                      </tr>
                    )}
                    <tr style={{ borderTop: '2px solid var(--color-gray-mid)' }}>
                      <td style={{ fontWeight: 700 }}>Subtotal</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(invoice.subtotal)}</td>
                    </tr>
                    {parseFloat(invoice.tax_amount) > 0 && (
                      <tr><td>VAT (16%)</td><td style={{ textAlign: 'right' }}>{fmt(invoice.tax_amount)}</td></tr>
                    )}
                    <tr style={{ background: 'var(--color-navy)', color: 'white' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 800, fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>Total</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 800, fontSize: '1.125rem' }}>{fmt(invoice.total_amount)}</td>
                    </tr>
                    <tr><td style={{ color: 'var(--color-success)' }}>Amount Paid</td><td style={{ textAlign: 'right', color: 'var(--color-success)', fontWeight: 600 }}>({fmt(invoice.amount_paid)})</td></tr>
                    <tr><td style={{ fontWeight: 700 }}>Balance Due</td><td style={{ textAlign: 'right', fontWeight: 700, color: parseFloat(invoice.balance_due) > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>{fmt(invoice.balance_due)}</td></tr>
                    {invoice.company_profit && (
                      <tr><td style={{ color: 'var(--color-text-muted)' }}>Company Profit</td><td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-navy)' }}>{fmt(invoice.company_profit)}</td></tr>
                    )}
                  </tbody>
                </table>

                {isAdmin && (
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.25rem' }}>
                    {parseFloat(invoice.balance_due) > 0 && (
                      <button className="btn btn-primary btn-sm" onClick={() => setShowPayment(true)}>
                        <i className="fa-solid fa-money-bill" />Record Payment
                      </button>
                    )}
                    {invoice.payment_status === 'paid' && (
                      <button className="btn btn-outline btn-sm" onClick={() => setShowDisburse(true)}>
                        <i className="fa-solid fa-money-bill-transfer" />Disburse
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Payment history */}
              {invoice.payments && invoice.payments.length > 0 && (
                <div className="card">
                  <div className="card-header"><span className="card-title">Payment History</span></div>
                  <table className="data-table">
                    <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Ref</th><th>Status</th></tr></thead>
                    <tbody>
                      {invoice.payments.map(p => (
                        <tr key={p.id}>
                          <td>{new Date(p.payment_date).toLocaleDateString('en-KE')}</td>
                          <td style={{ fontWeight: 600 }}>{fmt(p.amount)}</td>
                          <td>{p.method_display}</td>
                          <td>{p.transaction_id || '—'}</td>
                          <td><Badge status={p.status} label={p.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── REVIEWS TAB ── */}
      {tab === 'reviews' && (
        <div>
          {isSupervisor && reviews.length === 0 && (
            <div className="alert-banner alert-blue" style={{ marginBottom: '1.25rem' }}>
              <i className="fa-solid fa-star" style={{ fontSize: '1.25rem', color: 'var(--color-yellow)' }} />
              <div style={{ flex: 1 }}>
                <strong>Review Your Team</strong>
                <div style={{ fontSize: '0.875rem', marginTop: '0.125rem' }}>
                  The job is complete. Rate each team member across punctuality, teamwork, care of goods, and more.
                </div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowReviews(true)}>
                <i className="fa-solid fa-star" />Start Reviews
              </button>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{reviews.length} review{reviews.length !== 1 ? 's' : ''} submitted</div>
            {isSupervisor && reviews.length > 0 && (
              <button className="btn btn-outline btn-sm" onClick={() => setShowReviews(true)}>
                <i className="fa-solid fa-pen" />Add More Reviews
              </button>
            )}
          </div>
          {reviews.length === 0 ? (
            <EmptyState icon="fa-star" title="No Reviews Yet" description={isSupervisor ? 'Use the button above to rate your team.' : 'No reviews submitted for this job yet.'} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {reviews.map(r => (
                <div key={r.id} className="card card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--color-navy)', fontSize: '0.9rem' }}>{r.reviewee_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>{r.category_display}</div>
                    </div>
                    <StarDisplay rating={r.rating} />
                  </div>
                  {r.comment && <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5, fontStyle: 'italic' }}>&ldquo;{r.comment}&rdquo;</p>}
                </div>
              ))}
            </div>
          )}
          <ReviewFormModal open={showReviews} onClose={() => setShowReviews(false)} job={job} onSuccess={() => setRefresh(r => r + 1)} />
        </div>
      )}

      {/* Confirm cancel modal */}
      <ConfirmModal
        open={showCancel}
        onClose={() => setShowCancel(false)}
        onConfirm={async () => { setCancelLoading(true); await doStatus('cancel').finally(() => { setCancelLoading(false); setShowCancel(false) }) }}
        title="Cancel Job"
        message={<>Are you sure you want to cancel <strong>&ldquo;{job.title}&rdquo;</strong>? This action cannot be undone.</>}
        confirmLabel="Cancel Job"
        danger
        loading={cancelLoading}
      />

      {/* Disburse confirm */}
      <ConfirmModal
        open={showDisburse}
        onClose={() => setShowDisburse(false)}
        onConfirm={handleDisburse}
        title="Disburse Payments"
        message={<>Each assigned staff member will receive a flat <strong>KES 500</strong>. The remainder is recorded as company profit. This action is irreversible.</>}
        confirmLabel="Disburse"
        loading={false}
      />

      {/* Payment modal */}
      {invoice && (
        <PaymentModal
          invoiceId={invoice.id}
          maxAmount={parseFloat(invoice.balance_due)}
          open={showPayment}
          onClose={() => setShowPayment(false)}
          onSuccess={() => setRefresh(r => r + 1)}
        />
      )}
    </div>
  )
}
