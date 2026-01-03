# How to Update user_metadata in Supabase auth.users Table

## Overview

The `user_metadata` column in `auth.users` is a JSONB column that stores custom user data. You can update it using SQL in the Supabase SQL Editor.

---

## Basic Syntax

### Update Single User by Email

```sql
UPDATE auth.users
SET user_metadata = jsonb_set(
  COALESCE(user_metadata, '{}'::jsonb),
  '{key_name}',
  '"value"'
)
WHERE email = 'user@example.com';
```

### Update Single User by ID

```sql
UPDATE auth.users
SET user_metadata = jsonb_set(
  COALESCE(user_metadata, '{}'::jsonb),
  '{key_name}',
  '"value"'
)
WHERE id = 'user-uuid-here';
```

---

## Examples

### Example 1: Add a Single Key-Value

```sql
-- Add "subscription_tier" = "premium"
UPDATE auth.users
SET user_metadata = jsonb_set(
  COALESCE(user_metadata, '{}'::jsonb),
  '{subscription_tier}',
  '"premium"'
)
WHERE email = 'user@example.com';
```

### Example 2: Add Multiple Key-Values

```sql
-- Add multiple fields at once
UPDATE auth.users
SET user_metadata = jsonb_set(
  jsonb_set(
    COALESCE(user_metadata, '{}'::jsonb),
    '{subscription_tier}',
    '"premium"'
  ),
  '{account_type}',
  '"pro"'
)
WHERE email = 'user@example.com';
```

### Example 3: Add Nested Object

```sql
-- Add nested object: { preferences: { theme: "dark" } }
UPDATE auth.users
SET user_metadata = jsonb_set(
  COALESCE(user_metadata, '{}'::jsonb),
  '{preferences}',
  '{"theme": "dark", "notifications": true}'::jsonb
)
WHERE email = 'user@example.com';
```

### Example 4: Update Existing Key (Preserve Other Keys)

```sql
-- Update existing key while keeping other metadata
UPDATE auth.users
SET user_metadata = jsonb_set(
  user_metadata,  -- Use existing metadata
  '{subscription_tier}',
  '"enterprise"'  -- Update this key
)
WHERE email = 'user@example.com';
```

### Example 5: Add Array

```sql
-- Add array: { favorite_stocks: ["AAPL", "GOOGL", "MSFT"] }
UPDATE auth.users
SET user_metadata = jsonb_set(
  COALESCE(user_metadata, '{}'::jsonb),
  '{favorite_stocks}',
  '["AAPL", "GOOGL", "MSFT"]'::jsonb
)
WHERE email = 'user@example.com';
```

---

## Step-by-Step Guide

### Step 1: Open SQL Editor

1. Go to Supabase Dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Find User ID (if needed)

If you don't know the user ID, find it first:

```sql
-- Find user by email
SELECT id, email, user_metadata
FROM auth.users
WHERE email = 'user@example.com';
```

### Step 3: Update Metadata

Use one of the examples above to update the metadata.

### Step 4: Verify Update

```sql
-- Check the updated metadata
SELECT id, email, user_metadata
FROM auth.users
WHERE email = 'user@example.com';
```

---

## Common Patterns

### Pattern 1: Merge with Existing Metadata

```sql
-- Merge new data with existing metadata
UPDATE auth.users
SET user_metadata = COALESCE(user_metadata, '{}'::jsonb) || 
  '{"new_key": "new_value", "another_key": 123}'::jsonb
WHERE email = 'user@example.com';
```

### Pattern 2: Remove a Key

```sql
-- Remove a key from metadata
UPDATE auth.users
SET user_metadata = user_metadata - 'key_to_remove'
WHERE email = 'user@example.com';
```

### Pattern 3: Update All Users

```sql
-- Add metadata to all users (use carefully!)
UPDATE auth.users
SET user_metadata = jsonb_set(
  COALESCE(user_metadata, '{}'::jsonb),
  '{onboarding_complete}',
  'false'
);
```

---

## Important Notes

### ⚠️ Security Warning

- **Never update `auth.users` directly in production** without careful consideration
- Consider using Supabase's API or RPC functions instead
- Direct SQL updates bypass Supabase's built-in security

### ✅ Best Practices

1. **Use RPC Functions Instead** (Recommended):
   ```sql
   -- Create a function in Supabase
   CREATE OR REPLACE FUNCTION update_user_metadata(
     user_id UUID,
     metadata_key TEXT,
     metadata_value JSONB
   )
   RETURNS void
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   BEGIN
     UPDATE auth.users
     SET user_metadata = jsonb_set(
       COALESCE(user_metadata, '{}'::jsonb),
       ARRAY[metadata_key],
       metadata_value
     )
     WHERE id = user_id;
   END;
   $$;
   ```

2. **Use Application Code** (Best Practice):
   ```typescript
   // In your Next.js app
   const { data, error } = await supabase.auth.updateUser({
     data: {
       subscription_tier: 'premium',
       account_type: 'pro'
     }
   });
   ```

3. **Test First**: Always test on a development database first

---

## Data Types in JSONB

### String
```sql
'{key}', '"string_value"'
```

### Number
```sql
'{key}', '123'
```

### Boolean
```sql
'{key}', 'true'
'{key}', 'false'
```

### Object
```sql
'{key}', '{"nested": "object"}'::jsonb
```

### Array
```sql
'{key}', '["item1", "item2"]'::jsonb
```

---

## Troubleshooting

### Error: "column does not exist"
- Make sure you're using `auth.users` (not just `users`)
- Check that you're in the correct database

### Error: "permission denied"
- You need admin access to update `auth.users` directly
- Consider using RPC functions with `SECURITY DEFINER`

### Metadata Not Showing
- Check if you're querying the right user
- Verify the JSONB syntax is correct
- Make sure you're using `COALESCE` to handle null metadata

---

## Quick Reference

```sql
-- Add single key-value
UPDATE auth.users
SET user_metadata = jsonb_set(
  COALESCE(user_metadata, '{}'::jsonb),
  '{key}',
  '"value"'
)
WHERE email = 'user@example.com';

-- View current metadata
SELECT user_metadata FROM auth.users WHERE email = 'user@example.com';

-- Remove a key
UPDATE auth.users
SET user_metadata = user_metadata - 'key'
WHERE email = 'user@example.com';
```

