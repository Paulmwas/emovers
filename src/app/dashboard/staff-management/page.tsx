'use client'

import React, { useEffect, useState } from 'react'
import { useToast } from '@/contexts/ToastContext'
import { userService, authService, reviewService } from '@/lib/services'
import { Badge } from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/Spinner'
import { Pagination } from '@/components/ui/Pagination'
import { ConfirmModal, Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import type { User, StaffReview } from '@/types'

function StarDisplay({ rating }: { rating: number }) {
  return <span className="star-rating">{[1,2,3,4,5].map(s => <i key={s} className={`fa-solid fa-star${s > rating ? ' star-empty' : ''}`} />)}</span>
}

function RegisterStaffModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', role: 'mover-staff', password: '', password_confirm: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async () => {
    if (form.password !== form.password_confirm) { setErrors({ password_confirm: 'Passwords do not match.' }); return }
    setLoading(true); setErrors({})
    try {
      await authService.register(form)
      toast.success('Staff Registered', `${form.first_name} ${form.last_name} added.`)
      onSuccess(); onClose()
    } catch (err: any) {
      const data = err.response?.data || {}
      const fe: Record<string, string> = {}
      Object.entries(data).forEach(([k, v]) => { fe[k] = Array.isArray(v) ? v.join(' ') : String(v) })
      setErrors(fe)
      toast.error('Failed', Object.values(fe)[0] || 'Something went wrong.')
    } finally { setLoading(false) }
  }

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <Modal open={open} onClose={onClose} title="Register Staff Member" size="md"
      footer={<>
        <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading && <span className="spinner spinner-sm" />}Register
        </button>
      </>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div><label className="form-label">First Name *</label><input className="form-input" value={form.first_name} onChange={f('first_name')} required disabled={loading} />{errors.first_name && <div className="field-error">{errors.first_name}</div>}</div>
        <div><label className="form-label">Last Name *</label><input className="form-input" value={form.last_name} onChange={f('last_name')} required disabled={loading} /></div>
        <div style={{ gridColumn: '1/-1' }}><label className="form-label">Email *</label><input type="email" className="form-input" value={form.email} onChange={f('email')} required disabled={loading} />{errors.email && <div className="field-error">{errors.email}</div>}</div>
        <div><label className="form-label">Phone</label><input type="tel" className="form-input" value={form.phone} onChange={f('phone')} placeholder="+254..." disabled={loading} /></div>
        <div><label className="form-label">Role</label><select className="form-select" value={form.role} onChange={f('role')} disabled={loading}><option value="mover-staff">Staff</option><option value="mover-admin">Admin</option></select></div>
        <div><label className="form-label">Password *</label><input type="password" className="form-input" value={form.password} onChange={f('password')} required minLength={8} disabled={loading} /></div>
        <div><label className="form-label">Confirm Password *</label><input type="password" className="form-input" value={form.password_confirm} onChange={f('password_confirm')} required disabled={loading} />{errors.password_confirm && <div className="field-error">{errors.password_confirm}</div>}</div>
      </div>
    </Modal>
  )
}

function StaffProfileModal({ staff, open, onClose, onSuccess }: { staff: User; open: boolean; onClose: () => void; onSuccess: () => void }) {
  const toast = useToast()
  const [profile, setProfile] = useState<any>(null)
  const [reviews, setReviews] = useState<StaffReview[]>([])
  const [loading, setLoading] = useState(true)
  const [notesLoading, setNotesLoading] = useState(false)
  const [notes, setNotes] = useState('')
  const [isAvailable, setIsAvailable] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    Promise.all([
      userService.getStaffProfile(staff.id),
      reviewService.list({ reviewee: staff.id, page_size: 5 }),
    ]).then(([p, r]) => {
      setProfile(p)
      setNotes(p.notes || '')
      setIsAvailable(p.is_available || false)
      setReviews(r.results || r)
    }).catch(() => toast.error('Load Error', 'Could not load profile.'))
      .finally(() => setLoading(false))
  }, [open, staff.id])

  const saveProfile = async () => {
    setNotesLoading(true)
    try {
      await userService.updateStaffProfile(staff.id, { notes, is_available: isAvailable })
      toast.success('Changes Saved', 'Staff profile updated.')
      onSuccess()
    } catch { toast.error('Failed', 'Could not update profile.') }
    finally { setNotesLoading(false) }
  }

  const scoreClass = (s: number) => s < 0.5 ? 'low' : s < 0.75 ? 'mid' : 'high'

  return (
    <Modal open={open} onClose={onClose} title={`${staff.full_name} — Profile`} size="lg">
      {loading ? <PageLoader /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <div className="form-label">Contact</div>
              <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <div><i className="fa-solid fa-envelope" style={{ marginRight: '0.5rem', color: 'var(--color-text-muted)' }} />{staff.email}</div>
                <div><i className="fa-solid fa-phone" style={{ marginRight: '0.5rem', color: 'var(--color-text-muted)' }} />{staff.phone || '—'}</div>
                <div><i className="fa-solid fa-calendar" style={{ marginRight: '0.5rem', color: 'var(--color-text-muted)' }} />Joined {new Date(staff.date_joined).toLocaleDateString('en-KE')}</div>
              </div>
            </div>
            <div>
              <div className="form-label">Performance</div>
              <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--color-text-muted)' }}>Rating</span><StarDisplay rating={Math.round(parseFloat(profile?.average_rating || '0'))} /></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--color-text-muted)' }}>Reviews</span><strong>{profile?.total_reviews || 0}</strong></div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}><span style={{ color: 'var(--color-text-muted)' }}>Score</span><strong>{Math.round(parseFloat(profile?.recommendation_score || '0') * 100)}%</strong></div>
                  <div className="score-bar-track">
                    <div className={`score-bar-fill ${scoreClass(parseFloat(profile?.recommendation_score || '0'))}`} style={{ width: `${Math.round(parseFloat(profile?.recommendation_score || '0') * 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Availability</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                <input type="checkbox" checked={isAvailable} onChange={e => setIsAvailable(e.target.checked)} style={{ width: '1rem', height: '1rem', accentColor: 'var(--color-orange)' }} />
                <span style={{ fontWeight: 600, color: isAvailable ? 'var(--color-success)' : 'var(--color-text-muted)' }}>{isAvailable ? 'Available' : 'Unavailable'}</span>
              </label>
            </div>
            <label className="form-label">Admin Notes</label>
            <textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes about this staff member..." style={{ minHeight: '5rem' }} />
            <button className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }} onClick={saveProfile} disabled={notesLoading}>
              {notesLoading && <span className="spinner spinner-sm" />}Save Profile
            </button>
          </div>
          {reviews.length > 0 && (
            <div>
              <div className="form-label">Recent Reviews</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {reviews.map(r => (
                  <div key={r.id} style={{ padding: '0.75rem', background: 'var(--color-gray-light)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{r.category_display}</span>
                      <StarDisplay rating={r.rating} />
                    </div>
                    {r.comment && <div style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>&ldquo;{r.comment}&rdquo;</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

export default function StaffManagementPage() {
  const toast = useToast()
  const [staff, setStaff] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showRegister, setShowRegister] = useState(false)
  const [profileTarget, setProfileTarget] = useState<User | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null)
  const [deactivateLoading, setDeactivateLoading] = useState(false)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    setLoading(true)
    userService.list({ page, page_size: 15, role: 'mover-staff', search: search || undefined })
      .then(data => { setStaff(data.results || data); setTotal(data.count || (data.results || data).length) })
      .catch(() => toast.error('Load Error', 'Failed to load staff.'))
      .finally(() => setLoading(false))
  }, [page, search, refresh])

  const handleDeactivate = async () => {
    if (!deactivateTarget) return
    setDeactivateLoading(true)
    try {
      await userService.deactivate(deactivateTarget.id)
      toast.success('Deactivated', `${deactivateTarget.full_name} has been deactivated.`)
      setDeactivateTarget(null); setRefresh(r => r + 1)
    } catch (err: any) {
      toast.error('Failed', err.response?.data?.error || 'Could not deactivate.')
    } finally { setDeactivateLoading(false) }
  }

  const scoreClass = (s: string) => { const v = parseFloat(s); return v < 0.5 ? 'low' : v < 0.75 ? 'mid' : 'high' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Staff Management</h1>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{total} staff members</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowRegister(true)}>
          <i className="fa-solid fa-user-plus" />Add Staff
        </button>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <input className="form-input" style={{ maxWidth: '320px' }} placeholder="Search by name or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
      </div>

      <div className="card">
        {loading ? <PageLoader /> : staff.length === 0 ? (
          <EmptyState icon="fa-id-badge" title="No Staff" description="Register your first staff member." action={<button className="btn btn-primary" onClick={() => setShowRegister(true)}><i className="fa-solid fa-user-plus" />Add Staff</button>} />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr><th>Staff</th><th>Rating</th><th>Score</th><th>Availability</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {staff.map(s => {
                    const profile = s.staff_profile
                    const score = profile?.recommendation_score || '0'
                    const pct = Math.round(parseFloat(score) * 100)
                    const rating = Math.round(parseFloat(profile?.average_rating || '0'))
                    return (
                      <tr key={s.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '50%', background: s.is_active ? 'var(--color-navy)' : 'var(--color-gray-mid)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>
                              {s.full_name?.[0] || 'U'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--color-navy)', fontSize: '0.9rem' }}>{s.full_name}</div>
                              <div style={{ fontSize: '0.775rem', color: 'var(--color-text-muted)' }}>{s.email}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className="star-rating">{[1,2,3,4,5].map(n => <i key={n} className={`fa-solid fa-star${n > rating ? ' star-empty' : ''}`} />)}</span></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                            <div className="score-bar-track" style={{ width: '80px' }}>
                              <div className={`score-bar-fill ${scoreClass(score)}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', minWidth: '2.5rem' }}>{pct}%</span>
                          </div>
                        </td>
                        <td><Badge status={profile?.is_available ? 'available' : 'on_job'} label={profile?.is_available ? 'Available' : 'On Job'} /></td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.375rem' }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setProfileTarget(s)}>
                              <i className="fa-solid fa-eye" />View
                            </button>
                            {s.is_active && (
                              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => setDeactivateTarget(s)}>
                                <i className="fa-solid fa-ban" />
                              </button>
                            )}
                          </div>
                        </td>
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

      <RegisterStaffModal open={showRegister} onClose={() => setShowRegister(false)} onSuccess={() => setRefresh(r => r + 1)} />
      {profileTarget && <StaffProfileModal staff={profileTarget} open onClose={() => setProfileTarget(null)} onSuccess={() => setRefresh(r => r + 1)} />}
      <ConfirmModal open={!!deactivateTarget} onClose={() => setDeactivateTarget(null)} onConfirm={handleDeactivate} title="Deactivate Staff"
        message={<>Deactivate <strong>{deactivateTarget?.full_name}</strong>? They will no longer be able to log in.</>} confirmLabel="Deactivate" danger loading={deactivateLoading} />
    </div>
  )
}
