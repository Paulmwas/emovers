'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { jobService, notificationService } from '@/lib/services'
import { StatsCard } from '@/components/ui/StatsCard'
import { Badge } from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/Spinner'
import type { Job, JobApplication, Notification } from '@/types'

export default function StaffDashboard() {
  const { user } = useAuth()
  const toast = useToast()
  const [openJobs, setOpenJobs] = useState<Job[]>([])
  const [myApplications, setMyApplications] = useState<JobApplication[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [applyingId, setApplyingId] = useState<number | null>(null)
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

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <StatsCard icon="fa-paper-plane" value={myApplications.filter(a => a.status === 'applied').length} label="Active Applications" iconBg="rgba(59,130,246,0.1)" iconColor="var(--color-info)" />
        <StatsCard icon="fa-circle-check" value={approvedApps.length} label="Approved Jobs" iconBg="rgba(34,197,94,0.1)" iconColor="var(--color-success)" />
        <StatsCard icon="fa-circle-xmark" value={myApplications.filter(a => a.status === 'rejected').length} label="Rejected" iconBg="rgba(239,68,68,0.1)" iconColor="var(--color-danger)" />
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
                const full = job.max_applicants != null && (job.assigned_staff_count ?? 0) >= job.max_applicants

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
                    <Link href={`/dashboard/jobs/${app.job}`} className="btn btn-outline btn-sm">
                      <i className="fa-solid fa-arrow-right" />View Job
                    </Link>
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

    </div>
  )
}
