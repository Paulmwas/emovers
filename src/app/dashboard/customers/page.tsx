'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { customerService } from '@/lib/services'
import { PageLoader } from '@/components/ui/Spinner'
import { Pagination } from '@/components/ui/Pagination'
import { ConfirmModal, Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Customer } from '@/types'

function CustomerForm({ customer, open, onClose, onSuccess }: { customer?: Customer; open: boolean; onClose: () => void; onSuccess: () => void }) {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', address: '', notes: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (customer) setForm({ first_name: customer.first_name, last_name: customer.last_name, email: customer.email, phone: customer.phone, address: customer.address, notes: customer.notes })
    else setForm({ first_name: '', last_name: '', email: '', phone: '', address: '', notes: '' })
    setErrors({})
  }, [customer, open])

  const handleSubmit = async () => {
    setLoading(true); setErrors({})
    try {
      if (customer) await customerService.update(customer.id, form)
      else await customerService.create(form)
      toast.success(customer ? 'Changes Saved' : 'Customer Created', customer ? 'Customer updated.' : 'New customer added.')
      onSuccess(); onClose()
    } catch (err: any) {
      const data = err.response?.data || {}
      const fieldErrors: Record<string, string> = {}
      Object.entries(data).forEach(([k, v]) => { fieldErrors[k] = Array.isArray(v) ? v.join(' ') : String(v) })
      setErrors(fieldErrors)
      toast.error('Save Failed', Object.values(fieldErrors)[0] || 'Something went wrong.')
    } finally { setLoading(false) }
  }

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <Modal open={open} onClose={onClose} title={customer ? 'Edit Customer' : 'Add Customer'} size="md"
      footer={<>
        <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading && <span className="spinner spinner-sm" />}{customer ? 'Save Changes' : 'Add Customer'}
        </button>
      </>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div><label className="form-label">First Name *</label><input className="form-input" value={form.first_name} onChange={f('first_name')} required disabled={loading} />{errors.first_name && <div className="field-error">{errors.first_name}</div>}</div>
        <div><label className="form-label">Last Name *</label><input className="form-input" value={form.last_name} onChange={f('last_name')} required disabled={loading} /></div>
        <div style={{ gridColumn: '1/-1' }}><label className="form-label">Email *</label><input type="email" className="form-input" value={form.email} onChange={f('email')} required disabled={loading} />{errors.email && <div className="field-error">{errors.email}</div>}</div>
        <div style={{ gridColumn: '1/-1' }}><label className="form-label">Phone *</label><input type="tel" className="form-input" value={form.phone} onChange={f('phone')} placeholder="+254..." required disabled={loading} /></div>
        <div style={{ gridColumn: '1/-1' }}><label className="form-label">Address *</label><textarea className="form-textarea" value={form.address} onChange={f('address')} required disabled={loading} placeholder="Physical address" /></div>
        <div style={{ gridColumn: '1/-1' }}><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes} onChange={f('notes')} disabled={loading} placeholder="Additional notes" /></div>
      </div>
    </Modal>
  )
}

export default function CustomersPage() {
  const { isAdmin } = useAuth()
  const toast = useToast()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editTarget, setEditTarget] = useState<Customer | undefined>()
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    setLoading(true)
    customerService.list({ page, page_size: 15, search: search || undefined })
      .then(data => { setCustomers(data.results || data); setTotal(data.count || (data.results || data).length) })
      .catch(() => toast.error('Load Error', 'Failed to load customers.'))
      .finally(() => setLoading(false))
  }, [page, search, refresh])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await customerService.delete(deleteTarget.id)
      toast.success('Deleted Successfully', `${deleteTarget.full_name} removed.`)
      setDeleteTarget(null); setRefresh(r => r + 1)
    } catch (err: any) {
      toast.error('Delete Failed', err.response?.data?.error || 'Cannot delete — may have active jobs.')
    } finally { setDeleteLoading(false) }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Customers</h1>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{total} customers</div>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setEditTarget(undefined); setShowForm(true) }}>
            <i className="fa-solid fa-plus" />Add Customer
          </button>
        )}
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <input className="form-input" style={{ maxWidth: '320px' }} placeholder="Search by name or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
      </div>

      <div className="card">
        {loading ? <PageLoader /> : customers.length === 0 ? (
          <EmptyState icon="fa-users" title="No Customers" description="Add your first customer to get started." action={isAdmin && <button className="btn btn-primary" onClick={() => setShowForm(true)}><i className="fa-solid fa-plus" />Add Customer</button>} />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th>Created</th>{isAdmin && <th>Actions</th>}</tr>
                </thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600, color: 'var(--color-navy)' }}>{c.full_name}</td>
                      <td>{c.email}</td>
                      <td>{c.phone}</td>
                      <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.address}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{new Date(c.created_at).toLocaleDateString('en-KE')}</td>
                      {isAdmin && (
                        <td>
                          <div style={{ display: 'flex', gap: '0.375rem' }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setEditTarget(c); setShowForm(true) }}>
                              <i className="fa-solid fa-pen" />
                            </button>
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => setDeleteTarget(c)}>
                              <i className="fa-solid fa-trash" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageSize={15} total={total} onChange={setPage} />
          </>
        )}
      </div>

      <CustomerForm customer={editTarget} open={showForm} onClose={() => setShowForm(false)} onSuccess={() => setRefresh(r => r + 1)} />
      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Customer"
        message={<>Remove <strong>{deleteTarget?.full_name}</strong>? This cannot be undone.</>} confirmLabel="Delete" danger loading={deleteLoading} />
    </div>
  )
}
