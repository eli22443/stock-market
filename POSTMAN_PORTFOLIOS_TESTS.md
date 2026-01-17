# Postman Tests for Portfolios API

## 🔐 Authentication Setup

Use the same authentication method as watchlists:

1. **Get your Supabase access token** (see `POSTMAN_AUTH_SETUP.md` or previous watchlist tests)
2. **Add to Postman:** `Authorization: Bearer <your-token>`

---

## 📋 Postman Collection

### Base URL
```
http://localhost:3000
```

### Headers (Add to all requests)
```
Authorization: Bearer <your-supabase-access-token>
Content-Type: application/json
```

---

## 1. GET /api/portfolios

**Purpose:** Get all portfolios for the authenticated user

**Method:** `GET`

**URL:** `http://localhost:3000/api/portfolios`

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
    "name": "Retirement Portfolio",
    "description": "Long-term investments",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  {
    "id": "uuid-here-2",
    "user_id": "user-uuid",
    "name": "Trading Account",
    "description": "Short-term trades",
    "created_at": "2024-01-02T00:00:00Z",
    "updated_at": "2024-01-02T00:00:00Z"
  }
]
```

**Test Cases:**
- ✅ Should return empty array if no portfolios exist
- ✅ Should return only user's own portfolios
- ✅ Should return 401 if not authenticated

---

## 2. POST /api/portfolios

**Purpose:** Create a new portfolio

**Method:** `POST`

**URL:** `http://localhost:3000/api/portfolios`

**Headers:**
```
Authorization: Bearer <your-token>
Content-Type: application/json
```

**Request Body (With Description):**
```json
{
  "name": "Retirement Portfolio",
  "description": "Long-term investments"
}
```

**Request Body (Minimal - only name):**
```json
{
  "name": "Trading Account"
}
```

**Expected Response (201 Created):**
```json
{
  "id": "new-uuid",
  "user_id": "user-uuid",
  "name": "Retirement Portfolio",
  "description": "Long-term investments",
  "created_at": "2024-01-03T00:00:00Z",
  "updated_at": "2024-01-03T00:00:00Z"
}
```

**Test Cases:**
- ✅ Should create portfolio with all fields
- ✅ Should create portfolio with only name
- ✅ Should return 400 if name is missing
- ✅ Should return 400 if name is empty string
- ✅ Should return 401 if not authenticated

---

## 3. GET /api/portfolios/[id]

**Purpose:** Get a specific portfolio with holdings and calculated values

**Method:** `GET`

**URL:** `http://localhost:3000/api/portfolios/<portfolio-id>`

**Example:** `http://localhost:3000/api/portfolios/123e4567-e89b-12d3-a456-426614174000`

**Headers:**
```
Authorization: Bearer <your-token>
```

**Expected Response (200 OK):**
```json
{
  "id": "uuid-here",
  "user_id": "user-uuid",
  "name": "Retirement Portfolio",
  "description": "Long-term investments",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "holdings": [
    {
      "id": "holding-uuid-1",
      "portfolio_id": "uuid-here",
      "symbol": "AAPL",
      "shares": 10.5,
      "avg_price": 150.0,
      "purchased_at": "2024-01-01T00:00:00Z",
      "notes": "Bought after earnings",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "current_price": 155.25,
      "current_value": 1630.13,
      "cost_basis": 1575.0,
      "gain_loss": 55.13,
      "gain_loss_percent": 3.5
    }
  ],
  "total_value": 1630.13,
  "total_cost_basis": 1575.0,
  "total_gain_loss": 55.13,
  "total_gain_loss_percent": 3.5
}
```

**Test Cases:**
- ✅ Should return portfolio with holdings and calculations
- ✅ Should return empty holdings array if no holdings
- ✅ Should calculate gain/loss correctly
- ✅ Should return 404 if portfolio doesn't exist
- ✅ Should return 404 if portfolio belongs to another user
- ✅ Should return 401 if not authenticated

---

## 4. PUT /api/portfolios/[id]

**Purpose:** Update portfolio name/description

**Method:** `PUT`

**URL:** `http://localhost:3000/api/portfolios/<portfolio-id>`

**Example:** `http://localhost:3000/api/portfolios/123e4567-e89b-12d3-a456-426614174000`

**Headers:**
```
Authorization: Bearer <your-token>
Content-Type: application/json
```

**Request Body (Update Name):**
```json
{
  "name": "Updated Portfolio Name"
}
```

**Request Body (Update Description):**
```json
{
  "description": "Updated description"
}
```

**Request Body (Update All):**
```json
{
  "name": "New Name",
  "description": "New description"
}
```

**Expected Response (200 OK):**
```json
{
  "id": "uuid-here",
  "user_id": "user-uuid",
  "name": "Updated Portfolio Name",
  "description": "Updated description",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-03T00:00:00Z"
}
```

**Test Cases:**
- ✅ Should update name only
- ✅ Should update description only
- ✅ Should update multiple fields at once
- ✅ Should return 400 if name is empty string
- ✅ Should return 404 if portfolio doesn't exist
- ✅ Should return 404 if portfolio belongs to another user
- ✅ Should return 401 if not authenticated

---

## 5. DELETE /api/portfolios/[id]

**Purpose:** Delete a portfolio (cascades to holdings)

**Method:** `DELETE`

**URL:** `http://localhost:3000/api/portfolios/<portfolio-id>`

**Example:** `http://localhost:3000/api/portfolios/123e4567-e89b-12d3-a456-426614174000`

**Headers:**
```
Authorization: Bearer <your-token>
```

**Expected Response (204 No Content):**
- No body, just status 204

**Test Cases:**
- ✅ Should delete portfolio and all its holdings
- ✅ Should return 404 if portfolio doesn't exist
- ✅ Should return 404 if portfolio belongs to another user
- ✅ Should return 401 if not authenticated

---

## 6. GET /api/portfolios/[id]/holdings

**Purpose:** Get all holdings in a portfolio

**Method:** `GET`

**URL:** `http://localhost:3000/api/portfolios/<portfolio-id>/holdings`

**Example:** `http://localhost:3000/api/portfolios/123e4567-e89b-12d3-a456-426614174000/holdings`

**Headers:**
```
Authorization: Bearer <your-token>
```

**Expected Response (200 OK):**
```json
[
  {
    "id": "holding-uuid-1",
    "portfolio_id": "uuid-here",
    "symbol": "AAPL",
    "shares": 10.5,
    "avg_price": 150.0,
    "purchased_at": "2024-01-01T00:00:00Z",
    "notes": "Bought after earnings",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  {
    "id": "holding-uuid-2",
    "portfolio_id": "uuid-here",
    "symbol": "GOOGL",
    "shares": 5.0,
    "avg_price": 2500.0,
    "purchased_at": "2024-01-15T00:00:00Z",
    "notes": null,
    "created_at": "2024-01-15T00:00:00Z",
    "updated_at": "2024-01-15T00:00:00Z"
  }
]
```

**Test Cases:**
- ✅ Should return all holdings in portfolio
- ✅ Should return empty array if no holdings
- ✅ Should return 404 if portfolio doesn't exist
- ✅ Should return 404 if portfolio belongs to another user
- ✅ Should return 401 if not authenticated

---

## 7. POST /api/portfolios/[id]/holdings

**Purpose:** Add a holding to a portfolio

**Method:** `POST`

**URL:** `http://localhost:3000/api/portfolios/<portfolio-id>/holdings`

**Example:** `http://localhost:3000/api/portfolios/123e4567-e89b-12d3-a456-426614174000/holdings`

**Headers:**
```
Authorization: Bearer <your-token>
Content-Type: application/json
```

**Request Body (With Notes):**
```json
{
  "symbol": "AAPL",
  "shares": 10.5,
  "avg_price": 150.0,
  "purchased_at": "2024-01-15T00:00:00Z",
  "notes": "Bought after earnings"
}
```

**Request Body (Without Notes):**
```json
{
  "symbol": "MSFT",
  "shares": 5.0,
  "avg_price": 380.5,
  "purchased_at": "2024-01-15T00:00:00Z"
}
```

**Request Body (Lowercase Symbol - will be normalized):**
```json
{
  "symbol": "aapl",
  "shares": 10.5,
  "avg_price": 150.0,
  "purchased_at": "2024-01-15T00:00:00Z",
  "notes": "Will be converted to AAPL"
}
```

**Expected Response (201 Created):**
```json
{
  "id": "new-holding-uuid",
  "portfolio_id": "uuid-here",
  "symbol": "AAPL",
  "shares": 10.5,
  "avg_price": 150.0,
  "purchased_at": "2024-01-15T00:00:00Z",
  "notes": "Bought after earnings",
  "created_at": "2024-01-15T00:00:00Z",
  "updated_at": "2024-01-15T00:00:00Z"
}
```

**Test Cases:**
- ✅ Should add holding with all fields
- ✅ Should add holding without notes
- ✅ Should normalize symbol to uppercase
- ✅ Should return 400 if symbol is missing
- ✅ Should return 400 if symbol is empty
- ✅ Should return 400 if shares is missing or <= 0
- ✅ Should return 400 if avg_price is missing or <= 0
- ✅ Should return 400 if purchased_at is missing
- ✅ Should return 404 if portfolio doesn't exist
- ✅ Should return 404 if portfolio belongs to another user
- ✅ Should return 401 if not authenticated

---

## 8. PUT /api/portfolios/[id]/holdings

**Purpose:** Update a holding (e.g., add more shares, update average price)

**Method:** `PUT`

**URL:** `http://localhost:3000/api/portfolios/<portfolio-id>/holdings`

**Example:** `http://localhost:3000/api/portfolios/123e4567-e89b-12d3-a456-426614174000/holdings`

**Headers:**
```
Authorization: Bearer <your-token>
Content-Type: application/json
```

**Request Body (Update Shares):**
```json
{
  "holding_id": "holding-uuid-1",
  "shares": 15.0
}
```

**Request Body (Update Average Price):**
```json
{
  "holding_id": "holding-uuid-1",
  "avg_price": 152.0
}
```

**Request Body (Update All - Add More Shares):**
```json
{
  "holding_id": "holding-uuid-1",
  "shares": 15.0,
  "avg_price": 152.0,
  "notes": "Added more shares"
}
```

**Expected Response (200 OK):**
```json
{
  "id": "holding-uuid-1",
  "portfolio_id": "uuid-here",
  "symbol": "AAPL",
  "shares": 15.0,
  "avg_price": 152.0,
  "purchased_at": "2024-01-01T00:00:00Z",
  "notes": "Added more shares",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-15T00:00:00Z"
}
```

**Test Cases:**
- ✅ Should update shares only
- ✅ Should update avg_price only
- ✅ Should update notes only
- ✅ Should update multiple fields at once
- ✅ Should return 400 if holding_id is missing
- ✅ Should return 400 if shares is <= 0 (when provided)
- ✅ Should return 400 if avg_price is <= 0 (when provided)
- ✅ Should return 404 if portfolio doesn't exist
- ✅ Should return 404 if holding doesn't exist
- ✅ Should return 404 if holding belongs to different portfolio
- ✅ Should return 401 if not authenticated

---

## 9. DELETE /api/portfolios/[id]/holdings

**Purpose:** Remove a holding from portfolio

**Method:** `DELETE`

**URL:** `http://localhost:3000/api/portfolios/<portfolio-id>/holdings`

**Example:** `http://localhost:3000/api/portfolios/123e4567-e89b-12d3-a456-426614174000/holdings`

**Headers:**
```
Authorization: Bearer <your-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "holding_id": "holding-uuid-1"
}
```

**Expected Response (204 No Content):**
- No body, just status 204

**Test Cases:**
- ✅ Should remove holding from portfolio
- ✅ Should return 400 if holding_id is missing
- ✅ Should return 404 if portfolio doesn't exist
- ✅ Should return 404 if holding doesn't exist
- ✅ Should return 404 if holding belongs to different portfolio
- ✅ Should return 401 if not authenticated

---

## 🧪 Complete Test Flow

### Step-by-Step Testing Sequence

1. **Create First Portfolio**
   ```
   POST /api/portfolios
   Body: { "name": "Retirement Portfolio", "description": "Long-term investments" }
   ```
   - Save the `id` from response → `portfolio-id-1`

2. **Create Second Portfolio**
   ```
   POST /api/portfolios
   Body: { "name": "Trading Account" }
   ```
   - Save the `id` from response → `portfolio-id-2`

3. **Get All Portfolios**
   ```
   GET /api/portfolios
   ```
   - Should see both portfolios

4. **Get Specific Portfolio**
   ```
   GET /api/portfolios/{portfolio-id-1}
   ```
   - Should return portfolio with empty `holdings` array
   - Should have `total_value: 0`, `total_cost_basis: 0`, etc.

5. **Add Holdings to First Portfolio**
   ```
   POST /api/portfolios/{portfolio-id-1}/holdings
   Body: {
     "symbol": "AAPL",
     "shares": 10.5,
     "avg_price": 150.0,
     "purchased_at": "2024-01-15T00:00:00Z",
     "notes": "Bought after earnings"
   }
   ```
   ```
   POST /api/portfolios/{portfolio-id-1}/holdings
   Body: {
     "symbol": "GOOGL",
     "shares": 5.0,
     "avg_price": 2500.0,
     "purchased_at": "2024-01-15T00:00:00Z"
   }
   ```
   ```
   POST /api/portfolios/{portfolio-id-1}/holdings
   Body: {
     "symbol": "MSFT",
     "shares": 3.0,
     "avg_price": 380.5,
     "purchased_at": "2024-01-15T00:00:00Z",
     "notes": "Microsoft"
   }
   ```

6. **Get Portfolio with Holdings and Calculations**
   ```
   GET /api/portfolios/{portfolio-id-1}
   ```
   - Should return portfolio with 3 holdings
   - Each holding should have:
     - `current_price` (from Yahoo Finance)
     - `current_value` (shares × current_price)
     - `cost_basis` (shares × avg_price)
     - `gain_loss` (current_value - cost_basis)
     - `gain_loss_percent` ((gain_loss / cost_basis) × 100)
   - Portfolio should have totals:
     - `total_value` (sum of all current_values)
     - `total_cost_basis` (sum of all cost_bases)
     - `total_gain_loss` (total_value - total_cost_basis)
     - `total_gain_loss_percent` ((total_gain_loss / total_cost_basis) × 100)

7. **Get Holdings Only**
   ```
   GET /api/portfolios/{portfolio-id-1}/holdings
   ```
   - Should return array of 3 holdings

8. **Update Holding (Add More Shares)**
   ```
   PUT /api/portfolios/{portfolio-id-1}/holdings
   Body: {
     "holding_id": "{holding-id-from-step-5}",
     "shares": 15.0,
     "avg_price": 152.0,
     "notes": "Added more shares"
   }
   ```
   - Holding should be updated with new shares and average price

9. **Update Portfolio**
   ```
   PUT /api/portfolios/{portfolio-id-1}
   Body: { "name": "Updated Retirement Portfolio", "description": "Updated description" }
   ```

10. **Remove Holding**
    ```
    DELETE /api/portfolios/{portfolio-id-1}/holdings
    Body: { "holding_id": "{holding-id}" }
    ```

11. **Delete Portfolio**
    ```
    DELETE /api/portfolios/{portfolio-id-1}
    ```
    - Should delete portfolio and all remaining holdings

12. **Verify Deletion**
    ```
    GET /api/portfolios
    ```
    - Should only return second portfolio

---

## 📝 Postman Collection JSON

You can import this into Postman:

```json
{
  "info": {
    "name": "Portfolios API",
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
      "key": "portfolio_id",
      "value": "",
      "type": "string"
    },
    {
      "key": "holding_id",
      "value": "",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "1. Get All Portfolios",
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
          "raw": "{{base_url}}/api/portfolios",
          "host": ["{{base_url}}"],
          "path": ["api", "portfolios"]
        }
      }
    },
    {
      "name": "2. Create Portfolio",
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
          "raw": "{\n  \"name\": \"Retirement Portfolio\",\n  \"description\": \"Long-term investments\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/portfolios",
          "host": ["{{base_url}}"],
          "path": ["api", "portfolios"]
        }
      }
    },
    {
      "name": "3. Get Portfolio by ID",
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
          "raw": "{{base_url}}/api/portfolios/{{portfolio_id}}",
          "host": ["{{base_url}}"],
          "path": ["api", "portfolios", "{{portfolio_id}}"]
        }
      }
    },
    {
      "name": "4. Update Portfolio",
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
          "raw": "{\n  \"name\": \"Updated Portfolio Name\",\n  \"description\": \"Updated description\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/portfolios/{{portfolio_id}}",
          "host": ["{{base_url}}"],
          "path": ["api", "portfolios", "{{portfolio_id}}"]
        }
      }
    },
    {
      "name": "5. Delete Portfolio",
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
          "raw": "{{base_url}}/api/portfolios/{{portfolio_id}}",
          "host": ["{{base_url}}"],
          "path": ["api", "portfolios", "{{portfolio_id}}"]
        }
      }
    },
    {
      "name": "6. Get Portfolio Holdings",
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
          "raw": "{{base_url}}/api/portfolios/{{portfolio_id}}/holdings",
          "host": ["{{base_url}}"],
          "path": ["api", "portfolios", "{{portfolio_id}}", "holdings"]
        }
      }
    },
    {
      "name": "7. Add Holding to Portfolio",
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
          "raw": "{\n  \"symbol\": \"AAPL\",\n  \"shares\": 10.5,\n  \"avg_price\": 150.0,\n  \"purchased_at\": \"2024-01-15T00:00:00Z\",\n  \"notes\": \"Bought after earnings\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/portfolios/{{portfolio_id}}/holdings",
          "host": ["{{base_url}}"],
          "path": ["api", "portfolios", "{{portfolio_id}}", "holdings"]
        }
      }
    },
    {
      "name": "8. Update Holding",
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
          "raw": "{\n  \"holding_id\": \"{{holding_id}}\",\n  \"shares\": 15.0,\n  \"avg_price\": 152.0,\n  \"notes\": \"Added more shares\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/portfolios/{{portfolio_id}}/holdings",
          "host": ["{{base_url}}"],
          "path": ["api", "portfolios", "{{portfolio_id}}", "holdings"]
        }
      }
    },
    {
      "name": "9. Remove Holding from Portfolio",
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
          "raw": "{\n  \"holding_id\": \"{{holding_id}}\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/portfolios/{{portfolio_id}}/holdings",
          "host": ["{{base_url}}"],
          "path": ["api", "portfolios", "{{portfolio_id}}", "holdings"]
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
- Make sure the portfolio/holding ID exists
- Make sure the portfolio/holding belongs to your user
- Check that you're using the correct UUID format

### 400 Bad Request
- Check that required fields are present:
  - Portfolio: `name` is required
  - Holding: `symbol`, `shares`, `avg_price`, `purchased_at` are required
- Check that numeric values are positive:
  - `shares` must be > 0
  - `avg_price` must be > 0
- Check date format: `purchased_at` should be ISO 8601 format (e.g., `2024-01-15T00:00:00Z`)

### Slow Response on GET /api/portfolios/[id]
- This endpoint fetches current prices from Yahoo Finance for each holding
- If you have many holdings, it may take a few seconds
- This is expected behavior

### Price Calculation Errors
- If a stock symbol doesn't exist or Yahoo Finance fails, that holding will have `null` values for price calculations
- The portfolio totals will still be calculated correctly for holdings with valid prices

---

## 📊 Expected Status Codes Summary

| Endpoint | Method | Success | Error (Auth) | Error (Not Found) | Error (Bad Request) |
|----------|--------|---------|--------------|-------------------|---------------------|
| `/api/portfolios` | GET | 200 | 401 | - | - |
| `/api/portfolios` | POST | 201 | 401 | - | 400 |
| `/api/portfolios/[id]` | GET | 200 | 401 | 404 | - |
| `/api/portfolios/[id]` | PUT | 200 | 401 | 404 | 400 |
| `/api/portfolios/[id]` | DELETE | 204 | 401 | 404 | - |
| `/api/portfolios/[id]/holdings` | GET | 200 | 401 | 404 | - |
| `/api/portfolios/[id]/holdings` | POST | 201 | 401 | 404 | 400 |
| `/api/portfolios/[id]/holdings` | PUT | 200 | 401 | 404 | 400 |
| `/api/portfolios/[id]/holdings` | DELETE | 204 | 401 | 404 | 400 |

---

## 💡 Tips for Testing

1. **Start with empty portfolio:** Create a portfolio first, then add holdings
2. **Test calculations:** Add a holding with known values and verify gain/loss calculations
3. **Test edge cases:** Try updating shares to 0 (should fail), negative numbers (should fail)
4. **Test date format:** Use ISO 8601 format for `purchased_at` (e.g., `2024-01-15T00:00:00Z`)
5. **Save IDs:** After creating portfolios/holdings, save their IDs in Postman variables for easy testing

---

## 🧮 Example Calculation Verification

**Test Case:**
- Symbol: AAPL
- Shares: 10.5
- Avg Price: $150.00
- Current Price (from Yahoo): $155.25

**Expected Calculations:**
- `cost_basis` = 10.5 × 150.00 = $1,575.00
- `current_value` = 10.5 × 155.25 = $1,630.13
- `gain_loss` = 1,630.13 - 1,575.00 = $55.13
- `gain_loss_percent` = (55.13 / 1,575.00) × 100 = 3.5%

Verify these match the API response!

