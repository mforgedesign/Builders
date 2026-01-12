/**
 * AutoBuilder v4 - History Module
 * =================================
 * Manages GitHub repository history and invitation imports
 */

(function () {
    'use strict';

    // GitHub Configuration
    const GITHUB_OWNER = 'mforgedesign';
    const GITHUB_REPO = 'Convites';
    const GITHUB_BASE_PATH = ''; // Root of repo (invitations are in root)
    const GITHUB_PAGES_BASE = `https://mforgedesign.github.io/Convites/`;
    const GITHUB_REPO_BASE = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/tree/main/`;

    // DOM Elements
    let loadingEl, emptyEl, errorEl, cardsEl, gridEl, errorMessageEl;

    // State
    let invitations = [];
    let isLoading = false;

    /**
     * Initialize history module
     */
    function init() {
        console.log('[History] Initializing...');

        // Get DOM elements
        loadingEl = document.getElementById('history-loading');
        emptyEl = document.getElementById('history-empty');
        errorEl = document.getElementById('history-error');
        cardsEl = document.getElementById('history-cards');
        gridEl = document.getElementById('history-grid');
        errorMessageEl = document.getElementById('history-error-message');

        // Setup refresh button
        const refreshBtn = document.getElementById('btn-refresh-history');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                // Clear existing cards
                gridEl.innerHTML = '';
                invitations = [];
                loadInvitations();
            });
        }

        // Load when window becomes visible
        document.addEventListener('windowChanged', (e) => {
            if (e.detail?.windowId === 'history' && invitations.length === 0) {
                loadInvitations();
            }
        });

        console.log('[History] Initialized');
    }

    /**
     * Load invitations from GitHub - OPTIMIZED (Single Request)
     */
    async function loadInvitations() {
        if (isLoading) return;
        isLoading = true;

        // Show loading state
        showState('loading');

        try {
            console.log('[History] Fetching invitations tree from GitHub...');

            // Fetch entire repository tree in ONE request (recursive=2)
            // This avoids N+1 requests that hit API rate limits (403 error)
            const response = await fetch(
                `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/trees/main?recursive=2`,
                {
                    headers: {
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            if (!response.ok) {
                // Handle rate limit specifically
                if (response.status === 403) {
                    throw new Error('Limite de acesso ao GitHub atingido. Tente novamente em alguns minutos.');
                }
                throw new Error(`GitHub API error: ${response.status}`);
            }

            const data = await response.json();
            const tree = data.tree;

            // Fetch ignored paths config
            let ignoredPaths = ['builder', 'static', 'assets', 'builder-v4', 'home', 'v3-1']; // Defaults
            try {
                const configResponse = await fetch('builder-config.json');
                if (configResponse.ok) {
                    const config = await configResponse.json();
                    if (config.ignorePaths && Array.isArray(config.ignorePaths)) {
                        ignoredPaths = config.ignorePaths;
                    }
                }
            } catch (e) {
                console.warn('[History] Could not load builder-config.json, using defaults.', e);
            }

            // Normalize ignored paths for case-insensitive comparison
            const ignoredSet = new Set(ignoredPaths.map(p => p.toLowerCase()));

            // Process tree to find invitations
            // directory structure: slug/file.ext
            const invitationsMap = new Map();

            tree.forEach(item => {
                const pathLower = item.path.toLowerCase();

                // Skip if matches ignored path (partial or full match check strategy)
                // Strategy: exact match on root folder name
                const rootFolder = item.path.split('/')[0].toLowerCase();

                if (ignoredSet.has(rootFolder) || pathLower.startsWith('.')) {
                    return;
                }

                // Skip root files that are not directories
                if (!item.path.includes('/')) {
                    if (item.type !== 'tree') return; // Skip files in root
                }

                const parts = item.path.split('/');
                const slug = parts[0];

                // If we haven't seen this folder yet
                // Extra safety: re-check against ignore list (redundant but safe)
                if (!invitationsMap.has(slug) && !slug.startsWith('.') && !ignoredSet.has(slug.toLowerCase())) {
                    invitationsMap.set(slug, {
                        slug: slug,
                        coverUrl: null,
                        files: []
                    });
                }

                if (invitationsMap.has(slug)) {
                    const inv = invitationsMap.get(slug);
                    inv.files.push(item);

                    // Check for cover image
                    const lowerPath = item.path.toLowerCase();

                    // Must be a valid image
                    if (/\.(jpg|jpeg|png|webp)$/i.test(lowerPath)) {

                        // Check if "capa" or "cover" is in the path (excluding the slug itself)
                        // This handles:
                        // - slug/capa.jpg
                        // - slug/capa/image.jpg
                        // - slug/assets/cover.png
                        const pathInsideSlug = parts.slice(1).join('/').toLowerCase();

                        if (pathInsideSlug.includes('capa') || pathInsideSlug.includes('cover')) {
                            // Construct raw URL directly
                            inv.coverUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${item.path}`;
                        }
                    }
                }
            });

            // Convert to array and sort
            invitations = Array.from(invitationsMap.values())
                .filter(inv => inv.slug !== '404.html' && inv.slug !== 'assets' && inv.slug !== 'static')
                .map(inv => ({
                    slug: inv.slug,
                    coverUrl: inv.coverUrl,
                    liveUrl: `${GITHUB_PAGES_BASE}${inv.slug}/`,
                    repoUrl: `${GITHUB_REPO_BASE}${inv.slug}`,
                    timestamp: Date.now() // We don't get individual timestamps in tree view, using now
                }));

            // Sort alphabetical for now (tree doesn't give dates)
            invitations.sort((a, b) => a.slug.localeCompare(b.slug));

            if (invitations.length === 0) {
                showState('empty');
                isLoading = false;
                return;
            }

            console.log(`[History] Found ${invitations.length} invitations via Tree API`);

            // Show cards container
            showState('cards');

            // Render all
            invitations.forEach(invitation => {
                renderCard(invitation);
            });

            isLoading = false;

        } catch (error) {
            console.error('[History] Error loading invitations:', error);
            showError(error.message);
            isLoading = false;
        }
    }

    /**
     * Load details for a single invitation - DEPRECATED (Merged into loadInvitations)
     */
    async function loadInvitationDetails(folder) {
        // No longer needed with Tree API
    }

    /**
     * Render invitation card with animation
     */
    function renderCard(invitation) {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg border border-saas-border shadow-sm overflow-hidden hover:shadow-md transition opacity-0';

        card.innerHTML = `
            <!-- Cover Thumbnail -->
            <div class="aspect-[9/16] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
                ${invitation.coverUrl
                ? `<img src="${invitation.coverUrl}" alt="${invitation.slug}" class="w-full h-full object-cover">`
                : `<i class="fa-solid fa-image text-5xl text-gray-300"></i>`
            }
            </div>

            <!-- Card Body -->
            <div class="p-4">
                <!-- Slug -->
                <h3 class="font-semibold text-gray-800 truncate mb-3" title="${invitation.slug}">
                    ${invitation.slug}
                </h3>

                <!-- Action Buttons -->
                <div class="space-y-2">
                    <!-- View on GitHub -->
                    <a href="${invitation.repoUrl}" target="_blank"
                        class="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                        <i class="fa-brands fa-github"></i>
                        Ver no GitHub
                    </a>

                    <!-- View Online -->
                    <a href="${invitation.liveUrl}" target="_blank"
                        class="w-full flex items-center justify-center gap-2 px-3 py-2 border border-brand-200 bg-brand-50 rounded-md text-sm font-medium text-brand-600 hover:bg-brand-100 transition">
                        <i class="fa-solid fa-external-link-alt"></i>
                        Ver Online
                    </a>

                    <!-- Import to Builder -->
                    <button onclick="window.History.importInvitation('${invitation.slug}')"
                        class="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-md text-sm font-medium hover:shadow-md transition">
                        <i class="fa-solid fa-download"></i>
                        Importar para Builder
                    </button>
                </div>
            </div>
        `;

        gridEl.appendChild(card);

        // Fade in animation
        requestAnimationFrame(() => {
            card.style.transition = 'opacity 0.3s ease-in-out';
            card.style.opacity = '1';
        });
    }

    /**
     * Import invitation to builder - FULL IMPLEMENTATION
     */
    async function importInvitation(slug) {
        try {
            const message = `Importar o convite "${slug}" para o builder?\n\n` +
                `⚠️ ATENÇÃO: Isso irá substituir todos os dados atuais!\n\n` +
                `O que será importado:\n` +
                `✓ Todos os campos do formulário\n` +
                `✓ Imagens (capa, folha, etc)\n` +
                `✓ Vídeos (abertura, loop)\n` +
                `✓ Áudio (música)\n` +
                `✓ Links extras\n` +
                `✓ Configurações visuais`;

            if (!confirm(message)) {
                return;
            }

            // Show loading indicator
            const loadingMsg = document.createElement('div');
            loadingMsg.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
            loadingMsg.innerHTML = `
                <div class="bg-white rounded-lg p-6 max-w-md">
                    <div class="flex items-center gap-4">
                        <i class="fa-solid fa-spinner fa-spin text-3xl text-brand-500"></i>
                        <div>
                            <h3 class="font-semibold text-lg">Importando convite...</h3>
                            <p class="text-sm text-gray-500" id="import-status">Baixando arquivos do GitHub...</p>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(loadingMsg);

            const updateStatus = (msg) => {
                const statusEl = document.getElementById('import-status');
                if (statusEl) statusEl.textContent = msg;
            };

            console.log(`[History] Starting import of ${slug}...`);

            // Step 1: Fetch files list from GitHub
            updateStatus('Listando arquivos...');
            const filesResponse = await fetch(
                `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${slug}`,
                { headers: { 'Accept': 'application/vnd.github.v3+json' } }
            );

            if (!filesResponse.ok) {
                throw new Error('Não foi possível acessar os arquivos do convite');
            }

            const files = await filesResponse.json();

            // Step 2: Download data.json
            updateStatus('Baixando configurações...');
            const dataFile = files.find(f => f.name === 'data.json' || f.name === 'data');

            let appState = {
                version: "4.0",
                formData: {},
                assetsMap: {},
                linksExtras: []
            };

            if (dataFile) {
                try {
                    const response = await fetch(dataFile.download_url);
                    if (response.ok) {
                        appState = await response.json();

                        // Fix for LinksExtras: Ensure it's an array
                        if (appState.linksExtras && !Array.isArray(appState.linksExtras)) {
                            appState.linksExtras = [];
                        }
                        console.log('[History] Loaded state:', appState);
                    } else {
                        console.warn('[History] data.json not found (Old version?)');
                        // alert("Aviso: Dados estruturados (data.json) não encontrados. Importando apenas assets visuais.");
                    }
                } catch (e) {
                    console.error('Error parsing data.json', e);
                    alert("Erro ao ler dados do convite (data.json inválido).");
                }
            }

            // Step 3: Clean Slate (Deep Reset)
            updateStatus('Limpando ambiente atual...');
            if (window.resetBuilderState) {
                window.resetBuilderState();
            } else {
                // Fallback if not available yet (should be)
                if (window.FormManager) window.FormManager.reset();
                if (window.builderState) window.builderState.assets = {};
            }

            // Step 4: Asset Discovery (Enhance appState.assetsMap if empty/legacy)
            // If it's legacy, assetsMap will be empty. We populate it from scanning 'files'.
            // Even in new brain, we might want to ensure download_urls are used if we are not fetching by relative path?
            // "Brain" has relative paths suitable for ZIP. For History, we need Absolute URLs.
            // So we MUST map the "Brain" paths to real GitHub URLs or just scan files again.

            // Strategy: Build a map of filename -> download_url from 'files'
            const fileMap = {};
            files.forEach(f => fileMap[f.name] = f.download_url);

            // Also map complex paths if they exist (e.g. assets/foo.png) - GitHub API is flat for 'contents/slug' 
            // wait, contents/{slug} returns immediate children. If assets are in a folder, they are in a subdir?
            // "Publish" pushes structure: convites/{slug}/assets/foo.png
            // So for 'contents/{slug}', we might see 'assets' as a dir?
            // If so, we need to recurse or fetch assets dir.
            // Let's check 'files' structure assumption.
            // If 'assets' is a directory in the list, we need to fetch it?
            // "Publish" pushes flattened? No, previous code `filesMap[\`convites/${slug}/${path}\`]`.
            // So `contents/{slug}` will show `index.html`, `data.json` and `assets` (dir).

            // WE NEED TO FETCH ASSETS DIR content if 'assets' is a dir.
            const assetsDir = files.find(f => f.name === 'assets' && f.type === 'dir');
            let assetFiles = [];

            if (assetsDir) {
                updateStatus('Listando pastas de assets...');
                const assetsResponse = await fetch(assetsDir.url); // GitHub API url for the dir
                if (assetsResponse.ok) {
                    assetFiles = await assetsResponse.json();
                }
            } else {
                // Legacy: assets might be mixed in root?
                assetFiles = files.filter(f => f.type === 'file');
            }

            // Create a Combined File Map (Name -> URL)
            // Handle "assets/foo.png" mapping
            const urlMap = {};
            assetFiles.forEach(f => {
                urlMap[f.name] = f.download_url; // filename -> url
                urlMap[`assets/${f.name}`] = f.download_url; // path -> url
            });
            files.forEach(f => {
                if (f.type === 'file') urlMap[f.name] = f.download_url;
            });

            // If appState is "Legacy", we need to populate assetsMap based on known patterns
            const assetContexts = {
                'capa': ['capa'],
                'folha_vazia': ['folha', 'sheet'],
                'folha_preenchida': ['preenchida', 'filled'], // Added fallback
                'vid_abertura': ['intro', 'abertura', 'opening'],
                'vid_loop': ['loop', 'background'],
                'musica': ['musica', 'music'],
                'manual': ['manual'],
                'presentes': ['presentes', 'gifts']
            };

            // 4a. Update assetsMap with REAL URLs
            if (!appState.assetsMap) appState.assetsMap = {};

            // If Brain exists using relative paths (assets/foo.png), we replace them with Absolute URLs
            for (const [context, path] of Object.entries(appState.assetsMap)) {
                // path is 'assets/musica.mp3'
                // find in urlMap
                if (urlMap[path]) {
                    appState.assetsMap[context] = urlMap[path];
                } else {
                    // Start of path matching? 'musica.mp3'
                    const filename = path.split('/').pop();
                    if (urlMap[filename]) {
                        appState.assetsMap[context] = urlMap[filename];
                    }
                }
            }

            // 4b. Legacy Fallback: Detect assets if missing from map
            // Helper: Extract timestamp from filename (e.g., name_123456789.jpg)
            const getTimestamp = (name) => {
                const match = name.match(/_(\d{10,14})/);
                return match ? parseInt(match[1]) : 0;
            };

            for (const [context, patterns] of Object.entries(assetContexts)) {
                if (!appState.assetsMap[context]) {
                    // Search in assetFiles
                    const matches = assetFiles.filter(f => {
                        const lower = f.name.toLowerCase();
                        return patterns.some(p => lower.includes(p));
                    });

                    if (matches.length > 0) {
                        // Sort by Timestamp (Newest First)
                        matches.sort((a, b) => getTimestamp(b.name) - getTimestamp(a.name));
                        // Pick the newest
                        appState.assetsMap[context] = matches[0].download_url;

                        if (matches.length > 1) {
                            console.log(`[History] Multiple matches for ${context}, selected newest: ${matches[0].name}`);
                        }
                    }
                }
            }

            // Step 5: Restore
            updateStatus('Restaurando estado completo...');
            await window.restoreBuilderState(appState);


            // Step 6: Navigate to form and trigger preview update
            updateStatus('Finalizando...');

            // Trigger state update event
            // Trigger state update event
            document.dispatchEvent(new CustomEvent('stateUpdated', {
                detail: { source: 'import', data: appState }
            }));

            // Remove loading safely
            if (loadingMsg && loadingMsg.parentNode) {
                loadingMsg.parentNode.removeChild(loadingMsg);
            }

            // Show success (silent toast preferable, but for now just logging as per silent request)
            // alert(`✅ Convite "${slug}" importado com sucesso!\n\nVocê pode agora editar e republicar.`);

            if (window.AutoBuilderNav && typeof window.AutoBuilderNav.showWindow === 'function') {
                window.AutoBuilderNav.showWindow('form');
            }

            console.log('[History] Import completed successfully');

        } catch (error) {
            console.error('[History] Import error:', error);

            // Remove loading safely
            const loadingMsgCheck = document.querySelector('.fixed.inset-0.bg-black\\/50');
            if (loadingMsgCheck && loadingMsgCheck.parentNode) {
                loadingMsgCheck.parentNode.removeChild(loadingMsgCheck);
            }

            alert(`❌ Erro ao importar convite:\n\n${error.message}\n\nVerifique o console para mais detalhes.`);
        }
    }

    /**
     * Show specific state
     */
    function showState(state) {
        loadingEl.classList.add('hidden');
        emptyEl.classList.add('hidden');
        errorEl.classList.add('hidden');
        cardsEl.classList.add('hidden');

        switch (state) {
            case 'loading':
                loadingEl.classList.remove('hidden');
                break;
            case 'empty':
                emptyEl.classList.remove('hidden');
                break;
            case 'error':
                errorEl.classList.remove('hidden');
                break;
            case 'cards':
                cardsEl.classList.remove('hidden');
                break;
        }
    }

    /**
     * Show error message
     */
    function showError(message) {
        errorMessageEl.textContent = message;
        showState('error');
    }

    // ==================== PUBLIC API ====================

    window.History = {
        init,
        loadInvitations,
        importInvitation
    };

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('[History] Module loaded');

})();
