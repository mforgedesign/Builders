/**
 * AutoBuilder v4 - API Client (Kie AI Integration)
 * =====================================
 * Handles interactions with Kie AI APIs for image and video generation.
 * Models: 
 * - seedream/4.5-edit (Image Generation/Editing)
 * - hailuo/02-image-to-video-standard (Video Generation)
 */

(function () {
    'use strict';

    // API Configuration
    const API_CONFIG = {
        // No keys here! Keys are in the Edge Function.
        MODELS: {
            IMAGE: 'seedream/4.5-edit',
            VIDEO: 'hailuo/02-image-to-video-standard'
        }
    };

    /**
     * Uploads a base64/blob to Supabase Storage to get a Public URL.
     * Required for GitHub Pages compatibility (no local /api/upload).
     */
    async function uploadToPublicUrl(data) {
        if (!window.supabaseClient) throw new Error("Supabase Client not initialized");

        try {
            // 1. Convert Data to Blob
            let blob;
            if (typeof data === 'string' && data.startsWith('data:')) {
                const res = await fetch(data);
                blob = await res.blob();
            } else if (data instanceof Blob) {
                blob = data;
            } else if (typeof data === 'string' && data.startsWith('http')) {
                return data; // Already a URL
            } else {
                throw new Error('Invalid data for upload');
            }

            // 2. Prepare Filename
            const timestamp = Date.now();
            const filename = `temp_uploads/${timestamp}_upload.png`;

            // 3. Upload to Supabase Storage ('invitation-assets' bucket)
            const { data: uploadData, error: uploadError } = await window.supabaseClient.storage
                .from('invitation-assets') // Public bucket
                .upload(filename, blob, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // 4. Get Public URL
            const { data: urlData } = window.supabaseClient.storage
                .from('invitation-assets')
                .getPublicUrl(filename);

            if (!urlData || !urlData.publicUrl) throw new Error("Failed to get public URL");

            console.log(`[API] Uploaded to Supabase: ${urlData.publicUrl}`);
            return urlData.publicUrl;

        } catch (error) {
            console.error('[API] Upload error:', error);
            throw new Error('Falha ao fazer upload da imagem para o Supabase Storage.');
        }
    }

    /**
     * Call Supabase Proxy Wrapper
     */
    async function callProxy(action, payload = null, taskId = null) {
        if (!window.supabaseClient) throw new Error("Supabase Client not initialized");

        const { data, error } = await window.supabaseClient.functions.invoke('kie-ai-proxy', {
            body: {
                action,
                payload,
                taskId
            }
        });

        if (error) throw new Error(error.message);
        if (data.error) throw new Error(data.error);

        return data; // Returns the raw Kie AI response data (e.g. { code: 200, data: { taskId: ... } })
    }

    /**
     * Creates a Task via Proxy
     */
    async function createTask(model, input) {
        const result = await callProxy('createTask', {
            model: model,
            input: input
        });

        if (!result.data || !result.data.taskId) {
            throw new Error('No Task ID returned from API');
        }
        return result.data.taskId;
    }

    /**
     * Polls for Task Completion via Proxy
     */
    async function pollTask(taskId, onProgress) {
        const pollInterval = 2000; // 2 seconds
        const maxAttempts = 60; // 2 minutes timeout
        let attempts = 0;

        while (attempts < maxAttempts) {
            attempts++;
            if (onProgress) onProgress(`Processando... (${attempts * 2}s)`);

            const result = await callProxy('pollTask', null, taskId);

            const state = result.data.state;

            if (state === 'success') {
                const resultJson = JSON.parse(result.data.resultJson);
                // Handle different result formats
                if (resultJson.resultUrls && resultJson.resultUrls.length > 0) {
                    return resultJson.resultUrls[0];
                }
                throw new Error('Success state but no URL found');
            } else if (state === 'fail') {
                throw new Error(result.data.failMsg || 'Task failed');
            }

            // Wait before next poll
            await new Promise(r => setTimeout(r, pollInterval));
        }

        throw new Error('Timeout waiting for generation');
    }

    const APIClient = {
        /**
         * Generic Generate Function supporting Kie AI Flow
         */
        _generateGeneric: async function (model, inputPayload, onProgress) {
            try {
                if (onProgress) onProgress('Enviando tarefa...');
                const taskId = await createTask(model, inputPayload);
                console.log(`[API] Task Created: ${taskId}`);

                const finalUrl = await pollTask(taskId, onProgress);
                console.log(`[API] Generation Success: ${finalUrl}`);
                return finalUrl;
            } catch (error) {
                console.error('[API] Generation Failed:', error);
                throw error;
            }
        },

        /**
         * Generate Cover (Seedream v4.5 Edit)
         */
        generateCover: async function (prompt, referenceBase64) {
            const input = {
                prompt: prompt,
                aspect_ratio: "9:16",
                quality: "basic"
            };

            // If reference image exists, upload it and add to payload
            if (referenceBase64) {
                const publicUrl = await uploadToPublicUrl(referenceBase64);
                input.image_urls = [publicUrl];
            }

            return this._generateGeneric(API_CONFIG.MODELS.IMAGE, input);
        },

        /**
         * Generate Leaf/Fill/Manual/Gifts (Same as Cover logic)
         */
        generateLeaf: async function (prompt, referenceBase64) {
            return this.generateCover(prompt, referenceBase64);
        },

        /**
         * Remove Background
         */
        removeBackground: async function (imageBase64) {
            // Placeholder: Returning original or throwing error
            console.warn('RMBG not configured for Kie AI. Returning original.');
            return imageBase64;
        },

        /**
         * Generate Video (Hailuo 02)
         */
        generateVideo: async function (prompt, startImageBase64, isLoop = false) {
            // 1. Upload Start Image
            const startUrl = await uploadToPublicUrl(startImageBase64);

            const input = {
                prompt: prompt,
                image_url: startUrl,
                duration: "10",
                resolution: "768P",
                prompt_optimizer: true
            };

            // 2. Handle "Loop" / End Frame
            if (isLoop) {
                try {
                    // Fetch local blank.jpg
                    const res = await fetch('blank.jpg');
                    const blob = await res.blob();
                    const endUrl = await uploadToPublicUrl(blob);
                    input.end_image_url = endUrl;
                } catch (e) {
                    console.warn('Could not load/upload blank.jpg for loop:', e);
                }
            }

            return this._generateGeneric(API_CONFIG.MODELS.VIDEO, input, (msg) => console.log(msg));
        },

        // Helper for Inpaint
        inpaint: async function () { return null; }
    };

    window.APIClient = APIClient;
    console.log('[API Client] Kie AI Loaded.');

})();
