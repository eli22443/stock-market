# Postman Authentication Setup Guide

## ✅ Fixed: Bearer Token Support

The API routes now support **both** cookie-based authentication (for browsers) and Bearer token authentication (for Postman/testing).

## 🔑 How to Get Your Supabase Access Token

### Method 1: From Browser DevTools (Easiest)

1. **Log in to your app** in the browser (http://localhost:3000)
2. **Open DevTools** (F12)
3. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
4. Click on **Cookies** → `http://localhost:3000`
5. Look for a cookie named: `sb-<your-project-ref>-auth-token`
   - Example: `sb-abcdefghijklmnop-auth-token`
6. **Copy the entire value** (it's a JWT token)
7. Use this as your Bearer token in Postman

### Method 2: From Browser Console

1. **Log in to your app** in the browser
2. **Open DevTools** (F12) → **Console** tab
3. Run this JavaScript:
   ```javascript
   // Get the Supabase client
   const supabase = window.supabase || (await import('/lib/supabase/client')).createClient();
   
   // Get the session
   const { data: { session } } = await supabase.auth.getSession();
   console.log('Access Token:', session?.access_token);
   ```
4. Copy the `access_token` from the console output

### Method 3: From Network Tab

1. **Log in to your app** in the browser
2. **Open DevTools** (F12) → **Network** tab
3. Make any authenticated request (e.g., visit `/dashboard`)
4. Click on the request → **Headers** tab
5. Look for the `Cookie` header
6. Find the `sb-<project-ref>-auth-token` value
7. Copy it

### Method 4: Direct Supabase API Call

If you have your Supabase project URL and anon key, you can get a token directly:

```http
POST https://<your-project>.supabase.co/auth/v1/token?grant_type=password
Content-Type: application/json

{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

Response will contain:
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "...",
  ...
}
```

---

## 📝 Using the Token in Postman

### Step 1: Set Authorization Header

In Postman, for each request:

1. Go to **Authorization** tab
2. Select **Type: Bearer Token**
3. Paste your token in the **Token** field

**OR**

1. Go to **Headers** tab
2. Add header:
   - **Key:** `Authorization`
   - **Value:** `Bearer <your-token-here>`

### Step 2: Test the Request

Try this request:

```
GET http://localhost:3000/api/watchlists
Authorization: Bearer <your-token>
```

You should get a `200 OK` response with your watchlists (or empty array `[]` if you have none).

---

## 🧪 Quick Test

1. **Get your token** using Method 1 above
2. **In Postman**, create a new request:
   - Method: `GET`
   - URL: `http://localhost:3000/api/watchlists`
   - Headers:
     - `Authorization: Bearer <your-token>`
3. **Send the request**
4. **Expected:** `200 OK` with JSON array (empty or with watchlists)

---

## ⚠️ Troubleshooting

### Still Getting 401 Unauthorized?

1. **Check token format:**
   - Should start with `eyJ` (JWT tokens start this way)
   - Should be very long (hundreds of characters)
   - Make sure you copied the **entire** token value

2. **Token might be expired:**
   - Supabase access tokens expire after 1 hour
   - Get a fresh token from the browser

3. **Check the Authorization header:**
   - Format: `Bearer <token>` (with space after "Bearer")
   - No quotes around the token
   - No extra spaces

4. **Verify token is valid:**
   - Try logging out and back in to get a fresh token
   - Make sure you're logged in when copying the token

### Token Works in Browser but Not Postman?

- Make sure you're using the **access_token**, not the refresh_token
- The token from the cookie should work directly
- Try getting a fresh token after logging in again

---

## 🔄 Token Expiration

- **Access tokens expire after 1 hour**
- If you get 401 after testing for a while, get a fresh token
- For long testing sessions, you may need to refresh the token periodically

---

## ✅ Success Indicators

When authentication is working correctly:

- ✅ Status code: `200` (not `401`)
- ✅ Response contains JSON (not error message)
- ✅ For GET `/api/watchlists`: Returns array (even if empty)
- ✅ For POST requests: Returns `201 Created` with data

---

## 📚 Next Steps

Once authentication is working:

1. Test all endpoints from the `POSTMAN_WATCHLISTS_TESTS.md` guide
2. Follow the "Complete Test Flow" sequence
3. Verify all CRUD operations work correctly

