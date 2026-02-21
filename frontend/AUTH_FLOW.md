# Authentication Flow - PlanPilot AI

## Login Page UI Structure

```
┌─────────────────────────────────────────┐
│  ← Home                                 │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  [RED SQUARE]                     │ │
│  │                                   │ │
│  │  SIGN IN                          │ │
│  │  PLANPILOT AI PLATFORM            │ │
│  │                                   │ │
│  │  ┌──────────────────────────────┐│ │
│  │  │ 🌐 CONTINUE WITH GOOGLE      ││ │
│  │  └──────────────────────────────┘│ │
│  │                                   │ │
│  │  ─── Or continue with email ───  │ │
│  │                                   │ │
│  │  EMAIL ADDRESS                    │ │
│  │  [📧 your@email.com............] │ │
│  │                                   │ │
│  │  PASSWORD                         │ │
│  │  [🔒 ••••••••.................] │ │
│  │                                   │ │
│  │  ┌──────────────────────────────┐│ │
│  │  │ SIGN IN                      ││ │
│  │  └──────────────────────────────┘│ │
│  │                                   │ │
│  │  Don't have an account? SIGN UP   │ │
│  │                        [SQUARE]   │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Authentication Methods

### 1. Google OAuth (Recommended)

**User Experience:**
1. User clicks "Continue with Google"
2. Redirected to Google sign-in page
3. User selects Google account
4. User grants permissions (first time only)
5. Automatically redirected to `/dashboard`
6. Session stored in Supabase

**Benefits:**
- ✅ One-click sign-in
- ✅ No password to remember
- ✅ Secure (OAuth 2.0)
- ✅ Auto-populated user info (email, name, avatar)
- ✅ Faster onboarding

**Swiss Design Styling:**
```tsx
<button className="
  border-4 border-swiss-black
  bg-swiss-white
  hover:bg-swiss-black
  hover:text-swiss-white
  uppercase font-bold tracking-widest
">
  <Chrome /> CONTINUE WITH GOOGLE
</button>
```

### 2. Email/Password

**User Experience:**
1. User enters email and password
2. Clicks "Sign In" or "Sign Up"
3. If Sign Up: Receives confirmation email
4. If Sign In: Redirected to `/dashboard`
5. Session stored in Supabase

**Benefits:**
- ✅ No third-party dependency
- ✅ Works in restricted environments
- ✅ Full control over user data

## Authentication Flow Diagram

```
┌──────────────┐
│ Landing Page │
│      /       │
└──────┬───────┘
       │
       │ Click "Get Started" or "Sign In"
       ▼
┌──────────────┐
│  Login Page  │
│    /login    │
└──────┬───────┘
       │
       ├───────────────────────┬──────────────────────┐
       │                       │                      │
       ▼                       ▼                      ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│Google OAuth  │      │Email Sign In │      │Email Sign Up │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                      │
       │ Select Account      │ Enter Credentials    │ Enter Credentials
       ▼                     ▼                      ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│Grant Perms   │      │Validate      │      │Send Confirm  │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                      │
       │                     │                      │ Check Email
       │                     │                      │ Click Link
       │                     │                      ▼
       │                     │              ┌──────────────┐
       │                     │              │Verify Email  │
       │                     │              └──────┬───────┘
       │                     │                     │
       └─────────────────────┴─────────────────────┘
                             │
                             ▼
                    ┌──────────────┐
                    │  Dashboard   │
                    │  /dashboard  │
                    │ (Protected)  │
                    └──────────────┘
```

## Session Management

### Client-Side (Frontend)

**Get Current Session:**
```typescript
const { data: { session } } = await supabase.auth.getSession()
const token = session?.access_token
const user = session?.user
```

**Sign Out:**
```typescript
await supabase.auth.signOut()
router.push('/')
```

### Server-Side (Backend API)

**Verify JWT:**
```python
from supabase import create_client

# Extract token from header
token = request.headers.get('Authorization').replace('Bearer ', '')

# Verify with Supabase
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
user = supabase.auth.get_user(token)
```

## Protected Routes

The dashboard page (`/dashboard`) checks for authentication on mount:

```typescript
useEffect(() => {
  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')  // Redirect to login
      return
    }
    setUser(session.user)
    setToken(session.access_token)
  }
  checkAuth()
}, [router])
```

## Security Features

✅ **JWT-based authentication** - Tokens expire automatically
✅ **HTTPS only** - OAuth requires secure connections
✅ **CSRF protection** - Built into Supabase Auth
✅ **Rate limiting** - Configurable in Supabase dashboard
✅ **Email verification** - Optional for email/password signup
✅ **Session refresh** - Automatic token renewal

## User Data Schema

After successful authentication, Supabase provides:

```typescript
{
  id: "uuid",
  email: "user@example.com",
  user_metadata: {
    avatar_url: "https://...",
    full_name: "John Doe",
    provider: "google" | "email"
  },
  created_at: "2026-02-21T12:00:00Z",
  last_sign_in_at: "2026-02-21T12:00:00Z"
}
```

## Error Handling

The login page handles common errors:

- **Invalid credentials**: "Email or password is incorrect"
- **Email not confirmed**: "Check your email for confirmation link"
- **Network error**: "Unable to connect. Please try again."
- **OAuth cancelled**: User closes OAuth window (silent failure)
- **Rate limited**: "Too many attempts. Please wait."

All errors display in a Swiss-styled red accent box above the form.

---

**Summary**: Users can sign in with Google OAuth (one-click) or email/password (traditional). Both methods are secure, session-based, and redirect to the protected dashboard on success.
