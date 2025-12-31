# Understanding `api/auth/callback`

## What is `api/auth/callback`?

The `api/auth/callback` route is a **server-side endpoint** that handles OAuth redirects from third-party providers (Google, GitHub, etc.) back to your application after a user authenticates.

---

## When Do You Need It?

### ✅ You NEED it if:
- Users can sign in with **OAuth providers** (Google, GitHub, Apple, etc.)
- You're using **magic links** (email links that log users in)
- You're using **passwordless authentication**

### ❌ You DON'T need it if:
- Users **only** sign in with email/password (traditional login)
- You're not using any OAuth providers
- You're not using magic links

**However**, it's still good practice to create it even if you don't use OAuth initially - you might add it later!

---

## How OAuth Flow Works

### Without Callback (Email/Password - Direct)

```
User → Login Form → Supabase → ✅ Logged In
```

1. User enters email/password
2. Frontend calls `supabase.auth.signInWithPassword()`
3. Supabase validates credentials
4. User is immediately logged in
5. **No redirect needed** - happens in the same page

### With Callback (OAuth - Redirect Flow)

```
User → Click "Sign in with Google" 
  → Redirected to Google 
  → User approves 
  → Google redirects back to YOUR app 
  → Callback route handles it 
  → ✅ Logged In
```

1. User clicks "Sign in with Google" button
2. User is redirected to Google's login page
3. User enters Google credentials and approves
4. Google redirects back to your app at `/api/auth/callback?code=...`
5. **Callback route** exchanges the code for a session
6. User is logged in and redirected to your app

---

## The OAuth Flow Diagram

```
┌─────────────┐
│   Your App  │
│  /login     │
└──────┬──────┘
       │ 1. User clicks "Sign in with Google"
       ↓
┌─────────────────────────────────┐
│  supabase.auth.signInWithOAuth()│
│  provider: 'google'              │
└──────┬──────────────────────────┘
       │ 2. Redirects to Google
       ↓
┌─────────────┐
│   Google    │
│  Login Page │
└──────┬──────┘
       │ 3. User approves
       ↓
┌─────────────────────────────────┐
│  Google redirects to:            │
│  /api/auth/callback?code=xyz    │
└──────┬──────────────────────────┘
       │ 4. Callback route receives code
       ↓
┌─────────────────────────────────┐
│  /api/auth/callback/route.ts    │
│  - Exchanges code for session   │
│  - Sets cookies                 │
│  - Redirects to app             │
└──────┬──────────────────────────┘
       │ 5. User logged in!
       ↓
┌─────────────┐
│   Your App  │
│  /dashboard │
└─────────────┘
```

---

## What the Callback Route Does

The callback route handler:

1. **Receives the OAuth code** from the provider (Google, GitHub, etc.)
2. **Exchanges the code** for a session token with Supabase
3. **Sets authentication cookies** in the browser
4. **Redirects the user** to your app (usually dashboard or home)

---

## Implementation Example

### Basic Callback Route

```typescript
// app/api/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  if (code) {
    const supabase = await createClient()
    
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Success! Redirect to the app
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  // If there's an error, redirect to login
  return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin))
}
```

### What Each Part Does

```typescript
// 1. Get the code from URL query parameters
const code = requestUrl.searchParams.get('code')
// Example: /api/auth/callback?code=abc123 → code = "abc123"

// 2. Get where to redirect after login (optional)
const next = requestUrl.searchParams.get('next') || '/dashboard'
// Example: /api/auth/callback?code=abc123&next=/watchlist → next = "/watchlist"

// 3. Create Supabase client (server-side)
const supabase = await createClient()

// 4. Exchange the OAuth code for a session
const { error } = await supabase.auth.exchangeCodeForSession(code)
// This creates the user session and sets cookies

// 5. Redirect to your app
return NextResponse.redirect(new URL(next, requestUrl.origin))
// Redirects to /dashboard (or whatever 'next' was)
```

---

## Setting Up OAuth in Supabase

### Step 1: Configure OAuth Provider

In Supabase Dashboard:
1. Go to **Authentication** → **Providers**
2. Enable **Google** (or GitHub, Apple, etc.)
3. Add your **Client ID** and **Client Secret**
4. Set **Redirect URL** to: `https://your-domain.com/api/auth/callback`

### Step 2: Configure Redirect URLs

**For Development:**
```
http://localhost:3000/api/auth/callback
```

**For Production:**
```
https://your-domain.com/api/auth/callback
```

**Important:** Add both to:
- Supabase Dashboard → Authentication → URL Configuration
- OAuth Provider (Google/GitHub) → Redirect URIs

---

## Complete OAuth Sign-In Example

### Frontend: Login Button

```typescript
// components/auth/LoginForm.tsx
'use client'

import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
        queryParams: {
          // Optional: redirect to specific page after login
          next: '/dashboard'
        }
      }
    })
  }

  return (
    <button onClick={handleGoogleLogin}>
      Sign in with Google
    </button>
  )
}
```

### What Happens:

1. User clicks "Sign in with Google"
2. `signInWithOAuth()` redirects to Google
3. User logs in with Google
4. Google redirects to `/api/auth/callback?code=...`
5. Callback route exchanges code for session
6. User is redirected to `/dashboard`

---

## Magic Links (Email Links)

Magic links also use the callback route:

```typescript
// Send magic link
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    emailRedirectTo: `${window.location.origin}/api/auth/callback`
  }
})
```

**Flow:**
1. User enters email
2. Supabase sends email with magic link
3. User clicks link in email
4. Link goes to `/api/auth/callback?token=...`
5. Callback route validates token and logs user in

---

## Error Handling

### Common Errors

**1. Invalid Code**
```typescript
if (!code) {
  return NextResponse.redirect(new URL('/login?error=no_code', requestUrl.origin))
}
```

**2. Exchange Failed**
```typescript
const { error } = await supabase.auth.exchangeCodeForSession(code)

if (error) {
  console.error('Auth error:', error)
  return NextResponse.redirect(
    new URL(`/login?error=${error.message}`, requestUrl.origin)
  )
}
```

**3. Provider Not Configured**
- Check Supabase Dashboard → Authentication → Providers
- Ensure OAuth provider is enabled
- Verify Client ID and Secret are correct

---

## Security Considerations

### ✅ Good Practices

1. **Validate the code** - Don't trust it blindly
2. **Use HTTPS in production** - OAuth requires secure connections
3. **Set proper redirect URLs** - Only allow your domain
4. **Handle errors gracefully** - Don't expose sensitive info

### ⚠️ Security Notes

- The `code` parameter is **single-use** - it expires quickly
- Supabase handles code validation automatically
- Never log the code or token in production
- Always use environment variables for secrets

---

## Testing the Callback

### Manual Test

1. Start your dev server: `npm run dev`
2. Visit: `http://localhost:3000/api/auth/callback?code=test`
3. Should redirect to login (invalid code) or dashboard (if valid)

### OAuth Test

1. Click "Sign in with Google" button
2. Complete Google login
3. Should redirect to `/api/auth/callback`
4. Should then redirect to `/dashboard`
5. User should be logged in

---

## When Callback is NOT Called

### Email/Password Login

```typescript
// This does NOT use the callback route
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})
// User is logged in immediately - no redirect
```

### Session Refresh

```typescript
// This does NOT use the callback route
const { data, error } = await supabase.auth.refreshSession()
// Refreshes existing session - no redirect
```

---

## Summary

| Scenario | Uses Callback? | Why |
|----------|----------------|-----|
| Email/Password Login | ❌ No | Direct authentication, no redirect |
| OAuth (Google, GitHub) | ✅ Yes | Provider redirects back to your app |
| Magic Links | ✅ Yes | Email link redirects to callback |
| Session Refresh | ❌ No | Uses existing session |
| Sign Up | ❌ No | Direct creation, no redirect |

---

## Quick Checklist

- [ ] Create `app/api/auth/callback/route.ts`
- [ ] Implement `exchangeCodeForSession()`
- [ ] Handle errors gracefully
- [ ] Set redirect URL in Supabase Dashboard
- [ ] Configure OAuth provider (if using OAuth)
- [ ] Test with OAuth provider
- [ ] Test error cases (invalid code, etc.)

---

## Example: Complete Callback Route

```typescript
// app/api/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/login?error=${error}`, requestUrl.origin)
    )
  }

  // Exchange code for session
  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Exchange error:', exchangeError)
      return NextResponse.redirect(
        new URL('/login?error=exchange_failed', requestUrl.origin)
      )
    }

    // Success! Redirect to app
    return NextResponse.redirect(new URL(next, requestUrl.origin))
  }

  // No code provided
  return NextResponse.redirect(
    new URL('/login?error=no_code', requestUrl.origin)
  )
}
```

---

## Key Takeaways

1. **Callback route is for OAuth/magic links** - not email/password
2. **It exchanges a code for a session** - the code comes from the OAuth provider
3. **It sets cookies** - so the user stays logged in
4. **It redirects the user** - back to your app after authentication
5. **It's required for OAuth** - but optional if you only use email/password

**Bottom line:** If you're using OAuth providers (Google, GitHub, etc.) or magic links, you need this route. If you're only using email/password, you can skip it (but it's still good to have for future use).

