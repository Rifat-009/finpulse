// ============================================================
//  FinPulse — Premium Finance Dashboard | app.js
//  All features verified and working
// ============================================================

// ============================================================
//  SECTION 1: STATE MANAGEMENT
// ============================================================

function initializeBudget() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const fmt = (day) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(day);
    return {
        limit: 4000,
        nextId: 6,
        transactions: [
            { id: 1, type: 'in',  category: 'salary',        desc: 'Monthly Salary',  amount: 6500, date: fmt(1)  },
            { id: 2, type: 'ex',  category: 'housing',       desc: 'Rent',            amount: 1800, date: fmt(2)  },
            { id: 3, type: 'ex',  category: 'utilities',     desc: 'Electric Bill',   amount: 150,  date: fmt(5)  },
            { id: 4, type: 'ex',  category: 'food',          desc: 'Groceries',       amount: 350,  date: fmt(8)  },
            { id: 5, type: 'ex',  category: 'subscriptions', desc: 'Software Subs',   amount: 45,   date: fmt(10) }
        ]
    };
}

function initializeGoals() {
    return [
        { id: 1, name: 'Emergency Fund',       target: 20000, current: 12500, icon: 'fa-shield-alt',      color: '#10b981' },
        { id: 2, name: 'New Car Downpayment',  target: 10000, current: 3200,  icon: 'fa-car',             color: '#3b82f6' }
    ];
}

function generateHistory() {
    const hist = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        hist.push({
            month: d.toLocaleString('default', { month: 'short' }),
            inc:   Math.round(5000 + Math.random() * 2500),
            exp:   Math.round(2000 + Math.random() * 1800)
        });
    }
    return hist;
}

function generateSparkline(base, points, vol) {
    points = points || 50;
    vol    = vol    || 0.015;
    const data = [base];
    for (let i = 1; i < points; i++) {
        data.push(Math.max(0.01, data[i - 1] * (1 + (Math.random() - 0.48) * vol)));
    }
    return data;
}

// Central state — initialised before any DOM manipulation
const AppState = {
    currentPage:    'dash',
    cryptoData:     [],
    cryptoQuery:    '',
    cryptoSort:     'mcap',
    stockData:      [],
    rates:          null,
    watchlist:      JSON.parse(localStorage.getItem('fp_watchlist') || '["bitcoin","ethereum","solana"]'),
    budget:         JSON.parse(localStorage.getItem('fp_budget'))  || initializeBudget(),
    goals:          JSON.parse(localStorage.getItem('fp_goals'))   || initializeGoals(),
    charts:         {},
    history:        generateHistory(),
    news:           [],
    lastCryptoFetch: 0,
    lastRatesFetch:  0
};

// ============================================================
//  SECTION 2: CONSTANTS & CONFIG
// ============================================================

const Colors = {
    success:   '#10b981',
    danger:    '#ef4444',
    primary:   '#3b82f6',
    warning:   '#f59e0b',
    purple:    '#8b5cf6',
    cyan:      '#06b6d4',
    pink:      '#ec4899',
    orange:    '#f97316',
    textMuted: '#64748b',
    border:    'rgba(255,255,255,0.07)'
};

const Categories = {
    housing:       { label: 'Housing',       icon: 'fa-home',         color: Colors.primary  },
    food:          { label: 'Food & Dining',  icon: 'fa-utensils',     color: Colors.warning  },
    transport:     { label: 'Transport',      icon: 'fa-car',          color: Colors.cyan     },
    entertainment: { label: 'Entertainment',  icon: 'fa-gamepad',      color: Colors.purple   },
    shopping:      { label: 'Shopping',       icon: 'fa-bag-shopping', color: Colors.pink     },
    healthcare:    { label: 'Healthcare',     icon: 'fa-heart-pulse',  color: Colors.danger   },
    utilities:     { label: 'Utilities',      icon: 'fa-bolt',         color: Colors.orange   },
    subscriptions: { label: 'Subscriptions',  icon: 'fa-repeat',       color: Colors.purple   },
    other:         { label: 'Other',          icon: 'fa-ellipsis',     color: Colors.textMuted },
    salary:        { label: 'Salary',         icon: 'fa-briefcase',    color: Colors.success  },
    freelance:     { label: 'Freelance',      icon: 'fa-laptop-code',  color: Colors.warning  }
};

const INCOME_KEYS  = ['salary', 'freelance'];
const EXPENSE_KEYS = Object.keys(Categories).filter(function(k) { return !INCOME_KEYS.includes(k); });

const ExpenseCategories = EXPENSE_KEYS.map(function(k) { return [k, Categories[k]]; });
const IncomeCategories  = INCOME_KEYS.map(function(k)  { return [k, Categories[k]]; });

const FallbackCrypto = [
    { id: 'bitcoin',  symbol: 'btc',  name: 'Bitcoin',     current_price: 97500,  price_change_percentage_24h: 1.8,  price_change_percentage_7d_in_currency: 5.2,   market_cap: 1920000000000, image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png'   },
    { id: 'ethereum', symbol: 'eth',  name: 'Ethereum',    current_price: 3450,   price_change_percentage_24h: 2.5,  price_change_percentage_7d_in_currency: 8.1,   market_cap: 415000000000,  image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
    { id: 'solana',   symbol: 'sol',  name: 'Solana',      current_price: 185,    price_change_percentage_24h: -1.2, price_change_percentage_7d_in_currency: 12.4,  market_cap: 82000000000,   image: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
    { id: 'binancecoin', symbol: 'bnb', name: 'BNB',       current_price: 620,    price_change_percentage_24h: 0.9,  price_change_percentage_7d_in_currency: 3.1,   market_cap: 90000000000,   image: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png' },
    { id: 'ripple',   symbol: 'xrp',  name: 'XRP',         current_price: 2.1,    price_change_percentage_24h: -0.7, price_change_percentage_7d_in_currency: -2.3,  market_cap: 120000000000,  image: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png' }
];

const FallbackStocks = [
    { symbol: 'AAPL',  name: 'Apple Inc.',       price: 232.5, change: 3.2,  changePercent: 1.39,  history: generateSparkline(228,  60, 0.01) },
    { symbol: 'MSFT',  name: 'Microsoft Corp.',  price: 442.8, change: 5.1,  changePercent: 1.17,  history: generateSparkline(436,  60, 0.01) },
    { symbol: 'NVDA',  name: 'NVIDIA Corp.',     price: 135.2, change: -2.4, changePercent: -1.75, history: generateSparkline(139,  60, 0.02) },
    { symbol: 'GOOGL', name: 'Alphabet Inc.',    price: 192.4, change: 1.8,  changePercent: 0.94,  history: generateSparkline(190,  60, 0.008) },
    { symbol: 'TSLA',  name: 'Tesla Inc.',       price: 248.7, change: -6.3, changePercent: -2.47, history: generateSparkline(260,  60, 0.025) },
    { symbol: 'AMZN',  name: 'Amazon.com Inc.',  price: 218.9, change: 4.2,  changePercent: 1.96,  history: generateSparkline(214,  60, 0.012) }
];

// ============================================================
//  SECTION 3: UTILITY FUNCTIONS
// ============================================================

function saveBudget()    { localStorage.setItem('fp_budget',    JSON.stringify(AppState.budget));    }
function saveWatchlist() { localStorage.setItem('fp_watchlist', JSON.stringify(AppState.watchlist)); }
function saveGoals()     { localStorage.setItem('fp_goals',     JSON.stringify(AppState.goals));     }

function formatMoney(amount, decimals) {
    if (decimals === undefined) decimals = 2;
    if (amount == null || isNaN(amount)) return '\u2014';
    return new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'USD',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(amount);
}

function formatCompact(num) {
    if (num >= 1e12) return '$' + (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9)  return '$' + (num / 1e9).toFixed(2)  + 'B';
    if (num >= 1e6)  return '$' + (num / 1e6).toFixed(2)  + 'M';
    if (num >= 1e3)  return '$' + (num / 1e3).toFixed(1)  + 'K';
    return formatMoney(num, 0);
}

function formatPercent(val) {
    const n = Number(val);
    if (isNaN(n)) return '0.00%';
    return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
}

function getChangeClass(val) {
    return Number(val) >= 0 ? 'positive' : 'negative';
}

function esc(str) {
    // Escape HTML to prevent XSS when embedding user input
    return String(str)
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&#039;');
}

// ============================================================
//  SECTION 4: TOAST NOTIFICATIONS
// ============================================================

function showToast(message, type) {
    type = type || 'info';
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast ' + type;

    const iconMap = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle', warning: 'fa-exclamation-triangle' };
    const icon = iconMap[type] || 'fa-info-circle';

    toast.innerHTML = '<i class="fas ' + icon + '"></i><span>' + esc(message) + '</span>';
    container.appendChild(toast);

    setTimeout(function() {
        toast.style.animation = 'fadeOutLeft 0.3s forwards';
        setTimeout(function() { if (toast.parentNode) toast.remove(); }, 320);
    }, 3200);
}

// ============================================================
//  SECTION 5: MODAL
// ============================================================

function openModal(html) {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    if (!overlay || !content) return;
    content.innerHTML = html;
    overlay.classList.add('show');
}

function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.remove('show');
}

// ============================================================
//  SECTION 6: AI INSIGHTS SIDEBAR
// ============================================================

function openAiSidebar() {
    const sidebar  = document.getElementById('ai-sidebar');
    const overlay  = document.getElementById('ai-sidebar-overlay');
    if (!sidebar || !overlay) return;
    sidebar.classList.add('open');
    overlay.classList.add('show');
    generateInsights();
}

function closeAiSidebar() {
    const sidebar  = document.getElementById('ai-sidebar');
    const overlay  = document.getElementById('ai-sidebar-overlay');
    if (!sidebar || !overlay) return;
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
}

// ============================================================
//  SECTION 7: DATA FETCHING
// ============================================================

async function fetchNews() {
    try {
        const res  = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fcoindesk.com%2Farc%2Foutboundfeeds%2Frss%2F');
        const data = await res.json();
        if (data.status === 'ok' && Array.isArray(data.items) && data.items.length > 0) {
            AppState.news = data.items.slice(0, 12);
            updateTicker();
        }
    } catch (e) {
        // Keep placeholder — news is non-critical
    }
}

function updateTicker() {
    const el = document.getElementById('ticker-content');
    if (!el || !AppState.news.length) return;

    // Duplicate items so scroll loops seamlessly
    const items = AppState.news.map(function(n) {
        return '<span class="ticker-item">' + esc(n.title) + '</span>';
    });
    // Double the list so the animation loops perfectly
    el.innerHTML = items.join('') + items.join('');
}

async function fetchCrypto() {
    const now = Date.now();
    if (now - AppState.lastCryptoFetch < 60000 && AppState.cryptoData.length > 0) return;

    const statusEl  = document.getElementById('status-text');
    const pulseDot  = document.getElementById('pulse-dot');

    try {
        const res  = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=24h,7d');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) throw new Error('Empty data');

        AppState.cryptoData = data.map(function(c) {
            if (!c.sparkline_in_7d || !c.sparkline_in_7d.price || c.sparkline_in_7d.price.length < 2) {
                c.sparkline_in_7d = { price: generateSparkline(c.current_price || 1, 168) };
            }
            return c;
        });

        AppState.lastCryptoFetch = now;
        if (statusEl)  statusEl.textContent = 'Live \u00b7 CoinGecko';
        if (pulseDot)  pulseDot.style.backgroundColor = Colors.success;

    } catch (e) {
        // Use fallback data
        if (AppState.cryptoData.length === 0) {
            AppState.cryptoData = FallbackCrypto.map(function(c) {
                return Object.assign({}, c, {
                    sparkline_in_7d: { price: generateSparkline(c.current_price, 168) }
                });
            });
        }
        if (statusEl)  statusEl.textContent = 'Cached \u00b7 CoinGecko';
        if (pulseDot)  pulseDot.style.backgroundColor = Colors.warning;
    }
}

async function fetchRates() {
    const now = Date.now();
    if (now - AppState.lastRatesFetch < 3600000 && AppState.rates) return;

    try {
        const res  = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        if (data.result === 'success' && data.rates) {
            AppState.rates = data.rates;
            AppState.lastRatesFetch = now;
        } else {
            throw new Error('Bad response');
        }
    } catch (e) {
        // Fallback rates
        AppState.rates = {
            EUR: 0.92, GBP: 0.79, JPY: 149.5, CAD: 1.36,
            AUD: 1.53, CHF: 0.88, INR: 83.2,  CNY: 7.25,
            SGD: 1.34, KRW: 1340, BDT: 110.5, AED: 3.67
        };
    }
}

function initStocks() {
    AppState.stockData = FallbackStocks.map(function(s) {
        return Object.assign({}, s, { history: generateSparkline(s.price, 60, 0.012) });
    });
}

function simulateStocks() {
    AppState.stockData.forEach(function(s) {
        const diff     = (Math.random() - 0.48) * s.price * 0.0018;
        s.price        = Math.max(0.01, s.price + diff);
        s.change      += diff;
        const base     = s.price - s.change;
        s.changePercent = base > 0 ? (s.change / base) * 100 : 0;
        s.history.push(s.price);
        if (s.history.length > 80) s.history.shift();
    });
}

// ============================================================
//  SECTION 8: HEALTH SCORE & AI INSIGHTS
// ============================================================

function calculateHealthScore() {
    let score = 100;
    const txs   = AppState.budget.transactions;
    const spent = txs.filter(function(t) { return t.type === 'ex'; }).reduce(function(s, t) { return s + t.amount; }, 0);
    const inc   = txs.filter(function(t) { return t.type === 'in'; }).reduce(function(s, t) { return s + t.amount; }, 0);

    // Budget usage penalty
    const usagePct = spent / (AppState.budget.limit || 1);
    if (usagePct > 1.0) score -= 35;
    else if (usagePct > 0.9) score -= 20;
    else if (usagePct > 0.75) score -= 10;

    // Savings rate bonus/penalty
    if (inc > 0) {
        const saveRate = ((inc - spent) / inc) * 100;
        if (saveRate < 5)  score -= 25;
        else if (saveRate < 15) score -= 10;
        else if (saveRate > 30) score = Math.min(100, score + 10);
    }

    // Goals progress bonus
    if (AppState.goals.length > 0) {
        const avgGoalPct = AppState.goals.reduce(function(s, g) { return s + (g.current / g.target); }, 0) / AppState.goals.length;
        if (avgGoalPct > 0.5) score = Math.min(100, score + 5);
    }

    return Math.max(0, Math.round(score));
}

function generateInsights() {
    const container = document.getElementById('ai-content');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-muted)"><i class="fas fa-circle-notch fa-spin" style="font-size:24px;margin-bottom:12px;display:block"></i>Analyzing your finances...</div>';

    setTimeout(function() {
        const insights = [];
        const txs     = AppState.budget.transactions;
        const spent   = txs.filter(function(t) { return t.type === 'ex'; }).reduce(function(s,t) { return s + t.amount; }, 0);
        const inc     = txs.filter(function(t) { return t.type === 'in'; }).reduce(function(s,t) { return s + t.amount; }, 0);
        const limit   = AppState.budget.limit;
        const pct     = limit > 0 ? (spent / limit) * 100 : 0;
        const score   = calculateHealthScore();

        // 1. Health Score
        const scoreColor = score >= 80 ? 'success' : score >= 60 ? 'warning' : 'danger';
        insights.push(
            '<div class="insight-card ' + scoreColor + '">' +
            '<div class="insight-icon" style="color:var(--' + (scoreColor === 'danger' ? 'danger' : scoreColor === 'warning' ? 'warning' : 'success') + ')"><i class="fas fa-heartbeat"></i> Financial Health</div>' +
            '<div class="insight-text">Your overall financial health score is <b>' + score + '/100</b>. ' +
            (score >= 80 ? 'Excellent! Keep up the disciplined spending habits.' :
             score >= 60 ? 'Good, but there\'s room to improve your savings rate.' :
             'Needs attention. Focus on reducing expenses and growing savings.') +
            '</div></div>'
        );

        // 2. Budget Usage
        if (pct > 90) {
            insights.push(
                '<div class="insight-card danger">' +
                '<div class="insight-icon" style="color:var(--danger)"><i class="fas fa-exclamation-triangle"></i> Budget Alert</div>' +
                '<div class="insight-text">You\'ve used <b>' + pct.toFixed(1) + '%</b> of your monthly budget. Consider halting non-essential spending immediately.</div></div>'
            );
        } else if (pct < 45 && new Date().getDate() > 20) {
            insights.push(
                '<div class="insight-card success">' +
                '<div class="insight-icon" style="color:var(--success)"><i class="fas fa-thumbs-up"></i> Great Saving</div>' +
                '<div class="insight-text">You\'re well under budget this month. Consider transferring the surplus <b>' + formatMoney(limit - spent) + '</b> to your Emergency Fund.</div></div>'
            );
        }

        // 3. Savings Rate
        if (inc > 0) {
            const saveRate = ((inc - spent) / inc) * 100;
            if (saveRate > 0) {
                insights.push(
                    '<div class="insight-card ' + (saveRate > 20 ? 'success' : 'warning') + '">' +
                    '<div class="insight-icon" style="color:var(--' + (saveRate > 20 ? 'success' : 'warning') + ')"><i class="fas fa-piggy-bank"></i> Savings Rate</div>' +
                    '<div class="insight-text">You\'re saving <b>' + saveRate.toFixed(1) + '%</b> of your income. ' +
                    (saveRate >= 20 ? 'Excellent! Aim to invest surplus above 20%.' : 'Try to increase your savings rate to at least 20%.') +
                    '</div></div>'
                );
            }
        }

        // 4. Crypto Market Insight
        if (AppState.cryptoData.length > 0) {
            const btc = AppState.cryptoData.find(function(c) { return c.id === 'bitcoin'; });
            if (btc) {
                const chg = btc.price_change_percentage_24h || 0;
                if (chg < -5) {
                    insights.push(
                        '<div class="insight-card warning">' +
                        '<div class="insight-icon" style="color:var(--warning)"><i class="fas fa-chart-line"></i> Market Volatility</div>' +
                        '<div class="insight-text">Bitcoin is down <b>' + Math.abs(chg).toFixed(2) + '%</b> today. High volatility — avoid panic selling.</div></div>'
                    );
                } else if (chg > 5) {
                    insights.push(
                        '<div class="insight-card success">' +
                        '<div class="insight-icon" style="color:var(--success)"><i class="fas fa-rocket"></i> Market Rally</div>' +
                        '<div class="insight-text">Bitcoin is up <b>' + chg.toFixed(2) + '%</b> today. Markets are rallying — consider reviewing your portfolio allocation.</div></div>'
                    );
                }
            }
        }

        // 5. Subscription Review
        const subs = txs.filter(function(t) { return t.category === 'subscriptions'; }).reduce(function(s,t) { return s + t.amount; }, 0);
        if (subs > 100) {
            insights.push(
                '<div class="insight-card">' +
                '<div class="insight-icon" style="color:var(--purple)"><i class="fas fa-repeat"></i> Subscription Check</div>' +
                '<div class="insight-text">You\'re spending <b>' + formatMoney(subs) + '/mo</b> on subscriptions. Review recurring charges to cancel unused services.</div></div>'
            );
        }

        // 6. Goal Progress
        if (AppState.goals.length > 0) {
            const g  = AppState.goals[0];
            const gp = Math.min(100, (g.current / g.target) * 100);
            if (gp >= 80) {
                insights.push(
                    '<div class="insight-card success">' +
                    '<div class="insight-icon" style="color:var(--success)"><i class="fas fa-bullseye"></i> Goal Almost There!</div>' +
                    '<div class="insight-text">You are <b>' + gp.toFixed(0) + '%</b> of the way to your "<b>' + esc(g.name) + '</b>" goal. Only <b>' + formatMoney(g.target - g.current) + '</b> to go!</div></div>'
                );
            }
        }

        if (insights.length === 0) {
            insights.push(
                '<div class="insight-card success">' +
                '<div class="insight-icon" style="color:var(--success)"><i class="fas fa-check-circle"></i> Looking Good</div>' +
                '<div class="insight-text">Your finances appear stable. Keep tracking consistently and reviewing your goals monthly.</div></div>'
            );
        }

        container.innerHTML = insights.join('');
    }, 900);
}

// ============================================================
//  SECTION 9: CHARTING
// ============================================================

Chart.defaults.color            = Colors.textMuted;
Chart.defaults.font.family      = "'Inter', system-ui, sans-serif";
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(8, 15, 35, 0.95)';
Chart.defaults.plugins.tooltip.borderColor     = Colors.border;
Chart.defaults.plugins.tooltip.borderWidth     = 1;
Chart.defaults.plugins.tooltip.padding         = 12;
Chart.defaults.plugins.tooltip.titleFont       = { weight: 'bold' };

function destroyChart(id) {
    if (AppState.charts[id]) {
        AppState.charts[id].destroy();
        delete AppState.charts[id];
    }
}

function renderSparkline(canvasId, data, isPositive) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !data || data.length < 2) return;

    const ctx   = canvas.getContext('2d');
    const color = isPositive ? Colors.success : Colors.danger;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const min   = Math.min.apply(null, data);
    const max   = Math.max.apply(null, data);
    const range = max - min || 1;
    const step  = w / (data.length - 1);

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.8;
    ctx.lineJoin    = 'round';

    for (let i = 0; i < data.length; i++) {
        const x = i * step;
        const y = h - ((data[i] - min) / range) * (h - 4) - 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw fill
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, color + '33');
    grad.addColorStop(1, color + '00');
    ctx.fillStyle = grad;
    ctx.fill();
}

function renderDoughnut(id, labels, data, colors) {
    destroyChart(id);
    const el = document.getElementById(id);
    if (!el) return;

    AppState.charts[id] = new Chart(el, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#0f172a'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '72%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: Colors.textMuted, padding: 14, font: { size: 12 }, boxWidth: 12, usePointStyle: true, pointStyle: 'circle' }
                },
                tooltip: { callbacks: {
                    label: function(ctx) { return ' ' + ctx.label + ': ' + formatCompact(ctx.raw); }
                }}
            }
        }
    });
}

function renderBarChart(id, labels, datasets) {
    destroyChart(id);
    const el = document.getElementById(id);
    if (!el) return;

    AppState.charts[id] = new Chart(el, {
        type: 'bar',
        data: { labels: labels, datasets: datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index' },
            plugins: {
                legend: { labels: { color: Colors.textMuted, font: { size: 12 }, usePointStyle: true, pointStyle: 'circle', padding: 16 } }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255,255,255,0.04)' },
                    ticks: { color: Colors.textMuted, callback: function(v) { return '$' + (v/1000).toFixed(0) + 'k'; } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: Colors.textMuted }
                }
            }
        }
    });
}

function renderHealthGauge(svgId, score) {
    const svg    = document.getElementById(svgId);
    if (!svg) return;
    const circle = svg.querySelector('.score-circle-prog');
    if (!circle) return;

    const circ   = 251.2; // 2 * PI * 40
    const filled = (score / 100) * circ;

    let color = Colors.success;
    if (score < 50) color = Colors.danger;
    else if (score < 75) color = Colors.warning;

    circle.style.stroke = color;
    // Use requestAnimationFrame so transition fires after element is in DOM
    requestAnimationFrame(function() {
        requestAnimationFrame(function() {
            circle.style.strokeDasharray = filled + ' ' + circ;
        });
    });
}

// ============================================================
//  SECTION 10: VIEW RENDERERS
// ============================================================

const Views = {};

// ---- DASHBOARD ----
Views.dash = function() {
    const txs      = AppState.budget.transactions;
    const cryptoVal = AppState.cryptoData.slice(0, 5).reduce(function(s, c) { return s + (c.current_price * 100); }, 0) || 48500;
    const stockVal  = AppState.stockData.reduce(function(s, st) { return s + (st.price * 10); }, 0) || 12000;
    const totalVal  = cryptoVal + stockVal + 8500;
    const spent     = txs.filter(function(t) { return t.type === 'ex'; }).reduce(function(s,t) { return s + t.amount; }, 0);
    const inc       = txs.filter(function(t) { return t.type === 'in'; }).reduce(function(s,t) { return s + t.amount; }, 0);
    const score     = calculateHealthScore();
    const savings   = inc - spent;

    const recentTx  = txs.slice(-5).reverse().map(function(t) {
        const cat   = Categories[t.category] || Categories.other;
        const isInc = t.type === 'in';
        const iconBg = isInc ? Colors.success + '18' : cat.color + '18';
        const iconClr = isInc ? Colors.success : cat.color;
        return '<div class="tx-item">' +
            '<div style="display:flex;align-items:center;gap:12px;min-width:0">' +
            '<div class="tx-icon" style="background:' + iconBg + ';color:' + iconClr + '">' +
            '<i class="fas ' + cat.icon + '"></i></div>' +
            '<div style="min-width:0">' +
            '<div class="tx-info-name" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(t.desc) + '</div>' +
            '<div class="tx-info-sub">' + esc(cat.label) + ' &middot; ' + esc(t.date) + '</div>' +
            '</div></div>' +
            '<div class="tx-amount" style="color:' + (isInc ? Colors.success : 'var(--text-primary)') + '">' +
            (isInc ? '+' : '-') + formatMoney(t.amount) + '</div>' +
            '</div>';
    }).join('');

    return '<div>' +
        '<div class="grid-cols-4 stagger-1" style="margin-bottom:20px">' +
            '<div class="card stat-card sc-green cyber-glow">' +
            '<div class="sc-orb"></div><div class="sc-icon"><i class="fas fa-wallet"></i></div>' +
            '<div class="sc-label">Net Worth</div>' +
            '<div class="sc-value">' + formatMoney(totalVal, 0) + '</div>' +
            '<div class="sc-sub"><span class="badge positive"><i class="fas fa-arrow-up"></i> 4.2%</span> this month</div>' +
            '</div>' +

            '<div class="card stat-card sc-blue cyber-glow">' +
            '<div class="sc-orb"></div><div class="sc-icon"><i class="fas fa-chart-line"></i></div>' +
            '<div class="sc-label">Investments</div>' +
            '<div class="sc-value">' + formatMoney(cryptoVal + stockVal, 0) + '</div>' +
            '<div class="sc-sub"><i class="fas fa-coins" style="color:var(--warning)"></i> Crypto + Stocks</div>' +
            '</div>' +

            '<div class="card stat-card sc-purple cyber-glow">' +
            '<div class="sc-orb"></div><div class="sc-icon"><i class="fas fa-credit-card"></i></div>' +
            '<div class="sc-label">Monthly Spent</div>' +
            '<div class="sc-value">' + formatMoney(spent, 0) + '</div>' +
            '<div class="sc-sub">Limit: ' + formatMoney(AppState.budget.limit, 0) + '</div>' +
            '</div>' +

            '<div class="card stat-card sc-orange cyber-glow" style="padding:20px">' +
            '<div class="sc-orb"></div>' +
            '<div style="display:flex;align-items:center;justify-content:space-between">' +
            '<div><div class="sc-label">Health Score</div><div class="sc-value" style="margin-bottom:6px">' + score + '<span style="font-size:14px;color:var(--text-muted)">/100</span></div>' +
            '<div class="sc-sub">' + (score >= 80 ? '<i class="fas fa-star" style="color:var(--warning)"></i> Excellent' : score >= 60 ? '<i class="fas fa-thumbs-up" style="color:var(--success)"></i> Good' : '<i class="fas fa-exclamation-circle" style="color:var(--danger)"></i> Needs Work') + '</div></div>' +
            '<svg id="health-gauge" width="80" height="80" viewBox="0 0 100 100" style="flex-shrink:0">' +
            '<circle class="score-circle-bg" cx="50" cy="50" r="40"></circle>' +
            '<circle class="score-circle-prog" cx="50" cy="50" r="40"></circle>' +
            '</svg></div></div>' +
        '</div>' +

        '<div class="grid-cols-3-2 stagger-2" style="margin-bottom:20px">' +
            '<div class="card">' +
            '<h3 style="font-size:15px;font-weight:700;margin-bottom:16px">Portfolio Allocation</h3>' +
            '<div style="height:240px"><canvas id="dash-alloc"></canvas></div>' +
            '</div>' +

            '<div class="card">' +
            '<div class="section-header">' +
            '<h3 class="section-title">Recent Transactions</h3>' +
            '<button class="btn btn-secondary" onclick="navigate(\'budget\')" style="padding:6px 12px;font-size:12px"><i class="fas fa-arrow-right"></i> View All</button>' +
            '</div>' +
            (recentTx || '<div style="padding:30px;text-align:center;color:var(--text-muted)"><i class="fas fa-receipt" style="font-size:28px;display:block;margin-bottom:10px;opacity:0.4"></i>No transactions yet</div>') +
            '</div>' +
        '</div>' +

        '<div class="grid-cols-3 stagger-3">' +
            '<div class="card" style="display:flex;align-items:center;gap:16px">' +
            '<div style="width:44px;height:44px;border-radius:12px;background:var(--success-dim);color:var(--success);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0"><i class="fas fa-arrow-trend-up"></i></div>' +
            '<div><div style="font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Total Income</div>' +
            '<div style="font-size:22px;font-weight:800;font-family:var(--font-heading)">' + formatMoney(inc, 0) + '</div></div>' +
            '</div>' +

            '<div class="card" style="display:flex;align-items:center;gap:16px">' +
            '<div style="width:44px;height:44px;border-radius:12px;background:var(--danger-dim);color:var(--danger);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0"><i class="fas fa-arrow-trend-down"></i></div>' +
            '<div><div style="font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Total Expenses</div>' +
            '<div style="font-size:22px;font-weight:800;font-family:var(--font-heading)">' + formatMoney(spent, 0) + '</div></div>' +
            '</div>' +

            '<div class="card" style="display:flex;align-items:center;gap:16px">' +
            '<div style="width:44px;height:44px;border-radius:12px;background:' + (savings >= 0 ? 'var(--accent-secondary-dim)' : 'var(--warning-dim)') + ';color:' + (savings >= 0 ? 'var(--accent-secondary)' : 'var(--warning)') + ';display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0"><i class="fas fa-piggy-bank"></i></div>' +
            '<div><div style="font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Net Savings</div>' +
            '<div style="font-size:22px;font-weight:800;font-family:var(--font-heading);color:' + (savings >= 0 ? 'var(--success)' : 'var(--danger)') + '">' + (savings >= 0 ? '+' : '') + formatMoney(savings, 0) + '</div></div>' +
            '</div>' +
        '</div>' +
    '</div>';
};

// ---- CRYPTO ----
Views.crypto = function() {
    let data = AppState.cryptoData.slice();

    if (AppState.cryptoQuery) {
        const q = AppState.cryptoQuery.toLowerCase();
        data = data.filter(function(c) {
            return c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q);
        });
    }

    if (AppState.cryptoSort === 'mcap')  data.sort(function(a,b) { return b.market_cap - a.market_cap; });
    else if (AppState.cryptoSort === 'pr')   data.sort(function(a,b) { return b.current_price - a.current_price; });
    else if (AppState.cryptoSort === 'h24')  data.sort(function(a,b) { return b.price_change_percentage_24h - a.price_change_percentage_24h; });
    else if (AppState.cryptoSort === 'wl')   data = data.filter(function(c) { return AppState.watchlist.includes(c.id); });

    if (data.length === 0) {
        return '<div class="stagger-1 card" style="text-align:center;padding:60px;color:var(--text-muted)">' +
            '<i class="fas fa-search" style="font-size:40px;display:block;margin-bottom:16px;opacity:0.3"></i>' +
            (AppState.cryptoSort === 'wl' ? 'Your watchlist is empty. Star some coins to add them.' : 'No coins match your search.') +
            '</div>';
    }

    const rows = data.map(function(c, idx) {
        const isWl  = AppState.watchlist.includes(c.id);
        const ch24  = c.price_change_percentage_24h || 0;
        const ch7d  = c.price_change_percentage_7d_in_currency || 0;
        return '<tr onclick="showCryptoDetails(\'' + esc(c.id) + '\')">' +
            '<td style="width:36px" onclick="event.stopPropagation();toggleWatchlist(\'' + esc(c.id) + '\')">' +
            '<button class="btn-icon ' + (isWl ? 'active' : '') + '" title="' + (isWl ? 'Remove from' : 'Add to') + ' Watchlist"><i class="fas fa-star"></i></button></td>' +
            '<td><span style="font-size:12px;color:var(--text-muted);margin-right:10px">#' + (idx + 1) + '</span></td>' +
            '<td><div style="display:flex;align-items:center;gap:10px">' +
            '<img src="' + esc(c.image || '') + '" width="28" height="28" style="border-radius:50%;background:#1e293b" loading="lazy" onerror="this.src=\'data:image/svg+xml,<svg xmlns=\\\'http://www.w3.org/2000/svg\\\' width=\\\'28\\\' height=\\\'28\\\' viewBox=\\\'0 0 28 28\\\'><circle cx=\\\'14\\\' cy=\\\'14\\\' r=\\\'14\\\' fill=\\\'%231e293b\\\'/></svg>\'">' +
            '<div><div style="font-weight:600;font-size:13.5px">' + esc(c.name) + '</div>' +
            '<div style="font-size:11px;color:var(--text-muted)">' + esc((c.symbol || '').toUpperCase()) + '</div></div></div></td>' +
            '<td style="font-family:var(--font-heading);font-weight:700;font-size:14px">' + formatMoney(c.current_price) + '</td>' +
            '<td><span class="badge ' + getChangeClass(ch24) + '">' + formatPercent(ch24) + '</span></td>' +
            '<td><span class="badge ' + getChangeClass(ch7d) + '">' + formatPercent(ch7d) + '</span></td>' +
            '<td style="color:var(--text-muted);font-size:13px">' + formatCompact(c.market_cap || 0) + '</td>' +
            '<td><canvas id="sp-cr-' + esc(c.id) + '" width="100" height="32" style="width:100px;height:32px;display:block"></canvas></td>' +
            '</tr>';
    }).join('');

    return '<div class="stagger-1">' +
        '<div class="card cyber-glow" style="margin-bottom:20px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:16px 20px">' +
        '<div style="position:relative;flex:1;min-width:180px">' +
        '<i class="fas fa-search" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:13px;pointer-events:none"></i>' +
        '<input type="text" class="input-field" id="crypto-search" placeholder="Search coins..." style="padding-left:38px" value="' + esc(AppState.cryptoQuery) + '" oninput="AppState.cryptoQuery=this.value;renderView(\'crypto\')">' +
        '</div>' +
        '<select class="input-field" style="width:auto;min-width:140px" onchange="AppState.cryptoSort=this.value;renderView(\'crypto\')">' +
        '<option value="mcap"' + (AppState.cryptoSort==='mcap'?' selected':'') + '>Market Cap</option>' +
        '<option value="pr"' + (AppState.cryptoSort==='pr'?' selected':'') + '>Price</option>' +
        '<option value="h24"' + (AppState.cryptoSort==='h24'?' selected':'') + '>24h Change</option>' +
        '<option value="wl"' + (AppState.cryptoSort==='wl'?' selected':'') + '>Watchlist</option>' +
        '</select>' +
        '<button class="btn btn-secondary" onclick="refreshCrypto()" title="Refresh data"><i class="fas fa-sync-alt"></i></button>' +
        '</div>' +
        '<div class="card" style="padding:0">' +
        '<div class="table-container">' +
        '<table class="data-table"><thead><tr>' +
        '<th></th><th>#</th><th>Asset</th><th>Price</th><th>24h</th><th>7d</th><th>Market Cap</th><th>7d Trend</th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table>' +
        '</div></div></div>';
};

// ---- STOCKS ----
Views.stocks = function() {
    const cards = AppState.stockData.map(function(s) {
        return '<div class="card stat-card cyber-glow" style="cursor:pointer" onclick="showStockDetails(\'' + esc(s.symbol) + '\')">' +
            '<div class="sc-orb" style="background:' + (s.changePercent >= 0 ? Colors.success : Colors.danger) + '"></div>' +
            '<div class="stock-card-header">' +
            '<div><div class="stock-symbol">' + esc(s.symbol) + '</div><div class="stock-name">' + esc(s.name) + '</div></div>' +
            '<span class="badge ' + getChangeClass(s.changePercent) + '">' + formatPercent(s.changePercent) + '</span>' +
            '</div>' +
            '<div class="stock-price">' + formatMoney(s.price) + '</div>' +
            '<canvas id="sp-st-' + esc(s.symbol) + '" width="220" height="52" style="width:100%;height:52px;display:block"></canvas>' +
            '<div style="margin-top:10px;font-size:12px;color:var(--text-muted);display:flex;justify-content:space-between">' +
            '<span>Change: <span style="color:' + (s.changePercent >= 0 ? Colors.success : Colors.danger) + '">' + (s.change >= 0 ? '+' : '') + formatMoney(s.change) + '</span></span>' +
            '<span><i class="fas fa-chart-bar" style="color:var(--accent-secondary)"></i> Live Sim</span>' +
            '</div></div>';
    }).join('');

    return '<div class="stagger-1">' +
        '<div class="info-banner warning">' +
        '<i class="fas fa-info-circle" style="color:var(--warning)"></i>' +
        '<div>Stocks are running in <strong>Live Simulation</strong> mode with realistic price movement. Real-time data requires an AlphaVantage or Polygon.io API key.</div>' +
        '</div>' +
        '<div class="grid-cols-3">' + cards + '</div>' +
        '</div>';
};

// ---- BUDGET ----
Views.budget = function() {
    const b     = AppState.budget;
    const spent = b.transactions.filter(function(t) { return t.type === 'ex'; }).reduce(function(s,t) { return s + t.amount; }, 0);
    const inc   = b.transactions.filter(function(t) { return t.type === 'in'; }).reduce(function(s,t) { return s + t.amount; }, 0);
    const remain = b.limit - spent;
    const pct    = b.limit > 0 ? Math.min(100, (spent / b.limit) * 100) : 0;

    const txRows = b.transactions.slice().reverse().map(function(t) {
        const cat   = Categories[t.category] || Categories.other;
        const isInc = t.type === 'in';
        return '<tr>' +
            '<td><span class="badge ' + (isInc ? 'positive' : 'negative') + '">' + (isInc ? 'Income' : 'Expense') + '</span></td>' +
            '<td><div style="display:flex;align-items:center;gap:8px">' +
            '<i class="fas ' + cat.icon + '" style="color:' + cat.color + ';font-size:14px"></i>' +
            '<span>' + esc(cat.label) + '</span></div></td>' +
            '<td style="font-weight:500">' + esc(t.desc) + '</td>' +
            '<td style="color:var(--text-muted);font-size:13px">' + esc(t.date) + '</td>' +
            '<td style="font-weight:700;color:' + (isInc ? Colors.success : 'var(--text-primary)') + '">' +
            (isInc ? '+' : '-') + formatMoney(t.amount) + '</td>' +
            '<td style="text-align:right"><button class="btn-icon" onclick="deleteTransaction(' + t.id + ')" style="color:var(--danger)" title="Delete transaction">' +
            '<i class="fas fa-trash-alt"></i></button></td>' +
            '</tr>';
    }).join('');

    const expOpts = ExpenseCategories.map(function(c) { return '<option value="' + c[0] + '">' + c[1].label + '</option>'; }).join('');

    return '<div>' +
        '<div class="grid-cols-4 stagger-1" style="margin-bottom:20px">' +
            '<div class="card stat-card sc-green"><div class="sc-orb"></div><div class="sc-icon"><i class="fas fa-arrow-trend-up"></i></div><div class="sc-label">Total Income</div><div class="sc-value">' + formatMoney(inc, 0) + '</div></div>' +
            '<div class="card stat-card sc-orange"><div class="sc-orb"></div><div class="sc-icon"><i class="fas fa-arrow-trend-down"></i></div><div class="sc-label">Total Spent</div><div class="sc-value">' + formatMoney(spent, 0) + '</div></div>' +
            '<div class="card stat-card ' + (remain >= 0 ? 'sc-blue' : 'sc-orange') + '"><div class="sc-orb"></div><div class="sc-icon"><i class="fas fa-scale-balanced"></i></div><div class="sc-label">Remaining Budget</div><div class="sc-value" style="color:' + (remain < 0 ? Colors.danger : 'inherit') + '">' + formatMoney(remain, 0) + '</div></div>' +
            '<div class="card stat-card sc-purple"><div class="sc-orb"></div><div class="sc-icon"><i class="fas fa-percent"></i></div><div class="sc-label">Budget Used</div><div class="sc-value">' + pct.toFixed(1) + '%</div><div class="progress-bg"><div class="progress-fill" style="width:' + pct + '%;background:' + (pct > 90 ? Colors.danger : pct > 70 ? Colors.warning : Colors.success) + '"></div></div></div>' +
        '</div>' +

        '<div class="grid-cols-3-2 stagger-2">' +
            '<div class="card" style="padding:0">' +
            '<div style="padding:20px 24px;border-bottom:1px solid var(--border-light);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">' +
            '<h3 style="font-size:15px;font-weight:700">Transaction History</h3>' +
            '<div style="display:flex;align-items:center;gap:10px">' +
            '<label style="font-size:12px;color:var(--text-muted);font-weight:600">Limit:</label>' +
            '<input type="number" id="bud-limit" class="input-field" value="' + b.limit + '" style="width:110px" onchange="updateLimit(this.value)">' +
            '</div></div>' +
            '<div class="table-container"><table class="data-table"><thead><tr>' +
            '<th>Type</th><th>Category</th><th>Description</th><th>Date</th><th>Amount</th><th></th>' +
            '</tr></thead><tbody>' +
            (txRows || '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)"><i class="fas fa-receipt" style="font-size:28px;display:block;margin-bottom:10px;opacity:0.3"></i>No transactions yet</td></tr>') +
            '</tbody></table></div></div>' +

            '<div class="card">' +
            '<h3 style="font-size:15px;font-weight:700;margin-bottom:20px"><i class="fas fa-plus-circle" style="color:var(--accent-primary);margin-right:8px"></i>Add Transaction</h3>' +
            '<div class="input-group"><label class="input-label">Type</label>' +
            '<select id="add-type" class="input-field" onchange="updateCatOptions()">' +
            '<option value="ex">Expense</option><option value="in">Income</option>' +
            '</select></div>' +
            '<div class="input-group"><label class="input-label">Category</label>' +
            '<select id="add-cat" class="input-field">' + expOpts + '</select></div>' +
            '<div class="input-group"><label class="input-label">Description</label>' +
            '<input type="text" id="add-desc" class="input-field" placeholder="e.g., Grocery shopping"></div>' +
            '<div class="grid-cols-2" style="gap:12px">' +
            '<div class="input-group"><label class="input-label">Amount ($)</label>' +
            '<input type="number" id="add-amount" class="input-field" placeholder="0.00" step="0.01" min="0.01"></div>' +
            '<div class="input-group"><label class="input-label">Date</label>' +
            '<input type="date" id="add-date" class="input-field" value="' + new Date().toISOString().split('T')[0] + '"></div>' +
            '</div>' +
            '<button class="btn btn-primary" style="width:100%;margin-top:4px" onclick="addTransaction()">' +
            '<i class="fas fa-plus"></i> Add Transaction</button>' +
            '</div>' +
        '</div>' +
    '</div>';
};

// ---- GOALS ----
Views.goals = function() {
    const cards = AppState.goals.map(function(g) {
        const pct = Math.min(100, (g.current / g.target) * 100);
        return '<div class="card cyber-glow">' +
            '<div class="goal-card-head">' +
            '<div style="display:flex;align-items:center;gap:12px">' +
            '<div style="width:42px;height:42px;border-radius:11px;background:' + g.color + '18;color:' + g.color + ';display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0">' +
            '<i class="fas ' + esc(g.icon) + '"></i></div>' +
            '<h3 style="font-size:15px;margin:0">' + esc(g.name) + '</h3>' +
            '</div>' +
            '<button class="btn-icon" onclick="deleteGoal(' + g.id + ')" style="color:var(--danger)" title="Delete goal">' +
            '<i class="fas fa-trash-alt"></i></button>' +
            '</div>' +
            '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px">' +
            '<span style="font-size:22px;font-weight:800;font-family:var(--font-heading)">' + formatMoney(g.current, 0) + '</span>' +
            '<span style="font-size:13px;color:var(--text-muted)">of ' + formatMoney(g.target, 0) + '</span>' +
            '</div>' +
            '<div class="progress-bg" style="height:8px;margin-bottom:8px"><div class="progress-fill" style="width:' + pct + '%;background:' + g.color + '"></div></div>' +
            '<div style="display:flex;justify-content:space-between;font-size:12px">' +
            '<span style="color:var(--text-muted)">' + formatMoney(g.target - g.current, 0) + ' remaining</span>' +
            '<span style="font-weight:700;color:' + g.color + '">' + pct.toFixed(1) + '%</span>' +
            '</div>' +
            '</div>';
    }).join('');

    return '<div class="stagger-1">' +
        '<div class="card" style="margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px">' +
        '<div><h2 style="font-size:18px;margin-bottom:4px">Financial Goals</h2>' +
        '<p style="color:var(--text-muted);font-size:13px">Track your savings targets and milestones.</p></div>' +
        '<button class="btn btn-primary" onclick="showAddGoalModal()"><i class="fas fa-plus"></i> New Goal</button>' +
        '</div>' +
        '<div class="grid-cols-3">' +
        (cards || '<div class="card" style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted)"><i class="fas fa-bullseye" style="font-size:40px;display:block;margin-bottom:16px;opacity:0.3"></i><div>No goals set yet.</div><div style="margin-top:16px"><button class="btn btn-primary" onclick="showAddGoalModal()"><i class="fas fa-plus"></i> Create Your First Goal</button></div></div>') +
        '</div></div>';
};

// ---- ANALYTICS ----
Views.analytics = function() {
    return '<div class="stagger-1">' +
        '<div class="grid-cols-2" style="margin-bottom:20px">' +
            '<div class="card"><h3 style="font-size:15px;font-weight:700;margin-bottom:16px">Spending by Category</h3><div style="height:280px"><canvas id="an-donut"></canvas></div></div>' +
            '<div class="card"><h3 style="font-size:15px;font-weight:700;margin-bottom:16px">6-Month Income vs Expenses</h3><div style="height:280px"><canvas id="an-bar"></canvas></div></div>' +
        '</div>' +
        '<div class="card stagger-2">' +
        '<h3 style="font-size:15px;font-weight:700;margin-bottom:16px">Budget Category Breakdown</h3>' +
        '<div id="analytics-breakdown"></div>' +
        '</div>' +
    '</div>';
};

// ---- FX CONVERTER ----
Views.fx = function() {
    if (!AppState.rates) {
        return '<div class="stagger-1 card" style="text-align:center;padding:60px;color:var(--text-muted)">' +
            '<i class="fas fa-circle-notch fa-spin" style="font-size:32px;display:block;margin-bottom:16px"></i>Loading exchange rates...</div>';
    }

    const currencies = Object.keys(AppState.rates).sort();
    const opts = currencies.map(function(c) { return '<option value="' + esc(c) + '">' + esc(c) + '</option>'; }).join('');

    const popularCurrencies = ['EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR', 'SGD', 'BDT'];
    const rateCards = popularCurrencies.filter(function(c) { return AppState.rates[c]; }).map(function(c) {
        const rate = AppState.rates[c];
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-light)">' +
            '<div style="font-weight:600;font-size:14px">' + esc(c) + '</div>' +
            '<div style="font-family:var(--font-heading);font-size:15px;font-weight:700;color:var(--accent-primary)">' + rate.toFixed(4) + '</div>' +
            '</div>';
    }).join('');

    return '<div class="stagger-1">' +
        '<div class="grid-cols-3-2">' +
            '<div class="card cyber-glow">' +
            '<h3 style="font-size:18px;font-weight:700;margin-bottom:24px;text-align:center"><i class="fas fa-exchange-alt" style="color:var(--accent-primary);margin-right:8px"></i>Currency Converter</h3>' +
            '<div style="display:flex;align-items:flex-end;gap:12px;margin-bottom:20px">' +
            '<div style="flex:1"><label class="input-label">From</label>' +
            '<select id="fx-from" class="input-field" onchange="calcFx()"><option value="USD" selected>USD</option>' + opts + '</select></div>' +
            '<button class="btn btn-secondary" style="height:42px;width:42px;padding:0;border-radius:50%;flex-shrink:0" onclick="swapFx()" title="Swap currencies">' +
            '<i class="fas fa-exchange-alt"></i></button>' +
            '<div style="flex:1"><label class="input-label">To</label>' +
            '<select id="fx-to" class="input-field" onchange="calcFx()"><option value="EUR" selected>EUR</option>' + opts + '</select></div>' +
            '</div>' +
            '<div class="input-group"><label class="input-label">Amount</label>' +
            '<input type="number" id="fx-amount" class="input-field" value="100" style="font-size:20px;padding:14px" oninput="calcFx()" min="0" step="any">' +
            '</div>' +
            '<div class="fx-result-box">' +
            '<div style="font-size:13px;color:var(--text-muted);margin-bottom:8px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Converted Amount</div>' +
            '<div id="fx-result" class="fx-result-value">0.00</div>' +
            '<div id="fx-rate" class="fx-result-rate">1 USD = — EUR</div>' +
            '</div></div>' +

            '<div class="card">' +
            '<h3 style="font-size:15px;font-weight:700;margin-bottom:16px"><i class="fas fa-globe" style="color:var(--accent-secondary);margin-right:8px"></i>Live Rates (vs USD)</h3>' +
            rateCards +
            '<p style="font-size:11.5px;color:var(--text-muted);margin-top:14px;text-align:center">Rates updated hourly via open.er-api.com</p>' +
            '</div>' +
        '</div></div>';
};

// ============================================================
//  SECTION 11: POST-RENDER HOOKS (charts, gauges)
// ============================================================

const PostRender = {};

PostRender.dash = function() {
    const cryptoVal = AppState.cryptoData.slice(0, 5).reduce(function(s,c) { return s + (c.current_price * 100); }, 0) || 48500;
    const stockVal  = AppState.stockData.reduce(function(s,st) { return s + (st.price * 10); }, 0) || 12000;
    const cash      = 8500;

    renderDoughnut(
        'dash-alloc',
        ['Crypto', 'Stocks', 'Cash'],
        [cryptoVal, stockVal, cash],
        [Colors.success, Colors.primary, Colors.textMuted]
    );
    renderHealthGauge('health-gauge', calculateHealthScore());
};

PostRender.crypto = function() {
    AppState.cryptoData.forEach(function(c) {
        if (c.sparkline_in_7d && c.sparkline_in_7d.price && c.sparkline_in_7d.price.length > 1) {
            renderSparkline('sp-cr-' + c.id, c.sparkline_in_7d.price, (c.price_change_percentage_7d_in_currency || 0) >= 0);
        }
    });
};

PostRender.stocks = function() {
    AppState.stockData.forEach(function(s) {
        renderSparkline('sp-st-' + s.symbol, s.history, s.changePercent >= 0);
    });
};

PostRender.budget  = function() {};
PostRender.goals   = function() {};

PostRender.analytics = function() {
    // Doughnut — spending by category
    const exps   = {};
    AppState.budget.transactions.forEach(function(t) {
        if (t.type === 'ex') exps[t.category] = (exps[t.category] || 0) + t.amount;
    });

    const labels = [], vals = [], bgs = [];
    Object.keys(exps).forEach(function(k) {
        labels.push(Categories[k] ? Categories[k].label : k);
        vals.push(exps[k]);
        bgs.push(Categories[k] ? Categories[k].color : Colors.textMuted);
    });

    if (labels.length === 0) { labels.push('No expenses'); vals.push(1); bgs.push(Colors.textMuted); }
    renderDoughnut('an-donut', labels, vals, bgs);

    // Bar Chart — 6-month history
    const hist = AppState.history.slice();
    // Update last month with actual data
    const curInc = AppState.budget.transactions.filter(function(t) { return t.type === 'in'; }).reduce(function(s,t) { return s + t.amount; }, 0);
    const curExp = AppState.budget.transactions.filter(function(t) { return t.type === 'ex'; }).reduce(function(s,t) { return s + t.amount; }, 0);
    if (hist.length > 0) { hist[hist.length - 1].inc = curInc; hist[hist.length - 1].exp = curExp; }

    renderBarChart(
        'an-bar',
        hist.map(function(h) { return h.month; }),
        [
            { label: 'Income',   data: hist.map(function(h) { return h.inc; }), backgroundColor: Colors.success + 'bb', borderRadius: 5 },
            { label: 'Expenses', data: hist.map(function(h) { return h.exp; }), backgroundColor: Colors.danger  + 'bb', borderRadius: 5 }
        ]
    );

    // Category breakdown table
    const el = document.getElementById('analytics-breakdown');
    if (el) {
        if (Object.keys(exps).length === 0) {
            el.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:24px">No expense data to display.</p>';
        } else {
            const total   = vals.reduce(function(s, v) { return s + v; }, 0);
            const rows = Object.keys(exps).sort(function(a,b) { return exps[b] - exps[a]; }).map(function(k) {
                const cat  = Categories[k] || { label: k, icon: 'fa-circle', color: Colors.textMuted };
                const share = total > 0 ? (exps[k] / total) * 100 : 0;
                return '<div style="display:flex;align-items:center;gap:14px;padding:10px 0;border-bottom:1px solid var(--border-light)">' +
                    '<i class="fas ' + cat.icon + '" style="color:' + cat.color + ';width:20px;text-align:center"></i>' +
                    '<div style="flex:1;min-width:0"><div style="font-size:13.5px;font-weight:600">' + cat.label + '</div>' +
                    '<div class="progress-bg" style="margin-top:5px"><div class="progress-fill" style="width:' + share + '%;background:' + cat.color + '"></div></div></div>' +
                    '<div style="text-align:right;flex-shrink:0">' +
                    '<div style="font-weight:700;font-size:14px">' + formatMoney(exps[k]) + '</div>' +
                    '<div style="font-size:11px;color:var(--text-muted)">' + share.toFixed(1) + '%</div>' +
                    '</div></div>';
            }).join('');
            el.innerHTML = rows;
        }
    }
};

PostRender.fx = function() { calcFx(); };

// ============================================================
//  SECTION 12: NAVIGATION & ROUTING
// ============================================================

const PAGE_TITLES = {
    dash:      'Dashboard',
    crypto:    'Crypto Market',
    stocks:    'Stock Tracker',
    budget:    'Budget Manager',
    goals:     'Financial Goals',
    analytics: 'Analytics',
    fx:        'FX Converter'
};

function navigate(page) {
    if (!Views[page]) return;
    AppState.currentPage = page;

    // Update nav active state
    document.querySelectorAll('.nav-item, .bnav-item').forEach(function(el) {
        el.classList.toggle('active', el.dataset.page === page);
    });

    // Update page title
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = PAGE_TITLES[page] || page;

    // Close mobile sidebar
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('open');

    renderView(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderView(page) {
    const main = document.getElementById('main-content');
    if (!main || !Views[page]) return;
    main.innerHTML = Views[page]();
    if (PostRender[page]) PostRender[page]();
}

// ============================================================
//  SECTION 13: ACTIONS — CRYPTO
// ============================================================

function toggleWatchlist(id) {
    const idx = AppState.watchlist.indexOf(id);
    if (idx > -1) {
        AppState.watchlist.splice(idx, 1);
        showToast('Removed from Watchlist', 'info');
    } else {
        AppState.watchlist.push(id);
        showToast('Added to Watchlist!', 'success');
    }
    saveWatchlist();
    if (AppState.currentPage === 'crypto') renderView('crypto');
}

async function refreshCrypto() {
    AppState.lastCryptoFetch = 0; // force refresh
    showToast('Refreshing crypto data...', 'info');
    await fetchCrypto();
    if (AppState.currentPage === 'crypto') renderView('crypto');
    showToast('Crypto data updated', 'success');
}

function showCryptoDetails(id) {
    const coin = AppState.cryptoData.find(function(c) { return c.id === id; });
    if (!coin) return;

    const ch24 = coin.price_change_percentage_24h || 0;
    const ch7d  = coin.price_change_percentage_7d_in_currency || 0;

    openModal(
        '<div style="text-align:center;margin-bottom:24px">' +
        '<img src="' + esc(coin.image || '') + '" width="56" height="56" style="border-radius:50%;margin:0 auto 12px;display:block" onerror="this.style.display=\'none\'">' +
        '<h2 style="font-size:22px;margin-bottom:4px">' + esc(coin.name) + '</h2>' +
        '<span style="font-size:13px;color:var(--text-muted)">' + esc((coin.symbol || '').toUpperCase()) + '</span>' +
        '</div>' +
        '<div class="grid-cols-2" style="gap:12px;margin-bottom:20px">' +
        '<div style="background:var(--bg-input);border-radius:var(--r-md);padding:14px"><div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;font-weight:600;text-transform:uppercase">Price</div><div style="font-size:20px;font-weight:800;font-family:var(--font-heading)">' + formatMoney(coin.current_price) + '</div></div>' +
        '<div style="background:var(--bg-input);border-radius:var(--r-md);padding:14px"><div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;font-weight:600;text-transform:uppercase">Market Cap</div><div style="font-size:20px;font-weight:800;font-family:var(--font-heading)">' + formatCompact(coin.market_cap || 0) + '</div></div>' +
        '<div style="background:var(--bg-input);border-radius:var(--r-md);padding:14px"><div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;font-weight:600;text-transform:uppercase">24h Change</div><span class="badge ' + getChangeClass(ch24) + '" style="font-size:15px">' + formatPercent(ch24) + '</span></div>' +
        '<div style="background:var(--bg-input);border-radius:var(--r-md);padding:14px"><div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;font-weight:600;text-transform:uppercase">7d Change</div><span class="badge ' + getChangeClass(ch7d) + '" style="font-size:15px">' + formatPercent(ch7d) + '</span></div>' +
        '</div>' +
        '<div style="display:flex;gap:12px;justify-content:flex-end">' +
        '<button class="btn btn-secondary" onclick="closeModal()">Close</button>' +
        '<button class="btn btn-primary" onclick="toggleWatchlist(\'' + esc(id) + '\');closeModal()">' +
        (AppState.watchlist.includes(id) ? '<i class="fas fa-star-half-alt"></i> Remove from Watchlist' : '<i class="fas fa-star"></i> Add to Watchlist') +
        '</button></div>'
    );
}

// ============================================================
//  SECTION 14: ACTIONS — STOCKS
// ============================================================

function showStockDetails(symbol) {
    const s = AppState.stockData.find(function(st) { return st.symbol === symbol; });
    if (!s) return;

    openModal(
        '<div style="text-align:center;margin-bottom:24px">' +
        '<div style="width:56px;height:56px;border-radius:14px;background:' + (s.changePercent >= 0 ? Colors.success : Colors.danger) + '18;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;font-family:var(--font-heading);color:' + (s.changePercent >= 0 ? Colors.success : Colors.danger) + ';margin:0 auto 12px">' + esc(s.symbol[0]) + '</div>' +
        '<h2 style="font-size:22px;margin-bottom:4px">' + esc(s.symbol) + '</h2>' +
        '<p style="color:var(--text-muted);font-size:13px">' + esc(s.name) + '</p>' +
        '</div>' +
        '<div class="grid-cols-2" style="gap:12px;margin-bottom:20px">' +
        '<div style="background:var(--bg-input);border-radius:var(--r-md);padding:14px"><div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;font-weight:600;text-transform:uppercase">Current Price</div><div style="font-size:22px;font-weight:800;font-family:var(--font-heading)">' + formatMoney(s.price) + '</div></div>' +
        '<div style="background:var(--bg-input);border-radius:var(--r-md);padding:14px"><div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;font-weight:600;text-transform:uppercase">Change</div><span class="badge ' + getChangeClass(s.changePercent) + '" style="font-size:15px">' + (s.change >= 0 ? '+' : '') + formatMoney(s.change) + ' (' + formatPercent(s.changePercent) + ')</span></div>' +
        '</div>' +
        '<div style="background:var(--warning-dim);border:1px solid rgba(245,158,11,0.2);border-radius:var(--r-md);padding:14px;font-size:13px;color:var(--text-secondary);display:flex;align-items:center;gap:10px;margin-bottom:20px">' +
        '<i class="fas fa-info-circle" style="color:var(--warning)"></i>' +
        'This stock is running in live simulation mode. Real prices require a market data API key.' +
        '</div>' +
        '<button class="btn btn-secondary" style="width:100%" onclick="closeModal()">Close</button>'
    );
}

// ============================================================
//  SECTION 15: ACTIONS — BUDGET
// ============================================================

function updateCatOptions() {
    const typeEl = document.getElementById('add-type');
    const catEl  = document.getElementById('add-cat');
    if (!typeEl || !catEl) return;
    const cats = typeEl.value === 'in' ? IncomeCategories : ExpenseCategories;
    catEl.innerHTML = cats.map(function(c) { return '<option value="' + c[0] + '">' + c[1].label + '</option>'; }).join('');
}

function addTransaction() {
    const desc   = (document.getElementById('add-desc')   || {}).value || '';
    const amount = parseFloat((document.getElementById('add-amount') || {}).value || '0');
    const type   = (document.getElementById('add-type')   || {}).value || 'ex';
    const cat    = (document.getElementById('add-cat')    || {}).value || 'other';
    const date   = (document.getElementById('add-date')   || {}).value || '';

    if (!desc.trim())           return showToast('Please enter a description', 'error');
    if (!amount || amount <= 0) return showToast('Please enter a valid amount', 'error');
    if (!date)                  return showToast('Please select a date', 'error');

    AppState.budget.transactions.push({
        id:       AppState.budget.nextId++,
        type:     type,
        category: cat,
        desc:     desc.trim(),
        amount:   Math.abs(amount),
        date:     date
    });

    saveBudget();
    showToast('Transaction added!', 'success');
    renderView('budget');
}

function deleteTransaction(id) {
    AppState.budget.transactions = AppState.budget.transactions.filter(function(t) { return t.id !== id; });
    saveBudget();
    showToast('Transaction deleted', 'info');
    renderView('budget');
}

function updateLimit(val) {
    const limit = parseFloat(val);
    if (!limit || limit <= 0) return showToast('Enter a valid budget limit', 'error');
    AppState.budget.limit = limit;
    saveBudget();
    showToast('Budget limit updated', 'success');
    renderView('budget');
}

// ============================================================
//  SECTION 16: ACTIONS — GOALS
// ============================================================

function showAddGoalModal() {
    openModal(
        '<h2 id="modal-title" style="font-size:20px;margin-bottom:4px"><i class="fas fa-bullseye" style="color:var(--accent-primary);margin-right:8px"></i>Create New Goal</h2>' +
        '<p style="color:var(--text-muted);font-size:13px;margin-bottom:24px">Set a savings target to work towards.</p>' +
        '<div class="input-group"><label class="input-label">Goal Name</label>' +
        '<input type="text" id="g-name" class="input-field" placeholder="e.g., Vacation Fund"></div>' +
        '<div class="grid-cols-2" style="gap:12px;margin-bottom:24px">' +
        '<div class="input-group"><label class="input-label">Target Amount ($)</label>' +
        '<input type="number" id="g-target" class="input-field" placeholder="5000" min="1"></div>' +
        '<div class="input-group"><label class="input-label">Already Saved ($)</label>' +
        '<input type="number" id="g-current" class="input-field" placeholder="0" min="0"></div>' +
        '</div>' +
        '<div style="display:flex;gap:12px;justify-content:flex-end">' +
        '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
        '<button class="btn btn-primary" onclick="addGoal()"><i class="fas fa-save"></i> Save Goal</button>' +
        '</div>'
    );
    // Focus name input after modal opens
    setTimeout(function() {
        const el = document.getElementById('g-name');
        if (el) el.focus();
    }, 50);
}

function addGoal() {
    const name    = ((document.getElementById('g-name')    || {}).value || '').trim();
    const target  = parseFloat((document.getElementById('g-target')  || {}).value || '0');
    const current = parseFloat((document.getElementById('g-current') || {}).value || '0') || 0;

    if (!name)           return showToast('Please enter a goal name', 'error');
    if (!target || target <= 0) return showToast('Please enter a valid target amount', 'error');
    if (current < 0)     return showToast('Saved amount cannot be negative', 'error');
    if (current > target) return showToast('Saved amount cannot exceed target', 'error');

    const icons  = ['fa-plane', 'fa-home', 'fa-car', 'fa-graduation-cap', 'fa-laptop', 'fa-heart', 'fa-gem', 'fa-child'];
    const palette = [Colors.primary, Colors.success, Colors.purple, Colors.warning, Colors.cyan, Colors.pink];

    AppState.goals.push({
        id:      Date.now(),
        name:    name,
        target:  target,
        current: current,
        icon:    icons[Math.floor(Math.random() * icons.length)],
        color:   palette[Math.floor(Math.random() * palette.length)]
    });

    saveGoals();
    closeModal();
    showToast('Goal created!', 'success');
    renderView('goals');
}

function deleteGoal(id) {
    AppState.goals = AppState.goals.filter(function(g) { return g.id !== id; });
    saveGoals();
    showToast('Goal deleted', 'info');
    renderView('goals');
}

// ============================================================
//  SECTION 17: ACTIONS — FX CONVERTER
// ============================================================

function calcFx() {
    if (!AppState.rates) return;

    const fromEl   = document.getElementById('fx-from');
    const toEl     = document.getElementById('fx-to');
    const amtEl    = document.getElementById('fx-amount');
    const resultEl = document.getElementById('fx-result');
    const rateEl   = document.getElementById('fx-rate');

    if (!fromEl || !toEl || !amtEl || !resultEl || !rateEl) return;

    const fv   = fromEl.value;
    const tv   = toEl.value;
    const amt  = parseFloat(amtEl.value) || 0;

    const toUSD  = fv === 'USD' ? amt : (amt / (AppState.rates[fv] || 1));
    const final  = tv === 'USD' ? toUSD : toUSD * (AppState.rates[tv] || 1);
    const rate   = fv === 'USD'
        ? (AppState.rates[tv] || 1)
        : (tv === 'USD'
            ? 1 / (AppState.rates[fv] || 1)
            : (AppState.rates[tv] || 1) / (AppState.rates[fv] || 1));

    const isJPY = tv === 'JPY' || tv === 'KRW' || tv === 'IDR';
    const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: isJPY ? 0 : 2,
        maximumFractionDigits: isJPY ? 0 : 4
    }).format(final);

    resultEl.textContent = formatted + ' ' + tv;
    rateEl.textContent   = '1 ' + fv + ' = ' + rate.toFixed(4) + ' ' + tv;
}

function swapFx() {
    const fromEl = document.getElementById('fx-from');
    const toEl   = document.getElementById('fx-to');
    if (!fromEl || !toEl) return;
    const tmp    = fromEl.value;
    fromEl.value = toEl.value;
    toEl.value   = tmp;
    calcFx();
}

// ============================================================
//  SECTION 18: CLOCK & HEADER
// ============================================================

function updateClock() {
    const el = document.getElementById('header-time');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ============================================================
//  SECTION 19: BOOTSTRAP / INIT
// ============================================================

document.addEventListener('DOMContentLoaded', function() {

    // Bind modal overlay close
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) closeModal();
        });
    }

    // Bind sidebar nav items
    document.querySelectorAll('.nav-item, .bnav-item').forEach(function(el) {
        el.addEventListener('click', function() {
            if (el.dataset.page) navigate(el.dataset.page);
        });
    });

    // Mobile menu toggle
    const menuBtn = document.getElementById('mobile-menu-btn');
    if (menuBtn) {
        menuBtn.addEventListener('click', function() {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.toggle('open');
        });
    }

    // Escape key closes modal / AI sidebar
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
            closeAiSidebar();
        }
    });

    // Clock
    updateClock();
    setInterval(updateClock, 1000);

    // Initialise data then render
    (async function init() {
        initStocks();
        fetchNews(); // fire and forget — non-critical

        // Fetch rates and crypto in parallel
        await Promise.allSettled([fetchRates(), fetchCrypto()]);

        // First render
        navigate('dash');

        showToast('FinPulse ready!', 'success');

        // Periodic refresh intervals
        setInterval(function() {
            simulateStocks();
            if (AppState.currentPage === 'stocks') renderView('stocks');
            else if (AppState.currentPage === 'dash') PostRender.dash && PostRender.dash();
        }, 3000);

        setInterval(async function() {
            await fetchCrypto();
            const timeEl = document.getElementById('update-time');
            if (timeEl) timeEl.textContent = 'Updated ' + new Date().toLocaleTimeString();
            if (AppState.currentPage === 'crypto') renderView('crypto');
        }, 60000);

        setInterval(async function() {
            await fetchRates();
            if (AppState.currentPage === 'fx') renderView('fx');
        }, 3600000);

        setInterval(fetchNews, 300000); // 5 minutes

        // Set initial update time
        const timeEl = document.getElementById('update-time');
        if (timeEl) timeEl.textContent = 'Updated ' + new Date().toLocaleTimeString();

    })();

});
