/**
 * AutoBuilder v4.0 - Persistence Module (IndexedDB)
 * ==================================================
 * Saves and restores builder state using:
 * - IndexedDB for assets (supports large files, 50MB+)
 * - localStorage for form data and links (small, fast)
 * 
 * Prevents data loss on page reload.
 */

(function () {
    'use strict';

    const STORAGE_KEY = 'autobuilder_v4_state';
    const DB_NAME = 'AutoBuilderDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'assets';
    const SAVE_DELAY = 500;

    let saveTimeout;
    let db = null;

    // ========================================
    // IndexedDB Setup
    // ========================================

    function openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('[Persistence] IndexedDB error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                db = request.result;
                console.log('[Persistence] IndexedDB opened');
                resolve(db);
            };

            request.onupgradeneeded = (event) => {
                const database = event.target.result;
                if (!database.objectStoreNames.contains(STORE_NAME)) {
                    database.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    console.log('[Persistence] IndexedDB store created');
                }
            };
        });
    }

    // ========================================
    // Asset Storage (IndexedDB)
    // ========================================

    async function saveAssetToDB(context, base64Data) {
        if (!db) await openDatabase();

        return new Promise((resolve, reject) => {
            try {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.put({ id: context, data: base64Data });

                request.onsuccess = () => {
                    console.log(`[Persistence] Asset saved to IndexedDB: ${context}`);
                    resolve();
                };
                request.onerror = () => {
                    console.error(`[Persistence] Failed to save asset: ${context}`, request.error);
                    reject(request.error);
                };
            } catch (e) {
                console.error('[Persistence] Transaction error:', e);
                reject(e);
            }
        });
    }

    async function getAssetFromDB(context) {
        if (!db) await openDatabase();

        return new Promise((resolve, reject) => {
            try {
                const transaction = db.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(context);

                request.onsuccess = () => {
                    resolve(request.result ? request.result.data : null);
                };
                request.onerror = () => {
                    reject(request.error);
                };
            } catch (e) {
                reject(e);
            }
        });
    }

    async function getAllAssetsFromDB() {
        if (!db) await openDatabase();

        return new Promise((resolve, reject) => {
            try {
                const transaction = db.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.getAll();

                request.onsuccess = () => {
                    const assets = {};
                    (request.result || []).forEach(item => {
                        assets[item.id] = item.data;
                    });
                    resolve(assets);
                };
                request.onerror = () => {
                    reject(request.error);
                };
            } catch (e) {
                reject(e);
            }
        });
    }

    async function deleteAssetFromDB(context) {
        if (!db) await openDatabase();

        return new Promise((resolve, reject) => {
            try {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.delete(context);

                request.onsuccess = () => {
                    console.log(`[Persistence] Asset deleted from IndexedDB: ${context}`);
                    resolve();
                };
                request.onerror = () => reject(request.error);
            } catch (e) {
                reject(e);
            }
        });
    }

    async function clearAllAssetsFromDB() {
        if (!db) await openDatabase();

        return new Promise((resolve, reject) => {
            try {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.clear();

                request.onsuccess = () => {
                    console.log('[Persistence] All assets cleared from IndexedDB');
                    resolve();
                };
                request.onerror = () => reject(request.error);
            } catch (e) {
                reject(e);
            }
        });
    }

    // ========================================
    // Helper Functions
    // ========================================

    function blobToBase64(blob) {
        return new Promise((resolve) => {
            if (!blob) return resolve(null);
            if (typeof blob === 'string') {
                if (blob.startsWith('data:')) return resolve(blob);
                return resolve(null);
            }
            if (!(blob instanceof Blob)) return resolve(null);

            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    }

    // ========================================
    // Form/Links Storage (localStorage - small data)
    // ========================================

    function saveFormState() {
        try {
            // Collect form data directly from DOM to ensure current values
            const formData = {};
            const inputs = document.querySelectorAll('.form-input[data-field]');
            inputs.forEach(input => {
                const field = input.getAttribute('data-field');
                if (field) {
                    if (input.type === 'checkbox') {
                        formData[field] = input.checked;
                    } else {
                        formData[field] = input.value;
                    }
                }
            });

            const stateToSave = {
                formData: formData,
                linksExtras: window.builderState?.linksExtras || [],
                toggles: {
                    manualMode: document.querySelector('#manual-mode-buttons .bg-white')?.dataset?.mode || 'text',
                    giftsMode: document.querySelector('#gifts-mode-buttons .bg-white')?.dataset?.mode || 'link',
                    // fillMode removed - unified approach
                    animateBackground: document.getElementById('animate-background-toggle')?.checked || false
                },
                timestamp: Date.now()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
            console.log('[Persistence] Form state saved to localStorage', Object.keys(formData).length, 'fields');
        } catch (e) {
            console.warn('[Persistence] Failed to save form state:', e);
        }
    }

    function scheduleSave() {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveFormState, SAVE_DELAY);
    }

    // ========================================
    // Asset Processing
    // ========================================

    async function processAndSaveAsset(context, blobOrFile) {
        if (!blobOrFile) return;

        console.log(`[Persistence] Processing asset: ${context}`);

        try {
            const base64 = await blobToBase64(blobOrFile);
            if (base64) {
                await saveAssetToDB(context, base64);
                console.log(`[Persistence] Asset saved: ${context} (${(base64.length / 1024).toFixed(1)}KB)`);
                // alert removed
            }
        } catch (e) {
            console.error(`[Persistence] Failed to process asset ${context}:`, e);
        }
    }

    // ========================================
    // Restore State
    // ========================================

    async function restoreState() {
        try {
            // 1. Restore Form Data from localStorage
            const savedRaw = localStorage.getItem(STORAGE_KEY);
            let savedState = null;

            if (savedRaw) {
                savedState = JSON.parse(savedRaw);
                console.log('[Persistence] Found form state from:', new Date(savedState.timestamp).toLocaleString());

                if (savedState.formData) {
                    document.dispatchEvent(new CustomEvent('stateUpdated', {
                        detail: { source: 'persistence', data: savedState }
                    }));
                }

                // Restore Extra Links
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

                // Restore Toggles
                if (savedState.toggles) {
                    console.log('[Persistence] Restoring toggles:', savedState.toggles);
                    if (savedState.toggles.manualMode) document.getElementById(`manual-mode-${savedState.toggles.manualMode}`)?.click();
                    if (savedState.toggles.giftsMode) document.getElementById(`gifts-mode-${savedState.toggles.giftsMode}`)?.click();
                    // fillMode toggle removed - unified approach

                    const animateToggle = document.getElementById('animate-background-toggle');
                    if (animateToggle && savedState.toggles.animateBackground !== undefined) {
                        animateToggle.checked = savedState.toggles.animateBackground;
                        animateToggle.dispatchEvent(new Event('change'));
                    }
                }
            }

            // 2. Restore Assets from IndexedDB
            const assets = await getAllAssetsFromDB();
            const assetCount = Object.keys(assets).length;

            if (assetCount > 0) {
                console.log(`[Persistence] Restoring ${assetCount} assets from IndexedDB...`);

                // DEBUG TRACE
                alert(`[PERSISTENCE] Restaurando ${assetCount} arquivos do banco.`);

                'capa': 'cover-dropzone',
                    'folha_vazia': 'leaf-dropzone',
                        'folha': 'leaf-dropzone', // Alias
                            'fundo_tela': 'fill-image-dropzone',
                                'folha_preenchida': 'fill-image-dropzone', // Alias
                                    'background': 'fill-image-dropzone', // Alias
                                        'vid_abertura': 'intro-video-dropzone',
                                            'musica': 'music-dropzone',
                                                'presentes': 'gifts-image-dropzone',
                                                    'manual': 'manual-image-dropzone'
            };

            const base64ToBlob = (dataUrl) => {
                if (!dataUrl || !dataUrl.startsWith('data:')) return null;
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
                    return null;
                }
            };

            if (window.builderState) {
                window.builderState.assets = {};
            }

            for (const [context, dataUrl] of Object.entries(assets)) {
                if (!dataUrl) continue;

                const dropzoneId = dropzoneMap[context];
                let type = 'image';

                if (context.includes('video') || context === 'vid_abertura' ||
                    context === 'vid_loop' || context === 'folha_animada') {
                    type = 'video';
                } else if (context === 'musica') {
                    type = 'audio';
                }

                // Save dataUrl directly to builderState (APIs need URLs, not Blobs)
                if (window.builderState) {
                    window.builderState.assets[context] = dataUrl;
                }

                // Update UI
                if (dropzoneId) {
                    const dropzone = document.getElementById(dropzoneId);
                    if (dropzone) {
                        if (type === 'audio') {
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

                        document.dispatchEvent(new CustomEvent('mediaUpdated', {
                            detail: {
                                type: context,
                                data: { url: dataUrl, type: type },
                                skipPersistence: true // Prevent re-saving restored assets
                            }
                        }));
                    }
                }
            }

            console.log(`[Persistence] Assets restored: ${assetCount}`);
        } else {
            console.log('[Persistence] No assets found in IndexedDB');
        }

        // Final state update
        if (savedState) {
            document.dispatchEvent(new CustomEvent('stateUpdated', {
                detail: { source: 'persistence', data: savedState }
            }));
        }

        // Notify user
        if (savedState || assetCount > 0) {
            showRestoreToast();
        }

    } catch (e) {
        console.error('[Persistence] Error restoring state:', e);
    }
}

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

async function init() {
    // Initialize IndexedDB
    try {
        await openDatabase();
    } catch (e) {
        console.error('[Persistence] Failed to open IndexedDB:', e);
    }

    // Listen for form state changes
    document.addEventListener('stateUpdated', (e) => {
        if (e.detail && e.detail.source === 'persistence') return;
        scheduleSave();
    });

    document.addEventListener('linksExtrasUpdated', scheduleSave);

    // Listen for media changes
    document.addEventListener('mediaUpdated', async (e) => {
        // CRITICAL FIX: Ignore events marked as 'preview-only' or 'skipPersistence'
        if (e.detail && e.detail.skipPersistence) return;

        if (e.detail && e.detail.type && e.detail.data) {
            const { type, data } = e.detail;

            if (data.blob || data.file) {
                await processAndSaveAsset(type, data.blob || data.file);
            } else if (data.url && data.url.startsWith('data:')) {
                await saveAssetToDB(type, data.url);
                console.log(`[Persistence] Asset saved: ${type} (base64 direct)`);
            } else if (data.url && data.url.startsWith('blob:')) {
                try {
                    const response = await fetch(data.url);
                    const blob = await response.blob();
                    await processAndSaveAsset(type, blob);
                } catch (err) {
                    console.error(`[Persistence] Failed to fetch blob URL for ${type}:`, err);
                }
            }
        }
    });

    document.addEventListener('input', (e) => {
        if (e.target.matches('input, textarea, select')) {
            scheduleSave();
        }
    });

    // Restore after modules are ready
    setTimeout(restoreState, 500);

    console.log('[Persistence] Initialized with IndexedDB storage');
}

// ========================================
// Cleanup on close
// ========================================

window.addEventListener('beforeunload', () => {
    saveFormState();
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
    clear: async () => {
        localStorage.removeItem(STORAGE_KEY);
        await clearAllAssetsFromDB();
        console.log('[Persistence] All data cleared');
        location.reload();
    },
    forceSave: saveFormState,
    forceRestore: restoreState,
    removeAsset: deleteAssetFromDB,
    processAsset: processAndSaveAsset
};

}) ();
