'use client'

import React, { forwardRef } from 'react'
import type { Invoice, Disbursement } from '@/types'

interface InvoicePDFProps {
  invoice: Invoice
  disbursements?: Disbursement[]
}

export const InvoicePDF = forwardRef<HTMLDivElement, InvoicePDFProps>(
  ({ invoice, disbursements = [] }, ref) => {
    const fmt = (v: string | number) =>
      `KES ${parseFloat(String(v)).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`

    return (
      <div ref={ref} className="invoice-pdf">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', borderBottom: '3px solid var(--color-navy)', paddingBottom: '1.5rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '2rem', color: 'var(--color-navy)', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
              E-MOVERS
            </div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Professional Moving Services
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-body)', marginTop: '0.25rem' }}>
              Nairobi, Kenya &bull; info@emovers.co.ke
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.75rem', color: 'var(--color-orange)', textTransform: 'uppercase' }}>INVOICE</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-navy)', marginTop: '0.25rem' }}>#{invoice.id}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              Status: <strong>{invoice.payment_status_display}</strong>
            </div>
          </div>
        </div>

        {/* Bill To / Invoice Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
              Bill To
            </div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-navy)' }}>{invoice.customer_name}</div>
            <div style={{ color: 'var(--color-text-body)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Job: {invoice.job_title}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
              Invoice Details
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-body)' }}>
              <div>Date: {new Date(invoice.created_at).toLocaleDateString('en-KE')}</div>
              {invoice.due_date && <div>Due: {new Date(invoice.due_date).toLocaleDateString('en-KE')}</div>}
            </div>
          </div>
        </div>

        {/* Line Items */}
        <table className="invoice-line-table">
          <thead>
            <tr>
              <th>Item</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Base Charge</td>
              <td style={{ textAlign: 'right' }}>{fmt(invoice.base_charge)}</td>
            </tr>
            <tr>
              <td>Distance Charge</td>
              <td style={{ textAlign: 'right' }}>{fmt(invoice.distance_charge)}</td>
            </tr>
            <tr>
              <td>Staff Charge</td>
              <td style={{ textAlign: 'right' }}>{fmt(invoice.staff_charge)}</td>
            </tr>
            <tr>
              <td>Truck Charge</td>
              <td style={{ textAlign: 'right' }}>{fmt(invoice.truck_charge)}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Subtotal</td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(invoice.subtotal)}</td>
            </tr>
            <tr>
              <td>VAT ({parseFloat(invoice.tax_rate) * 100}%)</td>
              <td style={{ textAlign: 'right' }}>{fmt(invoice.tax_amount)}</td>
            </tr>
            <tr className="invoice-total-row">
              <td>TOTAL</td>
              <td style={{ textAlign: 'right' }}>{fmt(invoice.total_amount)}</td>
            </tr>
            <tr>
              <td style={{ color: 'var(--color-success)' }}>Amount Paid</td>
              <td style={{ textAlign: 'right', color: 'var(--color-success)' }}>({fmt(invoice.amount_paid)})</td>
            </tr>
            <tr className="invoice-total-row">
              <td>Balance Due</td>
              <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>{fmt(invoice.balance_due)}</td>
            </tr>
          </tbody>
        </table>

        {/* Payment History */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-navy)', marginBottom: '0.75rem' }}>
              Payments Recorded
            </div>
            <table className="invoice-line-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Ref</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map(p => (
                  <tr key={p.id}>
                    <td>{new Date(p.payment_date).toLocaleDateString('en-KE')}</td>
                    <td>{p.method_display}</td>
                    <td>{p.transaction_id || '—'}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Disbursements */}
        {disbursements.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-navy)', marginBottom: '0.75rem' }}>
              Staff Disbursements
            </div>
            <table className="invoice-line-table">
              <thead>
                <tr><th>Staff</th><th>Ref</th><th style={{ textAlign: 'right' }}>Amount</th></tr>
              </thead>
              <tbody>
                {disbursements.map(d => (
                  <tr key={d.id}>
                    <td>{d.staff_name}</td>
                    <td>{d.transaction_ref}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(d.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '2.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-gray-mid)', fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
          This is a simulated payment environment. E-Movers Management System.
        </div>
      </div>
    )
  }
)

InvoicePDF.displayName = 'InvoicePDF'
export default InvoicePDF
