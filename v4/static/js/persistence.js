/**
 * AutoBuilder v4.0 - Persistence Module
 * ======================================
 * Saves and restores the builder state using localStorage.
 * Prevents data loss on page reload.
 * 
 * ESTRATÉGIA: Salvamento Imediato (Eager Save)
 * - Converte blobs para Base64 IMEDIATAMENTE quando arquivo é selecionado
 * - Mantém cache de Base64 já convertido
 * - Salva SINCRONAMENTE usando o cache (não depende de beforeunload async)
 */

(function () {
    'use strict';

    const STORAGE_KEY = 'autobuilder_v4_state';
    const SAVE_DELAY = 500; // 0.5 second debounce para form data

    let saveTimeout;

    // Cache de Base64 para assets - persiste entre saves
    let assetsBase64Cache = {};

    // ========================================
    // Core Functions
    // ========================================

    /**
     * Helper: Converts a Blob/File to Base64 data URL
     */
    function blobToBase64(blob) {
        return new Promise((resolve) => {
            if (!blob) return resolve(null);
            if (typeof blob === 'string') {
                // Se já é string (base64 ou URL)
                if (blob.startsWith('data:')) return resolve(blob);
                return resolve(null); // blob URL não é serializável
            }
            if (!(blob instanceof Blob)) return resolve(null);

            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Salva estado SINCRONAMENTE usando cache de Base64.
     * Chamado após cada modificação.
     */
    function saveStateSync() {
        if (!window.builderState) return;

        try {
            const stateToSave = {
                formData: window.builderState.formData || {},
                assets: { ...assetsBase64Cache },
                linksExtras: window.builderState.linksExtras || [],
                timestamp: Date.now()
            };

            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
            console.log('[Persistence] State saved', new Date().toLocaleTimeString(),
                `(${Object.keys(assetsBase64Cache).length} assets cached)`);

        } catch (e) {
            console.warn('[Persistence] Failed to save state:', e);
        }
    }

    /**
     * Debounced save function (para form data).
     */
    function scheduleSave() {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveStateSync, SAVE_DELAY);
    }

    /**
     * Processa um asset imediatamente: converte para Base64 e salva.
     * Chamado quando um arquivo é selecionado.
     */
    async function processAndSaveAsset(context, blobOrFile) {
        if (!blobOrFile) return;

        console.log(`[Persistence] Processing asset: ${context}`);

        try {
            const base64 = await blobToBase64(blobOrFile);
            if (base64) {
                assetsBase64Cache[context] = base64;
                console.log(`[Persistence] Asset cached: ${context} (${(base64.length / 1024).toFixed(1)}KB)`);

                // Salvar imediatamente
                saveStateSync();
            }
        } catch (e) {
            console.error(`[Persistence] Failed to process asset ${context}:`, e);
        }
    }

    /**
     * Remove um asset do cache.
     */
    function removeAsset(context) {
        delete assetsBase64Cache[context];
        saveStateSync();
        console.log(`[Persistence] Asset removed: ${context}`);
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

                document.dispatchEvent(new CustomEvent('stateUpdated', {
                    detail: {
                        source: 'persistence',
                        data: savedState
                    }
                }));
            }

            // 2. Restore Assets (Dropzones)
            if (savedState.assets && Object.keys(savedState.assets).length > 0) {
                console.log('[Persistence] Restoring assets...');

                // Restaurar cache de Base64
                assetsBase64Cache = { ...savedState.assets };

                // Map context to dropzone IDs
                const dropzoneMap = {
                    'capa': 'cover-dropzone',
                    'folha_vazia': 'leaf-dropzone',
                    'folha_preenchida': 'fill-image-dropzone',
                    'folha_animada': 'fill-video-dropzone',
                    'vid_abertura': 'intro-video-dropzone',
                    'vid_loop': 'loop-video-dropzone',
                    'musica': 'music-dropzone',
                    'presentes': 'gifts-image-dropzone',
                    'manual': 'manual-image-dropzone'
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

                // Initialize assets object in builderState
                if (window.builderState) {
                    window.builderState.assets = {};
                }

                Object.entries(savedState.assets).forEach(([context, dataUrl]) => {
                    if (!dataUrl) return;

                    const dropzoneId = dropzoneMap[context];

                    // Determine type based on context
                    let type = 'image';
                    if (context.includes('video') || context === 'vid_abertura' || context === 'vid_loop' ||
                        context === 'folha_animada') {
                        type = 'video';
                    } else if (context === 'musica') {
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
                            if (type === 'audio') {
                                // Tratamento especial para música
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
                            } else if (window.updateDropzonePreview) {
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

                document.dispatchEvent(new CustomEvent('linksExtrasUpdated', {
                    detail: { links: savedState.linksExtras }
                }));
            }

            // 4. Force Preview Update
            document.dispatchEvent(new CustomEvent('stateUpdated', {
                detail: { source: 'persistence', data: savedState }
            }));

            // Notify user
            showRestoreToast();

        } catch (e) {
            console.error('[Persistence] Error restoring state:', e);
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
    // Event Listeners
    // ========================================

    function init() {
        // Listen for form state changes (debounced)
        document.addEventListener('stateUpdated', (e) => {
            // Ignore events from persistence itself
            if (e.detail && e.detail.source === 'persistence') return;
            scheduleSave();
        });

        // Listen for links extras changes (debounced)
        document.addEventListener('linksExtrasUpdated', scheduleSave);

        // Listen for media changes - PROCESS IMMEDIATELY
        document.addEventListener('mediaUpdated', async (e) => {
            if (e.detail && e.detail.type && e.detail.data) {
                const { type, data } = e.detail;

                // Se tem blob/file, processar imediatamente
                if (data.blob || data.file) {
                    await processAndSaveAsset(type, data.blob || data.file);
                } else if (data.url && data.url.startsWith('data:')) {
                    // Já é base64
                    assetsBase64Cache[type] = data.url;
                    saveStateSync();
                }
            }
        });

        // Listen for form inputs directly as fallback
        document.addEventListener('input', (e) => {
            if (e.target.matches('input, textarea, select')) {
                scheduleSave();
            }
        });

        // Attempt restore after modules are ready
        setTimeout(restoreState, 500);

        console.log('[Persistence] Initialized with Eager Save strategy');
    }

    // ========================================
    // Browser Events
    // ========================================

    window.addEventListener('beforeunload', () => {
        // Tentativa final de salvar (síncrono)
        saveStateSync();
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ========================================
    // Public API
    // ========================================

    window.Persistence = {
        clear: () => {
            localStorage.removeItem(STORAGE_KEY);
            assetsBase64Cache = {};
            console.log('[Persistence] State cleared');
            location.reload();
        },
        forceSave: saveStateSync,
        forceRestore: restoreState,
        removeAsset: removeAsset,
        processAsset: processAndSaveAsset,
        getCache: () => ({ ...assetsBase64Cache })
    };

})();
