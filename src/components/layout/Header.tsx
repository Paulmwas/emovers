'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { notificationService } from '@/lib/services'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard/admin':            'Dashboard',
  '/dashboard/staff':            'My Dashboard',
  '/dashboard/jobs':             'Jobs',
  '/dashboard/customers':        'Customers',
  '/dashboard/fleet':            'Fleet',
  '/dashboard/billing':          'Billing',
  '/dashboard/reviews':          'Reviews',
  '/dashboard/staff-management': 'Staff Management',
  '/dashboard/reports':          'Reports',
  '/dashboard/notifications':    'Notifications',
}

interface HeaderProps {
  onMenuClick?: () => void
  unreadCount?: number
}

export function Header({ onMenuClick, unreadCount = 0 }: HeaderProps) {
  const { user, isAdmin } = useAuth()
  const pathname = usePathname()

  const title = PAGE_TITLES[pathname] ||
    (pathname.includes('/jobs/') ? 'Job Detail' : '') ||
    (pathname.includes('/billing/') ? 'Invoice Detail' : 'Dashboard')

  const now = new Date().toLocaleDateString('en-KE', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    : 'U'

  return (
    <header className="top-header">
      {/* Hamburger (mobile) */}
      <button
        className="btn btn-ghost btn-sm"
        onClick={onMenuClick}
        style={{ display: 'none', padding: '0.375rem' }}
        id="hamburger-btn"
      >
        <i className="fa-solid fa-bars" />
      </button>

      {/* Page title */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: '1.25rem',
          textTransform: 'uppercase',
          letterSpacing: '-0.01em',
          color: 'var(--color-navy)',
        }}>
          {title}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.0625rem' }}>
          {now}
        </div>
      </div>

      {/* Notification bell */}
      <Link
        href="/dashboard/notifications"
        style={{ position: 'relative', color: 'var(--color-text-muted)', textDecoration: 'none', padding: '0.375rem', borderRadius: 'var(--radius-sm)', transition: 'color 0.15s ease' }}
      >
        <i className="fa-solid fa-bell" style={{ fontSize: '1.125rem' }} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '0', right: '0',
            background: 'var(--color-danger)', color: 'white',
            fontSize: '0.6rem', fontWeight: 700,
            minWidth: '1rem', height: '1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '9999px', padding: '0 0.2rem',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Link>

      {/* User avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <div style={{
          width: '2rem', height: '2rem', borderRadius: '50%',
          background: 'var(--color-navy)', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.75rem',
        }}>
          {initials}
        </div>
        <div style={{ display: 'none' }} id="user-name-header">
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-navy)' }}>
            {user?.full_name || user?.email}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            {isAdmin ? 'Admin' : 'Staff'}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #hamburger-btn { display: flex !important; }
        }
        @media (min-width: 1024px) {
          #user-name-header { display: block !important; }
        }
      `}</style>
    </header>
  )
}

export default Header
