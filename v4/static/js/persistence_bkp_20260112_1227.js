/**
 * AutoBuilder v4.0 - Persistence Module
 * ======================================
 * Saves and restores the builder state using localStorage.
 * Prevents data loss on page reload.
 */

(function () {
    'use strict';

    const STORAGE_KEY = 'autobuilder_v4_state';
    const SAVE_DELAY = 1000; // 1 second debounce

    let saveTimeout;

    // ========================================
    // Core Functions
    // ========================================

    /**
     * Saves the current application state to localStorage.
     */
    function saveState() {
        if (!window.builderState) return;

        const stateToSave = {
            formData: window.builderState.formData || {},
            assets: window.builderState.assets || {},
            linksExtras: window.builderState.linksExtras || [],
            timestamp: Date.now()
        };

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
            console.log('[Persistence] State saved', new Date().toLocaleTimeString());

            // Visual feedback (optional - maybe a small icon could flash)
        } catch (e) {
            console.warn('[Persistence] Failed to save state:', e);
        }
    }

    /**
     * Debounced save function.
     */
    function scheduleSave() {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveState, SAVE_DELAY);
    }

    /**
     * Restores the state from localStorage.
     */
    function restoreState() {
        try {
            const savedRaw = localStorage.getItem(STORAGE_KEY);
            if (!savedRaw) {
                console.log('[Persistence] No saved state found');
                return;
            }

            const savedState = JSON.parse(savedRaw);
            console.log('[Persistence] Found saved state from:', new Date(savedState.timestamp).toLocaleString());

            // 1. Restore Form Data
            if (savedState.formData) {
                console.log('[Persistence] Broadcasting restored state...');

                // Dispatch event which form.js and preview.js will catch
                document.dispatchEvent(new CustomEvent('stateUpdated', {
                    detail: {
                        source: 'persistence',
                        data: savedState
                    }
                }));
            }

            // 2. Restore Assets (Dropzones)
            if (savedState.assets && window.updateDropzonePreview) {
                console.log('[Persistence] Restoring assets...');

                if (window.builderState) {
                    window.builderState.assets = { ...savedState.assets };
                }

                // Map context to dropzone IDs (Keep synced with windows.js)
                const dropzoneMap = {
                    'capa': 'cover-dropzone',
                    'folha_vazia': 'leaf-dropzone',
                    'folha_preenchida': 'fill-image-dropzone',
                    'folha_animada': 'fill-video-dropzone',
                    'abertura': 'intro-video-dropzone',
                    'loop': 'loop-video-dropzone',
                    'musica': 'music-dropzone',
                    'presentes': 'gifts-image-dropzone',
                    'manual': 'manual-image-dropzone'
                };

                Object.entries(savedState.assets).forEach(([context, url]) => {
                    const dropzoneId = dropzoneMap[context];
                    if (dropzoneId && url) {
                        const dropzone = document.getElementById(dropzoneId);
                        if (dropzone) {
                            // Determine type based on extension or context
                            let type = 'image';
                            if (context.includes('video') || context === 'abertura' || context === 'loop' || context === 'folha_animada') {
                                type = 'video';
                            } else if (context === 'musica') {
                                type = 'audio';
                            }

                            window.updateDropzonePreview(dropzone, url, type);

                            // Emit media event for preview.js
                            document.dispatchEvent(new CustomEvent('mediaUpdated', {
                                detail: { type: context, data: { url: url, type: type } }
                            }));
                        }
                    }
                });
            }

            // 3. Restore Extra Links
            if (savedState.linksExtras && window.AutoBuilderLinksExtras) {
                console.log('[Persistence] Restoring extra links...');

                if (window.builderState) {
                    window.builderState.linksExtras = [...savedState.linksExtras];
                }

                window.AutoBuilderLinksExtras.populateLinks(savedState.linksExtras);

                // Sync preview
                document.dispatchEvent(new CustomEvent('linksExtrasUpdated', {
                    detail: { links: savedState.linksExtras }
                }));
            }

            // 4. Force Preview Update
            // Some things might need a final nudging
            document.dispatchEvent(new CustomEvent('stateUpdated', {
                detail: { source: 'persistence', data: savedState }
            }));

            // Notify user
            showRestoreToast();

        } catch (e) {
            console.error('[Persistence] Error restoring state:', e);
            // If state is corrupt, maybe clear it?
            // localStorage.removeItem(STORAGE_KEY);
        }
    }

    /**
     * Shows a small toast notification that work was restored.
     */
    function showRestoreToast() {
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50 flex items-center gap-2 animate-fade-in-up';
        toast.innerHTML = '<i class="fa-solid fa-rotate-left text-green-400"></i> Trabalho anterior restaurado';
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.5s';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    // ========================================
    // Initialization
    // ========================================

    function init() {
        // Listen for all possible state changes
        document.addEventListener('stateUpdated', scheduleSave);
        document.addEventListener('linksExtrasUpdated', scheduleSave);
        document.addEventListener('mediaUpdated', scheduleSave);

        // Also listen for form inputs directly as a fallback
        document.addEventListener('input', (e) => {
            if (e.target.matches('input, textarea, select')) {
                scheduleSave();
            }
        });

        // Attempt restore
        // Small delay to ensure other modules are ready
        setTimeout(restoreState, 500);

        console.log('[Persistence] Initialized');
    }

    // ========================================
    // Browser Events
    // ========================================

    window.addEventListener('beforeunload', () => {
        // Try to save immediately before close
        saveState();
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose for debugging/clearing
    window.Persistence = {
        clear: () => {
            localStorage.removeItem(STORAGE_KEY);
            console.log('[Persistence] State cleared');
            location.reload();
        },
        forceSave: saveState,
        forceRestore: restoreState
    };

})();
