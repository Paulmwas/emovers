'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { fleetService } from '@/lib/services'
import { Badge } from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/Spinner'
import { Pagination } from '@/components/ui/Pagination'
import { ConfirmModal, Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatsCard } from '@/components/ui/StatsCard'
import type { Truck } from '@/types'

function TruckForm({ truck, open, onClose, onSuccess }: { truck?: Truck; open: boolean; onClose: () => void; onSuccess: () => void }) {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ plate_number: '', make: '', model: '', year: new Date().getFullYear(), truck_type: 'medium', capacity_tons: '', color: '', status: 'available', mileage_km: 0, next_service_date: '', notes: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (truck) setForm({ plate_number: truck.plate_number, make: truck.make, model: truck.model, year: truck.year, truck_type: truck.truck_type, capacity_tons: truck.capacity_tons, color: truck.color, status: truck.status, mileage_km: truck.mileage_km, next_service_date: truck.next_service_date || '', notes: truck.notes })
    else setForm({ plate_number: '', make: '', model: '', year: new Date().getFullYear(), truck_type: 'medium', capacity_tons: '', color: '', status: 'available', mileage_km: 0, next_service_date: '', notes: '' })
    setErrors({})
  }, [truck, open])

  const handleSubmit = async () => {
    setLoading(true); setErrors({})
    try {
      const payload = { ...form, plate_number: form.plate_number.toUpperCase() }
      if (truck) await fleetService.update(truck.id, payload)
      else await fleetService.create(payload)
      toast.success(truck ? 'Changes Saved' : 'Truck Added', truck ? 'Fleet updated.' : 'New truck added.')
      onSuccess(); onClose()
    } catch (err: any) {
      const data = err.response?.data || {}
      const fieldErrors: Record<string, string> = {}
      Object.entries(data).forEach(([k, v]) => { fieldErrors[k] = Array.isArray(v) ? v.join(' ') : String(v) })
      setErrors(fieldErrors)
      toast.error('Save Failed', Object.values(fieldErrors)[0] || 'Something went wrong.')
    } finally { setLoading(false) }
  }

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <Modal open={open} onClose={onClose} title={truck ? 'Edit Truck' : 'Add Truck'} size="lg"
      footer={<>
        <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading && <span className="spinner spinner-sm" />}{truck ? 'Save Changes' : 'Add Truck'}
        </button>
      </>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div><label className="form-label">Plate Number *</label><input className="form-input" value={form.plate_number} onChange={f('plate_number')} placeholder="KAA 000A" required disabled={loading} style={{ textTransform: 'uppercase' }} />{errors.plate_number && <div className="field-error">{errors.plate_number}</div>}</div>
        <div><label className="form-label">Truck Type</label><select className="form-select" value={form.truck_type} onChange={f('truck_type')} disabled={loading}><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option><option value="extra_large">Extra Large</option></select></div>
        <div><label className="form-label">Make *</label><input className="form-input" value={form.make} onChange={f('make')} placeholder="e.g. Isuzu" required disabled={loading} /></div>
        <div><label className="form-label">Model *</label><input className="form-input" value={form.model} onChange={f('model')} placeholder="e.g. NPR" required disabled={loading} /></div>
        <div><label className="form-label">Year *</label><input type="number" className="form-input" value={form.year} onChange={f('year')} min={1990} max={2030} required disabled={loading} /></div>
        <div><label className="form-label">Capacity (tons) *</label><input type="number" className="form-input" value={form.capacity_tons} onChange={f('capacity_tons')} step="0.1" min={0} required disabled={loading} /></div>
        <div><label className="form-label">Color</label><input className="form-input" value={form.color} onChange={f('color')} placeholder="White" disabled={loading} /></div>
        <div><label className="form-label">Mileage (km)</label><input type="number" className="form-input" value={form.mileage_km} onChange={f('mileage_km')} min={0} disabled={loading} /></div>
        {truck && <div><label className="form-label">Status</label><select className="form-select" value={form.status} onChange={f('status')} disabled={loading}><option value="available">Available</option><option value="on_job">On Job</option><option value="maintenance">Maintenance</option></select></div>}
        <div><label className="form-label">Next Service Date</label><input type="date" className="form-input" value={form.next_service_date} onChange={f('next_service_date')} disabled={loading} /></div>
        <div style={{ gridColumn: '1/-1' }}><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes} onChange={f('notes')} disabled={loading} /></div>
      </div>
    </Modal>
  )
}

export default function FleetPage() {
  const { isAdmin } = useAuth()
  const toast = useToast()
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [editTarget, setEditTarget] = useState<Truck | undefined>()
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Truck | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    setLoading(true)
    fleetService.list({ page, page_size: 15, status: statusFilter || undefined })
      .then(data => { setTrucks(data.results || data); setTotal(data.count || (data.results || data).length) })
      .catch(() => toast.error('Load Error', 'Failed to load fleet.'))
      .finally(() => setLoading(false))
  }, [page, statusFilter, refresh])

  const available = trucks.filter(t => t.status === 'available').length
  const onJob = trucks.filter(t => t.status === 'on_job').length
  const maintenance = trucks.filter(t => t.status === 'maintenance').length
  const today = new Date().toISOString().split('T')[0]

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await fleetService.delete(deleteTarget.id)
      toast.success('Deleted Successfully', `Truck ${deleteTarget.plate_number} removed.`)
      setDeleteTarget(null); setRefresh(r => r + 1)
    } catch (err: any) {
      toast.error('Delete Failed', err.response?.data?.error || 'Could not delete truck.')
    } finally { setDeleteLoading(false) }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Fleet</h1>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{total} vehicles registered</div>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setEditTarget(undefined); setShowForm(true) }}>
            <i className="fa-solid fa-plus" />Add Truck
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <StatsCard icon="fa-circle-check" value={available} label="Available" iconBg="rgba(34,197,94,0.1)" iconColor="var(--color-success)" />
        <StatsCard icon="fa-truck" value={onJob} label="On Job" iconBg="rgba(59,130,246,0.1)" iconColor="var(--color-info)" />
        <StatsCard icon="fa-wrench" value={maintenance} label="Maintenance" iconBg="rgba(239,68,68,0.1)" iconColor="var(--color-danger)" />
      </div>

      <div className="filter-bar">
        {[['', 'All'], ['available', 'Available'], ['on_job', 'On Job'], ['maintenance', 'Maintenance']].map(([v, l]) => (
          <button key={v} className={`filter-pill${statusFilter === v ? ' active' : ''}`} onClick={() => { setStatusFilter(v); setPage(1) }}>{l}</button>
        ))}
      </div>

      <div className="card">
        {loading ? <PageLoader /> : trucks.length === 0 ? (
          <EmptyState icon="fa-truck" title="No Trucks" description="Add your first truck to the fleet." action={isAdmin && <button className="btn btn-primary" onClick={() => setShowForm(true)}><i className="fa-solid fa-plus" />Add Truck</button>} />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr><th>Plate</th><th>Type</th><th>Make / Model</th><th>Year</th><th>Capacity</th><th>Status</th><th>Next Service</th>{isAdmin && <th>Actions</th>}</tr>
                </thead>
                <tbody>
                  {trucks.map(t => {
                    const serviceOverdue = t.next_service_date && t.next_service_date <= today
                    return (
                      <tr key={t.id}>
                        <td style={{ fontWeight: 700, color: 'var(--color-navy)', fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>{t.plate_number}</td>
                        <td><Badge status={t.truck_type} label={t.truck_type_display} /></td>
                        <td>{t.make} {t.model}</td>
                        <td>{t.year}</td>
                        <td>{t.capacity_tons}t</td>
                        <td><Badge status={t.status} label={t.status_display} /></td>
                        <td>
                          {t.next_service_date ? (
                            <span style={{ color: serviceOverdue ? 'var(--color-danger)' : 'var(--color-text-body)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                              {serviceOverdue && <i className="fa-solid fa-triangle-exclamation" />}
                              {t.next_service_date}
                            </span>
                          ) : '—'}
                        </td>
                        {isAdmin && (
                          <td>
                            <div style={{ display: 'flex', gap: '0.375rem' }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => { setEditTarget(t); setShowForm(true) }}>
                                <i className="fa-solid fa-pen" />
                              </button>
                              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => setDeleteTarget(t)}>
                                <i className="fa-solid fa-trash" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageSize={15} total={total} onChange={setPage} />
          </>
        )}
      </div>

      <TruckForm truck={editTarget} open={showForm} onClose={() => setShowForm(false)} onSuccess={() => setRefresh(r => r + 1)} />
      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Truck"
        message={<>Remove <strong>{deleteTarget?.plate_number}</strong>? This cannot be undone.</>} confirmLabel="Delete" danger loading={deleteLoading} />
    </div>
  )
}
