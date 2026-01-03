# Supabase Session Expiration & Middleware Refresh

## How Supabase Sessions Work

### Session Components

Supabase uses **two types of tokens**:

1. **Access Token** (JWT)
   - Expires after **1 hour** by default
   - Used to authenticate API requests
   - Short-lived for security

2. **Refresh Token**
   - Expires after **30 days** (configurable in Supabase dashboard)
   - Used to get new access tokens
   - Long-lived but stored securely

### Default Expiration Times

- **Access Token:** 1 hour
- **Refresh Token:** 30 days (can be configured in Supabase dashboard)

---

## Does User Log Out After 1 Hour?

**No!** Users don't automatically log out after 1 hour because:

1. **Middleware automatically refreshes** the access token before it expires
2. **Refresh token** is valid for 30 days
3. As long as the user is active (making requests), they stay logged in

### What Actually Happens

```
User logs in
  ↓
Access token expires after 1 hour
  ↓
User makes request (visits page)
  ↓
Middleware runs → Calls getClaims()
  ↓
Supabase checks: Is access token expired?
  ├─ NO → Use existing token
  └─ YES → Use refresh token to get NEW access token
  ↓
New access token (another 1 hour) + Updated cookies
  ↓
User stays logged in ✅
```

**Key Point:** As long as the user makes requests within 30 days, they stay logged in automatically.

---

## How Middleware Resets the Timer

### The Magic: `getClaims()`

In your middleware (line 90):

```typescript
const { data } = await supabase.auth.getClaims();
```

**What `getClaims()` does:**

1. **Checks if access token is valid**
   - If valid → Returns user data immediately
   - If expired → Automatically refreshes it

2. **Automatic Refresh Process:**
   ```
   Access token expired?
     ↓ YES
   Use refresh token to get new access token
     ↓
   Update cookies with new access token
     ↓
   Return new user data
   ```

3. **Updates Cookies:**
   - The `setAll()` function in your cookie handler (lines 69-78)
   - Automatically updates cookies with new tokens
   - Browser stores new tokens
   - Timer resets to another 1 hour

### When Does Refresh Happen?

**Every time middleware runs:**
- User visits any page
- User makes API request
- User navigates between pages
- Any request that goes through middleware

**Example Timeline:**

```
10:00 AM - User logs in
          Access token expires: 11:00 AM

10:30 AM - User visits /dashboard
          Middleware runs → Token still valid
          No refresh needed

10:59 AM - User visits /watchlist
          Middleware runs → Token still valid
          No refresh needed

11:01 AM - User visits /portfolio
          Middleware runs → Token EXPIRED!
          getClaims() automatically refreshes
          New token expires: 12:01 PM
          Timer reset! ✅

11:30 AM - User visits /dashboard
          Middleware runs → Token still valid
          No refresh needed
```

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ User Makes Request (e.g., visits /dashboard)            │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ Middleware Intercepts Request                            │
│ 1. Reads cookies from request                           │
│ 2. Creates Supabase client                               │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ supabase.auth.getClaims()                               │
│                                                          │
│ Checks: Is access token expired?                        │
└──────┬───────────────────────────────┬──────────────────┘
       │                               │
       │ NO (Still valid)              │ YES (Expired)
       ↓                               ↓
┌──────────────┐              ┌──────────────────────────┐
│ Use existing │              │ Automatic Refresh:        │
│ token        │              │ 1. Use refresh token      │
│              │              │ 2. Get new access token  │
│ Return user  │              │ 3. Update cookies        │
│ data         │              │ 4. Timer resets to 1hr   │
└──────┬───────┘              └──────┬───────────────────┘
       │                               │
       └───────────┬───────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────┐
│ Response Sent with Updated Cookies                      │
│ - New access token (if refreshed)                       │
│ - User stays logged in                                  │
└─────────────────────────────────────────────────────────┘
```

---

## When Does User Actually Log Out?

### Scenario 1: Inactive for 30 Days

```
User logs in → No activity for 30 days
  ↓
Refresh token expires (30 days)
  ↓
Next request → Middleware can't refresh
  ↓
User is logged out
```

### Scenario 2: User Explicitly Logs Out

```typescript
await supabase.auth.signOut()
```

### Scenario 3: Refresh Token Revoked

- User changes password
- Admin revokes session
- Security event

---

## Your Middleware Code Explained

### Line 90: The Key Function

```typescript
const { data } = await supabase.auth.getClaims();
```

**What happens internally:**

1. Supabase checks access token expiration
2. If expired (< 5 minutes remaining), automatically refreshes
3. Updates cookies with new tokens
4. Returns user data

### Lines 69-78: Cookie Update Handler

```typescript
setAll(cookiesToSet) {
  cookiesToSet.forEach(({ name, value }) =>
    request.cookies.set(name, value)
  );
  supabaseResponse = NextResponse.next({ request });
  cookiesToSet.forEach(({ name, value, options }) =>
    supabaseResponse.cookies.set(name, value, options)
  );
}
```

**What this does:**
- When Supabase refreshes tokens, it calls `setAll()`
- This updates cookies in the response
- Browser receives new cookies
- Session timer resets

---

## Configuration Options

### Change Access Token Expiration

In Supabase Dashboard:
1. Go to **Authentication** → **Settings**
2. Find **JWT expiry**
3. Default: 3600 seconds (1 hour)
4. Can be changed (but not recommended to go too high)

### Change Refresh Token Expiration

In Supabase Dashboard:
1. Go to **Authentication** → **Settings**
2. Find **Refresh token expiry**
3. Default: 2592000 seconds (30 days)
4. Can be changed

---

## Summary

### Does user log out after 1 hour?
**No** - Middleware automatically refreshes the token before it expires.

### Does middleware reset the time?
**Yes** - Every time `getClaims()` runs and the token is expired (or about to expire), it:
1. Uses refresh token to get new access token
2. Updates cookies with new token
3. Resets timer to another 1 hour

### How does it work?
1. **Access token expires** after 1 hour
2. **User makes request** → Middleware runs
3. **`getClaims()` checks** token expiration
4. **If expired** → Automatically refreshes using refresh token
5. **New access token** (another 1 hour) + updated cookies
6. **User stays logged in** seamlessly

**Key Point:** As long as the user is active (making requests), they stay logged in indefinitely (up to 30 days of refresh token validity).

