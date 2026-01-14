/**
 * AutoBuilder v4.0 - Windows Controller
 * =====================================
 * Handles interactive elements for builder windows:
 * - Mode toggles (Manual, Gifts, Fill Leaf)
 * - Animation tabs
 * - Music player
 * - Dropzones
 */

(function () {
    'use strict';

    // ========================================
    // Mode Toggle Handlers
    // ========================================

    /**
     * Sets up toggle buttons for switching between modes.
     * @param {string} prefix - Component prefix (e.g., 'manual', 'gifts', 'fill')
     * @param {string[]} modes - Array of mode names
     */
    function setupModeToggle(prefix, modes) {
        modes.forEach(mode => {
            const btnKey = `${prefix}-mode-${mode}`;
            const contentKey = `${prefix}-${mode}-mode`;
            const btn = document.getElementById(btnKey);
            const content = document.getElementById(contentKey);

            if (!btn) {
                console.warn(`[AutoBuilder] Mode Toggle Button not found: #${btnKey}`);
                return;
            }
            if (!content) {
                console.warn(`[AutoBuilder] Mode Toggle Content not found: #${contentKey}`);
                return;
            }

            btn.addEventListener('click', (e) => {
                // Prevent default in case it's inside a form or treated as submit
                e.preventDefault();

                console.log(`[AutoBuilder] Switch mode: ${prefix} -> ${mode}`);

                // Deactivate all buttons
                modes.forEach(m => {
                    const otherBtn = document.getElementById(`${prefix}-mode-${m}`);
                    const otherContent = document.getElementById(`${prefix}-${m}-mode`);

                    if (otherBtn) {
                        otherBtn.classList.remove('bg-white', 'shadow-sm', 'text-brand-600');
                        otherBtn.classList.add('text-gray-500');
                        // Reset dataset mode for state generator
                        const container = otherBtn.closest('.flex');
                        if (container && container.id) container.dataset.mode = ''; // cleanup
                    }
                    if (otherContent) {
                        otherContent.classList.add('hidden');
                    }
                });

                // Activate clicked button
                btn.classList.remove('text-gray-500');
                btn.classList.add('bg-white', 'shadow-sm', 'text-brand-600');
                content.classList.remove('hidden');

                // Update container dataset for state persistence
                const container = btn.closest('.flex');
                if (container) {
                    // We don't have an ID on the container usually, but we can set dataset
                    container.dataset.mode = mode;
                }
            });
        });
    }

    // ========================================
    // Animation Tabs
    // ========================================

    function setupAnimationTabs() {
        const tabs = document.querySelectorAll('.anim-tab');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;

                // Deactivate all tabs
                tabs.forEach(t => {
                    t.classList.remove('text-brand-600', 'border-b-2', 'border-brand-600');
                    t.classList.add('text-gray-500');
                });

                // Hide all content
                document.getElementById('anim-intro-content')?.classList.add('hidden');
                document.getElementById('anim-loop-content')?.classList.add('hidden');

                // Activate clicked tab
                tab.classList.remove('text-gray-500');
                tab.classList.add('text-brand-600', 'border-b-2', 'border-brand-600');

                // Show target content
                const content = document.getElementById(`anim-${targetTab}-content`);
                content?.classList.remove('hidden');
            });
        });
    }

    // ========================================
    // Music Player & Client-Side Build Logic
    // ========================================

    function setupMusicPlayer() {
        const audioPlayer = document.getElementById('music-audio-player');
        const trackName = document.getElementById('music-track-name');
        const playBtn = document.getElementById('music-play-btn');
        const progressBar = document.getElementById('music-progress');
        const timeCurrent = document.getElementById('music-time-current');
        const timeTotal = document.getElementById('music-time-total');
        const removeBtn = document.getElementById('music-remove-btn');
        const fileInput = document.getElementById('music-file-input');

        if (!audioPlayer || !playBtn) return;

        let isPlaying = false;

        // Format time as M:SS
        function formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }

        // Store main player reference globally for coordination
        window._mainAudioPlayer = audioPlayer;
        window._mainPlayBtn = playBtn;
        window._mainIsPlaying = () => isPlaying;
        window._setMainIsPlaying = (val) => { isPlaying = val; };

        // Play/Pause toggle
        playBtn.addEventListener('click', () => {
            if (!audioPlayer.src) return;

            // Stop any sample preview first
            if (window._currentPreviewAudio) {
                window._currentPreviewAudio.pause();
                if (window._currentPreviewBtn) {
                    const prevIcon = window._currentPreviewBtn.querySelector('i');
                    if (prevIcon) {
                        prevIcon.classList.remove('fa-pause');
                        prevIcon.classList.add('fa-play');
                    }
                }
                window._currentPreviewAudio = null;
                window._currentPreviewBtn = null;
            }

            if (isPlaying) {
                audioPlayer.pause();
                playBtn.innerHTML = '<i class="fa-solid fa-play ml-1"></i>';
            } else {
                audioPlayer.play();
                playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            }
            isPlaying = !isPlaying;
        });

        // Update progress
        audioPlayer.addEventListener('timeupdate', () => {
            if (audioPlayer.duration) {
                const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
                if (progressBar) progressBar.style.width = `${progress}%`;
                if (timeCurrent) timeCurrent.textContent = formatTime(audioPlayer.currentTime);
            }
        });

        // Set total time when loaded
        audioPlayer.addEventListener('loadedmetadata', () => {
            if (timeTotal) timeTotal.textContent = formatTime(audioPlayer.duration);
            playBtn.disabled = false;
            if (removeBtn) removeBtn.classList.remove('hidden');
        });

        // Handle audio end
        audioPlayer.addEventListener('ended', () => {
            isPlaying = false;
            playBtn.innerHTML = '<i class="fa-solid fa-play ml-1"></i>';
            if (progressBar) progressBar.style.width = '0%';
        });

        // File input handler
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const url = URL.createObjectURL(file);
                    audioPlayer.src = url;
                    if (trackName) trackName.textContent = file.name;
                    audioPlayer.load();
                }
            });
        }

        // Remove button
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                audioPlayer.pause();
                audioPlayer.src = '';
                isPlaying = false;
                playBtn.innerHTML = '<i class="fa-solid fa-play ml-1"></i>';
                playBtn.disabled = true;
                if (progressBar) progressBar.style.width = '0%';
                if (timeCurrent) timeCurrent.textContent = '0:00';
                if (timeTotal) timeTotal.textContent = '0:00';
                if (trackName) trackName.textContent = 'Nenhuma música';
                removeBtn.classList.add('hidden');
            });
        }

        // Sample selection (Using Delegation for robustness)
        const samplesList = document.getElementById('music-samples-list');
        if (samplesList) {
            samplesList.addEventListener('click', async (e) => {
                const selectBtn = e.target.closest('.sample-select-btn');
                const previewBtn = e.target.closest('.sample-preview-btn');
                const item = e.target.closest('.sample-item');

                if (!item) return;

                const sampleUrl = item.dataset.sample;
                const sampleName = item.dataset.name;

                // Handle Use Button
                if (selectBtn) {
                    e.stopPropagation();

                    if (trackName) trackName.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Carregando...`;
                    playBtn.disabled = true;

                    try {
                        // Fetch the sample as a blob
                        const resp = await fetch(sampleUrl);
                        const blob = await resp.blob();

                        // Update State (usando 'musica' para consistência com persistence.js)
                        if (!window.builderState) window.builderState = {};
                        if (!window.builderState.assets) window.builderState.assets = {};
                        window.builderState.assets.musica = blob;
                        console.log('[Music] Sample saved to state: musica');

                        // Update Player
                        const objectUrl = URL.createObjectURL(blob);
                        audioPlayer.src = objectUrl;
                        audioPlayer.load();

                        // Update UI
                        if (trackName) trackName.textContent = sampleName;

                        // Update hidden input for persistence
                        const hiddenInput = document.getElementById('music-track-name-hidden');
                        if (hiddenInput) {
                            hiddenInput.value = sampleName;
                            // Trigger change event to save immediately
                            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
                        }

                        playBtn.disabled = false;
                        if (removeBtn) removeBtn.classList.remove('hidden');

                        // Visual Feedback
                        document.querySelectorAll('.sample-item').forEach(i => i.classList.remove('ring-2', 'ring-brand-500', 'bg-brand-50'));
                        item.classList.add('ring-2', 'ring-brand-500', 'bg-brand-50');

                        // Dispatch event for persistence
                        document.dispatchEvent(new CustomEvent('mediaUpdated', {
                            detail: {
                                type: 'musica',
                                data: { url: objectUrl, blob: blob, name: sampleName }
                            }
                        }));

                    } catch (err) {
                        console.error('Error loading sample:', err);
                        if (trackName) trackName.textContent = 'Erro ao carregar';
                    }
                }

                // Handle Preview Button
                if (previewBtn) {
                    e.stopPropagation();
                    const currentIcon = previewBtn.querySelector('i');

                    // Track current preview audio globally
                    if (!window._currentPreviewAudio) {
                        window._currentPreviewAudio = null;
                        window._currentPreviewBtn = null;
                    }

                    // If clicking the same button that's currently playing, toggle pause
                    if (window._currentPreviewBtn === previewBtn && window._currentPreviewAudio) {
                        if (window._currentPreviewAudio.paused) {
                            window._currentPreviewAudio.play();
                            currentIcon.classList.remove('fa-play');
                            currentIcon.classList.add('fa-pause');
                        } else {
                            window._currentPreviewAudio.pause();
                            currentIcon.classList.remove('fa-pause');
                            currentIcon.classList.add('fa-play');
                        }
                        return;
                    }

                    // Stop any currently playing preview
                    if (window._currentPreviewAudio) {
                        window._currentPreviewAudio.pause();
                        window._currentPreviewAudio = null;
                        // Reset previous button icon
                        if (window._currentPreviewBtn) {
                            const prevIcon = window._currentPreviewBtn.querySelector('i');
                            if (prevIcon) {
                                prevIcon.classList.remove('fa-pause');
                                prevIcon.classList.add('fa-play');
                            }
                        }
                    }

                    // Stop main player if playing
                    if (window._mainAudioPlayer && !window._mainAudioPlayer.paused) {
                        window._mainAudioPlayer.pause();
                        if (window._mainPlayBtn) {
                            window._mainPlayBtn.innerHTML = '<i class="fa-solid fa-play ml-1"></i>';
                        }
                        if (window._setMainIsPlaying) window._setMainIsPlaying(false);
                    }

                    // Create and play new audio
                    const tempAudio = new Audio(sampleUrl);
                    window._currentPreviewAudio = tempAudio;
                    window._currentPreviewBtn = previewBtn;
                    tempAudio.play();

                    // Update icon
                    if (currentIcon) {
                        currentIcon.classList.remove('fa-play');
                        currentIcon.classList.add('fa-pause');
                    }

                    tempAudio.onended = () => {
                        if (currentIcon) {
                            currentIcon.classList.remove('fa-pause');
                            currentIcon.classList.add('fa-play');
                        }
                        window._currentPreviewAudio = null;
                        window._currentPreviewBtn = null;
                    };
                }
            });
        }
    }

    // ========================================
    // Dropzone Upload Handling (with API)
    // ========================================

    // Map dropzone IDs to API upload contexts
    const DROPZONE_CONTEXTS = {
        'cover-dropzone': 'capa',
        'cover-reference-dropzone': 'capa_referencia',
        'leaf-dropzone': 'folha_vazia',
        'intro-video-dropzone': 'vid_abertura',
        'loop-video-dropzone': 'vid_loop',
        'fill-image-dropzone': 'folha_preenchida',
        // New Layer Dropzones
        'dropzone-leaf-only': 'folha_only',
        'dropzone-background-only': 'background_only',
        'fill-video-dropzone': 'folha_animada',
        'gifts-image-dropzone': 'presentes',
        'manual-image-dropzone': 'manual',
        'music-dropzone': 'musica'
    };

    /**
     * Uploads a file to the server.
     * @param {File} file - The file to upload
     * @param {string} context - The upload context (capa, musica, etc.)
     * @returns {Promise<object>} The server response
     */
    async function uploadFile(file, context) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`/api/upload/${context}`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Upload failed');
        }

        return response.json();
    }

    /**
     * Updates a dropzone with a preview.
     * @param {HTMLElement} dropzone - The dropzone element
     * @param {string} url - The URL of the uploaded file
     * @param {string} type - The file type (image/video/audio)
     */
    function clearDropzone(dropzone, context, type) {
        // Clear preview
        dropzone.style.backgroundImage = '';
        const video = dropzone.querySelector('video');
        if (video) video.remove();

        // Show icons/placeholders
        dropzone.querySelectorAll('i, span').forEach(el => el.classList.remove('hidden'));

        // Hide remove button
        const removeBtn = dropzone.querySelector('.btn-remove-media');
        if (removeBtn) removeBtn.classList.add('hidden');

        // Clear input
        const input = dropzone.querySelector('input[type="file"]');
        if (input) input.value = '';

        // Update State
        if (window.AutoBuilderForm && window.AutoBuilderForm.updateField) {
            window.AutoBuilderForm.updateField(context, null);
        }

        // Dispatch Null Update
        document.dispatchEvent(new CustomEvent('mediaUpdated', {
            detail: {
                type: context,
                data: null
            }
        }));

        console.log(`🗑️ Clear media: ${context}`);
    }

    /**
     * Updates a dropzone with a preview.
     * @param {HTMLElement} dropzone - The dropzone element
     * @param {string} url - The URL of the uploaded file
     * @param {string} type - The file type (image/video/audio)
     */
    function updateDropzonePreview(dropzone, url, type) {
        if (type === 'image') {
            dropzone.style.backgroundImage = `url(${url})`;
            dropzone.style.backgroundSize = 'cover';
            dropzone.style.backgroundPosition = 'center';
            dropzone.querySelectorAll('i, span').forEach(el => el.classList.add('hidden'));
        } else if (type === 'video') {
            const existingVideo = dropzone.querySelector('video');
            if (existingVideo) existingVideo.remove();

            const video = document.createElement('video');
            video.src = url;
            video.muted = true;
            video.loop = true;
            video.autoplay = true;
            video.classList.add('absolute', 'inset-0', 'w-full', 'h-full', 'object-cover');
            dropzone.appendChild(video);
            dropzone.appendChild(video);
            dropzone.querySelectorAll('i, span').forEach(el => el.classList.add('hidden'));
        }

        // Show remove button
        const removeBtn = dropzone.querySelector('.btn-remove-media');
        if (removeBtn) removeBtn.classList.remove('hidden');
    }

    /**
     * Reads file as Base64
     */
    function readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result); // Includes data:image/... prefix
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Initialize all dropzones
     */
    function setupDropzones() {
        console.log('[Dropzones] Initializing...');
        Object.keys(DROPZONE_CONTEXTS).forEach(id => {
            const dropzone = document.getElementById(id);
            if (!dropzone) return;

            const input = dropzone.querySelector('input[type="file"]');
            const context = DROPZONE_CONTEXTS[id];

            // Remove button handler
            const removeBtn = dropzone.querySelector('.btn-remove-media');
            if (removeBtn) {
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // prevent triggering dropzone click
                    e.preventDefault();
                    if (confirm('Remover este arquivo?')) {
                        clearDropzone(dropzone, context);
                        // Also clear base64 cache if it's the reference dropzone
                        if (id === 'cover-reference-dropzone') {
                            delete dropzone.dataset.base64;
                        }
                    }
                });
            }

            // Click to upload
            dropzone.addEventListener('click', (e) => {
                if (e.target !== removeBtn && !removeBtn.contains(e.target)) {
                    input.click();
                }
            });

            // Handle file selection
            input.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                // Preview immediately
                const url = URL.createObjectURL(file);
                // Basic type detection
                const type = file.type.startsWith('video') ? 'video' : 'image';
                updateDropzonePreview(dropzone, url, type);

                // Update hidden input for music name persistence if this is the music dropzone
                if (id === 'music-dropzone') {
                    const hiddenInput = document.getElementById('music-track-name-hidden');
                    if (hiddenInput) {
                        hiddenInput.value = file.name;
                        hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    // Also update visible text
                    const trackName = document.getElementById('music-track-name');
                    if (trackName) trackName.textContent = file.name;
                }

                // Store Base64 for Reference Dropzone immediately (needed for API)
                if (id === 'cover-reference-dropzone') {
                    try {
                        const base64 = await readFileAsBase64(file);
                        dropzone.dataset.base64 = base64; // Store on DOM element
                        console.log('Reference image cached as base64');
                    } catch (err) {
                        console.error('Error reading reference file:', err);
                    }
                }

                // Salvar blob no estado global para persistência
                if (context !== 'capa_referencia') {
                    if (!window.builderState) window.builderState = {};
                    if (!window.builderState.assets) window.builderState.assets = {};
                    window.builderState.assets[context] = file; // Salva o blob/file
                    console.log(`[Dropzones] Asset saved to state: ${context}`);
                }

                // Upload to server (optional, but good for persistence)
                // For now, we just utilize the local preview state for the builder experience
                // But we should trigger the state update
                if (window.AutoBuilderForm && window.AutoBuilderForm.updateField) {
                    // For regular fields, we might upload. 
                    // For reference, we might just keep it local or invalid for now since it's transient
                    if (context !== 'capa_referencia') {
                        window.AutoBuilderForm.updateField(context, url); // Simulating update with blob url
                    }
                }

                // Dispatch mediaUpdated event for preview buttons (Presentes, Manual, etc.)
                document.dispatchEvent(new CustomEvent('mediaUpdated', {
                    detail: {
                        type: context,
                        data: { url, file, blob: file }
                    }
                }));
            });

            // Drag and Drop visual feedback
            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('border-brand-500', 'bg-brand-50');
                // console.log('[Dropzones] Dragover:', id); // Too spammy
            });

            dropzone.addEventListener('dragleave', () => {
                dropzone.classList.remove('border-brand-500', 'bg-brand-50');
            });

            dropzone.addEventListener('drop', async (e) => {
                e.preventDefault();
                console.log('[Dropzones] Drop event on:', id);
                dropzone.classList.remove('border-brand-500', 'bg-brand-50');

                const file = e.dataTransfer.files[0];
                if (file) {
                    const url = URL.createObjectURL(file);
                    const type = file.type.startsWith('video') ? 'video' : 'image';
                    updateDropzonePreview(dropzone, url, type);

                    // Update hidden input for music name persistence if this is the music dropzone
                    if (id === 'music-dropzone') {
                        const hiddenInput = document.getElementById('music-track-name-hidden');
                        if (hiddenInput) {
                            hiddenInput.value = file.name;
                            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                        // Also update visible text
                        const trackName = document.getElementById('music-track-name');
                        if (trackName) trackName.textContent = file.name;
                    }

                    if (id === 'cover-reference-dropzone') {
                        const base64 = await readFileAsBase64(file);
                        dropzone.dataset.base64 = base64;
                    }

                    // Salvar blob no estado global para persistência
                    if (context !== 'capa_referencia') {
                        if (!window.builderState) window.builderState = {};
                        if (!window.builderState.assets) window.builderState.assets = {};
                        window.builderState.assets[context] = file;
                        console.log(`[Dropzones] Asset saved to state (drop): ${context}`);
                    }

                    // Dispatch mediaUpdated event for preview buttons
                    document.dispatchEvent(new CustomEvent('mediaUpdated', {
                        detail: {
                            type: context,
                            data: { url, file, blob: file }
                        }
                    }));
                }
            });
        });
    }

    // ========================================
    // Toggle Switches (Animate Background, etc)
    // ========================================

    function setupToggleSwitches() {
        // Animate Background Toggle
        const animateToggle = document.getElementById('animate-background-toggle');
        const leafLayers = document.getElementById('leaf-layers');

        if (animateToggle && leafLayers) {
            animateToggle.addEventListener('change', () => {
                if (animateToggle.checked) {
                    leafLayers.classList.remove('hidden');
                } else {
                    leafLayers.classList.add('hidden');
                }
            });
        }

        // Watermark Toggle
        const watermarkToggle = document.getElementById('watermark-toggle');
        if (watermarkToggle) {
            watermarkToggle.addEventListener('change', () => {
                // Update state when implemented
                console.log('Watermark:', watermarkToggle.checked);
            });
        }
    }


    // ========================================
    // Finalize Window & Deep Persistence
    // ========================================

    // ----------------------------------------
    // Shared Helpers (Global Scope)
    // ----------------------------------------

    /**
     * Generates the current state object (The Brain)
     */
    window.generateBuilderState = function () {
        const formData = window.AutoBuilderForm ? window.AutoBuilderForm.data : {};

        // Fetch fresh links from DOM/Manager if available, fallback to state
        let linksExtras = [];
        if (window.AutoBuilderLinksExtras && window.AutoBuilderLinksExtras.getLinksFromDOM) {
            linksExtras = window.AutoBuilderLinksExtras.getLinksFromDOM();
        } else {
            linksExtras = window.builderState?.linksExtras || [];
        }

        return {
            version: "4.0",
            timestamp: new Date().toISOString(),
            formData: formData,
            linksExtras: linksExtras,
            assetsMap: {}, // To be populated by caller based on actual files
            toggles: {
                manualMode: document.querySelector('#manual-mode-buttons .bg-white')?.dataset?.mode || 'text',
                giftsMode: document.querySelector('#gifts-mode-buttons .bg-white')?.dataset?.mode || 'link',
                fillMode: document.querySelector('#fill-mode-buttons .bg-white')?.dataset?.mode || 'overlay',
                // Add others if needed
            }
        };
    };

    /**
     * Restores the builder state from a state object
     * @param {object} appState - The loaded data.json
     * @param {JSZip} zipContext - Optional: JSZip object to load assets from (for ZIP import)
     * @param {string} baseUrl - Optional: Base URL to load assets from (for History/Web import)
     */
    window.restoreBuilderState = async function (appState, zipContext = null, baseUrl = null) {
        console.log('🔄 Restoring State...', appState);

        // 1. Hydrate Form Data
        // 1. Hydrate Form Data (Silent & Batched)
        if (appState.formData) {
            if (window.AutoBuilderForm && window.AutoBuilderForm.populateForm) {
                // Use populateForm to update UI without triggering events/API calls
                window.AutoBuilderForm.populateForm(appState.formData);

                // Dispatch a SINGLE update event to sync persistence/preview
                document.dispatchEvent(new CustomEvent('stateUpdated', {
                    detail: {
                        source: 'restore',
                        data: appState
                    }
                }));
            }
        }

        // 2. Hydrate Links
        if (appState.linksExtras && window.LinksExtras) {
            window.LinksExtras.restore(appState.linksExtras);
        }

        // 3. Hydrate Toggles (Best Effort)
        if (appState.toggles) {
            if (appState.toggles.manualMode) document.getElementById(`manual-mode-${appState.toggles.manualMode}`)?.click();
            if (appState.toggles.giftsMode) document.getElementById(`gifts-mode-${appState.toggles.giftsMode}`)?.click();
            if (appState.toggles.fillMode) document.getElementById(`fill-mode-${appState.toggles.fillMode}`)?.click();
        }

        // 4. Hydrate Assets
        if (appState.assetsMap) {
            const promises = Object.entries(appState.assetsMap).map(async ([context, path]) => {
                try {
                    let blob = null;
                    let url = null;

                    // Source A: ZIP
                    if (zipContext) {
                        const file = zipContext.file(path);
                        if (file) blob = await file.async("blob");
                    }
                    // Source B: Absolute URL
                    else if (path.startsWith('http')) {
                        try {
                            const resp = await fetch(path);
                            if (resp.ok) blob = await resp.blob();
                        } catch (e) { console.warn('Fetch failed for', path); }
                    }
                    // Source C: Web URL (Relative)
                    else if (baseUrl) {
                        // constructs url: baseUrl + path (path is likely 'assets/filename')
                        const fullUrl = baseUrl.endsWith('/') ? baseUrl + path : baseUrl + '/' + path;
                        try {
                            const resp = await fetch(fullUrl);
                            if (resp.ok) blob = await resp.blob();
                        } catch (e) { console.warn('Fetch failed for', fullUrl); }
                    }

                    if (blob) {
                        url = URL.createObjectURL(blob);

                        // Update Builder State
                        if (!window.builderState.assets) window.builderState.assets = {};
                        window.builderState.assets[context] = blob;

                        // Update Dropzone Visuals
                        // We need a robust way to find dropzone ID.
                        // We can use the dropzone map if we move it to scope or redefine it.
                        const dropzones = {
                            'capa': 'cover-dropzone',
                            'folha_vazia': 'leaf-dropzone',
                            'folha_preenchida': 'fill-image-dropzone',
                            'vid_abertura': 'intro-video-dropzone',
                            'vid_loop': 'loop-video-dropzone',
                            'presentes': 'gifts-image-dropzone',
                            'manual': 'manual-image-dropzone',
                            'musica': 'music-dropzone'
                        };
                        const dropzoneId = dropzones[context];

                        if (context === 'musica') {
                            // Specialized Music Handling
                            const player = document.getElementById('music-preview-player');
                            const nameDisplay = document.getElementById('music-file-name');
                            const dropzone = document.getElementById('music-dropzone');

                            if (player) {
                                player.src = url;
                                player.load(); // Important to load resource
                            }
                            if (nameDisplay) {
                                // Extract name from path if possible, or use generic
                                const filename = path.split('/').pop() || 'Música Importada.mp3';
                                nameDisplay.textContent = filename;
                                nameDisplay.classList.remove('hidden');
                            }
                            if (dropzone) {
                                dropzone.querySelectorAll('i, span').forEach(el => el.classList.add('hidden'));
                                // Ensure remove button is visible
                                const removeBtn = dropzone.querySelector('.btn-remove-media');
                                if (removeBtn) removeBtn.classList.remove('hidden');
                            }

                            // Also update the global player instance if available
                            if (window._mainAudioPlayer) {
                                window._mainAudioPlayer.src = url;
                            }

                        } else if (dropzoneId) {
                            const dropzone = document.getElementById(dropzoneId);
                            if (dropzone) {
                                const type = path.endsWith('.mp4') ? 'video' : 'image';
                                updateDropzonePreview(dropzone, url, type);
                            }
                        }
                    }
                } catch (err) {
                    console.warn(`Failed to restore asset ${context}:`, err);
                }
            });
            await Promise.all(promises);
        }

        console.log('✅ State Restored Successfully');
    };

    function setupFinalizeButtons() {
        console.log('[Windows] Setting up Finalize buttons...');

        // ----------------------------------------
        // Helper: Reset Builder State (Clean Slate)
        // ----------------------------------------
        // ----------------------------------------
        // Helper: Reset Builder State (Clean Slate)
        // ----------------------------------------
        /**
         * Resets the builder state (Clean Slate)
         * @param {boolean} silent - If true, skips confirmation dialog and alerts
         */
        window.resetBuilderState = function (silent = false) {
            if (!silent && !confirm('Deseja criar um novo convite? Isso limpará todas as configurações atuais e não salvas.')) {
                return false;
            }

            console.log('🧹 Cleaning Slate...');

            // 1. Reset Global State
            if (window.builderState) {
                window.builderState.assets = {};
                window.builderState.formData = {};
                window.builderState.linksExtras = [];
                // conversationHistory persists unless explicitly cleared or new session
            }

            // 2. Reset Form Fields
            if (window.AutoBuilderForm && window.AutoBuilderForm.reset) {
                window.AutoBuilderForm.reset();
            } else {
                // Manual fallback if reset method missing
                document.querySelectorAll('.form-input').forEach(input => {
                    if (input.type === 'checkbox') input.checked = false;
                    else if (input.type === 'color') input.value = '#000000';
                    else input.value = '';
                });
            }

            // 3. Reset Dropzones (SILENTLY)
            Object.keys(DROPZONE_CONTEXTS).forEach(baseId => {
                const dropzone = document.getElementById(baseId);
                const context = DROPZONE_CONTEXTS[baseId];
                if (dropzone) {
                    // Call clearDropzone directly to bypass button click confirmation
                    clearDropzone(dropzone, context);

                    // Specific cleanup for reference dropzone
                    if (baseId === 'cover-reference-dropzone') {
                        delete dropzone.dataset.base64;
                    }
                }
            });

            // 4. Reset Dynamic Links Container
            const linksContainer = document.getElementById('links-extras-container');
            if (linksContainer) linksContainer.innerHTML = '';
            document.getElementById('no-links-message')?.classList.remove('hidden');

            // 5. Reset Toggles/Modes to Default
            // (Simulate clicks on default buttons)
            document.getElementById('manual-mode-text')?.click();
            document.getElementById('gifts-mode-link')?.click();
            document.getElementById('fill-mode-overlay')?.click();

            // 6. Clear persistence (localStorage + IndexedDB)
            try {
                localStorage.removeItem('autobuilder_v4_state');
                // Also clear IndexedDB if available
                if (window.Persistence && window.Persistence.clear) {
                    // Don't call clear() directly as it reloads page
                    // Instead, just clear the IndexedDB database
                    const request = indexedDB.deleteDatabase('AutoBuilderDB');
                    request.onsuccess = () => console.log('[Reset] IndexedDB cleared');
                    request.onerror = () => console.warn('[Reset] Failed to clear IndexedDB');
                }
                console.log('[Reset] Persistence cleared');
            } catch (e) {
                console.warn('[Reset] Failed to clear persistence:', e);
            }

            console.log('✨ Clean Slate Complete');

            if (!silent) {
                // Optional internal feedback if needed, but keeping it minimal as requested
            }

            return true;
        };

        // Bind "Novo Convite" Button
        const newInvitationBtn = document.getElementById('btn-new-invitation');
        if (newInvitationBtn) {
            newInvitationBtn.addEventListener('click', () => {
                // We let resetBuilderState handle the confirmation (silent=false default)
                if (window.resetBuilderState(false)) {
                    // Optionally switch to 'form' tab
                    document.querySelector('[data-window="form"]')?.click();
                }
            });
        }

        // ----------------------------------------
        // 1. PREVIEW LOCAL (Client-Side)
        // ----------------------------------------
        const previewBtn = document.getElementById('btn-preview-local');
        if (previewBtn) {
            previewBtn.addEventListener('click', async () => {
                const originalText = previewBtn.innerHTML;
                try {
                    // 1. Collect Assets (Base64)
                    const filesMap = {};

                    // Generate Brain
                    const appState = window.generateBuilderState();

                    // Template
                    const templateResp = await fetch('final_template.html');
                    if (!templateResp.ok) throw new Error('Template não encontrado.');
                    let htmlContent = await templateResp.text();

                    // Helper: Blob to Base64
                    const blobToBase64 = (blob) => {
                        return new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result.split(',')[1]);
                            reader.readAsDataURL(blob);
                        });
                    };

                    // Collect Assets
                    const assetMap = {
                        'assets/musica.mp3': { source: window.builderState?.assets?.musica, context: 'musica' },
                        'assets/capa.png': { selector: '#cover-dropzone', type: 'bg', context: 'capa' },
                        'assets/folha.png': { selector: '#leaf-dropzone', type: 'bg', context: 'folha_vazia' },
                        'assets/intro.mp4': { selector: '#intro-video-dropzone video', type: 'src', context: 'vid_abertura' },
                        'assets/loop.mp4': { selector: '#loop-video-dropzone video', type: 'src', context: 'vid_loop' },
                        'assets/manual.png': { selector: '#manual-image-dropzone', type: 'bg', context: 'manual' },
                        'assets/gifts.png': { selector: '#gifts-image-dropzone', type: 'bg', context: 'presentes' }
                    };

                    async function fetchBlobFromSelector(selector, type) {
                        const el = document.querySelector(selector);
                        if (!el) return null;
                        let url = null;
                        if (type === 'bg') {
                            const style = el.style.backgroundImage;
                            if (style && style !== 'none') url = style.slice(4, -1).replace(/"/g, "");
                        } else if (type === 'src') url = el.src;
                        if (url) {
                            const resp = await fetch(url);
                            return await resp.blob();
                        }
                        return null;
                    }

                    const slug = document.getElementById('slug-input')?.value || 'preview-local';

                    for (const [path, config] of Object.entries(assetMap)) {
                        let blob = null;
                        if (config.source) blob = config.source;
                        else if (config.selector) blob = await fetchBlobFromSelector(config.selector, config.type);

                        if (blob) {
                            filesMap[`convites/${slug}/${path}`] = await blobToBase64(blob);
                            appState.assetsMap[config.context] = path; // Keep relative path in brain
                        }
                    }

                    // Add Brain (Base64)
                    filesMap[`convites/${slug}/data.json`] = btoa(JSON.stringify(appState, null, 2));

                    // Inject Variables and Add HTML
                    // Basic replacements for the published HTML
                    htmlContent = htmlContent.replace(/\[\[MUSICA_URL\]\]/g, './assets/musica.mp3');
                    htmlContent = htmlContent.replace(/\[\[CAPA_URL\]\]/g, './assets/capa.png');
                    htmlContent = htmlContent.replace(/\[\[FOLHA_URL\]\]/g, './assets/folha.png');
                    htmlContent = htmlContent.replace(/\[\[VIDEO_ABERTURA_URL\]\]/g, './assets/intro.mp4');
                    htmlContent = htmlContent.replace(/\[\[VIDEO_LOOP_URL\]\]/g, './assets/loop.mp4');
                    htmlContent = htmlContent.replace(/\[\[SLUG\]\]/g, slug);

                    // Generate menuConfig for buttons (Presentes, Manual, etc.)
                    const formData = window.AutoBuilderForm ? window.AutoBuilderForm.data : {};
                    const menuConfig = [];

                    // Google Maps
                    if (formData.link_google_maps || formData.google_maps_link) {
                        menuConfig.push({ titulo: 'Como Chegar', icone: 'fa-solid fa-map-marker-alt', link: formData.link_google_maps || formData.google_maps_link, id: 'maps' });
                    }

                    // Gifts
                    const giftsDropzone = document.querySelector('#gifts-image-dropzone');
                    const hasGiftImage = giftsDropzone && giftsDropzone.style.backgroundImage && giftsDropzone.style.backgroundImage !== 'none';
                    if (formData.link_presentes || formData.gifts_link) {
                        menuConfig.push({ titulo: 'Lista de Presentes', icone: 'fa-solid fa-gift', link: formData.link_presentes || formData.gifts_link, id: 'gifts' });
                    } else if (hasGiftImage) {
                        menuConfig.push({ titulo: 'Sugestões de Presentes', icone: 'fa-solid fa-gift', link: '#', id: 'gifts', isGiftImage: true });
                    }

                    // Manual
                    const manualDropzone = document.querySelector('#manual-image-dropzone');
                    const hasManualImage = manualDropzone && manualDropzone.style.backgroundImage && manualDropzone.style.backgroundImage !== 'none';
                    if (formData.manual_html || formData.manual_text) {
                        menuConfig.push({ titulo: 'Manual do Convidado', icone: 'fa-solid fa-book-open', link: '#', id: 'manual', manualText: formData.manual_html || formData.manual_text });
                    } else if (hasManualImage) {
                        menuConfig.push({ titulo: 'Manual do Convidado', icone: 'fa-solid fa-book-open', link: '#', id: 'manual', isManualImage: true });
                    }

                    // RSVP (WhatsApp/Link)
                    if (formData.numero_whatsapp || formData.whatsapp_number) {
                        const cleanNum = (formData.numero_whatsapp || formData.whatsapp_number).replace(/\D/g, '');
                        menuConfig.push({ titulo: 'Confirmar Presença', icone: 'fa-solid fa-check', link: `https://wa.me/${cleanNum}`, id: 'rsvp' });
                    } else if (formData.link_confirmacao || formData.confirmation_link) {
                        menuConfig.push({ titulo: 'Confirmar Presença', icone: 'fa-solid fa-check', link: formData.link_confirmacao || formData.confirmation_link, id: 'rsvp' });
                    }

                    // Inject menuConfig
                    htmlContent = htmlContent.replace(/\[\[MENU_CONFIG\]\]/g, JSON.stringify(menuConfig));

                    // Inject Text (form fields)
                    for (const [key, value] of Object.entries(formData)) {
                        const regex = new RegExp(`\\[\\[${key.toUpperCase()}\\]\\]`, 'g');
                        htmlContent = htmlContent.replace(regex, value || '');
                    }

                    // Inject default values for remaining placeholders
                    htmlContent = htmlContent.replace(/\[\[BUTTON_SIZE\]\]/g, formData.button_size || '1.0');
                    htmlContent = htmlContent.replace(/\[\[COMPANION_HIDE_CLASS\]\]/g, '');
                    htmlContent = htmlContent.replace(/\[\[MANUAL_CONTENT\]\]/g, formData.manual_html || '');
                    htmlContent = htmlContent.replace(/\[\[GIFTS_IMAGE_URL\]\]/g, './assets/gifts.png');
                    htmlContent = htmlContent.replace(/\[\[MANUAL_IMAGE_URL\]\]/g, './assets/manual.png');

                    filesMap[`convites/${slug}/index.html`] = btoa(htmlContent); // HTML base64

                    // Open in new tab
                    const blob = new Blob([htmlContent], { type: 'text/html' });
                    const blobUrl = URL.createObjectURL(blob);
                    window.open(blobUrl, '_blank');

                } catch (err) {
                    console.error('Preview error:', err);
                    alert('Erro na prévia: ' + err.message);
                } finally {
                    previewBtn.innerHTML = originalText;
                    previewBtn.disabled = false;
                }
            });
        }


        // ----------------------------------------
        // 2. DOWNLOAD ZIP (Export with Brain)
        // ----------------------------------------
        const downloadBtn = document.getElementById('btn-download-zip');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', async () => {
                const slug = document.getElementById('slug-input')?.value || 'meu-convite';
                const originalText = downloadBtn.innerHTML;

                try {
                    downloadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Empacotando...';
                    downloadBtn.disabled = true;

                    if (!window.JSZip) throw new Error('Biblioteca JSZip não carregada.');

                    const zip = new JSZip();
                    const assetsFolder = zip.folder("assets");

                    // 1. Prepare Data Brain (State)
                    const appState = window.generateBuilderState();
                    // Asset Map
                    const assetMap = {
                        music: { filename: 'musica.mp3', source: window.builderState?.assets?.music, context: 'musica' },
                        cover: { filename: 'capa.png', selector: '#cover-dropzone', type: 'bg', context: 'capa' },
                        leaf: { filename: 'folha.png', selector: '#leaf-dropzone', type: 'bg', context: 'folha_vazia' },
                        intro: { filename: 'intro.mp4', selector: '#intro-video-dropzone video', type: 'src', context: 'vid_abertura' },
                        loop: { filename: 'loop.mp4', selector: '#loop-video-dropzone video', type: 'src', context: 'vid_loop' },
                        manual: { filename: 'manual.png', selector: '#manual-image-dropzone', type: 'bg', context: 'manual' },
                        gifts: { filename: 'gifts.png', selector: '#gifts-image-dropzone', type: 'bg', context: 'presentes' }
                    };

                    // Helper: Fetch Blob
                    async function fetchBlob(url) {
                        if (!url) return null;
                        try {
                            const resp = await fetch(url);
                            return await resp.blob();
                        } catch (e) { console.warn('Failed to fetch:', url); return null; }
                    }

                    // Collect and Zip Assets
                    for (const [key, config] of Object.entries(assetMap)) {
                        let blob = null;
                        if (config.source) {
                            blob = config.source;
                        } else if (config.selector) {
                            const el = document.querySelector(config.selector);
                            if (el) {
                                let url = null;
                                if (config.type === 'bg') {
                                    const style = el.style.backgroundImage;
                                    if (style && style !== 'none') url = style.slice(4, -1).replace(/"/g, "");
                                } else if (config.type === 'src') url = el.src;

                                if (url) blob = await fetchBlob(url);
                            }
                        }

                        if (blob) {
                            assetsFolder.file(config.filename, blob);
                            appState.assetsMap[config.context] = `assets/${config.filename}`;
                        }
                    }

                    // 2. Add Brain to ZIP
                    zip.file("data.json", JSON.stringify(appState, null, 2));

                    // 3. Add final_template.html (Hydrated)
                    const templateResp = await fetch('final_template.html');
                    if (templateResp.ok) {
                        let htmlContent = await templateResp.text();
                        // (Inject same vars as preview for standalone usage)
                        // For simplicity, we assume the ZIP user might also use data.json or just the raw html
                        // We will perform a basic injection for the index.html so it works out of box
                        zip.file("index.html", htmlContent); // Simplified for "Export" logic, robust logic in Publish
                    }

                    // Generate
                    const content = await zip.generateAsync({ type: "blob" });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(content);
                    link.download = `${slug}.zip`;
                    link.click();

                    console.log('📦 ZIP Exported with data.json');

                } catch (err) {
                    console.error('ZIP Error:', err);
                    alert('Erro ao gerar ZIP: ' + err.message);
                } finally {
                    downloadBtn.innerHTML = originalText;
                    downloadBtn.disabled = false;
                }
            });
        }

        // ----------------------------------------
        // 3. IMPORT ZIP (Restore State)
        // ----------------------------------------
        const zipDropzone = document.getElementById('zip-upload-dropzone');
        const zipInput = document.getElementById('zip-upload-input');
        const restoreMsg = document.getElementById('restore-status-message'); // Optional UI element

        if (zipInput) {
            zipInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                if (!confirm('Isso irá substituir todo o conteúdo atual pelo conteúdo do arquivo ZIP. Deseja continuar?')) {
                    zipInput.value = '';
                    return;
                }

                try {
                    // 1. Clean Slate (Silent because we already confirmed above)
                    window.resetBuilderState(true);

                    if (!window.JSZip) throw new Error('JSZip missing');
                    const zip = new JSZip();
                    const zipContent = await zip.loadAsync(file);

                    // 2. Find data.json
                    let appState = null;
                    if (zipContent.file("data.json")) {
                        const jsonStr = await zipContent.file("data.json").async("string");
                        appState = JSON.parse(jsonStr);

                        // Use Shared Restorer
                        await window.restoreBuilderState(appState, zipContent);

                    } else {
                        // Legacy/External ZIP
                        // For now throw error or we could implement a manual hydration loop here
                        // But we want to encourage using data.json
                        throw new Error('Arquivo data.json não encontrado no ZIP. Este backup pode ser antigo ou inválido para restauração completa.');
                    }


                    alert('Projeto restaurado com sucesso!');

                } catch (err) {
                    console.error('Restore Error:', err);
                    alert('Erro ao restaurar ZIP: ' + err.message);
                } finally {
                    zipInput.value = '';
                }
            });
        }
    }

    // ----------------------------------------
    // 4. PUBLISH (Deploy to GitHub with timestamps)
    // The GitHub Token is stored securely in Supabase Edge Function
    // ----------------------------------------
    const publishBtn = document.getElementById('btn-publish');

    if (publishBtn) {
        publishBtn.addEventListener('click', async () => {
            const slugInput = document.getElementById('slug-input');
            const slug = slugInput?.value?.trim();

            console.log('[Publish] Slug input:', slugInput, 'Value:', slug);

            if (!slug) {
                alert('Por favor, preencha o Slug do convite.');
                slugInput?.focus();
                return;
            }

            if (!confirm(`Confirmar publicação em: mforgedesign.github.io/${slug}?`)) return;

            const originalText = publishBtn.innerHTML;
            try {
                // UI: Start
                publishBtn.disabled = true;
                publishBtn.innerHTML = '<i class="fa-solid fa-rocket fa-bounce"></i> Iniciando...';
                updateDeployStep('step-build', 'loading');
                updateDeployStep('step-upload', 'reset');
                updateDeployStep('step-live', 'reset');

                // 1. Prepare Brain & Timestamp
                const appState = window.generateBuilderState();
                const formData = (window.AutoBuilderForm && window.AutoBuilderForm.data) || {}; // Moved up
                const timestamp = Date.now();
                const assetsMap = {
                    // We use specific keys to identify context, but values will be timestamped paths
                    'music': { source: window.builderState?.assets?.musica, context: 'musica', ext: 'mp3' },
                    'cover': { selector: '#cover-dropzone', type: 'bg', context: 'capa', ext: 'png' },
                    'leaf': { selector: '#leaf-dropzone', type: 'bg', context: 'folha_vazia', ext: 'png' },
                    'filled': { selector: '#fill-image-dropzone', type: 'bg', context: 'folha_preenchida', ext: 'png' }, // ADDED
                    'intro': { selector: '#intro-video-dropzone video', type: 'src', context: 'vid_abertura', ext: 'mp4' },
                    'loop': { selector: '#loop-video-dropzone video', type: 'src', context: 'vid_loop', ext: 'mp4' },
                    'manual': { selector: '#manual-image-dropzone', type: 'bg', context: 'manual', ext: 'png' },
                    'gifts': { selector: '#gifts-image-dropzone', type: 'bg', context: 'presentes', ext: 'png' }
                };

                const filesMap = {};

                // Helper: Blob to Base64
                const blobToBase64 = (blob) => {
                    return new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result.split(',')[1]);
                        reader.readAsDataURL(blob);
                    });
                };

                // Helper: Fetch Blob
                async function fetchBlobFromSelector(selector, type) {
                    const el = document.querySelector(selector);
                    if (!el) return null;
                    let url = null;
                    if (type === 'bg') {
                        const style = el.style.backgroundImage;
                        if (style && style !== 'none') url = style.slice(4, -1).replace(/"/g, "");
                    } else if (type === 'src') url = el.src;
                    if (url) {
                        if (url.startsWith('blob:')) {
                            const resp = await fetch(url);
                            return await resp.blob();
                        }
                        // If it's a data URL or external URL (needs validation for CORS if external)
                        // For now assuming mostly local blobs or same-origin
                        const resp = await fetch(url);
                        return await resp.blob();
                    }
                    return null;
                }

                // 2. Collect Assets with Timestamped Names
                // Format: assets/name_TIMESTAMP.ext
                for (const [key, config] of Object.entries(assetsMap)) {
                    let blob = null;
                    if (config.source) blob = config.source;
                    else if (config.selector) blob = await fetchBlobFromSelector(config.selector, config.type);

                    if (blob) {
                        // Define standardized name with timestamp
                        // e.g. assets/capa_1708540000.png
                        const filename = `${config.context}_${timestamp}.${config.ext}`;
                        const path = `assets/${filename}`;

                        // Add to Files Payload (path assumes inside slug folder)
                        // Supabase Adapter expects relative paths to slug root
                        // filesMap["assets/capa_...png"] = base64

                        filesMap[path] = await blobToBase64(blob);

                        // Update Brain Map (so restore knows exact file)
                        appState.assetsMap[config.context] = path;

                        // Safety: also add back to builderState for immediate consistency?
                        // No, generateBuilderState returns a fresh object. appState IS the snapshot.
                    }
                }

                // Helper: UTF-8 safe Base64 encoding
                function utf8_to_b64(str) {
                    return window.btoa(unescape(encodeURIComponent(str)));
                }

                // 3. Add Brain to Payload
                filesMap['data.json'] = utf8_to_b64(JSON.stringify(appState, null, 2));

                // 4. Prepare HTML with Correct Asset Links
                // FORCE CACHE BUSTING on template fetch to ensure latest version
                const templateResp = await fetch(`final_template.html?v=${Date.now()}`);
                if (!templateResp.ok) throw new Error('Template não encontrado');
                let htmlContent = await templateResp.text();

                // Replacement Logic: Use the timestamped paths from appState.assetsMap
                // If an asset wasn't found/uploaded, use empty string or fallback?
                // The template expects [[CAPA_URL]], etc.

                const getPath = (context) => appState.assetsMap[context] ? `./${appState.assetsMap[context]}` : '';
                const getPathWithFallback = (context, fallback) => {
                    if (appState.assetsMap[context]) return `./${appState.assetsMap[context]}`;
                    if (appState.assetsMap[fallback]) return `./${appState.assetsMap[fallback]}`;
                    return '';
                };

                htmlContent = htmlContent.replace(/\[\[MUSICA_URL\]\]/g, getPath('musica'));
                htmlContent = htmlContent.replace(/\[\[CAPA_URL\]\]/g, getPath('capa'));
                htmlContent = htmlContent.replace(/\[\[FOLHA_URL\]\]/g, getPath('folha_vazia'));
                htmlContent = htmlContent.replace(/\[\[FOLHA_PREENCHIDA_URL\]\]/g, getPathWithFallback('folha_preenchida', 'folha_vazia')); // Fallback to empty leaf
                htmlContent = htmlContent.replace(/\[\[VIDEO_ABERTURA_URL\]\]/g, getPath('vid_abertura'));
                htmlContent = htmlContent.replace(/\[\[VIDEO_LOOP_URL\]\]/g, getPath('vid_loop'));
                htmlContent = htmlContent.replace(/\[\[MANUAL_URL\]\]/g, getPath('manual'));
                htmlContent = htmlContent.replace(/\[\[PRESENTS_URL\]\]/g, getPath('presentes'));
                htmlContent = htmlContent.replace(/\[\[SLUG\]\]/g, slug);

                // Inject Computed Data
                const pageTitle = formData.nome ? `Convite | ${formData.nome}` : 'Convite Digital';
                htmlContent = htmlContent.replace(/\[\[OG_TITLE\]\]/g, pageTitle);

                // Extract filename for meta tag (capa/filename.ext)
                const capaPath = appState.assetsMap['capa']; // e.g., assets/capa_123.png
                const capaFilename = capaPath ? capaPath.split('/').pop() : 'default_cover.jpg';
                htmlContent = htmlContent.replace(/\[\[CAPA_FILENAME\]\]/g, capaFilename);

                // Defaults if missing (from formData or default)
                // Defaults if missing (from formData or default)
                htmlContent = htmlContent.replace(/\[\[SHADOW_COLOR\]\]/g, formData.shadow_color || '#000000');
                // BUTTON_COLOR handled in computed section below
                htmlContent = htmlContent.replace(/\[\[TIMER_HIDE_CLASS\]\]/g, formData.data_evento ? '' : 'hidden');

                // Inject Text Data
                // formData already declared at top of scope
                // Inject Text Data
                // formData already declared at top of scope
                // Ensure formData is populated (sometimes appState is stale vs Form.data)
                // Ensure formData is populated (sometimes appState is stale vs Form.data)
                // FORCE COMPLETE SYNC from DOM elements (Bulletproof against stale state)
                try {
                    console.log("DEBUG PUBLISH: Scraping Fresh Data from DOM Inputs...");
                    const domData = {};
                    document.querySelectorAll('.form-input[data-field]').forEach(input => {
                        const field = input.getAttribute('data-field');
                        if (!field) return;

                        if (input.type === 'checkbox') {
                            domData[field] = input.checked;
                        } else if (input.type === 'radio') {
                            if (input.checked) domData[field] = input.value;
                        } else {
                            domData[field] = input.value;
                        }
                    });

                    console.log("DEBUG PUBLISH: DOM Data Scraped:", domData);
                    Object.assign(formData, domData);

                    // Also sync back to global state for consistency
                    if (window.AutoBuilderForm) {
                        Object.assign(window.AutoBuilderForm.data, domData);
                    }
                } catch (err) {
                    console.error("DEBUG PUBLISH: Error scraping DOM data", err);
                }

                // 3.5. Computed Replacements (Date/Time, Offset, Color)
                const eventDate = formData.data_evento || formData.data;
                const eventTime = formData.hora_evento || formData.hora || '00:00';
                const eventDateTime = eventDate ? `${eventDate}T${eventTime}:00` : '';
                htmlContent = htmlContent.replace(/\[\[EVENT_DATETIME\]\]/g, eventDateTime);

                const buttonsOffset = formData.botoes_offset || formData.posicao_botoes || formData.buttons_offset || '0';
                htmlContent = htmlContent.replace(/\[\[BUTTONS_OFFSET\]\]/g, buttonsOffset);

                // Timer Logic: Safe Boolean Conversion
                const isTimerEnabled = String(formData.timer_contagem).toLowerCase().trim() === 'true';
                const timerHideClass = isTimerEnabled ? '' : 'hidden';
                htmlContent = htmlContent.replace(/\[\[TIMER_HIDE_CLASS\]\]/g, timerHideClass);

                // Watermark Logic
                const isWatermarkEnabled = String(formData.watermark_enabled).toLowerCase().trim() === 'true';
                const watermarkHideClass = isWatermarkEnabled ? '' : 'hidden';
                htmlContent = htmlContent.replace(/\[\[WATERMARK_HIDE_CLASS\]\]/g, watermarkHideClass);

                // Prioritize 'cor_botoes', then 'shadow_color', then default
                const btnColor = formData.cor_botoes || formData.shadow_color || '#292524';
                htmlContent = htmlContent.replace(/\[\[BUTTON_COLOR\]\]/g, btnColor);

                for (const [key, value] of Object.entries(formData)) {
                    const regex = new RegExp(`\\[\\[${key.toUpperCase()}\\]\\]`, 'g');
                    // FIX: Handle 0 correctly (don't treat as falsey)
                    const safeValue = (value !== undefined && value !== null) ? value : '';
                    htmlContent = htmlContent.replace(regex, safeValue);
                }

                // Inject CSS Variable for Button Color (if template uses it)
                const customStyle = `<style>:root { --button-color: ${btnColor}; } .custom-button-bg { background-color: var(--button-color) !important; }</style>`;
                htmlContent = htmlContent.replace('</head>', `${customStyle}</head>`);




                // 4.1. Reconstruct Menu Config & Variables (moved UP before payload generation)
                const buttonSize = formData.button_size || '1.0';
                const companionHideClass = formData.companion_hide_class || '';

                // Re-generate menuConfig specifically for the static page
                const generatedMenu = [];

                // 1. Custom Links (Links Extras)
                const extraLinks = window.builderState.linksExtras || [];
                extraLinks.forEach(link => {
                    generatedMenu.push({
                        id: `extra-${Date.now()}-${Math.random()}`,
                        titulo: link.label,
                        icone: 'fa-solid fa-link',
                        link: link.url
                    });
                });

                // 2. Fixed Buttons (Map, Gifts, RSVP, Manual)

                // LOCATION


                // GIFTS (Presentes)
                // Fix: Check context 'presentes' which matches DROPZONE_CONTEXTS
                const hasGiftsImage = !!appState.assetsMap['presentes'];
                const giftsLink = formData.link_presentes;
                const giftsModeDiv = document.getElementById('gifts-image-mode');
                // Fallback: If has image and no link, force image mode
                const isGiftsImageMode = (giftsModeDiv && !giftsModeDiv.classList.contains('hidden')) || (hasGiftsImage && !giftsLink);

                if (isGiftsImageMode && hasGiftsImage) {
                    generatedMenu.push({ id: 'gifts', titulo: 'Presentes', icone: 'fa-solid fa-gift', link: '#', isGiftImage: true });
                } else if (!isGiftsImageMode && giftsLink) {
                    generatedMenu.push({ id: 'gifts', titulo: 'Presentes', icone: 'fa-solid fa-gift', link: giftsLink });
                }

                // LOCALIZACAO (Map)
                if (formData.link_google_maps) {
                    generatedMenu.push({ id: 'location', titulo: 'Localização', icone: 'fa-solid fa-location-dot', link: formData.link_google_maps });
                }

                // CONFIRMATION (RSVP)
                if (formData.numero_whatsapp) {
                    generatedMenu.push({ id: 'rsvp', titulo: 'Confirmar Presença', icone: 'fa-brands fa-whatsapp', link: `https://wa.me/${formData.numero_whatsapp}` });
                } else if (formData.link_confirmacao) {
                    generatedMenu.push({ id: 'rsvp', titulo: 'Confirmar Presença', icone: 'fa-solid fa-check', link: formData.link_confirmacao });
                }

                // MANUAL
                // Fix: Check context 'manual' which matches DROPZONE_CONTEXTS
                const hasManualImg = !!appState.assetsMap['manual'];
                // Fix: Get value from the correct textarea (manual-html-editor) OR fallback to raw text
                const manualHtml = document.getElementById('manual-html-editor')?.value || document.getElementById('manual-raw-text')?.value;
                // Fix: Determine mode by checking visibility of image mode container (hidden = text mode)
                const manualImageModeDiv = document.getElementById('manual-image-mode');
                // Fallback: If has image and no text, force image mode
                const isManualImageMode = (manualImageModeDiv && !manualImageModeDiv.classList.contains('hidden')) || (hasManualImg && (!manualHtml || manualHtml.trim() === ''));

                if (isManualImageMode && hasManualImg) {
                    generatedMenu.push({ id: 'manual', titulo: 'Manual', icone: 'fa-solid fa-book-open', link: '#', isManualImage: true });
                } else if (!isManualImageMode && manualHtml && manualHtml.trim() !== '') {
                    generatedMenu.push({ id: 'manual', titulo: 'Manual', icone: 'fa-solid fa-book-open', link: '#', manualText: manualHtml });
                }

                const menuConfig = generatedMenu; // Assign to the var expected by JSON.stringify

                console.log("DEBUG PUBLISH: AssetsMap", appState.assetsMap);
                console.log("DEBUG PUBLISH: Generated Menu", generatedMenu);

                // -------------------------------------------------------------------

                htmlContent = htmlContent.replace(/\[\[MENU_CONFIG\]\]/g, JSON.stringify(menuConfig));
                htmlContent = htmlContent.replace(/\[\[BUTTON_SIZE\]\]/g, buttonSize || '1.0');
                htmlContent = htmlContent.replace(/\[\[COMPANION_HIDE_CLASS\]\]/g, companionHideClass || '');

                filesMap['index.html'] = utf8_to_b64(htmlContent);

                // DIAGNOSTICS: Generate Debug Log for User (Optional)
                const isDebugEnabled = document.getElementById('debug-log-toggle')?.checked;
                if (window.DebugLogger && isDebugEnabled) {
                    console.log("Generating Debug Report...");
                    window.DebugLogger.generateReport(formData, menuConfig, htmlContent);
                }

                // 5. Send to API
                showDeployStatusArea(); // << Show UI immediately
                updateDeployStep('step-build', 'done');
                updateDeployStep('step-upload', 'loading');

                // We use /api/publish which is intercepted by supabase-adapter
                // Edge Function has the GitHub token stored securely
                // 4.1. Reconstruct Menu Config & Variables


                const payload = {
                    slug: slug,
                    files: filesMap
                };

                const response = await fetch('/api/publish', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Falha na publicação');

                updateDeployStep('step-upload', 'done');
                // Wait for live status to mark step-live as done
                // updateDeployStep('step-live', 'done'); // Moving this to after poll

                publishBtn.innerHTML = '<i class="fa-solid fa-check"></i> Enviado!';
                publishBtn.classList.remove('bg-brand-600');
                publishBtn.classList.add('bg-blue-600'); // Blue = Sent, Green = Live

                const liveUrl = `https://convites.mforge.com.br/${slug}/`;

                // 6. Poll for Deployment Status (GitHub Actions)
                // Pass SHA from deployBatch result to track specific build
                await pollDeployStatus(slug, liveUrl, result.sha);

            } catch (err) {
                console.error('Publish Error:', err);
                showDeployError(err.message);
                updateDeployStep('step-upload', 'reset'); // or error state

                const publishStatusArea = document.getElementById('publish-status-area');
                if (publishStatusArea) publishStatusArea.classList.add('hidden'); // Hide on error for retry

            } finally {
                if (publishBtn.innerHTML.includes('Iniciando') || publishBtn.innerHTML.includes('Aguardando')) {
                    publishBtn.innerHTML = originalText;
                }
                publishBtn.disabled = false;
            }
        });
    }

    // ==========================================
    // DEPLOYMENT UI HELPERS
    // ==========================================

    function showDeployStatusArea() {
        const area = document.getElementById('publish-status-area');
        const successActions = document.getElementById('publish-success-actions');
        const statusText = document.getElementById('deploy-status-text');

        if (area) area.classList.remove('hidden');
        if (successActions) successActions.classList.add('hidden');
        if (statusText) statusText.innerText = 'Iniciando...';

        // Reset Steps
        ['step-build', 'step-upload', 'step-live'].forEach(id => {
            updateDeployStep(id, 'pending');
        });
    }

    // Helper to update individual steps in the inline UI
    window.updateDeployStep = function (stepId, status) {
        const stepEl = document.getElementById(stepId);
        if (!stepEl) return;

        const icon = stepEl.querySelector('.step-icon');
        const text = stepEl.querySelector('span');

        if (status === 'loading') {
            if (icon) icon.className = 'step-icon fa-solid fa-spinner fa-spin text-amber-500 w-4 text-center';
            stepEl.className = 'flex items-center gap-3 text-sm text-amber-600 font-bold multiline-status';
        } else if (status === 'done') {
            if (icon) icon.className = 'step-icon fa-solid fa-check-circle text-green-600 w-4 text-center';
            stepEl.className = 'flex items-center gap-3 text-sm text-green-600 font-medium opacity-70';
        } else if (status === 'pending') {
            if (icon) icon.className = 'step-icon fa-regular fa-circle text-gray-400 w-4 text-center';
            stepEl.className = 'flex items-center gap-3 text-sm text-gray-500';
        } else if (status === 'error') {
            if (icon) icon.className = 'step-icon fa-solid fa-circle-xmark text-red-500 w-4 text-center';
            stepEl.className = 'flex items-center gap-3 text-sm text-red-500 font-bold';
        }
    };

    function showDeployError(msg) {
        alert('Erro ao publicar: ' + msg);
        const statusText = document.getElementById('deploy-status-text');
        if (statusText) {
            statusText.innerText = 'Erro: ' + msg;
            statusText.className = 'text-xs font-mono text-red-500';
        }
    }

    /**
     * Poll GitHub Actions status until success or timeout
     */
    async function pollDeployStatus(slug, liveUrl, commitSha = null) {
        const checkBtn = document.getElementById('btn-publish');
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes (5s interval)

        // Ensure UI is visible FIRST (resets steps to pending)
        showDeployStatusArea();

        // THEN set status to loading
        updateDeployStep('step-live', 'loading');
        checkBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Construindo...';

        // Update Status Text
        const statusText = document.getElementById('deploy-status-text');

        // Asset Fallback Check
        const assetPath = window.builderState?.assetsMap?.capa;
        let checkUrl = liveUrl;
        if (assetPath) checkUrl = liveUrl + assetPath;

        return new Promise((resolve, reject) => {
            const interval = setInterval(async () => {
                attempts++;
                const timestamp = Date.now();

                // 1. GitHub Workflow Check (Primary)
                if (commitSha && window.githubAdapter) {
                    try {
                        const workflow = await window.githubAdapter.getLatestWorkflowStatus(commitSha);
                        if (workflow) {
                            const status = workflow.status; // queued, in_progress, completed
                            const conclusion = workflow.conclusion; // success, failure, neutral, cancelled

                            if (statusText) {
                                // Translate status for user
                                let msg = 'Processando...';
                                if (status === 'queued') msg = 'Na fila...';
                                else if (status === 'in_progress') msg = 'Construindo site...';
                                else if (conclusion === 'success') msg = 'Concluído!';
                                statusText.innerText = `${msg} (${Math.round(attempts * 5)}s)`;
                            }

                            if (status === 'completed') {
                                if (conclusion === 'success') {
                                    finishPolling(true);
                                    return;
                                } else {
                                    finishPolling(false, `Erro no Build: ${conclusion}`);
                                    return;
                                }
                            }
                        } else {
                            if (statusText) statusText.innerText = 'Inicializando workflow...';
                        }
                    } catch (e) {
                        console.warn("Workflow check failed", e);
                    }
                } else if (statusText) {
                    // Fallback messaging
                    if (attempts % 4 === 0) statusText.innerText = 'Verificando disponibilidade...';
                }

                // 2. Timeout Check
                if (attempts >= maxAttempts) {
                    // Timeout doesn't mean failure, maybe just slow. But stop polling.
                    finishPolling(true); // Optimistic success
                    return;
                }

                // 3. Asset Availability Check (Secondary)
                // If we don't have SHA, or as backup if workflow API fails but site is live
                if (!commitSha && assetPath) {
                    const img = new Image();
                    img.onload = () => finishPolling(true);
                    img.src = `${checkUrl}?t=${timestamp}`;
                }

            }, 5000);

            function finishPolling(success, errorMsg) {
                clearInterval(interval);
                if (success) {
                    updateDeployStep('step-live', 'done');
                    checkBtn.innerHTML = '<i class="fa-solid fa-check"></i> Publicado!';
                    checkBtn.classList.remove('bg-brand-600', 'bg-blue-600', 'bg-yellow-600');
                    checkBtn.classList.add('bg-green-600');

                    if (statusText) statusText.innerText = 'Disponível Online!';
                    finalizeSuccessUI(liveUrl, slug);
                    resolve();
                } else {
                    updateDeployStep('step-live', 'error');
                    checkBtn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Erro';
                    checkBtn.classList.remove('bg-brand-600', 'bg-blue-600');
                    checkBtn.classList.add('bg-red-600');
                    if (statusText && errorMsg) statusText.innerText = errorMsg;
                    // Dont reject promise to avoid unhandled rejections crashing UI, just log
                    console.error(errorMsg);
                    resolve(); // Resolve anyway to stop spinner
                }
            }
        });
    }


    function finalizeSuccessUI(liveUrl, slug) {
        const successActions = document.getElementById('publish-success-actions');
        const btnOpenLive = document.getElementById('btn-open-live');
        const btnOpenRepo = document.getElementById('btn-open-repo');
        const btnCopyLink = document.getElementById('btn-copy-link');
        const statusText = document.getElementById('deploy-status-text');

        if (successActions) successActions.classList.remove('hidden');
        if (statusText) statusText.innerText = 'Disponível Online';

        if (btnOpenLive) btnOpenLive.href = liveUrl;

        // Repo URL construction
        // Structure: https://github.com/mforgedesign/Convites/tree/recuperaçãohoje/convites/${slug}
        // Updated to point to the correct invites repo
        const repoUrl = `https://github.com/mforgedesign/Convites/tree/recuperaçãohoje/convites/${slug}`;
        if (btnOpenRepo) btnOpenRepo.href = repoUrl;

        if (btnCopyLink) {
            btnCopyLink.onclick = () => {
                navigator.clipboard.writeText(liveUrl).then(() => {
                    const originalIcon = btnCopyLink.innerHTML;
                    btnCopyLink.innerHTML = '<i class="fa-solid fa-check"></i> Copiado!';
                    setTimeout(() => btnCopyLink.innerHTML = originalIcon, 2000);
                });
            };
        }
    }

    // ----------------------------------------
    // 5. CUSTOM ZIP UPLOAD (Bypass Build)
    // ----------------------------------------
    const customZipDropzone = document.getElementById('custom-zip-dropzone');
    if (customZipDropzone) {
        const zipInput = customZipDropzone.querySelector('input[type="file"]');

        // Click handler
        customZipDropzone.addEventListener('click', (e) => {
            if (e.target !== zipInput) {
                zipInput?.click();
            }
        });

        // Drag and Drop
        customZipDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            customZipDropzone.classList.add('border-brand-500', 'bg-brand-50');
        });

        customZipDropzone.addEventListener('dragleave', () => {
            customZipDropzone.classList.remove('border-brand-500', 'bg-brand-50');
        });

        customZipDropzone.addEventListener('drop', async (e) => {
            e.preventDefault();
            customZipDropzone.classList.remove('border-brand-500', 'bg-brand-50');
            const file = e.dataTransfer.files[0];
            if (file && file.name.endsWith('.zip')) {
                await handleCustomZipUpload(file);
            } else {
                alert('Por favor, envie um arquivo .zip');
            }
        });

        // File input change
        if (zipInput) {
            zipInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    await handleCustomZipUpload(file);
                    zipInput.value = ''; // Reset for future uploads
                }
            });
        }

        async function handleCustomZipUpload(file) {
            const slug = document.getElementById('slug-input')?.value?.trim();
            if (!slug) {
                alert('Por favor, preencha o Slug antes de fazer upload do ZIP.');
                document.getElementById('slug-input')?.focus();
                return;
            }

            if (!confirm(`Publicar ZIP personalizado em: mforgedesign.github.io/${slug}?`)) return;

            console.log('[CustomZIP] Starting upload:', file.name, 'to', slug);

            try {
                // 1. Unzip locally (Client-Side)
                const zip = new JSZip();
                const zipContent = await zip.loadAsync(file);

                const filesMap = {};

                // 2. Extract files to base64 map
                const promises = Object.keys(zipContent.files).map(async (filename) => {
                    const zipEntry = zipContent.files[filename];
                    if (zipEntry.dir) return; // Skip directories (GitHub API handles paths)

                    const blob = await zipEntry.async('blob');

                    // Convert to base64
                    const reader = new FileReader();
                    const base64 = await new Promise((resolve) => {
                        reader.onload = () => resolve(reader.result.split(',')[1]);
                        reader.readAsDataURL(blob);
                    });

                    filesMap[filename] = base64;
                });

                await Promise.all(promises);
                console.log('[CustomZIP] Extracted files:', Object.keys(filesMap));

                // 3. Send to Standard Publish API (reusing deploy-github)
                // We bypass the build step but use the same deployment function
                const response = await fetch('/api/publish', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        slug: slug,
                        files: filesMap // { "index.html": "...", "assets/..." }
                    })
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Falha no deploy');

                const liveUrl = `https://mforgedesign.github.io/${slug}/`;
                alert(`ZIP publicado com sucesso!\n\nAcesse: ${liveUrl}`);
                window.open(liveUrl, '_blank');

            } catch (err) {
                console.error('[CustomZIP] Error:', err);
                alert('Erro no upload: ' + err.message);
            }
        }
    }

    // Helper to reverse map contexts (since we defined map one way)
    // We can just define a helper function or object
    function findDropzoneId(contextTarget) {
        // DROPZONE_CONTEXTS is: { 'id': 'context' }
        // We need 'context' -> 'id'
        // Since `DROPZONE_CONTEXTS` is in closure, we rely on it being available or re-scan
        // Ideally we move DROPZONE_CONTEXTS to higher scope or define here
        const dropzones = {
            'capa': 'cover-dropzone',
            'folha_vazia': 'leaf-dropzone',
            'vid_abertura': 'intro-video-dropzone',
            'vid_loop': 'loop-video-dropzone',
            'presentes': 'gifts-image-dropzone',
            'manual': 'manual-image-dropzone',
            'musica': 'music-dropzone'
        };
        return dropzones[contextTarget];
    }


    function updateDeployStep(stepId, status) {
        const step = document.getElementById(stepId);
        if (!step) return;

        step.classList.remove('bg-gray-200', 'bg-green-500', 'bg-brand-500', 'text-gray-400', 'text-white');

        if (status === 'done') {
            step.classList.add('bg-green-500', 'text-white');
            step.innerHTML = '<i class="fa-solid fa-check text-xs"></i>';
        } else if (status === 'loading') {
            step.classList.add('bg-brand-500', 'text-white');
            step.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-xs"></i>';
        } else if (status === 'reset') {
            step.classList.add('bg-gray-200', 'text-gray-400');
            const stepNum = stepId.replace('step-', '');
            const nums = { 'build': '1', 'upload': '2', 'live': '3' };
            step.textContent = nums[stepNum] || '';
        }
    }

    // ========================================
    // AI Generation Buttons
    // ========================================

    // Map AI button types to dropzone IDs
    const AI_TYPE_TO_DROPZONE = {
        'cover': 'cover-dropzone',
        'leaf': 'leaf-dropzone',
        'intro': 'intro-video-dropzone',
        'loop': 'loop-video-dropzone',
        'fill': 'fill-image-dropzone',
        'manual': 'manual-image-dropzone',
        'gifts': 'gifts-image-dropzone'
    };

    function setupAIButtons() {
        const aiButtons = [
            { id: 'btn-generate-cover', type: 'cover', promptId: 'cover-prompt', mediaType: 'image' },
            { id: 'btn-generate-leaf', type: 'leaf', promptId: 'leaf-prompt', mediaType: 'image' },
            { id: 'btn-generate-intro', type: 'intro', promptId: 'intro-motion-prompt', mediaType: 'video' },
            { id: 'btn-generate-loop', type: 'loop', promptId: 'loop-motion-prompt', mediaType: 'video' },
            { id: 'btn-generate-fill', type: 'fill', promptId: 'fill-prompt', mediaType: 'image' },
            { id: 'manual-generate-image-btn', type: 'manual', promptId: 'manual-image-prompt', mediaType: 'image' },
            { id: 'gifts-generate-image-btn', type: 'gifts', promptId: 'gifts-image-prompt', mediaType: 'image' }
        ];

        aiButtons.forEach(({ id, type, promptId, mediaType }) => {
            const btn = document.getElementById(id);
            if (!btn) return;

            btn.addEventListener('click', async () => {
                const promptEl = document.getElementById(promptId);
                const customPrompt = promptEl?.value; // User can override AI prompt

                try {
                    await window.AIGeneration.generate(type, {
                        customPrompt,
                        onProgress: (step) => {
                            btn.disabled = true;
                            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i>${step}`;
                        },
                        onSuccess: (url) => {
                            btn.innerHTML = '<i class="fa-solid fa-check mr-2"></i>Gerado!';
                            setTimeout(() => {
                                btn.innerHTML = btn.dataset.originalText || 'Gerar';
                                btn.disabled = false;
                            }, 2000);
                        },
                        onError: (error) => {
                            alert('Erro ao gerar: ' + error);
                            btn.innerHTML = btn.dataset.originalText || 'Gerar';
                            btn.disabled = false;
                        }
                    });
                } catch (err) {
                    console.error('AI generation error:', err);
                }
            });

            // Store original text for reset
            btn.dataset.originalText = btn.innerHTML;
        });
    }

    // ==================== PUBLIC AI GENERATION API ====================
    // This will be called by both UI buttons and chatbot

    window.AIGeneration = {
        /**
         * Generate media using AI
         * @param {string} type - Generation type (cover, leaf, intro, loop, fill, manual, gifts)
         * @param {object} options - Generation options
         * @returns {Promise<string>} URL of generated media
         */
        async generate(type, options = {}) {
            const {
                customPrompt,
                listContent,
                rulesContent,
                referenceImage,
                onProgress,
                onSuccess,
                onError
            } = options;

            try {
                // Step 1: Build payload using ai-prompts module
                if (onProgress) onProgress('Preparando prompt...');

                const payload = window.AIPrompts.buildGenerationPayload(type, {
                    customPrompt,
                    listContent,
                    rulesContent,
                    referenceImage
                });

                // Step 2: Get required image URL for video/image-to-image
                if (payload.mode === 'image-to-video' || payload.mode === 'image-to-image') {
                    const imageUrl = await this.getRequiredImage(type);
                    if (!imageUrl) {
                        throw new Error(this.getMissingImageMessage(type));
                    }
                    payload.image_url = imageUrl;
                }

                // Step 3: Call API
                if (onProgress) onProgress('Gerando...');

                const isVideo = payload.mode === 'image-to-video';
                const endpoint = isVideo ? '/api/generate/video' : '/api/generate/image';

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                // Step 4: Extract URL
                let generatedUrl;
                if (isVideo) {
                    generatedUrl = data.data?.video?.url || data.video_url || data.url;
                } else {
                    generatedUrl = data.data?.images?.[0]?.url || data.image_url || data.url;
                }

                if (!generatedUrl) {
                    throw new Error('API não retornou URL válida');
                }

                // Step 5: Update dropzone preview
                const dropzoneId = AI_TYPE_TO_DROPZONE[type];
                const dropzone = document.getElementById(dropzoneId);
                if (dropzone) {
                    updateDropzonePreview(dropzone, generatedUrl, isVideo ? 'video' : 'image');
                }

                // Step 6: Update state
                window.builderState.assets[type] = generatedUrl;

                // Success callback
                if (onSuccess) onSuccess(generatedUrl);

                console.log(`✅ Generated ${type}:`, generatedUrl);
                return generatedUrl;

            } catch (error) {
                console.error(`❌ Generation error (${type}):`, error);
                if (onError) onError(error.message);
                throw error;
            }
        },

        /**
         * Get required image URL for video/image-to-image generation
         */
        async getRequiredImage(type) {
            const state = window.builderState || {};

            // Image-to-Video requirements
            if (type === 'intro') {
                return state.assets?.cover; // Needs capa.jpg
            }
            if (type === 'loop') {
                return state.assets?.background_only; // Needs background_only.jpg
            }

            // Image-to-Image requirements
            if (type === 'fill') {
                return state.assets?.leaf_only; // Needs leaf_only.png
            }
            if (type === 'manual' || type === 'gifts') {
                return state.assets?.background_only || state.assets?.leaf; // Fallback chain
            }

            return null;
        },

        /**
         * Get user-friendly message for missing images
         */
        getMissingImageMessage(type) {
            const messages = {
                'intro': '⚠️ Falta a Capa!\nPor favor, faça upload ou gere a imagem da Capa antes de criar a animação.',
                'loop': '⚠️ Falta o Background!\nRealize o tratamento da Folha Vazia ("Separar Camadas") para obter o "background_only.jpg".',
                'fill': '⚠️ Falta a Folha Recortada!\nRealize o tratamento da Folha Vazia para obter o "leaf_only.png".',
                'manual': 'Faça upload da Folha Vazia ou do background tratado primeiro.',
                'gifts': 'Faça upload da Folha Vazia ou do background tratado primeiro.'
            };
            return messages[type] || 'Imagem base necessária não encontrada.';
        },

        /**
         * Programmatically set custom prompt (for chatbot)
         */
        setPrompt(type, promptText) {
            const promptIds = {
                'cover': 'cover-prompt',
                'leaf': 'leaf-prompt',
                'intro': 'intro-motion-prompt',
                'loop': 'loop-motion-prompt',
                'fill': 'fill-prompt',
                'manual': 'manual-image-prompt',
                'gifts': 'gifts-image-prompt'
            };

            const promptId = promptIds[type];
            const promptEl = document.getElementById(promptId);
            if (promptEl) {
                promptEl.value = promptText;
            }
        },

        /**
         * Trigger generation button programmatically (for chatbot)
         */
        async triggerGeneration(type) {
            const buttonIds = {
                'cover': 'btn-generate-cover',
                'leaf': 'btn-generate-leaf',
                'intro': 'btn-generate-intro',
                'loop': 'btn-generate-loop',
                'fill': 'btn-generate-fill',
                'manual': 'manual-generate-image-btn',
                'gifts': 'gifts-generate-image-btn'
            };

            const btn = document.getElementById(buttonIds[type]);
            if (btn) {
                btn.click();
            } else {
                // Fallback: call generate directly
                return await this.generate(type);
            }
        }
    };


    // ========================================
    // Manual HTML Editor
    // ========================================

    function setupManualEditor() {
        const htmlEditor = document.getElementById('manual-html-editor');
        const preview = document.getElementById('manual-preview');

        if (htmlEditor && preview) {
            htmlEditor.addEventListener('input', () => {
                preview.innerHTML = htmlEditor.value || `
                    <div class="text-center text-gray-400">
                        <i class="fa-solid fa-eye-slash text-3xl mb-2"></i>
                        <p class="text-sm">Digite o texto e clique em "Otimizar" para ver a prévia</p>
                    </div>
                `;
            });
        }

        // Optimize button
        const optimizeBtn = document.getElementById('manual-optimize-btn');
        const rawText = document.getElementById('manual-raw-text');

        if (optimizeBtn && rawText && htmlEditor && preview) {
            optimizeBtn.addEventListener('click', async () => {
                const text = rawText.value;
                if (!text) return;

                // Simple transformation (real implementation would use AI)
                const lines = text.split('\n').filter(l => l.trim());
                const icons = {
                    'traje': 'fa-shirt',
                    'dress': 'fa-shirt',
                    'hora': 'fa-clock',
                    'estacionamento': 'fa-car',
                    'parking': 'fa-car',
                    'crianças': 'fa-child',
                    'kids': 'fa-child',
                    'presente': 'fa-gift',
                    'gift': 'fa-gift'
                };

                const html = lines.map(line => {
                    let icon = 'fa-circle-info';
                    for (const [keyword, iconClass] of Object.entries(icons)) {
                        if (line.toLowerCase().includes(keyword)) {
                            icon = iconClass;
                            break;
                        }
                    }
                    return `<p class="mb-2"><i class="fa-solid ${icon} text-brand-400 mr-2"></i>${line}</p>`;
                }).join('\n');

                htmlEditor.value = html;
                preview.innerHTML = html;
            });
        }
    }

    // ========================================
    // Auto-Prompt Logic (Theme Integration)
    // ========================================

    function setupAutoPromptListener() {
        // Listen for internal state updates from Form
        document.addEventListener('stateUpdated', (e) => {
            const { field, value, state } = e.detail;

            // Trigger when theme or colors change
            if (field === 'tema' || field === 'event_theme' || field === 'paleta_cores') {
                console.log('[Windows] Theme changed, refreshing prompts...');
                refreshAnimationPrompts();
            }
        });
    }

    function refreshAnimationPrompts() {
        if (!window.AIPrompts) return;

        // Intro Prompt
        const introPrompt = window.AIPrompts.getOpeningVideoPrompt();
        window.AIGeneration.setPrompt('intro', introPrompt);

        // Loop Prompt
        const loopPrompt = window.AIPrompts.getLoopVideoPrompt();
        window.AIGeneration.setPrompt('loop', loopPrompt);

        console.log('✨ Animation prompts updated based on new theme');
    }

    // ========================================
    // Cover Generation Logic (AI)
    // ========================================

    function setupCoverGeneration() {
        const generateBtn = document.getElementById('btn-generate-cover');
        const promptInput = document.getElementById('cover-prompt');
        const coverDropzone = document.getElementById('cover-dropzone');
        const refDropzone = document.getElementById('cover-reference-dropzone');

        if (!generateBtn || !coverDropzone) return;

        // update button text based on state
        function updateButtonState() {
            const hasCover = coverDropzone.style.backgroundImage && coverDropzone.style.backgroundImage !== 'none';
            if (hasCover) {
                generateBtn.innerHTML = '<i class="fa-solid fa-rotate"></i> Regenerar com IA';
                generateBtn.classList.remove('from-brand-600', 'to-indigo-600');
                generateBtn.classList.add('from-purple-600', 'to-pink-600');
            } else {
                generateBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Gerar com IA';
                generateBtn.classList.add('from-brand-600', 'to-indigo-600');
                generateBtn.classList.remove('from-purple-600', 'to-pink-600');
            }
        }

        // Listen to changes on dropzone to update button
        const observer = new MutationObserver(updateButtonState);
        observer.observe(coverDropzone, { attributes: true, attributeFilter: ['style'] });
        updateButtonState(); // init

        generateBtn.addEventListener('click', async () => {
            if (!window.APIClient) {
                alert('Erro: API Client não carregado.');
                return;
            }

            const prompt = promptInput.value || (window.getCoverPrompt ? window.getCoverPrompt() : '');
            if (!prompt) {
                alert('Por favor, digite um prompt ou preencha o formulário para auto-geração.');
                promptInput.focus();
                return;
            }

            // Get Reference Image if available (data-base64 stored on element or we read input)
            // Easier: read the file input directly if file was dragged, OR read the background image data uri
            let referenceImageBase64 = null;
            const refInput = refDropzone?.querySelector('input[type="file"]');

            if (refDropzone && refDropzone.dataset.base64) {
                referenceImageBase64 = refDropzone.dataset.base64;
                console.log('Using reference image from cache');
            }

            // UI Loading State
            const originalText = generateBtn.innerHTML;
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Gerando...';

            try {
                console.log('Calling APIClient.generateCover...');
                const imageUrl = await window.APIClient.generateCover(prompt, referenceImageBase64);

                // Update Main Dropzone
                updateDropzonePreview(coverDropzone, imageUrl, 'image');

                // Persist (assuming updateDropzonePreview handles UI, we need to trigger state update)
                // Since updateDropzonePreview is purely UI in some versions, let's ensure we call updateField
                if (window.AutoBuilderForm && window.AutoBuilderForm.updateField) {
                    // We might need to upload this remote URL to our server or save it?
                    // For now, we set it as the value. The build system handles URLs.
                    window.AutoBuilderForm.updateField('capa', imageUrl);
                }

                alert('Capa gerada com sucesso!');

            } catch (error) {
                console.error('Generation failed:', error);
                alert(`Erro na geração: ${error.message}`);
            } finally {
                generateBtn.disabled = false;
                generateBtn.innerHTML = originalText;
                updateButtonState(); // refresh state
            }
        });
    }

    // ========================================
    // Leaf Generation Logic (Blank Sheet)
    // ========================================
    function setupLeafGeneration() {
        const generateBtn = document.getElementById('btn-generate-leaf');
        const promptInput = document.getElementById('leaf-prompt');
        const leafDropzone = document.getElementById('leaf-dropzone');

        // Layer Processing Controls
        const processBtn = document.getElementById('btn-process-layers');
        const leafOnlyDropzone = document.getElementById('dropzone-leaf-only');
        const bgOnlyDropzone = document.getElementById('dropzone-background-only');

        if (!generateBtn || !leafDropzone) return;

        // 1. Leaf Generation (Text-to-Image)
        generateBtn.addEventListener('click', async () => {
            if (!window.APIClient) {
                alert('Erro: API Client não carregado.');
                return;
            }

            const prompt = promptInput.value || (window.AIPrompts ? window.AIPrompts.getBlankSheetPrompt() : '');
            if (!prompt) {
                alert('Por favor, digite um prompt ou certifique-se que o módulo de prompts está carregado.');
                promptInput?.focus();
                return;
            }

            // UI Loading State
            const originalText = generateBtn.innerHTML;
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Gerando...';

            try {
                // Call API
                const imageUrl = await window.APIClient.generateLeaf(prompt);

                // Update UI
                updateDropzonePreview(leafDropzone, imageUrl);

                // Update Form Logic
                // Assuming AutoBuilderForm is global and handles 'calda' or 'folha'
                if (window.AutoBuilderForm) {
                    window.AutoBuilderForm.updateField('folha', imageUrl);
                }

            } catch (error) {
                console.error('Leaf Generation failed:', error);
                alert(`Erro na geração: ${error.message}`);
            } finally {
                generateBtn.disabled = false;
                generateBtn.innerHTML = originalText;
            }
        });

        // 2. Treatment Pipeline (Separate Layers: Leaf Only + Background Only)
        if (processBtn) {
            processBtn.addEventListener('click', async () => {
                if (!window.APIClient) return;

                // Check if we have a leaf image to process
                const leafImage = leafDropzone.style.backgroundImage;
                if (!leafImage || leafImage === 'none') {
                    alert('Por favor, gere ou faça upload de uma Folha Vazia primeiro.');
                    return;
                }

                // Get URL from background-image url("...")
                let leafUrl = leafImage.slice(4, -1).replace(/"/g, "");

                // If it's a blob URL, we might need to convert it to base64 for the API
                // For now, let's assume APIClient handles it or logic helper does.
                // NOTE: APIClient expects Base64 or Public URL. Blob URLs won't work remotely.
                // We need to fetch the blob and convert to base64.

                const originalText = processBtn.innerHTML;
                processBtn.disabled = true;
                processBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processando...';

                try {
                    // Convert to base64 if needed
                    let base64Input = leafUrl;
                    if (leafUrl.startsWith('blob:') || leafUrl.startsWith('http')) {
                        const resp = await fetch(leafUrl);
                        const blob = await resp.blob();
                        base64Input = await new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result); // Helper
                            reader.readAsDataURL(blob);
                        });
                    }

                    // A. Remove Background (Get Leaf Only)
                    const leafOnlyUrl = await window.APIClient.removeBackground(base64Input);
                    if (leafOnlyDropzone) updateDropzonePreview(leafOnlyDropzone, leafOnlyUrl);
                    if (window.AutoBuilderForm) window.AutoBuilderForm.updateField('folha_only', leafOnlyUrl);

                    // B. Inpaint (Get Background Only)
                    try {
                        console.log('Generating mask for inpainting...');

                        // 1. Create Mask from Leaf Only (Alpha Channel)
                        const maskDataUrl = await createMaskFromImage(leafOnlyUrl);

                        // 2. Call Inpaint API
                        // Prompt: "clean background, empty table, no paper, elegant texture"
                        // Trigger Inpaint to remove the leaf area defined by mask
                        const backgroundOnlyUrl = await window.APIClient.inpaint(
                            base64Input, // Original Image
                            maskDataUrl, // Mask (White = area to remove/change)
                            "clean background, texture, empty surface, high quality, consistent lighting"
                        );

                        // 3. Update UI
                        if (bgOnlyDropzone) updateDropzonePreview(bgOnlyDropzone, backgroundOnlyUrl);
                        if (window.AutoBuilderForm) window.AutoBuilderForm.updateField('background_only', backgroundOnlyUrl);

                    } catch (bgError) {
                        console.error('Background Generation check failed:', bgError);
                        // Don't block whole flow if masking fails, but log it.
                        alert('Folha separada, mas houve erro ao gerar o background limpo: ' + bgError.message);
                    }

                } catch (error) {
                    console.error('Treatment failed:', error);
                    alert(`Erro no tratamento: ${error.message}`);
                } finally {
                    processBtn.disabled = false;
                    processBtn.innerHTML = originalText;
                }
            });
        }
    }

    /**
     * Helper: Create a binary mask from a transparent image.
     * White = Non-Transparent (Subject) -> Area to Inpaint/Remove
     * Black = Transparent (Background) -> Keep
     */
    function createMaskFromImage(imageUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');

                // Draw image
                ctx.drawImage(img, 0, 0);

                // Get pixel data
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                // Loop through pixels
                for (let i = 0; i < data.length; i += 4) {
                    const alpha = data[i + 3];

                    // If pixel has opacity (is part of leaf) -> Make it WHITE (Target for Inpaint)
                    // If pixel is transparent -> Make it BLACK (Keep original background)
                    if (alpha > 10) {
                        data[i] = 255;     // R
                        data[i + 1] = 255; // G
                        data[i + 2] = 255; // B
                        data[i + 3] = 255; // Alpha
                    } else {
                        data[i] = 0;
                        data[i + 1] = 0;
                        data[i + 2] = 0;
                        data[i + 3] = 255; // Alpha (Opaque black)
                    }
                }

                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = (err) => reject(err);
            img.src = imageUrl;
        });
    }


    /**
     * Setup Process Buttons (Generate Leaf, Treatment)
     */
    function setupProcessButtons() {
        const generateBtn = document.getElementById('btn-generate-leaf');
        const processBtn = document.getElementById('btn-process-complete');
        const promptInput = document.getElementById('leaf-prompt');

        const leafDropzone = document.getElementById('dropzone-folha');
        const leafOnlyDropzone = document.getElementById('dropzone-folha-only');
        const bgOnlyDropzone = document.getElementById('dropzone-background-only');

        // 1. Generate Leaf
        if (generateBtn) {
            generateBtn.addEventListener('click', async () => {
                if (!window.APIClient) {
                    alert('Erro: API Client não carregado.');
                    return;
                }

                const prompt = promptInput.value || (window.AIPrompts ? window.AIPrompts.getBlankSheetPrompt() : '');
                if (!prompt) {
                    alert('Por favor, digite um prompt ou certifique-se que o módulo de prompts está carregado.');
                    promptInput?.focus();
                    return;
                }

                // UI Loading State
                const originalText = generateBtn.innerHTML;
                generateBtn.disabled = true;
                generateBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Gerando...';

                try {
                    // Call API
                    const imageUrl = await window.APIClient.generateLeaf(prompt);

                    // Update UI
                    updateDropzonePreview(leafDropzone, imageUrl);

                    // Update Form Logic
                    if (window.AutoBuilderForm) {
                        window.AutoBuilderForm.updateField('folha', imageUrl);
                    }

                } catch (error) {
                    console.error('Leaf Generation failed:', error);
                    alert(`Erro na geração: ${error.message}`);
                } finally {
                    generateBtn.disabled = false;
                    generateBtn.innerHTML = originalText;
                }
            });
        }

        // 2. Treatment Pipeline
        if (processBtn) {
            processBtn.addEventListener('click', async () => {
                if (!window.APIClient) return;

                // Check if we have a leaf image to process
                const leafImage = leafDropzone.style.backgroundImage;
                if (!leafImage || leafImage === 'none') {
                    alert('Por favor, gere ou faça upload de uma Folha Vazia primeiro.');
                    return;
                }

                // Get URL from background-image url("...")
                let leafUrl = leafImage.slice(4, -1).replace(/"/g, "");

                const originalText = processBtn.innerHTML;
                processBtn.disabled = true;
                processBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processando...';

                try {
                    // Convert to base64 if needed
                    let base64Input = leafUrl;
                    if (leafUrl.startsWith('blob:') || leafUrl.startsWith('http')) {
                        const resp = await fetch(leafUrl);
                        const blob = await resp.blob();
                        base64Input = await new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result); // Helper
                            reader.readAsDataURL(blob);
                        });
                    }

                    // A. Remove Background (Get Leaf Only)
                    const leafOnlyUrl = await window.APIClient.removeBackground(base64Input);
                    if (leafOnlyDropzone) updateDropzonePreview(leafOnlyDropzone, leafOnlyUrl);
                    if (window.AutoBuilderForm) window.AutoBuilderForm.updateField('folha_only', leafOnlyUrl);

                    // B. Inpaint (Get Background Only)
                    try {
                        const maskDataUrl = await createMaskFromImage(leafOnlyUrl);

                        const backgroundOnlyUrl = await window.APIClient.inpaint(
                            base64Input, // Original Image
                            maskDataUrl, // Mask
                            "clean background, texture, empty surface, high quality, consistent lighting"
                        );

                        if (bgOnlyDropzone) updateDropzonePreview(bgOnlyDropzone, backgroundOnlyUrl);
                        if (window.AutoBuilderForm) window.AutoBuilderForm.updateField('background_only', backgroundOnlyUrl);

                    } catch (bgError) {
                        console.error('Background Generation check failed:', bgError);
                        alert('Folha separada, mas houve erro ao gerar o background limpo: ' + bgError.message);
                    }

                } catch (error) {
                    console.error('Treatment failed:', error);
                    alert(`Erro no tratamento: ${error.message}`);
                } finally {
                    processBtn.disabled = false;
                    processBtn.innerHTML = originalText;
                }
            });
        }
    }


    async function initWindows() {
        console.log('[Windows] Initializing...');

        try {
            setupDropzones();
            console.log('[Windows] Dropzones setup complete.');
        } catch (err) {
            console.error('[Windows] Failed to setup dropzones:', err);
        }

        setupProcessButtons();
        // Mode toggles
        setupModeToggle('manual', ['text', 'image']);
        setupModeToggle('gifts', ['link', 'image']);
        setupModeToggle('fill', ['overlay', 'flat']);

        // Animation tabs
        setupAnimationTabs();

        // Auto-Prompt Listener
        setupAutoPromptListener();

        // Music player
        setupMusicPlayer();

        // Dropzones
        setupDropzones();

        // Toggle switches
        setupToggleSwitches();

        // Finalize buttons
        setupFinalizeButtons();

        // AI generation buttons
        setupCoverGeneration();
        setupLeafGeneration();

        // Manual editor
        setupManualEditor();

        console.log('✅ Windows controller initialized');
    }

    // ========================================
    // Initialize on DOM Ready
    // ========================================
    // ========================================
    // Expose to Global Scope
    // ========================================
    window.updateDropzonePreview = updateDropzonePreview;

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWindows);
    } else {
        initWindows();
    }

    // ========================================
    // Expose to Global Scope
    // ========================================
    window.AutoBuilderWindows = {
        setupModeToggle,
        setupAnimationTabs,
        setupMusicPlayer
    };

})();
