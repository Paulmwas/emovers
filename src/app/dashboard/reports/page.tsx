'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { useRouter } from 'next/navigation'
import { reportService } from '@/lib/services'
import { PageLoader } from '@/components/ui/Spinner'
import { StatsCard } from '@/components/ui/StatsCard'
import type { BillingReport } from '@/types'

const RANGES = [
  { value: 7, label: '7 Days' },
  { value: 30, label: '30 Days' },
  { value: 90, label: '90 Days' },
  { value: 365, label: '1 Year' },
  { value: 0, label: 'All Time' },
]

function BarChart({ data, maxVal }: {
  data: { label: string; value: number }[]
  maxVal: number
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {data.map(({ label, value }) => {
        const pct = maxVal > 0 ? (value / maxVal) * 100 : 0
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', minWidth: '130px', textTransform: 'capitalize' }}>{label.replace(/_/g, ' ')}</span>
            <div className="score-bar-track" style={{ flex: 1 }}>
              <div className="score-bar-fill high" style={{ width: `${pct}%` }} />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', minWidth: '2.5rem', textAlign: 'right', fontWeight: 600 }}>{value}</span>
          </div>
        )
      })}
    </div>
  )
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

function BillingContent({ days }: { days: number }) {
  const toast = useToast()
  const [data, setData] = useState<BillingReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    reportService.billing(days === 0 ? { all: true } : { days })
      .then(setData)
      .catch(() => toast.error('Load Error', 'Failed to load billing report.'))
      .finally(() => setLoading(false))
  }, [days])

  if (loading) return <PageLoader />
  if (!data) return null

  const statusEntries = data.by_status ? Object.entries(data.by_status as Record<string, number>) : []
  const maxStatus = statusEntries.length ? Math.max(...statusEntries.map(([, v]) => v), 1) : 1
  const totalInvoiced = data.total_invoiced ?? data.revenue_totals?.total_invoiced ?? 0
  const totalCollected = data.total_collected ?? data.revenue_totals?.total_collected ?? 0
  const collectionRate = totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.25rem' }}>
        <StatsCard icon="fa-file-invoice" value={`KES ${(totalInvoiced).toLocaleString()}`} label="Total Invoiced" iconBg="rgba(59,130,246,0.1)" iconColor="var(--color-info)" />
        <StatsCard icon="fa-circle-check" value={`KES ${(totalCollected).toLocaleString()}`} label="Collected" iconBg="rgba(34,197,94,0.1)" iconColor="var(--color-success)" />
        <StatsCard icon="fa-clock" value={`KES ${(data.total_outstanding ?? data.revenue_totals?.total_outstanding ?? 0).toLocaleString()}`} label="Outstanding" iconBg="rgba(245,158,11,0.1)" iconColor="var(--color-warning)" />
        <StatsCard icon="fa-building" value={`KES ${parseFloat(String(data.total_company_profit ?? data.revenue_totals?.total_company_profit ?? 0)).toLocaleString()}`} label="Company Profit" iconBg="rgba(99,102,241,0.1)" iconColor="#6366f1" />
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
            KES {totalCollected.toLocaleString()} of KES {totalInvoiced.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const { isAdmin } = useAuth()
  const router = useRouter()
  const toast = useToast()
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
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Billing Report</h1>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Revenue and invoice analytics</div>
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

      <BillingContent days={days} />
    </div>
  )
}
