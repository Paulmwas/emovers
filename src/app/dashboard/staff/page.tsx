'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { jobService, attendanceService, notificationService } from '@/lib/services'
import { StatsCard } from '@/components/ui/StatsCard'
import { Badge } from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import type { Job, JobApplication, Notification } from '@/types'

function AttendanceModal({ jobId, open, onClose, onSuccess }: { jobId: number; open: boolean; onClose: () => void; onSuccess: () => void }) {
  const toast = useToast()
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [pinError, setPinError] = useState('')

  const handleConfirm = async () => {
    if (pin.length !== 6) { setPinError('PIN must be 6 digits.'); return }
    setLoading(true); setPinError('')
    try {
      await attendanceService.confirm(jobId, pin)
      toast.success('Attendance Confirmed', 'You are marked as present for this job.')
      onSuccess(); onClose()
    } catch (err: any) {
      setPinError(err.response?.data?.error || 'Incorrect PIN. Try again.')
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Confirm Attendance" size="sm"
      footer={<>
        <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
        <button className="btn btn-primary" onClick={handleConfirm} disabled={loading || pin.length !== 6}>
          {loading && <span className="spinner spinner-sm" />}Confirm
        </button>
      </>}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '1.5rem', color: 'var(--color-success)' }}>
          <i className="fa-solid fa-circle-check" />
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Enter the 6-digit PIN shared by your supervisor to confirm your attendance.
        </p>
        <input
          className="form-input"
          maxLength={6}
          value={pin}
          onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setPinError('') }}
          placeholder="000000"
          style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}
          autoFocus
          disabled={loading}
        />
        {pinError && <div className="field-error" style={{ marginTop: '0.5rem', textAlign: 'center' }}>{pinError}</div>}
      </div>
    </Modal>
  )
}

export default function StaffDashboard() {
  const { user } = useAuth()
  const toast = useToast()
  const [openJobs, setOpenJobs] = useState<Job[]>([])
  const [myApplications, setMyApplications] = useState<JobApplication[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [applyingId, setApplyingId] = useState<number | null>(null)
  const [attendanceJobId, setAttendanceJobId] = useState<number | null>(null)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      jobService.list({ status: 'pending', page_size: 10 }),
      jobService.myApplications({ page_size: 50 }),
      notificationService.list({ page_size: 3, is_read: false }),
    ]).then(([jobs, apps, notifs]) => {
      setOpenJobs(jobs.results || jobs)
      setMyApplications(apps.results || apps)
      setNotifications(notifs.results || notifs)
    }).catch(() => toast.error('Load Error', 'Failed to load dashboard data.'))
      .finally(() => setLoading(false))
  }, [refresh])

  const handleApply = async (jobId: number) => {
    setApplyingId(jobId)
    try {
      await jobService.apply(jobId)
      toast.success('Application Submitted', 'You have applied for this job.')
      setRefresh(r => r + 1)
    } catch (err: any) {
      toast.error('Application Failed', err.response?.data?.error || 'Could not apply.')
    } finally { setApplyingId(null) }
  }

  const handleWithdraw = async (jobId: number) => {
    setApplyingId(jobId)
    try {
      await jobService.withdrawApplication(jobId)
      toast.success('Application Withdrawn', 'Your application has been removed.')
      setRefresh(r => r + 1)
    } catch (err: any) {
      toast.error('Error', err.response?.data?.error || 'Could not withdraw.')
    } finally { setApplyingId(null) }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead()
      toast.success('Notifications', 'All notifications marked as read.')
      setRefresh(r => r + 1)
    } catch { toast.error('Error', 'Could not mark as read.') }
  }

  if (loading) return <PageLoader />

  const appliedIds = new Set(myApplications.filter(a => a.status === 'applied').map(a => a.job))
  const approvedApps = myApplications.filter(a => a.status === 'approved')

  const profile = user?.staff_profile
  const rating = parseFloat(profile?.average_rating || '0')
  const recScore = parseFloat(profile?.recommendation_score || '0')

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <StatsCard icon="fa-paper-plane" value={myApplications.filter(a => a.status === 'applied').length} label="Active Applications" iconBg="rgba(59,130,246,0.1)" iconColor="var(--color-info)" />
        <StatsCard icon="fa-circle-check" value={approvedApps.length} label="Approved Jobs" iconBg="rgba(34,197,94,0.1)" iconColor="var(--color-success)" />
        <StatsCard icon="fa-star" value={rating > 0 ? rating.toFixed(1) : 'N/A'} label="My Rating" iconBg="rgba(245,158,11,0.1)" iconColor="var(--color-warning)" />
        <StatsCard icon="fa-gauge-high" value={recScore > 0 ? `${Math.round(recScore * 100)}%` : 'N/A'} label="Recommendation Score" iconBg="rgba(232,69,10,0.1)" iconColor="var(--color-orange)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Open Jobs */}
        <div>
          <div className="card">
            <div className="card-header">
              <span className="card-title"><i className="fa-solid fa-truck-moving" style={{ marginRight: '0.5rem', color: 'var(--color-orange)' }} />Open Jobs</span>
            </div>
            <div>
              {openJobs.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No open jobs available</div>
              ) : openJobs.map(job => {
                const applied = appliedIds.has(job.id)
                const deadline = job.application_deadline ? new Date(job.application_deadline) < new Date() : false
                const full = job.max_applicants != null && job.assigned_staff_count >= job.max_applicants

                return (
                  <div key={job.id} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-gray-mid)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link href={`/dashboard/jobs/${job.id}`} style={{ fontWeight: 700, color: 'var(--color-navy)', fontSize: '0.9rem', textDecoration: 'none', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {job.title}
                        </Link>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <span><i className="fa-solid fa-calendar" style={{ marginRight: '0.25rem' }} />{job.scheduled_date}</span>
                          <span><i className="fa-solid fa-location-dot" style={{ marginRight: '0.25rem' }} />{job.pickup_address?.split(',')[0]}</span>
                        </div>
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <Badge status={job.move_size} label={job.move_size_display} />
                          {deadline && <span className="badge badge-cancelled">Closed</span>}
                          {full && !deadline && <span className="badge badge-on_job">Full</span>}
                        </div>
                      </div>
                      <div style={{ flexShrink: 0 }}>
                        {deadline || full ? null : applied ? (
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleWithdraw(job.id)}
                            disabled={applyingId === job.id}
                          >
                            {applyingId === job.id ? <span className="spinner spinner-sm" /> : <i className="fa-solid fa-rotate-left" />}
                            Withdraw
                          </button>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleApply(job.id)}
                            disabled={applyingId === job.id}
                          >
                            {applyingId === job.id ? <span className="spinner spinner-sm" /> : <i className="fa-solid fa-paper-plane" />}
                            Apply
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* My Assignments + Notifications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Upcoming assignments */}
          <div className="card">
            <div className="card-header">
              <span className="card-title"><i className="fa-solid fa-calendar-check" style={{ marginRight: '0.5rem', color: 'var(--color-orange)' }} />My Assignments</span>
            </div>
            <div>
              {approvedApps.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No approved assignments yet</div>
              ) : approvedApps.map(app => (
                <div key={app.id} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-gray-mid)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                    <div>
                      <Link href={`/dashboard/jobs/${app.job}`} style={{ fontWeight: 600, color: 'var(--color-navy)', fontSize: '0.875rem', textDecoration: 'none' }}>
                        {app.job_title}
                      </Link>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>{app.job_scheduled_date}</div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setAttendanceJobId(app.job)}
                    >
                      <i className="fa-solid fa-key" />
                      Confirm Attendance
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent notifications */}
          <div className="card">
            <div className="card-header">
              <span className="card-title"><i className="fa-solid fa-bell" style={{ marginRight: '0.5rem', color: 'var(--color-orange)' }} />Recent Notifications</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {notifications.length > 0 && (
                  <button className="btn btn-ghost btn-sm" onClick={handleMarkAllRead}>Mark All Read</button>
                )}
                <Link href="/dashboard/notifications" className="btn btn-ghost btn-sm">View All <i className="fa-solid fa-arrow-right" /></Link>
              </div>
            </div>
            <div>
              {notifications.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No unread notifications</div>
              ) : notifications.map(n => (
                <div key={n.id} className={`notif-item${!n.is_read ? ' unread' : ''}`}>
                  {!n.is_read && <div className="notif-unread-bar" />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-body">{n.body}</div>
                  </div>
                  <div className="notif-time">{new Date(n.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {attendanceJobId && (
        <AttendanceModal
          jobId={attendanceJobId}
          open
          onClose={() => setAttendanceJobId(null)}
          onSuccess={() => setRefresh(r => r + 1)}
        />
      )}
    </div>
  )
}
