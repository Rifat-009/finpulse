// --- State Management ---
const AppState = {
    currentPage: 'dash',
    cryptoData: [],
    cryptoQuery: '',
    cryptoSort: 'mcap',
    stockData: [],
    rates: null,
    watchlist: JSON.parse(localStorage.getItem('fp_watchlist')) || ['bitcoin', 'ethereum', 'solana'],
    budget: JSON.parse(localStorage.getItem('fp_budget')) || initializeBudget(),
    goals: JSON.parse(localStorage.getItem('fp_goals')) || initializeGoals(),
    charts: {},
    history: generateHistory(),
    news: [],
    lastCryptoFetch: 0,
    lastRatesFetch: 0
};

// Colors matching CSS
const Colors = {
    success: '#10b981', danger: '#ef4444', primary: '#3b82f6',
    warning: '#f59e0b', purple: '#8b5cf6', surface: '#0f172a',
    border: 'rgba(255, 255, 255, 0.1)', textMuted: '#94a3b8'
};

const Categories = {
    housing: { label: 'Housing', icon: 'fa-home', color: Colors.primary },
    food: { label: 'Food & Dining', icon: 'fa-utensils', color: Colors.warning },
    transport: { label: 'Transport', icon: 'fa-car', color: '#06b6d4' },
    entertainment: { label: 'Entertainment', icon: 'fa-gamepad', color: Colors.purple },
    shopping: { label: 'Shopping', icon: 'fa-bag-shopping', color: '#ec4899' },
    healthcare: { label: 'Healthcare', icon: 'fa-heart-pulse', color: Colors.danger },
    utilities: { label: 'Utilities', icon: 'fa-bolt', color: '#f97316' },
    subscriptions: { label: 'Subscriptions', icon: 'fa-repeat', color: '#8b5cf6' },
    other: { label: 'Other', icon: 'fa-ellipsis', color: Colors.textMuted },
    salary: { label: 'Salary', icon: 'fa-briefcase', color: Colors.success },
    freelance: { label: 'Freelance', icon: 'fa-laptop-code', color: Colors.warning }
};

const ExpenseCategories = Object.entries(Categories).filter(([k]) => !['salary', 'freelance'].includes(k));
const IncomeCategories = Object.entries(Categories).filter(([k]) => ['salary', 'freelance'].includes(k));

// Fallbacks
const FallbackCrypto = [
    { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 97500, price_change_percentage_24h: 1.8, price_change_percentage_7d_in_currency: 5.2, market_cap: 1920000000000, total_volume: 42000000000, image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
    { id: 'ethereum', symbol: 'eth', name: 'Ethereum', current_price: 3450, price_change_percentage_24h: 2.5, price_change_percentage_7d_in_currency: 8.1, market_cap: 415000000000, total_volume: 18000000000, image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
    { id: 'solana', symbol: 'sol', name: 'Solana', current_price: 185, price_change_percentage_24h: -1.2, price_change_percentage_7d_in_currency: 12.4, market_cap: 82000000000, total_volume: 3200000000, image: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' }
];

const FallbackStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 232.5, change: 3.2, changePercent: 1.39, mcap: 3580000000000, history: generateSparkline(228) },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 442.8, change: 5.1, changePercent: 1.17, mcap: 3290000000000, history: generateSparkline(436) },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 135.2, change: -2.4, changePercent: -1.75, mcap: 3320000000000, history: generateSparkline(139) }
];

// --- Utilities ---
function saveBudget() { localStorage.setItem('fp_budget', JSON.stringify(AppState.budget)); }
function saveWatchlist() { localStorage.setItem('fp_watchlist', JSON.stringify(AppState.watchlist)); }
function saveGoals() { localStorage.setItem('fp_goals', JSON.stringify(AppState.goals)); }

function formatMoney(amount, decimals = 2) {
    if(amount == null || isNaN(amount)) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: decimals }).format(amount);
}
function formatCompact(num) {
    if (num >= 1e12) return '$' + (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return '$' + (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return '$' + (num / 1e6).toFixed(2) + 'M';
    return formatMoney(num, 0);
}
function formatPercent(val) { return (val >= 0 ? '+' : '') + Number(val).toFixed(2) + '%'; }
function getChangeClass(val) { return val >= 0 ? 'positive' : 'negative'; }

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'fadeOutLeft 0.3s forwards'; setTimeout(() => toast.remove(), 300); }, 3000);
}

function openModal(html) { document.getElementById('modal-content').innerHTML = html; document.getElementById('modal-overlay').classList.add('show'); }
function closeModal() { document.getElementById('modal-overlay').classList.remove('show'); }
document.getElementById('modal-overlay').addEventListener('click', (e) => { if (e.target.id === 'modal-overlay') closeModal(); });

function openAiSidebar() { 
    document.getElementById('ai-sidebar').classList.add('open');
    document.getElementById('ai-sidebar-overlay').classList.add('show');
    generateInsights();
}
function closeAiSidebar() { 
    document.getElementById('ai-sidebar').classList.remove('open');
    document.getElementById('ai-sidebar-overlay').classList.remove('show');
}

// --- Initialization ---
function generateSparkline(base, points = 50, vol = 0.015) {
    let data = [base];
    for(let i=1; i<points; i++) data.push(data[i-1] * (1 + (Math.random() - 0.48) * vol));
    return data;
}

function initializeBudget() {
    const d = new Date();
    const fmt = (day) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return {
        limit: 4000, nextId: 6,
        transactions: [
            { id: 1, type: 'in', category: 'salary', desc: 'Monthly Salary', amount: 6500, date: fmt(1) },
            { id: 2, type: 'ex', category: 'housing', desc: 'Rent', amount: 1800, date: fmt(2) },
            { id: 3, type: 'ex', category: 'utilities', desc: 'Electric Bill', amount: 150, date: fmt(5) },
            { id: 4, type: 'ex', category: 'food', desc: 'Groceries', amount: 350, date: fmt(8) },
            { id: 5, type: 'ex', category: 'subscriptions', desc: 'Software Subs', amount: 45, date: fmt(10) }
        ]
    };
}

function initializeGoals() {
    return [
        { id: 1, name: 'Emergency Fund', target: 20000, current: 12500, icon: 'fa-shield-alt', color: Colors.success },
        { id: 2, name: 'New Car Downpayment', target: 10000, current: 3200, icon: 'fa-car', color: Colors.primary }
    ];
}

function generateHistory() {
    let hist = [];
    for(let i=5; i>=0; i--) {
        let d = new Date(); d.setMonth(d.getMonth() - i);
        hist.push({ month: d.toLocaleString('default', { month: 'short' }), inc: Math.round(5000 + Math.random() * 2000), exp: Math.round(2000 + Math.random() * 1500) });
    }
    return hist;
}

// --- Data Fetching ---
async function fetchNews() {
    // Free RSS to JSON proxy to get Coindesk News
    try {
        const res = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://www.coindesk.com/arc/outboundfeeds/rss/');
        const data = await res.json();
        if(data.status === 'ok') {
            AppState.news = data.items.slice(0, 10);
            updateTicker();
        }
    } catch(e) { console.log('News fetch failed', e); }
}

function updateTicker() {
    const content = document.getElementById('ticker-content');
    if(!AppState.news.length) return;
    content.innerHTML = AppState.news.map(n => `<span class="ticker-item"><i class="fas fa-circle" style="font-size:6px; color:var(--accent-primary)"></i> ${n.title}</span>`).join('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
}

async function fetchCrypto() {
    const now = Date.now();
    if (now - AppState.lastCryptoFetch < 60000 && AppState.cryptoData.length > 0) return;
    try {
        const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=24h%2C7d');
        const data = await res.json();
        AppState.cryptoData = data.map(c => {
            if (!c.sparkline_in_7d) c.sparkline_in_7d = { price: generateSparkline(c.current_price, 168) };
            return c;
        });
        document.getElementById('status-text').textContent = 'Live \u00b7 CoinGecko';
        document.querySelector('.pulse-dot').style.backgroundColor = Colors.success;
    } catch(e) {
        if(AppState.cryptoData.length === 0) AppState.cryptoData = FallbackCrypto.map(c => ({...c, sparkline_in_7d: { price: generateSparkline(c.current_price, 168) }}));
        document.getElementById('status-text').textContent = 'Cached \u00b7 CoinGecko';
        document.querySelector('.pulse-dot').style.backgroundColor = Colors.warning;
    }
    AppState.lastCryptoFetch = now;
}

async function fetchRates() {
    const now = Date.now();
    if (now - AppState.lastRatesFetch < 3600000 && AppState.rates) return;
    try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        if(data.result === 'success') AppState.rates = data.rates;
    } catch(e) { AppState.rates = { EUR:0.92, GBP:0.79, JPY:149.5, CAD:1.36, AUD:1.53, CHF:0.88 }; }
    AppState.lastRatesFetch = now;
}

function initStocks() { AppState.stockData = JSON.parse(JSON.stringify(FallbackStocks)); }
function simulateStocks() {
    AppState.stockData.forEach(s => {
        let diff = (Math.random() - 0.48) * s.price * 0.002;
        s.price = Math.max(1, s.price + diff);
        s.change += diff;
        s.changePercent = (s.change / (s.price - s.change)) * 100;
        s.history.push(s.price);
        if(s.history.length > 60) s.history.shift();
    });
}

// --- Pulse AI Insight Engine ---
function calculateHealthScore() {
    let score = 100;
    const spent = AppState.budget.transactions.filter(t => t.type === 'ex').reduce((s,t)=>s+t.amount,0);
    const inc = AppState.budget.transactions.filter(t => t.type === 'in').reduce((s,t)=>s+t.amount,0);
    
    // Budget Penalty
    if(spent > AppState.budget.limit) score -= 30;
    else if(spent > AppState.budget.limit * 0.8) score -= 15;
    
    // Savings Rate (Penalty if < 10%)
    if(inc > 0) {
        const saveRate = ((inc - spent) / inc) * 100;
        if(saveRate < 10) score -= 20;
        if(saveRate > 30) score = Math.min(100, score + 10);
    }
    return Math.max(0, Math.round(score));
}

function generateInsights() {
    const container = document.getElementById('ai-content');
    container.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted)"><i class="fas fa-circle-notch fa-spin"></i> Analyzing...</div>';
    
    setTimeout(() => {
        let insights = [];
        
        // 1. Budget Insight
        const spent = AppState.budget.transactions.filter(t => t.type === 'ex').reduce((s,t)=>s+t.amount,0);
        const limit = AppState.budget.limit;
        const pct = (spent / limit) * 100;
        if(pct > 90) {
            insights.push(`<div class="insight-card warning"><div class="insight-icon" style="color:var(--danger)"><i class="fas fa-exclamation-triangle"></i> Budget Alert</div><div class="insight-text">You have used <b>${pct.toFixed(1)}%</b> of your monthly budget. Consider halting non-essential spending.</div></div>`);
        } else if(pct < 50 && new Date().getDate() > 20) {
            insights.push(`<div class="insight-card success"><div class="insight-icon" style="color:var(--success)"><i class="fas fa-thumbs-up"></i> Great Saving</div><div class="insight-text">You're significantly under budget this month. Consider transferring the surplus to your Emergency Fund goal.</div></div>`);
        }
        
        // 2. Crypto Insight
        if(AppState.cryptoData.length > 0) {
            const btc = AppState.cryptoData.find(c => c.id === 'bitcoin');
            if(btc && btc.price_change_percentage_24h < -5) {
                insights.push(`<div class="insight-card warning"><div class="insight-icon" style="color:var(--warning)"><i class="fas fa-chart-line"></i> Market Volatility</div><div class="insight-text">Bitcoin is down <b>${Math.abs(btc.price_change_percentage_24h).toFixed(2)}%</b> today. High volatility detected across the crypto market. Avoid panic selling.</div></div>`);
            } else if (btc && btc.price_change_percentage_24h > 5) {
                insights.push(`<div class="insight-card success"><div class="insight-icon" style="color:var(--success)"><i class="fas fa-rocket"></i> Market Rally</div><div class="insight-text">Bitcoin is up <b>${btc.price_change_percentage_24h.toFixed(2)}%</b> today. Crypto markets are rallying.</div></div>`);
            }
        }
        
        // 3. Subscriptions Insight
        const subs = AppState.budget.transactions.filter(t => t.category === 'subscriptions').reduce((s,t)=>s+t.amount,0);
        if(subs > 100) {
            insights.push(`<div class="insight-card"><div class="insight-icon" style="color:var(--purple)"><i class="fas fa-repeat"></i> Subscription Check</div><div class="insight-text">You are spending <b>${formatMoney(subs)}</b> on subscriptions. Review your recurring payments to see if any can be cancelled.</div></div>`);
        }
        
        // 4. Goals Insight
        if(AppState.goals.length > 0) {
            const g = AppState.goals[0];
            const gp = (g.current / g.target) * 100;
            if(gp > 80) {
                insights.push(`<div class="insight-card success"><div class="insight-icon" style="color:var(--success)"><i class="fas fa-bullseye"></i> Goal Nearing</div><div class="insight-text">You are <b>${gp.toFixed(0)}%</b> of the way to your "${g.name}" goal. Keep it up!</div></div>`);
            }
        }

        if(insights.length === 0) {
            insights.push(`<div class="insight-card"><div class="insight-icon" style="color:var(--accent-primary)"><i class="fas fa-check"></i> All Good</div><div class="insight-text">Your finances are looking stable. Keep tracking your expenses and maintaining your portfolio.</div></div>`);
        }
        
        container.innerHTML = insights.join('');
    }, 800); // simulate thinking
}

// --- Charting ---
Chart.defaults.color = Colors.textMuted;
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.9)';
Chart.defaults.plugins.tooltip.borderColor = Colors.border;

function destroyChart(id) {
    if(AppState.charts[id]) { AppState.charts[id].destroy(); delete AppState.charts[id]; }
}

function renderSparkline(canvasId, data, isPositive) {
    const canvas = document.getElementById(canvasId);
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const color = isPositive ? Colors.success : Colors.danger;
    const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
    const step = canvas.width / (data.length - 1);
    
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2;
    for(let i=0; i<data.length; i++) {
        const x = i * step, y = canvas.height - ((data[i] - min) / range) * (canvas.height - 4) - 2;
        if(i===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.lineTo(canvas.width, canvas.height); ctx.lineTo(0, canvas.height); ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, color + '40'); grad.addColorStop(1, color + '00');
    ctx.fillStyle = grad; ctx.fill();
}

function renderDoughnut(id, labels, data, colors) {
    destroyChart(id);
    const ctx = document.getElementById(id);
    if(!ctx) return;
    AppState.charts[id] = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'right', labels: { color: Colors.textMuted } } } }
    });
}

function renderHealthGauge(id, score) {
    const svg = document.getElementById(id);
    if(!svg) return;
    const circle = svg.querySelector('.score-circle-prog');
    if(!circle) return;
    
    // Circumference = 2 * pi * r (r=40) = 251.2
    const circ = 251.2;
    const offset = circ - (score / 100) * circ;
    
    let color = Colors.success;
    if(score < 50) color = Colors.danger;
    else if(score < 80) color = Colors.warning;
    
    circle.style.stroke = color;
    setTimeout(() => { circle.style.strokeDasharray = `${circ - offset} ${circ}`; }, 100);
}

// --- Views ---
const Views = {
    dash: () => {
        let cryptoVal = AppState.cryptoData.slice(0, 5).reduce((s, c) => s + (c.current_price * 100), 0) || 50000;
        let stockVal = AppState.stockData.reduce((s, st) => s + (st.price * 10), 0) || 15000;
        let totalVal = cryptoVal + stockVal + 10000;
        let spent = AppState.budget.transactions.filter(t => t.type === 'ex').reduce((s, t) => s + t.amount, 0);
        let score = calculateHealthScore();
        
        let txHtml = AppState.budget.transactions.slice(-4).reverse().map(t => {
            const cat = Categories[t.category] || Categories.other;
            const isInc = t.type === 'in';
            return `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid var(--border-light)">
                <div style="display:flex; align-items:center; gap:12px">
                    <div style="width:40px; height:40px; border-radius:10px; background:${isInc ? Colors.success+'15' : cat.color+'15'}; display:flex; align-items:center; justify-content:center; color:${isInc ? Colors.success : cat.color}">
                        <i class="fas ${cat.icon}"></i>
                    </div>
                    <div><div style="font-weight:600; font-size:14px">${t.desc}</div><div style="font-size:12px; color:var(--text-muted)">${cat.label} &middot; ${t.date}</div></div>
                </div>
                <div style="font-weight:600; font-size:15px; color:${isInc ? Colors.success : 'var(--text-primary)'}">${isInc ? '+' : '-'}${formatMoney(t.amount)}</div>
            </div>`;
        }).join('');

        return `
        <div>
            <div class="grid-cols-4 stagger-1" style="margin-bottom: 24px;">
                <div class="card stat-card sc-green cyber-glow">
                    <div class="sc-icon"><i class="fas fa-wallet"></i></div>
                    <div class="sc-label">Net Worth</div>
                    <div class="sc-value">${formatMoney(totalVal)}</div>
                </div>
                <div class="card stat-card sc-blue cyber-glow">
                    <div class="sc-icon"><i class="fas fa-chart-line"></i></div>
                    <div class="sc-label">Investments</div>
                    <div class="sc-value">${formatMoney(cryptoVal + stockVal)}</div>
                </div>
                <div class="card stat-card sc-purple cyber-glow">
                    <div class="sc-icon"><i class="fas fa-credit-card"></i></div>
                    <div class="sc-label">Monthly Spent</div>
                    <div class="sc-value">${formatMoney(spent)}</div>
                </div>
                <div class="card stat-card sc-orange cyber-glow" style="display:flex; align-items:center; justify-content:space-between; padding:20px">
                    <div>
                        <div class="sc-label">Health Score</div>
                        <div class="sc-value">${score}<span style="font-size:16px; color:var(--text-muted)">/100</span></div>
                    </div>
                    <svg id="health-gauge" width="90" height="90" viewBox="0 0 100 100">
                        <circle class="score-circle-bg" cx="50" cy="50" r="40"></circle>
                        <circle class="score-circle-prog" cx="50" cy="50" r="40" stroke-dasharray="0 251.2"></circle>
                    </svg>
                </div>
            </div>
            
            <div class="grid-cols-3-2 stagger-2" style="margin-bottom: 24px;">
                <div class="card">
                    <h3 style="margin-bottom: 16px; font-size: 16px;">Portfolio Allocation</h3>
                    <div style="height: 250px;"><canvas id="dash-alloc"></canvas></div>
                </div>
                <div class="card">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                        <h3 style="font-size: 16px;">Recent Transactions</h3>
                        <button class="btn btn-secondary" onclick="navigate('budget')" style="padding:6px 12px; font-size:12px">View All</button>
                    </div>
                    ${txHtml || '<div style="padding:20px; text-align:center; color:var(--text-muted)">No transactions</div>'}
                </div>
            </div>
        </div>`;
    },
    
    crypto: () => {
        let data = [...AppState.cryptoData];
        if(AppState.cryptoQuery) {
            const q = AppState.cryptoQuery.toLowerCase();
            data = data.filter(c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q));
        }
        if(AppState.cryptoSort === 'mcap') data.sort((a,b) => b.market_cap - a.market_cap);
        else if(AppState.cryptoSort === 'pr') data.sort((a,b) => b.current_price - a.current_price);
        else if(AppState.cryptoSort === 'h24') data.sort((a,b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
        else if(AppState.cryptoSort === 'wl') data = data.filter(c => AppState.watchlist.includes(c.id));
        
        let rows = data.map(c => {
            const isWl = AppState.watchlist.includes(c.id);
            return `
            <tr onclick="showCryptoDetails('${c.id}')">
                <td style="width:40px" onclick="event.stopPropagation(); toggleWatchlist('${c.id}')"><button class="btn-icon ${isWl ? 'active' : ''}"><i class="fas fa-star"></i></button></td>
                <td><div style="display:flex; align-items:center; gap:12px"><img src="${c.image}" style="width:28px; height:28px; border-radius:50%"><div><div style="font-weight:600">${c.name}</div><div style="font-size:12px; color:var(--text-muted)">${c.symbol.toUpperCase()}</div></div></div></td>
                <td style="font-family:var(--font-heading); font-weight:600">${formatMoney(c.current_price)}</td>
                <td><span class="badge ${getChangeClass(c.price_change_percentage_24h)}">${formatPercent(c.price_change_percentage_24h)}</span></td>
                <td><span class="badge ${getChangeClass(c.price_change_percentage_7d_in_currency)}">${formatPercent(c.price_change_percentage_7d_in_currency)}</span></td>
                <td style="color:var(--text-muted)">${formatCompact(c.market_cap)}</td>
                <td><canvas id="sp-cr-${c.id}" width="100" height="30" style="width:100px; height:30px"></canvas></td>
            </tr>`;
        }).join('');

        return `
        <div class="stagger-1">
            <div class="card cyber-glow" style="margin-bottom:24px; display:flex; gap:16px; align-items:center; flex-wrap:wrap; padding:16px 24px">
                <div style="position:relative; flex:1; min-width:200px"><i class="fas fa-search" style="position:absolute; left:16px; top:50%; transform:translateY(-50%); color:var(--text-muted)"></i><input type="text" class="input-field" placeholder="Search coins..." style="padding-left:40px" value="${AppState.cryptoQuery}" oninput="AppState.cryptoQuery=this.value; renderView('crypto')"></div>
                <select class="input-field" style="width:auto" onchange="AppState.cryptoSort=this.value; renderView('crypto')">
                    <option value="mcap" ${AppState.cryptoSort==='mcap'?'selected':''}>Market Cap</option>
                    <option value="pr" ${AppState.cryptoSort==='pr'?'selected':''}>Price</option>
                    <option value="h24" ${AppState.cryptoSort==='h24'?'selected':''}>24h Change</option>
                    <option value="wl" ${AppState.cryptoSort==='wl'?'selected':''}>Watchlist</option>
                </select>
                <button class="btn btn-primary" onclick="fetchCrypto(); renderView('crypto')"><i class="fas fa-sync-alt"></i></button>
            </div>
            <div class="card" style="padding:0"><div class="table-container"><table class="data-table"><thead><tr><th></th><th>Asset</th><th>Price</th><th>24h</th><th>7d</th><th>Market Cap</th><th>7d Trend</th></tr></thead><tbody>${rows}</tbody></table></div></div>
        </div>`;
    },
    
    stocks: () => {
        let cards = AppState.stockData.map(s => `
            <div class="card stat-card cyber-glow" style="cursor:pointer" onclick="showStockDetails('${s.symbol}')">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px">
                    <div><div style="font-size:18px; font-weight:700; font-family:var(--font-heading)">${s.symbol}</div><div style="font-size:12px; color:var(--text-muted)">${s.name}</div></div>
                    <span class="badge ${getChangeClass(s.changePercent)}">${formatPercent(s.changePercent)}</span>
                </div>
                <div style="font-size:28px; font-weight:700; font-family:var(--font-heading); margin-bottom:16px">${formatMoney(s.price)}</div>
                <canvas id="sp-st-${s.symbol}" width="200" height="50" style="width:100%; height:50px"></canvas>
            </div>
        `).join('');
        return `<div class="stagger-1"><div class="card" style="margin-bottom:24px; padding:16px 24px; background:var(--warning-dim); border-color:var(--warning); display:flex; align-items:center; gap:12px"><i class="fas fa-info-circle" style="color:var(--warning); font-size:20px"></i><div style="font-size:14px; color:var(--text-primary)">Stock data is currently running in <strong>Live Simulation</strong> mode. Real API integration requires an AlphaVantage key.</div></div><div class="grid-cols-4">${cards}</div></div>`;
    },
    
    budget: () => {
        const b = AppState.budget;
        let spent = b.transactions.filter(t => t.type === 'ex').reduce((s, t) => s + t.amount, 0);
        let inc = b.transactions.filter(t => t.type === 'in').reduce((s, t) => s + t.amount, 0);
        let remain = b.limit - spent;
        let pct = Math.min(100, (spent / b.limit) * 100);
        
        let txRows = b.transactions.slice().reverse().map(t => {
            const cat = Categories[t.category] || Categories.other;
            const isInc = t.type === 'in';
            return `<tr><td><span class="badge ${isInc ? 'positive' : 'negative'}">${isInc ? 'Income' : 'Expense'}</span></td><td><div style="display:flex; align-items:center; gap:8px"><i class="fas ${cat.icon}" style="color:${cat.color}"></i> ${cat.label}</div></td><td style="font-weight:500">${t.desc}</td><td style="color:var(--text-muted)">${t.date}</td><td style="font-weight:600; color:${isInc ? Colors.success : 'var(--text-primary)'}">${isInc ? '+' : '-'}${formatMoney(t.amount)}</td><td style="text-align:right"><button class="btn-icon" onclick="deleteTransaction(${t.id})" style="color:var(--danger)"><i class="fas fa-trash"></i></button></td></tr>`;
        }).join('');

        const expOpts = ExpenseCategories.map(c => `<option value="${c[0]}">${c[1].label}</option>`).join('');

        return `
        <div>
            <div class="grid-cols-4 stagger-1" style="margin-bottom:24px">
                <div class="card stat-card sc-green"><div class="sc-label">Total Income</div><div class="sc-value">${formatMoney(inc)}</div></div>
                <div class="card stat-card sc-orange"><div class="sc-label">Total Spent</div><div class="sc-value">${formatMoney(spent)}</div></div>
                <div class="card stat-card ${remain >= 0 ? 'sc-blue' : 'sc-green'}"><div class="sc-label">Remaining Budget</div><div class="sc-value" style="color:${remain < 0 ? Colors.danger : 'inherit'}">${formatMoney(remain)}</div></div>
                <div class="card stat-card sc-purple"><div class="sc-label">Budget Used</div><div class="sc-value">${pct.toFixed(1)}%</div><div class="progress-bg"><div class="progress-fill" style="width:${pct}%; background:${pct > 90 ? Colors.danger : Colors.success}"></div></div></div>
            </div>
            
            <div class="grid-cols-3-2 stagger-2" style="margin-bottom:24px">
                <div class="card" style="padding:0">
                    <div style="padding:24px; border-bottom:1px solid var(--border-light); display:flex; justify-content:space-between; align-items:center">
                        <h3 style="font-size:16px">Transaction History</h3>
                        <div style="display:flex; align-items:center; gap:12px"><span style="font-size:13px; color:var(--text-muted)">Limit:</span><input type="number" id="bud-limit" class="input-field" value="${b.limit}" style="width:100px; padding:6px 12px" onchange="updateLimit(this.value)"></div>
                    </div>
                    <div class="table-container"><table class="data-table"><thead><tr><th>Type</th><th>Category</th><th>Description</th><th>Date</th><th>Amount</th><th></th></tr></thead><tbody>${txRows || '<tr><td colspan="6" style="text-align:center; padding:40px">No transactions</td></tr>'}</tbody></table></div>
                </div>
                <div class="card">
                    <h3 style="font-size:16px; margin-bottom:20px">Add Transaction</h3>
                    <div class="input-group"><label class="input-label">Type</label><select id="add-type" class="input-field" onchange="updateCatOptions()"><option value="ex">Expense</option><option value="in">Income</option></select></div>
                    <div class="input-group"><label class="input-label">Category</label><select id="add-cat" class="input-field">${expOpts}</select></div>
                    <div class="input-group"><label class="input-label">Description</label><input type="text" id="add-desc" class="input-field" placeholder="E.g., Groceries"></div>
                    <div class="grid-cols-2" style="gap:16px"><div class="input-group"><label class="input-label">Amount</label><input type="number" id="add-amount" class="input-field" placeholder="0.00" step="0.01"></div><div class="input-group"><label class="input-label">Date</label><input type="date" id="add-date" class="input-field" value="${new Date().toISOString().split('T')[0]}"></div></div>
                    <button class="btn btn-primary" style="width:100%; margin-top:8px" onclick="addTransaction()"><i class="fas fa-plus"></i> Add Transaction</button>
                </div>
            </div>
        </div>`;
    },

    goals: () => {
        let cards = AppState.goals.map(g => {
            const pct = Math.min(100, (g.current / g.target) * 100);
            return `
            <div class="card cyber-glow">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                    <div style="display:flex; align-items:center; gap:12px">
                        <div style="width:40px; height:40px; border-radius:10px; background:${g.color}15; color:${g.color}; display:flex; align-items:center; justify-content:center; font-size:16px"><i class="fas ${g.icon}"></i></div>
                        <h3 style="font-size:16px; margin:0">${g.name}</h3>
                    </div>
                    <button class="btn-icon" onclick="deleteGoal(${g.id})" style="color:var(--danger)"><i class="fas fa-trash"></i></button>
                </div>
                <div style="display:flex; justify-content:space-between; font-family:var(--font-heading); font-size:20px; font-weight:700; margin-bottom:8px">
                    <span>${formatMoney(g.current)}</span><span style="color:var(--text-muted)">${formatMoney(g.target)}</span>
                </div>
                <div class="progress-bg" style="height:8px; margin-bottom:8px"><div class="progress-fill" style="width:${pct}%; background:${g.color}"></div></div>
                <div style="text-align:right; font-size:12px; font-weight:600; color:${g.color}">${pct.toFixed(1)}% Completed</div>
            </div>`;
        }).join('');

        return `
        <div class="stagger-1">
            <div class="card" style="margin-bottom:24px; padding:24px; display:flex; justify-content:space-between; align-items:center">
                <div><h2 style="font-size:20px; margin-bottom:4px">Financial Goals</h2><p style="color:var(--text-muted); font-size:14px">Track your savings targets.</p></div>
                <button class="btn btn-primary" onclick="showAddGoalModal()"><i class="fas fa-plus"></i> New Goal</button>
            </div>
            <div class="grid-cols-3">${cards || '<div class="card" style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-muted)">No goals set yet.</div>'}</div>
        </div>`;
    },
    
    analytics: () => {
        return `
        <div class="stagger-1">
            <div class="grid-cols-2" style="margin-bottom:24px">
                <div class="card"><h3 style="font-size:16px; margin-bottom:20px">Spending by Category</h3><div style="height:300px"><canvas id="an-donut"></canvas></div></div>
                <div class="card"><h3 style="font-size:16px; margin-bottom:20px">6-Month Trend</h3><div style="height:300px"><canvas id="an-bar"></canvas></div></div>
            </div>
        </div>`;
    },
    
    fx: () => {
        if(!AppState.rates) return '<div class="stagger-1 card" style="text-align:center; padding:60px">Loading Rates...</div>';
        const opts = Object.keys(AppState.rates).sort().map(c => `<option value="${c}">${c}</option>`).join('');
        return `
        <div class="stagger-1" style="max-width:600px; margin:0 auto">
            <div class="card cyber-glow">
                <h3 style="font-size:20px; text-align:center; margin-bottom:32px">Currency Converter</h3>
                <div style="display:flex; align-items:flex-end; gap:16px; margin-bottom:24px">
                    <div style="flex:1"><label class="input-label">From</label><select id="fx-from" class="input-field" onchange="calcFx()"><option value="USD" selected>USD</option>${opts}</select></div>
                    <button class="btn btn-secondary" style="height:42px; width:42px; padding:0; border-radius:50%" onclick="swapFx()"><i class="fas fa-exchange-alt"></i></button>
                    <div style="flex:1"><label class="input-label">To</label><select id="fx-to" class="input-field" onchange="calcFx()"><option value="EUR" selected>EUR</option>${opts}</select></div>
                </div>
                <div class="input-group"><label class="input-label">Amount</label><input type="number" id="fx-amount" class="input-field" value="100" style="font-size:24px; padding:16px" oninput="calcFx()"></div>
                <div style="margin-top:32px; text-align:center; padding:32px; background:var(--bg-input); border-radius:var(--radius-md); border:1px solid var(--border-light)">
                    <div style="font-size:14px; color:var(--text-muted); margin-bottom:8px">Converted Amount</div>
                    <div id="fx-result" style="font-size:42px; font-family:var(--font-heading); font-weight:700; color:var(--accent-primary)">$0.00</div>
                    <div id="fx-rate" style="font-size:13px; color:var(--text-muted); margin-top:12px">1 USD = X EUR</div>
                </div>
            </div>
        </div>`;
    }
};

// --- Post-Render ---
const PostRender = {
    dash: () => {
        let cryptoVal = AppState.cryptoData.slice(0, 5).reduce((sum, c) => sum + (c.current_price * 100), 0) || 50000;
        let stockVal = AppState.stockData.reduce((sum, s) => sum + (s.price * 10), 0) || 15000;
        renderDoughnut('dash-alloc', ['Crypto', 'Stocks', 'Cash'], [cryptoVal, stockVal, 10000], [Colors.success, Colors.primary, Colors.textMuted]);
        renderHealthGauge('health-gauge', calculateHealthScore());
    },
    crypto: () => { AppState.cryptoData.forEach(c => { if(c.sparkline_in_7d && c.sparkline_in_7d.price) renderSparkline(`sp-cr-${c.id}`, c.sparkline_in_7d.price, c.price_change_percentage_7d_in_currency >= 0); }); },
    stocks: () => { AppState.stockData.forEach(s => renderSparkline(`sp-st-${s.symbol}`, s.history, s.changePercent >= 0)); },
    budget: () => {}, goals: () => {},
    analytics: () => {
        let exps = {};
        AppState.budget.transactions.forEach(t => { if(t.type === 'ex') exps[t.category] = (exps[t.category] || 0) + t.amount; });
        let labels = [], data = [], bg = [];
        Object.keys(exps).forEach(k => { labels.push(Categories[k].label); data.push(exps[k]); bg.push(Categories[k].color); });
        if(!labels.length) { labels = ['None']; data = [1]; bg = [Colors.textMuted]; }
        renderDoughnut('an-donut', labels, data, bg);
        
        let hLabels = AppState.history.map(h => h.month), hInc = AppState.history.map(h => h.inc), hExp = AppState.history.map(h => h.exp);
        hInc[hInc.length-1] = AppState.budget.transactions.filter(t=>t.type==='in').reduce((s,t)=>s+t.amount,0);
        hExp[hExp.length-1] = AppState.budget.transactions.filter(t=>t.type==='ex').reduce((s,t)=>s+t.amount,0);
        destroyChart('an-bar');
        const ctx = document.getElementById('an-bar');
        if(ctx) AppState.charts['an-bar'] = new Chart(ctx, { type: 'bar', data: { labels: hLabels, datasets: [{ label: 'Income', data: hInc, backgroundColor: Colors.success, borderRadius: 4 }, { label: 'Expenses', data: hExp, backgroundColor: Colors.danger, borderRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { grid: { color: Colors.border } }, x: { grid: { display: false } } } } });
    },
    fx: () => calcFx()
};

// --- Actions ---
function navigate(page) {
    AppState.currentPage = page;
    document.querySelectorAll('.nav-item, .bnav-item').forEach(el => {
        el.classList.remove('active');
        if(el.dataset.page === page) el.classList.add('active');
    });
    const titles = { dash: 'Dashboard', crypto: 'Crypto Market', stocks: 'Stock Tracker', budget: 'Budget Manager', goals: 'Financial Goals', analytics: 'Analytics', fx: 'Converter' };
    document.getElementById('page-title').textContent = titles[page];
    document.getElementById('sidebar').classList.remove('open');
    renderView(page); window.scrollTo({top: 0, behavior: 'smooth'});
}
function renderView(page) {
    const main = document.getElementById('main-content');
    if(Views[page]) { main.innerHTML = Views[page](); if(PostRender[page]) PostRender[page](); }
}

function toggleWatchlist(id) {
    const idx = AppState.watchlist.indexOf(id);
    if(idx > -1) { AppState.watchlist.splice(idx, 1); showToast('Removed from Watchlist'); }
    else { AppState.watchlist.push(id); showToast('Added to Watchlist', 'success'); }
    saveWatchlist(); if(AppState.currentPage === 'crypto') renderView('crypto');
}

function updateCatOptions() {
    const isInc = document.getElementById('add-type').value === 'in';
    document.getElementById('add-cat').innerHTML = (isInc ? IncomeCategories : ExpenseCategories).map(c => `<option value="${c[0]}">${c[1].label}</option>`).join('');
}
function addTransaction() {
    const desc = document.getElementById('add-desc').value.trim(), amount = parseFloat(document.getElementById('add-amount').value), type = document.getElementById('add-type').value, cat = document.getElementById('add-cat').value, date = document.getElementById('add-date').value;
    if(!desc || !amount || !date) return showToast('Please fill all fields', 'error');
    if(amount <= 0) return showToast('Amount must be positive', 'error');
    AppState.budget.transactions.push({ id: AppState.budget.nextId++, type, category: cat, desc, amount, date });
    saveBudget(); showToast('Transaction added successfully', 'success'); renderView('budget');
}
function deleteTransaction(id) { AppState.budget.transactions = AppState.budget.transactions.filter(t => t.id !== id); saveBudget(); showToast('Transaction deleted'); renderView('budget'); }
function updateLimit(val) { const limit = parseFloat(val); if(limit > 0) { AppState.budget.limit = limit; saveBudget(); showToast('Budget limit updated', 'success'); renderView('budget'); } }

function showAddGoalModal() {
    openModal(`
        <h2 style="font-size:20px; margin-bottom:20px">Create New Goal</h2>
        <div class="input-group"><label class="input-label">Goal Name</label><input type="text" id="g-name" class="input-field" placeholder="E.g., Vacation Fund"></div>
        <div class="grid-cols-2" style="gap:16px; margin-bottom:24px">
            <div class="input-group"><label class="input-label">Target Amount ($)</label><input type="number" id="g-target" class="input-field" placeholder="5000"></div>
            <div class="input-group"><label class="input-label">Current Saved ($)</label><input type="number" id="g-current" class="input-field" placeholder="0"></div>
        </div>
        <div style="text-align:right; display:flex; gap:12px; justify-content:flex-end">
            <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="addGoal()"><i class="fas fa-save"></i> Save Goal</button>
        </div>
    `);
}
function addGoal() {
    const name = document.getElementById('g-name').value.trim(), target = parseFloat(document.getElementById('g-target').value), current = parseFloat(document.getElementById('g-current').value) || 0;
    if(!name || !target || target <= 0) return showToast('Invalid goal details', 'error');
    const id = Date.now();
    const icons = ['fa-plane', 'fa-home', 'fa-car', 'fa-graduation-cap', 'fa-laptop'];
    const colors = [Colors.primary, Colors.success, Colors.purple, Colors.warning];
    AppState.goals.push({ id, name, target, current, icon: icons[Math.floor(Math.random()*icons.length)], color: colors[Math.floor(Math.random()*colors.length)] });
    saveGoals(); closeModal(); showToast('Goal added!', 'success'); renderView('goals');
}
function deleteGoal(id) { AppState.goals = AppState.goals.filter(g => g.id !== id); saveGoals(); showToast('Goal deleted'); renderView('goals'); }

function calcFx() {
    if(!AppState.rates) return;
    const fv = document.getElementById('fx-from').value, tv = document.getElementById('fx-to').value, amt = parseFloat(document.getElementById('fx-amount').value) || 0;
    const inUsd = fv === 'USD' ? amt : amt / AppState.rates[fv];
    const final = tv === 'USD' ? inUsd : inUsd * AppState.rates[tv];
    const rate = tv === 'USD' ? (1/AppState.rates[fv]) : (AppState.rates[tv]/(fv==='USD'?1:AppState.rates[fv]));
    document.getElementById('fx-result').textContent = formatMoney(final, tv==='JPY'||tv==='KRW'?0:2).replace('$', '') + ' ' + tv;
    document.getElementById('fx-rate').textContent = `1 ${fv} = ${rate.toFixed(4)} ${tv}`;
}
function swapFx() { const f = document.getElementById('fx-from'), t = document.getElementById('fx-to'), tmp = f.value; f.value = t.value; t.value = tmp; calcFx(); }

// --- Bootstrap ---
document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('mobile-menu-btn').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
    document.querySelectorAll('.nav-item, .bnav-item').forEach(el => el.addEventListener('click', () => navigate(el.dataset.page)));
    
    initStocks();
    fetchNews();
    await fetchRates();
    await fetchCrypto();
    
    setInterval(() => { simulateStocks(); if(AppState.currentPage === 'stocks') renderView('stocks'); if(AppState.currentPage === 'dash') renderView('dash'); }, 3000);
    setInterval(async () => { await fetchCrypto(); if(AppState.currentPage === 'crypto') renderView('crypto'); document.getElementById('update-time').textContent = 'Last update: ' + new Date().toLocaleTimeString(); }, 60000);
    setInterval(fetchNews, 300000); // 5 mins
    
    document.getElementById('update-time').textContent = 'Last update: ' + new Date().toLocaleTimeString();
    navigate('dash');
    showToast('Dashboard initialized', 'success');
});
