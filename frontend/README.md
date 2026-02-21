# PlanPilot AI - Frontend

UK Planning Intelligence Platform with Swiss International design aesthetic.

## Features

- 🏠 **Landing Page**: Clean, geometric introduction to PlanPilot AI
- 🔐 **Authentication**: Supabase-powered sign-in/sign-up
- 📊 **Dashboard**: Comprehensive planning analysis with:
  - Interactive map (Leaflet)
  - Approval probability gauge
  - Viability scoring with breakdown
  - Planning constraints visualization
  - Market metrics and trends
  - AI-generated planning reports (Gemini 2.0)
- 🎨 **Swiss Design System**: Black/white with red accents, bold typography, geometric patterns
- ⚡ **Framer Motion**: Smooth animations throughout
- 📱 **Responsive**: Desktop-first, mobile-friendly

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Auth**: Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- **Map**: Leaflet (`react-leaflet`)
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **TypeScript**: Full type safety

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### 4. Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   ├── globals.css         # Global styles + Swiss design utilities
│   ├── login/
│   │   └── page.tsx        # Authentication page
│   └── dashboard/
│       └── page.tsx        # Main dashboard
├── components/
│   ├── PostcodeInput.tsx   # Postcode search component
│   ├── ui/
│   │   ├── Badge.tsx
│   │   ├── CircularGauge.tsx
│   │   ├── ScoreBar.tsx
│   │   ├── SkeletonCard.tsx
│   │   └── InfoTooltip.tsx
│   ├── panels/
│   │   ├── ApprovalProbability.tsx
│   │   ├── ViabilityScore.tsx
│   │   ├── ConstraintsPanel.tsx
│   │   ├── PlanningMetrics.tsx
│   │   ├── MarketMetrics.tsx
│   │   └── AIReport.tsx
│   └── map/
│       └── PlanningMap.tsx
├── lib/
│   ├── supabase.ts         # Supabase client
│   ├── api.ts              # API helper functions
│   └── types.ts            # TypeScript interfaces
└── public/                 # Static assets
```

## Swiss Design System

### Colors
- **Background**: `#FFFFFF` (Pure White)
- **Foreground**: `#000000` (Pure Black)
- **Muted**: `#F2F2F2` (Light Gray)
- **Accent**: `#FF3000` (Swiss Red)
- **Border**: `#000000` (Pure Black)

### Typography
- **Font**: Inter (Google Font)
- **Weights**: 400 (Regular), 500 (Medium), 700 (Bold), 900 (Black)
- **Style**: UPPERCASE for headings
- **Scale**: Extreme contrast (text-6xl to text-9xl for headings)

### Patterns
- **Grid**: 24x24px grid lines (`.swiss-grid-pattern`)
- **Dots**: 16x16px dot matrix (`.swiss-dots`)
- **Diagonal**: 45° stripes (`.swiss-diagonal`)
- **Noise**: Fractal noise overlay (`.swiss-noise`)

### Components
- **Buttons**: `.swiss-btn-primary`, `.swiss-btn-secondary`
- **Cards**: `.swiss-card`, `.swiss-card-hover`
- **Borders**: Always 4px thick, no rounded corners

## API Integration

The frontend expects a backend API at `NEXT_PUBLIC_BACKEND_URL` with the following endpoints:

- `GET /api/v1/analyze?postcode={postcode}` - Planning analysis
- `GET /api/v1/report?postcode={postcode}` - AI report
- `GET /api/v1/health` - Health check (no auth)

All endpoints (except `/health`) require:
```
Authorization: Bearer <supabase-access-token>
```

## Design Philosophy

This implementation follows **International Typographic Style (Swiss Style)** principles:

1. **Objectivity over Subjectivity**: Design serves content, not decoration
2. **The Grid as Law**: Strict grid-based layouts with visible structure
3. **Typography is the Interface**: Type as primary visual element
4. **Active Negative Space**: White space as structural element
5. **Layered Texture & Depth**: Patterns create depth without shadows
6. **Universal Intelligibility**: Clean, legible, undeniably modern

## License

MIT
