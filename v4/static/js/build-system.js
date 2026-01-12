/**
 * AutoBuilder v4 - Build System (CORRECTED VERSION)
 * Complete implementation for generating publishable invitations
 * ✅ All template variables aligned with final_template.html
 * ✅ MenuConfig structure matches template expectations
 */

(function () {
    'use strict';

    // Load JSZip from CDN
    if (!window.JSZip) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        document.head.appendChild(script);
    }

    /**
     * Main build function - generates complete invitation package
     */
    async function executeBuild() {
        console.log('[Build] Starting build process...');

        // 1. Validate required assets
        const validation = validateAssets();
        if (!validation.valid) {
            alert(`❌ Build failed: ${validation.error}`);
            return null;
        }

        // 2. Generate cache-bust ID
        const cacheBustId = `_v${Date.now()}`;

        // 3. Load template
        const template = await loadTemplate();

        // 4. Collect and rename assets
        const assets = await collectAssets(cacheBustId);

        // 5. Generate data.json
        const dataJSON = generateDataJSON();

        // 6. Generate menuConfig (✅ CORRECTED: now returns array, not object)
        const menuConfig = generateMenuConfig();

        // 7. Substitute variables in template
        const finalHTML = substituteVariables(template, assets, menuConfig, cacheBustId);

        // 8. Create VFS (Virtual File System)
        const vfs = {
            'index.html': finalHTML,
            'data.json': JSON.stringify(dataJSON, null, 2),
            ...assets
        };

        console.log('[Build] Build complete:', Object.keys(vfs).length, 'files');
        return vfs;
    }

    /**
     * Validate that all required assets are present
     */
    function validateAssets() {
        const state = window.builderState || {};
        const formData = state.formData || {};

        // Minimum requirements
        if (!formData.event_name && !formData.nome) {
            return { valid: false, error: 'Nome do evento é obrigatório' };
        }

        if (!state.assets || !state.assets.cover) {
            return { valid: false, error: 'Capa é obrigatória' };
        }

        // New Logic: Loop OR Filled Sheet is required
        // If neither exists, we have no background.
        if ((!state.assets.loop) && (!state.assets.folha_preenchida)) {
            return { valid: false, error: 'É necessário um Vídeo de Background (Loop) OU uma Folha Preenchida.' };
        }

        return { valid: true };
    }

    /**
     * Load the final template HTML
     */
    async function loadTemplate() {
        try {
            const response = await fetch('final_template.html');
            if (!response.ok) {
                return getMinimalTemplate();
            }
            return await response.text();
        } catch (error) {
            console.warn('[Build] Could not load template, using minimal version');
            return getMinimalTemplate();
        }
    }

    /**
     * Collect all assets and rename them with cache-bust IDs
     */
    async function collectAssets(cacheBustId) {
        const state = window.builderState || {};
        const assets = {};

        // Asset mapping: state key → folder/filename
        const assetMap = {
            cover: 'capa/capa',
            sheet: 'folha/folha',
            folha_preenchida: 'folha/folha_preenchida',
            opening: 'abertura/abertura',
            loop: 'loop/loop',
            music: 'musica/musica',
            manual: 'manual/manual',
            gifts: 'presentes/presentes'
        };

        for (const [key, basePath] of Object.entries(assetMap)) {
            const asset = state.assets?.[key];
            if (!asset) continue;

            // Determine file extension
            const ext = getFileExtension(asset);
            const filename = `${basePath}${cacheBustId}.${ext}`;

            // Convert to blob if needed
            const blob = await assetToBlob(asset);
            if (blob) {
                assets[filename] = blob;
            }
        }

        return assets;
    }

    /**
     * Get file extension from various asset formats
     */
    function getFileExtension(asset) {
        if (typeof asset === 'string') {
            // URL or data URI
            if (asset.startsWith('data:image/png')) return 'png';
            if (asset.startsWith('data:image/jpeg') || asset.startsWith('data:image/jpg')) return 'jpg';
            if (asset.startsWith('data:image/webp')) return 'webp';
            if (asset.startsWith('data:video/mp4')) return 'mp4';
            if (asset.startsWith('data:audio/mpeg')) return 'mp3';

            // Extract from URL
            const match = asset.match(/\.([a-z0-9]+)(?:[?#]|$)/i);
            return match ? match[1] : 'jpg';
        } else if (asset instanceof File || asset instanceof Blob) {
            const type = asset.type;
            if (type.includes('png')) return 'png';
            if (type.includes('jpeg') || type.includes('jpg')) return 'jpg';
            if (type.includes('webp')) return 'webp';
            if (type.includes('mp4')) return 'mp4';
            if (type.includes('mp3') || type.includes('mpeg')) return 'mp3';
        }

        return 'jpg'; // Default
    }

    /**
     * Convert asset to Blob
     */
    async function assetToBlob(asset) {
        if (asset instanceof Blob) {
            return asset;
        }

        if (typeof asset === 'string') {
            if (asset.startsWith('data:')) {
                // Data URI
                const response = await fetch(asset);
                return await response.blob();
            } else {
                // URL
                try {
                    const response = await fetch(asset);
                    return await response.blob();
                } catch (e) {
                    console.warn('[Build] Could not fetch asset:', asset);
                    return null;
                }
            }
        }

        return null;
    }

    /**
     * Generate data.json with complete state
     */
    function generateDataJSON() {
        const state = window.builderState || {};
        return {
            ...state.formData,
            buildDate: new Date().toISOString(),
            version: '4.0'
        };
    }

    /**
     * ✅ CORRECTED: Generate menuConfig as ARRAY (not object)
     * Template expects: menuConfig = [{titulo, icone, link, id, ...}, ...]
     */
    function generateMenuConfig() {
        const state = window.builderState || {};
        const formData = state.formData || {};

        const config = []; // ✅ Array, not {buttons: []}

        // Google Maps
        const mapsLink = formData.link_google_maps || formData.google_maps_link;
        if (mapsLink) {
            config.push({
                titulo: 'Como Chegar',  // ✅ Changed from "name"
                icone: 'fa-solid fa-map-marker-alt',  // ✅ Changed from "icon"
                link: mapsLink,  // ✅ Changed from "url"
                id: 'maps'
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
        // Gifts (Image mode)
        else if (state.assets?.gifts) {
            config.push({
                titulo: 'Sugestões de Presentes',
                icone: 'fa-solid fa-gift',
                link: '#',
                id: 'gifts',
                isGiftImage: true  // ✅ Template checks this
            });
        }

        // Manual (Text mode)
        if (formData.manual_html || formData.manual_text) {
            config.push({
                titulo: 'Manual do Convidado',
                icone: 'fa-solid fa-book-open',
                link: '#',
                id: 'manual',
                manualText: formData.manual_html || formData.manual_text  // ✅ Template uses this
            });
        }
        // Manual (Image mode)
        else if (state.assets?.manual) {
            config.push({
                titulo: 'Manual do Convidado',
                icone: 'fa-solid fa-book-open',
                link: '#',
                id: 'manual',
                isManualImage: true  // ✅ Template checks this
            });
        }

        // RSVP (WhatsApp)
        const whatsappNumber = formData.numero_whatsapp || formData.whatsapp_number;
        if (whatsappNumber) {
            // ✅ Clean number and format WhatsApp URL
            const cleanNumber = whatsappNumber.replace(/\D/g, '');
            config.push({
                titulo: 'Confirmar Presença',
                icone: 'fa-solid fa-check',
                link: `https://wa.me/${cleanNumber}`,  // ✅ Proper WhatsApp link
                id: 'rsvp'
            });
        }
        // RSVP (External link)
        else if (formData.link_confirmacao || formData.confirmation_link) {
            config.push({
                titulo: 'Confirmar Presença',
                icone: 'fa-solid fa-check',
                link: formData.link_confirmacao || formData.confirmation_link,
                id: 'rsvp'
            });
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

        return config;  // ✅ Returns array directly
    }

    /**
     * ✅ CORRECTED: Substitute all [[VARIABLES]] with proper field mappings
     */
    function substituteVariables(template, assets, menuConfig, cacheBustId) {
        const state = window.builderState || {};
        const formData = state.formData || {};

        let html = template;

        // Asset paths mapping
        const assetPaths = {};
        for (const [path, blob] of Object.entries(assets)) {
            const key = path.split('/')[0];
            assetPaths[key] = path;
        }

        // ✅ 1. OG_TITLE (for OpenGraph meta tag)
        const ogTitle = formData.event_name || formData.nome || 'Convite Digital';
        html = html.replace(/\[\[OG_TITLE\]\]/g, ogTitle);

        // ✅ 2. CAPA_FILENAME (basename only, NOT full path)
        const capaBasename = assetPaths.capa?.split('/').pop() || 'capa.jpg';
        html = html.replace(/\[\[CAPA_FILENAME\]\]/g, capaBasename);

        // ✅ 2.1. FILLED_SHEET_FILENAME (for static overlay)
        // Note: template uses src="folha/folha_preenchida.png" as base. 
        // We need to replace that WHOLE string if we want to be safe, 
        // OR simply replace the filename if we use a token. 
        // The template currently has hardcoded src="folha/folha_preenchida.png".
        // Strategy: We will replace "folha/folha_preenchida.png" with the actual path.
        if (assetPaths.folha_preenchida) { // key matches 'sheetFilled' -> 'folha/folha_preenchida...'
            // Wait, collectAssets key uses the folder name as key in assetPaths logic below:
            // const key = path.split('/')[0]; -> 'folha'
            // This is ambiguous because 'sheet' and 'sheetFilled' both go to 'folha/' folder.

            // Let's look at assetPaths logic again.
            // It iterates assets. keys are 'folha/folha_v123.jpg'
            // assetPaths['folha'] will be overwritten if multiple files exist in same folder!
            // FIXED LOGIC below.
        }

        // RE-IMPLEMENTING ASSET PATH FINDING for robust replacement
        const findAssetPath = (folder, partialName) => {
            return Object.keys(assets).find(p => p.startsWith(folder + '/') && p.includes(partialName));
        };

        const sheetFilledPath = findAssetPath('folha', 'folha_preenchida');
        if (sheetFilledPath) {
            html = html.replace('folha/folha_preenchida.png', sheetFilledPath);
        } else {
            // Keep default or handle? Onerror handles it.
        }

        const loopPath = findAssetPath('loop', 'loop');
        if (loopPath) {
            html = html.replace('loop/loop.mp4', loopPath);
        }

        // OPENING VIDEO
        const openingPath = findAssetPath('abertura', 'abertura');
        if (openingPath) {
            html = html.replace('abertura/abertura.mp4', openingPath);
        }

        // ✅ 3. SHADOW_COLOR (sombra_gradiente)
        html = html.replace(/\[\[SHADOW_COLOR\]\]/g,
            formData.sombra_gradiente || formData.shadow_gradient_color || '#000000');

        // ✅ 4. BUTTONS_OFFSET (position from bottom)
        html = html.replace(/\[\[BUTTONS_OFFSET\]\]/g,
            formData.posicao_botoes || formData.button_position || '50');

        // ✅ 5. BUTTON_SIZE (convert string to float)
        const sizeMap = { 'pequeno': 0.8, 'medio': 1.0, 'grande': 1.2 };
        const buttonSize = sizeMap[formData.tamanho_botoes] || sizeMap[formData.button_size] || 1.0;
        html = html.replace(/\[\[BUTTON_SIZE\]\]/g, buttonSize);

        // ✅ 6. TIMER_HIDE_CLASS (show if enabled, hide if disabled)
        const timerEnabled = formData.timer_contagem || formData.countdown_timer;
        const timerClass = timerEnabled ? '' : 'hidden';
        html = html.replace(/\[\[TIMER_HIDE_CLASS\]\]/g, timerClass);

        // ✅ 7. COMPANION_HIDE_CLASS (FIXED LOGIC: show if enabled)
        const companionEnabled = formData.permitir_acompanhante || formData.allow_companion;
        const companionClass = companionEnabled ? '' : 'hidden';
        html = html.replace(/\[\[COMPANION_HIDE_CLASS\]\]/g, companionClass);

        // ✅ 8. EVENT_DATETIME (combine date + time for countdown)
        const eventDate = formData.event_date || formData.data || '';
        const eventTime = formData.event_time || formData.hora || '00:00';
        const eventDatetime = eventDate && eventTime ? `${eventDate}T${eventTime}:00` : '';
        html = html.replace(/\[\[EVENT_DATETIME\]\]/g, eventDatetime);

        // ✅ 9. MENU_CONFIG (inject as JSON array, not object)
        html = html.replace(/\[\[MENU_CONFIG\]\]/g, JSON.stringify(menuConfig));

        // 10. Watermark
        const watermarkClass = state.buildConfig?.watermarkEnabled !== false ? 'visivel' : 'oculto';
        html = html.replace(/\[\[WATERMARK_CLASS\]\]/g, watermarkClass);

        return html;
    }

    /**
     * Minimal template fallback
     */
    function getMinimalTemplate() {
        return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[[OG_TITLE]]</title>
    <meta property="og:title" content="[[OG_TITLE]]">
    <meta property="og:image" content="capa/[[CAPA_FILENAME]]">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            color: white;
            padding: 2rem;
        }
        img {
            max-width: 90%;
            height: auto;
            border-radius: 12px;
            margin: 2rem 0;
        }
        .buttons {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
        }
        button {
            padding: 1rem 2rem;
            background: white;
            color: #667eea;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Convite Digital</h1>
        <img src="capa/[[CAPA_FILENAME]]" alt="Capa do Convite">
        <div class="buttons" id="menu"></div>
    </div>
    <script>
        const menuConfig = [[MENU_CONFIG]];
        const menuEl = document.getElementById('menu');
        menuConfig.forEach(btn => {
            const button = document.createElement('button');
            button.textContent = btn.titulo;
            button.onclick = () => {
                if (btn.link && btn.link !== '#') {
                    window.open(btn.link, '_blank');
                } else if (btn.manualText) {
                    alert(btn.manualText);
                }
            };
            menuEl.appendChild(button);
        });
    </script>
</body>
</html>`;
    }

    /**
     * Generate ZIP from VFS
     */
    async function generateZIP(vfs) {
        if (!window.JSZip) {
            alert('JSZip not loaded yet, please try again in a moment');
            return null;
        }

        const zip = new JSZip();

        for (const [path, content] of Object.entries(vfs)) {
            if (content instanceof Blob) {
                zip.file(path, content);
            } else if (typeof content === 'string') {
                zip.file(path, content);
            }
        }

        return await zip.generateAsync({ type: 'blob' });
    }

    /**
     * Download ZIP file
     */
    function downloadZIP(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'convite.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * PUBLIC API: Build and Download
     */
    async function buildAndDownload() {
        const state = window.builderState || {};
        const slug = state.formData?.slug || state.formData?.event_name?.toLowerCase().replace(/\s+/g, '-') || 'convite';

        try {
            const vfs = await executeBuild();
            if (!vfs) return;

            const zipBlob = await generateZIP(vfs);
            if (!zipBlob) return;

            downloadZIP(zipBlob, `${slug}.zip`);

            return { success: true, vfs, zipBlob };
        } catch (error) {
            console.error('[Build] Error:', error);
            alert(`Erro ao gerar ZIP: ${error.message}`);
            return null;
        }
    }

    /**
     * PUBLIC API: Build and Publish
     */
    async function buildAndPublish(slug) {
        try {
            const vfs = await executeBuild();
            if (!vfs) return null;

            // Convert VFS to format expected by deploy-github Edge Function
            const files = {};
            for (const [path, content] of Object.entries(vfs)) {
                if (content instanceof Blob) {
                    // Convert blob to base64
                    const reader = new FileReader();
                    const base64 = await new Promise((resolve) => {
                        reader.onloadend = () => resolve(reader.result.split(',')[1]);
                        reader.readAsDataURL(content);
                    });
                    files[path] = base64;
                } else {
                    files[path] = content;
                }
            }

            // Call Supabase deploy-github function
            const { data, error } = await window.supabase.functions.invoke('deploy-github', {
                body: { slug, files }
            });

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('[Build] Publish error:', error);
            throw error;
        }
    }

    // Expose to global scope
    window.AutoBuilderBuild = {
        executeBuild,
        generateZIP,
        downloadZIP,
        buildAndDownload,
        buildAndPublish
    };

    console.log('[Build System] Loaded ✅');

})();
