/**
 * AutoBuilder v4 - Gemini AI Adapter
 * ==================================
 * Handles intelligent parsing of invitation content using Google Gemini API.
 */

(function () {
    'use strict';

    // Safe LocalStorage Access (Deprecated but kept for cleanup)
    function clearLegacyStorage() {
        try { localStorage.removeItem('gemini_api_key'); } catch (e) { }
    }
    clearLegacyStorage();

    class GeminiAdapter {
        constructor() {
            // Check if supabase client exists
            if (!window.supabase) {
                console.error('[Gemini] Supabase client not found!');
            }
        }

        /**
         * Parses raw HTML content to extract structured invitation data
         * @param {string} htmlContent - The raw HTML of the invitation
         * @returns {Promise<Object>} - The partial structure to merge into appState
         */
        async parseInvitationHtml(htmlContent) {
            console.log('[Gemini] Analyzing HTML content via Supabase Edge Function...');

            if (!window.supabase) {
                throw new Error("Supabase client not initialized.");
            }

            try {
                // Call Supabase Edge Function
                const { data, error } = await window.supabase.functions.invoke('analyze-invitation', {
                    body: { htmlContent }
                });

                if (error) {
                    throw new Error(`Edge Function Error: ${error.message}`);
                }

                if (!data) {
                    throw new Error("No data returned from AI Analysis.");
                }

                console.log('[Gemini] Parsed Data:', data);
                return data;

            } catch (error) {
                console.error('[Gemini] Error parsing HTML:', error);
                throw error;
            }
        }
    }

    // Export singleton
    window.GeminiAdapter = new GeminiAdapter();

})();
