/**
 * AutoBuilder v4.0 - Navigation Logic
 * ====================================
 * Handles window switching and navigation state management.
 */

(function () {
    'use strict';

    // ========================================
    // Window Mapping
    // ========================================
    const WINDOW_MAP = {
        'chat': { panel: 'chatbot-container', title: 'Chatbot' },
        'history': { panel: 'window-history', title: 'Histórico' },
        'form': { panel: 'window-form', title: 'Formulário' },
        'cover': { panel: 'window-cover', title: 'Capa' },
        'leaf': { panel: 'window-leaf', title: 'Folha Vazia' },
        'video_intro': { panel: 'window-video_intro', title: 'Animação' },
        'fill_leaf': { panel: 'window-fill_leaf', title: 'Preencher' },
        'gifts': { panel: 'window-gifts', title: 'Presentes' },
        'manual': { panel: 'window-manual', title: 'Manual' },
        'music': { panel: 'window-music', title: 'Música' },
        'finalize': { panel: 'window-finalize', title: 'Finalizar' }
    };

    // Current active window
    let currentWindow = 'chat';

    // ========================================
    // Core Functions
    // ========================================

    /**
     * Shows a specific window and hides all others.
     * @param {string} windowId - The ID of the window to show (e.g., 'chat', 'cover')
     */
    function showWindow(windowId) {
        if (!WINDOW_MAP[windowId]) {
            console.error(`Window "${windowId}" not found in WINDOW_MAP`);
            return;
        }

        // Hide all window panels
        const allPanels = document.querySelectorAll('.window-panel');
        allPanels.forEach(panel => {
            panel.classList.add('hidden');
        });

        // Show the target panel
        const targetPanel = document.getElementById(WINDOW_MAP[windowId].panel);
        if (targetPanel) {
            targetPanel.classList.remove('hidden');
        }

        // Update header title
        const headerTitle = document.getElementById('header-title');
        if (headerTitle) {
            headerTitle.textContent = WINDOW_MAP[windowId].title;
        }

        // Update navigation buttons
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            const btnWindow = btn.getAttribute('data-window');
            if (btnWindow === windowId) {
                btn.classList.remove('text-slate-400', 'hover:bg-slate-800', 'hover:text-white');
                btn.classList.add('bg-brand-600', 'text-white', 'shadow-md', 'active');
            } else {
                btn.classList.remove('bg-brand-600', 'text-white', 'shadow-md', 'active');
                btn.classList.add('text-slate-400', 'hover:bg-slate-800', 'hover:text-white');
            }
        });

        // Update current window state
        currentWindow = windowId;

        // Dispatch custom event for other modules
        document.dispatchEvent(new CustomEvent('windowChanged', {
            detail: { windowId, title: WINDOW_MAP[windowId].title }
        }));

        console.log(`[Navigation] Switched to window: ${windowId}`);
    }

    /**
     * Gets the currently active window ID.
     * @returns {string} The current window ID
     */
    function getCurrentWindow() {
        return currentWindow;
    }

    // ========================================
    // Event Listeners
    // ========================================

    function initNavigation() {
        // Sidebar navigation buttons
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', function () {
                const windowId = this.getAttribute('data-window');
                if (windowId) {
                    showWindow(windowId);
                }
            });
        });

        // Mobile preview button (if exists)
        const mobilePreviewBtn = document.getElementById('btn-mobile-preview');
        if (mobilePreviewBtn) {
            mobilePreviewBtn.addEventListener('click', function () {
                // Toggle mobile preview modal (to be implemented)
                console.log('[Navigation] Mobile preview triggered');
            });
        }

        console.log('[Navigation] Initialized with', navButtons.length, 'navigation buttons');
    }

    // ========================================
    // Initialize on DOM Ready
    // ========================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNavigation);
    } else {
        initNavigation();
    }

    // ========================================
    // Expose to Global Scope
    // ========================================
    window.AutoBuilderNav = {
        showWindow,
        getCurrentWindow,
        WINDOW_MAP
    };

})();
