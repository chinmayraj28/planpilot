# PlanPilot AI - Quick Start Guide

## Prerequisites

Before running the frontend, ensure you have:

1. **Node.js** (v18 or higher)
2. **npm** (comes with Node.js)
3. **Supabase Project** with authentication enabled
4. **Backend API** running (see backend README)

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the frontend directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

**Where to find Supabase credentials:**
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings > API
4. Copy the "Project URL" and "anon public" API key

**Setting up Google OAuth (Optional but Recommended):**
See the detailed guide in [`GOOGLE_OAUTH_SETUP.md`](./GOOGLE_OAUTH_SETUP.md) for step-by-step instructions on:
- Creating Google OAuth credentials
- Configuring Supabase Google provider
- Testing the OAuth flow

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

### 4. Build for Production

```bash
npm run build
npm start
```

## Pages Overview

### Landing Page (`/`)
- **Route**: [http://localhost:3000](http://localhost:3000)
- **Purpose**: Introduces PlanPilot AI with Swiss-style design
- **Features**:
  - Hero section with animated geometric shapes
  - Feature showcase (6 core capabilities)
  - Simple 3-step process explanation
  - CTA to sign in

### Login Page (`/login`)
- **Route**: [http://localhost:3000/login](http://localhost:3000/login)
- **Purpose**: User authentication via Supabase
- **Features**:
  - **Google OAuth** - One-click sign-in with Google
  - Email/password sign-in
  - Sign-up toggle
  - Error handling
  - Animated background elements
  - Swiss-styled OAuth button

### Dashboard (`/dashboard`)
- **Route**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard) (auth required)
- **Purpose**: Main planning analysis interface
- **Features**:
  - Postcode search input
  - Interactive Leaflet map
  - Approval probability gauge (ML prediction)
  - Viability score with breakdown
  - Planning constraints visualization
  - Planning metrics (approval rate, decision time)
  - Market metrics (price per m², trends, EPC rating)
  - AI-generated planning report (Gemini 2.0)

## Architecture

### Swiss Design System

The entire app follows **International Typographic Style** principles:

- **Colors**: Black (`#000000`), White (`#FFFFFF`), Red Accent (`#FF3000`), Muted Gray (`#F2F2F2`)
- **Typography**: Inter font, UPPERCASE headings, extreme scale contrast (text-6xl to text-9xl)
- **Borders**: Always 4px thick, no rounded corners (`rounded-none`)
- **Patterns**: Grid (24px), Dots (16px), Diagonal stripes, Noise texture
- **Animation**: Framer Motion for smooth transitions (200ms duration)

### Component Structure

```
components/
├── ui/                  # Reusable Swiss-style components
│   ├── Badge.tsx        # Status badges (success/warning/danger/info)
│   ├── CircularGauge.tsx # Circular progress gauge
│   ├── ScoreBar.tsx     # Horizontal score bars
│   ├── SkeletonCard.tsx # Loading skeletons
│   └── InfoTooltip.tsx  # Info tooltips with explanations
├── panels/              # Data display panels
│   ├── ApprovalProbability.tsx
│   ├── ViabilityScore.tsx
│   ├── ConstraintsPanel.tsx
│   ├── PlanningMetrics.tsx
│   ├── MarketMetrics.tsx
│   └── AIReport.tsx
└── map/
    └── PlanningMap.tsx  # Leaflet map (dynamically imported)
```

### State Management

- **Authentication**: Supabase Auth with session management
- **API Calls**: Parallel requests to `/analyze` and `/report` endpoints
- **Loading States**: Skeleton loaders for instant feedback
- **Error Handling**: User-friendly error messages with retry options

## API Integration

The frontend expects the backend to be running at `NEXT_PUBLIC_BACKEND_URL`.

### Endpoints Used

1. **`GET /api/v1/analyze?postcode={postcode}`**
   - Returns: Planning constraints, flood risk, approval probability, viability score, market metrics
   - Auth: Required (Bearer token)

2. **`GET /api/v1/report?postcode={postcode}`**
   - Returns: AI-generated planning report with outlook, risks, recommendations
   - Auth: Required (Bearer token)

3. **`GET /api/v1/health`**
   - Returns: API health status
   - Auth: Not required

### Authentication Flow

1. User signs in via `/login` (Supabase Auth)
2. Session stored in Supabase client
3. Access token extracted: `session.access_token`
4. Token sent in API requests: `Authorization: Bearer <token>`
5. Backend validates JWT and returns data

## Troubleshooting

### Build Errors

**Issue**: Tailwind CSS PostCSS errors
**Solution**: Ensure you're using Tailwind CSS v3 (not v4)

**Issue**: `window is not defined` errors
**Solution**: Leaflet components are dynamically imported with `ssr: false`

**Issue**: Supabase auth errors during build
**Solution**: Placeholder values are used during build; real credentials needed at runtime

### Runtime Errors

**Issue**: "Not authenticated" error
**Solution**: Check that `.env.local` has valid Supabase credentials

**Issue**: API requests failing with 401
**Solution**: Ensure backend is running and accepting the Supabase JWT

**Issue**: Map not displaying
**Solution**: Check browser console for Leaflet errors; ensure internet connection for OpenStreetMap tiles

### Development Tips

1. **Hot Reload**: Changes auto-refresh (except globals.css - requires manual reload)
2. **Type Safety**: TypeScript interfaces in `lib/types.ts` match backend schemas
3. **Design Consistency**: Use Swiss utility classes (`.swiss-btn-primary`, `.swiss-card`, etc.)
4. **Animations**: Keep Framer Motion animations < 300ms for snappy feel
5. **Responsive**: Test on mobile (320px), tablet (768px), desktop (1024px+)

## Next Steps

1. **Customize**: Adjust colors in `tailwind.config.js` and `globals.css`
2. **Add Features**: Create new panels in `components/panels/`
3. **Improve UX**: Add toast notifications, loading indicators, etc.
4. **Deploy**: Use Vercel, Netlify, or any Next.js-compatible host

## Support

For issues or questions:
- Check the [Next.js documentation](https://nextjs.org/docs)
- Review [Supabase Auth docs](https://supabase.com/docs/guides/auth)
- See [Framer Motion docs](https://www.framer.com/motion/)
- Read [Leaflet docs](https://leafletjs.com/reference.html)

---

Built with ❤️ using Next.js 14, Tailwind CSS, and Swiss Design principles.
