'use client'

import React from 'react'

const STATUS_ICONS: Record<string, string> = {
  pending:     'fa-clock',
  assigned:    'fa-users',
  in_progress: 'fa-truck-moving',
  completed:   'fa-circle-check',
  cancelled:   'fa-circle-xmark',
  paid:        'fa-circle-check',
  unpaid:      'fa-circle-xmark',
  partial:     'fa-circle-half-stroke',
  waived:      'fa-ban',
  available:   'fa-circle-check',
  on_job:      'fa-truck',
  maintenance: 'fa-wrench',
  applied:     'fa-paper-plane',
  approved:    'fa-circle-check',
  rejected:    'fa-circle-xmark',
  withdrawn:   'fa-rotate-left',
  confirmed:   'fa-circle-check',
  absent:      'fa-circle-xmark',
  small:       'fa-box',
  medium:      'fa-boxes-stacked',
  large:       'fa-warehouse',
  extra_large: 'fa-building',
}

interface BadgeProps {
  status: string
  label?: string
  showIcon?: boolean
}

export function Badge({ status, label, showIcon = true }: BadgeProps) {
  const key = status.toLowerCase().replace(/[\s-]/g, '_')
  const icon = STATUS_ICONS[key] || 'fa-circle'
  const displayLabel = label || status.replace(/_/g, ' ')

  return (
    <span className={`badge badge-${key}`}>
      {showIcon && <i className={`fa-solid ${icon}`} />}
      {displayLabel}
    </span>
  )
}

export default Badge
