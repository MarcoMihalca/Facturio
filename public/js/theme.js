// Preia tema din localStorage sau folosește 'dark' implicit
const currentTheme = localStorage.getItem('theme') || 'dark';

// Setează pe body atributul de temă Imediat! (evită flash-ul alb/negru)
document.documentElement.setAttribute('data-theme', currentTheme);

document.addEventListener('DOMContentLoaded', () => {
    // Găsește checkbox-urile de toggle (slider)
    const toggleCheckboxes = document.querySelectorAll('.theme-toggle-checkbox');
    
    // Setează starea curentă
    toggleCheckboxes.forEach(checkbox => {
        checkbox.checked = (currentTheme === 'dark');
        
        checkbox.addEventListener('change', (e) => {
            const newTheme = e.target.checked ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Sincronizează toate sliderele (dacă există mai multe pe pagină)
            toggleCheckboxes.forEach(cb => cb.checked = e.target.checked);
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
