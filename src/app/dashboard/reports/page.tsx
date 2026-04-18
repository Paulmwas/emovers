'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { useRouter } from 'next/navigation'
import { reportService } from '@/lib/services'
import { PageLoader } from '@/components/ui/Spinner'
import { StatsCard } from '@/components/ui/StatsCard'
import type {
  DashboardReport, JobsReport, BillingReport,
  StaffPerformanceReport, FleetReport, AttendanceReport, ApplicationsReport
} from '@/types'

const RANGES = [
  { value: 7, label: '7 Days' },
  { value: 30, label: '30 Days' },
  { value: 90, label: '90 Days' },
  { value: 365, label: '1 Year' },
]

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'fa-gauge' },
  { key: 'jobs', label: 'Jobs', icon: 'fa-briefcase' },
  { key: 'billing', label: 'Billing', icon: 'fa-file-invoice-dollar' },
  { key: 'staff', label: 'Staff Performance', icon: 'fa-users' },
  { key: 'fleet', label: 'Fleet', icon: 'fa-truck' },
  { key: 'attendance', label: 'Attendance', icon: 'fa-calendar-check' },
  { key: 'applications', label: 'Applications', icon: 'fa-paper-plane' },
]

function BarChart({ data, maxVal, colorFn }: {
  data: { label: string; value: number; raw?: number }[]
  maxVal: number
  colorFn?: (v: number) => string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {data.map(({ label, value, raw }) => {
        const pct = maxVal > 0 ? (value / maxVal) * 100 : 0
        const color = colorFn ? colorFn(raw ?? value) : undefined
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', minWidth: '130px', textTransform: 'capitalize' }}>{label.replace(/_/g, ' ')}</span>
            <div className="score-bar-track" style={{ flex: 1 }}>
              <div
                className={color ? undefined : 'score-bar-fill high'}
                style={{ width: `${pct}%`, ...(color ? { background: color } : {}) }}
              />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', minWidth: '2.5rem', textAlign: 'right', fontWeight: 600 }}>{value}</span>
          </div>
        )
      })}
    </div>
  )
}

function ScoreBarColor(v: number) {
  if (v < 0.5) return 'var(--color-danger)'
  if (v < 0.75) return 'var(--color-warning)'
  return 'var(--color-success)'
}

function CircleRing({ pct, label, color }: { pct: number; label: string; color: string }) {
  const r = 42
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-gray-mid)" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x="50" y="55" textAnchor="middle" style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '18px', fill: 'var(--color-navy)' }}>
          {Math.round(pct)}%
        </text>
      </svg>
      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>{label}</span>
    </div>
  )
}

// ─── TAB COMPONENTS ──────────────────────────────────────────────────────────

function DashboardTab({ days }: { days: number }) {
  const toast = useToast()
  const [data, setData] = useState<DashboardReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    reportService.dashboard({ days })
      .then(setData)
      .catch(() => toast.error('Load Error', 'Failed to load dashboard report.'))
      .finally(() => setLoading(false))
  }, [days])

  if (loading) return <PageLoader />
  if (!data) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        <StatsCard icon="fa-briefcase" value={data.total_jobs ?? 0} label="Total Jobs" iconBg="rgba(59,130,246,0.1)" iconColor="var(--color-info)" />
        <StatsCard icon="fa-users" value={data.total_staff ?? 0} label="Active Staff" iconBg="rgba(34,197,94,0.1)" iconColor="var(--color-success)" />
        <StatsCard icon="fa-truck" value={data.total_trucks ?? 0} label="Trucks" iconBg="rgba(245,158,11,0.1)" iconColor="var(--color-warning)" />
        <StatsCard icon="fa-file-invoice-dollar" value={`KES ${(data.total_revenue ?? 0).toLocaleString()}`} label="Revenue" iconBg="rgba(239,68,68,0.1)" iconColor="var(--color-danger)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card card-body">
          <div className="card-title" style={{ marginBottom: '1rem' }}>Jobs by Status</div>
          {data.jobs_by_status && (
            <BarChart
              data={Object.entries(data.jobs_by_status).map(([label, value]) => ({ label, value: value as number }))}
              maxVal={Math.max(...Object.values(data.jobs_by_status as Record<string, number>), 1)}
            />
          )}
        </div>
        <div className="card card-body">
          <div className="card-title" style={{ marginBottom: '1rem' }}>Recent Activity</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { label: 'New Jobs', value: data.new_jobs ?? 0, icon: 'fa-briefcase', color: 'var(--color-info)' },
              { label: 'Completed Jobs', value: data.completed_jobs ?? 0, icon: 'fa-circle-check', color: 'var(--color-success)' },
              { label: 'Pending Applications', value: data.pending_applications ?? 0, icon: 'fa-paper-plane', color: 'var(--color-warning)' },
              { label: 'Invoices Generated', value: data.invoices_generated ?? 0, icon: 'fa-file-invoice', color: 'var(--color-navy)' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid var(--color-gray-mid)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <i className={`fa-solid ${icon}`} style={{ color, width: '1rem', textAlign: 'center' }} />
                  <span style={{ fontSize: '0.875rem' }}>{label}</span>
                </div>
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-navy)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function JobsTab({ days }: { days: number }) {
  const toast = useToast()
  const [data, setData] = useState<JobsReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    reportService.jobs({ days })
      .then(setData)
      .catch(() => toast.error('Load Error', 'Failed to load jobs report.'))
      .finally(() => setLoading(false))
  }, [days])

  if (loading) return <PageLoader />
  if (!data) return null

  const statusEntries = data.by_status ? Object.entries(data.by_status as Record<string, number>) : []
  const maxStatus = statusEntries.length ? Math.max(...statusEntries.map(([, v]) => v), 1) : 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        <StatsCard icon="fa-briefcase" value={data.total ?? 0} label="Total Jobs" iconBg="rgba(59,130,246,0.1)" iconColor="var(--color-info)" />
        <StatsCard icon="fa-circle-check" value={data.completed ?? 0} label="Completed" iconBg="rgba(34,197,94,0.1)" iconColor="var(--color-success)" />
        <StatsCard icon="fa-spinner" value={data.in_progress ?? 0} label="In Progress" iconBg="rgba(245,158,11,0.1)" iconColor="var(--color-warning)" />
        <StatsCard icon="fa-circle-xmark" value={data.cancelled ?? 0} label="Cancelled" iconBg="rgba(239,68,68,0.1)" iconColor="var(--color-danger)" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card card-body">
          <div className="card-title" style={{ marginBottom: '1rem' }}>Jobs by Status</div>
          <BarChart data={statusEntries.map(([label, value]) => ({ label, value }))} maxVal={maxStatus} />
        </div>
        <div className="card card-body">
          <div className="card-title" style={{ marginBottom: '1rem' }}>Key Metrics</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { label: 'Completion Rate', value: data.completion_rate != null ? `${(data.completion_rate * 100).toFixed(1)}%` : '—' },
              { label: 'Avg Duration (days)', value: data.avg_duration_days != null ? data.avg_duration_days.toFixed(1) : '—' },
              { label: 'Total Assigned Staff', value: data.total_assigned_staff ?? '—' },
              { label: 'Pending', value: data.pending ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-gray-mid)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
                <span style={{ fontWeight: 700, color: 'var(--color-navy)', fontFamily: 'var(--font-display)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function BillingTab({ days }: { days: number }) {
  const toast = useToast()
  const [data, setData] = useState<BillingReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    reportService.billing({ days })
      .then(setData)
      .catch(() => toast.error('Load Error', 'Failed to load billing report.'))
      .finally(() => setLoading(false))
  }, [days])

  if (loading) return <PageLoader />
  if (!data) return null

  const statusEntries = data.by_status ? Object.entries(data.by_status as Record<string, number>) : []
  const maxStatus = statusEntries.length ? Math.max(...statusEntries.map(([, v]) => v), 1) : 1
  const collectionRate = data.total_invoiced && data.total_invoiced > 0
    ? (data.total_collected / data.total_invoiced) * 100
    : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        <StatsCard icon="fa-file-invoice" value={`KES ${(data.total_invoiced ?? 0).toLocaleString()}`} label="Total Invoiced" iconBg="rgba(59,130,246,0.1)" iconColor="var(--color-info)" />
        <StatsCard icon="fa-circle-check" value={`KES ${(data.total_collected ?? 0).toLocaleString()}`} label="Collected" iconBg="rgba(34,197,94,0.1)" iconColor="var(--color-success)" />
        <StatsCard icon="fa-clock" value={`KES ${(data.total_outstanding ?? 0).toLocaleString()}`} label="Outstanding" iconBg="rgba(245,158,11,0.1)" iconColor="var(--color-warning)" />
        <StatsCard icon="fa-circle-xmark" value={data.unpaid_count ?? 0} label="Unpaid Invoices" iconBg="rgba(239,68,68,0.1)" iconColor="var(--color-danger)" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card card-body">
          <div className="card-title" style={{ marginBottom: '1rem' }}>Invoices by Status</div>
          <BarChart data={statusEntries.map(([label, value]) => ({ label, value }))} maxVal={maxStatus} />
        </div>
        <div className="card card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <div className="card-title" style={{ alignSelf: 'flex-start' }}>Collection Rate</div>
          <CircleRing pct={collectionRate} label="of invoiced amount collected" color="var(--color-success)" />
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
            KES {(data.total_collected ?? 0).toLocaleString()} of KES {(data.total_invoiced ?? 0).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  )
}

function StaffTab({ days }: { days: number }) {
  const toast = useToast()
  const [data, setData] = useState<StaffPerformanceReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    reportService.staffPerformance({ days })
      .then(setData)
      .catch(() => toast.error('Load Error', 'Failed to load staff report.'))
      .finally(() => setLoading(false))
  }, [days])

  if (loading) return <PageLoader />
  if (!data) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
        <StatsCard icon="fa-users" value={data.total_staff ?? 0} label="Total Staff" iconBg="rgba(59,130,246,0.1)" iconColor="var(--color-info)" />
        <StatsCard icon="fa-star" value={data.avg_rating != null ? data.avg_rating.toFixed(2) : '—'} label="Avg Rating" iconBg="rgba(245,158,11,0.1)" iconColor="var(--color-warning)" />
        <StatsCard icon="fa-circle-check" value={data.attendance_rate != null ? `${(data.attendance_rate * 100).toFixed(1)}%` : '—'} label="Attendance Rate" iconBg="rgba(34,197,94,0.1)" iconColor="var(--color-success)" />
      </div>

      {data.top_performers && data.top_performers.length > 0 && (
        <div className="card card-body">
          <div className="card-title" style={{ marginBottom: '1rem' }}>Top Performers</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>Staff</th><th>Jobs</th><th>Rating</th><th>Rec Score</th><th>Performance</th></tr>
              </thead>
              <tbody>
                {data.top_performers.map((p: any) => {
                  const score = p.recommendation_score ?? 0
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td>{p.jobs_count ?? 0}</td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <i className="fa-solid fa-star" style={{ color: 'var(--color-warning)', fontSize: '0.75rem' }} />
                          <span style={{ fontWeight: 600 }}>{p.avg_rating != null ? p.avg_rating.toFixed(1) : '—'}</span>
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--color-success)' }}>{(score * 100).toFixed(0)}%</td>
                      <td style={{ minWidth: '140px' }}>
                        <div className="score-bar-track">
                          <div style={{ height: '100%', width: `${score * 100}%`, background: ScoreBarColor(score), borderRadius: '4px', transition: 'width 0.4s ease' }} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.category_averages && (
        <div className="card card-body">
          <div className="card-title" style={{ marginBottom: '1rem' }}>Category Averages</div>
          <BarChart
            data={Object.entries(data.category_averages as Record<string, number>).map(([label, value]) => ({
              label,
              value: Math.round(value * 10) / 10,
              raw: value / 5,
            }))}
            maxVal={5}
            colorFn={ScoreBarColor}
          />
        </div>
      )}
    </div>
  )
}

function FleetTab({ days }: { days: number }) {
  const toast = useToast()
  const [data, setData] = useState<FleetReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    reportService.fleet({ days })
      .then(setData)
      .catch(() => toast.error('Load Error', 'Failed to load fleet report.'))
      .finally(() => setLoading(false))
  }, [days])

  if (loading) return <PageLoader />
  if (!data) return null

  const statusEntries = data.by_status ? Object.entries(data.by_status as Record<string, number>) : []
  const maxStatus = statusEntries.length ? Math.max(...statusEntries.map(([, v]) => v), 1) : 1
  const utilPct = data.utilisation_rate != null ? data.utilisation_rate * 100 : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        <StatsCard icon="fa-truck" value={data.total_trucks ?? 0} label="Total Trucks" iconBg="rgba(59,130,246,0.1)" iconColor="var(--color-info)" />
        <StatsCard icon="fa-circle-check" value={data.available ?? 0} label="Available" iconBg="rgba(34,197,94,0.1)" iconColor="var(--color-success)" />
        <StatsCard icon="fa-truck-moving" value={data.on_job ?? 0} label="On Job" iconBg="rgba(245,158,11,0.1)" iconColor="var(--color-warning)" />
        <StatsCard icon="fa-wrench" value={data.maintenance ?? 0} label="Maintenance" iconBg="rgba(239,68,68,0.1)" iconColor="var(--color-danger)" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card card-body">
          <div className="card-title" style={{ marginBottom: '1rem' }}>Fleet by Status</div>
          <BarChart data={statusEntries.map(([label, value]) => ({ label, value }))} maxVal={maxStatus} />
        </div>
        <div className="card card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <div className="card-title" style={{ alignSelf: 'flex-start' }}>Utilisation Rate</div>
          <CircleRing
            pct={utilPct}
            label="of fleet currently deployed"
            color={utilPct > 75 ? 'var(--color-danger)' : utilPct > 50 ? 'var(--color-warning)' : 'var(--color-success)'}
          />
          {data.overdue_service != null && data.overdue_service > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)', fontSize: '0.875rem', fontWeight: 600 }}>
              <i className="fa-solid fa-triangle-exclamation" />
              {data.overdue_service} truck{data.overdue_service !== 1 ? 's' : ''} overdue for service
            </div>
          )}
        </div>
      </div>
      {data.type_breakdown && (
        <div className="card card-body">
          <div className="card-title" style={{ marginBottom: '1rem' }}>Fleet by Type</div>
          <BarChart
            data={Object.entries(data.type_breakdown as Record<string, number>).map(([label, value]) => ({ label, value }))}
            maxVal={Math.max(...Object.values(data.type_breakdown as Record<string, number>), 1)}
          />
        </div>
      )}
    </div>
  )
}

function AttendanceTab({ days }: { days: number }) {
  const toast = useToast()
  const [data, setData] = useState<AttendanceReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    reportService.attendance({ days })
      .then(setData)
      .catch(() => toast.error('Load Error', 'Failed to load attendance report.'))
      .finally(() => setLoading(false))
  }, [days])

  if (loading) return <PageLoader />
  if (!data) return null

  const confirmPct = data.confirmation_rate != null ? data.confirmation_rate * 100 : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        <StatsCard icon="fa-calendar-check" value={data.total_records ?? 0} label="Total Records" iconBg="rgba(59,130,246,0.1)" iconColor="var(--color-info)" />
        <StatsCard icon="fa-circle-check" value={data.confirmed ?? 0} label="Confirmed" iconBg="rgba(34,197,94,0.1)" iconColor="var(--color-success)" />
        <StatsCard icon="fa-circle-xmark" value={data.absent ?? 0} label="Absent" iconBg="rgba(239,68,68,0.1)" iconColor="var(--color-danger)" />
        <StatsCard icon="fa-clock" value={data.pending ?? 0} label="Pending" iconBg="rgba(245,158,11,0.1)" iconColor="var(--color-warning)" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="card-title" style={{ alignSelf: 'flex-start' }}>Confirmation Rate</div>
          <CircleRing
            pct={confirmPct}
            label="of assignments confirmed"
            color={confirmPct >= 75 ? 'var(--color-success)' : confirmPct >= 50 ? 'var(--color-warning)' : 'var(--color-danger)'}
          />
        </div>
        <div className="card card-body">
          <div className="card-title" style={{ marginBottom: '1rem' }}>Status Breakdown</div>
          <BarChart
            data={[
              { label: 'Confirmed', value: data.confirmed ?? 0 },
              { label: 'Absent', value: data.absent ?? 0 },
              { label: 'Pending', value: data.pending ?? 0 },
            ]}
            maxVal={data.total_records ?? 1}
          />
          {data.top_absent_staff && data.top_absent_staff.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-danger)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Most Absences</div>
              {data.top_absent_staff.slice(0, 5).map((s: any) => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', padding: '0.25rem 0' }}>
                  <span>{s.name}</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-danger)' }}>{s.absent_count} absent</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ApplicationsTab({ days }: { days: number }) {
  const toast = useToast()
  const [data, setData] = useState<ApplicationsReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    reportService.applications({ days })
      .then(setData)
      .catch(() => toast.error('Load Error', 'Failed to load applications report.'))
      .finally(() => setLoading(false))
  }, [days])

  if (loading) return <PageLoader />
  if (!data) return null

  const statusEntries = data.by_status ? Object.entries(data.by_status as Record<string, number>) : []
  const maxStatus = statusEntries.length ? Math.max(...statusEntries.map(([, v]) => v), 1) : 1
  const approvalPct = data.approval_rate != null ? data.approval_rate * 100 : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        <StatsCard icon="fa-paper-plane" value={data.total ?? 0} label="Total Applications" iconBg="rgba(59,130,246,0.1)" iconColor="var(--color-info)" />
        <StatsCard icon="fa-circle-check" value={data.approved ?? 0} label="Approved" iconBg="rgba(34,197,94,0.1)" iconColor="var(--color-success)" />
        <StatsCard icon="fa-circle-xmark" value={data.rejected ?? 0} label="Rejected" iconBg="rgba(239,68,68,0.1)" iconColor="var(--color-danger)" />
        <StatsCard icon="fa-clock" value={data.pending ?? 0} label="Pending" iconBg="rgba(245,158,11,0.1)" iconColor="var(--color-warning)" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card card-body">
          <div className="card-title" style={{ marginBottom: '1rem' }}>By Status</div>
          <BarChart data={statusEntries.map(([label, value]) => ({ label, value }))} maxVal={maxStatus} />
        </div>
        <div className="card card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="card-title" style={{ alignSelf: 'flex-start' }}>Approval Rate</div>
          <CircleRing
            pct={approvalPct}
            label="of applications approved"
            color={approvalPct >= 60 ? 'var(--color-success)' : approvalPct >= 40 ? 'var(--color-warning)' : 'var(--color-danger)'}
          />
          {data.most_applied_jobs && data.most_applied_jobs.length > 0 && (
            <div style={{ width: '100%' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Most Applied Jobs</div>
              {data.most_applied_jobs.slice(0, 4).map((j: any) => (
                <div key={j.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', padding: '0.25rem 0', borderBottom: '1px solid var(--color-gray-mid)' }}>
                  <span style={{ color: 'var(--color-text-muted)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.title}</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-info)' }}>{j.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { isAdmin } = useAuth()
  const router = useRouter()
  const toast = useToast()
  const [tab, setTab] = useState('dashboard')
  const [days, setDays] = useState(30)

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Access Denied', 'Reports are only available to admins.')
      router.replace('/dashboard/staff')
    }
  }, [isAdmin])

  if (!isAdmin) return null

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Reports</h1>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Business analytics and performance data</div>
        </div>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          {RANGES.map(r => (
            <button
              key={r.value}
              className={`filter-pill${days === r.value ? ' active' : ''}`}
              onClick={() => setDays(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div className="tab-bar" style={{ marginBottom: '1.5rem' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            className={`tab-btn${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            <i className={`fa-solid ${t.icon}`} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'dashboard' && <DashboardTab days={days} />}
      {tab === 'jobs' && <JobsTab days={days} />}
      {tab === 'billing' && <BillingTab days={days} />}
      {tab === 'staff' && <StaffTab days={days} />}
      {tab === 'fleet' && <FleetTab days={days} />}
      {tab === 'attendance' && <AttendanceTab days={days} />}
      {tab === 'applications' && <ApplicationsTab days={days} />}
    </div>
  )
}
