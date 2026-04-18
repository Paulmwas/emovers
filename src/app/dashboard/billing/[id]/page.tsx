'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { billingService } from '@/lib/services'
import { Badge } from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/Spinner'
import { ConfirmModal, Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { InvoicePDF } from '@/components/ui/InvoicePDF'
import type { Invoice, Disbursement } from '@/types'

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
      toast.success('Payment Recorded', `KES ${amt.toLocaleString()} recorded.`)
      onSuccess(); onClose()
    } catch (err: any) {
      toast.error('Failed', err.response?.data?.error || 'Could not record payment.')
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Record Payment" size="sm"
      footer={<>
        <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !form.amount}>
          {loading && <span className="spinner spinner-sm" />}Record
        </button>
      </>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label className="form-label">Amount (max KES {maxAmount.toLocaleString()})</label>
          <input type="number" className="form-input" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} max={maxAmount} min={1} step={0.01} disabled={loading} />
        </div>
        <div>
          <label className="form-label">Method</label>
          <select className="form-select" value={form.method} onChange={e => setForm(p => ({ ...p, method: e.target.value }))} disabled={loading}>
            <option value="cash">Cash</option><option value="mpesa">M-Pesa</option><option value="bank_transfer">Bank Transfer</option><option value="card">Card</option>
          </select>
        </div>
        <div>
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ minHeight: '3.5rem' }} disabled={loading} />
        </div>
      </div>
    </Modal>
  )
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { isAdmin } = useAuth()
  const toast = useToast()
  const router = useRouter()
  const pdfRef = useRef<HTMLDivElement>(null)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [disbursements, setDisbursements] = useState<Disbursement[]>([])
  const [loading, setLoading] = useState(true)
  const [showPayment, setShowPayment] = useState(false)
  const [showDisburse, setShowDisburse] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      billingService.getInvoice(parseInt(id)),
      billingService.listDisbursements({ invoice: id }),
    ]).then(([inv, disb]) => {
      setInvoice(inv)
      setDisbursements(disb.results || disb)
    }).catch(() => toast.error('Load Error', 'Failed to load invoice.'))
      .finally(() => setLoading(false))
  }, [id, refresh])

  const handleDisburse = async () => {
    if (!invoice) return
    try {
      await billingService.disburse(invoice.id)
      toast.success('Disbursed', 'Staff payments disbursed.')
      setShowDisburse(false)
      setRefresh(r => r + 1)
    } catch (err: any) {
      toast.error('Failed', err.response?.data?.error || 'Could not disburse.')
    }
  }

  const handleDownloadPDF = async () => {
    if (!pdfRef.current || !invoice) return
    setPdfLoading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).jsPDF
      const canvas = await html2canvas(pdfRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Invoice-${invoice.id}.pdf`)
      toast.success('PDF Downloaded', `Invoice #${invoice.id} saved.`)
    } catch {
      toast.error('PDF Failed', 'Could not generate PDF.')
    } finally { setPdfLoading(false) }
  }

  const fmt = (v: string | number) => `KES ${parseFloat(String(v)).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`

  if (loading) return <PageLoader />
  if (!invoice) return <EmptyState icon="fa-file-invoice" title="Invoice Not Found" />

  const balanceDue = parseFloat(invoice.balance_due)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => router.push('/dashboard/billing')}>
          <i className="fa-solid fa-arrow-left" />Back
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.375rem', marginBottom: '0.125rem' }}>Invoice #{invoice.id}</h1>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Badge status={invoice.payment_status} label={invoice.payment_status_display} />
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{invoice.job_title}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <button className="btn btn-outline btn-sm" onClick={handleDownloadPDF} disabled={pdfLoading}>
            {pdfLoading ? <span className="spinner spinner-sm" /> : <i className="fa-solid fa-download" />}
            Download PDF
          </button>
          {isAdmin && balanceDue > 0 && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowPayment(true)}>
              <i className="fa-solid fa-money-bill" />Record Payment
            </button>
          )}
          {isAdmin && invoice.payment_status === 'paid' && disbursements.length === 0 && (
            <button className="btn btn-outline btn-sm" onClick={() => setShowDisburse(true)}>
              <i className="fa-solid fa-money-bill-transfer" />Disburse
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Main invoice */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Bill to / Details */}
          <div className="card card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <div className="form-label">Bill To</div>
                <div style={{ fontWeight: 700, color: 'var(--color-navy)' }}>{invoice.customer_name}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Job: {invoice.job_title}</div>
              </div>
              <div>
                <div className="form-label">Invoice Details</div>
                <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div><span style={{ color: 'var(--color-text-muted)' }}>Created: </span>{new Date(invoice.created_at).toLocaleDateString('en-KE')}</div>
                  {invoice.due_date && <div><span style={{ color: 'var(--color-text-muted)' }}>Due: </span>{invoice.due_date}</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="card">
            <div className="card-header"><span className="card-title">Cost Breakdown</span></div>
            <table className="data-table">
              <thead><tr><th>Item</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
              <tbody>
                {[['Base Charge', invoice.base_charge], ['Distance Charge', invoice.distance_charge], ['Staff Charge', invoice.staff_charge], ['Truck Charge', invoice.truck_charge]].map(([l, v]) => (
                  <tr key={l}><td>{l}</td><td style={{ textAlign: 'right' }}>{fmt(v)}</td></tr>
                ))}
                <tr style={{ borderTop: '2px solid var(--color-gray-mid)', background: 'var(--color-gray-light)' }}>
                  <td style={{ fontWeight: 700 }}>Subtotal</td><td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(invoice.subtotal)}</td>
                </tr>
                <tr><td>VAT (16%)</td><td style={{ textAlign: 'right' }}>{fmt(invoice.tax_amount)}</td></tr>
                <tr style={{ background: 'var(--color-navy)', color: 'white' }}>
                  <td style={{ fontWeight: 800, fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: '1rem' }}>TOTAL</td>
                  <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '1.125rem' }}>{fmt(invoice.total_amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment history */}
          <div className="card">
            <div className="card-header"><span className="card-title">Payment History</span></div>
            {invoice.payments && invoice.payments.length > 0 ? (
              <table className="data-table">
                <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Ref</th><th>Recorded By</th></tr></thead>
                <tbody>
                  {invoice.payments.map(p => (
                    <tr key={p.id}>
                      <td>{new Date(p.payment_date).toLocaleDateString('en-KE')}</td>
                      <td style={{ fontWeight: 600 }}>{fmt(p.amount)}</td>
                      <td>{p.method_display}</td>
                      <td>{p.transaction_id || '—'}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{p.recorded_by_name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No payments recorded yet</div>
            )}
          </div>

          {/* Disbursements */}
          {disbursements.length > 0 && (
            <div className="card">
              <div className="card-header"><span className="card-title">Staff Disbursements</span></div>
              <table className="data-table">
                <thead><tr><th>Staff</th><th>Amount</th><th>Ref</th><th>Date</th></tr></thead>
                <tbody>
                  {disbursements.map(d => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 600 }}>{d.staff_name}</td>
                      <td>{fmt(d.amount)}</td>
                      <td style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem' }}>{d.transaction_ref}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{new Date(d.disbursed_at).toLocaleDateString('en-KE')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card card-body">
            <div className="card-title" style={{ marginBottom: '1rem' }}>Payment Summary</div>
            {/* Progress bar */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>
                <span>Payment Progress</span>
                <span>{Math.round((parseFloat(invoice.amount_paid) / parseFloat(invoice.total_amount)) * 100)}%</span>
              </div>
              <div className="score-bar-track" style={{ height: '0.625rem' }}>
                <div className="score-bar-fill high" style={{ width: `${Math.min(100, (parseFloat(invoice.amount_paid) / parseFloat(invoice.total_amount)) * 100)}%` }} />
              </div>
            </div>
            {[['Total', fmt(invoice.total_amount), 'var(--color-navy)'], ['Paid', fmt(invoice.amount_paid), 'var(--color-success)'], ['Balance', fmt(invoice.balance_due), balanceDue > 0 ? 'var(--color-danger)' : 'var(--color-success)']].map(([l, v, c]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.625rem', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>{l}</span>
                <span style={{ fontWeight: 700, color: c as string }}>{v}</span>
              </div>
            ))}
          </div>

          {invoice.notes && (
            <div className="card card-body">
              <div className="form-label">Notes</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-body)', lineHeight: 1.6 }}>{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Off-screen PDF component */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
        <InvoicePDF ref={pdfRef} invoice={invoice} disbursements={disbursements} />
      </div>

      <PaymentModal invoiceId={invoice.id} maxAmount={balanceDue} open={showPayment} onClose={() => setShowPayment(false)} onSuccess={() => setRefresh(r => r + 1)} />
      <ConfirmModal open={showDisburse} onClose={() => setShowDisburse(false)} onConfirm={handleDisburse} title="Disburse Payments"
        message="This will disburse staff payments. This action is irreversible." confirmLabel="Disburse" loading={false} />
    </div>
  )
}
