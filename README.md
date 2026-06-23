# Stock Market App - Portfolio Manager

A full-stack real-time stock market tracking and portfolio management application with user authentication, watchlists, investment portfolios, and price alerts.

## 🌟 Features

### Portfolio Management

- **Investment Portfolios**: Create and manage multiple investment portfolios
- **Holdings Tracking**: Track individual stock holdings with purchase price, quantity, and dates
- **Performance Analytics**: View portfolio performance, gains/losses, and percentage changes
- **Portfolio Valuation**: Real-time portfolio value calculations

### Stock Tracking

- **Real-time Stock Data**: Live price updates via WebSocket
- **Watchlists**: Create and manage custom stock watchlists
- **Price Alerts**: Set up alerts for price movements and volume spikes
- **Interactive Charts**: Stock price and volume charts using Chart.js
- **World Indices**: Track major global stock indices (S&P 500, NASDAQ, etc.)

### User Features

- **User Authentication**: Secure auth with Supabase (Email/Password & Google OAuth)
- **Market News**: Latest market and company news
- **AI Chat Assistant**: Protected Gemini-powered assistant for market/app Q&A
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Application Stack                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Frontend (Next.js 16)                                  │
│  └─ Vercel → stock-market-seven-delta.app               │
│     - TypeScript, React 19                              │
│     - Tailwind CSS, Shadcn UI                           │
│     - Real-time WebSocket client                        │
│                                                         │
│  Backend (Python FastAPI)                               │
│  └─ AWS EC2 (eu-north-1) + nginx + Let's Encrypt      │
│     - api.stock-market-seven-delta.app                  │
│     - WebSocket server for real-time data               │
│     - Finnhub WebSocket integration                     │
│                                                         │
│  Database (Supabase)                                    │
│  └─ PostgreSQL                                          │
│     - User authentication                               │
│     - Watchlists, Portfolios, Alerts                    │
│     - Row Level Security (RLS)                          │
│                                                         │
│  External APIs                                          │
│  ├─ Yahoo Finance API (stock data)                      │
│  └─ Finnhub API (real-time WebSocket)                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (for frontend)
- **Python** 3.11+ (for backend)
- **Supabase Account** (for database and auth)
- **Finnhub API Key** (for real-time stock data)
- **Yahoo Finance API** (free, no key required)

### Frontend Setup

```bash
cd frontend
npm install

# Create .env.local with your Supabase credentials
cp .env.example .env.local
# Edit .env.local with your values

npm run dev
```

Frontend will run on [http://localhost:3000](http://localhost:3000)

### Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your Finnhub API key

python main.py
```

Backend will run on [http://localhost:8000](http://localhost:8000)

## 📁 Project Structure

```
stock-market/
├── frontend/              # Next.js frontend application
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── context/          # React contexts
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utilities and Supabase clients
│   ├── services/         # API service functions
│   └── types/            # TypeScript types
│
├── backend/               # Python FastAPI backend
│   ├── main.py          # FastAPI application
│   ├── deploy/          # EC2 nginx, systemd configs
│   ├── websocket_manager.py    # Finnhub WebSocket handler
│   ├── client_manager.py        # Client connection manager
│   ├── subscription_manager.py  # Subscription logic
│   └── requirements.txt         # Python dependencies
│
├── markdown/             # Documentation
│   ├── DEPLOYMENT_PLAN.md
│   └── deploy/          # Deployment documentation
│
└── README.md            # This file
```

## 🎯 Key Features

### Portfolio Manager

The core feature of this application is comprehensive portfolio management:

- Create multiple investment portfolios
- Add holdings with purchase details (price, quantity, date)
- Track portfolio performance in real-time
- View gains/losses and percentage changes
- Monitor portfolio value with live stock prices
- Analyze individual holding performance

### Public Pages

- **Home**: Market overview with trending stocks
- **Stocks**: Browse stocks by category (gainers, losers, most-active, trending)
- **Quote**: Detailed stock information with charts and news
- **News**: Market news feed
- **World Indices**: Global stock indices

### Protected Pages (Requires Login)

- **Dashboard**: User dashboard with portfolio overview
- **Portfolios**: **Portfolio Manager** - Create, manage, and track investment portfolios with holdings, performance metrics, and real-time valuations
- **Watchlists**: Create and manage stock watchlists
- **Alerts**: Set up price alerts for stocks
- **Assistant**: Gemini chat assistant for market and product-help questions

## 🔐 Authentication

- **Email/Password**: Traditional signup and login
- **Google OAuth**: Social authentication
- **Session Management**: Automatic session refresh
- **Protected Routes**: Middleware-based route protection

## 📡 Real-time Features

- **WebSocket Connection**: Real-time stock price updates
- **Automatic Subscriptions**: Subscribe to stocks automatically
- **Live Price Updates**: Prices update in real-time on cards and charts
- **Reconnection**: Automatic reconnection on disconnect

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI**: React 19
- **Styling**: Tailwind CSS 4
- **Components**: Shadcn UI (Radix UI)
- **Charts**: Chart.js
- **Database Client**: Supabase JS

### Backend

- **Framework**: FastAPI
- **Language**: Python 3.11+
- **WebSocket**: websockets library
- **Server**: Uvicorn

### Database & Auth

- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime (for future features)

### External APIs

- **Yahoo Finance**: Stock data, news, quotes
- **Finnhub**: Real-time WebSocket stock prices
- **Google Gemini**: AI chat completion

## 🚀 Deployment Status

**Status:** ✅ **DEPLOYED**

- ✅ **Frontend**: Deployed to Vercel → `https://stock-market-seven-delta.app`
- ✅ **Backend**: Deployed to AWS EC2 (`eu-north-1`) → `https://api.stock-market-seven-delta.app`
- ✅ **Database**: Supabase (Production)

### Production URLs

- **Frontend**: `https://stock-market-seven-delta.app`
- **Backend**: `https://api.stock-market-seven-delta.app`
- **API Docs**: `https://api.stock-market-seven-delta.app/docs`
- **WebSocket**: `wss://api.stock-market-seven-delta.app/ws`

## 📚 Documentation

- **[Frontend README](frontend/README.md)**: Frontend setup and documentation
- **[Backend README](backend/README.md)**: Backend setup and documentation
- **[Environment Variables](ENVIRONMENT_VARIABLES.md)**: Environment variable documentation

## 🔧 Development

### Running Locally

1. **Start Backend:**

   ```bash
   cd backend
   python main.py
   ```

2. **Start Frontend:**

   ```bash
   cd frontend
   npm run dev
   ```

3. **Access Application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Environment Variables

See [Environment Variables Documentation](ENVIRONMENT_VARIABLES.md) for complete setup.

**Quick Setup:**

**Frontend (`.env.local`):**

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

**Backend (`.env`):**

```env
FINNHUB_API_KEY=your_finnhub_key
HOST=0.0.0.0
PORT=8000
FRONTEND_URL=http://localhost:3000
```

## 📝 API Endpoints

### Frontend API Routes (Next.js)

- `GET /api` - Get all stocks
- `GET /api/stocks?category=...` - Get stocks by category
- `GET /api/quote?symbol=...` - Get stock quote
- `GET /api/news` - Get market news
- `GET /api/world-indices` - Get world indices
- `GET /api/candles?symbol=...` - Get price history
- `GET/POST /api/watchlists` - Watchlist operations
- `GET/POST /api/portfolios` - Portfolio operations
- `GET/POST /api/alerts` - Alert operations
- `POST /api/ai/chat` - Protected proxy route for assistant chat

### Backend API Routes (FastAPI)

- `GET /` - Health check
- `GET /health` - Detailed health status
- `POST /ai/chat` - Gemini chat endpoint (protected via frontend middleware)
- `WS /ws` - WebSocket endpoint for real-time updates

## 🧪 Testing

### Frontend

```bash
cd frontend
npm run build  # Test production build
npm start      # Test production server
```

### Backend

```bash
cd backend
python main.py  # Test server startup
# Visit http://localhost:8000/health
```

## 🔒 Security

- ✅ Row Level Security (RLS) enabled on all database tables
- ✅ Environment variables for all secrets
- ✅ CORS configured for production
- ✅ Protected API routes with authentication
- ✅ Secure WebSocket connections (WSS in production)

## 📈 Future Enhancements

### Portfolio Management

- [ ] Portfolio performance history and analytics
- [ ] Dividend tracking
- [ ] Tax reporting and capital gains calculations
- [ ] Portfolio rebalancing suggestions
- [ ] Export portfolio data (CSV, PDF)

### Additional Features

- [ ] AI-powered stock predictions
- [ ] Advanced charting features
- [ ] Mobile app (React Native)
- [ ] Email notifications for alerts
- [ ] Social features (share portfolios)
- [ ] Historical data analysis
- [ ] Options trading data

## 📄 License

Private project

**Version:** 0.0.1  
**Status:** ✅ Production Ready
