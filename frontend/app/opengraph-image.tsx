import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'PlanPilot AI — UK Planning Intelligence Platform'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage() {
  const features = [
    { icon: '🤖', label: 'ML Approval\nPrediction', detail: '36K+ decisions' },
    { icon: '🗺️', label: 'Constraint\nMapping', detail: '7 datasets' },
    { icon: '📊', label: 'Market\nIntelligence', detail: 'Price & trends' },
    { icon: '📝', label: 'AI Strategic\nReport', detail: 'Gemini 2.0' },
  ]

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FAFAFA',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            backgroundColor: '#FF3000',
            display: 'flex',
          }}
        />

        {/* Subtle grid */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.04,
            backgroundImage:
              'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            display: 'flex',
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '60px 80px 50px',
            flex: 1,
          }}
        >
          {/* Logo + brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
            <div
              style={{
                width: 48,
                height: 48,
                backgroundColor: '#FF3000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 900,
                color: '#000',
                letterSpacing: '-1px',
              }}
            >
              PP
            </div>
            <span
              style={{
                fontSize: 28,
                fontWeight: 900,
                letterSpacing: '-0.03em',
                textTransform: 'uppercase',
                color: '#0A0A0A',
              }}
            >
              PLANPILOT AI
            </span>
          </div>

          {/* Headline */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: '-0.04em',
              textTransform: 'uppercase',
              color: '#0A0A0A',
              marginBottom: 16,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span>UK Planning</span>
            <span>Intelligence</span>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 22,
              color: '#555',
              marginBottom: 48,
              lineHeight: 1.4,
              display: 'flex',
            }}
          >
            Enter a postcode. Get ML-powered approval odds, constraints, market data & AI reports.
          </div>

          {/* Feature cards row */}
          <div style={{ display: 'flex', gap: 20, marginTop: 'auto' }}>
            {features.map((f) => (
              <div
                key={f.label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: '#fff',
                  border: '2px solid #E5E5E5',
                  padding: '20px 24px',
                  flex: 1,
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 32, display: 'flex' }}>{f.icon}</span>
                <span
                  style={{
                    fontSize: 17,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '-0.02em',
                    color: '#0A0A0A',
                    lineHeight: 1.2,
                    display: 'flex',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {f.label}
                </span>
                <span style={{ fontSize: 14, color: '#888', display: 'flex' }}>{f.detail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 80px',
            backgroundColor: '#0A0A0A',
            color: '#999',
            fontSize: 15,
          }}
        >
          <span style={{ display: 'flex' }}>planpilot.ddns.net</span>
          <span style={{ display: 'flex' }}>Built at HackLondon 2026</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
