'use client'

import React from 'react'

interface EmptyStateProps {
  icon?: string
  title?: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({
  icon = 'fa-inbox',
  title = 'Nothing Here',
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <i className={`fa-solid ${icon}`} />
      </div>
      <div className="empty-title">{title}</div>
      {description && <div className="empty-desc">{description}</div>}
      {action && <div style={{ marginTop: '1.5rem' }}>{action}</div>}
    </div>
  )
}

export default EmptyState
