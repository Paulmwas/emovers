'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { ToastProvider, useToast } from '@/contexts/ToastContext'
import { AuthProvider } from '@/contexts/AuthContext'

function LoginForm() {
  const { login } = useAuth()
  const toast = useToast()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      toast.success(`Welcome back, ${user.first_name || user.email}!`)
      if (user.role === 'mover-admin') {
        router.push('/dashboard/admin')
      } else {
        router.push('/dashboard/staff')
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        Object.values(err.response?.data || {}).flat().join(' ') ||
        'Invalid email or password. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { icon: 'fa-truck-moving',       label: 'Job & Team Management' },
    { icon: 'fa-users',              label: 'Staff Scheduling & Reviews' },
    { icon: 'fa-file-invoice-dollar', label: 'Invoicing & Payments' },
    { icon: 'fa-chart-bar',          label: 'Real-Time Reports' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left panel */}
      <div style={{
        width: '45%', minWidth: '380px',
        background: 'linear-gradient(160deg, var(--color-navy) 0%, var(--color-navy-mid) 60%, #1A4A72 100%)',
        padding: '3rem',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative bg pattern */}
        <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,255,255,0.015) 40px, rgba(255,255,255,0.015) 80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: '-4rem', top: '-4rem', width: '20rem', height: '20rem', borderRadius: '50%', background: 'rgba(232,69,10,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: '-3rem', bottom: '-3rem', width: '16rem', height: '16rem', borderRadius: '50%', background: 'rgba(255,184,0,0.05)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
              <span style={{ color: 'var(--color-orange)' }}>E-</span>
              <span style={{ color: 'white' }}>Movers</span>
            </div>
          </Link>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.125rem' }}>
            Management System
          </div>
        </div>

        {/* Middle content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '2.75rem',
              color: 'white', textTransform: 'uppercase', letterSpacing: '-0.02em',
              lineHeight: 0.95, marginBottom: '1rem',
            }}>
              Welcome<br />
              <span style={{ color: 'var(--color-yellow)' }}>Back</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-body)', fontSize: '0.9375rem', lineHeight: 1.7, maxWidth: '28rem' }}>
              Sign in to manage jobs, staff, fleet, and billing all in one place.
            </p>
          </div>

          {/* Feature chips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {features.map(f => (
              <div key={f.icon} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <div style={{
                  width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem',
                  background: 'rgba(255,255,255,0.08)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-yellow)', fontSize: '0.875rem', flexShrink: 0,
                }}>
                  <i className={`fa-solid ${f.icon}`} />
                </div>
                <span style={{ color: 'rgba(255,255,255,0.75)', fontFamily: 'var(--font-body)', fontSize: '0.9rem', fontWeight: 500 }}>
                  {f.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <div style={{ position: 'relative', zIndex: 1, color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', fontFamily: 'var(--font-body)' }}>
          No public registration. Contact your admin to get access.
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: 1, background: 'var(--color-gray-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '3rem 2rem',
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.75rem', textTransform: 'uppercase', color: 'var(--color-navy)', marginBottom: '0.375rem' }}>
              Sign In
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>
              Enter your credentials to access the dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 'var(--radius-sm)', padding: '0.875rem 1rem',
                display: 'flex', alignItems: 'flex-start', gap: '0.625rem',
                color: '#B91C1C', fontSize: '0.875rem', fontFamily: 'var(--font-body)',
              }}>
                <i className="fa-solid fa-circle-xmark" style={{ marginTop: '0.0625rem', flexShrink: 0 }} />
                {error}
              </div>
            )}

            <div>
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  <i className="fa-solid fa-envelope" />
                </span>
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="admin@emovers.co.ke"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  <i className="fa-solid fa-lock" />
                </span>
                <input
                  type={showPw ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.875rem', padding: 0 }}
                >
                  <i className={`fa-solid ${showPw ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !email || !password}
              style={{ width: '100%', justifyContent: 'center', padding: '0.875rem' }}
            >
              {loading ? (
                <>
                  <span className="spinner spinner-sm" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
                  Signing In...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-right-to-bracket" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <Link href="/" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
              <i className="fa-solid fa-arrow-left" />
              Back to Homepage
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="width: 45%"] { display: none !important; }
        }
      `}</style>
    </div>
  )
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <ToastProvider>
        <LoginForm />
      </ToastProvider>
    </AuthProvider>
  )
}
