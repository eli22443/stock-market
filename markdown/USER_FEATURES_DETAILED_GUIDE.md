# User Features: Watchlists, Portfolios & Alerts - Detailed Guide

## 📋 Table of Contents

1. [Watchlists Feature](#1-watchlists-feature)
2. [Portfolios Feature](#2-portfolios-feature)
3. [Alerts Feature](#3-alerts-feature)
4. [Implementation Roadmap](#implementation-roadmap)

---

## 1. Watchlists Feature

### 🎯 What It Does

**Watchlists** allow users to save and organize stocks they want to monitor. Think of it like a "favorites" list for stocks.

**Key Features:**

- Create multiple watchlists (e.g., "Tech Stocks", "Dividend Stocks", "Crypto")
- Add/remove stocks from watchlists
- Set a default watchlist for quick access
- View all stocks in a watchlist with real-time prices
- Add notes to individual stocks in a watchlist

### 📊 Database Structure

```sql
-- Watchlists table
watchlists:
  - id (UUID, Primary Key)
  - user_id (UUID, Foreign Key → profiles.id)
  - name (TEXT, e.g., "My Tech Stocks")
  - description (TEXT, optional)
  - is_default (BOOLEAN, one default per user)
  - created_at, updated_at (Timestamps)

-- Watchlist items table
watchlist_items:
  - id (UUID, Primary Key)
  - watchlist_id (UUID, Foreign Key → watchlists.id)
  - symbol (TEXT, e.g., "AAPL")
  - added_at (Timestamp)
  - notes (TEXT, optional user notes)
  - UNIQUE(watchlist_id, symbol) -- Can't add same stock twice
```

### 🔌 API Endpoints

#### `GET /api/watchlists`

**Purpose:** Fetch all watchlists for the current user

**Response:**

```json
[
  {
    "id": "uuid-here",
    "name": "Tech Stocks",
    "description": "My favorite tech companies",
    "is_default": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  {
    "id": "uuid-here-2",
    "name": "Dividend Stocks",
    "description": null,
    "is_default": false,
    "created_at": "2024-01-02T00:00:00Z",
    "updated_at": "2024-01-02T00:00:00Z"
  }
]
```

#### `POST /api/watchlists`

**Purpose:** Create a new watchlist

**Request Body:**

```json
{
  "name": "Crypto Watchlist",
  "description": "Cryptocurrency stocks",
  "is_default": false
}
```

**Response:**

```json
{
  "id": "new-uuid",
  "name": "Crypto Watchlist",
  "description": "Cryptocurrency stocks",
  "is_default": false,
  "created_at": "2024-01-03T00:00:00Z",
  "updated_at": "2024-01-03T00:00:00Z"
}
```

#### `GET /api/watchlists/[id]`

**Purpose:** Get a specific watchlist with its items

**Response:**

```json
{
  "id": "uuid-here",
  "name": "Tech Stocks",
  "description": "My favorite tech companies",
  "is_default": true,
  "items": [
    {
      "id": "item-uuid-1",
      "symbol": "AAPL",
      "added_at": "2024-01-01T00:00:00Z",
      "notes": "Watching for earnings"
    },
    {
      "id": "item-uuid-2",
      "symbol": "GOOGL",
      "added_at": "2024-01-01T01:00:00Z",
      "notes": null
    }
  ],
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### `PUT /api/watchlists/[id]`

**Purpose:** Update watchlist name/description

**Request Body:**

```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

#### `DELETE /api/watchlists/[id]`

**Purpose:** Delete a watchlist (cascades to items)

**Response:** `204 No Content`

#### `GET /api/watchlists/[id]/items`

**Purpose:** Get all items in a watchlist

**Response:**

```json
[
  {
    "id": "item-uuid-1",
    "symbol": "AAPL",
    "added_at": "2024-01-01T00:00:00Z",
    "notes": "Watching for earnings"
  },
  {
    "id": "item-uuid-2",
    "symbol": "GOOGL",
    "added_at": "2024-01-01T01:00:00Z",
    "notes": null
  }
]
```

#### `POST /api/watchlists/[id]/items`

**Purpose:** Add a stock to a watchlist

**Request Body:**

```json
{
  "symbol": "MSFT",
  "notes": "Potential buy"
}
```

**Response:**

```json
{
  "id": "new-item-uuid",
  "symbol": "MSFT",
  "added_at": "2024-01-03T00:00:00Z",
  "notes": "Potential buy"
}
```

#### `DELETE /api/watchlists/[id]/items`

**Purpose:** Remove a stock from a watchlist

**Request Body:**

```json
{
  "symbol": "MSFT"
}
```

**Response:** `204 No Content`

### 🎨 UI Components

#### `WatchlistList.tsx`

**Purpose:** Display all user's watchlists

**Features:**

- List of watchlists with name, description, item count
- "Create New Watchlist" button
- Click to view/edit watchlist
- Delete watchlist option
- Mark as default option

**UI Flow:**

```
/watchlist page
  └─ WatchlistList
      ├─ "My Tech Stocks" (5 items) [View] [Delete]
      ├─ "Dividend Stocks" (3 items) [View] [Delete] [Set Default]
      └─ [+ Create New Watchlist]
```

#### `WatchlistView.tsx`

**Purpose:** Display stocks in a specific watchlist

**Features:**

- Show watchlist name and description
- List of stocks with:
  - Symbol (e.g., "AAPL")
  - Current price (from Yahoo Finance API)
  - Price change %
  - Notes (if any)
  - Remove button
- "Add Stock" button/dialog
- Real-time price updates (optional, via WebSocket)

**UI Flow:**

```
/watchlist/[id] or /watchlist?watchlist=uuid
  └─ WatchlistView
      ├─ Header: "Tech Stocks" [Edit] [Delete]
      ├─ Stock Cards:
      │   ├─ AAPL | $150.25 | +2.5% | [Remove] | Notes: "Watching for earnings"
      │   ├─ GOOGL | $2,500.00 | -1.2% | [Remove]
      │   └─ MSFT | $380.50 | +0.5% | [Remove]
      └─ [+ Add Stock]
```

#### `AddToWatchlist.tsx`

**Purpose:** Quick-add stock to watchlist (used throughout app)

**Features:**

- Button/dialog on stock cards/pages
- Dropdown to select watchlist
- "Add to Default" quick action
- Input for optional notes

**UI Flow:**

```
Stock Card (anywhere in app)
  └─ [Add to Watchlist] button
      └─ Dialog:
          ├─ Select Watchlist: [Dropdown]
          ├─ Notes: [Text Input]
          └─ [Add] [Cancel]
```

### 🔄 User Flow Examples

#### Flow 1: Create Watchlist & Add Stocks

```
1. User goes to /watchlist
2. Clicks "Create New Watchlist"
3. Enters name: "Tech Stocks", description: "FAANG companies"
4. Clicks "Create"
5. Redirects to watchlist view
6. Clicks "Add Stock"
7. Enters symbol: "AAPL", notes: "Apple Inc"
8. Clicks "Add"
9. Stock appears in watchlist with current price
```

#### Flow 2: Quick Add from Stock Page

```
1. User views stock page: /quote/AAPL
2. Clicks "Add to Watchlist" button
3. Dialog shows watchlists dropdown
4. Selects "Tech Stocks" (or clicks "Add to Default")
5. Optionally adds notes
6. Clicks "Add"
7. Stock added to watchlist
8. Success message shown
```

---

## 2. Portfolios Feature

### 🎯 What It Does

**Portfolios** allow users to track their actual stock investments - what they own, how many shares, purchase price, etc. This is for tracking real investments, not just watching.

**Key Features:**

- Create multiple portfolios (e.g., "Retirement", "Trading Account", "Long-term")
- Add holdings (stocks you own) with:
  - Number of shares
  - Average purchase price
  - Purchase date
  - Optional notes
- View portfolio performance:
  - Total value
  - Total gain/loss
  - Gain/loss percentage
  - Per-holding breakdown
- Edit/remove holdings

### 📊 Database Structure

```sql
-- Portfolios table
portfolios:
  - id (UUID, Primary Key)
  - user_id (UUID, Foreign Key → profiles.id)
  - name (TEXT, e.g., "Retirement Portfolio")
  - description (TEXT, optional)
  - created_at, updated_at (Timestamps)

-- Holdings table (stocks owned)
holdings:
  - id (UUID, Primary Key)
  - portfolio_id (UUID, Foreign Key → portfolios.id)
  - symbol (TEXT, e.g., "AAPL")
  - shares (DECIMAL, e.g., 10.5 shares)
  - avg_price (DECIMAL, e.g., $150.00 per share)
  - purchased_at (Timestamp, when bought)
  - notes (TEXT, optional)
  - created_at, updated_at (Timestamps)
```

### 🔌 API Endpoints

#### `GET /api/portfolios`

**Purpose:** Fetch all portfolios for the current user

**Response:**

```json
[
  {
    "id": "uuid-here",
    "name": "Retirement Portfolio",
    "description": "Long-term investments",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

#### `POST /api/portfolios`

**Purpose:** Create a new portfolio

**Request Body:**

```json
{
  "name": "Trading Account",
  "description": "Short-term trades"
}
```

#### `GET /api/portfolios/[id]`

**Purpose:** Get portfolio with holdings and calculated values

**Response:**

```json
{
  "id": "uuid-here",
  "name": "Retirement Portfolio",
  "description": "Long-term investments",
  "holdings": [
    {
      "id": "holding-uuid-1",
      "symbol": "AAPL",
      "shares": 10.5,
      "avg_price": 150.0,
      "purchased_at": "2024-01-01T00:00:00Z",
      "notes": "Bought after earnings",
      "current_price": 155.25, // From Yahoo Finance API
      "current_value": 1630.13, // shares * current_price
      "cost_basis": 1575.0, // shares * avg_price
      "gain_loss": 55.13, // current_value - cost_basis
      "gain_loss_percent": 3.5 // (gain_loss / cost_basis) * 100
    }
  ],
  "total_value": 1630.13, // Sum of all holdings current_value
  "total_cost_basis": 1575.0, // Sum of all holdings cost_basis
  "total_gain_loss": 55.13, // total_value - total_cost_basis
  "total_gain_loss_percent": 3.5 // (total_gain_loss / total_cost_basis) * 100
}
```

#### `PUT /api/portfolios/[id]`

**Purpose:** Update portfolio name/description

#### `DELETE /api/portfolios/[id]`

**Purpose:** Delete portfolio (cascades to holdings)

#### `GET /api/portfolios/[id]/holdings`

**Purpose:** Get all holdings in a portfolio

**Response:**

```json
[
  {
    "id": "holding-uuid-1",
    "symbol": "AAPL",
    "shares": 10.5,
    "avg_price": 150.0,
    "purchased_at": "2024-01-01T00:00:00Z",
    "notes": "Bought after earnings"
  }
]
```

#### `POST /api/portfolios/[id]/holdings`

**Purpose:** Add a holding to a portfolio

**Request Body:**

```json
{
  "symbol": "MSFT",
  "shares": 5.0,
  "avg_price": 380.5,
  "purchased_at": "2024-01-15T00:00:00Z",
  "notes": "Bought on dip"
}
```

#### `PUT /api/portfolios/[id]/holdings`

**Purpose:** Update a holding (e.g., add more shares, update price)

**Request Body:**

```json
{
  "holding_id": "holding-uuid-1",
  "shares": 15.0, // Updated from 10.5
  "avg_price": 152.0, // Updated average
  "notes": "Added more shares"
}
```

#### `DELETE /api/portfolios/[id]/holdings`

**Purpose:** Remove a holding from portfolio

**Request Body:**

```json
{
  "holding_id": "holding-uuid-1"
}
```

### 🎨 UI Components

#### `PortfolioList.tsx`

**Purpose:** Display all user's portfolios

**Features:**

- List of portfolios with:
  - Name, description
  - Total value
  - Total gain/loss (with color coding)
  - Number of holdings
- "Create New Portfolio" button
- Click to view portfolio

**UI Flow:**

```
/portfolio page
  └─ PortfolioList
      ├─ "Retirement Portfolio"
      │   Total: $10,000 | Gain: +$500 (+5.0%) | 5 holdings [View]
      ├─ "Trading Account"
      │   Total: $5,000 | Loss: -$200 (-3.8%) | 3 holdings [View]
      └─ [+ Create New Portfolio]
```

#### `PortfolioView.tsx`

**Purpose:** Display portfolio with holdings and performance

**Features:**

- Portfolio header:
  - Name, description
  - Total value (large, prominent)
  - Total gain/loss (color-coded: green for gain, red for loss)
  - Gain/loss percentage
- Holdings table/list:
  - Symbol
  - Shares
  - Avg Price
  - Current Price (from API)
  - Current Value
  - Gain/Loss (per holding)
  - Gain/Loss %
  - Actions: [Edit] [Remove]
- "Add Holding" button

**UI Flow:**

```
/portfolio/[id]
  └─ PortfolioView
      ├─ Header:
      │   "Retirement Portfolio"
      │   Total Value: $10,000.00
      │   Gain/Loss: +$500.00 (+5.0%) [green]
      ├─ Holdings Table:
      │   Symbol | Shares | Avg Price | Current | Value | Gain/Loss | Actions
      │   AAPL   | 10.5   | $150.00   | $155.25 | $1,630| +$55 (+3.5%) | [Edit] [Remove]
      │   GOOGL  | 5.0    | $2,500.00 | $2,450  | $12,250| -$250 (-2.0%) | [Edit] [Remove]
      └─ [+ Add Holding]
```

#### `AddHoldingForm.tsx`

**Purpose:** Form to add/edit a holding

**Features:**

- Symbol input (with autocomplete/validation)
- Shares input (decimal, e.g., 10.5)
- Average Price input (decimal, e.g., $150.00)
- Purchase Date picker
- Notes textarea
- Validation:
  - Shares > 0
  - Price > 0
  - Symbol exists (validate against Yahoo Finance)

**UI Flow:**

```
[Add Holding] button click
  └─ Dialog/Modal:
      ├─ Symbol: [AAPL] [Validate]
      ├─ Shares: [10.5]
      ├─ Average Price: [$150.00]
      ├─ Purchase Date: [2024-01-15]
      ├─ Notes: [Textarea]
      └─ [Add] [Cancel]
```

### 🔄 User Flow Examples

#### Flow 1: Create Portfolio & Add Holdings

```
1. User goes to /portfolio
2. Clicks "Create New Portfolio"
3. Enters name: "Retirement Portfolio", description: "Long-term"
4. Clicks "Create"
5. Redirects to portfolio view
6. Clicks "Add Holding"
7. Fills form:
   - Symbol: "AAPL"
   - Shares: 10.5
   - Avg Price: $150.00
   - Purchase Date: 2024-01-15
   - Notes: "Bought after earnings"
8. Clicks "Add"
9. Holding appears with current price and gain/loss calculated
```

#### Flow 2: Update Holding (Add More Shares)

```
1. User views portfolio
2. Clicks "Edit" on AAPL holding
3. Updates shares from 10.5 to 15.0
4. Updates avg_price to $152.00 (new average)
5. Clicks "Save"
6. Holding updated with new values
7. Portfolio totals recalculated
```

---

## 3. Alerts Feature

### 🎯 What It Does

**Alerts** notify users when stocks meet certain conditions (price thresholds, volume spikes, etc.). Users can set alerts and get notified when they trigger.

**Key Features:**

- Create alerts for specific stocks
- Alert types:
  - **Price Above**: Alert when price goes above threshold
  - **Price Below**: Alert when price goes below threshold
  - **Price Change %**: Alert when price changes by X%
  - **Volume Spike**: Alert when volume exceeds threshold
- Enable/disable alerts
- View triggered alerts
- Delete alerts

### 📊 Database Structure

```sql
-- Alerts table
alerts:
  - id (UUID, Primary Key)
  - user_id (UUID, Foreign Key → profiles.id)
  - symbol (TEXT, e.g., "AAPL")
  - alert_type (TEXT, one of: 'price_above', 'price_below', 'price_change_percent', 'volume_spike')
  - threshold (DECIMAL, e.g., 150.00 for price, 5.0 for percentage)
  - is_active (BOOLEAN, can enable/disable)
  - triggered_at (Timestamp, when alert fired, NULL if not triggered)
  - created_at, updated_at (Timestamps)
```

### 🔌 API Endpoints

#### `GET /api/alerts`

**Purpose:** Fetch all alerts for the current user

**Response:**

```json
[
  {
    "id": "alert-uuid-1",
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
    "symbol": "GOOGL",
    "alert_type": "price_below",
    "threshold": 2400.0,
    "is_active": true,
    "triggered_at": "2024-01-15T10:30:00Z", // Already triggered
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

#### `POST /api/alerts`

**Purpose:** Create a new alert

**Request Body:**

```json
{
  "symbol": "AAPL",
  "alert_type": "price_above",
  "threshold": 150.0
}
```

**Response:**

```json
{
  "id": "new-alert-uuid",
  "symbol": "AAPL",
  "alert_type": "price_above",
  "threshold": 150.0,
  "is_active": true,
  "triggered_at": null,
  "created_at": "2024-01-03T00:00:00Z",
  "updated_at": "2024-01-03T00:00:00Z"
}
```

#### `PUT /api/alerts/[id]`

**Purpose:** Update alert (enable/disable, change threshold, mark as read)

**Request Body:**

```json
{
  "is_active": false, // Disable alert
  "threshold": 155.0 // Update threshold
}
```

#### `DELETE /api/alerts/[id]`

**Purpose:** Delete an alert

**Response:** `204 No Content`

### 🎨 UI Components

#### `AlertList.tsx`

**Purpose:** Display all user's alerts

**Features:**

- List of alerts with:
  - Symbol
  - Alert type (with icon/badge)
  - Threshold value
  - Status (Active/Inactive)
  - Triggered status (if triggered, show when)
- Filter by:
  - Active/Inactive
  - Triggered/Not Triggered
  - Symbol
- Actions: [Enable/Disable] [Edit] [Delete]
- "Create New Alert" button

**UI Flow:**

```
/dashboard or /alerts page
  └─ AlertList
      ├─ Active Alerts:
      │   ├─ AAPL | Price Above $150.00 | Active | [Disable] [Edit] [Delete]
      │   └─ GOOGL | Price Below $2,400.00 | Triggered (Jan 15) | [Disable] [Edit] [Delete]
      ├─ Inactive Alerts:
      │   └─ MSFT | Price Change > 5% | Inactive | [Enable] [Edit] [Delete]
      └─ [+ Create New Alert]
```

#### `CreateAlertForm.tsx`

**Purpose:** Form to create/edit an alert

**Features:**

- Symbol input (with autocomplete)
- Alert Type dropdown:
  - Price Above
  - Price Below
  - Price Change % (requires percentage threshold)
  - Volume Spike (requires volume threshold)
- Threshold input (number, format based on type)
- Active toggle (default: true)
- Validation:
  - Symbol exists
  - Threshold > 0
  - For price_change_percent: threshold between -100 and 100

**UI Flow:**

```
[Create New Alert] button click
  └─ Dialog/Modal:
      ├─ Symbol: [AAPL] [Validate]
      ├─ Alert Type: [Dropdown: Price Above ▼]
      ├─ Threshold: [$150.00] (format changes based on type)
      ├─ Active: [Toggle: ON]
      └─ [Create] [Cancel]
```

### 🔄 User Flow Examples

#### Flow 1: Create Price Alert

```
1. User views stock: /quote/AAPL (current price: $148.50)
2. Clicks "Create Alert" button
3. Selects alert type: "Price Above"
4. Enters threshold: $150.00
5. Clicks "Create"
6. Alert created and active
7. When AAPL reaches $150.00, alert triggers
8. User sees notification/badge
9. Alert shows "Triggered" status with timestamp
```

#### Flow 2: Create Percentage Change Alert

```
1. User wants to know if AAPL moves 5% in either direction
2. Clicks "Create Alert"
3. Symbol: "AAPL"
4. Alert Type: "Price Change %"
5. Threshold: 5.0 (means ±5%)
6. Clicks "Create"
7. Alert monitors for 5% price change
8. When triggered, shows direction (up/down) and new price
```

### ⚠️ Alert Processing (Backend Logic)

**Note:** Alerts need to be checked periodically. This can be done via:

1. **Client-Side Polling** (Simple, but less efficient):

   - Frontend periodically checks active alerts
   - Compares current prices with thresholds
   - Updates `triggered_at` when condition met

2. **Server-Side Job** (Recommended for production):

   - Cron job or scheduled function
   - Checks all active alerts
   - Updates database when triggered
   - Sends notifications (email, push, etc.)

3. **Real-Time via WebSocket** (Advanced):
   - Use your existing WebSocket connection
   - Monitor prices for symbols with active alerts
   - Trigger alerts in real-time

---

## Implementation Roadmap

### Phase 1: Watchlists (Start Here) ⏳

**Priority:** HIGH - Most commonly used feature

**Steps:**

1. ✅ Database tables created
2. ⏳ Implement API routes (`/api/watchlists/*`)
3. ⏳ Implement `WatchlistList` component
4. ⏳ Implement `WatchlistView` component
5. ⏳ Implement `AddToWatchlist` component
6. ⏳ Connect to Yahoo Finance API for stock prices
7. ⏳ Test full CRUD flow

**Estimated Time:** 4-6 hours

### Phase 2: Portfolios

**Priority:** MEDIUM - More complex, requires calculations

**Steps:**

1. ✅ Database tables created
2. ⏳ Implement API routes (`/api/portfolios/*`)
3. ⏳ Implement `PortfolioList` component
4. ⏳ Implement `PortfolioView` component
5. ⏳ Implement `AddHoldingForm` component
6. ⏳ Add price fetching and gain/loss calculations
7. ⏳ Test full CRUD flow

**Estimated Time:** 6-8 hours

### Phase 3: Alerts

**Priority:** LOW - Requires background processing

**Steps:**

1. ✅ Database table created
2. ⏳ Implement API routes (`/api/alerts/*`)
3. ⏳ Implement `AlertList` component
4. ⏳ Implement `CreateAlertForm` component
5. ⏳ Add alert checking logic (client-side polling or server job)
6. ⏳ Add notification system (optional)
7. ⏳ Test alert creation and triggering

**Estimated Time:** 4-6 hours (more if adding notifications)

---

## 🎯 Quick Start: Implement Watchlists First

**Recommended order:**

1. **Watchlists** - Simplest, most used feature
2. **Portfolios** - More complex but similar pattern
3. **Alerts** - Requires background processing

**Next Step:** Start implementing `/api/watchlists/route.ts` with real Supabase queries!
