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
     * Helper: Converts a Blob/File to Base64 data URL
     * @param {Blob|File|string} blob - The blob to convert
     * @returns {Promise<string|null>} Base64 data URL or original string
     */
    function blobToBase64(blob) {
        return new Promise((resolve) => {
            if (!blob) return resolve(null);
            // Se já é string (URL ou base64), retorna como está
            if (typeof blob === 'string') return resolve(blob);
            // Se não é um Blob/File válido, retorna null
            if (!(blob instanceof Blob)) return resolve(null);

            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Saves the current application state to localStorage.
     * Converts blob assets to Base64 for persistence.
     */
    async function saveState() {
        if (!window.builderState) return;

        try {
            // Converter assets (blobs) para Base64
            const assetsBase64 = {};
            const assetEntries = Object.entries(window.builderState.assets || {});

            for (const [key, value] of assetEntries) {
                const base64 = await blobToBase64(value);
                if (base64) {
                    assetsBase64[key] = base64;
                }
            }

            const stateToSave = {
                formData: window.builderState.formData || {},
                assets: assetsBase64,
                linksExtras: window.builderState.linksExtras || [],
                timestamp: Date.now()
            };

            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
            console.log('[Persistence] State saved', new Date().toLocaleTimeString(),
                `(${Object.keys(assetsBase64).length} assets)`);

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

                // Map context to dropzone IDs (Keep synced with windows.js DROPZONE_CONTEXTS)
                const dropzoneMap = {
                    'capa': 'cover-dropzone',
                    'folha_vazia': 'leaf-dropzone',
                    'folha_preenchida': 'fill-image-dropzone',
                    'folha_animada': 'fill-video-dropzone',
                    'vid_abertura': 'intro-video-dropzone',
                    'vid_loop': 'loop-video-dropzone',
                    'musica': 'music-dropzone',
                    'presentes': 'gifts-image-dropzone',
                    'manual': 'manual-image-dropzone',
                    // Legacy mappings for backward compatibility
                    'abertura': 'intro-video-dropzone',
                    'loop': 'loop-video-dropzone',
                    'music': 'music-dropzone'
                };

                // Helper: Convert Base64 data URL back to Blob
                const base64ToBlob = (dataUrl) => {
                    if (!dataUrl || typeof dataUrl !== 'string') return null;
                    if (!dataUrl.startsWith('data:')) return null;

                    try {
                        const [header, base64] = dataUrl.split(',');
                        const mimeMatch = header.match(/data:([^;]+)/);
                        const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
                        const binary = atob(base64);
                        const array = new Uint8Array(binary.length);
                        for (let i = 0; i < binary.length; i++) {
                            array[i] = binary.charCodeAt(i);
                        }
                        return new Blob([array], { type: mime });
                    } catch (e) {
                        console.warn('[Persistence] Failed to convert base64 to blob:', e);
                        return null;
                    }
                };

                // Initialize assets object
                if (window.builderState) {
                    window.builderState.assets = {};
                }

                Object.entries(savedState.assets).forEach(([context, dataUrl]) => {
                    if (!dataUrl) return;

                    const dropzoneId = dropzoneMap[context];

                    // Determine type based on context
                    let type = 'image';
                    if (context.includes('video') || context === 'vid_abertura' || context === 'vid_loop' ||
                        context === 'abertura' || context === 'loop' || context === 'folha_animada') {
                        type = 'video';
                    } else if (context === 'musica' || context === 'music') {
                        type = 'audio';
                    }

                    // Convert Base64 back to Blob for builderState
                    if (dataUrl.startsWith('data:')) {
                        const blob = base64ToBlob(dataUrl);
                        if (blob && window.builderState) {
                            window.builderState.assets[context] = blob;
                        }
                    }

                    // Update dropzone preview
                    if (dropzoneId) {
                        const dropzone = document.getElementById(dropzoneId);
                        if (dropzone) {
                            // Para música, tratamento especial
                            if (type === 'audio') {
                                // Atualizar player de música
                                const audioPlayer = document.getElementById('music-audio-player');
                                const trackName = document.getElementById('music-track-name');
                                const removeBtn = document.getElementById('music-remove-btn');
                                const playBtn = document.getElementById('music-play-btn');

                                if (audioPlayer) {
                                    audioPlayer.src = dataUrl;
                                    audioPlayer.load();
                                }
                                if (trackName) trackName.textContent = 'Música Restaurada';
                                if (removeBtn) removeBtn.classList.remove('hidden');
                                if (playBtn) playBtn.disabled = false;
                            } else {
                                window.updateDropzonePreview(dropzone, dataUrl, type);
                            }

                            // Emit media event for preview.js
                            document.dispatchEvent(new CustomEvent('mediaUpdated', {
                                detail: { type: context, data: { url: dataUrl, type: type } }
                            }));
                        }
                    }
                });

                console.log('[Persistence] Assets restored:', Object.keys(savedState.assets).length);
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
