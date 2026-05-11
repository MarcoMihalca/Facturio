// ============ CONFIG & GLOBALS ============
let allInvoices = [];
let dashboardAnalytics = { topProducts: [] };

let revenueChartInstance = null;
let clientsChartInstance = null;
let topProductsChartInstance = null;
let netVatChartInstance = null;
let yearComparisonChartInstance = null;
let statusDistributionChartInstance = null;

// Extrage preferintele utilizatorului
const prefTopClients = parseInt(localStorage.getItem('dashboardTopClients')) || 5;
const prefRecentInvoices = parseInt(localStorage.getItem('dashboardRecentInvoices')) || 5;
let prefRevenueType = localStorage.getItem('dashboardRevenueType') || 'line';
let prefClientsType = localStorage.getItem('dashboardClientsType') || 'doughnut';
let prefTopProductsType = localStorage.getItem('dashboardTopProductsType') || 'bar';
let prefNetVatType = localStorage.getItem('dashboardNetVatType') || 'doughnut';
let prefYearComparisonType = localStorage.getItem('dashboardYearComparisonType') || 'bar';
let prefStatusDistributionType = localStorage.getItem('dashboardStatusDistributionType') || 'pie';

const DASHBOARD_WIDGET_DEFAULTS = {
    'card-total-incasari': true,
    'card-total-facturi': true,
    'card-total-tva': true,
    'card-top-client': true,
    'card-revenue-chart': true,
    'card-clients-chart': true,
    'card-top-products-chart': true,
    'card-net-vat-chart': true,
    'card-year-comparison-chart': true,
    'card-status-distribution-chart': true,
    'card-recent-invoices': true
};

const MONTH_NAMES = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toNumber(value) {
    return Number.parseFloat(value) || 0;
}

function formatCurrency(value) {
    return `${toNumber(value).toFixed(2)} RON`;
}

function toDateOnly(value) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
}

function getInvoiceStatus(invoice) {
    const today = toDateOnly(new Date());

    if (!invoice.data_scadenta) {
        return 'Fara scadenta';
    }

    const dueDate = toDateOnly(invoice.data_scadenta);

    if (dueDate < today) {
        return 'Intarziata';
    }

    if (dueDate.getTime() === today.getTime()) {
        return 'Scadenta azi';
    }

    return 'In termen';
}

function getStatusBadgeHtml(status) {
    const badges = {
        'In termen': 'background: rgba(34,197,94,0.15); color: #22c55e;',
        'Scadenta azi': 'background: rgba(245,158,11,0.18); color: #f59e0b;',
        'Intarziata': 'background: rgba(239,68,68,0.15); color: #ef4444;',
        'Fara scadenta': 'background: rgba(148,163,184,0.16); color: #94a3b8;'
    };

    const style = badges[status] || badges['Fara scadenta'];
    return `<span style="${style} padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">${status}</span>`;
}

function getDashboardWidgetVisibility() {
    let parsed = {};

    try {
        parsed = JSON.parse(localStorage.getItem('dashboardWidgetVisibility') || '{}');
    } catch (error) {
        parsed = {};
    }

    return { ...DASHBOARD_WIDGET_DEFAULTS, ...parsed };
}

function applyDashboardWidgetVisibility() {
    const visibility = getDashboardWidgetVisibility();

    Object.keys(DASHBOARD_WIDGET_DEFAULTS).forEach((widgetId) => {
        const element = document.getElementById(widgetId);
        if (!element) return;
        element.style.display = visibility[widgetId] === false ? 'none' : '';
    });
}

function setupChartTypeToggles() {
    const toggleConfigs = [
        {
            toggleId: '#revenueTypeToggle',
            getType: () => prefRevenueType,
            setType: (value) => {
                prefRevenueType = value;
                localStorage.setItem('dashboardRevenueType', value);
            }
        },
        {
            toggleId: '#clientsTypeToggle',
            getType: () => prefClientsType,
            setType: (value) => {
                prefClientsType = value;
                localStorage.setItem('dashboardClientsType', value);
            }
        },
        {
            toggleId: '#topProductsTypeToggle',
            getType: () => prefTopProductsType,
            setType: (value) => {
                prefTopProductsType = value;
                localStorage.setItem('dashboardTopProductsType', value);
            }
        },
        {
            toggleId: '#netVatTypeToggle',
            getType: () => prefNetVatType,
            setType: (value) => {
                prefNetVatType = value;
                localStorage.setItem('dashboardNetVatType', value);
            }
        },
        {
            toggleId: '#yearComparisonTypeToggle',
            getType: () => prefYearComparisonType,
            setType: (value) => {
                prefYearComparisonType = value;
                localStorage.setItem('dashboardYearComparisonType', value);
            }
        },
        {
            toggleId: '#statusDistributionTypeToggle',
            getType: () => prefStatusDistributionType,
            setType: (value) => {
                prefStatusDistributionType = value;
                localStorage.setItem('dashboardStatusDistributionType', value);
            }
        }
    ];

    toggleConfigs.forEach((config) => {
        const buttons = document.querySelectorAll(`${config.toggleId} .chart-type-btn`);
        buttons.forEach((btn) => {
            if (btn.dataset.type === config.getType()) btn.classList.add('active');
            else btn.classList.remove('active');

            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                config.setType(type);
                buttons.forEach((b) => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                renderCharts();
            });
        });
    });
}

async function loadInvoices() {
    try {
        const res = await fetch('/api/invoices');
        if (res.ok) {
            allInvoices = await res.json();
            return;
        }
        console.error('Failed to load invoices');
    } catch (e) {
        console.error('Error fetching invoices:', e);
    }

    allInvoices = [];
}

async function loadDashboardAnalytics() {
    try {
        const res = await fetch('/api/dashboard/analytics');
        if (res.ok) {
            dashboardAnalytics = await res.json();
            return;
        }
        console.error('Failed to load dashboard analytics');
    } catch (e) {
        console.error('Error fetching dashboard analytics:', e);
    }

    dashboardAnalytics = { topProducts: [] };
}

// ============ INITIALIZARE ============
async function initDashboard() {
    await Promise.all([loadInvoices(), loadDashboardAnalytics()]);

    document.getElementById('recentInvoicesSubtitle').textContent = `Ultimele ${prefRecentInvoices} facturi generate`;
    applyDashboardWidgetVisibility();

    renderStats();
    renderCharts();
    renderRecentInvoices();
}

// ============ STATS ROW ============
function renderStats() {
    const period = document.getElementById('statPeriodToggle').value;
    const now = new Date();
    const currMonth = now.getMonth();
    const currYear = now.getFullYear();

    let totalIncasari = 0;
    let facturiEmise = 0;
    let totalTva = 0;

    const clientTotals = {};

    allInvoices.forEach((inv) => {
        const date = new Date(inv.data_emitere);
        let inPeriod = false;

        if (period === 'month') {
            inPeriod = date.getMonth() === currMonth && date.getFullYear() === currYear;
        } else if (period === '3months') {
            const limit = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
            inPeriod = date >= limit;
        } else if (period === '6months') {
            const limit = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
            inPeriod = date >= limit;
        } else if (period === 'year') {
            inPeriod = date.getFullYear() === currYear;
        }

        if (!inPeriod) return;

        facturiEmise += 1;

        const total = toNumber(inv.total);
        totalIncasari += total;
        totalTva += toNumber(inv.total_tva);

        const clientName = inv.client_nume || 'Necunoscut';
        if (!clientTotals[clientName]) clientTotals[clientName] = 0;
        clientTotals[clientName] += total;
    });

    let bestClient = '-';
    let maxTotal = 0;

    for (const [name, value] of Object.entries(clientTotals)) {
        if (value > maxTotal) {
            maxTotal = value;
            bestClient = name;
        }
    }

    document.getElementById('dashTotalIncasari').textContent = formatCurrency(totalIncasari);
    document.getElementById('dashTotalFacturi').textContent = facturiEmise;
    document.getElementById('dashTotalTva').textContent = formatCurrency(totalTva);
    document.getElementById('dashTopClient').textContent = bestClient;
}

document.getElementById('statPeriodToggle').addEventListener('change', () => {
    renderStats();
    renderCharts();
});

// ============ CHARTS ============
function renderCharts() {
    const style = getComputedStyle(document.body);
    const textColor = style.getPropertyValue('--text-main').trim() || '#334155';
    const gridColor = style.getPropertyValue('--border-color').trim() || '#e2e8f0';

    Chart.defaults.color = textColor;
    Chart.defaults.font.family = "'Inter', sans-serif";

    renderRevenueChart(gridColor);
    renderClientsChart(gridColor);
    renderTopProductsChart(gridColor);
    renderNetVsVatChart(gridColor);
    renderYearComparisonChart(gridColor);
    renderStatusDistributionChart(gridColor);
}

function renderRevenueChart(gridColor) {
    const revCanvas = document.getElementById('revenueChart');
    if (!revCanvas) return;

    const revCtx = revCanvas.getContext('2d');
    const now = new Date();
    const labels = [];
    const monthlyTotals = [0, 0, 0, 0, 0, 0];

    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(`${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`);
    }

    allInvoices.forEach((inv) => {
        const invoiceDate = new Date(inv.data_emitere);

        for (let i = 0; i < 6; i++) {
            const targetMonth = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
            if (
                invoiceDate.getMonth() === targetMonth.getMonth() &&
                invoiceDate.getFullYear() === targetMonth.getFullYear()
            ) {
                monthlyTotals[i] += toNumber(inv.total);
            }
        }
    });

    if (revenueChartInstance) revenueChartInstance.destroy();

    const gradient = revCtx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

    revenueChartInstance = new Chart(revCtx, {
        type: prefRevenueType,
        data: {
            labels,
            datasets: [{
                label: 'Incasari (RON)',
                data: monthlyTotals,
                borderColor: '#6366f1',
                backgroundColor: prefRevenueType === 'bar' ? '#6366f1' : gradient,
                borderWidth: 3,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#6366f1',
                pointBorderWidth: 2,
                pointRadius: 4,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: gridColor, drawBorder: false } },
                x: { grid: { display: false, drawBorder: false } }
            }
        }
    });
}

function renderClientsChart(gridColor) {
    const clientCanvas = document.getElementById('clientsChart');
    if (!clientCanvas) return;

    const clientCtx = clientCanvas.getContext('2d');
    const clientTotals = {};

    allInvoices.forEach((inv) => {
        const name = inv.client_nume || 'Necunoscut';
        if (!clientTotals[name]) clientTotals[name] = 0;
        clientTotals[name] += toNumber(inv.total);
    });

    const sortedClients = Object.entries(clientTotals).sort((a, b) => b[1] - a[1]);
    const topClients = sortedClients.slice(0, prefTopClients);

    let othersTotal = 0;
    if (sortedClients.length > prefTopClients) {
        othersTotal = sortedClients.slice(prefTopClients).reduce((sum, item) => sum + item[1], 0);
    }

    const labels = topClients.map((c) => c[0]);
    const data = topClients.map((c) => c[1]);

    if (othersTotal > 0) {
        labels.push('Altii');
        data.push(othersTotal);
    }

    if (labels.length === 0) {
        labels.push('Fara date');
        data.push(1);
    }

    if (clientsChartInstance) clientsChartInstance.destroy();

    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#64748b'];

    clientsChartInstance = new Chart(clientCtx, {
        type: prefClientsType,
        data: {
            labels,
            datasets: [{
                label: 'Total Facturat',
                data,
                backgroundColor: colors,
                borderWidth: prefClientsType === 'bar' ? 1 : 0,
                borderColor: prefClientsType === 'bar' ? '#334155' : undefined,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: prefClientsType === 'doughnut' ? '70%' : undefined,
            plugins: {
                legend: {
                    position: prefClientsType === 'bar' ? 'top' : 'bottom',
                    display: prefClientsType !== 'bar',
                    labels: {
                        boxWidth: 12,
                        padding: 15
                    }
                }
            },
            scales: prefClientsType === 'bar'
                ? {
                    y: { beginAtZero: true, grid: { color: gridColor } },
                    x: { grid: { display: false } }
                }
                : {}
        }
    });
}

function renderTopProductsChart(gridColor) {
    const topProductsCanvas = document.getElementById('topProductsChart');
    if (!topProductsCanvas) return;

    const topProductsCtx = topProductsCanvas.getContext('2d');
    const products = Array.isArray(dashboardAnalytics.topProducts) ? dashboardAnalytics.topProducts : [];

    const labels = products.map((p) => (p.name || 'Necunoscut').slice(0, 28));
    const totals = products.map((p) => toNumber(p.totalAmount));
    const quantities = products.map((p) => toNumber(p.totalQty));

    if (labels.length === 0) {
        labels.push('Fara date');
        totals.push(0);
        quantities.push(0);
    }

    if (topProductsChartInstance) topProductsChartInstance.destroy();

    const palette = ['#0ea5e9', '#38bdf8', '#60a5fa', '#6366f1', '#8b5cf6', '#ec4899', '#22c55e', '#f59e0b'];
    const isBarType = prefTopProductsType === 'bar';

    topProductsChartInstance = new Chart(topProductsCtx, {
        type: prefTopProductsType,
        data: {
            labels,
            datasets: [{
                label: 'Total facturat (RON)',
                data: totals,
                backgroundColor: isBarType ? 'rgba(14, 165, 233, 0.75)' : labels.map((_, i) => palette[i % palette.length]),
                borderColor: 'rgba(14, 165, 233, 1)',
                borderWidth: 1,
                borderRadius: isBarType ? 8 : 0
            }]
        },
        options: {
            indexAxis: isBarType ? 'y' : 'x',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: !isBarType, position: 'bottom' },
                tooltip: {
                    callbacks: {
                        afterLabel: (ctx) => `Cantitate vanduta: ${quantities[ctx.dataIndex].toFixed(2)}`
                    }
                }
            },
            scales: isBarType
                ? {
                    x: { beginAtZero: true, grid: { color: gridColor } },
                    y: { grid: { display: false } }
                }
                : {}
        }
    });
}

function renderNetVsVatChart(gridColor) {
    const netVatCanvas = document.getElementById('netVsVatChart');
    if (!netVatCanvas) return;

    const netVatCtx = netVatCanvas.getContext('2d');

    const netTotal = allInvoices.reduce((sum, inv) => sum + toNumber(inv.subtotal), 0);
    const vatTotal = allInvoices.reduce((sum, inv) => sum + toNumber(inv.total_tva), 0);

    const hasData = netTotal > 0 || vatTotal > 0;
    const data = hasData ? [netTotal, vatTotal] : [1, 0];

    if (netVatChartInstance) netVatChartInstance.destroy();

    const isBarType = prefNetVatType === 'bar';

    netVatChartInstance = new Chart(netVatCtx, {
        type: prefNetVatType,
        data: {
            labels: hasData ? ['Net', 'TVA'] : ['Fara date', 'TVA'],
            datasets: [{
                data,
                backgroundColor: ['#3b82f6', '#f59e0b'],
                borderWidth: isBarType ? 1 : 0,
                borderRadius: isBarType ? 8 : 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: prefNetVatType === 'doughnut' ? '68%' : undefined,
            plugins: {
                legend: { position: 'bottom' }
            },
            scales: isBarType
                ? {
                    y: { beginAtZero: true, grid: { color: gridColor } },
                    x: { grid: { display: false } }
                }
                : {}
        }
    });
}

function renderYearComparisonChart(gridColor) {
    const yearComparisonCanvas = document.getElementById('yearComparisonChart');
    if (!yearComparisonCanvas) return;

    const yearComparisonCtx = yearComparisonCanvas.getContext('2d');
    const now = new Date();
    const currentYear = now.getFullYear();
    const lastYear = currentYear - 1;

    const currentYearTotals = new Array(12).fill(0);
    const lastYearTotals = new Array(12).fill(0);

    allInvoices.forEach((inv) => {
        const date = new Date(inv.data_emitere);
        const month = date.getMonth();
        const total = toNumber(inv.total);

        if (date.getFullYear() === currentYear) {
            currentYearTotals[month] += total;
        } else if (date.getFullYear() === lastYear) {
            lastYearTotals[month] += total;
        }
    });

    if (yearComparisonChartInstance) yearComparisonChartInstance.destroy();

    const isLineType = prefYearComparisonType === 'line';

    yearComparisonChartInstance = new Chart(yearComparisonCtx, {
        type: prefYearComparisonType,
        data: {
            labels: MONTH_NAMES,
            datasets: [
                {
                    label: String(currentYear),
                    data: currentYearTotals,
                    backgroundColor: isLineType ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.78)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderRadius: isLineType ? 0 : 6,
                    borderWidth: isLineType ? 3 : 1,
                    fill: false,
                    tension: 0.35,
                    pointRadius: isLineType ? 3 : 0
                },
                {
                    label: String(lastYear),
                    data: lastYearTotals,
                    backgroundColor: isLineType ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.72)',
                    borderColor: 'rgba(148, 163, 184, 1)',
                    borderRadius: isLineType ? 0 : 6,
                    borderWidth: isLineType ? 3 : 1,
                    fill: false,
                    tension: 0.35,
                    pointRadius: isLineType ? 3 : 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: {
                y: { beginAtZero: true, grid: { color: gridColor } },
                x: { grid: { display: false } }
            }
        }
    });
}

function renderStatusDistributionChart(gridColor) {
    const statusCanvas = document.getElementById('statusDistributionChart');
    if (!statusCanvas) return;

    const statusCtx = statusCanvas.getContext('2d');
    const counts = {
        'In termen': 0,
        'Scadenta azi': 0,
        'Intarziata': 0,
        'Fara scadenta': 0
    };

    allInvoices.forEach((inv) => {
        const status = getInvoiceStatus(inv);
        counts[status] = (counts[status] || 0) + 1;
    });

    const labels = [];
    const data = [];

    Object.entries(counts).forEach(([status, value]) => {
        if (value > 0) {
            labels.push(status);
            data.push(value);
        }
    });

    if (labels.length === 0) {
        labels.push('Fara date');
        data.push(1);
    }

    if (statusDistributionChartInstance) statusDistributionChartInstance.destroy();

    const isBarType = prefStatusDistributionType === 'bar';

    statusDistributionChartInstance = new Chart(statusCtx, {
        type: prefStatusDistributionType,
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: ['#22c55e', '#f59e0b', '#ef4444', '#94a3b8'],
                borderRadius: isBarType ? 8 : 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            },
            cutout: prefStatusDistributionType === 'doughnut' ? '65%' : undefined,
            scales: isBarType
                ? {
                    y: { beginAtZero: true, grid: { color: gridColor } },
                    x: { grid: { display: false } }
                }
                : {}
        }
    });
}

// ============ RECENT INVOICES ============
function renderRecentInvoices() {
    const tbody = document.getElementById('recentInvoicesRows');
    const emptyState = document.getElementById('emptyState');
    const tableWrapper = document.getElementById('tableWrapper');

    if (allInvoices.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        tableWrapper.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    tableWrapper.style.display = 'block';

    const sorted = [...allInvoices].sort((a, b) => new Date(b.data_emitere) - new Date(a.data_emitere));
    const recent = sorted.slice(0, prefRecentInvoices);

    tbody.innerHTML = recent.map((inv) => {
        const status = getInvoiceStatus(inv);
        const statusHtml = getStatusBadgeHtml(status);

        const date = new Date(inv.data_emitere);
        const dateStr = date.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' });

        return `
        <tr>
            <td><a href="/history.html" style="color: #818cf8; text-decoration: none; font-weight: 500;">${inv.serie}${inv.numar}</a></td>
            <td>${inv.client_nume || '—'}</td>
            <td>${dateStr}</td>
            <td><strong>${formatCurrency(inv.total)}</strong></td>
            <td>${statusHtml}</td>
        </tr>
        `;
    }).join('');
}

// Listen for theme changes to re-render charts with correct colors
const observer = new MutationObserver(() => {
    if (
        revenueChartInstance ||
        clientsChartInstance ||
        topProductsChartInstance ||
        netVatChartInstance ||
        yearComparisonChartInstance ||
        statusDistributionChartInstance
    ) {
        renderCharts();
    }
});

observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

setupChartTypeToggles();
initDashboard();
