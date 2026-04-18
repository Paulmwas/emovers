'use client'

import React from 'react'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
}

export function Spinner({ size = 'md' }: SpinnerProps) {
  return <span className={`spinner spinner-${size}`} />
}

export function PageLoader({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="page-loader">
      <div className="spinner spinner-lg" />
      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>{label}</span>
    </div>
  )
}

export default Spinner
