# Client vs Server Supabase Clients

## Quick Answer

**`client.ts`** = Browser/client-side (runs in user's browser)  
**`server.ts`** = Server-side (runs on Next.js server)

---

## Key Differences

| Feature | `client.ts` | `server.ts` |
|---------|-------------|------------|
| **Runs in** | Browser | Server |
| **Used in** | Client Components (`'use client'`) | Server Components, API Routes |
| **Function** | `createBrowserClient()` | `createServerClient()` |
| **Cookies** | Automatically handled by browser | Manually managed via Next.js cookies |
| **Security** | Uses public anon key | Uses public anon key (but server-side) |
| **Session** | Reads from browser cookies | Reads from request cookies |

---

## When to Use Each

### Use `client.ts` (Browser Client) When:

✅ **Client Components** - Components with `'use client'` directive
✅ **User Interactions** - Login, signup, logout buttons
✅ **Real-time Updates** - Live data subscriptions
✅ **Form Submissions** - User input forms
✅ **Interactive Features** - Buttons, clicks, user actions

**Example:**
```typescript
// components/auth/LoginForm.tsx
'use client'  // ← Client Component

import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const supabase = createClient()  // ← Use client.ts
  
  const handleLogin = async () => {
    await supabase.auth.signInWithPassword({
      email: 'user@example.com',
      password: 'password'
    })
  }
  
  return <button onClick={handleLogin}>Login</button>
}
```

### Use `server.ts` (Server Client) When:

✅ **Server Components** - Components without `'use client'`
✅ **API Routes** - `/api/*/route.ts` files
✅ **Server-Side Data Fetching** - Initial page load data
✅ **Protected Routes** - Checking auth before rendering
✅ **Server Actions** - Form actions that run on server

**Example:**
```typescript
// app/dashboard/page.tsx
// No 'use client' = Server Component

import { createClient } from '@/lib/supabase/server'

export default async function Dashboard() {
  const supabase = await createClient()  // ← Use server.ts
  
  const { data: watchlists } = await supabase
    .from('watchlists')
    .select('*')
  
  return <div>{/* Render watchlists */}</div>
}
```

---

## How They Handle Cookies

### Client (`client.ts`)

```typescript
// Automatically reads/writes browser cookies
const supabase = createBrowserClient(url, key)
// Browser handles cookies automatically - no manual management needed
```

**How it works:**
- Browser automatically sends cookies with requests
- Browser automatically stores cookies from responses
- No manual cookie handling needed

### Server (`server.ts`)

```typescript
// Manually manages cookies via Next.js
const cookieStore = await cookies()  // ← Get cookies from request

const supabase = createServerClient(url, key, {
  cookies: {
    getAll() {
      return cookieStore.getAll()  // ← Read cookies
    },
    setAll(cookiesToSet) {
      // ← Write cookies
      cookiesToSet.forEach(({ name, value, options }) =>
        cookieStore.set(name, value, options)
      )
    }
  }
})
```

**How it works:**
- Server reads cookies from the incoming request
- Server writes cookies to the outgoing response
- Manual cookie management required

---

## Code Comparison

### Client Component Example

```typescript
// components/UserProfile.tsx
'use client'  // ← Client Component

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function UserProfile() {
  const supabase = createClient()  // ← Browser client
  const [user, setUser] = useState(null)

  useEffect(() => {
    // This runs in the browser
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }, [])

  return <div>Hello {user?.email}</div>
}
```

### Server Component Example

```typescript
// app/profile/page.tsx
// No 'use client' = Server Component

import { createClient } from '@/lib/supabase/server'

export default async function Profile() {
  const supabase = await createClient()  // ← Server client
  
  // This runs on the server before page loads
  const { data: { user } } = await supabase.auth.getUser()
  
  return <div>Hello {user?.email}</div>
}
```

---

## API Route Example

```typescript
// app/api/watchlists/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()  // ← Must use server.ts
  
  // Get current user (from cookies)
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Fetch user's watchlists
  const { data } = await supabase
    .from('watchlists')
    .select('*')
    .eq('user_id', user.id)
  
  return NextResponse.json(data)
}
```

**Why server.ts?**
- API routes run on the server
- Need to read cookies from the request
- Need to write cookies to the response

---

## Common Mistakes

### ❌ Wrong: Using Client in Server Component

```typescript
// app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/client'  // ❌ Wrong!

export default async function Dashboard() {
  const supabase = createClient()  // ❌ Won't work properly!
  // Error: cookies not accessible in server components with browser client
}
```

**Problem:** Browser client can't access server cookies properly.

### ❌ Wrong: Using Server in Client Component

```typescript
// components/LoginForm.tsx
'use client'
import { createClient } from '@/lib/supabase/server'  // ❌ Wrong!

export function LoginForm() {
  const supabase = await createClient()  // ❌ Can't use await in client component!
  // Error: Server client needs async/await, but client components can't be async
}
```

**Problem:** Server client requires async, but client components can't be async functions.

### ✅ Correct: Match Client Type to Component Type

```typescript
// Client Component → Use client.ts
'use client'
import { createClient } from '@/lib/supabase/client'

// Server Component → Use server.ts
import { createClient } from '@/lib/supabase/server'
```

---

## How They Access Sessions

### Client (`client.ts`)

```typescript
const supabase = createClient()

// Reads session from browser cookies automatically
const { data: { session } } = await supabase.auth.getSession()
```

**Flow:**
1. Browser stores auth cookies
2. Client reads cookies automatically
3. Supabase validates session

### Server (`server.ts`)

```typescript
const supabase = await createClient()

// Reads session from request cookies
const { data: { session } } = await supabase.auth.getSession()
```

**Flow:**
1. Browser sends cookies with request
2. Server reads cookies from request
3. Supabase validates session
4. Server can modify cookies in response

---

## Security Considerations

### Both Use Public Anon Key

Both clients use `NEXT_PUBLIC_SUPABASE_ANON_KEY` - this is safe because:
- It's a **public** key (meant to be exposed)
- Row Level Security (RLS) protects your data
- The key has limited permissions

### Server-Side Benefits

**Server client advantages:**
- Can't be inspected in browser DevTools
- Runs in secure server environment
- Better for sensitive operations

**Client client considerations:**
- Visible in browser (but that's okay - it's public)
- Protected by RLS policies
- Good for user interactions

---

## Real-World Usage Patterns

### Pattern 1: Login Form (Client)

```typescript
// components/auth/LoginForm.tsx
'use client'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const supabase = createClient()
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    await supabase.auth.signInWithPassword({
      email: e.target.email.value,
      password: e.target.password.value
    })
  }
  
  return <form onSubmit={handleSubmit}>...</form>
}
```

### Pattern 2: Protected Page (Server)

```typescript
// app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  return <div>Welcome {user.email}</div>
}
```

### Pattern 3: API Route (Server)

```typescript
// app/api/watchlists/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { data } = await supabase
    .from('watchlists')
    .select('*')
    .eq('user_id', user.id)
  
  return NextResponse.json(data)
}
```

---

## Quick Decision Tree

```
Is your code in a Client Component?
├─ YES → Use client.ts
│   └─ 'use client' directive
│   └─ Interactive features
│   └─ User actions (buttons, forms)
│
└─ NO → Use server.ts
    ├─ Server Component (no 'use client')
    ├─ API Route (/api/*/route.ts)
    └─ Server Action
```

---

## Summary

| Aspect | `client.ts` | `server.ts` |
|--------|-------------|-------------|
| **Location** | Browser | Server |
| **Component Type** | Client Components | Server Components, API Routes |
| **Cookies** | Automatic (browser) | Manual (Next.js cookies) |
| **Function** | `createBrowserClient()` | `createServerClient()` |
| **Use For** | User interactions, forms, real-time | Data fetching, API routes, protection |
| **Async** | Not required | Required (`await createClient()`) |

**Rule of thumb:**
- **Client Component** (`'use client'`) → `client.ts`
- **Server Component or API Route** → `server.ts`

---

## Your Current Files

Looking at your code:

**`client.ts`** ✅ Correct
```typescript
import { createBrowserClient } from "@supabase/ssr"
// For client components
```

**`server.ts`** ✅ Correct
```typescript
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
// For server components and API routes
```

Both are set up correctly! Just make sure to use the right one in the right place.

---

## Additional: Middleware Client

You also have `middleware.ts` which is a special server client for middleware:

```typescript
// lib/supabase/middleware.ts
// Special server client for middleware only
// Uses NextRequest instead of cookies()
```

**Use this only in `middleware.ts`** - it's optimized for the middleware context.

---

**Remember:** Match the client type to where your code runs - browser = client.ts, server = server.ts!

