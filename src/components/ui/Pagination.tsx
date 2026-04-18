'use client'

import React from 'react'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
}

export function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  if (totalPages <= 1) return null

  const pages: (number | '...')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  return (
    <div className="pagination">
      <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
        Showing {start}–{end} of {total}
      </span>
      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
        <button className="page-btn" onClick={() => onChange(page - 1)} disabled={page === 1}>
          <i className="fa-solid fa-chevron-left" style={{ fontSize: '0.75rem' }} />
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} style={{ padding: '0 0.25rem', color: 'var(--color-text-muted)' }}>…</span>
          ) : (
            <button
              key={p}
              className={`page-btn${page === p ? ' active' : ''}`}
              onClick={() => onChange(p as number)}
            >
              {p}
            </button>
          )
        )}
        <button className="page-btn" onClick={() => onChange(page + 1)} disabled={page === totalPages}>
          <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.75rem' }} />
        </button>
      </div>
    </div>
  )
}

export default Pagination
