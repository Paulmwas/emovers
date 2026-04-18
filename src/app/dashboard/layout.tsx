'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ToastProvider, useToast } from '@/contexts/ToastContext'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { PageLoader } from '@/components/ui/Spinner'
import { notificationService } from '@/lib/services'

// Admin-only paths — staff is redirected with toast
const ADMIN_ONLY_PATHS = [
  '/dashboard/admin',
  '/dashboard/customers',
  '/dashboard/staff-management',
  '/dashboard/reports',
]

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isLoading } = useAuth()
  const toast = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Redirect if not authed
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    }
  }, [isLoading, user, router])

  // Role guard for admin-only pages
  useEffect(() => {
    if (!isLoading && user && !isAdmin) {
      const isAdminPath = ADMIN_ONLY_PATHS.some(p => pathname.startsWith(p))
      if (isAdminPath) {
        toast.error('Access Denied', 'You do not have permission to view this page.')
        router.push('/dashboard/staff')
      }
    }
  }, [isLoading, user, isAdmin, pathname, router, toast])

  // Poll notification count every 60s
  useEffect(() => {
    if (!user) return
    const fetchCount = () => {
      notificationService.unreadCount()
        .then(data => setUnreadCount(data.count || 0))
        .catch(() => {})
    }
    fetchCount()
    const interval = setInterval(fetchCount, 60000)
    return () => clearInterval(interval)
  }, [user])

  if (isLoading) return <PageLoader label="Loading dashboard..." />
  if (!user) return <PageLoader label="Redirecting..." />

  return (
    <div className="dashboard-shell">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        unreadCount={unreadCount}
      />
      <div className="main-area">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          unreadCount={unreadCount}
        />
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <DashboardShell>{children}</DashboardShell>
      </ToastProvider>
    </AuthProvider>
  )
}
