// public/js/navbar.js
(function() {
    const currentPath = window.location.pathname;
    const isDashboardPage = currentPath === '/' || currentPath === '/index.html';

    const dashboardWidgetToggles = [
        { key: 'card-total-incasari', label: 'Card: Total Încasări' },
        { key: 'card-total-facturi', label: 'Card: Facturi Emise' },
        { key: 'card-total-tva', label: 'Card: TVA Colectat' },
        { key: 'card-top-client', label: 'Card: Cel Mai Bun Client' },
        { key: 'card-revenue-chart', label: 'Chart: Evoluție Venituri' },
        { key: 'card-clients-chart', label: 'Chart: Top Clienți' },
        { key: 'card-top-products-chart', label: 'Chart: Top Produse / Servicii' },
        { key: 'card-net-vat-chart', label: 'Chart: Raport Net vs TVA' },
        { key: 'card-year-comparison-chart', label: 'Chart: An Curent vs Anul Trecut' },
        { key: 'card-status-distribution-chart', label: 'Chart: Distribuție După Status' },
        { key: 'card-recent-invoices', label: 'Card: Ultimele Facturi' }
    ];

    const dashboardWidgetDefaults = dashboardWidgetToggles.reduce((acc, item) => {
        acc[item.key] = true;
        return acc;
    }, {});

    function getSavedWidgetVisibility() {
        let parsed = {};

        try {
            parsed = JSON.parse(localStorage.getItem('dashboardWidgetVisibility') || '{}');
        } catch (error) {
            parsed = {};
        }

        return { ...dashboardWidgetDefaults, ...parsed };
    }

    function getWidgetToggleHtml() {
        if (!isDashboardPage) {
            return '<p style="font-size: 12px; color: var(--text-subtle, #94a3b8); margin: 0 0 10px 0;">Setările de vizibilitate sunt disponibile pe pagina Dashboard.</p>';
        }

        return `
        <div class="dashboard-settings-toggle-list">
            <p style="font-size: 12px; margin: 0 0 10px 0; color: var(--text-main); font-weight: 600;">Vizibilitate carduri și grafice</p>
            ${dashboardWidgetToggles.map(item => `
                <label class="dashboard-settings-toggle-item">
                    <span class="dashboard-settings-toggle-label">${item.label}</span>
                    <input type="checkbox" class="nav-widget-toggle dashboard-settings-toggle-switch" data-widget-key="${item.key}" checked>
                </label>
            `).join('')}
        </div>
        `;
    }

    function getDashboardSettingsHtml() {
        if (!isDashboardPage) {
            return '';
        }

        return `
            <div style="position: relative;">
                <button id="dashboardSettingsBtn" class="dashboard-settings-btn" type="button" aria-label="Setări dashboard" title="Setări dashboard">⚙️</button>
                <div id="dashboardSettingsModal" class="dashboard-settings-modal">
                    <div class="dashboard-settings-modal-body">
                        <h4 style="margin: 0 0 15px 0; font-size: 14px; color: var(--text-main);">⚙️ Setări Dashboard</h4>
                        <div style="margin-bottom: 15px;">
                            <label style="font-size: 12px; display: block; margin-bottom: 5px; color: var(--text-main);">Top clienți pe grafic</label>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <input type="range" id="navTopClientsRange" min="1" max="20" style="flex: 1;">
                                <input type="number" id="navTopClients" min="1" max="20" style="width: 50px; padding: 4px; text-align: center; border-radius: 4px; border: 1px solid var(--border-color);">
                            </div>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="font-size: 12px; display: block; margin-bottom: 5px; color: var(--text-main);">Ultimele facturi afișate</label>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <input type="range" id="navRecentInvoicesRange" min="1" max="10" style="flex: 1;">
                                <input type="number" id="navRecentInvoices" min="1" max="10" style="width: 50px; padding: 4px; text-align: center; border-radius: 4px; border: 1px solid var(--border-color);">
                            </div>
                        </div>
                        ${getWidgetToggleHtml()}
                    </div>
                    <div class="dashboard-settings-modal-footer">
                        <button id="navSaveSettings" style="width: 100%; padding: 8px; background: #6366f1; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Salvează</button>
                    </div>
                </div>
            </div>
        `;
    }

    const navHTML = `
    <nav class="navbar">
        <a href="/" class="nav-brand" style="text-decoration: none; cursor: pointer;">
            <div class="nav-logo">📄</div>
            <span class="nav-title">Facturio</span>
        </a>
        <div class="nav-links">
            <a href="/" class="nav-link ${currentPath === '/' || currentPath === '/index.html' ? 'active' : ''}">📊 Dashboard</a>
            <a href="/invoice.html" class="nav-link ${currentPath === '/invoice.html' ? 'active' : ''}">＋ Factură nouă</a>
            <a href="/history.html" class="nav-link ${currentPath === '/history.html' ? 'active' : ''}">📁 Istoric</a>
            <a href="/profile.html" class="nav-link mobile-only ${currentPath === '/profile.html' ? 'active' : ''}">👤 Contul meu</a>
            <a href="#" class="nav-link logout-link btnLogoutAction" style="color: #fca5a5; margin-top: auto;">🚪 Deconectare</a>
        </div>
        <div class="nav-user">
            <div class="theme-toggle-wrapper" style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 14px; opacity: 0.8;">☀️</span>
                <label class="toggle-switch tooltip-container" style="margin: 0; position: relative;" title="Schimbă tema">
                    <input type="checkbox" class="theme-toggle-checkbox">
                    <span class="toggle-slider"></span>
                    <div class="custom-tooltip" style="top: 120%; left: 50%; transform: translateX(-50%); white-space: nowrap;">Schimbă tema luminos / întunecat</div>
                </label>
                <span style="font-size: 14px; opacity: 0.8;">🌙</span>
            </div>
            ${getDashboardSettingsHtml()}
            <a href="/profile.html" class="user-info" style="text-decoration: none;">
                <div class="user-avatar">👤</div>
                <span class="user-name" id="displayUser">—</span>
            </a>
            <button class="btn-logout btnLogoutAction" id="btnLogout">Deconectare</button>
        </div>
        <button class="menu-toggle" id="menuToggle">
            <span></span>
            <span></span>
            <span></span>
        </button>
    </nav>
    `;

    const placeholder = document.getElementById('navbar-placeholder');
    if (placeholder) {
        placeholder.outerHTML = navHTML;
    }

    // ============ AUTENTIFICARE ============
    const cachedUser = sessionStorage.getItem('facturio_user');
    if (cachedUser) {
        const displayUser = document.getElementById('displayUser');
        if (displayUser) displayUser.textContent = cachedUser;
    }

    fetch('/api/me')
        .then(r => { if (!r.ok) window.location.href = '/login.html'; return r.json(); })
        .then(data => { 
            if (data.username) {
                sessionStorage.setItem('facturio_user', data.username);
                const displayUser = document.getElementById('displayUser');
                if (displayUser) displayUser.textContent = data.username; 
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

    document.querySelectorAll('.btnLogoutAction').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = '/login.html';
        });
    });
    // Logica pentru Setări Dashboard globale
    const btnSettings = document.getElementById('dashboardSettingsBtn');
    const modalSettings = document.getElementById('dashboardSettingsModal');
    
    if (btnSettings && modalSettings) {
        // Toggle modal
        btnSettings.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = modalSettings.style.display === 'flex';
            modalSettings.style.display = isOpen ? 'none' : 'flex';
            btnSettings.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
        });

        // Închide modalul la click în afară
        document.addEventListener('click', (e) => {
            if (!modalSettings.contains(e.target) && e.target !== btnSettings) {
                modalSettings.style.display = 'none';
                btnSettings.style.transform = 'rotate(0deg)';
            }
        });

        // Nu închide la click în interior
        modalSettings.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        const numTop = document.getElementById('navTopClients');
        const rangeTop = document.getElementById('navTopClientsRange');
        const numRecent = document.getElementById('navRecentInvoices');
        const rangeRecent = document.getElementById('navRecentInvoicesRange');
        const btnSave = document.getElementById('navSaveSettings');
        const widgetToggles = Array.from(document.querySelectorAll('.nav-widget-toggle'));

        // Încărcare valori
        const savedTop = localStorage.getItem('dashboardTopClients') || '5';
        const savedRecent = localStorage.getItem('dashboardRecentInvoices') || '5';
        const savedVisibility = getSavedWidgetVisibility();
        
        numTop.value = savedTop;
        rangeTop.value = savedTop;
        numRecent.value = savedRecent;
        rangeRecent.value = savedRecent;
        widgetToggles.forEach((toggle) => {
            const key = toggle.dataset.widgetKey;
            toggle.checked = savedVisibility[key] !== false;
        });

        // Sincronizare input-uri
        rangeTop.addEventListener('input', (e) => numTop.value = e.target.value);
        numTop.addEventListener('input', (e) => rangeTop.value = e.target.value);
        
        rangeRecent.addEventListener('input', (e) => numRecent.value = e.target.value);
        numRecent.addEventListener('input', (e) => rangeRecent.value = e.target.value);

        // Salvare și reîncărcare
        btnSave.addEventListener('click', () => {
            let topC = parseInt(numTop.value) || 5;
            let recI = parseInt(numRecent.value) || 5;

            if (topC < 1) topC = 1; if (topC > 20) topC = 20;
            if (recI < 1) recI = 1; if (recI > 10) recI = 10;

            localStorage.setItem('dashboardTopClients', topC);
            localStorage.setItem('dashboardRecentInvoices', recI);
            if (isDashboardPage) {
                const widgetVisibility = {};
                widgetToggles.forEach((toggle) => {
                    widgetVisibility[toggle.dataset.widgetKey] = toggle.checked;
                });
                localStorage.setItem('dashboardWidgetVisibility', JSON.stringify(widgetVisibility));
            }
            
            modalSettings.style.display = 'none';
            btnSettings.style.transform = 'rotate(0deg)';
            
            // Dacă suntem pe dashboard, reîncărcăm pagina ca să aplice setările
            if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
                window.location.reload();
            }
        });
    }

})();
