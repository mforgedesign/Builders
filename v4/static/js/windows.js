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
    // alert removed

    // ========================================
    // Toast Notification Utility
    // ========================================
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        const colors = {
            info: 'bg-blue-500',
            success: 'bg-green-500',
            warning: 'bg-yellow-500 text-black',
            error: 'bg-red-500'
        };
        toast.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-white shadow-lg ${colors[type] || colors.info} animate-fade-in`;
        toast.innerHTML = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.5s';
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    }

    // ========================================
    // Elegant Modal Dialogs (replaces native confirm/alert)
    // ========================================

    /**
     * Shows an elegant confirmation modal
     * @param {string} title - Modal title
     * @param {string} message - Modal message (supports HTML)
     * @param {string} confirmText - Text for confirm button
     * @param {string} cancelText - Text for cancel button
     * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
     */
    function showConfirmModal(title, message, confirmText = 'Confirmar', cancelText = 'Cancelar') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in';
            modal.innerHTML = `
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform transition-all">
                    <div class="p-6">
                        <div class="flex items-center gap-4 mb-4">
                            <div class="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
                                <i class="fa-solid fa-rocket text-brand-600 text-xl"></i>
                            </div>
                            <h3 class="text-xl font-bold text-gray-800">${title}</h3>
                        </div>
                        <p class="text-gray-600 mb-6 leading-relaxed">${message}</p>
                        <div class="flex gap-3 justify-end">
                            <button id="modal-cancel" class="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors">
                                ${cancelText}
                            </button>
                            <button id="modal-confirm" class="px-5 py-2.5 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200">
                                <i class="fa-solid fa-check mr-2"></i>${confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const confirmBtn = modal.querySelector('#modal-confirm');
            const cancelBtn = modal.querySelector('#modal-cancel');

            confirmBtn.addEventListener('click', () => {
                modal.remove();
                resolve(true);
            });

            cancelBtn.addEventListener('click', () => {
                modal.remove();
                resolve(false);
            });

            // Close on backdrop click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                    resolve(false);
                }
            });

            // Close on Escape key
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    modal.remove();
                    resolve(false);
                    document.removeEventListener('keydown', handleEsc);
                }
            };
            document.addEventListener('keydown', handleEsc);

            // Focus confirm button
            confirmBtn.focus();
        });
    }

    /**
     * Shows an elegant alert modal (replaces native alert)
     * @param {string} title - Modal title
     * @param {string} message - Modal message
     * @param {string} type - 'info', 'warning', 'error', or 'success'
     */
    function showAlertModal(title, message, type = 'info') {
        return new Promise((resolve) => {
            const icons = {
                info: { icon: 'fa-circle-info', bg: 'bg-blue-100', text: 'text-blue-600' },
                success: { icon: 'fa-circle-check', bg: 'bg-green-100', text: 'text-green-600' },
                warning: { icon: 'fa-triangle-exclamation', bg: 'bg-yellow-100', text: 'text-yellow-600' },
                error: { icon: 'fa-circle-xmark', bg: 'bg-red-100', text: 'text-red-600' }
            };
            const style = icons[type] || icons.info;

            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in';
            modal.innerHTML = `
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                    <div class="p-6">
                        <div class="flex items-center gap-4 mb-4">
                            <div class="w-12 h-12 ${style.bg} rounded-full flex items-center justify-center shrink-0">
                                <i class="fa-solid ${style.icon} ${style.text} text-xl"></i>
                            </div>
                            <h3 class="text-xl font-bold text-gray-800">${title}</h3>
                        </div>
                        <p class="text-gray-600 mb-6 leading-relaxed">${message}</p>
                        <div class="flex justify-end">
                            <button id="modal-ok" class="px-6 py-2.5 rounded-xl bg-gray-800 text-white font-medium hover:bg-gray-700 transition-colors">
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const okBtn = modal.querySelector('#modal-ok');
            okBtn.addEventListener('click', () => {
                modal.remove();
                resolve();
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                    resolve();
                }
            });

            okBtn.focus();
        });
    }

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

            if (!btn) return; // Silent return if button missing

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
                if (content) content.classList.remove('hidden');

                // Update container dataset for state persistence
                const container = btn.closest('.flex');
                if (container) {
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
        'fill-image-dropzone': 'fundo_tela',  // Unified fundo (image or video)
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
    // Expose for Persistence module
    window.updateDropzonePreview = updateDropzonePreview;

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
                // fillMode removed - simplified unified approach
                // Add others if needed
            }
        };
    };

    /**
     * Fetch with retry and timeout for reliable asset loading
     * @param {string} url - URL to fetch
     * @param {number} retries - Number of retry attempts
     * @param {number} timeout - Timeout in ms per attempt
     */
    async function fetchWithRetry(url, retries = 2, timeout = 15000) {
        for (let i = 0; i <= retries; i++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);
                const resp = await fetch(url, { signal: controller.signal });
                clearTimeout(timeoutId);
                if (resp.ok) return resp;
                console.warn(`[Restore] HTTP ${resp.status} for ${url}`);
            } catch (e) {
                if (i === retries) {
                    console.error(`[Restore] Failed after ${retries + 1} attempts: ${url}`);
                    return null;
                }
                console.warn(`[Restore] Retry ${i + 1}/${retries} for ${url}`);
                await new Promise(r => setTimeout(r, 500)); // Wait before retry
            }
        }
        return null;
    }

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

        // 2. Hydrate Links Extras
        if (appState.linksExtras && window.AutoBuilderLinksExtras && window.AutoBuilderLinksExtras.populateLinks) {
            window.AutoBuilderLinksExtras.populateLinks(appState.linksExtras);
            console.log('[Restore] Links extras restored:', appState.linksExtras.length);
        }

        // 3. Hydrate Toggles (Best Effort)
        if (appState.toggles) {
            if (appState.toggles.manualMode) document.getElementById(`manual-mode-${appState.toggles.manualMode}`)?.click();
            if (appState.toggles.giftsMode) document.getElementById(`gifts-mode-${appState.toggles.giftsMode}`)?.click();
            // fillMode toggle removed - unified approach
        }

        // 4. Hydrate Assets
        // CRITICAL: First, clear ALL existing assets to prevent "zombie" assets (e.g., previous music persisting)
        // usage: iterate over known contexts and clear them if they exist
        Object.values(DROPZONE_CONTEXTS).forEach(ctx => {
            // Logic to clear internal state if needed, or rely on the UI clear
            // Since we are about to re-hydrate, we should assume a "clean slate" is desired.
            // However, resetBuilderState() does a full UI wipe. 
            // Ideally, restoreBuilderState should START by calling resetBuilderState, but that might be circular or too aggressive.
            // Instead, let's just ensure we don't have lingering state if the new map misses a key.
        });

        // BETTER APPROACH: Explicitly check for specific keys that tend to stick (Music) and clear them if missing in new map
        if (appState.assetsMap) {
            // List of critical assets to check for removal
            const criticalAssets = ['musica', 'capa', 'vid_abertura', 'fundo_tela'];

            criticalAssets.forEach(ctx => {
                // Check if raw key OR normalized key exists in the new map
                const hasAsset = Object.keys(appState.assetsMap).some(k => {
                    let norm = k;
                    if (norm === 'folha') norm = 'folha_vazia';
                    if (norm === 'background') norm = 'fundo_tela';
                    return norm === ctx;
                });

                if (!hasAsset) {
                    console.log(`[Restore] Asset '${ctx}' not found in new state. Clearing...`);
                    // Clear visual dropzone
                    const dropzoneId = Object.keys(DROPZONE_CONTEXTS).find(id => DROPZONE_CONTEXTS[id] === ctx);
                    if (dropzoneId) {
                        const el = document.getElementById(dropzoneId);
                        if (el) clearDropzone(el, ctx);
                    }
                    // Clear persistence/state
                    if (window.builderState && window.builderState.assets) {
                        delete window.builderState.assets[ctx];
                    }
                    // Special case for Music Name UI
                    if (ctx === 'musica') {
                        document.getElementById('music-track-name').textContent = 'Nenhuma música selecionada';
                        document.getElementById('music-track-name-hidden').value = '';
                    }
                }
            });

            const promises = Object.entries(appState.assetsMap).map(async ([rawKey, path]) => {
                // Key Normalization (Standardize legacy names)
                let context = rawKey;
                if (context === 'folha') context = 'folha_vazia';
                if (context === 'folha_preenchida') context = 'fundo_tela';
                if (context === 'background') context = 'fundo_tela';
                if (context === 'vid_loop') context = 'fundo_tela';

                try {
                    // Skip null/undefined paths (AI may return null for missing assets)
                    if (!path) {
                        console.warn(`[Restore] Skipping null path for asset: ${context}`);
                        return;
                    }

                    let blob = null;
                    let url = null;

                    // Source A: ZIP
                    if (zipContext) {
                        let file = zipContext.file(path);

                        // Case-insensitive fallback
                        if (!file) {
                            const lowerPath = path.toLowerCase();
                            const matchedPath = Object.keys(zipContext.files).find(k => k.toLowerCase() === lowerPath || k.toLowerCase().endsWith('/' + lowerPath));
                            if (matchedPath) {
                                file = zipContext.file(matchedPath);
                                console.log(`[Restore] Case-insensitive match found: ${path} -> ${matchedPath}`);
                            }
                        }

                        if (file) blob = await file.async("blob");
                    }
                    // Source B: Absolute URL (with retry)
                    else if (path.startsWith('http')) {
                        const resp = await fetchWithRetry(path);
                        if (resp) blob = await resp.blob();
                    }
                    // Source C: Web URL (Relative) (with retry)
                    else if (baseUrl) {
                        // constructs url: baseUrl + path (path is likely 'assets/filename')
                        const fullUrl = baseUrl.endsWith('/') ? baseUrl + path : baseUrl + '/' + path;
                        const resp = await fetchWithRetry(fullUrl);
                        if (resp) blob = await resp.blob();
                    }

                    if (blob) {
                        url = URL.createObjectURL(blob);

                        // Update Builder State with URL (APIs need URLs, not Blobs)
                        if (!window.builderState.assets) window.builderState.assets = {};
                        window.builderState.assets[context] = url;

                        // ----------------------------------------------------
                        // CRITICAL FIX: Save directly to Persistence (Original Key)
                        // This ensures 'capa' is saved as 'capa', regardless of Preview mapping
                        // ----------------------------------------------------
                        if (window.Persistence && window.Persistence.processAsset) {
                            // CRITICAL: Await saving to ensure data is persisted before function returns
                            await window.Persistence.processAsset(context, blob).catch(e => console.error('Direct Save Failed:', e));
                        }

                        // Update Dropzone Visuals
                        const dropzones = {
                            'capa': 'cover-dropzone',
                            'folha_vazia': 'leaf-dropzone',
                            'folha': 'leaf-dropzone', // Alias
                            'fundo_tela': 'fill-image-dropzone',
                            'folha_preenchida': 'fill-image-dropzone', // Alias
                            'background': 'fill-image-dropzone', // Alias
                            'vid_abertura': 'intro-video-dropzone',
                            'presentes': 'gifts-image-dropzone',
                            'manual': 'manual-image-dropzone',
                            'musica': 'music-dropzone'
                        };
                        const dropzoneId = dropzones[context];

                        if (context === 'musica') {
                            const player = document.getElementById('music-preview-player');
                            const nameDisplay = document.getElementById('music-file-name');
                            const dropzone = document.getElementById('music-dropzone');

                            if (player) {
                                player.src = url;
                                player.load();
                            }
                            if (nameDisplay) {
                                const filename = path.split('/').pop() || 'Música Importada.mp3';
                                nameDisplay.textContent = filename;
                                nameDisplay.classList.remove('hidden');
                            }
                            if (dropzone) {
                                dropzone.querySelectorAll('i, span').forEach(el => el.classList.add('hidden'));
                                const removeBtn = dropzone.querySelector('.btn-remove-media');
                                if (removeBtn) removeBtn.classList.remove('hidden');
                            }
                            if (window._mainAudioPlayer) window._mainAudioPlayer.src = url;

                        } else if (dropzoneId) {
                            const dropzone = document.getElementById(dropzoneId);
                            if (dropzone) {
                                const type = path.endsWith('.mp4') ? 'video' : 'image';
                                // FIXED: Access local function directly (closure), not window.
                                updateDropzonePreview(dropzone, url, type);
                            }
                        }

                        // Dispatch Media Update for Preview
                        const previewTypes = {
                            'capa': 'fundo_tela', // Visual Mapping only
                        };

                        const evtType = previewTypes[context] || context;
                        console.log(`[Restore] Dispatching mediaUpdated for ${context} -> ${evtType}`);

                        document.dispatchEvent(new CustomEvent('mediaUpdated', {
                            detail: {
                                type: evtType,
                                data: { url: url, type: path.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg' },
                                skipPersistence: true // Prevent overwriting DB with mapped preview
                            }
                        }));

                    }
                } catch (err) {
                    console.warn(`Failed to restore asset ${context}:`, err);
                    console.warn(`Failed to restore asset ${context}:`, err);
                    if (window.showToast) window.showToast(`Erro ao carregar ${context}`, 'error');
                }
            });
            await Promise.all(promises);
        }

        // 5. Slug Generation (if missing)
        const slugInput = document.getElementById('form-slug'); // Assumes hidden input or handled via title
        if (appState.formData && appState.formData.nome && !appState.slug) {
            const generatedSlug = appState.formData.nome
                .toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-') + '-' + Math.floor(Math.random() * 1000);

            console.log('[Restore] Generated Slug:', generatedSlug);
            // Update slug in state/UI if applicable. For now, we update window.builderState
            if (window.builderState) window.builderState.slug = generatedSlug;

            // If there's a visible field for slug (usually not in v4), update it.
            // Otherwise, ensure it's saved in persistence.
        }

        console.log('✅ State Restored Successfully');
    };

    /**
     * Resets the builder state (Clean Slate)
     * @param {boolean} silent - If true, skips confirmation dialog and alerts
     */
    window.resetBuilderState = async function (silent = false) {
        if (!silent && !confirm('Deseja criar um novo convite? Isso limpará todas as configurações atuais e não salvas.')) {
            return false;
        }

        console.log('🧹 Cleaning Slate...');

        // 1. Reset Global State
        if (window.builderState) {
            window.builderState.assets = {};
            window.builderState.formData = {};
            window.builderState.linksExtras = [];
        }

        // 2. Reset Form Fields
        if (window.AutoBuilderForm && window.AutoBuilderForm.reset) {
            window.AutoBuilderForm.reset();
        } else {
            document.querySelectorAll('.form-input').forEach(input => {
                if (input.type === 'checkbox') input.checked = false;
                else if (input.type === 'color') input.value = '#000000';
                else input.value = '';
            });
        }

        // 3. Reset Dropzones
        Object.keys(DROPZONE_CONTEXTS).forEach(baseId => {
            const dropzone = document.getElementById(baseId);
            const context = DROPZONE_CONTEXTS[baseId];
            if (dropzone) {
                clearDropzone(dropzone, context);
                if (baseId === 'cover-reference-dropzone') {
                    delete dropzone.dataset.base64;
                }
            }
        });

        // 4. Reset Dynamic Links
        const linksContainer = document.getElementById('links-extras-container');
        if (linksContainer) linksContainer.innerHTML = '';
        document.getElementById('no-links-message')?.classList.remove('hidden');

        // 5. Reset Toggles
        document.getElementById('manual-mode-text')?.click();
        document.getElementById('gifts-mode-link')?.click();

        // 6. Reset AI Prompts
        if (window.AIPrompts) {
            const introEl = document.getElementById('intro-motion-prompt');
            if (introEl) introEl.value = window.AIPrompts.getOpeningVideoPrompt();

            const loopEl = document.getElementById('loop-motion-prompt');
            if (loopEl) loopEl.value = window.AIPrompts.getLoopVideoPrompt();

            const coverEl = document.getElementById('cover-prompt');
            if (coverEl) coverEl.value = window.AIPrompts.getDefaultCoverPrompt();

            const fillEl = document.getElementById('fill-prompt');
            if (fillEl) fillEl.value = window.AIPrompts.getDefaultFillPrompt();
        }

        // 7. Clear persistence safely
        try {
            localStorage.removeItem('autobuilder_v4_state');
            if (window.Persistence && window.Persistence.wipeAssets) {
                console.log('[Reset] Wiping IndexedDB assets safely...');
                await window.Persistence.wipeAssets();
            }
            console.log('[Reset] Persistence cleared');
        } catch (e) {
            console.warn('[Reset] Error during persistence clear:', e);
        }

        console.log('✨ Clean Slate Complete');
        return true;
    };

    // Bind "Novo Convite" Button
    const newInvitationBtn = document.getElementById('btn-new-invitation');
    if (newInvitationBtn) {
        newInvitationBtn.addEventListener('click', async () => {
            // We let resetBuilderState handle the confirmation (silent=false default)
            if (await window.resetBuilderState(false)) {
                // Optionally switch to 'form' tab
                document.querySelector('[data-window="form"]')?.click();
            }
        });
    }

    // Bind "Preenchimento Padrão" buttons for Cover and Fill prompts
    const defaultCoverBtn = document.getElementById('btn-default-cover-prompt');
    if (defaultCoverBtn) {
        defaultCoverBtn.addEventListener('click', () => {
            const coverEl = document.getElementById('cover-prompt');
            if (coverEl && window.AIPrompts) {
                coverEl.value = window.AIPrompts.getDefaultCoverPrompt();
                console.log('[Windows] Cover prompt reset to default');
            }
        });
    }

    const defaultFillBtn = document.getElementById('btn-default-fill-prompt');
    if (defaultFillBtn) {
        defaultFillBtn.addEventListener('click', () => {
            const fillEl = document.getElementById('fill-prompt');
            if (fillEl && window.AIPrompts) {
                fillEl.value = window.AIPrompts.getDefaultFillPrompt();
                console.log('[Windows] Fill prompt reset to default');
            }
        });
    }

    // Bind "Local Import" (Folder/ZIP)
    const localImportBtn = document.getElementById('btn-local-import');
    const localImportInput = document.getElementById('local-import-input');

    if (localImportBtn && localImportInput) {
        localImportBtn.addEventListener('click', () => {
            localImportInput.click();
        });

        localImportInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Reset input
            localImportInput.value = '';

            console.log(`[Import] Selected file: ${file.name}`);

            // Show loading
            document.body.style.cursor = 'wait';
            const originalText = localImportBtn.innerHTML;
            localImportBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Importando...';

            try {
                // Check for JSZip
                if (!window.JSZip) {
                    throw new Error('JSZip library not loaded');
                }

                const zip = new JSZip();
                const zipContent = await zip.loadAsync(file);

                console.log('[Import] ZIP loaded, analyzing contents...');

                // 1. Look for Data
                let appState = null;
                let isCompatible = false;
                const dataFile = zipContent.file('data.json') || zipContent.file('form_data.json');
                const indexFile = zipContent.file('index.html');

                // Slug detection from filename
                const filenameSlug = file.name.replace(/\.[^/.]+$/, "").toLowerCase()
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-z0-9]/g, '-')
                    .replace(/-+/g, '-');

                console.log('[Import] Derived Slug from filename:', filenameSlug);

                // Content extraction
                let jsonContentStr = '';
                let htmlContent = '';

                if (dataFile) {
                    jsonContentStr = await dataFile.async('string');
                    try {
                        const parsed = JSON.parse(jsonContentStr);
                        if ((parsed.version && parseFloat(parsed.version) >= 4.0) || (parsed.assetsMap && parsed.assetsMap.fundo_tela)) {
                            appState = parsed;
                            isCompatible = true;
                            console.log('[Import] Compatible V4+ JSON found');
                        }
                    } catch (e) { console.warn('JSON Parse Error', e); }
                }

                // 2. If valid V4 data, direct load
                if (isCompatible && appState) {
                    if (!appState.slug) appState.slug = filenameSlug; // Inject slug
                    // Pass zip context for asset hydration
                    await window.restoreBuilderState(appState, zipContent);
                    if (window.showToast) window.showToast('Convite importado com sucesso!', 'success');
                } else {
                    // 3. AI Import Strategy (Legacy)
                    console.log('[Import] Legacy format detected. Initiating AI Analysis...');

                    if (indexFile) htmlContent = await indexFile.async('string');

                    // Detect assets for Visual Context
                    // Priority: Folha > Fundo > Capa > Any Large Image
                    let visualContext = null;
                    const validExts = ['.jpg', '.jpeg', '.png', '.webp'];
                    const files = Object.values(zipContent.files).filter(f => !f.dir);

                    let visualFile = files.find(f => {
                        const n = f.name.toLowerCase();
                        return validExts.some(ext => n.endsWith(ext)) &&
                            (n.includes('folha') || n.includes('convite') || n.includes('sheet'));
                    });

                    if (!visualFile) {
                        visualFile = files.find(f => {
                            const n = f.name.toLowerCase();
                            return validExts.some(ext => n.endsWith(ext)) &&
                                (n.includes('fundo') || n.includes('back'));
                        });
                    }

                    if (!visualFile) {
                        visualFile = files.find(f => {
                            const n = f.name.toLowerCase();
                            return validExts.some(ext => n.endsWith(ext)) &&
                                (n.includes('capa') || n.includes('cover'));
                        });
                    }

                    // Fallback: Find largest image (likely the main art)
                    if (!visualFile) {
                        // This is async in JSZip so we can't easily sort by size without loading metadata?
                        // JSZip file objects have ._data but internal. 
                        // We'll just pick the first valid image as last resort.
                        visualFile = files.find(f => {
                            const n = f.name.toLowerCase();
                            return validExts.some(ext => n.endsWith(ext));
                        });
                    }

                    if (visualFile) {
                        const blob = await visualFile.async('blob');
                        // Sanity check size (ignore icons < 10KB)
                        if (blob.size > 10000) {
                            const base64 = await new Promise((resolve) => {
                                const reader = new FileReader();
                                reader.onloadend = () => resolve(reader.result);
                                reader.readAsDataURL(blob);
                            });
                            visualContext = { type: 'image', base64: base64 };
                            console.log(`[Import] Found visual context: ${visualFile.name} (${(blob.size / 1024).toFixed(1)}KB)`);
                        }
                    }

                    // Prepare Payload for AI
                    const payload = {
                        htmlContent,
                        jsonContent: jsonContentStr,
                        fileList: Object.keys(zipContent.files),
                        visualContext
                    };

                    if (window.GeminiAdapter) {
                        alert('[DEBUG] Iniciando AI... Aguarde.');
                        // Use GeminiAdapter (which will bridge to GPT via Edge Function)
                        const aiData = await window.GeminiAdapter.analyzeRepository(payload);
                        // alert('[DEBUG] AI Retornou. Slug: ' + aiData.slug);

                        // Inject Slug
                        aiData.slug = filenameSlug;

                        // Map assets from ZIP to appState


                        // ----------------------------------------------------------------
                        // NATIVE FALLBACK (Aggressive)
                        // ----------------------------------------------------------------
                        if (!aiData.assetsMap) aiData.assetsMap = {};

                        // 1. Keyword Matching
                        const contexts = {
                            'capa': ['capa', 'cover', 'thumb'],
                            'folha_vazia': ['folha', 'sheet', 'leaf', 'base'],
                            'fundo_tela': ['fundo', 'background', 'bg', 'loop'],
                            'vid_abertura': ['intro', 'abertura', 'video'],
                            'musica': ['musica', 'music', 'audio']
                        };

                        const zipFiles = Object.keys(zipContent.files).filter(f => !zipContent.files[f].dir && !f.startsWith('__MACOSX'));

                        zipFiles.forEach(path => {
                            const lower = path.toLowerCase();
                            for (const [ctx, keywords] of Object.entries(contexts)) {
                                if (!aiData.assetsMap[ctx] && keywords.some(k => lower.includes(k))) {
                                    aiData.assetsMap[ctx] = path;
                                }
                            }
                        });

                        // 2. Last Resort: Assign ANY image to Capa if missing
                        if (!aiData.assetsMap['capa']) {
                            const anyImage = zipFiles.find(f => f.match(/\.(jpg|jpeg|png|webp)$/i));
                            if (anyImage) {
                                aiData.assetsMap['capa'] = anyImage;
                                console.log('[Import] Fallback: Assigned random image to Capa:', anyImage);
                            }
                        }

                        // 3. Fallback for fundo_tela (Unified Background)
                        if (!aiData.assetsMap['fundo_tela']) {
                            if (aiData.assetsMap['capa']) aiData.assetsMap['fundo_tela'] = aiData.assetsMap['capa'];
                            else if (aiData.assetsMap['folha_vazia']) aiData.assetsMap['fundo_tela'] = aiData.assetsMap['folha_vazia'];
                        }

                        // Debug removed
                        await window.restoreBuilderState(aiData, zipContent);
                        // Toast preserved, Alert removed
                    } else {
                        throw new Error('Módulo de I.A não disponível');
                    }
                }

                // Go to Form
                document.querySelector('[data-window="form"]')?.click();

            } catch (error) {
                console.error('[Import] Error:', error);
                alert('Erro na importação: ' + error.message);
            } finally {
                localImportBtn.innerHTML = originalText;
                document.body.style.cursor = 'default';
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
                    // Unified fundo - can be image or video from fill-image-dropzone
                    'assets/fundo': { selector: '#fill-image-dropzone', type: 'auto', context: 'fundo_tela' },
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
                    else if (type === 'auto') {
                        // Unified fundo: check for video first, then image background
                        const video = el.querySelector('video');
                        if (video && video.src) {
                            url = video.src;
                        } else {
                            const style = el.style.backgroundImage;
                            if (style && style !== 'none') url = style.slice(4, -1).replace(/"/g, "");
                        }
                    }
                    if (url) {
                        const resp = await fetch(url);
                        return await resp.blob();
                    }
                    return null;
                }

                const slug = document.getElementById('slug-input')?.value || 'preview-local';
                let fundoExt = 'png'; // Default extension for fundo

                for (const [path, config] of Object.entries(assetMap)) {
                    let blob = null;
                    if (config.source) blob = config.source;
                    else if (config.selector) blob = await fetchBlobFromSelector(config.selector, config.type);

                    if (blob) {
                        // Determine actual path with extension for fundo
                        let actualPath = path;
                        if (path === 'assets/fundo') {
                            // Detect type from blob MIME
                            if (blob.type.startsWith('video/')) {
                                fundoExt = 'mp4';
                            } else if (blob.type === 'image/jpeg' || blob.type === 'image/jpg') {
                                fundoExt = 'jpg';
                            } else {
                                fundoExt = 'png';
                            }
                            actualPath = `assets/fundo.${fundoExt}`;
                        }
                        filesMap[`convites/${slug}/${actualPath}`] = await blobToBase64(blob);
                        appState.assetsMap[config.context] = actualPath; // Keep relative path in brain
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
                htmlContent = htmlContent.replace(/\[\[FUNDO_TELA_URL\]\]/g, `./assets/fundo.${fundoExt}`);
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

                // RSVP (WhatsApp/Link) - Campo Unificado com Auto-Detecção
                // Retrocompatibilidade: suporta campo antigo numero_whatsapp e link_confirmacao
                const confirmacao = (formData.confirmacao || formData.link_confirmacao || formData.numero_whatsapp || '').trim();
                if (confirmacao) {
                    const isUrl = confirmacao.startsWith('http');
                    if (isUrl) {
                        // É um link - abre diretamente
                        menuConfig.push({ titulo: 'Confirmar Presença', icone: 'fa-solid fa-check', link: confirmacao, id: 'rsvp' });
                    } else {
                        // É um número de telefone - usa popup WhatsApp
                        const cleanNum = confirmacao.replace(/\D/g, '');
                        if (cleanNum) {
                            menuConfig.push({ titulo: 'Confirmar Presença', icone: 'fa-brands fa-whatsapp', link: `https://wa.me/${cleanNum}`, id: 'rsvp' });
                        }
                    }
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
                    fundo: { filename: 'fundo', selector: '#fill-image-dropzone', type: 'auto', context: 'fundo_tela' },  // Unified - extension determined dynamically
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



    // ==========================================
    // DEPLOYMENT UI HELPERS
    // ==========================================

    function showDeployStatusArea() {
        const area = document.getElementById('publish-status-area');
        const successActions = document.getElementById('publish-success-actions');
        const statusText = document.getElementById('deploy-status-text');

        if (area) area.classList.remove('hidden');
        if (successActions) successActions.classList.add('hidden');
        if (statusText) {
            statusText.innerText = 'Iniciando...';
            statusText.className = 'text-xs font-mono text-gray-500 bg-gray-200 px-2 py-1 rounded';
        }

        // Reset Steps to Pending
        [1, 2, 3].forEach(id => window.updateDeployStep(id, 'pending'));
    }

    // Helper to update individual steps in the inline UI
    window.updateDeployStep = function (stepId, status) {
        // Map legacy string IDs to new numeric IDs if necessary
        const map = { 'step-build': 1, 'step-upload': 2, 'step-live': 3 };
        const id = map[stepId] || stepId;

        const container = document.getElementById(`deploy-step-${id}`);
        if (!container) {
            console.warn(`[DeployUI] Step container #deploy-step-${id} not found`);
            return;
        }

        const iconEl = container.querySelector('.step-icon');
        const textEl = container.querySelector('span');

        // Reset Base Classes
        container.className = 'flex items-center gap-3 transition-colors duration-300';
        if (iconEl) iconEl.className = 'step-icon text-lg transition-all duration-300 w-6 text-center';

        if (status === 'loading') {
            container.classList.add('text-amber-600', 'font-bold');
            if (iconEl) iconEl.className = 'step-icon fa-solid fa-spinner fa-spin text-lg text-amber-500';

        } else if (status === 'done') {
            container.classList.add('text-green-600', 'font-medium');
            if (iconEl) iconEl.className = 'step-icon fa-solid fa-check-circle text-lg text-green-500';

        } else if (status === 'pending') {
            container.classList.add('text-gray-400');
            if (iconEl) iconEl.className = 'step-icon fa-regular fa-circle text-lg text-gray-300';

        } else if (status === 'error') {
            container.classList.add('text-red-600', 'font-bold');
            if (iconEl) iconEl.className = 'step-icon fa-solid fa-circle-xmark text-lg text-red-500';
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

    // Debug Helper
    function logDebug(msg) {
        console.log(`[DeployDebug] ${msg}`);
        let debugEl = document.getElementById('deploy-debug-log');
        if (!debugEl) {
            // Lazy create debug container if missing
            const container = document.getElementById('publish-status-area');
            if (container) {
                debugEl = document.createElement('div');
                debugEl.id = 'deploy-debug-log';
                debugEl.className = 'mt-4 p-2 bg-black text-xs font-mono text-green-400 overflow-y-auto max-h-48 rounded border border-gray-700 shadow-inner block';
                debugEl.style.display = 'block'; // Force block
                container.appendChild(debugEl);
            } else {
                console.warn("Could not find #publish-status-area to inject debug log");
            }
        }
        if (debugEl) {
            const line = document.createElement('div');
            line.innerText = `[${new Date().toLocaleTimeString()}] ${msg}`;
            line.style.borderBottom = '1px solid #333';
            line.style.padding = '2px 0';
            debugEl.appendChild(line);
            debugEl.scrollTop = debugEl.scrollHeight;
        }
    }

    /**
     * Poll GitHub Actions status until success or timeout
     */
    async function pollDeployStatus(slug, liveUrl, commitSha = null) {
        const checkBtn = document.getElementById('btn-publish');
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes (5s interval)

        logDebug(`Iniciando Polling. Slug: ${slug}, SHA: ${commitSha?.substring(0, 7)}...`);

        // Ensure UI is visible FIRST (resets steps to pending)
        // showDeployStatusArea(); // REMOVED: Resets UI steps incorrectly

        // THEN set status to loading
        window.updateDeployStep('step-live', 'loading');
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

                // 1. GitHub Workflow Check (Primary)
                if (commitSha && window.githubAdapter) {
                    try {
                        const workflow = await window.githubAdapter.getLatestWorkflowStatus(commitSha);
                        if (workflow) {
                            const status = workflow.status; // queued, in_progress, completed
                            const conclusion = workflow.conclusion; // success, failure, neutral, cancelled

                            logDebug(`Workflow: ${status} [${conclusion || '...'}]`);

                            if (statusText) {
                                // Translate status for user
                                let msg = 'Processando...';
                                if (status === 'queued') msg = 'Na fila...';
                                else if (status === 'in_progress') msg = 'Construindo site...';
                                else if (conclusion === 'success') msg = 'Concluído!';
                                statusText.innerText = `${msg} (${Math.round(attempts * 2)}s)`;
                            }

                            if (status === 'completed') {
                                if (conclusion === 'success') {
                                    logDebug('Workflow Success!');
                                    finishPolling(true);
                                    return;
                                } else {
                                    logDebug(`Workflow Failed: ${conclusion}`);
                                    finishPolling(false, `Erro no Build: ${conclusion}`);
                                    return;
                                }
                            }
                        } else {
                            logDebug(`Aguardando Workflow... (Tentativa ${attempts})`);
                            if (statusText) statusText.innerText = 'Inicializando workflow...';
                        }
                    } catch (e) {
                        logDebug(`Erro no check: ${e.message}`);
                        console.warn("Workflow check failed", e);
                    }
                } else if (statusText) {
                    logDebug('Sem SHA ou Adapter. Usando Fallback.');
                    // Fallback messaging
                    if (attempts % 4 === 0) statusText.innerText = 'Verificando disponibilidade...';
                }

                // 2. Timeout Check
                if (attempts >= maxAttempts) {
                    logDebug('Timeout. Assumindo sucesso (Otimista).');
                    finishPolling(true); // Optimistic success
                    return;
                }

                // 3. Asset Availability Check (Secondary)
                // If we don't have SHA, or as backup if workflow API fails but site is live
                if (!commitSha && assetPath) {
                    const img = new Image();
                    img.onload = () => {
                        logDebug('Imagem carregou. Site Online.');
                        finishPolling(true);
                    };
                    img.src = `${checkUrl}?t=${Date.now()}`;
                }

            }, 2000);

            function finishPolling(success, errorMsg) {
                clearInterval(interval);
                if (success) {
                    // STEP 3 COMPLETE: Live Done
                    window.updateDeployStep('step-live', 'done');
                    checkBtn.innerHTML = '<i class="fa-solid fa-check"></i> Publicado!';
                    checkBtn.classList.remove('bg-brand-600', 'bg-blue-600', 'bg-yellow-600', 'bg-red-600'); // Ensure all removed
                    checkBtn.classList.add('bg-green-600');

                    if (statusText) statusText.innerText = 'Disponível Online!';
                    finalizeSuccessUI(liveUrl, slug);
                    resolve();
                } else {
                    window.updateDeployStep('step-live', 'error');
                    checkBtn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Erro';
                    checkBtn.classList.remove('bg-brand-600', 'bg-blue-600');
                    checkBtn.classList.add('bg-red-600');
                    if (statusText && errorMsg) statusText.innerText = errorMsg;
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
            'fundo_tela': 'fill-image-dropzone',  // Unified fundo
            'presentes': 'gifts-image-dropzone',
            'manual': 'manual-image-dropzone',
            'musica': 'music-dropzone'
        };
        return dropzones[contextTarget];
    }


    // [REMOVED] Duplicate updateDeployStep - using the correct window.updateDeployStep from line 1753

    // ========================================
    // AI Generation Buttons
    // ========================================

    // Map AI button types to dropzone IDs
    const AI_TYPE_TO_DROPZONE = {
        'cover': 'cover-dropzone',
        'leaf': 'leaf-dropzone',
        'intro': 'intro-video-dropzone',
        'fill': 'fill-image-dropzone',  // Unified fundo
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
         * NOTE: Persistence uses Portuguese names (capa, folha_vazia), 
         *       while AI generation uses English names (cover, leaf).
         *       We check both for compatibility.
         */
        async getRequiredImage(type) {
            const assets = window.builderState?.assets || {};

            // Image-to-Video requirements
            if (type === 'intro') {
                // Needs capa.jpg - check both naming conventions
                return assets.cover || assets.capa;
            }
            if (type === 'loop') {
                // Needs background_only.jpg
                return assets.background_only || assets.folha_vazia;
            }

            // Image-to-Image requirements
            if (type === 'fill') {
                // Needs leaf_only.png
                return assets.leaf_only || assets.leaf || assets.folha_vazia;
            }
            if (type === 'manual' || type === 'gifts') {
                // Fallback chain for manual/gifts images
                return assets.background_only || assets.leaf || assets.folha_vazia || assets.capa;
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

            // Trigger preview update on state restoration
            document.addEventListener('stateUpdated', (e) => {
                if (e.detail && e.detail.source === 'persistence' && htmlEditor.value) {
                    htmlEditor.dispatchEvent(new Event('input'));
                }
            });
        }

        // Optimize button
        const optimizeBtn = document.getElementById('manual-optimize-btn');
        const rawText = document.getElementById('manual-raw-text');

        if (optimizeBtn && rawText && htmlEditor && preview) {
            optimizeBtn.addEventListener('click', async () => {
                const text = rawText.value;
                if (!text) return;

                // UI Feedback: Loading state
                const originalBtnText = optimizeBtn.innerHTML;
                optimizeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Otimizando (IA)...';
                optimizeBtn.disabled = true;

                try {
                    if (!window.supabaseClient) throw new Error("Supabase client not initialized");

                    // Call Supabase Edge Function
                    const { data, error } = await window.supabaseClient.functions.invoke('optimize-manual', {
                        body: { text }
                    });

                    if (error) throw new Error(error.message);
                    if (!data || !data.html) throw new Error("No HTML returned from AI");

                    // Show fallback toast if GPT was used
                    if (data.usedFallback) {
                        showToast('⚠️ Gemini falhou. Usado GPT-4o-mini como fallback.', 'warning');
                    }

                    // Update Editors
                    htmlEditor.value = data.html;
                    preview.innerHTML = data.html;

                    // Trigger input event to save state if needed
                    htmlEditor.dispatchEvent(new Event('input'));

                } catch (err) {
                    console.error('[Manual Optimizer] Error:', err);
                    alert('Erro ao otimizar texto: ' + err.message);
                } finally {
                    // Restore Button
                    optimizeBtn.innerHTML = originalBtnText;
                    optimizeBtn.disabled = false;
                }
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


    function setupFinalizeButtons() {
        // 4. PUBLISH (Deploy to GitHub with timestamps)
        const publishBtn = document.getElementById('btn-publish');
        if (publishBtn) {
            publishBtn.addEventListener('click', async () => {
                const slugInput = document.getElementById('slug-input');
                const slug = slugInput?.value?.trim();

                console.log('[Publish] Slug input:', slugInput, 'Value:', slug);

                if (!slug) {
                    await showAlertModal('Slug Obrigatório', 'Por favor, preencha o Slug do convite antes de publicar.', 'warning');
                    slugInput?.focus();
                    return;
                }

                // ===================================================
                // CHECK IF SLUG ALREADY EXISTS ON GITHUB
                // ===================================================
                publishBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verificando...';
                publishBtn.disabled = true;

                let slugExists = false;
                try {
                    // Check if slug folder exists in GitHub repo
                    const checkUrl = `https://api.github.com/repos/mforgedesign/Convites/contents/${slug}`;
                    const checkResp = await fetch(checkUrl, {
                        headers: { 'Accept': 'application/vnd.github.v3+json' }
                    });
                    slugExists = checkResp.ok; // 200 = exists, 404 = doesn't exist
                    console.log('[Publish] Slug check:', slug, slugExists ? 'EXISTS' : 'NEW');
                } catch (e) {
                    console.warn('[Publish] Could not check slug existence:', e);
                    // Continue anyway - better UX than blocking on network error
                }

                publishBtn.innerHTML = '<i class="fa-solid fa-rocket"></i> Publicar';
                publishBtn.disabled = false;

                // SHOW APPROPRIATE CONFIRMATION MODAL
                let confirmed = false;

                if (slugExists) {
                    // WARNING: Slug already exists - show prominent warning
                    confirmed = await showConfirmModal(
                        '⚠️ Slug já existe!',
                        `<div class="text-left space-y-3">
                            <p>O slug <strong class="text-red-600">${slug}</strong> já está em uso.</p>
                            <div class="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p class="text-red-800 text-sm">
                                    Ao <strong>confirmar</strong>, o convite que estiver nesse slug será 
                                    <strong>apagado</strong> e <strong>sobrescrito</strong> pelo convite atual no builder.
                                </p>
                            </div>
                            <p class="text-sm text-gray-600">URL: <strong>convites.mforge.com.br/${slug}</strong></p>
                        </div>`,
                        '⚠️ Sobrescrever',
                        'Cancelar'
                    );
                } else {
                    // Normal flow for new slug
                    confirmed = await showConfirmModal(
                        'Publicar Convite',
                        `Seu convite será publicado em:<br><strong class="text-brand-600">convites.mforge.com.br/${slug}</strong><br><br>Deseja continuar?`,
                        'Publicar',
                        'Cancelar'
                    );
                }

                if (!confirmed) return;

                const originalText = publishBtn.innerHTML;
                try {
                    // UI: Start
                    publishBtn.disabled = true;
                    publishBtn.innerHTML = '<i class="fa-solid fa-rocket fa-bounce"></i> Iniciando...';


                    showDeployStatusArea(); // Show immediately
                    window.updateDeployStep('step-build', 'loading');
                    window.updateDeployStep('step-upload', 'pending');
                    window.updateDeployStep('step-live', 'pending');

                    // 1. Prepare Brain & Timestamp
                    const appState = window.generateBuilderState();
                    const formData = (window.AutoBuilderForm && window.AutoBuilderForm.data) || {};
                    const timestamp = Date.now();

                    const assetsMap = {
                        // We use specific keys to identify context, but values will be timestamped paths
                        'music': { source: window.builderState?.assets?.musica, context: 'musica', ext: 'mp3' },
                        'cover': { selector: '#cover-dropzone', type: 'bg', context: 'capa', ext: 'png' },
                        'leaf': { selector: '#leaf-dropzone', type: 'bg', context: 'folha_vazia', ext: 'png' },
                        'fundo': { selector: '#fill-image-dropzone', type: 'auto', context: 'fundo_tela', ext: 'auto' },
                        'intro': { selector: '#intro-video-dropzone video', type: 'src', context: 'vid_abertura', ext: 'mp4' },
                        'manual': { selector: '#manual-image-dropzone', type: 'bg', context: 'manual', ext: 'png' },
                        'gifts': { selector: '#gifts-image-dropzone', type: 'bg', context: 'presentes', ext: 'png' }
                    };

                    const filesMap = {};

                    // Helper: Blob to Base64
                    const blobToBase64 = (blob) => {
                        return new Promise((resolve, reject) => {
                            if (!(blob instanceof Blob)) {
                                console.warn('[Publish] Invalid blob passed to blobToBase64:', blob);
                                resolve(''); // Return empty string to avoid crash
                                return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                if (reader.result) {
                                    resolve(reader.result.split(',')[1]);
                                }
                            };
                            reader.onerror = reject;
                            reader.readAsDataURL(blob);
                        });
                    };

                    // Helper: Fetch Blob
                    async function fetchBlobFromSelector(selector, type) {
                        const el = document.querySelector(selector);
                        if (!el) return null;
                        let url = null;

                        try {
                            if (type === 'auto') {
                                const video = el.querySelector('video');
                                if (video && video.src) {
                                    url = video.src;
                                } else {
                                    const style = el.style.backgroundImage;
                                    if (style && style !== 'none') {
                                        url = style.slice(4, -1).replace(/['"]/g, "");
                                    }
                                }
                            } else if (type === 'bg') {
                                const style = el.style.backgroundImage;
                                if (style && style !== 'none') {
                                    url = style.slice(4, -1).replace(/['"]/g, "");
                                }
                            } else if (type === 'src') {
                                url = el.src;
                            }

                            if (url) {
                                const resp = await fetch(url);
                                if (!resp.ok) throw new Error(`Network error: ${resp.status}`);
                                return await resp.blob();
                            }
                        } catch (e) {
                            console.warn('[Publish] Failed to catch asset from selector:', selector, url, e);
                            return null;
                        }
                        return null;
                    }

                    // 2. Collect Assets with Timestamped Names
                    for (const [key, config] of Object.entries(assetsMap)) {
                        let blob = null;

                        if (config.source) {
                            if (typeof config.source === 'string') {
                                try {
                                    console.log(`[Publish] Fetching remote asset for ${config.context}:`, config.source);
                                    const r = await fetch(config.source);
                                    if (r.ok) blob = await r.blob();
                                } catch (e) { console.warn('Failed to fetch source:', config.source); }
                            } else if (config.source instanceof Blob) {
                                blob = config.source;
                            }
                        }
                        else if (config.selector) {
                            blob = await fetchBlobFromSelector(config.selector, config.type);
                        }

                        if (blob && blob instanceof Blob) {
                            if (config.ext === 'auto') {
                                if (blob.type.includes('video')) config.ext = 'mp4';
                                else if (blob.type.includes('image')) config.ext = 'png';
                                else config.ext = 'dat';
                            }

                            const filename = `${config.context}_${timestamp}.${config.ext}`;
                            const path = `assets/${filename}`;

                            filesMap[path] = await blobToBase64(blob);
                            appState.assetsMap[config.context] = path;
                        }
                    }

                    // Helper: UTF-8 safe Base64 encoding
                    function utf8_to_b64(str) {
                        return window.btoa(unescape(encodeURIComponent(str)));
                    }

                    // 3. Add Brain to Payload
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

                        Object.assign(formData, domData);
                        if (!appState.formData) appState.formData = {};
                        Object.assign(appState.formData, domData);
                        if (window.AutoBuilderForm) {
                            Object.assign(window.AutoBuilderForm.data, domData);
                        }
                    } catch (err) {
                        console.error("DEBUG PUBLISH: Error scraping DOM data", err);
                    }

                    filesMap['data.json'] = utf8_to_b64(JSON.stringify(appState, null, 2));

                    // 4. Prepare HTML with Correct Asset Links
                    const templateResp = await fetch(`final_template.html?v=${Date.now()}`);
                    if (!templateResp.ok) throw new Error('Template não encontrado');
                    let htmlContent = await templateResp.text();

                    const eventDate = formData.data_evento || formData.data;
                    const eventTime = formData.hora_evento || formData.hora || '00:00';
                    const eventDateTime = eventDate ? `${eventDate}T${eventTime}:00` : '';
                    htmlContent = htmlContent.replace(/\[\[EVENT_DATETIME\]\]/g, eventDateTime);

                    const buttonsOffset = formData.botoes_offset || formData.posicao_botoes || formData.buttons_offset || '0';
                    htmlContent = htmlContent.replace(/\[\[BUTTONS_OFFSET\]\]/g, buttonsOffset);

                    const hostName = formData.nome_anfitriao || formData.nome || 'Convite';
                    const eventType = formData.tipo_evento || formData.event_type || 'Evento';
                    let pageTitle = `${hostName} | ${eventType}`;

                    if ((formData.idade_aniversariante || formData.idade) &&
                        eventType.toLowerCase().includes('aniversário')) {
                        pageTitle += ` ${formData.idade_aniversariante || formData.idade} Anos`;
                    }

                    htmlContent = htmlContent.replace(/\[\[OG_TITLE\]\]/g, pageTitle);

                    const isTimerEnabled = String(formData.timer_contagem).toLowerCase().trim() === 'true';
                    const timerHideClass = isTimerEnabled ? '' : 'hidden';
                    htmlContent = htmlContent.replace(/\[\[TIMER_HIDE_CLASS\]\]/g, timerHideClass);

                    const isWatermarkEnabled = String(formData.watermark_enabled).toLowerCase().trim() === 'true';
                    const watermarkHideClass = isWatermarkEnabled ? '' : 'hidden';
                    htmlContent = htmlContent.replace(/\[\[WATERMARK_HIDE_CLASS\]\]/g, watermarkHideClass);

                    const btnColor = formData.cor_botoes || formData.shadow_color || '#292524';
                    htmlContent = htmlContent.replace(/\[\[BUTTON_COLOR\]\]/g, btnColor);

                    for (const [key, value] of Object.entries(formData)) {
                        const regex = new RegExp(`\\[\\[${key.toUpperCase()}\\]\\]`, 'g');
                        const safeValue = (value !== undefined && value !== null) ? value : '';
                        htmlContent = htmlContent.replace(regex, safeValue);
                    }

                    if (appState.assetsMap) {
                        for (const [context, assetPath] of Object.entries(appState.assetsMap)) {
                            if (!assetPath || typeof assetPath !== 'string') continue;

                            const relativePath = assetPath;
                            const filename = assetPath.split('/').pop();

                            let tokenKey = context.toUpperCase();
                            if (tokenKey === 'PRESENTES') tokenKey = 'PRESENTS';
                            if (tokenKey === 'FOLHA_VAZIA') tokenKey = 'FOLHA';
                            if (tokenKey === 'VID_ABERTURA') tokenKey = 'VIDEO_ABERTURA';

                            const urlToken = `[[${tokenKey}_URL]]`;
                            htmlContent = htmlContent.split(urlToken).join(relativePath);

                            const filenameToken = `[[${tokenKey}_FILENAME]]`;
                            htmlContent = htmlContent.split(filenameToken).join(filename);
                        }
                    }

                    const customStyle = `<style>:root { --button-color: ${btnColor}; } .custom-button-bg { background-color: var(--button-color) !important; }</style>`;
                    htmlContent = htmlContent.replace('</head>', `${customStyle}</head>`);

                    const buttonSize = formData.button_size || '1.0';
                    const isCompanionEnabled = String(formData.permitir_acompanhante).toLowerCase().trim() === 'true' || formData.permitir_acompanhante === true || formData.permitir_acompanhante === 'on';
                    const companionHideClass = isCompanionEnabled ? '' : '!hidden';

                    // Generate menuConfig 
                    const buttonOrder = (window.AutoBuilderPreview && window.AutoBuilderPreview.getButtonOrder)
                        ? window.AutoBuilderPreview.getButtonOrder()
                        : ['location', 'gifts', 'rsvp', 'manual'];

                    const buttonConfigs = {};

                    if (formData.link_google_maps) {
                        buttonConfigs['location'] = {
                            id: 'location',
                            titulo: 'Localização',
                            icone: 'fa-solid fa-location-dot',
                            link: formData.link_google_maps
                        };
                    }

                    const hasGiftsImage = !!appState.assetsMap['presentes'];
                    const giftsLink = formData.link_presentes;
                    const giftsModeDiv = document.getElementById('gifts-image-mode');
                    const isGiftsImageMode = (giftsModeDiv && !giftsModeDiv.classList.contains('hidden')) || (hasGiftsImage && !giftsLink);

                    if (isGiftsImageMode && hasGiftsImage) {
                        buttonConfigs['gifts'] = { id: 'gifts', titulo: 'Presentes', icone: 'fa-solid fa-gift', link: '#', isGiftImage: true };
                    } else if (!isGiftsImageMode && giftsLink) {
                        buttonConfigs['gifts'] = { id: 'gifts', titulo: 'Presentes', icone: 'fa-solid fa-gift', link: giftsLink };
                    }

                    // RSVP: Campo Unificado com Auto-Detecção
                    const confirmacao2 = (formData.confirmacao || formData.link_confirmacao || formData.numero_whatsapp || '').trim();
                    if (confirmacao2) {
                        const isUrl2 = confirmacao2.startsWith('http');
                        if (isUrl2) {
                            buttonConfigs['rsvp'] = { id: 'rsvp', titulo: 'Confirmar Presença', icone: 'fa-solid fa-check', link: confirmacao2 };
                        } else {
                            const cleanNum2 = confirmacao2.replace(/\D/g, '');
                            if (cleanNum2) {
                                buttonConfigs['rsvp'] = { id: 'rsvp', titulo: 'Confirmar Presença', icone: 'fa-brands fa-whatsapp', link: `https://wa.me/${cleanNum2}` };
                            }
                        }
                    }

                    const hasManualImg = !!appState.assetsMap['manual'];
                    const manualHtml = document.getElementById('manual-html-editor')?.value || document.getElementById('manual-raw-text')?.value;
                    const manualImageModeDiv = document.getElementById('manual-image-mode');
                    const isManualImageMode = (manualImageModeDiv && !manualImageModeDiv.classList.contains('hidden')) || (hasManualImg && (!manualHtml || manualHtml.trim() === ''));

                    if (isManualImageMode && hasManualImg) {
                        buttonConfigs['manual'] = { id: 'manual', titulo: 'Manual', icone: 'fa-solid fa-book-open', link: '#', isManualImage: true };
                    } else if (!isManualImageMode && manualHtml && manualHtml.trim() !== '') {
                        buttonConfigs['manual'] = { id: 'manual', titulo: 'Manual', icone: 'fa-solid fa-book-open', link: '#', manualText: manualHtml };
                    }

                    const extraLinks = window.builderState.linksExtras || [];
                    extraLinks.forEach((link, idx) => {
                        const extraId = `extra-${link.id || idx}`;
                        buttonConfigs[extraId] = {
                            id: extraId,
                            titulo: link.label,
                            icone: link.icon || 'fa-solid fa-link',
                            link: link.url
                        };
                    });

                    const generatedMenu = [];
                    buttonOrder.forEach(buttonId => {
                        if (buttonConfigs[buttonId]) {
                            generatedMenu.push(buttonConfigs[buttonId]);
                        }
                    });

                    Object.keys(buttonConfigs).forEach(buttonId => {
                        if (!buttonOrder.includes(buttonId)) {
                            generatedMenu.push(buttonConfigs[buttonId]);
                        }
                    });

                    const menuConfig = generatedMenu;

                    htmlContent = htmlContent.replace(/\[\[MENU_CONFIG\]\]/g, JSON.stringify(menuConfig));
                    htmlContent = htmlContent.replace(/\[\[BUTTON_SIZE\]\]/g, buttonSize || '1.0');
                    htmlContent = htmlContent.replace(/\[\[COMPANION_HIDE_CLASS\]\]/g, companionHideClass || '');


                    // =============================================
                    // DETERMINE RENDER MODE (Scenarios)
                    // =============================================
                    let renderMode = 'standard';
                    const hasCapa = !!appState.assetsMap['capa'];
                    const hasAbertura = !!appState.assetsMap['vid_abertura'];

                    if (!hasCapa && !hasAbertura) {
                        // Scenario A: No Cover, No Intro -> Direct to Content (Music Hint)
                        renderMode = 'direct';
                        console.log('[Publish] Mode Detected: DIRECT (No Cover/Intro)');
                    } else if (!hasCapa && hasAbertura) {
                        // Scenario C: Intro as Cover (Paused)
                        renderMode = 'transparent-cover';
                        console.log('[Publish] Mode Detected: TRANSPARENT COVER (Intro as Cover)');
                    } else {
                        console.log('[Publish] Mode Detected: STANDARD');
                    }

                    htmlContent = htmlContent.replace(/\[\[RENDER_MODE\]\]/g, renderMode);

                    // Clean up unused tokens to be safe (optional, but good practice)
                    if (renderMode === 'direct') {
                        // Remove tokens to avoid broken URLs in DOM
                        htmlContent = htmlContent.replace(/\[\[CAPA_URL\]\]/g, '');
                        htmlContent = htmlContent.replace(/\[\[VIDEO_ABERTURA_URL\]\]/g, '');
                    }

                    filesMap['index.html'] = utf8_to_b64(htmlContent);

                    // DIAGNOSTICS
                    const isDebugEnabled = document.getElementById('debug-log-toggle')?.checked;
                    if (window.DebugLogger && isDebugEnabled) {
                        window.DebugLogger.generateReport(formData, menuConfig, htmlContent);
                    }

                    // 5. Build Payload & Send
                    window.updateDeployStep('step-build', 'done');
                    window.updateDeployStep('step-upload', 'loading');

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

                    window.updateDeployStep('step-upload', 'done');
                    window.updateDeployStep('step-live', 'loading');

                    publishBtn.innerHTML = '<i class="fa-solid fa-check"></i> Enviado!';
                    publishBtn.classList.remove('bg-brand-600');
                    publishBtn.classList.add('bg-blue-600');

                    const liveUrl = `https://convites.mforge.com.br/${slug}/`;

                    try {
                        const timestamps = JSON.parse(localStorage.getItem('autoBuilder_historyTimestamps') || '{}');
                        timestamps[slug] = Date.now();
                        localStorage.setItem('autoBuilder_historyTimestamps', JSON.stringify(timestamps));
                    } catch (e) {
                        console.warn('Failed to update history timestamp', e);
                    }

                    await pollDeployStatus(slug, liveUrl, result.sha);

                } catch (err) {
                    console.error('Publish Error:', err);
                    showDeployError(err.message);
                    window.updateDeployStep('step-upload', 'reset');

                    const publishStatusArea = document.getElementById('publish-status-area');
                    if (publishStatusArea) publishStatusArea.classList.add('hidden');

                } finally {
                    if (publishBtn.innerHTML.includes('Iniciando') || publishBtn.innerHTML.includes('Aguardando')) {
                        publishBtn.innerHTML = originalText;
                    }
                    publishBtn.disabled = false;
                }
            });
        }
    }

    async function initWindows() {
        console.log('[Windows] Initializing...');

        try {
            try {
                setupDropzones();
                console.log('[Windows] Dropzones setup complete.');
            } catch (err) {
                console.error('[Windows] Failed to setup dropzones:', err);
            }

            // Independent blocks wrapped to prevent cascading failures
            try { setupProcessButtons(); } catch (e) { console.warn('Process Buttons setup failed', e); }

            // Mode toggles
            try { setupModeToggle('manual', ['text', 'image']); } catch (e) { console.warn('Manual Mode setup failed', e); }
            try { setupModeToggle('gifts', ['link', 'image']); } catch (e) { console.warn('Gifts Mode setup failed', e); }
            try { setupModeToggle('fill', ['overlay', 'flat']); } catch (e) { console.warn('Fill Mode setup failed', e); }

            // Animation tabs
            try { setupAnimationTabs(); } catch (e) { console.warn('Animation Tabs setup failed', e); }

            // Auto-Prompt Listener
            try { setupAutoPromptListener(); } catch (e) { console.warn('AutoPrompt setup failed', e); }

            // Music player
            try { setupMusicPlayer(); } catch (e) { console.warn('Music Player setup failed', e); }

            // Toggle switches
            try { setupToggleSwitches(); } catch (e) { console.warn('Toggle Switches setup failed', e); }

            // Finalize buttons
            try { setupFinalizeButtons(); } catch (e) { console.warn('Finalize Buttons setup failed', e); }

            // AI generation buttons - CRITICAL: This sets up click handlers for all AI buttons including intro/loop
            try { setupAIButtons(); } catch (e) { console.warn('AI Buttons setup failed', e); }
            try { setupCoverGeneration(); } catch (e) { console.warn('Cover Gen setup failed', e); }
            try { setupLeafGeneration(); } catch (e) { console.warn('Leaf Gen setup failed', e); }

            // Manual editor
            try { setupManualEditor(); } catch (e) { console.warn('Manual Editor setup failed', e); }

            // Initialize default prompts for animation if fields are empty
            try { initializeDefaultPrompts(); } catch (e) { console.warn('Default Prompts setup failed', e); }

            console.log('✅ Windows controller initialized');
        } catch (fatalError) {
            console.error('[Windows] CRITICAL INITIALIZATION ERROR:', fatalError);
        }
    }

    /**
     * Initialize default prompts for animation fields if they are empty.
     * This ensures users always have a good starting point.
     */
    function initializeDefaultPrompts() {
        if (!window.AIPrompts) {
            console.warn('[Windows] AIPrompts not loaded, skipping default prompt initialization');
            return;
        }

        const introPromptEl = document.getElementById('intro-motion-prompt');
        const loopPromptEl = document.getElementById('loop-motion-prompt');

        // Only populate if the field is truly empty (not if user cleared it intentionally via persistence)
        // We check if the field is empty AND there's no persisted state for it
        if (introPromptEl && !introPromptEl.value.trim()) {
            const defaultIntroPrompt = window.AIPrompts.getOpeningVideoPrompt();
            introPromptEl.value = defaultIntroPrompt;
            console.log('[Windows] Initialized intro prompt with default');
        }

        if (loopPromptEl && !loopPromptEl.value.trim()) {
            const defaultLoopPrompt = window.AIPrompts.getLoopVideoPrompt();
            loopPromptEl.value = defaultLoopPrompt;
            console.log('[Windows] Initialized loop prompt with default');
        }
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

    console.log('[Windows] Init Complete.');
})();
