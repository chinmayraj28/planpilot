import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PlanPilot AI',
  description: 'Enter any UK postcode. Get constraint data, flood risk, ML-powered approval probability, viability scoring, and AI-generated strategic planning advice in seconds.',
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://planpilot.ddns.net'),
  openGraph: {
    title: 'PlanPilot AI — UK Planning Intelligence Platform',
    description: 'Constraint data, flood risk, ML approval probability, viability scoring, and AI planning advice for any UK postcode.',
    siteName: 'PlanPilot AI',
    images: [
      {
        url: '/logo.png',
        alt: 'PlanPilot AI',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PlanPilot AI — UK Planning Intelligence Platform',
    description: 'Constraint data, flood risk, ML approval probability, viability scoring, and AI planning advice for any UK postcode.',
    images: ['/logo.png'],
  },
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
