/**
 * AutoBuilder v4.0 - Preview Controller
 * ======================================
 * Updates the device preview in real-time based on form state.
 * Buttons only appear when their respective links are configured.
 */

(function () {
    'use strict';
    console.log('[Preview] V4.0.4 - Force Reload ' + new Date().toLocaleTimeString());

    // ========================================
    // Native Button Definitions
    // ========================================
    const NATIVE_BUTTON_MAP = {
        link_google_maps: { id: 'local', label: 'Local', icon: 'fa-solid fa-location-dot' },
        numero_whatsapp: { id: 'confirmar', label: 'Confirmar', icon: 'fa-brands fa-whatsapp' },
        link_presentes: { id: 'presentes', label: 'Presentes', icon: 'fa-solid fa-gift' },
        manual: { id: 'manual', label: 'Manual', icon: 'fa-solid fa-book-open' }
    };

    const DEFAULT_GRADIENT = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)';

    // Current state container
    let currentState = {
        cor_botoes: '#4f46e5',
        posicao_botoes: 50,
        timer_contagem: false,
        links_extras: [],
        link_google_maps: '',
        numero_whatsapp: '',
        link_presentes: '',
        manual_content: '',
        link_confirmacao: '', // Added for RSVP logic
        media_folha_animada: null,
        media_folha_preenchida: null,
        media_folha_vazia: null,
        media_presentes: null,
        media_manual: null
    };

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
        if (btn.id === 'local' && currentState.link_google_maps) {
            window.open(currentState.link_google_maps, '_blank');
            return;
        }

        // 2. RSVP (Confirmar) - Priority: Link Confirmacao > WhatsApp
        if (btn.id === 'confirmar') {
            if (currentState.link_confirmacao) {
                window.open(currentState.link_confirmacao, '_blank');
            } else if (currentState.numero_whatsapp) {
                const num = currentState.numero_whatsapp.replace(/\D/g, '');
                window.open(`https://wa.me/${num}`, '_blank');
            }
            return;
        }

        // 3. Presentes - Priority: Link > Image
        if (btn.id === 'presentes') {
            if (currentState.link_presentes) {
                window.open(currentState.link_presentes, '_blank');
            } else if (currentState.media_presentes && currentState.media_presentes.url) {
                showPreviewModal('Lista de Presentes', `<img src="${currentState.media_presentes.url}" class="max-w-full rounded mx-auto shadow-md">`);
            }
            return;
        }

        // 4. Manual - Priority: Text > Image
        if (btn.id === 'manual') {
            if (currentState.manual_content && currentState.manual_content.trim().length > 0) {
                showPreviewModal('Manual dos Padrinhos', `<div class="text-left prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap">${currentState.manual_content}</div>`);
            } else if (currentState.media_manual && currentState.media_manual.url) {
                showPreviewModal('Manual dos Padrinhos', `<img src="${currentState.media_manual.url}" class="max-w-full rounded mx-auto shadow-md">`);
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
    // Render Functions
    // ========================================

    function renderButtons() {
        const containers = [
            document.querySelector('#preview-buttons > div'),
            document.querySelector('#mobile-preview-buttons > div')
        ].filter(el => !!el);

        if (containers.length === 0) return;

        const color = currentState.cor_botoes || '#4f46e5';

        // Check visibility
        const shouldShow = (key) => {
            if (key === 'link_google_maps') return !!currentState.link_google_maps;
            if (key === 'numero_whatsapp') return !!currentState.numero_whatsapp || !!currentState.link_confirmacao;
            if (key === 'link_presentes') return !!currentState.link_presentes || (currentState.media_presentes && currentState.media_presentes.url);
            if (key === 'manual') return (currentState.media_manual && currentState.media_manual.url) || (currentState.manual_content && currentState.manual_content.length > 0);
            return false;
        };

        containers.forEach(container => {
            container.innerHTML = ''; // Reset

            // Native Buttons
            for (const [key, config] of Object.entries(NATIVE_BUTTON_MAP)) {
                if (shouldShow(key)) {
                    container.appendChild(createButtonElement({ ...config, type: 'native' }, color));
                }
            }

            // Extra Links
            (currentState.links_extras || []).forEach(link => {
                if (link.label) {
                    container.appendChild(createButtonElement({
                        id: 'extra-' + (link.id || Math.random()),
                        label: link.label,
                        icon: link.icon || 'fa-solid fa-link',
                        type: 'extra',
                        url: link.url
                    }, color));
                }
            });
        });

        // Toggle container visibility
        const hasButtons = Object.keys(NATIVE_BUTTON_MAP).some(shouldShow) || (currentState.links_extras && currentState.links_extras.length > 0);
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

            // Priority 1: Video
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

            // Priority 2: Folha Preenchida
            if (currentState.media_folha_preenchida && currentState.media_folha_preenchida.url) {
                content.style.backgroundImage = `url('${currentState.media_folha_preenchida.url}')`;
                return;
            }

            // Priority 3: Folha Vazia
            if (currentState.media_folha_vazia && currentState.media_folha_vazia.url) {
                content.style.backgroundImage = `url('${currentState.media_folha_vazia.url}')`;
                return;
            }

            // Priority 4: Default
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
    // Events
    // ========================================

    function setupEventListeners() {
        document.addEventListener('stateUpdated', (e) => {
            if (e.detail.source === 'persistence' && e.detail.data && e.detail.data.formData) {
                console.log('[Preview] Bulk Update');
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
            if (type === 'folha_animada') currentState.media_folha_animada = data;
            else if (type === 'folha_preenchida') currentState.media_folha_preenchida = data;
            else if (type === 'folha_vazia') currentState.media_folha_vazia = data;
            else if (type === 'presentes') currentState.media_presentes = data;
            else if (type === 'manual') currentState.media_manual = data;

            updateBackground();
            renderButtons();
        });
    }

    // ========================================
    // Init
    // ========================================

    function init() {
        setupEventListeners();
        updateBackground(); // Defaults
        renderButtons();

        // Fetch initial state
        fetch('/api/state')
            .then(res => res.json())
            .then(data => {
                if (data.data) {
                    Object.assign(currentState, data.data);
                    // Conversion for boolean/numbers if needed?
                    // Usually persistence handles it, but let's be safe
                    if (typeof currentState.timer_contagem === 'string') {
                        currentState.timer_contagem = currentState.timer_contagem === 'true';
                    }

                    updateBackground();
                    renderButtons();
                    updateTimerVisibility(currentState.timer_contagem);
                    updateShadow(currentState.sombra_gradiente || '#000000');
                    updateButtonColors(currentState.cor_botoes || '#4f46e5');
                    updateButtonPosition(currentState.posicao_botoes || 50);
                }
            })
            .catch(() => console.log('[Preview] State fetch failed/skipped'));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose
    window.AutoBuilderPreview = { renderButtons, updateBackground, updateTimerVisibility };

})();
