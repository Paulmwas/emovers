'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

const ADMIN_NAV = [
  { href: '/dashboard/admin',            icon: 'fa-gauge-high',          label: 'Dashboard' },
  { href: '/dashboard/jobs',             icon: 'fa-truck-moving',        label: 'Jobs' },
  { href: '/dashboard/customers',        icon: 'fa-users',               label: 'Customers' },
  { href: '/dashboard/fleet',            icon: 'fa-truck',               label: 'Fleet' },
  { href: '/dashboard/billing',          icon: 'fa-file-invoice-dollar', label: 'Billing' },
  { href: '/dashboard/reviews',          icon: 'fa-star',                label: 'Reviews' },
  { href: '/dashboard/staff-management', icon: 'fa-id-badge',            label: 'Staff Mgmt' },
  { href: '/dashboard/reports',          icon: 'fa-chart-bar',           label: 'Reports' },
  { href: '/dashboard/notifications',    icon: 'fa-bell',                label: 'Notifications' },
]

const STAFF_NAV = [
  { href: '/dashboard/staff',         icon: 'fa-gauge',        label: 'My Dashboard' },
  { href: '/dashboard/jobs',          icon: 'fa-truck-moving', label: 'Jobs' },
  { href: '/dashboard/reviews',       icon: 'fa-star',         label: 'My Reviews' },
  { href: '/dashboard/notifications', icon: 'fa-bell',         label: 'Notifications' },
]

interface SidebarProps {
  open?: boolean
  onClose?: () => void
  unreadCount?: number
}

export function Sidebar({ open = true, onClose, unreadCount = 0 }: SidebarProps) {
  const { user, isAdmin, logout } = useAuth()
  const pathname = usePathname()
  const navItems = isAdmin ? ADMIN_NAV : STAFF_NAV

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    : 'U'

  const handleLogout = async () => {
    await logout()
    window.location.href = '/auth/login'
  }

  return (
    <>
      {onClose && (
        <div
          className={`sidebar-overlay${open ? ' visible' : ''}`}
          onClick={onClose}
        />
      )}

      <div className={`sidebar${open ? ' open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '1.5rem 1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.5rem', color: 'white', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
            <span style={{ color: 'var(--color-orange)' }}>E-</span>Movers
          </div>
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.125rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Management System
          </div>
        </div>

        {/* User chip */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '2.25rem', height: '2.25rem', borderRadius: '50%',
              background: 'var(--color-orange)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.875rem', flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: 'white', fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.full_name || user?.email || 'User'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {isAdmin ? 'Admin' : 'Staff'}
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0.75rem', overflowY: 'auto' }}>
          {navItems.map(item => {
            const isNotif = item.href === '/dashboard/notifications'
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard/admin' && item.href !== '/dashboard/staff' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link${isActive ? ' active' : ''}`}
                onClick={onClose}
              >
                <i className={`fa-solid ${item.icon}`} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {isNotif && unreadCount > 0 && (
                  <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Link href="/" className="sidebar-link" onClick={onClose}>
            <i className="fa-solid fa-house" />
            <span>Homepage</span>
          </Link>
          <button
            className="sidebar-link"
            style={{ width: '100%', border: 'none', cursor: 'pointer', background: 'none' }}
            onClick={handleLogout}
          >
            <i className="fa-solid fa-right-from-bracket" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  )
}

export default Sidebar
