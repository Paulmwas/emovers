'use client'

import React from 'react'

interface StatsCardProps {
  icon: string
  value: string | number
  label: string
  iconBg?: string
  iconColor?: string
  trend?: { value: string; up: boolean }
  onClick?: () => void
}

export function StatsCard({ icon, value, label, iconBg, iconColor, trend, onClick }: StatsCardProps) {
  return (
    <div
      className="stats-card"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div
        className="stats-icon"
        style={{
          background: iconBg || 'rgba(232, 69, 10, 0.1)',
          color: iconColor || 'var(--color-orange)',
        }}
      >
        <i className={`fa-solid ${icon}`} />
      </div>
      <div>
        <div className="stats-value">{value}</div>
        <div className="stats-label">{label}</div>
        {trend && (
          <div className={`stats-trend ${trend.up ? 'trend-up' : 'trend-down'}`}>
            <i className={`fa-solid fa-arrow-${trend.up ? 'up' : 'down'}`} />
            {trend.value}
          </div>
        )}
      </div>
    </div>
  )
}

export default StatsCard
