# Postman Tests for Alerts API

## 🔐 Authentication Setup

Use the same authentication method as watchlists and portfolios:

1. **Get your Supabase access token** (see `POSTMAN_AUTH_SETUP.md` or previous test guides)
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

## 1. GET /api/alerts

**Purpose:** Get all alerts for the authenticated user

**Method:** `GET`

**URL:** `http://localhost:3000/api/alerts`

**Headers:**

```
Authorization: Bearer <your-token>
```

**Expected Response (200 OK):**

```json
[
  {
    "id": "alert-uuid-1",
    "user_id": "user-uuid",
    "symbol": "AAPL",
    "alert_type": "price_above",
    "threshold": 150.0,
    "is_active": true,
    "triggered_at": null,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  {
    "id": "alert-uuid-2",
    "user_id": "user-uuid",
    "symbol": "GOOGL",
    "alert_type": "price_below",
    "threshold": 2400.0,
    "is_active": true,
    "triggered_at": "2024-01-15T10:30:00Z",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

**Test Cases:**

- ✅ Should return empty array `[]` if no alerts exist
- ✅ Should return only user's own alerts
- ✅ Should return alerts ordered by `created_at` (newest first)
- ✅ Should return 401 if not authenticated

---

## 2. POST /api/alerts

**Purpose:** Create a new alert

**Method:** `POST`

**URL:** `http://localhost:3000/api/alerts`

**Headers:**

```
Authorization: Bearer <your-token>
Content-Type: application/json
```

### Test Case 2.1: Create Price Above Alert

**Request Body:**

```json
{
  "symbol": "AAPL",
  "alert_type": "price_above",
  "threshold": 150.0
}
```

**Expected Response (201 Created):**

```json
{
  "id": "new-alert-uuid",
  "user_id": "user-uuid",
  "symbol": "AAPL",
  "alert_type": "price_above",
  "threshold": 150.0,
  "is_active": true,
  "triggered_at": null,
  "created_at": "2024-01-03T00:00:00Z",
  "updated_at": "2024-01-03T00:00:00Z"
}
```

**Notes:**

- Symbol is automatically normalized to uppercase
- `is_active` defaults to `true` if not provided

---

### Test Case 2.2: Create Price Below Alert

**Request Body:**

```json
{
  "symbol": "GOOGL",
  "alert_type": "price_below",
  "threshold": 2400.0,
  "is_active": true
}
```

**Expected Response (201 Created):**

```json
{
  "id": "new-alert-uuid-2",
  "user_id": "user-uuid",
  "symbol": "GOOGL",
  "alert_type": "price_below",
  "threshold": 2400.0,
  "is_active": true,
  "triggered_at": null,
  "created_at": "2024-01-03T00:00:00Z",
  "updated_at": "2024-01-03T00:00:00Z"
}
```

---

### Test Case 2.3: Create Price Change Percent Alert

**Request Body:**

```json
{
  "symbol": "MSFT",
  "alert_type": "price_change_percent",
  "threshold": 5.0
}
```

**Expected Response (201 Created):**

```json
{
  "id": "new-alert-uuid-3",
  "user_id": "user-uuid",
  "symbol": "MSFT",
  "alert_type": "price_change_percent",
  "threshold": 5.0,
  "is_active": true,
  "triggered_at": null,
  "created_at": "2024-01-03T00:00:00Z",
  "updated_at": "2024-01-03T00:00:00Z"
}
```

**Notes:**

- Threshold for `price_change_percent` must be between -100 and 100

---

### Test Case 2.4: Create Volume Spike Alert

**Request Body:**

```json
{
  "symbol": "TSLA",
  "alert_type": "volume_spike",
  "threshold": 1000000.0,
  "is_active": false
}
```

**Expected Response (201 Created):**

```json
{
  "id": "new-alert-uuid-4",
  "user_id": "user-uuid",
  "symbol": "TSLA",
  "alert_type": "volume_spike",
  "threshold": 1000000.0,
  "is_active": false,
  "triggered_at": null,
  "created_at": "2024-01-03T00:00:00Z",
  "updated_at": "2024-01-03T00:00:00Z"
}
```

---

### Test Case 2.5: Error - Missing Symbol

**Request Body:**

```json
{
  "alert_type": "price_above",
  "threshold": 150.0
}
```

**Expected Response (400 Bad Request):**

```json
{
  "error": "Symbol is required"
}
```

---

### Test Case 2.6: Error - Invalid Alert Type

**Request Body:**

```json
{
  "symbol": "AAPL",
  "alert_type": "invalid_type",
  "threshold": 150.0
}
```

**Expected Response (400 Bad Request):**

```json
{
  "error": "Invalid alert_type. Must be one of: price_above, price_below, price_change_percent, volume_spike"
}
```

---

### Test Case 2.7: Error - Invalid Threshold (Negative)

**Request Body:**

```json
{
  "symbol": "AAPL",
  "alert_type": "price_above",
  "threshold": -10.0
}
```

**Expected Response (400 Bad Request):**

```json
{
  "error": "Threshold must be a positive number"
}
```

---

### Test Case 2.8: Error - Invalid Price Change Percent (Too High)

**Request Body:**

```json
{
  "symbol": "AAPL",
  "alert_type": "price_change_percent",
  "threshold": 150.0
}
```

**Expected Response (400 Bad Request):**

```json
{
  "error": "Price change percent threshold must be between -100 and 100"
}
```

---

### Test Case 2.9: Error - Invalid Price Change Percent (Too Low)

**Request Body:**

```json
{
  "symbol": "AAPL",
  "alert_type": "price_change_percent",
  "threshold": -150.0
}
```

**Expected Response (400 Bad Request):**

```json
{
  "error": "Price change percent threshold must be between -100 and 100"
}
```

---

### Test Case 2.10: Error - Unauthorized

**Request Body:**

```json
{
  "symbol": "AAPL",
  "alert_type": "price_above",
  "threshold": 150.0
}
```

**Headers:**

```
(No Authorization header)
```

**Expected Response (401 Unauthorized):**

```json
{
  "error": "Unauthorized"
}
```

---

## 3. GET /api/alerts/[id]

**Purpose:** Get a specific alert by ID

**Method:** `GET`

**URL:** `http://localhost:3000/api/alerts/<alert-id>`

**Example URL:** `http://localhost:3000/api/alerts/123e4567-e89b-12d3-a456-426614174000`

**Headers:**

```
Authorization: Bearer <your-token>
```

**Expected Response (200 OK):**

```json
{
  "id": "alert-uuid",
  "user_id": "user-uuid",
  "symbol": "AAPL",
  "alert_type": "price_above",
  "threshold": 150.0,
  "is_active": true,
  "triggered_at": null,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Test Cases:**

- ✅ Should return alert if it belongs to user
- ✅ Should return 404 if alert doesn't exist
- ✅ Should return 404 if alert belongs to another user
- ✅ Should return 401 if not authenticated

**Steps:**

1. Create an alert using POST /api/alerts (save the `id` from response)
2. Use that `id` in GET /api/alerts/[id]
3. Try with a non-existent ID to test 404
4. Try without authentication to test 401

---

## 4. PUT /api/alerts/[id]

**Purpose:** Update an alert (enable/disable, change threshold, etc.)

**Method:** `PUT`

**URL:** `http://localhost:3000/api/alerts/<alert-id>`

**Example URL:** `http://localhost:3000/api/alerts/123e4567-e89b-12d3-a456-426614174000`

**Headers:**

```
Authorization: Bearer <your-token>
Content-Type: application/json
```

### Test Case 4.1: Disable Alert

**Request Body:**

```json
{
  "is_active": false
}
```

**Expected Response (200 OK):**

```json
{
  "id": "alert-uuid",
  "user_id": "user-uuid",
  "symbol": "AAPL",
  "alert_type": "price_above",
  "threshold": 150.0,
  "is_active": false,
  "triggered_at": null,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-03T01:00:00Z"
}
```

**Notes:**

- `updated_at` should be automatically updated

---

### Test Case 4.2: Update Threshold

**Request Body:**

```json
{
  "threshold": 155.0
}
```

**Expected Response (200 OK):**

```json
{
  "id": "alert-uuid",
  "user_id": "user-uuid",
  "symbol": "AAPL",
  "alert_type": "price_above",
  "threshold": 155.0,
  "is_active": true,
  "triggered_at": null,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-03T02:00:00Z"
}
```

---

### Test Case 4.3: Update Multiple Fields

**Request Body:**

```json
{
  "threshold": 160.0,
  "is_active": true
}
```

**Expected Response (200 OK):**

```json
{
  "id": "alert-uuid",
  "user_id": "user-uuid",
  "symbol": "AAPL",
  "alert_type": "price_above",
  "threshold": 160.0,
  "is_active": true,
  "triggered_at": null,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-03T03:00:00Z"
}
```

---

### Test Case 4.4: Update Symbol

**Request Body:**

```json
{
  "symbol": "GOOGL"
}
```

**Expected Response (200 OK):**

```json
{
  "id": "alert-uuid",
  "user_id": "user-uuid",
  "symbol": "GOOGL",
  "alert_type": "price_above",
  "threshold": 150.0,
  "is_active": true,
  "triggered_at": null,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-03T04:00:00Z"
}
```

**Notes:**

- Symbol is automatically normalized to uppercase

---

### Test Case 4.5: Update Alert Type

**Request Body:**

```json
{
  "alert_type": "price_below"
}
```

**Expected Response (200 OK):**

```json
{
  "id": "alert-uuid",
  "user_id": "user-uuid",
  "symbol": "AAPL",
  "alert_type": "price_below",
  "threshold": 150.0,
  "is_active": true,
  "triggered_at": null,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-03T05:00:00Z"
}
```

---

### Test Case 4.6: Set Triggered At (Mark as Triggered)

**Request Body:**

```json
{
  "triggered_at": "2024-01-15T10:30:00Z"
}
```

**Expected Response (200 OK):**

```json
{
  "id": "alert-uuid",
  "user_id": "user-uuid",
  "symbol": "AAPL",
  "alert_type": "price_above",
  "threshold": 150.0,
  "is_active": true,
  "triggered_at": "2024-01-15T10:30:00Z",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-03T06:00:00Z"
}
```

---

### Test Case 4.7: Clear Triggered At (Reset Alert)

**Request Body:**

```json
{
  "triggered_at": null
}
```

**Expected Response (200 OK):**

```json
{
  "id": "alert-uuid",
  "user_id": "user-uuid",
  "symbol": "AAPL",
  "alert_type": "price_above",
  "threshold": 150.0,
  "is_active": true,
  "triggered_at": null,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-03T07:00:00Z"
}
```

---

### Test Case 4.8: Error - No Fields to Update

**Request Body:**

```json
{}
```

**Expected Response (400 Bad Request):**

```json
{
  "error": "No fields to update"
}
```

---

### Test Case 4.9: Error - Invalid Alert Type

**Request Body:**

```json
{
  "alert_type": "invalid_type"
}
```

**Expected Response (400 Bad Request):**

```json
{
  "error": "Invalid alert_type. Must be one of: price_above, price_below, price_change_percent, volume_spike"
}
```

---

### Test Case 4.10: Error - Invalid Threshold

**Request Body:**

```json
{
  "threshold": -10.0
}
```

**Expected Response (400 Bad Request):**

```json
{
  "error": "Threshold must be a positive number"
}
```

---

### Test Case 4.11: Error - Alert Not Found

**Request Body:**

```json
{
  "is_active": false
}
```

**URL:** `http://localhost:3000/api/alerts/00000000-0000-0000-0000-000000000000`

**Expected Response (404 Not Found):**

```json
{
  "error": "Alert not found"
}
```

---

### Test Case 4.12: Error - Unauthorized

**Request Body:**

```json
{
  "is_active": false
}
```

**Headers:**

```
(No Authorization header)
```

**Expected Response (401 Unauthorized):**

```json
{
  "error": "Unauthorized"
}
```

---

## 5. DELETE /api/alerts/[id]

**Purpose:** Delete an alert

**Method:** `DELETE`

**URL:** `http://localhost:3000/api/alerts/<alert-id>`

**Example URL:** `http://localhost:3000/api/alerts/123e4567-e89b-12d3-a456-426614174000`

**Headers:**

```
Authorization: Bearer <your-token>
```

**Expected Response (204 No Content):**

```
(Empty response body)
```

**Test Cases:**

- ✅ Should delete alert if it belongs to user
- ✅ Should return 404 if alert doesn't exist
- ✅ Should return 404 if alert belongs to another user
- ✅ Should return 401 if not authenticated

**Steps:**

1. Create an alert using POST /api/alerts (save the `id`)
2. Delete it using DELETE /api/alerts/[id]
3. Verify it's deleted by trying GET /api/alerts/[id] (should return 404)
4. Try deleting a non-existent alert to test 404
5. Try without authentication to test 401

---

## 📝 Step-by-Step Test Flow

### Complete Flow: Create, Update, and Delete Alert

1. **Get all alerts (should be empty initially):**

   ```
   GET /api/alerts
   ```

   Expected: `[]`

2. **Create a price above alert:**

   ```
   POST /api/alerts
   Body: {
     "symbol": "AAPL",
     "alert_type": "price_above",
     "threshold": 150.0
   }
   ```

   Save the `id` from the response.

3. **Verify alert was created:**

   ```
   GET /api/alerts
   ```

   Should see the new alert in the array.

4. **Get the specific alert:**

   ```
   GET /api/alerts/<saved-id>
   ```

   Should return the alert details.

5. **Update the alert threshold:**

   ```
   PUT /api/alerts/<saved-id>
   Body: {
     "threshold": 155.0
   }
   ```

   Should return updated alert with new threshold.

6. **Disable the alert:**

   ```
   PUT /api/alerts/<saved-id>
   Body: {
     "is_active": false
   }
   ```

   Should return alert with `is_active: false`.

7. **Re-enable the alert:**

   ```
   PUT /api/alerts/<saved-id>
   Body: {
     "is_active": true
   }
   ```

   Should return alert with `is_active: true`.

8. **Delete the alert:**

   ```
   DELETE /api/alerts/<saved-id>
   ```

   Should return 204 No Content.

9. **Verify alert was deleted:**

   ```
   GET /api/alerts/<saved-id>
   ```

   Should return 404 Not Found.

10. **Get all alerts (should be empty again):**
    ```
    GET /api/alerts
    ```
    Expected: `[]`

---

## 🧪 Testing Different Alert Types

### Test All Alert Types

1. **Price Above:**

   ```json
   {
     "symbol": "AAPL",
     "alert_type": "price_above",
     "threshold": 150.0
   }
   ```

2. **Price Below:**

   ```json
   {
     "symbol": "GOOGL",
     "alert_type": "price_below",
     "threshold": 2400.0
   }
   ```

3. **Price Change Percent:**

   ```json
   {
     "symbol": "MSFT",
     "alert_type": "price_change_percent",
     "threshold": 5.0
   }
   ```

4. **Volume Spike:**
   ```json
   {
     "symbol": "TSLA",
     "alert_type": "volume_spike",
     "threshold": 1000000.0
   }
   ```

---

## ⚠️ Common Issues

### Issue: 401 Unauthorized

**Solution:** Make sure you have a valid Bearer token in the Authorization header.

### Issue: 404 Not Found

**Solution:**

- Check that the alert ID is correct
- Verify the alert belongs to your user account
- Make sure the alert exists (check with GET /api/alerts first)

### Issue: 400 Bad Request

**Solution:**

- Check that all required fields are provided
- Verify `alert_type` is one of the valid types
- Ensure `threshold` is a positive number
- For `price_change_percent`, ensure threshold is between -100 and 100

### Issue: Symbol Not Normalized

**Note:** The API automatically normalizes symbols to uppercase. If you send `"symbol": "aapl"`, it will be stored as `"AAPL"`.

---

## 📊 Postman Collection JSON

You can import this into Postman:

```json
{
  "info": {
    "name": "Alerts API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get All Alerts",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{access_token}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/alerts",
          "host": ["{{base_url}}"],
          "path": ["api", "alerts"]
        }
      }
    },
    {
      "name": "Create Alert - Price Above",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{access_token}}",
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
          "raw": "{\n  \"symbol\": \"AAPL\",\n  \"alert_type\": \"price_above\",\n  \"threshold\": 150.0\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/alerts",
          "host": ["{{base_url}}"],
          "path": ["api", "alerts"]
        }
      }
    },
    {
      "name": "Get Alert by ID",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{access_token}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/alerts/{{alert_id}}",
          "host": ["{{base_url}}"],
          "path": ["api", "alerts", "{{alert_id}}"]
        }
      }
    },
    {
      "name": "Update Alert",
      "request": {
        "method": "PUT",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{access_token}}",
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
          "raw": "{\n  \"is_active\": false\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/alerts/{{alert_id}}",
          "host": ["{{base_url}}"],
          "path": ["api", "alerts", "{{alert_id}}"]
        }
      }
    },
    {
      "name": "Delete Alert",
      "request": {
        "method": "DELETE",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{access_token}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/alerts/{{alert_id}}",
          "host": ["{{base_url}}"],
          "path": ["api", "alerts", "{{alert_id}}"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000"
    },
    {
      "key": "access_token",
      "value": "your-supabase-access-token-here"
    },
    {
      "key": "alert_id",
      "value": "alert-uuid-here"
    }
  ]
}
```

**To use this collection:**

1. Import it into Postman
2. Set the `base_url` variable to `http://localhost:3000`
3. Set the `access_token` variable to your Supabase access token
4. After creating an alert, copy its `id` and set it as the `alert_id` variable

---

## ✅ Checklist

- [ ] GET /api/alerts returns empty array when no alerts exist
- [ ] POST /api/alerts creates price_above alert
- [ ] POST /api/alerts creates price_below alert
- [ ] POST /api/alerts creates price_change_percent alert
- [ ] POST /api/alerts creates volume_spike alert
- [ ] POST /api/alerts returns 400 for missing symbol
- [ ] POST /api/alerts returns 400 for invalid alert_type
- [ ] POST /api/alerts returns 400 for invalid threshold
- [ ] GET /api/alerts/[id] returns alert details
- [ ] GET /api/alerts/[id] returns 404 for non-existent alert
- [ ] PUT /api/alerts/[id] updates is_active
- [ ] PUT /api/alerts/[id] updates threshold
- [ ] PUT /api/alerts/[id] updates multiple fields
- [ ] PUT /api/alerts/[id] sets triggered_at
- [ ] PUT /api/alerts/[id] clears triggered_at (null)
- [ ] DELETE /api/alerts/[id] deletes alert
- [ ] DELETE /api/alerts/[id] returns 404 for non-existent alert
- [ ] All endpoints return 401 when not authenticated

---

Happy testing! 🚀
