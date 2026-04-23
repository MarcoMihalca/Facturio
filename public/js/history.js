// ============ AUTENTIFICARE ============
// ============ AUTENTIFICARE ============
const cachedUser = sessionStorage.getItem('facturio_user');
if (cachedUser) document.getElementById('displayUser').textContent = cachedUser;

fetch('/api/me')
    .then(r => { if (!r.ok) window.location.href = '/login.html'; return r.json(); })
    .then(data => { 
        if (data.username) {
            sessionStorage.setItem('facturio_user', data.username);
            document.getElementById('displayUser').textContent = data.username; 
        }
        fetch('/api/avatar').then(res => {
            if (res.ok) {
                const avatarEl = document.querySelector('.user-avatar');
                const v = localStorage.getItem('avatar_v') || '1';
                if (avatarEl) avatarEl.innerHTML = `<img src="/api/avatar?v=${v}" alt="Avatar">`;
            }
        });
    })
    .catch(() => window.location.href = '/login.html');

document.getElementById('btnLogout').addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login.html';
});

// ============ ÎNCĂRCARE FACTURI ============
let allInvoices = [];

async function loadInvoices() {
    try {
        const res = await fetch('/api/invoices');
        if (!res.ok) throw new Error('Eroare la încărcare');
        allInvoices = await res.json();
        
        applyFilters(); // Prima randare cu filtrele default
    } catch (err) {
        console.error(err);
        document.getElementById('invoiceCount').textContent = 'Eroare la încărcare';
    }
}

function applyFilters() {
    const search = document.getElementById('searchClient').value.toLowerCase();
    const dateFilter = document.getElementById('filterDate').value;
    const sortBy = document.getElementById('sortBy').value;

    const customGroup = document.getElementById('customDateGroup');
    if (dateFilter === 'custom') {
        customGroup.style.display = 'flex';
    } else {
        customGroup.style.display = 'none';
    }

    let filtered = allInvoices.filter(inv => {
        // Căutare client
        const matchClient = (inv.client_nume || '').toLowerCase().includes(search);
        
        // Filtru dată
        const invDate = new Date(inv.data_emitere);
        const now = new Date();
        let matchDate = true;

        if (dateFilter === 'today') {
            matchDate = invDate.toDateString() === now.toDateString();
        } else if (dateFilter === 'thisMonth') {
            matchDate = invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
        } else if (dateFilter === 'last3Months') {
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(now.getMonth() - 3);
            matchDate = invDate >= threeMonthsAgo;
        } else if (dateFilter === 'last6Months') {
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(now.getMonth() - 6);
            matchDate = invDate >= sixMonthsAgo;
        } else if (dateFilter === 'thisYear') {
            matchDate = invDate.getFullYear() === now.getFullYear();
        } else if (dateFilter === 'custom') {
            const start = document.getElementById('startDate').value;
            const end = document.getElementById('endDate').value;
            if (start) {
                const sDate = new Date(start);
                sDate.setHours(0,0,0,0);
                if (invDate < sDate) matchDate = false;
            }
            if (end) {
                const eDate = new Date(end);
                eDate.setHours(23,59,59,999);
                if (invDate > eDate) matchDate = false;
            }
        }

        return matchClient && matchDate;
    });

    // Sortare
    filtered.sort((a, b) => {
        if (sortBy === 'dateDesc') return new Date(b.data_emitere) - new Date(a.data_emitere);
        if (sortBy === 'dateAsc') return new Date(a.data_emitere) - new Date(b.data_emitere);
        if (sortBy === 'totalDesc') return (b.total || 0) - (a.total || 0);
        if (sortBy === 'totalAsc') return (a.total || 0) - (b.total || 0);
        if (sortBy === 'clientAsc') return (a.client_nume || '').localeCompare(b.client_nume || '');
        return 0;
    });

    renderInvoices(filtered);
}

function renderInvoices(invoices) {
    // Stats din setul filtrat
    const now = new Date();
    const thisMonthCount = invoices.filter(inv => {
        const d = new Date(inv.data_emitere);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    
    const totalSum = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

    document.getElementById('statTotal').textContent = invoices.length;
    document.getElementById('statMonth').textContent = thisMonthCount;
    document.getElementById('statSum').textContent = `${totalSum.toFixed(2)} RON`;
    document.getElementById('invoiceCount').textContent = `${invoices.length} facturi găsite`;

    // Tabel
    const tbody = document.getElementById('invoiceRows');
    const emptyState = document.getElementById('emptyState');
    const tableWrapper = document.getElementById('tableWrapper');

    if (invoices.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        tableWrapper.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    tableWrapper.style.display = 'block';

    tbody.innerHTML = invoices.map(inv => `
        <tr>
            <td><span class="invoice-id" onclick="previewPdf(${inv.id})" style="cursor: pointer; text-decoration: underline; color: #818cf8;" title="Previzualizează PDF">${inv.serie}${inv.numar}</span></td>
            <td>${inv.client_nume || '—'}</td>
            <td>${formatDate(inv.data_emitere)}</td>
            <td><span class="invoice-total">${(inv.total || 0).toFixed(2)} RON</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn-action" title="Descarcă PDF" onclick="downloadPdf(${inv.id})">📥</button>
                    <button class="btn-action" title="Export XML" onclick="downloadXml(${inv.id})">📄</button>
                    <button class="btn-action delete" title="Șterge" onclick="deleteInvoice(${inv.id})">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Event Listeners pentru filtre
document.getElementById('searchClient').addEventListener('input', applyFilters);
document.getElementById('filterDate').addEventListener('change', applyFilters);
document.getElementById('sortBy').addEventListener('change', applyFilters);
document.getElementById('startDate').addEventListener('change', applyFilters);
document.getElementById('endDate').addEventListener('change', applyFilters);

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ============ ACȚIUNI ============
async function downloadPdf(id) {
    try {
        const res = await fetch(`/api/invoices/${id}`);
        const data = await res.json();

        const pdfRes = await fetch('/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, fromHistory: true }),
        });

        const blob = await pdfRes.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `factura_${data.serie}${data.numar}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (err) {
        alert('Eroare la descărcarea PDF-ului.');
    }
}

async function previewPdf(id) {
    // Deschide un tab sincron pentru a ocoli pop-up blockerele browserului din fetch-uri asincrone
    const newWindow = window.open('', '_blank');
    if(newWindow) newWindow.document.write('<h3>⏱️ Se generează previzualizarea...</h3>');

    try {
        const res = await fetch(`/api/invoices/${id}`);
        const data = await res.json();

        const pdfRes = await fetch('/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, fromHistory: true }),
        });

        const blob = await pdfRes.blob();
        const url = window.URL.createObjectURL(blob);
        
        if(newWindow) {
            newWindow.location.href = url;
        } else {
            // Caz fallback dacă e blocat de browser
            window.open(url, '_blank');
        }
    } catch (err) {
        if(newWindow) newWindow.close();
        alert('Eroare la previzualizarea PDF-ului.');
    }
}

async function downloadXml(id) {
    try {
        const res = await fetch(`/api/invoices/${id}`);
        const data = await res.json();

        const xmlRes = await fetch('/api/export-xml', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const blob = await xmlRes.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `efactura_${data.serie}${data.numar}.xml`;
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (err) {
        alert('Eroare la exportul XML.');
    }
}

async function deleteInvoice(id) {
    if (!confirm('Sigur vrei să ștergi această factură?')) return;

    try {
        const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
        if (res.ok) {
            loadInvoices(); // Reîncarcă lista
        } else {
            alert('Eroare la ștergere.');
        }
    } catch (err) {
        alert('Eroare la ștergere.');
    }
}

// Încarcă la start
loadInvoices();
