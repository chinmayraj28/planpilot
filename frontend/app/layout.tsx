import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PlanPilot AI - UK Planning Intelligence Platform',
  description: 'Analyze UK postcodes for planning constraints, flood risk, approval probability, and market metrics with AI-powered insights.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="swiss-noise">{children}</body>
    </html>
  )
}
