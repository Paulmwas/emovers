'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

const NAV_LINKS = [
  { label: 'Home', href: '#hero' },
  { label: 'Services', href: '#services' },
  { label: 'About', href: '#explore' },
  { label: 'How It Works', href: '#steps' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'Contact', href: '#footer' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav className={`landing-nav${scrolled ? ' scrolled' : ''}`}>
      <div className="container-wide" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem' }}>
        {/* Logo */}
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.75rem', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          <span style={{ color: scrolled ? 'var(--color-orange)' : 'var(--color-yellow)' }}>E-</span>
          <span style={{ color: scrolled ? 'var(--color-navy)' : 'var(--color-white)' }}>Movers</span>
        </div>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }} className="nav-desktop">
          {NAV_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: '0.9rem',
                color: scrolled ? 'var(--color-navy)' : 'rgba(255,255,255,0.85)',
                textDecoration: 'none',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-orange)')}
              onMouseLeave={e => (e.currentTarget.style.color = scrolled ? 'var(--color-navy)' : 'rgba(255,255,255,0.85)')}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <a
            href="tel:+254700000000"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: 'var(--color-orange)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
            className="nav-phone"
          >
            <i className="fa-solid fa-phone" />
            +254 700 000 000
          </a>
          <Link href="/auth/login" className="btn btn-primary btn-sm">
            <i className="fa-solid fa-right-to-bracket" />
            Login
          </Link>
          {/* Hamburger */}
          <button
            className="btn btn-ghost btn-sm nav-hamburger"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ padding: '0.375rem' }}
          >
            <i className={`fa-solid ${mobileOpen ? 'fa-xmark' : 'fa-bars'}`} style={{ color: scrolled ? 'var(--color-navy)' : 'white', fontSize: '1.125rem' }} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{
          background: 'var(--color-white)',
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--color-gray-mid)',
          boxShadow: 'var(--shadow-md)',
        }}>
          {NAV_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'block',
                padding: '0.75rem 0',
                borderBottom: '1px solid var(--color-gray-mid)',
                fontWeight: 600,
                color: 'var(--color-navy)',
                textDecoration: 'none',
              }}
            >
              {link.label}
            </a>
          ))}
          <div style={{ marginTop: '1rem' }}>
            <Link href="/auth/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Login to Dashboard
            </Link>
          </div>
        </div>
      )}

      <style>{`
        .nav-desktop { display: flex; }
        .nav-phone { display: flex; }
        .nav-hamburger { display: none; }
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-phone { display: none !important; }
          .nav-hamburger { display: flex !important; }
        }
      `}</style>
    </nav>
  )
}

export default Navbar
