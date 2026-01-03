# SQL Knowledge Guide for Supabase Integration

## What You Need to Know

### TL;DR - Quick Answer

**Minimum Required:**
- Basic SQL syntax (SELECT, INSERT, UPDATE, DELETE)
- Understanding of tables, columns, and data types
- Foreign keys and relationships
- **You can copy-paste most SQL from the plan** - but understanding helps!

**Nice to Have:**
- PostgreSQL-specific features (UUID, JSONB, triggers)
- Row Level Security (RLS) concepts
- Indexes for performance

**You DON'T Need:**
- Database administration
- Server setup/configuration
- Complex query optimization (Supabase handles this)
- Connection pooling (Supabase handles this)

---

## SQL Concepts You'll Use

### 1. Basic SQL Operations (Essential)

#### CREATE TABLE
```sql
CREATE TABLE public.watchlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

**What to understand:**
- `CREATE TABLE` - creates a new table
- Column names and data types (UUID, TEXT, TIMESTAMP, BOOLEAN)
- `PRIMARY KEY` - unique identifier
- `NOT NULL` - required field
- `DEFAULT` - default value if not provided
- `REFERENCES` - foreign key relationship

**You can copy-paste this** - just change table/column names.

#### SELECT (Reading Data)
```sql
-- Get all watchlists for a user
SELECT * FROM public.watchlists 
WHERE user_id = 'some-uuid';

-- Get watchlist with items
SELECT w.*, wi.symbol 
FROM public.watchlists w
LEFT JOIN public.watchlist_items wi ON w.id = wi.watchlist_id
WHERE w.user_id = 'some-uuid';
```

**What to understand:**
- `SELECT *` - get all columns
- `WHERE` - filter rows
- `JOIN` - combine data from multiple tables
- `LEFT JOIN` - include rows even if no match

**In your code:** You'll use Supabase client, not raw SQL:
```typescript
// This is what you'll actually write in TypeScript
const { data } = await supabase
  .from('watchlists')
  .select('*, watchlist_items(*)')
  .eq('user_id', userId);
```

#### INSERT (Creating Data)
```sql
INSERT INTO public.watchlists (user_id, name)
VALUES ('user-uuid', 'My Watchlist');
```

**In your code:**
```typescript
const { data } = await supabase
  .from('watchlists')
  .insert({ user_id: userId, name: 'My Watchlist' });
```

#### UPDATE (Modifying Data)
```sql
UPDATE public.watchlists 
SET name = 'Updated Name'
WHERE id = 'watchlist-uuid';
```

**In your code:**
```typescript
const { data } = await supabase
  .from('watchlists')
  .update({ name: 'Updated Name' })
  .eq('id', watchlistId);
```

#### DELETE (Removing Data)
```sql
DELETE FROM public.watchlists 
WHERE id = 'watchlist-uuid';
```

**In your code:**
```typescript
const { data } = await supabase
  .from('watchlists')
  .delete()
  .eq('id', watchlistId);
```

---

### 2. Relationships (Important)

#### Foreign Keys
```sql
-- This creates a relationship
user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
```

**What it means:**
- `REFERENCES` - this column points to another table
- `ON DELETE CASCADE` - if profile is deleted, delete watchlists too
- Alternative: `ON DELETE SET NULL` - set to NULL instead

**Why it matters:**
- Ensures data integrity
- Prevents orphaned records
- Automatically handles cleanup

#### One-to-Many Relationship
```
profiles (1) ──→ (many) watchlists
```

One user can have many watchlists.

#### Many-to-Many Relationship (via junction table)
```
watchlists (many) ──→ watchlist_items ←── (many) stocks
```

Many watchlists can have many stocks (through watchlist_items table).

---

### 3. Row Level Security (RLS) - Supabase Specific

**What it is:**
- Security feature that filters data automatically
- Users can only see/modify their own data
- Happens at database level, not application level

**Example:**
```sql
-- Enable RLS
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own watchlists
CREATE POLICY "Users can view own watchlists"
  ON public.watchlists FOR SELECT
  USING (auth.uid() = user_id);
```

**What to understand:**
- `auth.uid()` - Supabase function that gets current user's ID
- `USING` - condition for SELECT operations
- `WITH CHECK` - condition for INSERT/UPDATE operations

**You can copy-paste policies** - just adjust the table/column names.

---

### 4. PostgreSQL-Specific Features

#### UUID (Universally Unique Identifier)
```sql
id UUID DEFAULT gen_random_uuid() PRIMARY KEY
```

**Why use it:**
- Better than auto-incrementing integers
- Harder to guess (security)
- Works across distributed systems

#### JSONB (JSON Binary)
```sql
content JSONB NOT NULL
```

**What it is:**
- Stores JSON data
- Can query inside JSON
- Used for flexible data structures

**Example:**
```sql
-- Store AI insight data
INSERT INTO ai_insights (content)
VALUES ('{"analysis": "Bullish trend", "confidence": 0.85}');
```

#### TIMESTAMP WITH TIME ZONE
```sql
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

**Why:**
- Stores timezone information
- Converts to user's timezone automatically
- Best practice for timestamps

---

### 5. Triggers and Functions (Advanced - Optional)

**What they do:**
- Automatically run code when something happens
- Example: Auto-create profile when user signs up

**Example from the plan:**
```sql
-- Function that runs automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, 'user_' || substr(NEW.id::text, 1, 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger that calls the function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**What to understand:**
- `TRIGGER` - runs automatically
- `AFTER INSERT` - runs after data is inserted
- `NEW` - the new row being inserted
- `$$` - dollar quoting (way to write multi-line strings in SQL)

**You can copy-paste these** - they're boilerplate for common tasks.

---

## What You'll Actually Write

### In Supabase Dashboard (SQL Editor)
You'll copy-paste the SQL from the plan:
- CREATE TABLE statements
- RLS policies
- Triggers and functions

**You don't need to write complex SQL** - the plan provides it.

### In Your TypeScript Code
You'll use Supabase client (not raw SQL):

```typescript
// ✅ This is what you'll write
const { data, error } = await supabase
  .from('watchlists')
  .select('*, watchlist_items(*)')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

// ❌ You won't write raw SQL like this:
// SELECT * FROM watchlists WHERE user_id = ...
```

**Supabase client methods:**
- `.from('table')` - select table
- `.select('columns')` - choose columns
- `.insert({})` - create row
- `.update({})` - modify row
- `.delete()` - remove row
- `.eq('column', value)` - filter (WHERE)
- `.order('column')` - sort results

---

## Learning Path

### If You're New to SQL

**Week 1: Basics**
1. Learn SELECT, INSERT, UPDATE, DELETE
2. Understand WHERE clause
3. Learn about JOINs (LEFT JOIN, INNER JOIN)

**Resources:**
- [SQLBolt](https://sqlbolt.com/) - Interactive SQL tutorial
- [W3Schools SQL Tutorial](https://www.w3schools.com/sql/) - Comprehensive guide
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/) - PostgreSQL-specific

**Week 2: Relationships**
1. Understand foreign keys
2. Learn about one-to-many relationships
3. Practice JOINs

**Week 3: Supabase-Specific**
1. Row Level Security (RLS)
2. Supabase client library
3. How to use Supabase in Next.js

### If You Know Basic SQL

**You're ready!** Just learn:
1. Supabase RLS policies (30 minutes)
2. Supabase TypeScript client (1-2 hours)
3. PostgreSQL UUID and JSONB (optional, 30 minutes)

---

## Common Patterns in This Project

### Pattern 1: User-Owned Data
```sql
-- Every table has user_id
CREATE TABLE watchlists (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),  -- Links to user
  ...
);
```

### Pattern 2: RLS Policy Template
```sql
-- Copy this pattern for every table
CREATE POLICY "Users can view own [table_name]"
  ON public.[table_name] FOR SELECT
  USING (auth.uid() = user_id);
```

### Pattern 3: Timestamps
```sql
-- Every table has these
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
```

### Pattern 4: Junction Table (Many-to-Many)
```sql
-- Links two tables together
CREATE TABLE watchlist_items (
  id UUID PRIMARY KEY,
  watchlist_id UUID REFERENCES watchlists(id),
  symbol TEXT NOT NULL,
  UNIQUE(watchlist_id, symbol)  -- Prevent duplicates
);
```

---

## What Supabase Handles For You

✅ **You don't need to worry about:**
- Database server setup
- Connection pooling
- Query optimization (mostly)
- Backup and recovery
- Scaling
- Security patches
- SSL/TLS certificates

✅ **Supabase provides:**
- Web dashboard (SQL Editor)
- Auto-generated TypeScript types
- Real-time subscriptions
- Built-in authentication
- Automatic backups
- Performance monitoring

---

## Quick Reference: SQL → Supabase Client

| SQL | Supabase Client |
|-----|----------------|
| `SELECT * FROM table WHERE id = 'x'` | `.from('table').select('*').eq('id', 'x')` |
| `INSERT INTO table (col) VALUES ('val')` | `.from('table').insert({col: 'val'})` |
| `UPDATE table SET col = 'val' WHERE id = 'x'` | `.from('table').update({col: 'val'}).eq('id', 'x')` |
| `DELETE FROM table WHERE id = 'x'` | `.from('table').delete().eq('id', 'x')` |
| `SELECT * FROM table ORDER BY created_at DESC` | `.from('table').select('*').order('created_at', {ascending: false})` |
| `SELECT * FROM a JOIN b ON a.id = b.a_id` | `.from('a').select('*, b(*)')` |

---

## Troubleshooting

### "Permission denied" Error
**Problem:** RLS policy blocking access
**Solution:** Check RLS policies, ensure `auth.uid() = user_id` matches

### "Foreign key violation" Error
**Problem:** Trying to reference non-existent record
**Solution:** Ensure referenced record exists first

### "Duplicate key" Error
**Problem:** Trying to insert duplicate unique value
**Solution:** Check UNIQUE constraints, handle duplicates in code

### Slow Queries
**Problem:** Missing indexes
**Solution:** Add indexes on frequently queried columns (plan includes these)

---

## Recommended Learning Order

1. **Day 1:** SQL basics (SELECT, INSERT, UPDATE, DELETE)
2. **Day 2:** Relationships (foreign keys, JOINs)
3. **Day 3:** Supabase client library (TypeScript)
4. **Day 4:** RLS policies (copy from plan)
5. **Day 5:** Start implementing (you'll learn as you go!)

---

## Bottom Line

**You can start with minimal SQL knowledge:**
- Copy-paste SQL from the plan
- Understand basic concepts (tables, columns, relationships)
- Learn Supabase client library (easier than raw SQL)
- Learn as you implement

**The plan provides all SQL you need** - you mainly need to:
1. Understand what it does (not memorize it)
2. Know how to modify it for your needs
3. Use Supabase client in your TypeScript code

**Most of your work will be TypeScript, not SQL!**

---

## Resources

### SQL Learning
- [SQLBolt](https://sqlbolt.com/) - Interactive, beginner-friendly
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/) - PostgreSQL-specific
- [W3Schools SQL](https://www.w3schools.com/sql/) - Comprehensive reference

### Supabase Learning
- [Supabase Docs](https://supabase.com/docs) - Official documentation
- [Supabase Next.js Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs) - Next.js integration
- [Supabase YouTube Channel](https://www.youtube.com/c/supabase) - Video tutorials

### PostgreSQL Reference
- [PostgreSQL Data Types](https://www.postgresql.org/docs/current/datatype.html)
- [PostgreSQL Functions](https://www.postgresql.org/docs/current/functions.html)

---

**Remember:** You're not building a database from scratch - you're using Supabase which handles the hard parts. Focus on understanding the concepts, not memorizing syntax!

