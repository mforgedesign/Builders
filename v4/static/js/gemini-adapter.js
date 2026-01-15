/**
 * AutoBuilder v4 - Gemini AI Adapter
 * ==================================
 * Handles intelligent parsing of invitation content using Google Gemini API.
 */

(function () {
    'use strict';

    const GEMINI_MODEL = 'gemini-1.5-flash';
    const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

    // Safe LocalStorage Access
    function getSafeStorage(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn('[Gemini] LocalStorage access blocked:', e);
            return null;
        }
    }

    // Auto-configure API Key from User Provision (Hardcoded from secure extraction)
    const PROVIDED_KEY = 'AlzaSyCsvq9se8VN2nBhCXZDWf0bxadhFjz01Ho';

    try {
        if (!getSafeStorage('gemini_api_key')) {
            localStorage.setItem('gemini_api_key', PROVIDED_KEY);
            console.log('[Gemini] API Key auto-configured');
        }
    } catch (e) {
        console.warn('[Gemini] Could not save key to storage:', e);
    }

    class GeminiAdapter {
        constructor() {
            this.apiKey = getSafeStorage('gemini_api_key') || PROVIDED_KEY;
        }

        /**
         * Parses raw HTML content to extract structured invitation data
         * @param {string} htmlContent - The raw HTML of the invitation
         * @returns {Promise<Object>} - The partial structure to merge into appState
         */
        async parseInvitationHtml(htmlContent) {
            console.log('[Gemini] Analyzing HTML content...');

            if (!this.apiKey) {
                throw new Error("Gemini API Key missing. Please configure it in settings.");
            }

            console.log(`[Gemini] Using API Key: ${this.apiKey.substring(0, 5)}...`);

            // Construct the prompt
            const prompt = `
                You are an AI assistant for an Invitation Builder.
                Your task is to analyze the provided HTML of an invitation and extract structured data into JSON format.
                
                The JSON must match this schema exactly:
                {
                    "formData": {
                        "nome_evento": "extract name (e.g. Julia)",
                        "tipo_evento": "extract type (e.g. 15 Anos, Casamento) if strictly apparent",
                        "data_evento": "YYYY-MM-DD",
                        "hora_evento": "HH:MM",
                        "idade_aniversariante": "extract age (numbers only)",
                        "tema_evento": "extract theme keywords",
                        "local_evento": "extract full address/location name",
                        "frase_convite": "extract the main inviting phrase or quote",
                        "paleta_cores": "extract main colors if mentioned or apparent",
                        "cor_botoes": "extract hex color of buttons if found",
                        "numero_whatsapp": "extract RSVP phone number (digits only)"
                        "link_confirmacao": "extract RSVP link if present",
                        "link_google_maps": "extract map link if present",
                        "link_presentes": "extract gift registry link if present",
                        "shadow_color": "extract shadow color hex",
                        "watermark_enabled": true/false
                    },
                    "manualContent": "Extract the HTML content of the 'Manual' or 'Information' section if present."
                }

                HTML Content to Analyze:
                \`\`\`html
                ${htmlContent.substring(0, 25000)} 
                \`\`\`
                (Content truncated if too long)
                
                Return ONLY valid JSON. Do not include markdown formatting.
            `;

            try {
                // Use Key in Query Param AND Header (Redundancy)
                const url = `${API_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${this.apiKey}`;

                const payload = {
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                };

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                        // 'x-goog-api-key': this.apiKey // Some CORS policies block this header on client-side calls
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(`Gemini API Error: ${err.error?.message || response.statusText}`);
                }

                const data = await response.json();
                const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

                if (!rawText) throw new Error("No response from Gemini");

                // Clean markdown code blocks if present
                const jsonStr = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

                console.log('[Gemini] Parsed Data:', jsonStr);
                return JSON.parse(jsonStr);

            } catch (error) {
                console.error('[Gemini] Error parsing HTML:', error);
                throw error;
            }
        }
    }

    // Export singleton
    window.GeminiAdapter = new GeminiAdapter();

})();
