/**
 * AutoBuilder v4.0 - Preview Controller
 * ======================================
 * Updates the device preview in real-time based on form state.
 * Buttons only appear when their respective links are configured.
 * V4.1: Added drag-and-drop reordering with SortableJS
 */

(function () {
    'use strict';
    console.log('[Preview] V4.1.0 - Draggable Buttons ' + new Date().toLocaleTimeString());

    // ========================================
    // Button Definitions (Unified)
    // ========================================

    // All possible buttons with their metadata
    const BUTTON_DEFINITIONS = {
        'location': { label: 'Local', icon: 'fa-solid fa-location-dot', stateKey: 'link_google_maps' },
        'rsvp': { label: 'Confirmar', icon: 'fa-brands fa-whatsapp', stateKey: 'numero_whatsapp' },
        'gifts': { label: 'Presentes', icon: 'fa-solid fa-gift', stateKey: 'link_presentes' },
        'manual': { label: 'Manual', icon: 'fa-solid fa-book-open', stateKey: 'manual' }
    };

    // Default button order (matches final_template.html order for consistency)
    const DEFAULT_BUTTON_ORDER = ['location', 'gifts', 'rsvp', 'manual'];

    // Current button order (will be modified by drag-and-drop)
    let buttonOrder = [...DEFAULT_BUTTON_ORDER];

    const DEFAULT_GRADIENT = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)';

    // Current state container
    let currentState = {
        cor_botoes: '#4f46e5',
        posicao_botoes: 20,
        timer_contagem: false,
        links_extras: [],
        link_google_maps: '',
        numero_whatsapp: '',
        link_presentes: '',
        link_confirmacao: '',
        manual_content: '',
        media_folha_animada: null,
        media_folha_preenchida: null,
        media_folha_vazia: null,
        media_presentes: null,
        media_manual: null,
        fundo_tela: null
    };

    // SortableJS instances
    let sortableInstances = [];

    // ========================================
    // Helpers
    // ========================================

    function showPreviewModal(title, contentHTML) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in';
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto relative p-6">
                <button class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition" onclick="this.closest('.fixed').remove()">
                    <i class="fa-solid fa-xmark text-xl"></i>
                </button>
                <h3 class="text-lg font-bold text-gray-800 mb-4 border-b pb-2">${title}</h3>
                <div class="space-y-4">
                    ${contentHTML}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    function handleButtonClick(btn) {
        console.log('[Preview] Button clicked:', btn);

        // 1. Google Maps
        if (btn.id === 'location' && currentState.link_google_maps) {
            window.open(currentState.link_google_maps, '_blank');
            return;
        }

        // 2. RSVP (Confirmar) - Priority: Link Confirmacao > WhatsApp
        if (btn.id === 'rsvp') {
            if (currentState.link_confirmacao) {
                window.open(currentState.link_confirmacao, '_blank');
            } else if (currentState.numero_whatsapp) {
                const num = currentState.numero_whatsapp.replace(/\D/g, '');
                window.open(`https://wa.me/${num}`, '_blank');
            }
            return;
        }

        // 3. Presentes - Priority: Link > Image
        if (btn.id === 'gifts') {
            if (currentState.link_presentes) {
                window.open(currentState.link_presentes, '_blank');
            } else {
                // Try to get image URL from various possible state keys
                const imgUrl = currentState.presentes || (currentState.media_presentes ? currentState.media_presentes.url : null);
                if (imgUrl) {
                    showPreviewModal('Lista de Presentes', `<img src="${imgUrl}" class="max-w-full rounded mx-auto shadow-md">`);
                }
            }
            return;
        }

        // 4. Manual - Priority: Text > Image
        if (btn.id === 'manual') {
            if (currentState.manual_content && currentState.manual_content.trim().length > 0) {
                showPreviewModal('Manual', `<div class="text-left prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap">${currentState.manual_content}</div>`);
            } else {
                // Try to get image URL from various possible state keys (manual OR media_manual)
                const imgUrl = (typeof currentState.manual === 'string' ? currentState.manual : null) ||
                    (currentState.media_manual ? currentState.media_manual.url : null);
                if (imgUrl) {
                    showPreviewModal('Manual', `<img src="${imgUrl}" class="max-w-full rounded mx-auto shadow-md">`);
                }
            }
            return;
        }

        // 5. Extra Links
        if (btn.type === 'extra' && btn.url) {
            window.open(btn.url, '_blank');
        }
    }

    function createButtonElement(btn, color) {
        const wrapper = document.createElement('div');
        wrapper.className = 'flex flex-col items-center gap-1 cursor-pointer preview-btn group';
        wrapper.setAttribute('data-button-id', btn.id);

        const circle = document.createElement('div');
        circle.className = 'w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 group-hover:scale-105';
        circle.style.backgroundColor = color;

        const icon = document.createElement('i');
        icon.className = btn.icon || 'fa-solid fa-link';
        circle.appendChild(icon);

        const label = document.createElement('span');
        label.className = 'text-[9px] uppercase font-bold text-white drop-shadow-md tracking-wider';
        label.textContent = btn.label || 'Link';

        wrapper.appendChild(circle);
        wrapper.appendChild(label);

        wrapper.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleButtonClick(btn);
        });

        return wrapper;
    }

    // ========================================
    // Button Visibility Logic
    // ========================================

    function isButtonVisible(buttonId) {
        switch (buttonId) {
            case 'location':
                return !!currentState.link_google_maps;
            case 'rsvp':
                return !!currentState.numero_whatsapp || !!currentState.link_confirmacao;
            case 'gifts':
                // Logic: Visible if Link exists OR Image exists
                // Image check: Check 'presentes' (direct URL from state) OR 'media_presentes' (event object)
                const hasLink = !!currentState.link_presentes;
                const hasMedia = !!currentState.presentes || (currentState.media_presentes && !!currentState.media_presentes.url);
                return hasLink || hasMedia;
            case 'manual':
                // Logic: Visible if Text exists OR Image exists
                const hasText = currentState.manual_content && currentState.manual_content.length > 0;
                const hasManualMedia = (currentState.manual && typeof currentState.manual === 'string') ||
                    (currentState.media_manual && !!currentState.media_manual.url);
                return hasText || hasManualMedia;
            default:
                // Extra links are always visible if they exist
                return true;
        }
    }

    function getButtonConfig(buttonId) {
        if (BUTTON_DEFINITIONS[buttonId]) {
            return { id: buttonId, ...BUTTON_DEFINITIONS[buttonId], type: 'native' };
        }
        // Extra link handling
        const extraLink = (currentState.links_extras || []).find(l => `extra-${l.id}` === buttonId || l.id === buttonId);
        if (extraLink) {
            return {
                id: buttonId,
                label: extraLink.label,
                icon: extraLink.icon || 'fa-solid fa-link',
                type: 'extra',
                url: extraLink.url
            };
        }
        return null;
    }

    // ========================================
    // Render Functions
    // ========================================

    function renderButtons() {
        const containers = [
            document.querySelector('#preview-buttons > div'),
            document.querySelector('#mobile-preview-buttons > div')
        ].filter(el => !!el);

        if (containers.length === 0) return;

        const color = currentState.cor_botoes || '#4f46e5';

        // Build ordered list of visible buttons
        const visibleButtons = [];

        // 1. Add native buttons in order
        buttonOrder.forEach(buttonId => {
            if (BUTTON_DEFINITIONS[buttonId] && isButtonVisible(buttonId)) {
                visibleButtons.push(getButtonConfig(buttonId));
            }
        });

        // 2. Add extra links (at the end, but they can also be reordered)
        const extraLinksInOrder = buttonOrder.filter(id => id.startsWith('extra-'));
        extraLinksInOrder.forEach(extraId => {
            const config = getButtonConfig(extraId);
            if (config) visibleButtons.push(config);
        });

        // 3. Add any new extra links not yet in buttonOrder
        (currentState.links_extras || []).forEach(link => {
            const extraId = `extra-${link.id || Math.random().toString(36).substr(2, 9)}`;
            if (link.label && !buttonOrder.includes(extraId)) {
                buttonOrder.push(extraId);
                visibleButtons.push({
                    id: extraId,
                    label: link.label,
                    icon: link.icon || 'fa-solid fa-link',
                    type: 'extra',
                    url: link.url
                });
            }
        });

        // Render to each container
        containers.forEach((container, index) => {
            container.innerHTML = ''; // Reset

            visibleButtons.forEach(btn => {
                container.appendChild(createButtonElement(btn, color));
            });

            // Initialize SortableJS (only on desktop preview, index 0)
            if (index === 0 && typeof Sortable !== 'undefined') {
                // Destroy previous instance if exists
                if (sortableInstances[index]) {
                    sortableInstances[index].destroy();
                }

                sortableInstances[index] = new Sortable(container, {
                    animation: 150,
                    ghostClass: 'opacity-50',
                    chosenClass: 'scale-110',
                    dragClass: 'cursor-grabbing',
                    onEnd: function (evt) {
                        // Extract new order from data-button-id
                        const newOrder = Array.from(container.children).map(el => el.getAttribute('data-button-id'));

                        // Update global order
                        buttonOrder = newOrder;

                        // Update mobile view to match
                        renderButtons();

                        // Dispatch event for persistence
                        document.dispatchEvent(new CustomEvent('buttonOrderChanged', {
                            detail: { order: buttonOrder }
                        }));

                        console.log('[Preview] Button order changed:', buttonOrder);

                        // Save to localStorage immediately
                        saveButtonOrder();
                    }
                });
            }
        });

        // Toggle container visibility
        const hasButtons = visibleButtons.length > 0;
        ['preview-buttons', 'mobile-preview-buttons'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = hasButtons ? 'flex' : 'none';
        });
    }

    function updateBackground() {
        const contents = [
            document.getElementById('preview-content'),
            document.getElementById('mobile-preview-content')
        ].filter(el => !!el);

        contents.forEach(content => {
            // Remove video if exists
            const vid = content.querySelector('video.preview-bg-video');
            if (vid) vid.remove();

            // Priority 1: Fundo Tela (Unified Background - Image or Video)
            if (currentState.fundo_tela && currentState.fundo_tela.url) {
                const url = currentState.fundo_tela.url;
                // Robust Video Detection: Check 'blob.type' first, then URL extension
                const isVideo = (currentState.fundo_tela.blob && currentState.fundo_tela.blob.type && currentState.fundo_tela.blob.type.startsWith('video')) ||
                    /\.(mp4|webm|mov)$/i.test(url) ||
                    (currentState.fundo_tela.type && currentState.fundo_tela.type.startsWith('video'));

                if (isVideo) {
                    const video = document.createElement('video');
                    video.className = 'preview-bg-video absolute inset-0 w-full h-full object-cover z-0';
                    video.src = url;
                    video.autoplay = true;
                    video.loop = true;
                    video.muted = true;
                    video.playsInline = true;
                    content.insertBefore(video, content.firstChild);
                    content.style.backgroundImage = 'none';
                } else {
                    content.style.backgroundImage = `url('${url}')`;
                }
                return;
            }

            // Priority 2: Video (Legacy - media_folha_animada)
            if (currentState.media_folha_animada && currentState.media_folha_animada.url) {
                const video = document.createElement('video');
                video.className = 'preview-bg-video absolute inset-0 w-full h-full object-cover z-0';
                video.src = currentState.media_folha_animada.url;
                video.autoplay = true;
                video.loop = true;
                video.muted = true;
                video.playsInline = true;
                content.insertBefore(video, content.firstChild);
                content.style.backgroundImage = 'none';
                return;
            }

            // Priority 3: Folha Preenchida (Legacy)
            if (currentState.media_folha_preenchida && currentState.media_folha_preenchida.url) {
                content.style.backgroundImage = `url('${currentState.media_folha_preenchida.url}')`;
                return;
            }

            // Priority 4: Folha Vazia (Legacy)
            if (currentState.media_folha_vazia && currentState.media_folha_vazia.url) {
                content.style.backgroundImage = `url('${currentState.media_folha_vazia.url}')`;
                return;
            }

            // Priority 5: Default Gradient
            content.style.backgroundImage = DEFAULT_GRADIENT;
        });
    }

    function updateTimerVisibility(visible) {
        ['preview-timer', 'mobile-preview-timer'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = (visible === true || visible === 'true') ? 'flex' : 'none';
        });
    }

    function updateButtonColors(color) {
        const circles = document.querySelectorAll('.preview-btn > div:first-child');
        circles.forEach(c => c.style.backgroundColor = color);
        currentState.cor_botoes = color;
    }

    function updateShadow(color) {
        currentState.sombra_gradiente = color;
        const grad = `linear-gradient(to top, ${color}, transparent)`;

        ['preview-shadow', 'mobile-preview-shadow'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.background = grad;
        });

        // Mobile fallback if no ID
        const mobileContent = document.getElementById('mobile-preview-content');
        if (mobileContent) {
            const pointerDiv = mobileContent.querySelector('.pointer-events-none');
            if (pointerDiv) pointerDiv.style.background = grad;
        }
    }

    function updateButtonPosition(val) {
        ['preview-buttons', 'mobile-preview-buttons'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.bottom = val + 'px';
        });
        currentState.posicao_botoes = val;
    }

    // ========================================
    // Persistence
    // ========================================

    function saveButtonOrder() {
        try {
            localStorage.setItem('autoBuilder_buttonOrder', JSON.stringify(buttonOrder));
        } catch (e) {
            console.warn('[Preview] Failed to save button order:', e);
        }
    }

    function loadButtonOrder() {
        try {
            const saved = localStorage.getItem('autoBuilder_buttonOrder');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    buttonOrder = parsed;
                    console.log('[Preview] Loaded button order:', buttonOrder);
                }
            }
        } catch (e) {
            console.warn('[Preview] Failed to load button order:', e);
        }
    }

    // ========================================
    // Events
    // ========================================

    function setupEventListeners() {
        document.addEventListener('stateUpdated', (e) => {
            if ((e.detail.source === 'persistence' || e.detail.source === 'restore') && e.detail.data && e.detail.data.formData) {
                console.log('[Preview] Bulk Update from', e.detail.source);
                Object.assign(currentState, e.detail.data.formData);
                updateBackground();
                renderButtons();
                updateTimerVisibility(currentState.timer_contagem);
                updateShadow(currentState.sombra_gradiente);
                updateButtonColors(currentState.cor_botoes);
                updateButtonPosition(currentState.posicao_botoes);
                return;
            }

            const { field, value } = e.detail;
            currentState[field] = value;

            if (field === 'cor_botoes') updateButtonColors(value);
            else if (field === 'sombra_gradiente') updateShadow(value);
            else if (field === 'posicao_botoes') updateButtonPosition(value);
            else if (field === 'timer_contagem') updateTimerVisibility(value);
            else renderButtons(); // Re-render for any other field change that might affect buttons
        });

        document.addEventListener('linksExtrasUpdated', (e) => {
            currentState.links_extras = e.detail.links || [];
            renderButtons();
        });

        document.addEventListener('mediaUpdated', (e) => {
            const { type, data } = e.detail;
            console.log('[Preview] mediaUpdated:', type, data);

            // Unified Background (Priority)
            if (type === 'fundo_tela') currentState.fundo_tela = data;
            // Legacy fields
            else if (type === 'folha_animada') currentState.media_folha_animada = data;
            else if (type === 'folha_preenchida') currentState.media_folha_preenchida = data;
            else if (type === 'folha_vazia') currentState.media_folha_vazia = data;
            // CRITICAL SYNC: Ensure 'presentes' triggers button visibility
            else if (type === 'presentes') {
                currentState.media_presentes = data;
                currentState.presentes = data.url;
            }
            else if (type === 'manual') {
                currentState.media_manual = data;
                currentState.manual = data.url;
            }

            updateBackground();
            renderButtons();
        });

        // Listen for reset
        document.addEventListener('builderReset', () => {
            buttonOrder = [...DEFAULT_BUTTON_ORDER];
            saveButtonOrder();
            renderButtons();
        });
    }

    // ========================================
    // Init
    // ========================================

    function init() {
        loadButtonOrder();
        setupEventListeners();
        updateBackground(); // Defaults
        renderButtons();

        // Fetch initial state
        fetch('/api/state')
            .then(res => res.json())
            .then(data => {
                if (data.data) {
                    Object.assign(currentState, data.data);
                    // Conversion for boolean/numbers if needed
                    if (typeof currentState.timer_contagem === 'string') {
                        currentState.timer_contagem = currentState.timer_contagem === 'true';
                    }

                    updateBackground();
                    renderButtons();
                    updateTimerVisibility(currentState.timer_contagem);
                    updateShadow(currentState.sombra_gradiente || '#000000');
                    updateButtonColors(currentState.cor_botoes || '#4f46e5');
                    updateButtonPosition(currentState.posicao_botoes || 20);
                }
            })
            .catch(() => console.log('[Preview] State fetch failed/skipped'));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ========================================
    // Public API
    // ========================================

    window.AutoBuilderPreview = {
        renderButtons,
        updateBackground,
        updateTimerVisibility,
        getButtonOrder: () => [...buttonOrder],
        setButtonOrder: (order) => {
            if (Array.isArray(order)) {
                buttonOrder = order;
                saveButtonOrder();
                renderButtons();
            }
        },
        resetButtonOrder: () => {
            buttonOrder = [...DEFAULT_BUTTON_ORDER];
            saveButtonOrder();
            renderButtons();
        }
    };

})();
