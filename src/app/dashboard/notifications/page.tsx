'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/contexts/ToastContext'
import { notificationService } from '@/lib/services'
import { PageLoader } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import type { Notification } from '@/types'

const TYPE_ICON: Record<string, string> = {
  job_assigned: 'fa-briefcase',
  job_cancelled: 'fa-circle-xmark',
  job_completed: 'fa-circle-check',
  application_approved: 'fa-thumbs-up',
  application_rejected: 'fa-thumbs-down',
  attendance_required: 'fa-calendar-check',
  payment_recorded: 'fa-money-bill',
  disbursement: 'fa-money-bill-transfer',
  review_received: 'fa-star',
  general: 'fa-bell',
}

const TYPE_COLOR: Record<string, string> = {
  job_assigned: 'var(--color-info)',
  job_cancelled: 'var(--color-danger)',
  job_completed: 'var(--color-success)',
  application_approved: 'var(--color-success)',
  application_rejected: 'var(--color-danger)',
  attendance_required: 'var(--color-warning)',
  payment_recorded: 'var(--color-success)',
  disbursement: 'var(--color-success)',
  review_received: 'var(--color-warning)',
  general: 'var(--color-navy)',
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString('en-KE')
}

function NotificationItem({
  notif,
  onRead,
}: {
  notif: Notification
  onRead: (n: Notification) => void
}) {
  const router = useRouter()
  const icon = TYPE_ICON[notif.notification_type] ?? TYPE_ICON.general
  const color = TYPE_COLOR[notif.notification_type] ?? TYPE_COLOR.general

  const handleClick = () => {
    onRead(notif)
    if (notif.job) {
      router.push(`/dashboard/jobs/${notif.job}`)
    }
  }

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex',
        gap: '1rem',
        padding: '1rem 1.25rem',
        borderBottom: '1px solid var(--color-gray-mid)',
        cursor: notif.job ? 'pointer' : 'default',
        background: notif.is_read ? 'transparent' : 'rgba(255,107,0,0.03)',
        position: 'relative',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => { if (notif.job) (e.currentTarget as HTMLDivElement).style.background = 'var(--color-gray-light)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = notif.is_read ? 'transparent' : 'rgba(255,107,0,0.03)' }}
    >
      {/* Unread accent */}
      {!notif.is_read && (
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '3px',
          background: 'var(--color-orange)',
          borderRadius: '0 2px 2px 0',
        }} />
      )}

      {/* Icon */}
      <div style={{
        width: '2.25rem',
        height: '2.25rem',
        borderRadius: '50%',
        background: `${color}18`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <i className={`fa-solid ${icon}`} style={{ color, fontSize: '0.875rem' }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: notif.is_read ? 400 : 700,
          fontSize: '0.9rem',
          color: 'var(--color-text-body)',
          marginBottom: '0.2rem',
          lineHeight: 1.4,
        }}>
          {notif.title}
        </div>
        {notif.message && (
          <div style={{
            fontSize: '0.8rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {notif.message}
          </div>
        )}
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.375rem', flexShrink: 0 }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
          {relativeTime(notif.created_at)}
        </span>
        {!notif.is_read && (
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--color-orange)',
            display: 'inline-block',
          }} />
        )}
        {notif.job && (
          <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }} />
        )}
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const toast = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  const loadNotifications = useCallback(() => {
    setLoading(true)
    const params: Record<string, any> = { page, page_size: 20 }
    if (filter === 'unread') params.is_read = false
    notificationService.list(params)
      .then((data: any) => {
        const list = data.results || data
        setNotifications(list)
        setTotal(data.count || list.length)
      })
      .catch(() => toast.error('Load Error', 'Failed to load notifications.'))
      .finally(() => setLoading(false))
  }, [page, filter])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const handleRead = async (notif: Notification) => {
    if (notif.is_read) return
    try {
      await notificationService.markRead(notif.id)
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n))
    } catch {
      // silent — navigation still happens
    }
  }

  const handleMarkAll = async () => {
    setMarkingAll(true)
    try {
      await notificationService.markAllRead()
      toast.success('All Read', 'All notifications marked as read.')
      loadNotifications()
    } catch {
      toast.error('Failed', 'Could not mark all as read.')
    } finally {
      setMarkingAll(false) }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Notifications</h1>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            {total} notification{total !== 1 ? 's' : ''}
            {unreadCount > 0 && <span style={{ color: 'var(--color-orange)', fontWeight: 600 }}> · {unreadCount} unread</span>}
          </div>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-outline btn-sm" onClick={handleMarkAll} disabled={markingAll}>
            {markingAll && <span className="spinner spinner-sm" />}
            <i className="fa-solid fa-check-double" />
            Mark All Read
          </button>
        )}
      </div>

      {/* Filter pills */}
      <div className="filter-bar">
        <button
          className={`filter-pill${filter === 'all' ? ' active' : ''}`}
          onClick={() => { setFilter('all'); setPage(1) }}
        >
          All
        </button>
        <button
          className={`filter-pill${filter === 'unread' ? ' active' : ''}`}
          onClick={() => { setFilter('unread'); setPage(1) }}
        >
          Unread
        </button>
      </div>

      <div className="card">
        {loading ? (
          <PageLoader />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={filter === 'unread' ? 'fa-check-double' : 'fa-bell'}
            title={filter === 'unread' ? 'All Caught Up' : 'No Notifications'}
            description={filter === 'unread' ? 'You have no unread notifications.' : 'You have no notifications yet.'}
          />
        ) : (
          <>
            {notifications.map(n => (
              <NotificationItem key={n.id} notif={n} onRead={handleRead} />
            ))}
            <Pagination page={page} pageSize={20} total={total} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}
