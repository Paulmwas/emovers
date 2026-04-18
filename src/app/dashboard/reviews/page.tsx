'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { reviewService } from '@/lib/services'
import { PageLoader } from '@/components/ui/Spinner'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState } from '@/components/ui/EmptyState'
import type { StaffReview } from '@/types'

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="star-rating">
      {[1,2,3,4,5].map(s => <i key={s} className={`fa-solid fa-star${s > rating ? ' star-empty' : ''}`} />)}
    </span>
  )
}

export default function ReviewsPage() {
  const { isAdmin, user } = useAuth()
  const toast = useToast()
  const [reviews, setReviews] = useState<StaffReview[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [catFilter, setCatFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ avg: 0, score: '0%' })

  const CATS = ['overall', 'punctuality', 'teamwork', 'care_of_goods', 'physical_fitness', 'communication']

  useEffect(() => {
    setLoading(true)
    const params: Record<string, any> = { page, page_size: 20 }
    if (catFilter) params.category = catFilter
    const fetcher = isAdmin ? reviewService.list(params) : reviewService.myReviews()
    Promise.resolve(fetcher)
      .then(data => {
        const list = data.results || data
        setReviews(list)
        setTotal(data.count || list.length)
        if (!isAdmin && list.length > 0) {
          const avg = list.reduce((s: number, r: StaffReview) => s + r.rating, 0) / list.length
          setSummary({ avg: Math.round(avg * 10) / 10, score: `${Math.round(avg * 20)}%` })
        }
      })
      .catch(() => toast.error('Load Error', 'Failed to load reviews.'))
      .finally(() => setLoading(false))
  }, [page, catFilter, isAdmin])

  if (loading) return <PageLoader />

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{isAdmin ? 'All Reviews' : 'My Reviews'}</h1>
        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{total} reviews</div>
      </div>

      {/* Staff summary card */}
      {!isAdmin && reviews.length > 0 && (
        <div className="card card-body" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '3rem', color: 'var(--color-navy)', lineHeight: 1 }}>{summary.avg}</div>
              <StarDisplay rating={Math.round(summary.avg)} />
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Overall Average</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--color-navy)', marginBottom: '0.75rem' }}>Category Breakdown</div>
              {CATS.map(cat => {
                const catRevs = reviews.filter(r => r.category === cat)
                const avg = catRevs.length ? catRevs.reduce((s, r) => s + r.rating, 0) / catRevs.length : 0
                return (
                  <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', minWidth: '120px', textTransform: 'capitalize' }}>{cat.replace(/_/g, ' ')}</span>
                    <div className="score-bar-track" style={{ flex: 1 }}>
                      <div className={`score-bar-fill ${avg >= 4 ? 'high' : avg >= 3 ? 'mid' : 'low'}`} style={{ width: `${(avg / 5) * 100}%` }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', minWidth: '2rem', textAlign: 'right' }}>{avg > 0 ? avg.toFixed(1) : '—'}</span>
                  </div>
                )
              })}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '2.5rem', color: 'var(--color-success)', lineHeight: 1 }}>{summary.score}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Recommendation Score</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filter-bar">
        <button className={`filter-pill${catFilter === '' ? ' active' : ''}`} onClick={() => { setCatFilter(''); setPage(1) }}>All</button>
        {CATS.map(c => (
          <button key={c} className={`filter-pill${catFilter === c ? ' active' : ''}`} onClick={() => { setCatFilter(c); setPage(1) }}>
            {c.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div className="card">
        {reviews.length === 0 ? (
          <EmptyState icon="fa-star" title="No Reviews" description="No reviews found." />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {isAdmin && <th>Reviewer</th>}
                    {isAdmin && <th>Reviewee</th>}
                    <th>Job</th>
                    <th>Category</th>
                    <th>Rating</th>
                    <th>Comment</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map(r => (
                    <tr key={r.id}>
                      {isAdmin && <td style={{ fontSize: '0.875rem' }}>{r.reviewer_name}</td>}
                      {isAdmin && <td style={{ fontWeight: 600, color: 'var(--color-navy)', fontSize: '0.875rem' }}>{r.reviewee_name}</td>}
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.job_title}</td>
                      <td style={{ fontSize: '0.8rem', textTransform: 'capitalize' }}>{r.category_display}</td>
                      <td><StarDisplay rating={r.rating} /></td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', maxWidth: '200px', fontStyle: r.comment ? 'italic' : 'normal' }}>
                        {r.comment || '—'}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{new Date(r.created_at).toLocaleDateString('en-KE')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageSize={20} total={total} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}
