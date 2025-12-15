# Stock Market WebSocket Backend

Python FastAPI server that connects to Finnhub WebSocket API and broadcasts real-time stock data to Next.js clients.

## Features

- ✅ Real-time stock price updates via Finnhub WebSocket
- ✅ Multiple client support (one Finnhub connection, many Next.js clients)
- ✅ Efficient subscription management (only subscribe once per symbol)
- ✅ Automatic reconnection handling
- ✅ CORS configured for Next.js frontend

## Setup Instructions

### 1. Install Python Dependencies

Make sure you have Python 3.8+ installed, then:

```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Finnhub API key:

```env
FINNHUB_API_KEY=your_actual_finnhub_api_key_here
HOST=0.0.0.0
PORT=8000
FRONTEND_URL=http://localhost:3000
```

**Get your Finnhub API key:**

1. Go to https://finnhub.io/
2. Sign up for a free account
3. Get your API key from the dashboard

### 3. Run the Server

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The server will start on `http://localhost:8000`

### 4. Test the Server

Open your browser and visit:

- `http://localhost:8000/` - Health check
- `http://localhost:8000/health` - Detailed health status
- `http://localhost:8000/docs` - FastAPI automatic API documentation

## API Endpoints

### WebSocket Endpoint

**URL:** `ws://localhost:8000/ws`

#### Client → Server Messages

**Subscribe to symbols:**

```json
{
  "action": "subscribe",
  "symbols": ["AAPL", "NVDA", "MSFT"]
}
```

**Unsubscribe from symbols:**

```json
{
  "action": "unsubscribe",
  "symbols": ["AAPL"]
}
```

#### Server → Client Messages

**Connection confirmation:**

```json
{
  "type": "connection",
  "status": "connected",
  "client_id": "uuid-here"
}
```

**Price update:**

```json
{
  "type": "price_update",
  "symbol": "AAPL",
  "data": {
    "price": 150.25,
    "volume": 1234567,
    "timestamp": 1234567890
  }
}
```

**Subscription confirmation:**

```json
{
  "type": "subscription",
  "status": "subscribed",
  "symbols": ["AAPL", "NVDA"]
}
```

## Project Structure

```
backend/
├── main.py                 # FastAPI application entry point
├── websocket_manager.py    # Finnhub WebSocket connection handler
├── client_manager.py       # Next.js client connection manager
├── subscription_manager.py # Subscription logic and routing
├── requirements.txt        # Python dependencies
├── .env.example           # Environment variables template
└── README.md              # This file
```

## How It Works

1. **Server Startup**: Connects to Finnhub WebSocket on startup
2. **Client Connection**: Next.js clients connect via WebSocket
3. **Subscription**: Clients send subscribe messages with symbols
4. **Efficient Management**: Server only subscribes to Finnhub once per unique symbol
5. **Broadcasting**: When Finnhub sends price updates, server broadcasts to all subscribed clients
6. **Cleanup**: When clients disconnect, server unsubscribes if no other clients need those symbols

## Troubleshooting

### Connection Issues

- **"FINNHUB_API_KEY not found"**: Make sure your `.env` file exists and contains `FINNHUB_API_KEY`
- **"Failed to connect to Finnhub"**: Check your API key is valid and you have internet connection
- **CORS errors**: Make sure `FRONTEND_URL` in `.env` matches your Next.js URL

### WebSocket Issues

- **Connection drops**: Server automatically attempts to reconnect with exponential backoff
- **No updates received**: Check that you've subscribed to symbols and Finnhub is sending data
- **Multiple subscriptions**: Server handles this efficiently - only one Finnhub subscription per symbol

## Next Steps

After setting up the backend:

1. Update your Next.js frontend to connect to this WebSocket server
2. Create a React hook to manage WebSocket connections
3. Update your components to use real-time data

## Development

To run in development mode with auto-reload:

```bash
uvicorn main:app --reload
```

The `--reload` flag automatically restarts the server when you make code changes.
