/**
 * AutoBuilder v4 - History Module
 * =================================
 * Manages GitHub repository history and invitation imports
 * v4.3.0: Added multi-repository support (Convites + Convite)
 */

(function () {
    'use strict';

    // GitHub Configuration - Multiple Repositories
    const GITHUB_OWNER = 'mforgedesign';

    // v4.3.0: Support multiple repositories
    const REPOSITORIES = [
        {
            repo: 'Convites',
            branch: 'recuperaçãohoje',
            pagesBase: 'https://mforgedesign.github.io/Convites/',
            label: 'Convites'
        },
        {
            repo: 'Convite',
            branch: 'main',
            pagesBase: 'https://mforgedesign.github.io/Convite/',
            label: 'Convite'
        }
    ];

    // DOM Elements
    let loadingEl, emptyEl, errorEl, cardsEl, gridEl, errorMessageEl;

    // State
    let invitations = [];
    let allInvitations = []; // Full list for filtering
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

        // Setup search bar
        const searchInput = document.getElementById('history-search');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => filterInvitations(e.target.value), 300);
            });
        }

        console.log('[History] Initialized');
    }

    /**
     * Filter invitations by search query
     */
    function filterInvitations(query) {
        const q = query.toLowerCase().trim();
        gridEl.innerHTML = '';

        if (!q) {
            // Show all
            invitations = [...allInvitations];
        } else {
            invitations = allInvitations.filter(inv =>
                inv.slug.toLowerCase().includes(q)
            );
        }

        if (invitations.length === 0) {
            // Show "no results" message inside the grid (keep search bar visible)
            showState('cards');
            gridEl.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fa-solid fa-search text-5xl text-gray-500 mb-4"></i>
                    <h4 class="text-lg font-semibold text-gray-600 mb-2">Nenhum resultado para "${q}"</h4>
                    <p class="text-sm text-gray-500">Tente buscar por outro termo ou limpe a busca</p>
                </div>
            `;
        } else {
            showState('cards');
            invitations.forEach(renderCard);
        }
    }

    /**
     * Load invitations from GitHub - MULTI-REPO (v4.3.0)
     * Fetches from all configured repositories in parallel
     */
    async function loadInvitations() {
        if (isLoading) return;
        isLoading = true;

        // Show loading state
        showState('loading');

        try {
            console.log('[History] Fetching invitations from multiple repositories...');

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
            const ignoredSet = new Set(ignoredPaths.map(p => p.toLowerCase()));

            // Load sorting timestamps
            let historyTimestamps = {};
            try {
                historyTimestamps = JSON.parse(localStorage.getItem('autoBuilder_historyTimestamps') || '{}');
            } catch (e) {
                console.warn('[History] Failed to load timestamps', e);
            }

            // Fetch all repositories in parallel
            const repoPromises = REPOSITORIES.map(repoConfig => fetchRepoInvitations(repoConfig, ignoredSet));
            const repoResults = await Promise.allSettled(repoPromises);

            // Merge all invitations
            let allRepoInvitations = [];
            repoResults.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    console.log(`[History] ${REPOSITORIES[index].label}: Found ${result.value.length} invitations`);
                    allRepoInvitations = allRepoInvitations.concat(result.value);
                } else if (result.status === 'rejected') {
                    console.warn(`[History] ${REPOSITORIES[index].label}: Failed to load`, result.reason);
                }
            });

            // Add timestamps and sort
            invitations = allRepoInvitations.map(inv => ({
                ...inv,
                timestamp: historyTimestamps[inv.slug] || 0
            }));

            // Sort: Timestamp Descending (Newest First) -> Then Alphabetical
            invitations.sort((a, b) => {
                if (b.timestamp !== a.timestamp) return b.timestamp - a.timestamp;
                return a.slug.localeCompare(b.slug);
            });

            if (invitations.length === 0) {
                showState('empty');
                isLoading = false;
                return;
            }

            console.log(`[History] Total: ${invitations.length} invitations from ${REPOSITORIES.length} repositories`);

            // Show cards container
            showState('cards');

            // Save to allInvitations for filtering
            allInvitations = [...invitations];

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
     * Fetch invitations from a single repository
     * @param {Object} repoConfig - Repository configuration
     * @param {Set} ignoredSet - Set of paths to ignore
     * @returns {Promise<Array>} - Array of invitations
     */
    async function fetchRepoInvitations(repoConfig, ignoredSet) {
        const { repo, branch, pagesBase, label } = repoConfig;

        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${repo}/git/trees/${branch}?recursive=2`,
            {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('Rate limit atingido');
            }
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const data = await response.json();
        const tree = data.tree;

        // Process tree to find invitations
        const invitationsMap = new Map();

        tree.forEach(item => {
            const pathLower = item.path.toLowerCase();
            const rootFolder = item.path.split('/')[0].toLowerCase();

            if (ignoredSet.has(rootFolder) || pathLower.startsWith('.')) {
                return;
            }

            if (!item.path.includes('/')) {
                if (item.type !== 'tree') return;
            }

            const parts = item.path.split('/');
            const slug = parts[0];

            if (!invitationsMap.has(slug) && !slug.startsWith('.') && !ignoredSet.has(slug.toLowerCase())) {
                invitationsMap.set(slug, {
                    slug: slug,
                    coverUrl: null,
                    files: [],
                    // v4.3.0: Track source repository
                    sourceRepo: repo,
                    sourceBranch: branch,
                    sourceLabel: label
                });
            }

            if (invitationsMap.has(slug)) {
                const inv = invitationsMap.get(slug);
                inv.files.push(item);

                const lowerPath = item.path.toLowerCase();
                if (/\.(jpg|jpeg|png|webp)$/i.test(lowerPath)) {
                    const pathInsideSlug = parts.slice(1).join('/').toLowerCase();
                    if (pathInsideSlug.includes('capa') || pathInsideSlug.includes('cover')) {
                        inv.coverUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${repo}/${branch}/${item.path}`;
                    }
                }
            }
        });

        // Convert to array
        return Array.from(invitationsMap.values())
            .filter(inv => inv.slug !== '404.html' && inv.slug !== 'assets' && inv.slug !== 'static')
            .map(inv => ({
                slug: inv.slug,
                coverUrl: inv.coverUrl,
                liveUrl: `${pagesBase}${inv.slug}/`,
                repoUrl: `https://github.com/${GITHUB_OWNER}/${repo}/tree/${branch}/${inv.slug}`,
                sourceRepo: inv.sourceRepo,
                sourceBranch: inv.sourceBranch,
                sourceLabel: inv.sourceLabel
            }));
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
        card.className = 'relative group bg-white rounded-lg border border-saas-border shadow-sm overflow-hidden hover:shadow-md transition opacity-0';
        card.setAttribute('data-slug', invitation.slug);

        card.innerHTML = `
            <!-- Delete Button (Top Right Corner) -->
            <button onclick="event.stopPropagation(); window.History.deleteInvitation('${invitation.slug}')"
                class="absolute top-2 right-2 w-8 h-8 bg-red-500/80 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-10"
                title="Excluir Convite">
                <i class="fa-solid fa-trash text-sm"></i>
            </button>

            <!-- Source Repo Badge (v4.3.0) -->
            ${invitation.sourceLabel ? `
            <div class="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur rounded text-[10px] font-bold text-white z-10">
                ${invitation.sourceLabel}
            </div>` : ''}

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
    /**
     * Helper: Capture first frame of video for AI context
     */
    async function captureVideoFrame(url) {
        return new Promise((resolve) => {
            try {
                const video = document.createElement('video');
                video.crossOrigin = 'anonymous';
                video.src = url;
                video.muted = true;
                video.currentTime = 0.1; // Seek slightly to avoid black start

                const onComplete = (result) => {
                    video.remove();
                    resolve(result);
                };

                video.addEventListener('loadeddata', () => {
                    // Ready
                });

                video.addEventListener('seeked', () => {
                    try {
                        const canvas = document.createElement('canvas');
                        canvas.width = video.videoWidth || 640;
                        canvas.height = video.videoHeight || 360;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        onComplete(canvas.toDataURL('image/jpeg', 0.6));
                    } catch (e) {
                        console.warn('Canvas capture failed (CORS?)', e);
                        onComplete(null);
                    }
                });

                video.addEventListener('error', () => {
                    onComplete(null);
                });

                // Timeout 5s
                setTimeout(() => onComplete(null), 5000);

            } catch (e) {
                resolve(null);
            }
        });
    }

    /**
     * Import invitation to builder - FULL IMPLEMENTATION
     */
    async function importInvitation(slug) {
        // Remove confirmation dialog as requested
        // console.log(`[History] Import confirmed for ${slug}`);

        // UI: Show loading
        const loadingMsg = document.createElement('div');
        loadingMsg.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm';
        loadingMsg.innerHTML = `
            <div class="bg-gray-900 text-white rounded-xl p-8 max-w-md w-full border border-gray-700 shadow-2xl">
                <div class="flex flex-col items-center gap-6 text-center">
                    <div class="relative">
                        <div class="w-16 h-16 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
                        <i class="fa-solid fa-cloud-arrow-down absolute inset-0 flex items-center justify-center text-brand-500 text-xl"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-xl mb-2">Importando Convite</h3>
                        <p class="text-gray-400 text-sm" id="import-status">Conectando ao GitHub...</p>
                    </div>
                    <div class="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div id="import-progress" class="bg-brand-500 h-full w-0 transition-all duration-300"></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(loadingMsg);

        const updateStatus = (msg, progress = 0) => {
            const statusEl = document.getElementById('import-status');
            const progressEl = document.getElementById('import-progress');
            if (statusEl) statusEl.textContent = msg;
            if (progressEl && progress > 0) progressEl.style.width = `${progress}%`;
        };

        try {
            console.log(`[History] Starting import of ${slug}...`);

            // v4.3.0: Find source repository from invitation data
            const sourceInvitation = allInvitations.find(inv => inv.slug === slug);
            const sourceRepo = sourceInvitation?.sourceRepo || 'Convites';
            const sourceBranch = sourceInvitation?.sourceBranch || 'recuperaçãohoje';
            console.log(`[History] Source: ${sourceRepo}/${sourceBranch}`);

            // Step 1: Fetch files list
            updateStatus('Listando arquivos...', 10);
            const filesResponse = await fetch(
                `https://api.github.com/repos/${GITHUB_OWNER}/${sourceRepo}/contents/${slug}`,
                { headers: { 'Accept': 'application/vnd.github.v3+json' } }
            );

            if (!filesResponse.ok) throw new Error('Não foi possível acessar os arquivos do convite');
            const files = await filesResponse.json();

            // Step 2: Analyze Structure & Fetch Critical Files
            updateStatus('Analisando estrutura...', 20);

            // Files of interest
            const indexFile = files.find(f => f.name.toLowerCase() === 'index.html');
            const dataFile = files.find(f => f.name === 'data.json' || f.name === 'data');
            const scriptFile = files.find(f => f.name.endsWith('.js') && !f.name.includes('config')); // e.g., script.js or custom.js

            // Background Candidates (for Visual Context)
            // Priority: background.mp4 > video.mp4 > background.jpg > *.jpg/png
            const bgVideo = files.find(f => f.name.match(/background\.mp4|video\.mp4|fundo\.mp4|loop\.mp4/i));
            const bgImage = files.find(f => f.name.match(/background\.(jpg|png)|fundo\.(jpg|png)|bg\.(jpg|png)/i));

            // Read contents
            let htmlContent = '';
            let jsonContentStr = '';
            let jsContent = '';

            const fetchPromises = [];

            if (indexFile) fetchPromises.push(fetch(indexFile.download_url).then(r => r.text()).then(t => htmlContent = t));
            if (dataFile) fetchPromises.push(fetch(dataFile.download_url).then(r => r.text()).then(t => jsonContentStr = t));
            if (scriptFile) fetchPromises.push(fetch(scriptFile.download_url).then(r => r.text()).then(t => jsContent = t));

            await Promise.all(fetchPromises);

            // Step 3: Check Compatibility
            let isCompatible = false;
            let parsedData = null;

            if (jsonContentStr) {
                try {
                    parsedData = JSON.parse(jsonContentStr);
                    // Compatibility Criteria:
                    // 1. Has version >= 4.0 OR
                    // 2. Has 'fundo_tela' context (unified bg) AND valid structure
                    if (parsedData.version && parseFloat(parsedData.version) >= 4.0) {
                        isCompatible = true;
                    } else if (parsedData.assetsMap && parsedData.assetsMap.fundo_tela) {
                        isCompatible = true;
                    }
                } catch (e) {
                    console.warn('Corrupted data.json', e);
                }
            }

            let appState = {
                version: "4.0",
                formData: {},
                assetsMap: {},
                linksExtras: []
            };

            // Step 4: Decision - Direct Load vs AI Analysis
            if (isCompatible && parsedData) {
                console.log('[History] Compatible data.json found. Using direct import.');
                appState = parsedData;
                updateStatus('Carregando dados...', 60);
            } else {
                console.log('[History] Incompatible/Missing data. Detected trigger for AI Import.');
                updateStatus('🧠 I.A Analisando convite antigo...', 40);

                // Prepare Visual Context
                let visualContext = null;

                if (bgVideo) {
                    updateStatus('Capturando frame do vídeo...', 45);
                    const frame = await captureVideoFrame(bgVideo.download_url);
                    if (frame) {
                        visualContext = { type: 'video', base64: frame };
                    } else {
                        visualContext = { type: 'video', url: bgVideo.download_url }; // Fallback to URL
                    }
                } else if (bgImage) {
                    // For image, we can just send the URL, the Edge Function can't disable auth easily to fetch raw, 
                    // but we can try client-side fetch -> base64?
                    // Let's stick to URL if image, or fetch base64 to be safe.
                    // Fetching image to base64
                    try {
                        const imgReq = await fetch(bgImage.download_url);
                        const blob = await imgReq.blob();
                        const reader = new FileReader();
                        const base64 = await new Promise(r => { reader.onload = () => r(reader.result); reader.readAsDataURL(blob); });
                        visualContext = { type: 'image', base64: base64 };
                    } catch (e) {
                        visualContext = { type: 'image', url: bgImage.download_url };
                    }
                }

                // Call AI
                if (window.GeminiAdapter) {
                    const payload = {
                        htmlContent,
                        jsonContent: jsonContentStr, // Send raw old JSON for context
                        jsContent,
                        fileList: files.map(f => f.name), // Names for pattern matching
                        visualContext
                    };

                    try {
                        const aiData = await window.GeminiAdapter.analyzeRepository(payload);

                        // Merge AI results
                        appState.formData = { ...appState.formData, ...aiData.formData };

                        // Extra Data (Toggles, Links, etc from AI)
                        if (aiData.linksExtras) appState.linksExtras = aiData.linksExtras;

                        // Intelligent Prompt Mapping (if AI returned them)
                        if (aiData.prompts) {
                            // Map AI detected prompts to builder state/DOM later
                            // e.g. aiData.prompts.cover_prompt
                        }

                    } catch (aiErr) {
                        console.error('AI Import failed:', aiErr);
                        // Fallback to basic parsing
                        updateStatus('⚠️ I.A Falhou (usando básico)...', 50);
                    }
                }
            }

            // Step 5: Asset Mapping (Robust - including subdirectories)
            updateStatus('Mapeando arquivos...', 80);

            // Map file names to URLs
            const urlMap = {};

            // Fetch contents of known subdirectories (legacy invitations store assets in folders)
            const knownAssetDirs = ['assets', 'capa', 'cover', 'abertura', 'intro', 'loop', 'background', 'musica', 'music'];
            const subDirPromises = files
                .filter(f => f.type === 'dir' && knownAssetDirs.some(d => f.name.toLowerCase().includes(d)))
                .map(async (dir) => {
                    try {
                        const dirRes = await fetch(dir.url);
                        if (dirRes.ok) {
                            const dirFiles = await dirRes.json();
                            dirFiles.forEach(f => {
                                if (f.type === 'file') {
                                    urlMap[f.name] = f.download_url;
                                    urlMap[`${dir.name}/${f.name}`] = f.download_url;
                                    // Also map by directory context for easier lookup
                                    urlMap[`__dir__${dir.name.toLowerCase()}`] = f.download_url;
                                }
                            });
                        }
                    } catch (e) {
                        console.warn(`[History] Failed to fetch subdirectory ${dir.name}:`, e);
                    }
                });

            await Promise.all(subDirPromises);

            // Add root-level files
            files.forEach(f => { if (f.type === 'file') urlMap[f.name] = f.download_url; });

            console.log('[History] Asset URL Map:', Object.keys(urlMap));

            // Ensure assetsMap populated
            if (!appState.assetsMap) appState.assetsMap = {};

            // Legacy Fallback for Assets (Check both files and subdirectories)
            // IMPROVED: Added more patterns for robust matching
            const assetContexts = {
                'capa': ['capa', 'cover'],
                'folha_vazia': ['folha', 'sheet', 'leaf'],
                'fundo_tela': ['fundo', 'background', 'bg', 'loop', 'preenchida', 'fill', 'folha_preenchida', 'video'], // Added preenchida/fill patterns
                'vid_abertura': ['intro', 'abertura', 'opening'],
                'musica': ['musica', 'music', 'audio', 'som'],
                'manual': ['manual'],
                'presentes': ['presentes', 'gifts', 'lista']
            };

            for (const [context, patterns] of Object.entries(assetContexts)) {
                if (!appState.assetsMap[context]) {
                    // Strategy 1: Check if a subdirectory matches (e.g., capa/)
                    for (const pattern of patterns) {
                        const dirKey = `__dir__${pattern}`;
                        if (urlMap[dirKey]) {
                            appState.assetsMap[context] = urlMap[dirKey];
                            console.log(`[History] Mapped ${context} from subdirectory: ${pattern}/`);
                            break;
                        }
                    }

                    // Strategy 2: Check all urlMap keys for pattern match
                    if (!appState.assetsMap[context]) {
                        for (const [key, url] of Object.entries(urlMap)) {
                            if (key.startsWith('__dir__')) continue; // Skip directory markers
                            const lower = key.toLowerCase();
                            if (patterns.some(p => lower.includes(p))) {
                                appState.assetsMap[context] = url;
                                console.log(`[History] Mapped ${context} from file: ${key}`);
                                break;
                            }
                        }
                    }
                }
            }

            // Step 6: Restore State
            updateStatus('Restaurando builder...', 90);

            // Pass true to suppress confirmation dialog during import
            if (window.resetBuilderState) await window.resetBuilderState(true);

            // CRITICAL FIX: Pass baseUrl so relative paths in data.json can be fetched
            const baseUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${sourceRepo}/${sourceBranch}/${slug}`;
            await window.restoreBuilderState(appState, null, baseUrl);

            // Step 7: Finish
            document.dispatchEvent(new CustomEvent('stateUpdated', {
                detail: { source: 'import', data: appState }
            }));

            // Remove loading
            if (loadingMsg && loadingMsg.parentNode) loadingMsg.parentNode.removeChild(loadingMsg);

            // Go to Form
            if (window.AutoBuilderNav && window.AutoBuilderNav.showWindow) {
                window.AutoBuilderNav.showWindow('form');
            }

            // Show toast
            if (window.showToast) window.showToast('Convite importado com sucesso!', 'success');

        } catch (error) {
            console.error('[History] Import Error:', error);
            const statusEl = document.getElementById('import-status');
            if (statusEl) {
                statusEl.className = 'text-red-400 font-bold';
                statusEl.textContent = 'Erro: ' + error.message;
            }
            setTimeout(() => {
                if (loadingMsg && loadingMsg.parentNode) loadingMsg.parentNode.removeChild(loadingMsg);
                setTimeout(() => {
                    if (loadingMsg && loadingMsg.parentNode) loadingMsg.parentNode.removeChild(loadingMsg);
                    if (window.showToast) window.showToast('Erro na importação: ' + error.message, 'error');
                }, 2000);
            }, 2000);
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

    /**
     * Delete an invitation from GitHub
     * Uses elegant confirmation modal and runs deletion in background
     */
    async function deleteInvitation(slug) {
        // Create elegant confirmation modal
        const modalId = `confirm-delete-${Date.now()}`;
        const modal = document.createElement('div');
        modal.className = 'confirm-modal-overlay';
        modal.id = modalId;
        modal.innerHTML = `
            <div class="confirm-modal-content">
                <div class="flex flex-col items-center text-center">
                    <!-- Icon -->
                    <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                        <i class="fa-solid fa-trash text-red-500 text-2xl"></i>
                    </div>
                    
                    <!-- Title -->
                    <h3 class="text-xl font-bold text-white mb-2">Excluir Convite?</h3>
                    
                    <!-- Message -->
                    <p class="text-gray-400 text-sm mb-2">Você está prestes a excluir:</p>
                    <p class="text-brand-400 font-semibold mb-4">${slug}</p>
                    <p class="text-red-400 text-xs mb-6">
                        <i class="fa-solid fa-triangle-exclamation mr-1"></i>
                        Esta ação não pode ser desfeita.
                    </p>
                    
                    <!-- Buttons -->
                    <div class="flex gap-3 w-full">
                        <button id="${modalId}-cancel" 
                            class="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition">
                            Cancelar
                        </button>
                        <button id="${modalId}-confirm" 
                            class="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2">
                            <i class="fa-solid fa-trash"></i>
                            Excluir
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Handle button clicks
        return new Promise((resolve) => {
            const cancelBtn = document.getElementById(`${modalId}-cancel`);
            const confirmBtn = document.getElementById(`${modalId}-confirm`);

            const closeModal = () => {
                modal.style.animation = 'fadeIn 0.2s ease-out reverse';
                setTimeout(() => modal.remove(), 200);
            };

            cancelBtn.addEventListener('click', () => {
                closeModal();
                resolve(false);
            });

            // Close on overlay click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal();
                    resolve(false);
                }
            });

            confirmBtn.addEventListener('click', async () => {
                // Change button to loading state
                confirmBtn.disabled = true;
                confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Excluindo...';

                try {
                    if (!window.githubAdapter) {
                        throw new Error('GitHub Adapter não disponível');
                    }

                    // Ensure auth (will prompt if needed)
                    const authOk = await window.githubAdapter.ensureAuth();
                    if (!authOk) {
                        throw new Error('Autenticação cancelada');
                    }

                    // Start deletion in background
                    closeModal();

                    // Immediately fade out the card for responsive UI
                    const cardEl = document.querySelector(`[data-slug="${slug}"]`);
                    if (cardEl) {
                        cardEl.style.transition = 'opacity 0.3s, transform 0.3s';
                        cardEl.style.opacity = '0.5';
                        cardEl.style.pointerEvents = 'none';
                    }

                    // Perform deletion
                    const success = await window.githubAdapter.deleteFolder(slug);

                    if (success) {
                        // Remove from local state
                        invitations = invitations.filter(i => i.slug !== slug);
                        allInvitations = allInvitations.filter(i => i.slug !== slug);

                        // Remove card from DOM
                        if (cardEl) {
                            cardEl.style.transform = 'scale(0.9)';
                            cardEl.style.opacity = '0';
                            setTimeout(() => cardEl.remove(), 300);
                        }

                        // Show success toast
                        if (window.showToast) {
                            window.showToast(`"${slug}" excluído com sucesso!`, 'success');
                        }

                        // Check if empty
                        if (invitations.length === 0) {
                            showState('empty');
                        }

                        resolve(true);
                    } else {
                        throw new Error('Pasta não encontrada no repositório');
                    }

                } catch (error) {
                    console.error('[History] Delete Error:', error);

                    // Restore card if it exists
                    const cardEl = document.querySelector(`[data-slug="${slug}"]`);
                    if (cardEl) {
                        cardEl.style.opacity = '1';
                        cardEl.style.pointerEvents = 'auto';
                    }

                    // Show error toast
                    if (window.showToast) {
                        window.showToast(`Erro ao excluir: ${error.message}`, 'error');
                    } else {
                        alert(`Erro ao excluir: ${error.message}`);
                    }

                    resolve(false);
                }
            });
        });
    }

    // ==================== PUBLIC API ====================

    window.History = {
        init,
        loadInvitations,
        importInvitation,
        deleteInvitation
    };

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('[History] Module loaded');

})();
