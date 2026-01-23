/**
 * AutoBuilder v4 - Theme Logic
 * Handles Light/Dark mode switching and persistence.
 */

(function () {
    'use strict';

    function initTheme() {
        const themeToggle = document.getElementById('theme-toggle');
        const themeIcon = document.getElementById('theme-icon');
        const htmlElement = document.documentElement;

        if (!themeToggle || !themeIcon) {
            console.warn('[Theme] Toggle elements not found, retrying...');
            setTimeout(initTheme, 100);
            return;
        }

        function updateIcon(theme) {
            if (theme === 'dark') {
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.add('fa-sun');
            } else {
                themeIcon.classList.remove('fa-sun');
                themeIcon.classList.add('fa-moon');
            }
        }

        // Set initial icon based on current class
        const isDark = htmlElement.classList.contains('dark');
        updateIcon(isDark ? 'dark' : 'light');

        themeToggle.addEventListener('click', () => {
            const isNowDark = htmlElement.classList.toggle('dark');
            const theme = isNowDark ? 'dark' : 'light';

            localStorage.setItem('theme', theme);
            updateIcon(theme);

            console.log(`[Theme] Switched to ${theme} mode`);
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTheme);
    } else {
        initTheme();
    }

})();
