# How to Get Your Supabase Access Token for Postman

## The Problem

When you copy the cookie value from your browser, you might get a `base64-` prefixed string that contains a JSON object, not a direct JWT token.

## Solution: Extract the Access Token

### Method 1: From Browser Console (Easiest)

1. **Log in to your app** in the browser
2. **Open DevTools** (F12) → **Console** tab
3. **Run this code:**

```javascript
// Get the Supabase client
const { createClient } = await import('/lib/supabase/client');
const supabase = createClient();

// Get the session
const { data: { session } } = await supabase.auth.getSession();

if (session) {
  console.log('Access Token:', session.access_token);
  console.log('Copy this token for Postman!');
} else {
  console.log('No session found. Please log in first.');
}
```

4. **Copy the `access_token`** value (it starts with `eyJ`)

### Method 2: Decode the Base64 Cookie Value

If you already copied the `base64-` prefixed cookie value:

1. **Remove the `base64-` prefix**
2. **Decode the base64 string** (use an online decoder or Node.js)
3. **Parse the JSON** and extract `access_token`

**Example using Node.js:**
```javascript
const base64Value = "eyJhY2Nlc3NfdG9rZW4iOiJleUpoYkdjaU9pSkZVekkxTmlJc0ltdHBaQ0k2SW1VelpUTTFOR1JpTFRjMk56SXROREl5TWkwNU1qazRMV0ZsWXprM09ETmhOMkV3WlNJc0luUjVjQ0k2SWtwWFZDSjkuZXlKcGMzTWlPaUpvZEhSd2N6b3ZMM0Z2ZUc1NWVuRndjbVZ3WjJaM2JuWjNibUYzTG5OMWNHRmlZWE5sTG1OdkwyRjFkR2d2ZGpFaUxDSnpkV0lpT2lJMk5HRTNPV0ZrWVMxak5UQmxMVFE1WmpZdE9UVTRaaTA0TkRVME1UUXlaak5rWm1ZaUxDSmhkV1FpT2lKaGRYUm9aVzUwYVdOaGRHVmtJaXdpWlhod0lqb3hOelkzT1RZNE9ETTNMQ0pwWVhRaU9qRTNOamM1TmpVeU16Y3NJbVZ0WVdsc0lqb2laV3hwTWpJME5ETkFaMjFoYVd3dVkyOXRJaXdpY0dodmJtVWlPaUlpTENKaGNIQmZiV1YwWVdSaGRHRWlPbnNpY0hKdmRtbGtaWElpT2lKbGJXRnBiQ0lzSW5CeWIzWnBaR1Z5Y3lJNld5SmxiV0ZwYkNKZGZTd2lkWE5sY2w5dFpYUmhaR0YwWVNJNmV5SmxiV0ZwYkNJNkltVnNhVEl5TkRRelFHZHRZV2xzTG1OdmJTSXNJbVZ0WVdsc1gzWmxjbWxtYVdWa0lqcDBjblZsTENKbWRXeHNYMjVoYldVaU9pSkZiR2xoY3lCQlltVmlZU0lzSW5Cb2IyNWxYM1psY21sbWFXVmtJanBtWVd4elpTd2ljM1ZpSWpvaU5qUmhOemxoWkdFdFl6VXdaUzAwT1dZMkxUazFPR1l0T0RRMU5ERTBNbVl6WkdabUluMHNJbkp2YkdVaU9pSmhkWFJvWlc1MGFXTmhkR1ZrSWl3aVlXRnNJam9pWVdGc01TSXNJbUZ0Y2lJNlczc2liV1YwYUc5a0lqb2ljR0Z6YzNkdmNtUWlMQ0owYVcxbGMzUmhiWEFpT2pFM05qYzVOakE1TnpSOVhTd2ljMlZ6YzJsdmJsOXBaQ0k2SWpZd01UWmlNV1ZrTFRNMlltVXRORFF3WXkxaVpXVTVMVEExWXpKbU1tRXlZMlJtWkNJc0ltbHpYMkZ1YjI1NWJXOTFjeUk2Wm1Gc2MyVjkuVjFNZzJOR3oxX2I4SFRVVXdRc0tfd1FnOUd1NHUzbUhobDl6akNFY0ZGc3l6NUVEbGF4ZG5CZFM3Z2hhaEJxSkl3bFNXQ19aSmRWZm1jZVZoM3F1eUEiLCJ0b2tlbl90eXBlIjoiYmVhcmVyIiwiZXhwaXJlc19pbiI6MzYwMCwiZXhwaXJlc19hdCI6MTc2Nzk2ODgzNywicmVmcmVzaF90b2tlbiI6InNlcWJlZDd1eXNwNCIsInVzZXIiOnsiaWQiOiI2NGE3OWFkYS1jNTBlLTQ5ZjYtOTU4Zi04NDU0MTQyZjNkZmYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJlbWFpbCI6ImVsaTIyNDQzQGdtYWlsLmNvbSIsImVtYWlsX2NvbmZpcm1lZF9hdCI6IjIwMjYtMDEtMDJUMDk6NDU6MjQuNTY0NTk3WiIsInBob25lIjoiIiwiY29uZmlybWVkX2F0IjoiMjAyNi0wMS0wMlQwOTo0NToyNC41NjQ1OTdaIiwibGFzdF9zaWduX2luX2F0IjoiMjAyNi0wMS0wOVQxMjoxNjoxNC40MzY1NTRaIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJlbGkyMjQ0M0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoiRWxpYXMgQWJlYmEiLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6IjY0YTc5YWRhLWM1MGUtNDlmNi05NThmLTg0NTQxNDJmM2RmZiJ9LCJpZGVudGl0aWVzIjpbeyJpZGVudGl0eV9pZCI6IjBmMGM4ZWMyLThmNGEtNDAzOC1hYzI1LTI5MTkxMWMyN2U3MSIsImlkIjoiNjRhNzlhZGEtYzUwZS00OWY2LTk1OGYtODQ1NDE0MmYzZGZmIiwidXNlcl9pZCI6IjY0YTc5YWRhLWM1MGUtNDlmNi05NThmLTg0NTQxNDJmM2RmZiIsImlkZW50aXR5X2RhdGEiOnsiZW1haWwiOiJlbGkyMjQ0M0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiNjRhNzlhZGEtYzUwZS00OWY2LTk1OGYtODQ1NDE0MmYzZGZmIn0sInByb3ZpZGVyIjoiZW1haWwiLCJsYXN0X3NpZ25faW5fYXQiOiIyMDI2LTAxLTAyVDA5OjQ1OjI0LjU1MjU3NFoiLCJjcmVhdGVkX2F0IjoiMjAyNi0wMS0wMlQwOTo0NToyNC41NTI2NDRaIiwidXBkYXRlZF9hdCI6IjIwMjYtMDEtMDJUMDk6NDU6MjQuNTUyNjQ0WiIsImVtYWlsIjoiZWxpMjI0NDNAZ21haWwuY29tIn1dLCJjcmVhdGVkX2F0IjoiMjAyNi0wMS0wMlQwOTo0NToyNC40OTQ0NloiLCJ1cGRhdGVkX2F0IjoiMjAyNi0wMS0wOVQxMzoyNzoxNi45MTQxMzJaIiwiaXNfYW5vbnltb3VzIjpmYWxzZX19";

// Remove "base64-" prefix if present
const base64Data = base64Value.startsWith("base64-") 
  ? base64Value.substring(7) 
  : base64Value;

// Decode base64
const decoded = Buffer.from(base64Data, "base64").toString("utf-8");

// Parse JSON
const parsed = JSON.parse(decoded);

// Extract access_token
console.log("Access Token:", parsed.access_token);
```

**Or use an online tool:**
1. Go to https://www.base64decode.org/
2. Paste your base64 string (without `base64-` prefix)
3. Decode it
4. Copy the JSON result
5. Parse it and find `access_token`

### Method 3: Use the Cookie Directly (Now Supported!)

**Good news!** The middleware and server now automatically handle `base64-` prefixed tokens. You can use the cookie value directly:

```
Authorization: Bearer base64-<your-base64-encoded-cookie-value>
```

The code will automatically:
1. Detect the `base64-` prefix
2. Decode the base64 string
3. Extract the `access_token` from the JSON
4. Use it for authentication

---

## What Token Format to Use

### ✅ Correct Format (JWT Token)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```
- Starts with `eyJ`
- Has 3 parts separated by dots (`.`)
- This is what you should use in Postman

### ⚠️ Base64-Encoded Cookie Format (Now Supported)
```
base64-eyJhY2Nlc3NfdG9rZW4iOiJleUpoYkdjaU9pSkZVekkxTmlJc0ltdHBaQ0k2...
```
- Starts with `base64-`
- Contains a JSON object with `access_token` inside
- **Now automatically handled!** Just use it as-is

---

## Quick Test

1. **Get your token** using Method 1 (browser console)
2. **In Postman:**
   - Method: `GET`
   - URL: `http://localhost:3000/api/watchlists`
   - Header: `Authorization: Bearer <your-token>`
3. **Send request**
4. **Expected:** `200 OK` with your watchlists

---

## Troubleshooting

### Still Getting 401?

1. **Token expired?** Get a fresh token (they expire after 1 hour)
2. **Wrong format?** Make sure it starts with `eyJ` (JWT) or `base64-` (cookie format)
3. **Missing "Bearer "?** Header must be: `Bearer <token>` (with space)

### Token Works in Browser but Not Postman?

- Make sure you're using the **access_token**, not the refresh_token
- Try Method 1 (browser console) to get the exact token
- Verify the token hasn't expired

