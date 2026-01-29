# Stock Market App - Frontend

Next.js 16 frontend application for a real-time stock market tracking and portfolio management platform.

## 🚀 Features

### Portfolio Management
- **Investment Portfolios**: Create and manage multiple investment portfolios
- **Holdings Management**: Add, edit, and remove stock holdings with purchase details
- **Performance Tracking**: Real-time portfolio performance with gains/losses calculations
- **Portfolio Valuation**: Live portfolio value updates based on current stock prices

### Stock Tracking
- **Real-time Stock Data**: Live price updates via WebSocket connection
- **Watchlists**: Create and manage custom stock watchlists
- **Price Alerts**: Set up alerts for price movements
- **Stock Charts**: Interactive charts using Chart.js
- **World Indices**: Track major global stock indices

### User Features
- **User Authentication**: Secure authentication with Supabase (Email/Password & Google OAuth)
- **Market News**: View latest market and company news
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Components**: Shadcn UI (Radix UI)
- **Charts**: Chart.js with react-chartjs-2
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: WebSocket for live stock updates
- **Data Source**: Yahoo Finance API

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

2. **Configure environment variables:**
   
   Create a `.env.local` file in the `frontend` directory:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   # WebSocket Backend URL
   NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws

   # Next.js URL (for internal API calls)
   NEXT_URL=http://localhost:3000
   ```

3. **Run development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes (login, signup)
│   ├── (protected)/       # Protected routes (dashboard, portfolio, watchlist, alerts)
│   ├── api/               # API routes (Next.js API handlers)
│   ├── news/              # Market news page
│   ├── quote/             # Stock quote pages
│   ├── stocks/            # Stock category pages
│   └── world-indices/     # World indices page
├── components/            # React components
│   ├── alerts/           # Alert-related components
│   ├── auth/             # Authentication components
│   ├── charts/           # Chart components
│   ├── portfolios/       # Portfolio components
│   ├── watchlists/       # Watchlist components
│   └── ui/              # Shadcn UI components
├── context/              # React contexts (Auth, WebSocket)
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries
│   └── supabase/        # Supabase client configurations
├── services/            # API service functions
├── types/               # TypeScript type definitions
└── public/              # Static assets
```

## 🎯 Key Pages

- **Home (`/`)**: Market overview with trending stocks
- **Stocks (`/stocks/[category]`)**: View stocks by category (gainers, losers, most-active, trending)
- **Quote (`/quote/[symbol]`)**: Detailed stock information with charts
- **News (`/news`)**: Market news feed
- **World Indices (`/world-indices`)**: Global stock indices
- **Dashboard (`/dashboard`)**: User dashboard (protected)
- **Portfolio (`/portfolio`)**: Manage investment portfolios (protected)
- **Watchlist (`/watchlist`)**: Manage stock watchlists (protected)
- **Alerts (`/alerts`)**: Manage price alerts (protected)

## 🔌 API Routes

All API routes are in `app/api/`:

- `/api` - Get all stocks
- `/api/stocks?category=...` - Get stocks by category
- `/api/quote?symbol=...` - Get stock quote
- `/api/news` - Get market news
- `/api/world-indices` - Get world indices
- `/api/candles?symbol=...` - Get candle/price history
- `/api/watchlists` - Watchlist CRUD operations
- `/api/portfolios` - Portfolio CRUD operations
- `/api/alerts` - Alert CRUD operations

## 🔐 Authentication

The app uses Supabase for authentication:

- **Email/Password**: Traditional signup/login
- **Google OAuth**: Social authentication
- **Protected Routes**: Middleware protects routes in `(protected)` folder
- **Session Management**: Automatic session refresh via middleware

## 📡 Real-time Updates

Real-time stock price updates via WebSocket:

- Connects to backend WebSocket server
- Subscribes to stock symbols automatically
- Updates prices in real-time on stock cards and bars
- Automatic reconnection on disconnect

## 🎨 Styling

- **Tailwind CSS 4**: Utility-first CSS framework
- **Shadcn UI**: High-quality component library
- **Dark Mode**: Default dark theme
- **Responsive**: Mobile-first design

## 🚀 Deployment

### Production Build

```bash
npm run build
npm start
```

### Deploy to Vercel

The app is configured for Vercel deployment:

1. Push code to GitHub
2. Import project in Vercel
3. Set root directory to `frontend`
4. Add environment variables in Vercel dashboard
5. Deploy

**Status:** ✅ Deployed to Vercel

## 📝 Environment Variables

See `ENVIRONMENT_VARIABLES.md` in the root directory for complete documentation.

### Required Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side)
- `NEXT_PUBLIC_WS_URL` - WebSocket backend URL

### Optional Variables

- `NEXT_URL` - Base URL for internal API calls
- `SKIP_YAHOO_FINANCE` - Skip Yahoo Finance API (development only)

## 🧪 Development

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Lint Code

```bash
npm run lint
```

## 📚 Key Dependencies

- `next` - Next.js framework
- `react` & `react-dom` - React library
- `@supabase/supabase-js` & `@supabase/ssr` - Supabase client
- `chart.js` & `react-chartjs-2` - Charting library
- `tailwindcss` - CSS framework
- `yahoo-finance2` - Yahoo Finance API client
- `lucide-react` - Icon library

## 🔗 Related Documentation

- [Environment Variables](../ENVIRONMENT_VARIABLES.md)
- [Backend README](../backend/README.md)

## 📄 License

Private project

---

**Last Updated:** [Current Date]
