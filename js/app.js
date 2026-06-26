// --- State Management ---
const AppState = {
    currentPage: 'dash',
    cryptoData: [],
    cryptoQuery: '',
    cryptoSort: 'mcap',
    stockData: [],
    stockQuery: '',
    stockSort: 'mcap',
    rates: null,
    watchlist: JSON.parse(localStorage.getItem('fp_watchlist')) || ['bitcoin', 'ethereum', 'solana'],
    budget: JSON.parse(localStorage.getItem('fp_budget')) || initializeBudget(),
    charts: {},
    history: generateHistory(),
    lastCryptoFetch: 0,
    lastRatesFetch: 0
};

// Colors for charts matching CSS
const Colors = {
    success: '#10b981',
    danger: '#ef4444',
    primary: '#3b82f6',
    warning: '#f59e0b',
    purple: '#8b5cf6',
    surface: '#0f172a',
    border: 'rgba(255, 255, 255, 0.1)',
    textMuted: '#64748b'
};

const Categories = {
    housing: { label: 'Housing', icon: 'fa-home', color: Colors.primary, budget: 1200 },
    food: { label: 'Food & Dining', icon: 'fa-utensils', color: Colors.warning, budget: 400 },
    transport: { label: 'Transport', icon: 'fa-car', color: '#06b6d4', budget: 250 },
    entertainment: { label: 'Entertainment', icon: 'fa-gamepad', color: Colors.purple, budget: 200 },
    shopping: { label: 'Shopping', icon: 'fa-bag-shopping', color: '#ec4899', budget: 300 },
    healthcare: { label: 'Healthcare', icon: 'fa-heart-pulse', color: Colors.danger, budget: 150 },
    utilities: { label: 'Utilities', icon: 'fa-bolt', color: '#f97316', budget: 200 },
    subscriptions: { label: 'Subscriptions', icon: 'fa-repeat', color: '#8b5cf6', budget: 100 },
    other: { label: 'Other', icon: 'fa-ellipsis', color: Colors.textMuted, budget: 100 },
    salary: { label: 'Salary', icon: 'fa-briefcase', color: Colors.success, budget: 0 },
    freelance: { label: 'Freelance', icon: 'fa-laptop-code', color: Colors.warning, budget: 0 }
};

// Extract Income/Expense arrays for dropdowns
const ExpenseCategories = Object.entries(Categories).filter(([k, _]) => !['salary', 'freelance'].includes(k));
const IncomeCategories = Object.entries(Categories).filter(([k, _]) => ['salary', 'freelance'].includes(k));

// Fallback Crypto Data
const FallbackCrypto = [
    { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 97500, price_change_percentage_1h_in_currency: 0.3, price_change_percentage_24h: 1.8, price_change_percentage_7d_in_currency: 5.2, market_cap: 1920000000000, total_volume: 42000000000, image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
    { id: 'ethereum', symbol: 'eth', name: 'Ethereum', current_price: 3450, price_change_percentage_1h_in_currency: 0.4, price_change_percentage_24h: 2.5, price_change_percentage_7d_in_currency: 8.1, market_cap: 415000000000, total_volume: 18000000000, image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
    { id: 'solana', symbol: 'sol', name: 'Solana', current_price: 185, price_change_percentage_1h_in_currency: -0.2, price_change_percentage_24h: -1.2, price_change_percentage_7d_in_currency: 12.4, market_cap: 82000000000, total_volume: 3200000000, image: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
    { id: 'binancecoin', symbol: 'bnb', name: 'BNB', current_price: 680, price_change_percentage_1h_in_currency: 0.1, price_change_percentage_24h: 0.8, price_change_percentage_7d_in_currency: 3.2, market_cap: 102000000000, total_volume: 2100000000, image: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png' },
    { id: 'ripple', symbol: 'xrp', name: 'XRP', current_price: 2.35, price_change_percentage_1h_in_currency: 0.6, price_change_percentage_24h: 4.1, price_change_percentage_7d_in_currency: 15.3, market_cap: 135000000000, total_volume: 8900000000, image: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png' }
];

// Fallback Stocks
const FallbackStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 232.5, change: 3.2, changePercent: 1.39, mcap: 3580000000000, history: generateSparkline(228) },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 442.8, change: 5.1, changePercent: 1.17, mcap: 3290000000000, history: generateSparkline(436) },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 135.2, change: -2.4, changePercent: -1.75, mcap: 3320000000000, history: generateSparkline(139) },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 192.4, change: 1.8, changePercent: 0.95, mcap: 2380000000000, history: generateSparkline(189) },
    { symbol: 'AMZN', name: 'Amazon.com', price: 205.7, change: 4.3, changePercent: 2.14, mcap: 2150000000000, history: generateSparkline(200) }
];

// --- Utilities ---
function saveBudget() { localStorage.setItem('fp_budget', JSON.stringify(AppState.budget)); }
function saveWatchlist() { localStorage.setItem('fp_watchlist', JSON.stringify(AppState.watchlist)); }

function formatMoney(amount, decimals = 2) {
    if(amount == null || isNaN(amount)) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: decimals }).format(amount);
}

function formatCompact(num) {
    if (num >= 1e12) return '$' + (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return '$' + (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return '$' + (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return '$' + (num / 1e3).toFixed(1) + 'K';
    return formatMoney(num, 0);
}

function formatPercent(val) {
    return (val >= 0 ? '+' : '') + Number(val).toFixed(2) + '%';
}

function getChangeClass(val) { return val >= 0 ? 'positive' : 'negative'; }
function getChangeIcon(val) { return val >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'; }

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';

    toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOutRight 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function openModal(contentHTML) {
    document.getElementById('modal-content').innerHTML = contentHTML;
    document.getElementById('modal-overlay').classList.add('show');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('show');
}

document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
});

// --- Initialization & Mock Data ---
function generateSparkline(base, points = 50, vol = 0.015) {
    let data = [base];
    for(let i=1; i<points; i++) data.push(data[i-1] * (1 + (Math.random() - 0.48) * vol));
    return data;
}

function initializeBudget() {
    const d = new Date();
    const fmt = (day) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return {
        limit: 3500,
        nextId: 6,
        transactions: [
            { id: 1, type: 'in', category: 'salary', desc: 'Monthly Salary', amount: 6000, date: fmt(1) },
            { id: 2, type: 'ex', category: 'housing', desc: 'Rent', amount: 1500, date: fmt(2) },
            { id: 3, type: 'ex', category: 'utilities', desc: 'Electric Bill', amount: 120, date: fmt(5) },
            { id: 4, type: 'ex', category: 'food', desc: 'Groceries', amount: 250, date: fmt(8) },
            { id: 5, type: 'ex', category: 'entertainment', desc: 'Netflix', amount: 15, date: fmt(10) }
        ]
    };
}

function generateHistory() {
    let hist = [];
    for(let i=5; i>=0; i--) {
        let d = new Date(); d.setMonth(d.getMonth() - i);
        hist.push({
            month: d.toLocaleString('default', { month: 'short' }),
            inc: Math.round(5000 + Math.random() * 1500),
            exp: Math.round(2000 + Math.random() * 1000)
        });
    }
    return hist;
}

// --- Data Fetching ---
async function fetchCrypto() {
    const now = Date.now();
    if (now - AppState.lastCryptoFetch < 60000 && AppState.cryptoData.length > 0) return;
    
    try {
        const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=1h%2C24h%2C7d');
        if(!res.ok) throw new Error('Rate limit');
        const data = await res.json();
        AppState.cryptoData = data.map(c => {
            if (!c.sparkline_in_7d) c.sparkline_in_7d = { price: generateSparkline(c.current_price, 168) };
            return c;
        });
        document.getElementById('status-text').textContent = 'Live \u00b7 CoinGecko';
        document.querySelector('.pulse-dot').style.backgroundColor = Colors.success;
    } catch(e) {
        if(AppState.cryptoData.length === 0) {
            AppState.cryptoData = FallbackCrypto.map(c => ({...c, sparkline_in_7d: { price: generateSparkline(c.current_price, 168) }}));
        }
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
        if(data.result === 'success') {
            AppState.rates = data.rates;
        } else throw new Error();
    } catch(e) {
        // Fallback rates
        AppState.rates = { EUR:0.92, GBP:0.79, JPY:149.5, CAD:1.36, AUD:1.53, CHF:0.88, CNY:7.24, INR:83.5, BTC: 0.00001 };
    }
    AppState.lastRatesFetch = now;
}

function initStocks() {
    AppState.stockData = JSON.parse(JSON.stringify(FallbackStocks));
}

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

// --- Charting ---
Chart.defaults.color = Colors.textMuted;
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.9)';
Chart.defaults.plugins.tooltip.borderColor = Colors.border;
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.padding = 12;

function destroyChart(id) {
    if(AppState.charts[id]) {
        AppState.charts[id].destroy();
        delete AppState.charts[id];
    }
}

function renderSparkline(canvasId, data, isPositive) {
    const canvas = document.getElementById(canvasId);
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const color = isPositive ? Colors.success : Colors.danger;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    const step = canvas.width / (data.length - 1);
    
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    for(let i=0; i<data.length; i++) {
        const x = i * step;
        const y = canvas.height - ((data[i] - min) / range) * (canvas.height - 4) - 2;
        if(i===0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Gradient fill
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, color + '40'); // 25% opacity
    grad.addColorStop(1, color + '00'); // 0% opacity
    ctx.fillStyle = grad;
    ctx.fill();
}

function renderDoughnut(id, labels, data, colors) {
    destroyChart(id);
    const ctx = document.getElementById(id);
    if(!ctx) return;
    
    AppState.charts[id] = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0 }] },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '75%',
            plugins: { legend: { position: 'right', labels: { color: Colors.textMuted } } }
        }
    });
}

function renderLineChart(id, labels, data, color) {
    destroyChart(id);
    const ctx = document.getElementById(id);
    if(!ctx) return;
    
    AppState.charts[id] = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [{
            data, borderColor: color, backgroundColor: color + '15', fill: true, borderWidth: 2, pointRadius: 0, pointHoverRadius: 5
        }]},
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: { display: false },
                y: { grid: { color: Colors.border }, ticks: { callback: v => formatMoney(v, 0) } }
            },
            plugins: { legend: { display: false } },
            interaction: { intersect: false, mode: 'index' }
        }
    });
}

// --- Views ---
const Views = {
    dash: () => {
        // Calculate Totals
        let cryptoVal = AppState.cryptoData.slice(0, 5).reduce((sum, c) => sum + (c.current_price * 100), 0) || 50000;
        let stockVal = AppState.stockData.reduce((sum, s) => sum + (s.price * 10), 0) || 15000;
        let totalVal = cryptoVal + stockVal + 10000; // adding fake cash
        
        // Month Spend
        let spent = AppState.budget.transactions.filter(t => t.type === 'ex').reduce((s, t) => s + t.amount, 0);
        
        let topMovers = AppState.cryptoData.slice().sort((a,b) => b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0, 3);
        
        let txHtml = AppState.budget.transactions.slice(-5).reverse().map(t => {
            const cat = Categories[t.category] || Categories.other;
            const isInc = t.type === 'in';
            return `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid var(--border-light)">
                <div style="display:flex; align-items:center; gap:12px">
                    <div style="width:40px; height:40px; border-radius:10px; background:${isInc ? Colors.success+'15' : cat.color+'15'}; display:flex; align-items:center; justify-content:center; color:${isInc ? Colors.success : cat.color}">
                        <i class="fas ${cat.icon}"></i>
                    </div>
                    <div>
                        <div style="font-weight:600; font-size:14px">${t.desc}</div>
                        <div style="font-size:12px; color:var(--text-muted)">${cat.label} &middot; ${t.date}</div>
                    </div>
                </div>
                <div style="font-weight:600; font-size:15px; color:${isInc ? Colors.success : 'var(--text-primary)'}">
                    ${isInc ? '+' : '-'}${formatMoney(t.amount)}
                </div>
            </div>`;
        }).join('');
        
        if(!txHtml) txHtml = '<div style="padding:20px; text-align:center; color:var(--text-muted)">No recent transactions</div>';

        return `
        <div class="fade-in">
            <div class="grid-cols-4" style="margin-bottom: 24px;">
                <div class="card stat-card sc-green">
                    <div class="sc-icon"><i class="fas fa-wallet"></i></div>
                    <div class="sc-label">Total Portfolio</div>
                    <div class="sc-value">${formatMoney(totalVal)}</div>
                    <div class="sc-sub"><span class="badge positive"><i class="fas fa-arrow-up"></i> 2.4%</span> vs last week</div>
                </div>
                <div class="card stat-card sc-orange">
                    <div class="sc-icon"><i class="fab fa-bitcoin"></i></div>
                    <div class="sc-label">Crypto Assets</div>
                    <div class="sc-value">${formatMoney(cryptoVal)}</div>
                    <div class="sc-sub">${AppState.cryptoData.length} active coins tracked</div>
                </div>
                <div class="card stat-card sc-blue">
                    <div class="sc-icon"><i class="fas fa-chart-line"></i></div>
                    <div class="sc-label">Stock Equity</div>
                    <div class="sc-value">${formatMoney(stockVal)}</div>
                    <div class="sc-sub">${AppState.stockData.length} positions open</div>
                </div>
                <div class="card stat-card sc-purple">
                    <div class="sc-icon"><i class="fas fa-credit-card"></i></div>
                    <div class="sc-label">Monthly Spent</div>
                    <div class="sc-value">${formatMoney(spent)}</div>
                    <div class="sc-sub">Limit: ${formatMoney(AppState.budget.limit)}</div>
                </div>
            </div>
            
            <div class="grid-cols-3-2" style="margin-bottom: 24px;">
                <div class="card">
                    <h3 style="margin-bottom: 16px; font-size: 16px;">Asset Allocation</h3>
                    <div style="height: 250px;">
                        <canvas id="dash-alloc"></canvas>
                    </div>
                </div>
                <div class="card">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                        <h3 style="font-size: 16px;">Top Movers (24h)</h3>
                        <button class="btn-icon" onclick="navigate('crypto')"><i class="fas fa-arrow-right"></i></button>
                    </div>
                    ${topMovers.map(c => `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid var(--border-light)">
                            <div style="display:flex; align-items:center; gap:12px">
                                <img src="${c.image}" style="width:24px; border-radius:50%">
                                <div>
                                    <div style="font-weight:600; font-size:14px">${c.name}</div>
                                    <div style="font-size:12px; color:var(--text-muted)">${c.symbol.toUpperCase()}</div>
                                </div>
                            </div>
                            <div style="text-align:right">
                                <div style="font-weight:600; font-size:14px">${formatMoney(c.current_price)}</div>
                                <div class="badge ${getChangeClass(c.price_change_percentage_24h)} style="padding:2px 6px; font-size:11px">
                                    <i class="fas ${getChangeIcon(c.price_change_percentage_24h)}"></i> ${formatPercent(c.price_change_percentage_24h)}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                    <h3 style="font-size: 16px;">Recent Transactions</h3>
                    <button class="btn btn-secondary" onclick="navigate('budget')" style="padding:6px 12px; font-size:12px">View All</button>
                </div>
                ${txHtml}
            </div>
        </div>`;
    },
    
    crypto: () => {
        let data = [...AppState.cryptoData];
        if(AppState.cryptoQuery) {
            const q = AppState.cryptoQuery.toLowerCase();
            data = data.filter(c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q));
        }
        
        // Sorting
        const sortKey = AppState.cryptoSort;
        if(sortKey === 'mcap') data.sort((a,b) => b.market_cap - a.market_cap);
        else if(sortKey === 'pr') data.sort((a,b) => b.current_price - a.current_price);
        else if(sortKey === 'h24') data.sort((a,b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
        else if(sortKey === 'wl') data = data.filter(c => AppState.watchlist.includes(c.id));
        
        let rows = data.map((c, i) => {
            const isWl = AppState.watchlist.includes(c.id);
            return `
            <tr onclick="showCryptoDetails('${c.id}')">
                <td style="width:40px" onclick="event.stopPropagation(); toggleWatchlist('${c.id}')">
                    <button class="btn-icon ${isWl ? 'active' : ''}"><i class="fas fa-star"></i></button>
                </td>
                <td>
                    <div style="display:flex; align-items:center; gap:12px">
                        <img src="${c.image}" style="width:28px; height:28px; border-radius:50%">
                        <div>
                            <div style="font-weight:600">${c.name}</div>
                            <div style="font-size:12px; color:var(--text-muted)">${c.symbol.toUpperCase()}</div>
                        </div>
                    </div>
                </td>
                <td style="font-family:var(--font-heading); font-weight:600">${formatMoney(c.current_price)}</td>
                <td><span class="badge ${getChangeClass(c.price_change_percentage_24h)}">${formatPercent(c.price_change_percentage_24h)}</span></td>
                <td><span class="badge ${getChangeClass(c.price_change_percentage_7d_in_currency)}">${formatPercent(c.price_change_percentage_7d_in_currency)}</span></td>
                <td style="color:var(--text-muted)">${formatCompact(c.market_cap)}</td>
                <td><canvas id="sp-cr-${c.id}" width="100" height="30" style="width:100px; height:30px"></canvas></td>
            </tr>`;
        }).join('');
        
        if(!rows) rows = '<tr><td colspan="7" style="text-align:center; padding:40px; color:var(--text-muted)">No coins found</td></tr>';

        return `
        <div class="fade-in">
            <div class="card" style="margin-bottom:24px; display:flex; gap:16px; align-items:center; flex-wrap:wrap; padding:16px 24px">
                <div style="position:relative; flex:1; min-width:200px">
                    <i class="fas fa-search" style="position:absolute; left:16px; top:50%; transform:translateY(-50%); color:var(--text-muted)"></i>
                    <input type="text" class="input-field" placeholder="Search coins..." style="padding-left:40px" value="${AppState.cryptoQuery}" oninput="AppState.cryptoQuery=this.value; renderView('crypto')">
                </div>
                <select class="input-field" style="width:auto" onchange="AppState.cryptoSort=this.value; renderView('crypto')">
                    <option value="mcap" ${sortKey==='mcap'?'selected':''}>Market Cap</option>
                    <option value="pr" ${sortKey==='pr'?'selected':''}>Price</option>
                    <option value="h24" ${sortKey==='h24'?'selected':''}>24h Change</option>
                    <option value="wl" ${sortKey==='wl'?'selected':''}>Watchlist</option>
                </select>
                <button class="btn btn-primary" onclick="fetchCrypto(); renderView('crypto')"><i class="fas fa-sync-alt"></i> Refresh</button>
            </div>
            
            <div class="card" style="padding:0">
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th></th>
                                <th>Asset</th>
                                <th>Price</th>
                                <th>24h</th>
                                <th>7d</th>
                                <th>Market Cap</th>
                                <th>7d Trend</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>
        </div>`;
    },
    
    stocks: () => {
        let cards = AppState.stockData.map(s => `
            <div class="card stat-card" style="cursor:pointer" onclick="showStockDetails('${s.symbol}')">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px">
                    <div>
                        <div style="font-size:18px; font-weight:700; font-family:var(--font-heading)">${s.symbol}</div>
                        <div style="font-size:12px; color:var(--text-muted)">${s.name}</div>
                    </div>
                    <span class="badge ${getChangeClass(s.changePercent)}">${formatPercent(s.changePercent)}</span>
                </div>
                <div style="font-size:28px; font-weight:700; font-family:var(--font-heading); margin-bottom:16px">${formatMoney(s.price)}</div>
                <canvas id="sp-st-${s.symbol}" width="200" height="50" style="width:100%; height:50px"></canvas>
            </div>
        `).join('');
        
        return `
        <div class="fade-in">
            <div class="card" style="margin-bottom:24px; padding:16px 24px; background:var(--warning-dim); border-color:var(--warning); display:flex; align-items:center; gap:12px">
                <i class="fas fa-info-circle" style="color:var(--warning); font-size:20px"></i>
                <div style="font-size:14px; color:var(--text-primary)">
                    Stock data is currently running in <strong>Live Simulation</strong> mode. Real API integration requires an AlphaVantage key.
                </div>
            </div>
            <div class="grid-cols-4">${cards}</div>
        </div>`;
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
            return `
            <tr>
                <td><span class="badge ${isInc ? 'positive' : 'negative'}">${isInc ? 'Income' : 'Expense'}</span></td>
                <td><div style="display:flex; align-items:center; gap:8px"><i class="fas ${cat.icon}" style="color:${cat.color}"></i> ${cat.label}</div></td>
                <td style="font-weight:500">${t.desc}</td>
                <td style="color:var(--text-muted)">${t.date}</td>
                <td style="font-weight:600; color:${isInc ? Colors.success : 'var(--text-primary)'}">${isInc ? '+' : '-'}${formatMoney(t.amount)}</td>
                <td style="text-align:right">
                    <button class="btn-icon" onclick="deleteTransaction(${t.id})" style="color:var(--danger)"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
        }).join('');

        if(!txRows) txRows = '<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--text-muted)">No transactions recorded</td></tr>';

        const expOpts = ExpenseCategories.map(c => `<option value="${c[0]}">${c[1].label}</option>`).join('');

        return `
        <div class="fade-in">
            <div class="grid-cols-4" style="margin-bottom:24px">
                <div class="card stat-card sc-green">
                    <div class="sc-label">Total Income</div>
                    <div class="sc-value">${formatMoney(inc)}</div>
                </div>
                <div class="card stat-card sc-orange">
                    <div class="sc-label">Total Spent</div>
                    <div class="sc-value">${formatMoney(spent)}</div>
                </div>
                <div class="card stat-card ${remain >= 0 ? 'sc-blue' : 'sc-green'}">
                    <div class="sc-label">Remaining Budget</div>
                    <div class="sc-value" style="color:${remain < 0 ? Colors.danger : 'inherit'}">${formatMoney(remain)}</div>
                </div>
                <div class="card stat-card sc-purple">
                    <div class="sc-label">Budget Used</div>
                    <div class="sc-value">${pct.toFixed(1)}%</div>
                    <div class="progress-bg"><div class="progress-fill" style="width:${pct}%; background:${pct > 90 ? Colors.danger : Colors.success}"></div></div>
                </div>
            </div>
            
            <div class="grid-cols-3-2" style="margin-bottom:24px">
                <div class="card" style="padding:0">
                    <div style="padding:24px; border-bottom:1px solid var(--border-light); display:flex; justify-content:space-between; align-items:center">
                        <h3 style="font-size:16px">Transaction History</h3>
                        <div style="display:flex; align-items:center; gap:12px">
                            <span style="font-size:13px; color:var(--text-muted)">Monthly Limit:</span>
                            <input type="number" id="bud-limit" class="input-field" value="${b.limit}" style="width:100px; padding:6px 12px" onchange="updateLimit(this.value)">
                        </div>
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr><th>Type</th><th>Category</th><th>Description</th><th>Date</th><th>Amount</th><th></th></tr>
                            </thead>
                            <tbody>${txRows}</tbody>
                        </table>
                    </div>
                </div>
                
                <div class="card">
                    <h3 style="font-size:16px; margin-bottom:20px">Add Transaction</h3>
                    <div class="input-group">
                        <label class="input-label">Type</label>
                        <select id="add-type" class="input-field" onchange="updateCatOptions()">
                            <option value="ex">Expense</option>
                            <option value="in">Income</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label class="input-label">Category</label>
                        <select id="add-cat" class="input-field">${expOpts}</select>
                    </div>
                    <div class="input-group">
                        <label class="input-label">Description</label>
                        <input type="text" id="add-desc" class="input-field" placeholder="E.g., Groceries">
                    </div>
                    <div class="grid-cols-2" style="gap:16px">
                        <div class="input-group">
                            <label class="input-label">Amount</label>
                            <input type="number" id="add-amount" class="input-field" placeholder="0.00" step="0.01">
                        </div>
                        <div class="input-group">
                            <label class="input-label">Date</label>
                            <input type="date" id="add-date" class="input-field" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                    </div>
                    <button class="btn btn-primary" style="width:100%; margin-top:8px" onclick="addTransaction()"><i class="fas fa-plus"></i> Add Transaction</button>
                </div>
            </div>
        </div>`;
    },
    
    analytics: () => {
        return `
        <div class="fade-in">
            <div class="grid-cols-2" style="margin-bottom:24px">
                <div class="card">
                    <h3 style="font-size:16px; margin-bottom:20px">Spending by Category</h3>
                    <div style="height:300px"><canvas id="an-donut"></canvas></div>
                </div>
                <div class="card">
                    <h3 style="font-size:16px; margin-bottom:20px">6-Month Trend</h3>
                    <div style="height:300px"><canvas id="an-bar"></canvas></div>
                </div>
            </div>
        </div>`;
    },
    
    fx: () => {
        if(!AppState.rates) return '<div class="fade-in card" style="text-align:center; padding:60px">Loading Rates...</div>';
        
        const currencies = Object.keys(AppState.rates).sort();
        const opts = currencies.map(c => `<option value="${c}">${c}</option>`).join('');
        
        return `
        <div class="fade-in" style="max-width:600px; margin:0 auto">
            <div class="card">
                <h3 style="font-size:20px; text-align:center; margin-bottom:32px">Currency Converter</h3>
                
                <div style="display:flex; align-items:flex-end; gap:16px; margin-bottom:24px">
                    <div style="flex:1">
                        <label class="input-label">From</label>
                        <select id="fx-from" class="input-field" onchange="calcFx()">
                            <option value="USD" selected>USD</option>
                            ${opts}
                        </select>
                    </div>
                    <button class="btn btn-secondary" style="height:42px; width:42px; padding:0; border-radius:50%" onclick="swapFx()">
                        <i class="fas fa-exchange-alt"></i>
                    </button>
                    <div style="flex:1">
                        <label class="input-label">To</label>
                        <select id="fx-to" class="input-field" onchange="calcFx()">
                            <option value="EUR" selected>EUR</option>
                            ${opts}
                        </select>
                    </div>
                </div>
                
                <div class="input-group">
                    <label class="input-label">Amount</label>
                    <input type="number" id="fx-amount" class="input-field" value="100" style="font-size:24px; padding:16px" oninput="calcFx()">
                </div>
                
                <div style="margin-top:32px; text-align:center; padding:32px; background:var(--bg-input); border-radius:var(--radius-md); border:1px solid var(--border-light)">
                    <div style="font-size:14px; color:var(--text-muted); margin-bottom:8px">Converted Amount</div>
                    <div id="fx-result" style="font-size:42px; font-family:var(--font-heading); font-weight:700; color:var(--accent-primary)">$0.00</div>
                    <div id="fx-rate" style="font-size:13px; color:var(--text-muted); margin-top:12px">1 USD = X EUR</div>
                </div>
            </div>
        </div>`;
    }
};

// --- Post-Render Logic ---
const PostRender = {
    dash: () => {
        let cryptoVal = AppState.cryptoData.slice(0, 5).reduce((sum, c) => sum + (c.current_price * 100), 0) || 50000;
        let stockVal = AppState.stockData.reduce((sum, s) => sum + (s.price * 10), 0) || 15000;
        let cash = 10000;
        renderDoughnut('dash-alloc', ['Crypto', 'Stocks', 'Cash'], [cryptoVal, stockVal, cash], [Colors.success, Colors.primary, Colors.textMuted]);
    },
    crypto: () => {
        AppState.cryptoData.forEach(c => {
            if(c.sparkline_in_7d && c.sparkline_in_7d.price) {
                renderSparkline(`sp-cr-${c.id}`, c.sparkline_in_7d.price, c.price_change_percentage_7d_in_currency >= 0);
            }
        });
    },
    stocks: () => {
        AppState.stockData.forEach(s => {
            renderSparkline(`sp-st-${s.symbol}`, s.history, s.changePercent >= 0);
        });
    },
    budget: () => {},
    analytics: () => {
        // Doughnut
        let exps = {};
        AppState.budget.transactions.forEach(t => {
            if(t.type === 'ex') exps[t.category] = (exps[t.category] || 0) + t.amount;
        });
        let labels = [], data = [], bg = [];
        Object.keys(exps).forEach(k => {
            labels.push(Categories[k].label);
            data.push(exps[k]);
            bg.push(Categories[k].color);
        });
        if(labels.length === 0) { labels = ['None']; data = [1]; bg = [Colors.textMuted]; }
        renderDoughnut('an-donut', labels, data, bg);
        
        // Bar
        let hLabels = AppState.history.map(h => h.month);
        let hInc = AppState.history.map(h => h.inc);
        let hExp = AppState.history.map(h => h.exp);
        
        // Override last month with current
        hInc[hInc.length-1] = AppState.budget.transactions.filter(t=>t.type==='in').reduce((s,t)=>s+t.amount,0);
        hExp[hExp.length-1] = AppState.budget.transactions.filter(t=>t.type==='ex').reduce((s,t)=>s+t.amount,0);
        
        destroyChart('an-bar');
        const ctx = document.getElementById('an-bar');
        if(ctx) {
            AppState.charts['an-bar'] = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: hLabels,
                    datasets: [
                        { label: 'Income', data: hInc, backgroundColor: Colors.success, borderRadius: 4 },
                        { label: 'Expenses', data: hExp, backgroundColor: Colors.danger, borderRadius: 4 }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { grid: { color: Colors.border } }, x: { grid: { display: false } } } }
            });
        }
    },
    fx: () => { calcFx(); }
};

// --- Actions ---
function navigate(page) {
    AppState.currentPage = page;
    
    // Update active nav
    document.querySelectorAll('.nav-item, .bnav-item').forEach(el => {
        el.classList.remove('active');
        if(el.dataset.page === page) el.classList.add('active');
    });
    
    // Update title
    const titles = { dash: 'Dashboard', crypto: 'Crypto Market', stocks: 'Stock Tracker', budget: 'Budget Manager', analytics: 'Analytics', fx: 'Converter' };
    document.getElementById('page-title').textContent = titles[page];
    
    document.getElementById('sidebar').classList.remove('open');
    renderView(page);
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function renderView(page) {
    const main = document.getElementById('main-content');
    if(Views[page]) {
        main.innerHTML = Views[page]();
        if(PostRender[page]) PostRender[page]();
    }
}

// Crypto Actions
function toggleWatchlist(id) {
    const idx = AppState.watchlist.indexOf(id);
    if(idx > -1) {
        AppState.watchlist.splice(idx, 1);
        showToast('Removed from Watchlist');
    } else {
        AppState.watchlist.push(id);
        showToast('Added to Watchlist', 'success');
    }
    saveWatchlist();
    if(AppState.currentPage === 'crypto') renderView('crypto');
}

function showCryptoDetails(id) {
    const c = AppState.cryptoData.find(x => x.id === id);
    if(!c) return;
    
    openModal(`
        <div style="display:flex; align-items:center; gap:16px; margin-bottom:24px">
            <img src="${c.image}" style="width:48px; border-radius:50%">
            <div>
                <h2 style="font-size:24px; margin:0">${c.name}</h2>
                <span style="color:var(--text-muted); text-transform:uppercase">${c.symbol}</span>
            </div>
            <div style="margin-left:auto; text-align:right">
                <div style="font-size:28px; font-family:var(--font-heading); font-weight:700">${formatMoney(c.current_price)}</div>
                <div class="badge ${getChangeClass(c.price_change_percentage_24h)}">${formatPercent(c.price_change_percentage_24h)}</div>
            </div>
        </div>
        <div style="height:250px; margin-bottom:24px"><canvas id="modal-chart"></canvas></div>
        <div class="grid-cols-2">
            <div class="card" style="padding:16px"><div style="font-size:12px; color:var(--text-muted)">Market Cap</div><div style="font-size:18px; font-weight:600">${formatCompact(c.market_cap)}</div></div>
            <div class="card" style="padding:16px"><div style="font-size:12px; color:var(--text-muted)">Volume 24h</div><div style="font-size:18px; font-weight:600">${formatCompact(c.total_volume)}</div></div>
        </div>
        <div style="margin-top:24px; text-align:right"><button class="btn btn-secondary" onclick="closeModal()">Close</button></div>
    `);
    
    if(c.sparkline_in_7d && c.sparkline_in_7d.price) {
        const labels = Array.from({length: c.sparkline_in_7d.price.length}, (_,i)=>i);
        renderLineChart('modal-chart', labels, c.sparkline_in_7d.price, c.price_change_percentage_7d_in_currency >= 0 ? Colors.success : Colors.danger);
    }
}

// Stock Actions
function showStockDetails(symbol) {
    const s = AppState.stockData.find(x => x.symbol === symbol);
    if(!s) return;
    
    openModal(`
        <div style="display:flex; align-items:center; gap:16px; margin-bottom:24px">
            <div style="width:48px; height:48px; border-radius:12px; background:var(--bg-input); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:20px; color:var(--accent-primary)">
                ${s.symbol.substring(0,2)}
            </div>
            <div>
                <h2 style="font-size:24px; margin:0">${s.symbol}</h2>
                <span style="color:var(--text-muted)">${s.name}</span>
            </div>
            <div style="margin-left:auto; text-align:right">
                <div style="font-size:28px; font-family:var(--font-heading); font-weight:700">${formatMoney(s.price)}</div>
                <div class="badge ${getChangeClass(s.changePercent)}">${formatPercent(s.changePercent)}</div>
            </div>
        </div>
        <div style="height:250px; margin-bottom:24px"><canvas id="modal-chart"></canvas></div>
        <div style="margin-top:24px; text-align:right"><button class="btn btn-secondary" onclick="closeModal()">Close</button></div>
    `);
    
    const labels = Array.from({length: s.history.length}, (_,i)=>i);
    renderLineChart('modal-chart', labels, s.history, s.changePercent >= 0 ? Colors.success : Colors.danger);
}

// Budget Actions
function updateCatOptions() {
    const isInc = document.getElementById('add-type').value === 'in';
    const sel = document.getElementById('add-cat');
    sel.innerHTML = (isInc ? IncomeCategories : ExpenseCategories).map(c => `<option value="${c[0]}">${c[1].label}</option>`).join('');
}

function addTransaction() {
    const desc = document.getElementById('add-desc').value.trim();
    const amount = parseFloat(document.getElementById('add-amount').value);
    const type = document.getElementById('add-type').value;
    const cat = document.getElementById('add-cat').value;
    const date = document.getElementById('add-date').value;
    
    if(!desc || !amount || !date) return showToast('Please fill all fields', 'error');
    if(amount <= 0) return showToast('Amount must be positive', 'error');
    
    AppState.budget.transactions.push({ id: AppState.budget.nextId++, type, category: cat, desc, amount, date });
    saveBudget();
    showToast('Transaction added successfully', 'success');
    renderView('budget');
}

function deleteTransaction(id) {
    AppState.budget.transactions = AppState.budget.transactions.filter(t => t.id !== id);
    saveBudget();
    showToast('Transaction deleted');
    renderView('budget');
}

function updateLimit(val) {
    const limit = parseFloat(val);
    if(limit > 0) {
        AppState.budget.limit = limit;
        saveBudget();
        showToast('Budget limit updated', 'success');
        renderView('budget');
    }
}

// FX Actions
function calcFx() {
    if(!AppState.rates) return;
    const from = document.getElementById('fx-from');
    const to = document.getElementById('fx-to');
    const amount = document.getElementById('fx-amount');
    const res = document.getElementById('fx-result');
    const rtxt = document.getElementById('fx-rate');
    
    if(!from || !to || !amount || !res) return;
    
    const fv = from.value, tv = to.value, amt = parseFloat(amount.value) || 0;
    const inUsd = fv === 'USD' ? amt : amt / AppState.rates[fv];
    const final = tv === 'USD' ? inUsd : inUsd * AppState.rates[tv];
    
    const rate = tv === 'USD' ? (1/AppState.rates[fv]) : (AppState.rates[tv]/ (fv==='USD'?1:AppState.rates[fv]));
    
    res.textContent = formatMoney(final, tv==='JPY'||tv==='KRW'?0:2).replace('$', '') + ' ' + tv;
    rtxt.textContent = `1 ${fv} = ${rate.toFixed(4)} ${tv}`;
}

function swapFx() {
    const from = document.getElementById('fx-from');
    const to = document.getElementById('fx-to');
    const temp = from.value;
    from.value = to.value;
    to.value = temp;
    calcFx();
}

// --- Bootstrap ---
document.addEventListener('DOMContentLoaded', async () => {
    // Menu
    document.getElementById('mobile-menu-btn').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });
    
    document.querySelectorAll('.nav-item, .bnav-item').forEach(el => {
        el.addEventListener('click', () => navigate(el.dataset.page));
    });
    
    // Init Data
    initStocks();
    await fetchRates();
    await fetchCrypto();
    
    // Start Ticks
    setInterval(() => {
        simulateStocks();
        if(AppState.currentPage === 'stocks') renderView('stocks');
        if(AppState.currentPage === 'dash') renderView('dash');
    }, 3000);
    
    setInterval(async () => {
        await fetchCrypto();
        if(AppState.currentPage === 'crypto') renderView('crypto');
        document.getElementById('update-time').textContent = 'Last update: ' + new Date().toLocaleTimeString();
    }, 60000);
    
    document.getElementById('update-time').textContent = 'Last update: ' + new Date().toLocaleTimeString();
    
    // First Render
    navigate('dash');
    showToast('Dashboard initialized', 'success');
});
