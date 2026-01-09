# Postman Tests for Watchlists API

## 🔐 Authentication Setup

Before testing, you need to get your Supabase session token:

### Option 1: Get Token from Browser (Recommended)

1. Log in to your app in the browser
2. Open DevTools (F12) → Application/Storage → Cookies
3. Find the cookie: `sb-<project-ref>-auth-token`
4. Copy the value (it's a JWT token)
5. Use it as a Bearer token in Postman

### Option 2: Get Token from Supabase Dashboard

1. Go to Supabase Dashboard → Authentication → Users
2. Create a test user or use existing
3. Copy the access token from the user details

### Option 3: Use Supabase Auth API

```http
POST https://<your-project>.supabase.co/auth/v1/token?grant_type=password
Content-Type: application/json

{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

Use the `access_token` from the response.

---

## 📋 Postman Collection

### Base URL

```
http://localhost:3000
```

(Or your production URL)

### Headers (Add to all requests)

```
Authorization: Bearer <your-supabase-access-token>
Content-Type: application/json
```

---

## 1. GET /api/watchlists

**Purpose:** Get all watchlists for the authenticated user

**Method:** `GET`

**URL:** `http://localhost:3000/api/watchlists`

**Headers:**

```
Authorization: Bearer <your-token>
```

**Expected Response (200 OK):**

```json
[
  {
    "id": "uuid-here",
    "user_id": "user-uuid",
    "name": "Tech Stocks",
    "description": "My favorite tech companies",
    "is_default": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

**Test Cases:**

- ✅ Should return empty array if no watchlists exist
- ✅ Should return only user's own watchlists
- ✅ Should return 401 if not authenticated

---

## 2. POST /api/watchlists

**Purpose:** Create a new watchlist

**Method:** `POST`

**URL:** `http://localhost:3000/api/watchlists`

**Headers:**

```
Authorization: Bearer <your-token>
Content-Type: application/json
```

**Request Body (Basic):**

```json
{
  "name": "Tech Stocks",
  "description": "My favorite tech companies",
  "is_default": false
}
```

**Request Body (Set as Default):**

```json
{
  "name": "My Default Watchlist",
  "description": "Main watchlist",
  "is_default": true
}
```

**Request Body (Minimal - only name):**

```json
{
  "name": "Simple Watchlist"
}
```

**Expected Response (201 Created):**

```json
{
  "id": "new-uuid",
  "user_id": "user-uuid",
  "name": "Tech Stocks",
  "description": "My favorite tech companies",
  "is_default": false,
  "created_at": "2024-01-03T00:00:00Z",
  "updated_at": "2024-01-03T00:00:00Z"
}
```

**Test Cases:**

- ✅ Should create watchlist with all fields
- ✅ Should create watchlist with only name
- ✅ Should set as default and unset other defaults
- ✅ Should return 400 if name is missing
- ✅ Should return 400 if name is empty string
- ✅ Should return 401 if not authenticated

---

## 3. GET /api/watchlists/[id]

**Purpose:** Get a specific watchlist with its items

**Method:** `GET`

**URL:** `http://localhost:3000/api/watchlists/<watchlist-id>`

**Example:** `http://localhost:3000/api/watchlists/123e4567-e89b-12d3-a456-426614174000`

**Headers:**

```
Authorization: Bearer <your-token>
```

**Expected Response (200 OK):**

```json
{
  "id": "uuid-here",
  "user_id": "user-uuid",
  "name": "Tech Stocks",
  "description": "My favorite tech companies",
  "is_default": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "items": [
    {
      "id": "item-uuid-1",
      "watchlist_id": "uuid-here",
      "symbol": "AAPL",
      "added_at": "2024-01-01T00:00:00Z",
      "notes": "Watching for earnings"
    },
    {
      "id": "item-uuid-2",
      "watchlist_id": "uuid-here",
      "symbol": "GOOGL",
      "added_at": "2024-01-01T01:00:00Z",
      "notes": null
    }
  ]
}
```

**Test Cases:**

- ✅ Should return watchlist with items
- ✅ Should return empty items array if no items
- ✅ Should return 404 if watchlist doesn't exist
- ✅ Should return 404 if watchlist belongs to another user
- ✅ Should return 401 if not authenticated

---

## 4. PUT /api/watchlists/[id]

**Purpose:** Update watchlist name/description/default status

**Method:** `PUT`

**URL:** `http://localhost:3000/api/watchlists/<watchlist-id>`

**Example:** `http://localhost:3000/api/watchlists/123e4567-e89b-12d3-a456-426614174000`

**Headers:**

```
Authorization: Bearer <your-token>
Content-Type: application/json
```

**Request Body (Update Name):**

```json
{
  "name": "Updated Tech Stocks"
}
```

**Request Body (Update Description):**

```json
{
  "description": "Updated description"
}
```

**Request Body (Set as Default):**

```json
{
  "is_default": true
}
```

**Request Body (Update All):**

```json
{
  "name": "New Name",
  "description": "New description",
  "is_default": false
}
```

**Expected Response (200 OK):**

```json
{
  "id": "uuid-here",
  "user_id": "user-uuid",
  "name": "Updated Tech Stocks",
  "description": "Updated description",
  "is_default": false,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-03T00:00:00Z"
}
```

**Test Cases:**

- ✅ Should update name only
- ✅ Should update description only
- ✅ Should update is_default and unset other defaults
- ✅ Should update multiple fields at once
- ✅ Should return 400 if name is empty string
- ✅ Should return 404 if watchlist doesn't exist
- ✅ Should return 404 if watchlist belongs to another user
- ✅ Should return 401 if not authenticated

---

## 5. DELETE /api/watchlists/[id]

**Purpose:** Delete a watchlist (items cascade delete)

**Method:** `DELETE`

**URL:** `http://localhost:3000/api/watchlists/<watchlist-id>`

**Example:** `http://localhost:3000/api/watchlists/123e4567-e89b-12d3-a456-426614174000`

**Headers:**

```
Authorization: Bearer <your-token>
```

**Expected Response (204 No Content):**

- No body, just status 204

**Test Cases:**

- ✅ Should delete watchlist and all its items
- ✅ Should return 404 if watchlist doesn't exist
- ✅ Should return 404 if watchlist belongs to another user
- ✅ Should return 401 if not authenticated

---

## 6. GET /api/watchlists/[id]/items

**Purpose:** Get all items in a watchlist

**Method:** `GET`

**URL:** `http://localhost:3000/api/watchlists/<watchlist-id>/items`

**Example:** `http://localhost:3000/api/watchlists/123e4567-e89b-12d3-a456-426614174000/items`

**Headers:**

```
Authorization: Bearer <your-token>
```

**Expected Response (200 OK):**

```json
[
  {
    "id": "item-uuid-1",
    "watchlist_id": "uuid-here",
    "symbol": "AAPL",
    "added_at": "2024-01-01T00:00:00Z",
    "notes": "Watching for earnings"
  },
  {
    "id": "item-uuid-2",
    "watchlist_id": "uuid-here",
    "symbol": "GOOGL",
    "added_at": "2024-01-01T01:00:00Z",
    "notes": null
  }
]
```

**Test Cases:**

- ✅ Should return all items in watchlist
- ✅ Should return empty array if no items
- ✅ Should return 404 if watchlist doesn't exist
- ✅ Should return 404 if watchlist belongs to another user
- ✅ Should return 401 if not authenticated

---

## 7. POST /api/watchlists/[id]/items

**Purpose:** Add a stock to a watchlist

**Method:** `POST`

**URL:** `http://localhost:3000/api/watchlists/<watchlist-id>/items`

**Example:** `http://localhost:3000/api/watchlists/123e4567-e89b-12d3-a456-426614174000/items`

**Headers:**

```
Authorization: Bearer <your-token>
Content-Type: application/json
```

**Request Body (With Notes):**

```json
{
  "symbol": "MSFT",
  "notes": "Potential buy"
}
```

**Request Body (Without Notes):**

```json
{
  "symbol": "TSLA"
}
```

**Request Body (Lowercase Symbol - will be normalized):**

```json
{
  "symbol": "aapl",
  "notes": "Will be converted to AAPL"
}
```

**Expected Response (201 Created):**

```json
{
  "id": "new-item-uuid",
  "watchlist_id": "uuid-here",
  "symbol": "MSFT",
  "added_at": "2024-01-03T00:00:00Z",
  "notes": "Potential buy"
}
```

**Test Cases:**

- ✅ Should add stock with notes
- ✅ Should add stock without notes
- ✅ Should normalize symbol to uppercase
- ✅ Should return 400 if symbol is missing
- ✅ Should return 400 if symbol is empty
- ✅ Should return 400 if stock already exists in watchlist
- ✅ Should return 404 if watchlist doesn't exist
- ✅ Should return 404 if watchlist belongs to another user
- ✅ Should return 401 if not authenticated

---

## 8. DELETE /api/watchlists/[id]/items

**Purpose:** Remove a stock from a watchlist

**Method:** `DELETE`

**URL:** `http://localhost:3000/api/watchlists/<watchlist-id>/items`

**Example:** `http://localhost:3000/api/watchlists/123e4567-e89b-12d3-a456-426614174000/items`

**Headers:**

```
Authorization: Bearer <your-token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "symbol": "MSFT"
}
```

**Request Body (Lowercase - will be normalized):**

```json
{
  "symbol": "aapl"
}
```

**Expected Response (204 No Content):**

- No body, just status 204

**Test Cases:**

- ✅ Should remove stock from watchlist
- ✅ Should normalize symbol to uppercase
- ✅ Should return 400 if symbol is missing
- ✅ Should return 400 if symbol is empty
- ✅ Should return 404 if watchlist doesn't exist
- ✅ Should return 404 if watchlist belongs to another user
- ✅ Should return 401 if not authenticated
- ⚠️ Note: Deleting a non-existent symbol still returns 204 (idempotent)

---

## 🧪 Complete Test Flow

### Step-by-Step Testing Sequence

1. **Create First Watchlist**

   ```
   POST /api/watchlists
   Body: { "name": "Test Watchlist 1", "is_default": true }
   ```

   - Save the `id` from response → `watchlist-id-1`

2. **Create Second Watchlist**

   ```
   POST /api/watchlists
   Body: { "name": "Test Watchlist 2", "is_default": false }
   ```

   - Save the `id` from response → `watchlist-id-2`

3. **Get All Watchlists**

   ```
   GET /api/watchlists
   ```

   - Should see both watchlists
   - First one should have `is_default: true`

4. **Get Specific Watchlist**

   ```
   GET /api/watchlists/{watchlist-id-1}
   ```

   - Should return watchlist with empty `items` array

5. **Add Items to First Watchlist**

   ```
   POST /api/watchlists/{watchlist-id-1}/items
   Body: { "symbol": "AAPL", "notes": "Apple Inc" }
   ```

   ```
   POST /api/watchlists/{watchlist-id-1}/items
   Body: { "symbol": "GOOGL" }
   ```

   ```
   POST /api/watchlists/{watchlist-id-1}/items
   Body: { "symbol": "MSFT", "notes": "Microsoft" }
   ```

6. **Get Watchlist with Items**

   ```
   GET /api/watchlists/{watchlist-id-1}
   ```

   - Should return watchlist with 3 items

7. **Get Items Only**

   ```
   GET /api/watchlists/{watchlist-id-1}/items
   ```

   - Should return array of 3 items

8. **Try to Add Duplicate**

   ```
   POST /api/watchlists/{watchlist-id-1}/items
   Body: { "symbol": "AAPL" }
   ```

   - Should return 400 error

9. **Update Watchlist**

   ```
   PUT /api/watchlists/{watchlist-id-1}
   Body: { "name": "Updated Name", "description": "New description" }
   ```

10. **Set Second Watchlist as Default**

    ```
    PUT /api/watchlists/{watchlist-id-2}
    Body: { "is_default": true }
    ```

    - First watchlist should no longer be default

11. **Remove Item**

    ```
    DELETE /api/watchlists/{watchlist-id-1}/items
    Body: { "symbol": "MSFT" }
    ```

12. **Delete Watchlist**

    ```
    DELETE /api/watchlists/{watchlist-id-1}
    ```

    - Should delete watchlist and all remaining items

13. **Verify Deletion**
    ```
    GET /api/watchlists
    ```
    - Should only return second watchlist

---

## 📝 Postman Collection JSON

You can import this into Postman:

```json
{
  "info": {
    "name": "Watchlists API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000",
      "type": "string"
    },
    {
      "key": "auth_token",
      "value": "YOUR_SUPABASE_TOKEN_HERE",
      "type": "string"
    },
    {
      "key": "watchlist_id",
      "value": "",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "1. Get All Watchlists",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{auth_token}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/watchlists",
          "host": ["{{base_url}}"],
          "path": ["api", "watchlists"]
        }
      }
    },
    {
      "name": "2. Create Watchlist",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{auth_token}}",
            "type": "text"
          },
          {
            "key": "Content-Type",
            "value": "application/json",
            "type": "text"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"Tech Stocks\",\n  \"description\": \"My favorite tech companies\",\n  \"is_default\": false\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/watchlists",
          "host": ["{{base_url}}"],
          "path": ["api", "watchlists"]
        }
      }
    },
    {
      "name": "3. Get Watchlist by ID",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{auth_token}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/watchlists/{{watchlist_id}}",
          "host": ["{{base_url}}"],
          "path": ["api", "watchlists", "{{watchlist_id}}"]
        }
      }
    },
    {
      "name": "4. Update Watchlist",
      "request": {
        "method": "PUT",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{auth_token}}",
            "type": "text"
          },
          {
            "key": "Content-Type",
            "value": "application/json",
            "type": "text"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"Updated Name\",\n  \"description\": \"Updated description\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/watchlists/{{watchlist_id}}",
          "host": ["{{base_url}}"],
          "path": ["api", "watchlists", "{{watchlist_id}}"]
        }
      }
    },
    {
      "name": "5. Delete Watchlist",
      "request": {
        "method": "DELETE",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{auth_token}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/watchlists/{{watchlist_id}}",
          "host": ["{{base_url}}"],
          "path": ["api", "watchlists", "{{watchlist_id}}"]
        }
      }
    },
    {
      "name": "6. Get Watchlist Items",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{auth_token}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/watchlists/{{watchlist_id}}/items",
          "host": ["{{base_url}}"],
          "path": ["api", "watchlists", "{{watchlist_id}}", "items"]
        }
      }
    },
    {
      "name": "7. Add Item to Watchlist",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{auth_token}}",
            "type": "text"
          },
          {
            "key": "Content-Type",
            "value": "application/json",
            "type": "text"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"symbol\": \"AAPL\",\n  \"notes\": \"Watching for earnings\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/watchlists/{{watchlist_id}}/items",
          "host": ["{{base_url}}"],
          "path": ["api", "watchlists", "{{watchlist_id}}", "items"]
        }
      }
    },
    {
      "name": "8. Remove Item from Watchlist",
      "request": {
        "method": "DELETE",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{auth_token}}",
            "type": "text"
          },
          {
            "key": "Content-Type",
            "value": "application/json",
            "type": "text"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"symbol\": \"AAPL\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/watchlists/{{watchlist_id}}/items",
          "host": ["{{base_url}}"],
          "path": ["api", "watchlists", "{{watchlist_id}}", "items"]
        }
      }
    }
  ]
}
```

---

## 🚀 Quick Start

1. **Copy the Postman Collection JSON above**
2. **Import into Postman:** File → Import → Paste JSON
3. **Set Variables:**
   - `base_url`: `http://localhost:3000`
   - `auth_token`: Your Supabase access token
4. **Run the test sequence above**

---

## ⚠️ Common Issues

### 401 Unauthorized

- Make sure you're using a valid Supabase access token
- Token might have expired (Supabase tokens expire after 1 hour)
- Check that the token is in the format: `Bearer <token>`

### 404 Not Found

- Make sure the watchlist ID exists
- Make sure the watchlist belongs to your user
- Check that you're using the correct UUID format

### 400 Bad Request

- Check that required fields are present
- Check that field types are correct (name must be string, etc.)
- For duplicate items, the stock already exists in the watchlist

### CORS Issues

- If testing from a different origin, make sure CORS is configured in Next.js
- For local testing, this shouldn't be an issue

---

## 📊 Expected Status Codes Summary

| Endpoint                     | Method | Success | Error (Auth) | Error (Not Found) | Error (Bad Request) |
| ---------------------------- | ------ | ------- | ------------ | ----------------- | ------------------- |
| `/api/watchlists`            | GET    | 200     | 401          | -                 | -                   |
| `/api/watchlists`            | POST   | 201     | 401          | -                 | 400                 |
| `/api/watchlists/[id]`       | GET    | 200     | 401          | 404               | -                   |
| `/api/watchlists/[id]`       | PUT    | 200     | 401          | 404               | 400                 |
| `/api/watchlists/[id]`       | DELETE | 204     | 401          | 404               | -                   |
| `/api/watchlists/[id]/items` | GET    | 200     | 401          | 404               | -                   |
| `/api/watchlists/[id]/items` | POST   | 201     | 401          | 404               | 400                 |
| `/api/watchlists/[id]/items` | DELETE | 204     | 401          | 404               | 400                 |
