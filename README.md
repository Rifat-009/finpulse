# FinPulse — Next-Generation Personal Finance Dashboard

FinPulse is a premium, professional-grade personal finance dashboard designed to help you track your entire financial life in one stunning interface. It aggregates live cryptocurrency data, simulates stock market tracking, manages your monthly budget, and provides intelligent, automated financial insights.

![Dashboard Preview](https://via.placeholder.com/1200x600/020617/10b981?text=FinPulse+Dashboard+Preview)

## ✨ Next-Generation Features

*   **🧠 Pulse AI Insights Engine:** An integrated, algorithmic assistant that analyzes your spending habits and portfolio volatility to deliver real-time, actionable advice.
*   **📰 Live Global Market News:** A continuous scrolling news ticker that pulls real-time financial and crypto headlines directly into your dashboard.
*   **🎛️ Financial Health Speedometer:** A dynamic, animated gauge that calculates a 0-100 health score based on your savings rate, budget adherence, and portfolio distribution.
*   **🎯 Advanced Goal Tracking:** Set custom savings targets (e.g., "Emergency Fund", "New Car") and track your progress with beautiful visual indicators and percentage calculations.
*   **🔮 Cyber-Glassmorphism UI:** A stunning dark mode interface utilizing staggered cascading entrance animations, floating action buttons, and glowing neon hover-states.

## 📊 Core Functionality

*   **📈 Dashboard Overview:** A unified view of your total portfolio, asset allocation, recent transactions, and health score.
*   **🪙 Crypto Market:** Live cryptocurrency tracking powered by the CoinGecko API. Sort by market cap, price, or 24h change, and save your favorite coins to a watchlist.
*   **📉 Stock Tracker:** Track equity positions with beautiful sparkline charts (currently running in live simulation mode).
*   **💰 Budget Manager:** Keep your expenses in check. Add income/expenses, categorize transactions, and visualize your remaining monthly budget.
*   **📊 Analytics:** Deep dive into your spending habits with intuitive donut and bar charts showing 6-month trends and category breakdowns.
*   **💱 Currency Converter:** Instant, live FX conversions across major global fiat currencies using the ExchangeRate-API.

## 🚀 Quick Start

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Rifat-009/finpulse.git
    cd finpulse
    ```
2.  **Open in Browser:**
    No build step or server is required! Simply open the `index.html` file in your preferred modern web browser.
    ```bash
    # On macOS
    open index.html
    # On Linux
    xdg-open index.html
    # On Windows
    start index.html
    ```

## 🛠 Technologies Used

*   **HTML5:** Semantic and accessible document structure.
*   **Vanilla CSS3:** Custom-built CSS using modern features like CSS Variables, Flexbox, Grid, keyframe animations, and Backdrop-filter (Glassmorphism).
*   **Vanilla JavaScript (ES6+):** Pure, dependency-free application logic and state management.
*   **Chart.js:** For rendering beautiful, responsive data visualizations.
*   **Font Awesome:** For scalable vector icons.
*   **Google Fonts:** Utilizing 'Inter' and 'Outfit' for premium typography.

## 📡 API Integrations

*   **[CoinGecko API](https://www.coingecko.com/en/api):** Provides live cryptocurrency prices, market caps, and sparkline data.
*   **[ExchangeRate-API](https://www.exchangerate-api.com/):** Provides real-time currency conversion rates.
*   **[RSS2JSON & CoinDesk](https://rss2json.com/):** Powers the live, scrolling global market news ticker without CORS restrictions.

## 📂 Project Structure

```text
finpulse/
├── index.html       # The main entry point (includes UI structure)
├── css/
│   └── style.css    # Cyber-glassmorphism design system & animations
├── js/
│   └── app.js       # Core logic, AI Insights, data fetching, and state
└── README.md        # This documentation file
```

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page if you want to contribute.

## 📝 License
This project is open-source and available under the [MIT License](LICENSE).
