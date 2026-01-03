# Google OAuth Setup for Dev Mode

## Step-by-Step Guide

### Step 1: Create Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project (or select existing)**
   - Click "Select a project" → "New Project"
   - Name: `stock-market-app` (or your choice)
   - Click "Create"

3. **Enable Google+ API**
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API"
   - Click "Enable" (if not already enabled)

4. **Create OAuth 2.0 Credentials**
   - Go to **APIs & Services** → **Credentials**
   - Click **+ CREATE CREDENTIALS** → **OAuth client ID**
   - If prompted, configure OAuth consent screen first:
     - **User Type:** External (for testing)
     - **App name:** Stock Market App
     - **User support email:** Your email
     - **Developer contact:** Your email
     - Click "Save and Continue"
     - **Scopes:** Click "Save and Continue" (default is fine)
     - **Test users:** Add your email, click "Save and Continue"
     - Click "Back to Dashboard"

5. **Create OAuth Client ID**
   - **Application type:** Web application
   - **Name:** Stock Market App (Dev)
   - **Authorized JavaScript origins:**
     ```
     http://localhost:3000
     ```
   - **Authorized redirect URIs:**
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```
     Replace `YOUR_PROJECT_REF` with your Supabase project reference (found in Supabase dashboard URL)
   
   - Click **Create**
   - **IMPORTANT:** Copy the **Client ID** and **Client Secret** (you'll need these)

---

### Step 2: Configure Supabase

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Authentication Settings**
   - Go to **Authentication** → **Providers**
   - Find **Google** in the list
   - Click to enable/configure

3. **Enter Google OAuth Credentials**
   - **Enable Google provider:** Toggle ON
   - **Client ID (for OAuth):** Paste your Google Client ID
   - **Client Secret (for OAuth):** Paste your Google Client Secret
   - Click **Save**

4. **Configure Redirect URLs**
   - Go to **Authentication** → **URL Configuration**
   - **Site URL:** `http://localhost:3000`
   - **Redirect URLs:** Add:
     ```
     http://localhost:3000/api/auth/callback
     http://localhost:3000/**
     ```
   - Click **Save**

---

### Step 3: Verify Your Code

Your code should already be set up correctly:

**`frontend/services/auth-client.ts`:**
```typescript
redirectTo: `${window.location.origin}/api/auth/callback`
```
✅ This is correct for dev mode (will be `http://localhost:3000/api/auth/callback`)

**`frontend/app/api/auth/callback/route.ts`:**
✅ Already configured to handle OAuth callbacks

---

### Step 4: Test

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Visit login page:**
   ```
   http://localhost:3000/login
   ```

3. **Click "Login with Google"**
   - Should redirect to Google sign-in
   - After signing in, should redirect back to your app
   - Should be logged in and redirected to `/dashboard`

---

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Problem:** Redirect URI doesn't match what's configured in Google Cloud Console.

**Solution:**
1. Check Google Cloud Console → Credentials → Your OAuth Client
2. Make sure redirect URI is exactly:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
3. No trailing slashes, exact match required

### Error: "access_denied"

**Problem:** OAuth consent screen not configured or user not added as test user.

**Solution:**
1. Go to Google Cloud Console → APIs & Services → OAuth consent screen
2. Make sure it's configured (see Step 1.4)
3. Add your email as a test user
4. If app is in "Testing" mode, only test users can sign in

### Error: "invalid_client"

**Problem:** Client ID or Client Secret is wrong in Supabase.

**Solution:**
1. Double-check Client ID and Client Secret in Supabase dashboard
2. Make sure there are no extra spaces
3. Copy-paste directly from Google Cloud Console

### User Not Redirecting After Login

**Problem:** Callback route not working or redirect URL wrong.

**Solution:**
1. Check browser console for errors
2. Verify `frontend/app/api/auth/callback/route.ts` exists
3. Check Supabase → Authentication → URL Configuration
4. Make sure redirect URL includes `/api/auth/callback`

---

## Production Setup (Later)

When deploying to production:

1. **Update Google OAuth Credentials:**
   - Add production redirect URI:
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```
   - Add production JavaScript origin:
     ```
     https://yourdomain.com
     ```

2. **Update Supabase:**
   - **Site URL:** `https://yourdomain.com`
   - **Redirect URLs:** 
     ```
     https://yourdomain.com/api/auth/callback
     https://yourdomain.com/**
     ```

3. **Update Code (if needed):**
   - The `redirectTo` in `auth-client.ts` already uses `window.location.origin`, so it should work automatically
   - Just make sure your production domain is configured correctly

---

## Quick Checklist

- [ ] Google Cloud Console project created
- [ ] OAuth consent screen configured
- [ ] OAuth Client ID created (Web application)
- [ ] Redirect URI added: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
- [ ] JavaScript origin added: `http://localhost:3000`
- [ ] Supabase → Authentication → Providers → Google enabled
- [ ] Client ID and Client Secret added to Supabase
- [ ] Supabase → Authentication → URL Configuration set
- [ ] Site URL: `http://localhost:3000`
- [ ] Redirect URLs include: `http://localhost:3000/api/auth/callback`
- [ ] Test user added to OAuth consent screen (if in Testing mode)

---

## Finding Your Supabase Project Reference

Your Supabase project reference is in your Supabase dashboard URL:
```
https://supabase.com/dashboard/project/YOUR_PROJECT_REF
```

Or check your `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
```

The part before `.supabase.co` is your project reference.

