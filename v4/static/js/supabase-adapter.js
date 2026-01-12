/**
 * Supabase API Adapter for Auto Builder v4
 * ==========================================
 * Intercepts Flask API calls and redirects to Supabase Edge Functions
 */

(function () {
    'use strict';

    // Supabase Configuration
    const SUPABASE_URL = 'https://ymttaaebrqcfrgipqwvy.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltdHRhYWVicnFjZnJnaXBxd3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjM0MzAsImV4cCI6MjA4MjY5OTQzMH0.il4DFa2WDfwnqgsj5i5Ny0SklMZz1sta_eZisctuLYs';

    // Initialize Supabase Client
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Global State (mimics Flask session)
    window.builderState = {
        currentInvitationId: null,
        formData: {},
        assets: {},
        conversationHistory: []
    };

    // ==================== API INTERCEPTOR ====================

    /**
     * Intercept fetch calls to /api/* and redirect to Supabase
     */
    const originalFetch = window.fetch;
    window.fetch = async function (url, options = {}) {
        // Only intercept local API calls
        if (typeof url === 'string' && url.startsWith('/api/')) {
            console.log('[API Adapter] Intercepting:', url);
            return await handleAPICall(url, options);
        }

        // Pass through other requests
        return originalFetch.apply(this, arguments);
    };

    /**
     * Routes API calls to appropriate Supabase handlers
     */
    async function handleAPICall(url, options) {
        const method = options.method || 'GET';

        // Parse body - handle both JSON and FormData
        let body = null;
        if (options.body) {
            if (options.body instanceof FormData) {
                body = options.body; // Keep as FormData
            } else if (typeof options.body === 'string') {
                try {
                    body = JSON.parse(options.body);
                } catch (e) {
                    body = options.body; // Keep as string if not JSON
                }
            } else {
                body = options.body; // Already an object
            }
        }

        try {
            // Route mapping
            if (url.startsWith('/api/chat')) {
                return await handleChatAPI(body);
            }
            else if (url.startsWith('/api/upload/')) {
                const context = url.split('/api/upload/')[1];
                return await handleUploadAPI(context, options); // Pass full options for FormData
            }
            else if (url === '/api/state') {
                return await handleStateAPI('GET');
            }
            else if (url === '/api/update_state') {
                return await handleStateAPI('POST', body);
            }
            else if (url.startsWith('/api/generate/')) {
                const type = url.split('/api/generate/')[1];
                return await handleGenerateAPI(type, body);
            }
            else if (url === '/api/build') {
                return await handleBuildAPI();
            }
            else if (url === '/api/publish') {
                return await handlePublishAPI(body);
            }
            else if (url === '/api/history') {
                return await handleHistoryAPI();
            }
            else if (url === '/api/samples') {
                return await handleSamplesAPI();
            }
            else {
                console.warn('[API Adapter] Unknown endpoint:', url);
                return createResponse({ error: 'Endpoint not implemented' }, 501);
            }
        } catch (error) {
            console.error('[API Adapter] Error:', error);
            return createResponse({ error: error.message }, 500);
        }
    }

    // ==================== HANDLERS ====================

    /**
     * /api/chat - Chatbot interactions
     */
    async function handleChatAPI(body) {
        const { data, error } = await supabase.functions.invoke('chatbot-intent', {
            body: {
                message: body.message,
                context: window.builderState,
                conversation_history: window.builderState.conversationHistory
            }
        });

        if (error) throw error;
        return createResponse(data);
    }

    /**
     * /api/upload/<context> - File uploads
     */
    async function handleUploadAPI(context, options) {
        const formData = options.body; // FormData object
        const file = formData.get('file');

        if (!file) {
            console.error('[Upload] No file provided');
            return createResponse({ error: 'No file provided' }, 400);
        }

        // Validate file size (10MB limit)
        const MAX_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_SIZE) {
            console.error('[Upload] File too large:', file.size, 'bytes (max: 10MB)');
            return createResponse({
                error: `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(2)}MB). Máximo: 10MB`
            }, 400);
        }

        // Validate file type
        const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const validVideoTypes = ['video/mp4', 'video/webm'];
        const validAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/m4a', 'audio/wav'];
        const validTypes = [...validImageTypes, ...validVideoTypes, ...validAudioTypes];

        if (!validTypes.includes(file.type)) {
            console.error('[Upload] Invalid file type:', file.type);
            return createResponse({
                error: `Tipo de arquivo inválido: ${file.type}`
            }, 400);
        }

        console.log('[Upload] Starting upload:', {
            context,
            filename: file.name,
            size: `${(file.size / 1024).toFixed(2)}KB`,
            type: file.type
        });

        try {
            // Sanitize filename (remove spaces, accents, special chars)
            const sanitizeFilename = (name) => {
                // Get extension
                const ext = name.substring(name.lastIndexOf('.'));
                const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));

                // Remove accents and special characters
                const sanitized = nameWithoutExt
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
                    .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace special chars with underscore
                    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
                    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
                    .toLowerCase();

                return sanitized + ext.toLowerCase();
            };

            // Upload to Supabase Storage
            const timestamp = Date.now();
            const sanitizedName = sanitizeFilename(file.name);
            const fileName = `${context}/${timestamp}_${sanitizedName}`;

            console.log('[Upload] Sanitized filename:', fileName);

            const { data, error } = await supabase.storage
                .from('invitation-assets')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('[Upload] Supabase error:', error);
                throw new Error(error.message || 'Upload to Supabase failed');
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('invitation-assets')
                .getPublicUrl(fileName);

            if (!urlData || !urlData.publicUrl) {
                throw new Error('Failed to get public URL');
            }

            // Store in state
            window.builderState.assets[context] = urlData.publicUrl;

            console.log('[Upload] Success:', urlData.publicUrl);

            return createResponse({
                success: true,
                data: {
                    url: urlData.publicUrl,
                    context: context,
                    file_url: urlData.publicUrl // Compatibility with windows.js expectations
                }
            });

        } catch (error) {
            console.error('[Upload] Exception:', error);
            return createResponse({
                error: error.message || 'Upload failed',
                details: error.toString()
            }, 500);
        }
    }

    /**
     * /api/state - Get/Update state
     */
    async function handleStateAPI(method, body = null) {
        if (method === 'GET') {
            return createResponse(window.builderState);
        } else if (method === 'POST') {
            // Merge updates
            Object.assign(window.builderState.formData, body);

            // Save to Supabase
            if (window.builderState.currentInvitationId) {
                await supabase.from('invitations').update({
                    ...body,
                    updated_at: new Date().toISOString()
                }).eq('id', window.builderState.currentInvitationId);
            }

            return createResponse({ success: true, state: window.builderState });
        }
    }

    /**
     * /api/generate/<type> - AI Generation (image/video)
     */
    async function handleGenerateAPI(type, body) {
        if (type === 'image') {
            const { data, error } = await supabase.functions.invoke('generate-image', {
                body: {
                    mode: body.reference_image ? 'image-to-image' : 'text-to-image',
                    prompt: body.prompt,
                    reference_image: body.reference_image,
                    model: body.model || 'seedream-v4',
                    target_window: body.target_window || 'cover'
                }
            });

            if (error) throw error;
            return createResponse(data);
        }
        else if (type === 'video' || type === 'video_transition') {
            const { data, error } = await supabase.functions.invoke('generate-video', {
                body: {
                    source_image_url: body.image_url,
                    prompt: body.prompt,
                    model: body.model || 'hailuo-02',
                    type: body.type || 'opening'
                }
            });

            if (error) throw error;
            return createResponse(data);
        }

        return createResponse({ error: 'Unknown generation type' }, 400);
    }

    /**
     * /api/build - Build project
     */
    async function handleBuildAPI() {
        // TODO: Implement build logic
        return createResponse({
            success: true,
            message: 'Build system in development',
            download_url: '#'
        });
    }

    /**
     * /api/publish - Publish to GitHub
     */
    async function handlePublishAPI(body) {
        const { data, error } = await supabase.functions.invoke('deploy-github', {
            body: {
                slug: body.slug,
                files: body.files || {},
                commit_message: `Deploy ${body.slug} via AutoBuilder v4`
            }
        });

        if (error) throw error;
        return createResponse(data);
    }

    /**
     * /api/deploy-custom-zip - Deploy a custom ZIP file
     */
    async function handleDeployCustomZipAPI(body) {
        const { data, error } = await supabase.functions.invoke('deploy-github-zip', {
            body: {
                slug: body.slug,
                zipBase64: body.zipBase64,
                commit_message: `Deploy custom ZIP to ${body.slug} via AutoBuilder v4`
            }
        });

        if (error) throw error;
        return createResponse(data);
    }

    /**
     * /api/history - Get published invitations
     */
    async function handleHistoryAPI() {
        const { data, error } = await supabase
            .from('invitations')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        return createResponse({ invitations: data });
    }

    /**
     * /api/samples - Get music samples
     */
    async function handleSamplesAPI() {
        // TODO: Implement samples logic or use hardcoded list
        return createResponse({
            samples: [
                { name: 'Sample 1', url: '#' },
                { name: 'Sample 2', url: '#' },
                { name: 'Sample 3', url: '#' },
                { name: 'Sample 4', url: '#' }
            ]
        });
    }

    // ==================== UTILITIES ====================

    /**
     * Create a Response object mimicking fetch API
     */
    function createResponse(data, status = 200) {
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });

        return Promise.resolve(new Response(blob, {
            status: status,
            statusText: status === 200 ? 'OK' : 'Error',
            headers: { 'Content-Type': 'application/json' }
        }));
    }

    console.log('[Supabase Adapter] Initialized - Intercepting /api/* calls');

    // Expose for debugging
    window.SupabaseAdapter = {
        supabase,
        builderState: window.builderState
    };

})();
