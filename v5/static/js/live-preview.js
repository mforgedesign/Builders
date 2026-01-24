/**
 * AutoBuilder v4.3 - Live Preview Generator
 * ==========================================
 * Generates real HTML preview using the same logic as build-system.js
 * but adapted for real-time preview without validation requirements.
 * 
 * This file generates preview HTML INDEPENDENTLY of build-system.js
 * to ensure the publish flow is never affected.
 * 
 * Created: 2026-01-24
 * Author: Antigravity
 */

(function () {
    'use strict';

    console.log('[LivePreview] v1.0 - Real-time iframe preview loaded');

    // ========================================
    // Configuration
    // ========================================

    const DEBOUNCE_DELAY = 500; // ms to wait after last change before rebuilding
    let debounceTimer = null;
    let templateCache = null;
    let isGenerating = false;

    // ========================================
    // Button Order Management
    // ========================================

    // Default button order
    const DEFAULT_BUTTON_ORDER = ['location', 'gifts', 'rsvp', 'manual'];
    let buttonOrder = [...DEFAULT_BUTTON_ORDER];

    // Load button order from localStorage
    function loadButtonOrder() {
        try {
            const saved = localStorage.getItem('previewButtonOrder');
            if (saved) {
                buttonOrder = JSON.parse(saved);
                console.log('[LivePreview] Loaded button order:', buttonOrder);
            }
        } catch (e) {
            console.warn('[LivePreview] Could not load button order');
        }
    }

    // Save button order to localStorage
    function saveButtonOrder(order) {
        buttonOrder = order;
        try {
            localStorage.setItem('previewButtonOrder', JSON.stringify(order));
        } catch (e) {
            console.warn('[LivePreview] Could not save button order');
        }
    }

    // ========================================
    // Template Loading
    // ========================================

    async function loadTemplate() {
        if (templateCache) return templateCache;

        try {
            const response = await fetch('final_template.html');
            if (!response.ok) throw new Error('Template not found');
            templateCache = await response.text();
            return templateCache;
        } catch (error) {
            console.error('[LivePreview] Failed to load template:', error);
            return getMinimalPreviewTemplate();
        }
    }

    function getMinimalPreviewTemplate() {
        return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; background: #0f172a; color: white; font-family: sans-serif; 
               display: flex; align-items: center; justify-content: center; height: 100vh; }
        .error { text-align: center; padding: 2rem; }
    </style>
</head>
<body>
    <div class="error">
        <h2>⚠️ Template não encontrado</h2>
        <p>Verifique se o arquivo final_template.html existe.</p>
    </div>
</body>
</html>`;
    }

    // ========================================
    // Asset Conversion (Blob → Data URL)
    // ========================================

    async function assetToDataURL(asset) {
        if (!asset) return null;

        // Already a data URL
        if (typeof asset === 'string' && asset.startsWith('data:')) {
            return asset;
        }

        // Already a URL (http/https/blob)
        if (typeof asset === 'string' && (asset.startsWith('http') || asset.startsWith('blob:'))) {
            return asset;
        }

        // Blob or File
        if (asset instanceof Blob) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(asset);
            });
        }

        // Object with url property
        if (asset && asset.url) {
            return asset.url;
        }

        return null;
    }

    // ========================================
    // Menu Config Generation (Mirrored from build-system.js)
    // ========================================

    function generateMenuConfig() {
        const state = window.builderState || {};
        const formData = state.formData || {};

        // DEBUG: Log what we're working with
        console.log('[LivePreview] generateMenuConfig - formData:', {
            link_google_maps: formData.link_google_maps,
            confirmacao: formData.confirmacao,
            link_presentes: formData.link_presentes,
            manual_html: formData.manual_html ? 'exists' : 'empty'
        });
        console.log('[LivePreview] generateMenuConfig - assets:', state.assets);

        const config = [];

        // Google Maps
        const mapsLink = formData.link_google_maps || formData.google_maps_link;
        if (mapsLink) {
            config.push({
                titulo: 'Como Chegar',
                icone: 'fa-solid fa-map-marker-alt',
                link: mapsLink,
                id: 'location'
            });
        }

        // Gifts (Link mode)
        const giftsLink = formData.link_presentes || formData.gifts_link;
        if (giftsLink) {
            config.push({
                titulo: 'Lista de Presentes',
                icone: 'fa-solid fa-gift',
                link: giftsLink,
                id: 'gifts'
            });
        }
        // Gifts (Image mode) - v4.3.0 fix: key is 'presentes' not 'gifts'
        else if (state.assets?.presentes || state.assets?.gifts) {
            config.push({
                titulo: 'Sugestões de Presentes',
                icone: 'fa-solid fa-gift',
                link: '#',
                id: 'gifts',
                isGiftImage: true
            });
        }

        // Manual (Text mode)
        if (formData.manual_html || formData.manual_text) {
            config.push({
                titulo: 'Manual do Convidado',
                icone: 'fa-solid fa-book-open',
                link: '#',
                id: 'manual',
                manualText: formData.manual_html || formData.manual_text
            });
        }
        // Manual (Image mode)
        else if (state.assets?.manual) {
            config.push({
                titulo: 'Manual do Convidado',
                icone: 'fa-solid fa-book-open',
                link: '#',
                id: 'manual',
                isManualImage: true
            });
        }

        // RSVP
        const confirmacao = (formData.confirmacao || formData.link_confirmacao || formData.numero_whatsapp || '').trim();
        if (confirmacao) {
            const isUrl = confirmacao.startsWith('http');
            if (isUrl) {
                config.push({
                    titulo: 'Confirmar Presença',
                    icone: 'fa-solid fa-check',
                    link: confirmacao,
                    id: 'rsvp'
                });
            } else {
                const cleanNum = confirmacao.replace(/\D/g, '');
                if (cleanNum) {
                    config.push({
                        titulo: 'Confirmar Presença',
                        icone: 'fa-brands fa-whatsapp',
                        link: `https://wa.me/${cleanNum}`,
                        id: 'rsvp'
                    });
                }
            }
        }

        // Extra Links
        if (state.extraLinks && state.extraLinks.length > 0) {
            state.extraLinks.forEach(extraLink => {
                config.push({
                    titulo: extraLink.button_name || extraLink.label,
                    icone: extraLink.icon_code || extraLink.icon || 'fa-solid fa-link',
                    link: extraLink.url,
                    id: `custom_${extraLink.order_index || config.length}`
                });
            });
        }

        // Sort by buttonOrder
        const sortedConfig = [];
        buttonOrder.forEach(id => {
            const btn = config.find(b => b.id === id);
            if (btn) sortedConfig.push(btn);
        });
        // Add any buttons not in buttonOrder
        config.forEach(btn => {
            if (!sortedConfig.find(b => b.id === btn.id)) {
                sortedConfig.push(btn);
            }
        });

        return sortedConfig;
    }

    // ========================================
    // Variable Substitution
    // ========================================

    async function substitutePreviewVariables(template) {
        const state = window.builderState || {};
        const formData = state.formData || {};
        const assets = state.assets || {};

        let html = template;

        // Helper function for truthy check
        const isTrue = (val) => val === true || val === 'true' || val === 'on' || val === 1;

        // Asset URLs (convert to data URLs for preview)
        // Keys match actual builderState.assets keys (Portuguese names)
        const capaUrl = await assetToDataURL(assets.capa) || await assetToDataURL(assets.cover) || 'blank.jpg';
        const folhaUrl = await assetToDataURL(assets.folha_preenchida) || await assetToDataURL(assets.sheet) || '';
        const fundoTelaUrl = await assetToDataURL(assets.fundo_tela) || await assetToDataURL(assets.loop) || folhaUrl || '';
        const musicaUrl = ''; // Disabled in preview to avoid autoplay
        const presentesUrl = await assetToDataURL(assets.presentes) || await assetToDataURL(assets.gifts) || '';
        const manualUrl = await assetToDataURL(assets.manual) || '';
        const aberturaUrl = await assetToDataURL(assets.vid_abertura) || await assetToDataURL(assets.opening) || '';

        console.log('[LivePreview] Assets:', {
            capa: !!assets.capa,
            fundo_tela: !!assets.fundo_tela,
            presentes: !!assets.presentes,
            vid_abertura: !!assets.vid_abertura
        });


        // OG Title
        const ogTitle = formData.event_name || formData.nome || 'Convite Digital';
        html = html.replace(/\[\[OG_TITLE\]\]/g, ogTitle);

        // Capa URL (for OpenGraph and initial screen)
        html = html.replace(/\[\[CAPA_URL\]\]/g, capaUrl);

        // Fundo Tela URL
        html = html.replace(/\[\[FUNDO_TELA_URL\]\]/g, fundoTelaUrl);

        // Video/Audio URLs
        html = html.replace(/\[\[VIDEO_ABERTURA_URL\]\]/g, aberturaUrl);
        html = html.replace(/\[\[MUSICA_URL\]\]/g, musicaUrl); // Empty to disable audio

        // Folha URL (for popups)
        html = html.replace(/\[\[FOLHA_URL\]\]/g, folhaUrl || capaUrl);

        // Presents/Manual URLs
        html = html.replace(/\[\[PRESENTS_URL\]\]/g, presentesUrl);
        html = html.replace(/\[\[MANUAL_URL\]\]/g, manualUrl);

        // Shadow styling
        const shadowColor = formData.sombra_gradiente || formData.shadow_gradient_color || '#000000';
        const shadowStyle = `background: linear-gradient(to top, ${shadowColor} 0%, transparent 100%);`;
        html = html.replace(/\[\[SHADOW_STYLE\]\]/g, shadowStyle);
        html = html.replace(/\[\[SHADOW_COLOR\]\]/g, shadowColor);

        // Buttons offset
        const buttonsOffset = formData.posicao_botoes || formData.button_position || '20';
        html = html.replace(/\[\[BUTTONS_OFFSET\]\]/g, buttonsOffset + 'px');

        // Button size
        const sizeMap = { 'pequeno': 0.8, 'medio': 1.0, 'grande': 1.2 };
        const buttonSize = sizeMap[formData.tamanho_botoes] || sizeMap[formData.button_size] || 1.0;
        html = html.replace(/\[\[BUTTON_SIZE\]\]/g, buttonSize);

        // Button color
        const buttonColor = formData.cor_botoes || formData.button_color || '#4f46e5';
        html = html.replace(/\[\[BUTTON_COLOR\]\]/g, buttonColor);
        html = html.replace(/\[\[BUTTON_FILL_ENABLED\]\]/g, 'true');

        // Timer
        const timerEnabled = isTrue(formData.timer_contagem) || isTrue(formData.countdown_timer);
        html = html.replace(/\[\[TIMER_HIDE_CLASS\]\]/g, timerEnabled ? '' : '!hidden');

        // Event datetime
        const eventDate = formData.event_date || formData.data || '';
        const eventTime = formData.event_time || formData.hora || '00:00';
        const eventDatetime = eventDate && eventTime ? `${eventDate}T${eventTime}:00` : '';
        html = html.replace(/\[\[EVENT_DATETIME\]\]/g, eventDatetime);

        // Companion
        const companionEnabled = isTrue(formData.permitir_acompanhante) || isTrue(formData.allow_companion);
        html = html.replace(/\[\[COMPANION_HIDE_CLASS\]\]/g, companionEnabled ? '' : '!hidden');

        // Watermark (always hidden in preview for cleaner view)
        html = html.replace(/\[\[WATERMARK_HIDE_CLASS\]\]/g, '!hidden');

        // Render Mode (standard for preview)
        html = html.replace(/\[\[RENDER_MODE\]\]/g, 'standard');

        // Menu Config
        const menuConfig = generateMenuConfig();
        html = html.replace(/\[\[MENU_CONFIG\]\]/g, JSON.stringify(menuConfig));

        // Remove autoplay from audio to prevent noise during editing
        html = html.replace(/preload="auto"/g, 'preload="none"');
        html = html.replace(/autoplay/g, '');

        return html;
    }

    // ========================================
    // Main Preview Generation
    // ========================================

    async function generatePreviewHTML() {
        if (isGenerating) {
            console.log('[LivePreview] Already generating, skipping...');
            return null;
        }

        isGenerating = true;

        try {
            console.log('[LivePreview] Generating preview...');
            const template = await loadTemplate();
            const html = await substitutePreviewVariables(template);
            console.log('[LivePreview] Preview generated successfully');
            return html;
        } catch (error) {
            console.error('[LivePreview] Error generating preview:', error);
            return null;
        } finally {
            isGenerating = false;
        }
    }

    async function updatePreview() {
        // Desktop iframe
        const iframe = document.getElementById('live-preview-iframe');
        // Mobile iframe
        const mobileIframe = document.getElementById('mobile-preview-iframe');

        if (!iframe && !mobileIframe) {
            console.warn('[LivePreview] No iframe found');
            return;
        }

        const html = await generatePreviewHTML();
        if (html) {
            if (iframe) iframe.srcdoc = html;
            if (mobileIframe) mobileIframe.srcdoc = html;
        }
    }

    function schedulePreviewUpdate() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(updatePreview, DEBOUNCE_DELAY);
    }

    // ========================================
    // Event Listeners
    // ========================================

    // v4.3.1: Track if changes pending (for glow effect)
    let hasPendingChanges = false;

    function markPendingChanges() {
        hasPendingChanges = true;
        const refreshBtn = document.getElementById('btn-refresh-preview');
        if (refreshBtn) {
            refreshBtn.classList.add('pending-changes');
        }
    }

    function clearPendingChanges() {
        hasPendingChanges = false;
        const refreshBtn = document.getElementById('btn-refresh-preview');
        if (refreshBtn) {
            refreshBtn.classList.remove('pending-changes');
        }
    }

    function init() {
        loadButtonOrder();

        // v4.3.1: Listen for changes but DON'T auto-update - just mark button as pending
        document.addEventListener('stateUpdated', markPendingChanges);
        document.addEventListener('mediaUpdated', markPendingChanges);
        document.addEventListener('linksExtrasUpdated', markPendingChanges);

        // Listen for button order changes (from external drag-drop UI)
        document.addEventListener('buttonOrderChanged', (e) => {
            if (e.detail && e.detail.order) {
                saveButtonOrder(e.detail.order);
                markPendingChanges();
            }
        });

        // Refresh button handler
        const refreshBtn = document.getElementById('btn-refresh-preview');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                console.log('[LivePreview] Manual refresh requested');

                // Disable button during update
                refreshBtn.disabled = true;
                refreshBtn.classList.add('updating');

                updatePreview().then(() => {
                    clearPendingChanges();
                    refreshBtn.disabled = false;
                    refreshBtn.classList.remove('updating');
                }).catch(() => {
                    refreshBtn.disabled = false;
                    refreshBtn.classList.remove('updating');
                });
            });
        }

        // Initial render after a short delay (wait for form to populate)
        setTimeout(updatePreview, 1000);

        console.log('[LivePreview] Initialized');
    }

    // ========================================
    // Public API
    // ========================================

    window.LivePreview = {
        update: updatePreview,
        scheduleUpdate: schedulePreviewUpdate,
        generateHTML: generatePreviewHTML,
        getButtonOrder: () => [...buttonOrder],
        setButtonOrder: (order) => {
            saveButtonOrder(order);
            schedulePreviewUpdate();
        },
        reorderButton: (fromIndex, toIndex) => {
            const newOrder = [...buttonOrder];
            const [moved] = newOrder.splice(fromIndex, 1);
            newOrder.splice(toIndex, 0, moved);
            saveButtonOrder(newOrder);
            schedulePreviewUpdate();
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
