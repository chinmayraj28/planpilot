# Google OAuth Setup Guide for PlanPilot AI

This guide walks you through setting up Google OAuth authentication with Supabase.

## Prerequisites

- A Supabase project (create one at [supabase.com](https://supabase.com))
- A Google Cloud Platform account

---

## Step 1: Create Google OAuth Credentials

### 1.1 Go to Google Cloud Console

Visit [Google Cloud Console](https://console.cloud.google.com/)

### 1.2 Create a New Project (or select existing)

1. Click on the project dropdown at the top
2. Click "New Project"
3. Name it "PlanPilot AI" (or your preferred name)
4. Click "Create"

### 1.3 Enable Google+ API

1. Go to **APIs & Services** > **Library**
2. Search for "Google+ API"
3. Click on it and press "Enable"

### 1.4 Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Select **External** (unless you have a Google Workspace)
3. Click "Create"
4. Fill in the required fields:
   - **App name**: PlanPilot AI
   - **User support email**: Your email
   - **Developer contact**: Your email
5. Click "Save and Continue"
6. Skip "Scopes" (click "Save and Continue")
7. Add test users if needed (for development)
8. Click "Save and Continue"

### 1.5 Create OAuth Client ID

1. Go to **APIs & Services** > **Credentials**
2. Click "Create Credentials" > "OAuth client ID"
3. Select **Web application**
4. Name it "PlanPilot AI Web"
5. Add **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://your-production-domain.com
   ```
6. Add **Authorized redirect URIs** (you'll get this from Supabase - see Step 2.2):
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
7. Click "Create"
8. **Copy your Client ID and Client Secret** (you'll need these for Supabase)

---

## Step 2: Configure Supabase

### 2.1 Go to Supabase Dashboard

Visit your project at [supabase.com/dashboard](https://supabase.com/dashboard)

### 2.2 Enable Google Provider

1. Go to **Authentication** > **Providers**
2. Find "Google" in the list
3. Toggle it **ON**
4. You'll see a **Callback URL** - copy this (e.g., `https://xxxxx.supabase.co/auth/v1/callback`)
5. Go back to Google Cloud Console and add this URL to **Authorized redirect URIs** (Step 1.5)

### 2.3 Add Google Credentials to Supabase

1. Back in Supabase **Authentication** > **Providers** > **Google**
2. Paste your **Client ID** from Google
3. Paste your **Client Secret** from Google
4. Click "Save"

---

## Step 3: Update Frontend Configuration

No code changes needed! The frontend is already configured to use Google OAuth.

Just make sure your `.env.local` has the correct Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

---

## Step 4: Test Google Sign-In

### 4.1 Start Development Server

```bash
npm run dev
```

### 4.2 Test the Flow

1. Go to [http://localhost:3000/login](http://localhost:3000/login)
2. Click "Continue with Google"
3. Select your Google account
4. Grant permissions
5. You should be redirected to `/dashboard`

---

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Problem**: The redirect URI doesn't match what's configured in Google Cloud Console.

**Solution**:
1. Copy the exact callback URL from Supabase: **Authentication** > **Providers** > **Google**
2. Go to Google Cloud Console > **APIs & Services** > **Credentials**
3. Edit your OAuth client
4. Add the Supabase callback URL to **Authorized redirect URIs**
5. Save and wait a few minutes for changes to propagate

### Error: "Access blocked: This app's request is invalid"

**Problem**: OAuth consent screen not properly configured.

**Solution**:
1. Go to Google Cloud Console > **APIs & Services** > **OAuth consent screen**
2. Complete all required fields
3. Add your email as a test user
4. Publish the app (or keep it in testing mode with test users)

### Error: "Google+ API not enabled"

**Problem**: Google+ API is required for OAuth.

**Solution**:
1. Go to **APIs & Services** > **Library**
2. Search "Google+ API"
3. Click and press "Enable"

### Users redirected but not signed in

**Problem**: Session not being set properly.

**Solution**:
1. Check browser console for errors
2. Verify Supabase credentials in `.env.local`
3. Clear browser cookies and try again
4. Check that the redirect URL in the code matches your domain

---

## Production Deployment

### Update Google OAuth Settings

When deploying to production (e.g., Vercel, Netlify):

1. Add your production domain to **Authorized JavaScript origins**:
   ```
   https://planpilot-ai.vercel.app
   ```

2. Add production callback URL to **Authorized redirect URIs**:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```

3. Update OAuth consent screen with production URLs

4. **Publish** your OAuth consent screen (move from Testing to Production)

### Update Environment Variables

In your hosting platform, set:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_BACKEND_URL=https://your-backend-api.com
```

---

## Security Best Practices

1. **Never commit** your Google Client Secret or Supabase secrets to Git
2. **Use environment variables** for all sensitive data
3. **Enable email verification** in Supabase if allowing email/password signup
4. **Add rate limiting** to prevent abuse
5. **Review OAuth scopes** - only request what you need
6. **Monitor authentication logs** in Supabase dashboard

---

## Additional OAuth Providers

Want to add more login options? Supabase supports:

- GitHub
- GitLab
- Bitbucket
- Azure
- Facebook
- Discord
- Slack
- Twitter
- And more!

Follow similar steps in **Authentication** > **Providers** to enable them.

---

## Support

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Discord](https://discord.supabase.com/)

---

**You're all set!** Users can now sign in with Google using the Swiss-styled OAuth button on your login page. 🎉
