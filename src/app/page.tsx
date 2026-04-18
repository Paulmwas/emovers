'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'

// ─── Animated counter hook ───────────────────────────────────────────
function useCountUp(target: number, duration = 2000, inView: boolean) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [inView, target, duration])
  return count
}

function StatCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  const count = useCountUp(value, 1800, inView)
  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div className="stat-number">{count}{suffix}</div>
      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: 500, marginTop: '0.25rem', fontFamily: 'var(--font-body)' }}>
        {label}
      </div>
    </div>
  )
}

// ─── Service tab items ───────────────────────────────────────────────
const ALL_SERVICES = [
  { icon: 'fa-city',        label: 'Local Moving',      category: 'moving' },
  { icon: 'fa-road',        label: 'Long-Distance',      category: 'moving' },
  { icon: 'fa-map-location-dot', label: 'Relocation',  category: 'moving' },
  { icon: 'fa-boxes-stacked', label: 'Full-Service',    category: 'moving' },
  { icon: 'fa-earth-americas', label: 'Cross-Country',  category: 'moving' },
  { icon: 'fa-box',         label: 'Moving Supplies',    category: 'moving' },
  { icon: 'fa-globe',       label: 'International',      category: 'moving' },
  { icon: 'fa-shield-halved', label: 'Military',         category: 'moving' },
  { icon: 'fa-warehouse',   label: 'Secure Storage',     category: 'storage' },
  { icon: 'fa-temperature-low', label: 'Climate Control', category: 'storage' },
  { icon: 'fa-calendar-days', label: 'Short-Term',       category: 'storage' },
  { icon: 'fa-layer-group', label: 'Long-Term',          category: 'storage' },
  { icon: 'fa-couch',       label: 'Furniture',          category: 'special' },
  { icon: 'fa-computer',    label: 'Electronics',        category: 'special' },
  { icon: 'fa-palette',     label: 'Artwork',            category: 'special' },
  { icon: 'fa-car-side',    label: 'Vehicles',           category: 'special' },
]

const STEPS = [
  { num: '01', title: 'Plan', desc: 'Tell us your moving details, date, and destination.' },
  { num: '02', title: 'Pack', desc: 'Our experts pack and protect all your belongings.' },
  { num: '03', title: 'Load', desc: 'Professional crew loads with care and efficiency.' },
  { num: '04', title: 'Delivery', desc: 'Safe arrival at your new home or office.' },
]

const TESTIMONIALS = [
  {
    quote: 'E-Movers handled my office relocation seamlessly. Professional team, zero damage, on-time delivery. Highly recommended!',
    name: 'James Mwangi',
    role: 'Operations Director',
    rating: 5,
  },
  {
    quote: 'The staff were incredibly careful with my antiques. The PIN attendance system gave me real-time visibility of the team.',
    name: 'Sarah Odhiambo',
    role: 'Homeowner',
    rating: 5,
  },
  {
    quote: 'Best moving experience I have had. Transparent pricing, great communication, and every item arrived safely.',
    name: 'Peter Kamau',
    role: 'Business Owner',
    rating: 5,
  },
]

const BLOG_POSTS = [
  { cat: 'Tips', title: '10 Packing Tips for a Stress-Free Move', img: 'fa-box-open' },
  { cat: 'Guide', title: 'How to Choose the Right Moving Company', img: 'fa-truck-moving' },
  { cat: 'News', title: 'E-Movers Expands to 5 New Cities in 2025', img: 'fa-city' },
]

const PARTNERS = ['Proline', 'Penta', 'Waveless', 'Automation', 'Vision']

const MOVE_SIZES = ['Studio', 'One Bedroom', 'Two Bedroom', 'Three Bedroom', 'Office (Small)', 'Office (Large)']

export default function LandingPage() {
  const [serviceTab, setServiceTab] = useState('moving')
  const [testimonialIdx, setTestimonialIdx] = useState(0)

  const visibleServices = ALL_SERVICES.filter(s => s.category === serviceTab)

  return (
    <div style={{ background: 'white' }}>
      <Navbar />

      {/* ── 1. HERO ── */}
      <section id="hero" className="hero-section" style={{ paddingTop: '80px' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 50%, rgba(30,80,128,0.5) 0%, transparent 70%)' }} />
        <div className="container-wide section-pad" style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-grid-main" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
            <div>
              
              <h1 className="display-xl animate-fadeUp" style={{ color: 'white', lineHeight: 0.95, marginBottom: '0.5rem' }}>
                Moving &amp;
              </h1>
              <h1 className="display-xl animate-fadeUp anim-d1" style={{ color: 'var(--color-yellow)', lineHeight: 0.95, marginBottom: '1rem' }}>
                Storage
              </h1>
              <h2 className="display-lg animate-fadeUp anim-d2" style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 400, textTransform: 'none', marginBottom: '1.5rem' }}>
                Made Simple
              </h2>
              <p className="animate-fadeUp anim-d3" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', lineHeight: 1.7, maxWidth: '32rem', marginBottom: '2rem', fontFamily: 'var(--font-body)' }}>
                Professional moving and storage services across Kenya. Reliable teams, transparent pricing, real-time tracking — all managed in one platform.
              </p>
              <div className="animate-fadeUp anim-d4" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <a href="#services" className="btn btn-yellow btn-lg">
                  <i className="fa-solid fa-truck-moving" />
                  Get a Quote
                </a>
                <Link href="/auth/login" className="btn btn-outline-white btn-lg">
                  <i className="fa-solid fa-right-to-bracket" />
                  Login
                </Link>
              </div>
            </div>
            <div className="hero-image-col animate-fadeUp anim-d3" style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: '100%', maxWidth: '400px', aspectRatio: '1',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '1.5rem',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.12)',
                gap: '1.5rem',
              }}>
                <i className="fa-solid fa-truck-moving" style={{ fontSize: '6rem', color: 'rgba(255,184,0,0.7)' }} />
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>
                  Your belongings, safely delivered
                </div>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="animate-fadeUp anim-d5" style={{
            marginTop: '3rem',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(8px)',
            borderRadius: '1rem',
            padding: '1.25rem',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
            gap: '0.75rem',
            alignItems: 'end',
          }}>
            <div>
              <label className="form-label" style={{ color: 'rgba(255,255,255,0.7)' }}>From</label>
              <input className="form-input" placeholder="Pickup location" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }} />
            </div>
            <div>
              <label className="form-label" style={{ color: 'rgba(255,255,255,0.7)' }}>To</label>
              <input className="form-input" placeholder="Drop-off location" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }} />
            </div>
            <div>
              <label className="form-label" style={{ color: 'rgba(255,255,255,0.7)' }}>Date</label>
              <input type="date" className="form-input" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }} />
            </div>
            <div>
              <label className="form-label" style={{ color: 'rgba(255,255,255,0.7)' }}>Move Size</label>
              <select className="form-select" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}>
                <option value="">Select size</option>
                {MOVE_SIZES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <button className="btn btn-yellow btn-lg" style={{ whiteSpace: 'nowrap' }}>
              <i className="fa-solid fa-magnifying-glass" />
              Get a Quote
            </button>
          </div>
        </div>

      </section>

      {/* ── 2. SERVICES ── */}
      <section id="services" className="section-pad" style={{ background: 'white' }}>
        <div className="container-wide">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ color: 'var(--color-orange)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', fontFamily: 'var(--font-body)' }}>
              What We Offer
            </div>
            <h2 className="display-lg" style={{ marginBottom: '0.75rem' }}>Our Moving Services</h2>
            <p style={{ color: 'var(--color-text-muted)', maxWidth: '40rem', margin: '0 auto', fontFamily: 'var(--font-body)', lineHeight: 1.7 }}>
              Comprehensive moving and storage solutions tailored to residential and commercial clients across Kenya and beyond.
            </p>
          </div>

          {/* Tab filter */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
            {[['moving', 'Moving'], ['storage', 'Storage'], ['special', 'Special Items']].map(([v, l]) => (
              <button
                key={v}
                className={`filter-pill${serviceTab === v ? ' active' : ''}`}
                onClick={() => setServiceTab(v)}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
            {visibleServices.map((svc, i) => (
              <div
                key={svc.label}
                className="card card-lift"
                style={{ padding: '1.5rem', textAlign: 'center', cursor: 'pointer', animationDelay: `${i * 0.05}s` }}
              >
                <div style={{
                  width: '3.5rem', height: '3.5rem', borderRadius: '0.75rem',
                  background: 'rgba(232,69,10,0.08)', margin: '0 auto 1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.375rem', color: 'var(--color-orange)',
                }}>
                  <i className={`fa-solid ${svc.icon}`} />
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-navy)' }}>
                  {svc.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. EXPLORE ── */}
      <section id="explore" style={{ background: 'var(--color-gray-light)', overflow: 'hidden' }}>
        <div className="container-wide" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '480px' }}>
          {/* Left image */}
          <div style={{
            background: 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-mid) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg, transparent, transparent 30px, rgba(255,255,255,0.02) 30px, rgba(255,255,255,0.02) 60px)' }} />
            <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <i className="fa-solid fa-truck-moving" style={{ fontSize: '8rem', color: 'rgba(255,184,0,0.6)' }} />
              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                {['fa-users', 'fa-boxes-stacked', 'fa-map-location-dot'].map(ic => (
                  <div key={ic} style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`fa-solid ${ic}`} style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.125rem' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right text */}
          <div className="section-pad" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ color: 'var(--color-orange)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', fontFamily: 'var(--font-body)' }}>
              Why E-Movers
            </div>
            <h2 className="display-lg" style={{ marginBottom: '1rem' }}>
              Explore Our Services &amp; Moving Solutions
            </h2>
            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: '1.5rem', fontFamily: 'var(--font-body)' }}>
              Whether you are moving across town or across the country, our seasoned teams handle every detail. We combine technology-driven coordination with hands-on expertise.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {['Licensed and insured teams', 'Real-time job tracking', 'Transparent, itemised billing', '24/7 customer support'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--color-text-body)' }}>
                  <i className="fa-solid fa-circle-check" style={{ color: 'var(--color-success)', fontSize: '0.875rem' }} />
                  {f}
                </li>
              ))}
            </ul>
            <a href="#services" className="btn btn-yellow" style={{ alignSelf: 'flex-start' }}>
              <i className="fa-solid fa-eye" />
              View Our Services
            </a>
          </div>
        </div>
      </section>

      {/* ── 4. STATS ── */}
      <section style={{ background: 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-mid) 100%)' }}>
        <div className="container-wide section-pad">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', textAlign: 'center' }}>
            <StatCounter value={240} suffix="+" label="Locations Nationwide" />
            <StatCounter value={6} suffix="M+" label="Long-Distance Moves" />
            <StatCounter value={300} suffix="+" label="Cities Across US & Kenya" />
            <StatCounter value={15} suffix="+" label="Years of Experience" />
          </div>
        </div>
      </section>

      {/* ── 5. STEPS ── */}
      <section id="steps" className="section-pad" style={{ background: 'white' }}>
        <div className="container-wide">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ color: 'var(--color-orange)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', fontFamily: 'var(--font-body)' }}>
              The Process
            </div>
            <h2 className="display-lg">4 Easy Steps to Plan Your Move</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                style={{
                  borderRadius: '1rem',
                  padding: '2rem 1.5rem',
                  background: i === 0 ? 'var(--color-navy)' : 'white',
                  border: i !== 0 ? '2px solid var(--color-gray-mid)' : 'none',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {i === 0 && (
                  <div style={{ position: 'absolute', right: '-1rem', bottom: '-1rem', fontSize: '6rem', color: 'rgba(255,255,255,0.04)', fontFamily: 'var(--font-display)', fontWeight: 900 }}>
                    01
                  </div>
                )}
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '3rem',
                  color: i === 0 ? 'var(--color-yellow)' : 'var(--color-gray-mid)',
                  lineHeight: 1, marginBottom: '1rem',
                }}>
                  {step.num}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', textTransform: 'uppercase', color: i === 0 ? 'white' : 'var(--color-navy)', marginBottom: '0.625rem' }}>
                  {step.title}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: i === 0 ? 'rgba(255,255,255,0.65)' : 'var(--color-text-muted)', lineHeight: 1.6 }}>
                  {step.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. CTA BANNER ── */}
      <section style={{ position: 'relative', padding: '5rem 0', background: 'linear-gradient(135deg, #0B1F3A 0%, #1A3A5C 100%)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.06, fontSize: '20rem', color: 'white' }}>
          <i className="fa-solid fa-truck-moving" />
        </div>
        <div className="container-wide" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <h2 className="display-lg" style={{ color: 'white', marginBottom: '1rem', maxWidth: '48rem', margin: '0 auto 1rem' }}>
            Moving Express Has Your Moving Needs Covered!
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', maxWidth: '36rem', margin: '0 auto 2rem', fontFamily: 'var(--font-body)', lineHeight: 1.7 }}>
            Professional teams ready across Kenya. From studio flats to full office moves, we handle it all.
          </p>
          <a href="#services" className="btn btn-yellow btn-lg">
            <i className="fa-solid fa-truck-moving" />
            Get a Quote Today
          </a>
        </div>
      </section>

      {/* ── 7. PARTNERS ── */}
      <section style={{ background: 'var(--color-gray-light)', padding: '3rem 0', borderTop: '1px solid var(--color-gray-mid)' }}>
        <div className="container-wide" style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2rem', fontFamily: 'var(--font-body)' }}>
            Trusted Partners
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {PARTNERS.map(p => (
              <div
                key={p}
                style={{
                  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem',
                  textTransform: 'uppercase', letterSpacing: '-0.01em',
                  color: 'var(--color-text-muted)',
                  opacity: 0.7,
                  transition: 'opacity 0.2s',
                  cursor: 'default',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
              >
                {p}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. TESTIMONIALS ── */}
      <section id="testimonials" className="section-pad" style={{ background: 'white' }}>
        <div className="container-wide">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '4rem', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'var(--color-orange)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', fontFamily: 'var(--font-body)' }}>
                Customer Feedback
              </div>
              <h2 className="display-lg" style={{ marginBottom: '1rem' }}>What Our Clients Say</h2>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '4rem', color: 'var(--color-navy)', lineHeight: 1 }}>9.1</span>
                <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>/10 average score</span>
              </div>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {[1,2,3,4,5].map(s => <i key={s} className="fa-solid fa-star" style={{ color: 'var(--color-warning)', fontSize: '1.125rem' }} />)}
              </div>
            </div>

            <div>
              <div className="card" style={{ padding: '2rem', position: 'relative' }}>
                <i className="fa-solid fa-quote-left" style={{ fontSize: '2.5rem', color: 'rgba(232,69,10,0.1)', position: 'absolute', top: '1.5rem', right: '1.5rem' }} />
                <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem' }}>
                  {Array.from({ length: TESTIMONIALS[testimonialIdx].rating }).map((_, i) => (
                    <i key={i} className="fa-solid fa-star" style={{ color: 'var(--color-warning)' }} />
                  ))}
                </div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.0625rem', color: 'var(--color-text-body)', lineHeight: 1.7, marginBottom: '1.5rem', fontStyle: 'italic' }}>
                  &ldquo;{TESTIMONIALS[testimonialIdx].quote}&rdquo;
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <div style={{
                    width: '2.75rem', height: '2.75rem', borderRadius: '50%',
                    background: 'var(--color-navy)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem',
                  }}>
                    {TESTIMONIALS[testimonialIdx].name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-navy)', fontSize: '0.9375rem' }}>{TESTIMONIALS[testimonialIdx].name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{TESTIMONIALS[testimonialIdx].role}</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', justifyContent: 'center' }}>
                {TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setTestimonialIdx(i)}
                    style={{
                      width: testimonialIdx === i ? '1.75rem' : '0.5rem',
                      height: '0.5rem',
                      borderRadius: '9999px',
                      background: testimonialIdx === i ? 'var(--color-orange)' : 'var(--color-gray-mid)',
                      border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', padding: 0,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. BLOG ── */}
      <section className="section-pad" style={{ background: 'var(--color-gray-light)' }}>
        <div className="container-wide">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ color: 'var(--color-orange)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', fontFamily: 'var(--font-body)' }}>
              Latest Updates
            </div>
            <h2 className="display-lg">From Our Blog</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {BLOG_POSTS.map(post => (
              <div key={post.title} className="card card-lift" style={{ cursor: 'pointer', overflow: 'hidden' }}>
                <div style={{
                  background: 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-mid) 100%)',
                  height: '180px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className={`fa-solid ${post.img}`} style={{ fontSize: '4rem', color: 'rgba(255,184,0,0.6)' }} />
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <span className="badge badge-pending" style={{ marginBottom: '0.75rem' }}>{post.cat}</span>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase', color: 'var(--color-navy)', lineHeight: 1.3, marginTop: '0.5rem' }}>
                    {post.title}
                  </h3>
                  <a href="#" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', marginTop: '1rem', color: 'var(--color-orange)', fontSize: '0.875rem', fontWeight: 600, fontFamily: 'var(--font-body)', textDecoration: 'none' }}>
                    Read More <i className="fa-solid fa-arrow-right" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 10. FOOTER ── */}
      <footer id="footer" style={{ background: 'var(--color-navy)', color: 'rgba(255,255,255,0.7)' }}>
        <div className="container-wide" style={{ padding: '4rem 1.5rem 2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '3rem', marginBottom: '3rem' }}>
            {/* Brand */}
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.75rem', color: 'white', textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
                <span style={{ color: 'var(--color-orange)' }}>E-</span>Movers
              </div>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '1.25rem', fontFamily: 'var(--font-body)' }}>
                Professional moving and storage services across Kenya. Available 24/7 for all your relocation needs.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {['fa-facebook', 'fa-twitter', 'fa-instagram', 'fa-linkedin'].map(icon => (
                  <a
                    key={icon}
                    href="#"
                    style={{
                      width: '2.25rem', height: '2.25rem', borderRadius: '50%',
                      background: 'rgba(255,255,255,0.08)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      color: 'rgba(255,255,255,0.6)', textDecoration: 'none',
                      transition: 'background 0.2s, color 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-orange)'; e.currentTarget.style.color = 'white' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
                  >
                    <i className={`fa-brands ${icon}`} />
                  </a>
                ))}
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'white', marginBottom: '1.25rem' }}>
                Services
              </h4>
              {['Local Moving', 'Long-Distance Moving', 'Storage Solutions', 'Office Relocation', 'International Moving', 'Special Items'].map(s => (
                <a key={s} href="#services" style={{ display: 'block', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', marginBottom: '0.5rem', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-orange)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                >
                  {s}
                </a>
              ))}
            </div>

            {/* About */}
            <div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'white', marginBottom: '1.25rem' }}>
                Company
              </h4>
              {['About Us', 'Our Team', 'Careers', 'Press', 'Blog', 'Contact'].map(s => (
                <a key={s} href="#" style={{ display: 'block', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', marginBottom: '0.5rem', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-orange)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                >
                  {s}
                </a>
              ))}
            </div>

            {/* Contact */}
            <div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'white', marginBottom: '1.25rem' }}>
                Contact Us
              </h4>
              {[
                { icon: 'fa-location-dot', text: 'Westlands, Nairobi, Kenya' },
                { icon: 'fa-phone', text: '+254 700 000 000' },
                { icon: 'fa-envelope', text: 'info@emovers.co.ke' },
                { icon: 'fa-clock', text: '24 / 7 Service Available' },
              ].map(item => (
                <div key={item.icon} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', marginBottom: '0.875rem', fontSize: '0.875rem' }}>
                  <i className={`fa-solid ${item.icon}`} style={{ color: 'var(--color-orange)', width: '1rem', flexShrink: 0, marginTop: '0.125rem' }} />
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-body)' }}>
              &copy; {new Date().getFullYear()} E-Movers. All rights reserved.
            </div>
            <Link href="/auth/login" className="btn btn-primary btn-sm">
              <i className="fa-solid fa-right-to-bracket" />
              Staff Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
