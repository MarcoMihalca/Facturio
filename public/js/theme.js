// Preia tema din localStorage sau folosește 'dark' implicit
const currentTheme = localStorage.getItem('theme') || 'dark';

// Setează pe body atributul de temă Imediat! (evită flash-ul alb/negru)
document.documentElement.setAttribute('data-theme', currentTheme);

document.addEventListener('DOMContentLoaded', () => {
    // Găsește butonul (butoanele) de toggle
    const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
    
    // Setează iconița corectă la start
    const updateIcons = (theme) => {
        toggleBtns.forEach(btn => {
            btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
        });
    };
    
    updateIcons(currentTheme);

    // Event listener pentru fiecare buton de toggle
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateIcons(newTheme);
        });
    });

    // --- LOGICA PENTRU MENIU MOBIL ---
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('open');
            navLinks.classList.toggle('open');
        });

        // Închide meniul când se dă click pe un link (util pentru SPA sau pentru feedback vizual)
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('open');
                navLinks.classList.remove('open');
            });
        });

        // Închide meniul dacă se dă click în afara lui
        document.addEventListener('click', (e) => {
            if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
                menuToggle.classList.remove('open');
                navLinks.classList.remove('open');
            }
        });
    }
});
