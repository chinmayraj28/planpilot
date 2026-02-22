import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'PlanPilot AI — Know Before You Apply'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: '#FAFAFA',
          padding: '60px 80px',
          fontFamily: 'Inter, system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            backgroundColor: '#FF3000',
          }}
        />

        {/* Grid pattern overlay (subtle) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.03,
            backgroundImage:
              'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Logo + brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <div
            style={{
              width: 28,
              height: 28,
              backgroundColor: '#FF3000',
            }}
          />
          <span
            style={{
              fontSize: 32,
              fontWeight: 900,
              letterSpacing: '-0.04em',
              textTransform: 'uppercase' as const,
              color: '#0A0A0A',
            }}
          >
            PLANPILOT AI
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: '-0.04em',
            textTransform: 'uppercase' as const,
            color: '#0A0A0A',
            marginBottom: 24,
          }}
        >
          KNOW BEFORE
          <br />
          YOU{' '}
          <span style={{ color: '#FF3000' }}>APPLY</span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 22,
            lineHeight: 1.5,
            color: '#0A0A0A',
            opacity: 0.6,
            maxWidth: 700,
            marginBottom: 40,
          }}
        >
          UK planning constraints, flood risk, ML approval probability, viability scoring, and AI strategic advice — for any postcode.
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {['XGBoost ML', 'Gemini AI Reports', '7 Gov Datasets', 'Instant Analysis'].map(
            (label) => (
              <div
                key={label}
                style={{
                  padding: '10px 20px',
                  border: '3px solid #0A0A0A',
                  fontSize: 14,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase' as const,
                  color: '#0A0A0A',
                }}
              >
                {label}
              </div>
            )
          )}
        </div>

        {/* Bottom border */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            backgroundColor: '#0A0A0A',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
