'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { jobService } from '@/lib/services'
import { Badge } from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/Spinner'
import { Pagination } from '@/components/ui/Pagination'
import { ConfirmModal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Job } from '@/types'

const STATUSES = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled']
const MOVE_SIZES = [['studio', 'Studio'], ['one_bedroom', '1 Bed'], ['two_bedroom', '2 Bed'], ['three_bedroom', '3 Bed'], ['office_small', 'Sm. Office'], ['office_large', 'Lg. Office']]

export default function JobsPage() {
  const { isAdmin } = useAuth()
  const toast = useToast()
  const searchParams = useSearchParams()

  const [jobs, setJobs] = useState<Job[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'open' | 'mine'>('open') // staff only
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
  const [refresh, setRefresh] = useState(0)

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
          <Link href="#" onClick={e => { e.preventDefault(); document.dispatchEvent(new CustomEvent('openCreateJob')) }} className="btn btn-primary">
            <i className="fa-solid fa-plus" />New Job
          </Link>
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
          <EmptyState icon="fa-truck-moving" title="No Jobs Found" description="No jobs match the current filters." />
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
