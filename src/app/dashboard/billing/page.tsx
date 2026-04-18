'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useToast } from '@/contexts/ToastContext'
import { billingService, jobService } from '@/lib/services'
import { Badge } from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/Spinner'
import { Pagination } from '@/components/ui/Pagination'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatsCard } from '@/components/ui/StatsCard'
import type { Invoice } from '@/types'

function GenerateInvoiceModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const toast = useToast()
  const [jobs, setJobs] = useState<{ id: number; title: string }[]>([])
  const [form, setForm] = useState({ job_id: '', due_date: '', notes: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      jobService.list({ status: 'completed', page_size: 100 }).then((d: any) => setJobs(d.results || d))
    }
  }, [open])

  const handleSubmit = async () => {
    if (!form.job_id) { toast.warning('Required', 'Please select a job.'); return }
    setLoading(true)
    try {
      await billingService.generateInvoice(parseInt(form.job_id), form.due_date || undefined, form.notes || undefined)
      toast.success('Invoice Generated', 'Invoice created successfully.')
      onSuccess(); onClose()
    } catch (err: any) {
      toast.error('Failed', err.response?.data?.error || 'Could not generate invoice.')
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Generate Invoice" size="sm"
      footer={<>
        <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !form.job_id}>
          {loading && <span className="spinner spinner-sm" />}Generate
        </button>
      </>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label className="form-label">Job (Completed Only) *</label>
          <select className="form-select" value={form.job_id} onChange={e => setForm(p => ({ ...p, job_id: e.target.value }))} disabled={loading}>
            <option value="">Select job</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Due Date</label>
          <input type="date" className="form-input" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} disabled={loading} />
        </div>
        <div>
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} disabled={loading} style={{ minHeight: '3.5rem' }} />
        </div>
      </div>
    </Modal>
  )
}

export default function BillingPage() {
  const toast = useToast()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showGenerate, setShowGenerate] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [summary, setSummary] = useState({ invoiced: '0', collected: '0', outstanding: '0', unpaid: 0 })

  useEffect(() => {
    setLoading(true)
    const params: Record<string, any> = { page, page_size: 15 }
    if (statusFilter) params.payment_status = statusFilter
    if (search) params.search = search
    Promise.all([
      billingService.listInvoices(params),
      billingService.listInvoices({ page_size: 1000 }),
    ]).then(([paged, all]) => {
      setInvoices(paged.results || paged)
      setTotal(paged.count || (paged.results || paged).length)
      const allList: Invoice[] = all.results || all
      const invoiced = allList.reduce((s, i) => s + parseFloat(i.total_amount), 0)
      const collected = allList.reduce((s, i) => s + parseFloat(i.amount_paid), 0)
      setSummary({
        invoiced: invoiced.toLocaleString('en-KE', { minimumFractionDigits: 0 }),
        collected: collected.toLocaleString('en-KE', { minimumFractionDigits: 0 }),
        outstanding: (invoiced - collected).toLocaleString('en-KE', { minimumFractionDigits: 0 }),
        unpaid: allList.filter(i => i.payment_status === 'unpaid').length,
      })
    }).catch(() => toast.error('Load Error', 'Failed to load billing data.'))
      .finally(() => setLoading(false))
  }, [page, statusFilter, search, refresh])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Billing</h1>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{total} invoices</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowGenerate(true)}>
          <i className="fa-solid fa-plus" />Generate Invoice
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <StatsCard icon="fa-file-invoice" value={`KES ${summary.invoiced}`} label="Total Invoiced" iconBg="rgba(59,130,246,0.1)" iconColor="var(--color-info)" />
        <StatsCard icon="fa-circle-check" value={`KES ${summary.collected}`} label="Total Collected" iconBg="rgba(34,197,94,0.1)" iconColor="var(--color-success)" />
        <StatsCard icon="fa-clock" value={`KES ${summary.outstanding}`} label="Outstanding" iconBg="rgba(245,158,11,0.1)" iconColor="var(--color-warning)" />
        <StatsCard icon="fa-circle-xmark" value={summary.unpaid} label="Unpaid Invoices" iconBg="rgba(239,68,68,0.1)" iconColor="var(--color-danger)" />
      </div>

      <div className="filter-bar">
        <input className="form-input" style={{ width: '220px' }} placeholder="Search invoices..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        {[['', 'All'], ['unpaid', 'Unpaid'], ['partial', 'Partial'], ['paid', 'Paid']].map(([v, l]) => (
          <button key={v} className={`filter-pill${statusFilter === v ? ' active' : ''}`} onClick={() => { setStatusFilter(v); setPage(1) }}>{l}</button>
        ))}
      </div>

      <div className="card">
        {loading ? <PageLoader /> : invoices.length === 0 ? (
          <EmptyState icon="fa-file-invoice-dollar" title="No Invoices" description="Generate your first invoice from a completed job." />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr><th>Invoice</th><th>Job</th><th>Customer</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th>Due</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 700, color: 'var(--color-navy)', fontFamily: 'var(--font-display)' }}>#{inv.id}</td>
                      <td style={{ fontSize: '0.875rem', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inv.job_title}</td>
                      <td style={{ fontSize: '0.875rem' }}>{inv.customer_name}</td>
                      <td style={{ fontWeight: 600 }}>KES {parseFloat(inv.total_amount).toLocaleString()}</td>
                      <td style={{ color: 'var(--color-success)' }}>KES {parseFloat(inv.amount_paid).toLocaleString()}</td>
                      <td style={{ fontWeight: 600, color: parseFloat(inv.balance_due) > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                        KES {parseFloat(inv.balance_due).toLocaleString()}
                      </td>
                      <td><Badge status={inv.payment_status} label={inv.payment_status_display} /></td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{inv.due_date || '—'}</td>
                      <td>
                        <Link href={`/dashboard/billing/${inv.id}`} className="btn btn-ghost btn-sm">
                          <i className="fa-solid fa-eye" />View
                        </Link>
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

      <GenerateInvoiceModal open={showGenerate} onClose={() => setShowGenerate(false)} onSuccess={() => setRefresh(r => r + 1)} />
    </div>
  )
}
