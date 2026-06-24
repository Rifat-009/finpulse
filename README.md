# FinPulse — Personal Finance Dashboard

<div align="center">

**A unified, zero-dependency finance dashboard tracking crypto, stocks, budgets, and spending analytics in real time.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-00e68a?style=for-the-badge&logo=github)](https://yourusername.github.io/finpulse)
[![Zero Build](https://img.shields.io/badge/Build_Step-None-00e68a?style=flat-square)]()
[![APIs](https://img.shields.io/badge/Free_APIs-3_Integrated-f0c040?style=flat-square)]()
[![License](https://img.shields.io/badge/License-MIT-00e68a?style=flat-square)]()
[![100% Client](https://img.shields.io/badge/Render-Client_Side-00e68a?style=flat-square)]()

</div>

---

## Overview

**FinPulse** is a professional-grade, single-page personal finance application designed for young investors and crypto-native users. It aggregates live market data from free APIs, pairs it with local budget management, and presents everything through a premium dark-mode interface.

The entire application lives in a **single `index.html` file**. No Node.js, no `package.json`, no build tools. Push it to GitHub Pages and it works instantly.

## Features

### 🪙 Crypto Market
* Top 50 cryptocurrencies by market cap via **CoinGecko**
* 1h, 24h, and 7d percentage changes
* Raw Canvas 2D sparkline charts (high-performance, no Chart.js overhead)
* Star/unstar watchlist with filter toggle
* Coin detail modal with on-demand 30-day price chart fetch
* Real-time search and multi-sort (price, market cap, volume, change)

### 📈 Stock Tracker
* 8 major stocks (AAPL, MSFT, NVDA, GOOGL, AMZN, META, TSLA, NFLX)
* Simulated live ticker updating every 4 seconds
* Interactive gradient sparklines
* Detail modal with full price history chart
* Optional Alpha Vantage API key integration for real data

### 💰 Budget Manager
* Full CRUD for income and expense transactions
* 10 expense + 3 income categories with distinct color coding
* Adjustable monthly budget limit with dynamic progress bars
* Pre-populated with 15 realistic sample transactions
* Inline validation with no alert popups

### 📊 Spending Analytics
* Savings rate, daily average spend, transaction count
* Doughnut chart for category breakdown
* Grouped bar chart for 6-month income vs. expenses
* Line chart for monthly spending trend
* Per-category progress bars with percentages

### 💱 Currency Converter
* 30+ currencies via **ExchangeRate-API**
* Bidirectional conversion with swap button
* Clickable popular rates grid
* Smart decimal handling (0 decimals for JPY/KRW, 2-4 for others)

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Vanilla JS (ES5/6)** | Application logic, SPA routing, state management |
| **Tailwind CSS** (CDN) | Utility-first styling foundation |
| **Chart.js 4** (CDN) | Doughnut, line, and bar charts |
| **Font Awesome 6** (CDN) | Icon system |
| **Google Fonts** | Space Grotesk (headings) + DM Sans (body) |
| **Canvas 2D API** | High-performance sparkline rendering |
| **localStorage** | Persistent state for budget and watchlist |

## API Architecture

The dashboard connects to **3 free APIs** with a robust fallback system so the app is fully functional even offline or when rate-limited.

| Service | Endpoint | Auth | Rate Limit | Cache | Fallback |
|---------|----------|------|------------|-------|----------|
| **CoinGecko** | `/coins/markets` | None | ~10-30/min | 60s | 20 hardcoded coins + generated sparklines |
| **CoinGecko** | `/coins/{id}/market_chart` | None | Same | On-demand | Falls back to 7d sparkline |
| **ExchangeRate-API** | `/v6/latest/USD` | None | ~1500/day | 1 hour | 30 hardcoded pairs |
| **Alpha Vantage** | `/query?function=GLOBAL_QUOTE` | Free key | 25/day | — | Simulated random-walk ticks |

### Why Fallbacks Matter
CoinGecko's free tier aggressively rate-limits. Instead of showing error states, FinPulse loads instantly with realistic fallback data, then silently swaps to live data once the API responds. The sidebar footer shows `Live · CoinGecko` or `Offline · Cached` accordingly.

## Project Structure

```
finpulse/
├── index.html      ← The entire application (~40KB)
└── README.md       ← This file
```

### Internal Architecture
```
index.html
├── <style>          CSS variables, responsive grid, animations
├── <body>           Semantic HTML shell
│   ├── #sidebar     Navigation + branding + status
│   ├── #wrap        Top bar + main content area
│   ├── #ov/#md      Modal overlay system
│   ├── #toasts      Toast notification system
│   └── #bnav        Mobile bottom tab bar
└── <script>         All application JavaScript
    ├── Data          Fallback datasets (20 crypto, 8 stocks, 30 rates)
    ├── APIs          Fetch wrappers with caching
    ├── State         Single `A` object (page, data, charts, settings)
    ├── Router        `nav()` — destroys charts → renders page → inits charts
    ├── Pages         pgDash, pgCrypto, pgStocks, pgBudget, pgAnalytics, pgFx
    ├── Charts        chDonut, chLine, chBar (Chart.js) + drawSpark (Canvas 2D)
    └── UI            toast, opnMd, clsMd, event delegation
```

## Deployment

### GitHub Pages (Recommended)

```bash
# 1. Create a new repository on GitHub
# 2. Clone it locally
git clone https://github.com/YOUR_USERNAME/finpulse.git
cd finpulse

# 3. Copy index.html into the repo
# (Paste the file content or drag-and-drop)

# 4. Commit and push
git add .
git commit -m "Initial commit: FinPulse dashboard"
git branch -M main
git push -u origin main

# 5. Enable GitHub Pages
#    Go to: Settings → Pages → Source
#    Branch: main → Folder: / (root)
#    Click Save
```

Your site will be live at: **`https://YOUR_USERNAME.github.io/finpulse/`**

### Other Platforms
Works identically on **Netlify**, **Vercel**, **Cloudflare Pages**, or any static web server. Just serve the single `index.html` file.

## Design System

- **Background**: Deep forest black (`#070c0a`) with subtle emerald and gold radial gradients
- **Accent**: Emerald green (`#00e68a`) for positive/growth, red (`#ff4757`) for negative/loss
- **Cards**: Semi-transparent dark green with subtle border glow on hover
- **Typography**: Space Grotesk 700 for numbers/headings, DM Sans 400 for body text
- **Responsive**: 4-column → 2-column → 1-column grid. Sidebar collapses to bottom tabs on mobile.
- **Motion**: Page-enter animations, number count-ups, pulsing live indicators (all respect `prefers-reduced-motion`)

## Browser Support

- Chrome / Edge 90+
- Firefox 90+
- Safari 15+
- Chrome for Android
- Mobile Safari (iOS 15+)

## License

This project is licensed under the **MIT License**. Use it freely for personal or commercial purposes.
