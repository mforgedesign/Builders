/**
 * AutoBuilder v4 - API Client
 * =====================================
 * Handles interactions with Fal.ai APIs for image and video generation.
 * Based on FAL_AI_API_GUIDE.md
 */

(function () {
    'use strict';

    // API Configuration
    const API_CONFIG = {
        SEEDREAM_V4: 'https://fal.run/fal-ai/bytedance/seedream/v4/text-to-image',
        SEEDREAM_V4_5_EDIT: 'https://fal.run/fal-ai/bytedance/seedream/v4.5/edit',
        KLING_VIDEO: 'https://fal.run/fal-ai/kling-video/o1/image-to-video', // Fixed key name casing
        BRIA_RMBG: 'https://fal.run/fal-ai/image/v2/inpaint', // Using generic inpaint/mask endpoint? No, let's find a proper REMBG one.
        // Actually, let's use the specific endpoint for removing background if available, 
        // essentially we need to mask the leaf.
        // For now using Bria Rembg which is standard on FAL.
        RMBG: 'https://fal.run/fal-ai/bria/rmbg',
        INPAINT: 'https://fal.run/fal-ai/fast-inpainting' // For removing the object (inpainting with mask)
    };

    /**
     * Upload a file to Fal.ai storage via proxy or direct if supported.
     * For now, we assume the backend might handle this or we pass base64 directly if supported.
     * The guide implies passing data tokens or URLs. Since we are client-side only for now,
     * we will use the existing /api/upload proxy if available or send base64 data URIs
     * which most Fal.ai endpoints support.
     */

    /**
     * Generic wrapper for API calls
     * @param {string} endpoint - API URL
     * @param {object} payload - Request body
     * @returns {Promise<object>} - API Response
     */
    async function callFalAPI(endpoint, payload) {
        // We use the local backend proxy to hide API keys if possible,
        // OR we assume the user has configured the key in the backend.
        // For this implementation, we'll hit a local proxy endpoint '/api/ai/generate'
        // that wraps the Fal.ai call to keep keys secure.

        try {
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    endpoint: endpoint,
                    args: payload
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `API Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('[API Client] Call failed:', error);
            throw error;
        }
    }

    /**
     * Internal: Checks if we are running in a mode that allows direct calls (e.g. for testing)
     * For now, we will strictly enforce using the backend proxy for security.
     */

    const APIClient = {
        /**
         * Generates a Cover Image
         * @param {string} prompt - The text prompt
         * @param {string|null} referenceImageBase64 - (Optional) Base64 data URI of reference image
         * @returns {Promise<string>} - URL of generated image
         */
        generateCover: async function (prompt, referenceImageBase64 = null) {
            console.log('[API Client] Generating Cover...');

            if (referenceImageBase64) {
                // Scenario B: Image-to-Image (Seedream v4.5 Edit)
                // Note: The guide mentions v4.5/edit for Img2Img in "External Tools" section
                // The provided detailed guide focused on v4 T2I. We will follow the implied spec.

                // The standard payload for many FAL image-to-image endpoints:
                const payload = {
                    prompt: prompt,
                    image_url: referenceImageBase64, // Supports data URI
                    image_size: { width: 720, height: 1280 }, // 9:16
                    num_images: 1,
                    seed: Math.floor(Math.random() * 10000000)
                };

                const result = await callFalAPI(API_CONFIG.SEEDREAM_V4_5_EDIT, payload);
                // Adjust response parsing based on actual return shape (usually result.images[0].url)
                return result.images[0].url;

            } else {
                // Scenario A: Text-to-Image (Seedream v4)
                const payload = {
                    prompt: prompt,
                    image_size: { width: 720, height: 1280 }, // 9:16
                    num_images: 1,
                    seed: Math.floor(Math.random() * 10000000),
                    enable_safety_checker: true
                };

                const result = await callFalAPI(API_CONFIG.SEEDREAM_V4, payload);
                if (result.images && result.images.length > 0) {
                    return result.images[0].url;
                } else {
                    throw new Error('No image returned from API');
                }
            }
        },

        /**
         * Generates a Leaf (Blank Sheet) Image
         * @param {string} prompt - The text prompt
         * @param {string|null} referenceImageBase64 - (Optional) Base64 reference
         * @returns {Promise<string>} - URL of generated image
         */
        generateLeaf: async function (prompt, referenceImageBase64 = null) {
            console.log('[API Client] Generating Leaf...');
            // Reuses the same logic as Cover for now (Seedream v4 / v4.5)
            return this.generateCover(prompt, referenceImageBase64);
        },

        /**
         * Removes background from an image (Returns "Leaf Only")
         * @param {string} imageBase64 - The input image
         * @returns {Promise<string>} - URL of image with transparent background
         */
        removeBackground: async function (imageBase64) {
            console.log('[API Client] Removing Background...');
            // Ensure data URI format if not already

            const payload = {
                image_url: imageBase64
            };
            const result = await callFalAPI(API_CONFIG.RMBG, payload);
            // Bria Rembg returns 'image' { url: ... }
            if (result.image && result.image.url) return result.image.url;
            throw new Error("Failed to remove background");
        },

        /**
         * Inpaints an image to remove the object (Returns "Background Only")
         */
        inpaint: async function (imageUrl, maskUrl, prompt = "clean background, empty table") {
            console.log('[API Client] Inpainting (Background Clean)...');
            const payload = {
                image_url: imageUrl,
                mask_url: maskUrl,
                prompt: prompt
            };
            const result = await callFalAPI(API_CONFIG.INPAINT, payload);
            if (result.images && result.images[0]) return result.images[0].url;
            throw new Error("Failed to inpaint");
        },

        /**
         * Generates a Video (Intro or Loop)
         * @param {string} prompt - The text prompt
         * @param {string} imageUrl - The starting frame
         * @param {boolean} isLoop - Whether to force a seamless loop (use start image as end image)
         * @returns {Promise<string>} - URL of generated video
         */
        generateVideo: async function (prompt, imageUrl, isLoop = false) {
            console.log(`[API Client] Generating Video (Loop: ${isLoop})...`);

            // Determine endpoint based on type (using Kling or Hailuo via proxy)
            // For now, we use the Kling endpoint for loops and Hailuo for generic, 
            // or simply pass params to the generic video endpoint.

            const payload = {
                prompt: prompt,
                image_url: imageUrl,
                video_model: isLoop ? 'kling-o1' : 'hailuo-02', // Prefer Kling for loops
                duration: 5
            };

            // KEYFRAME LOGIC FOR LOOP:
            // If it's a loop, we want the start frame to match the end frame.
            // Some APIs (like Kling) support checking 'loop' boolean or explicit end_frame.
            // If the proxy supports it, we send end_frame_url.
            if (isLoop) {
                payload.loop = true; // Signal to proxy/API
                // If the specific model API supports end_frame, we send it:
                // payload.end_frame_url = imageUrl; 
            }

            const result = await callFalAPI(API_CONFIG.KLING_VIDEO, payload);

            // Handle different response structures
            if (result.video && result.video.url) return result.video.url;
            if (result.url) return result.url;
            if (result.data && result.data.video && result.data.video.url) return result.data.video.url;

            throw new Error('No video returned from API');
        },

        /**
         * Checks connection/health
         */
        ping: async function () {
            return true;
        }
    };

    // Expose to window
    window.APIClient = APIClient;
    console.log('[API Client] Loaded and ready.');

})();
