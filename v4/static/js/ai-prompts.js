/**
 * AutoBuilder v4 - AI Prompt Templates
 * =====================================
 * Centralized prompt engineering for all AI generation endpoints
 * Based on spec lines 1298-1396
 */

(function () {
    'use strict';

    /**
     * Variable injection - replaces {{VARIABLE}} with actual values
     */
    function injectVariables(template, variables) {
        let result = template;

        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, value || '');
        }

        return result;
    }

    /**
     * Get form context variables from builder state
     */
    function getContextVariables() {
        const state = window.builderState || {};
        const formData = state.formData || {};

        // Extract theme and colors
        const theme = formData.tema || formData.event_theme || 'Elegant classic';
        const colors = formData.paleta_cores || formData.color_palette || 'Gold and White';

        // Extract initials/age
        let initialsAge = '';
        if (formData.tipo_evento === 'casamento' || formData.event_type === 'wedding') {
            // Try to extract initials from names
            const name = formData.event_name || formData.nome || '';
            const parts = name.split(' ');
            if (parts.length >= 2) {
                initialsAge = parts[0][0] + parts[parts.length - 1][0];
            }
        } else {
            initialsAge = formData.idade || formData.age || '1';
        }

        // Event data concatenation
        const eventName = formData.event_name || formData.nome || 'Special Event';
        const eventDate = formData.event_date || formData.data || '';
        const eventTime = formData.event_time || formData.hora || '';
        const eventLocation = formData.event_location || formData.local || '';

        let eventData = `${eventName}`;
        if (eventDate) eventData += ` on ${eventDate}`;
        if (eventTime) eventData += ` at ${eventTime}`;
        if (eventLocation) eventData += `, ${eventLocation}`;

        return {
            THEME: theme,
            COLORS: colors,
            INITIALS_AGE: initialsAge,
            EVENT_DATA: eventData
        };
    }

    /**
     * TEMPLATE A: Cover (Capa) - Seedream v4
     * Text-to-Image
     */
    function getCoverPrompt() {
        const vars = getContextVariables();

        const template = `Create a vertical image of a hyper-realistic 3D render of a premium invitation envelope infused with a {{THEME}} theme, featuring a palette of {{COLORS}}. The envelope is sealed with an intricately detailed wax seal in matching colors with the number/initials '{{INITIALS_AGE}}'. The paper boasts a high-quality, textured finish, exuding elegance and sophistication. Background: A lush {{THEME}} setting, with highly detailed elements that enhance the luxurious feel of the invitation. The composition is centered, with dramatic lighting casting volumetric light and creating a soft focus and depth of field. Lighting: Dramatic, cinematic lighting with volumetric effects, simulating god rays filtering through {{THEME}} motifs. Highlights on the envelope and wax seal accentuate the texture and detail. Style: Photorealistic, hyper-detailed, cinematic, elegant, and romantic. Technical Details: Resolution: 8K, ultra high resolution. Aspect Ratio: 9:16. Rendering Engine: Octane Render, Unreal Engine 5. Camera: Macro lens, f/2.8, shallow depth of field.`;

        return injectVariables(template, vars);
    }

    /**
     * TEMPLATE B: Blank Sheet (Folha Vazia) - Seedream v4
     * Text-to-Image
     */
    function getBlankSheetPrompt() {
        const vars = getContextVariables();

        const template = `Create a vertical image of a hyper-realistic 3D render of a premium blank sheet adorned with a {{THEME}} theme, featuring a palette of {{COLORS}}. The sheet boasts a high-quality, textured finish, exuding elegance and sophistication, with intricate elegant adornments related to the theme. Background: A lush {{THEME}} setting, with highly detailed elements that enhance the luxurious feel of the composition. The sheet occupies 90% of the image, centered, with dramatic lighting casting volumetric light and creating a soft focus and depth of field. Lighting: Dramatic, cinematic lighting with volumetric effects, simulating god rays filtering through {{THEME}} motifs. Highlights on the sheet accentuate the texture and detail. Style: Photorealistic, hyper-detailed, cinematic, elegant, and romantic. Technical Details: Resolution: 8K, ultra high resolution. Aspect Ratio: 9:16. Rendering Engine: Octane Render, Unreal Engine 5. Camera: Macro lens, f/2.8, shallow depth of field.`;

        return injectVariables(template, vars);
    }

    /**
     * TEMPLATE C: Filled Sheet (Preenchimento) - Seedream v4.5
     * Image-to-Image (requires leaf_only.png as input)
     */
    function getFilledSheetPrompt() {
        const vars = getContextVariables();

        const template = `Context: You are a professional calligrapher and invitation designer. Task: Fill this blank sheet with the following event details creatively and elegantly. Data to Write: {{EVENT_DATA}}. Style Instructions: Theme {{THEME}} (Palette: {{COLORS}}). Use elegant design elements, dividers, lines, and introductory phrases like 'You are invited to...' based on your creativity. Apply texture and adornments to the text. Use a cursive, sophisticated font style (resembling 'Great Vibes' or 'Pinyon Script'). Ensure high contrast for readability.`;

        return injectVariables(template, vars);
    }

    /**
     * TEMPLATE D: Opening Animation (Abertura) - Hailuo 02
     * Image-to-Video (requires capa.jpg as input)
     */
    function getOpeningVideoPrompt() {
        // Fixed prompt - no variables needed
        return `The animation begins with a focus on the closed envelope. As the wax seal gracefully detaches and falls, the envelope's flap uplifts slowly. From its interior, a spectacular eruption of glittering sparkles and smoke, shimmering dust, and glowing light trails emerges, cascading outward in a mesmerizing display. These vibrant particles swirl dynamically, increasing in density and brightness around the envelope. The radiant light and swirling glitter intensify, rapidly expanding to fill the entire scene. CRITICAL: The overwhelming brilliance transitions the frame to a solid, blinding white screen in the very final frame, achieved through a dramatic zoom-in effect.`;
    }

    /**
     * TEMPLATE E: Loop Animation (Background) - Kling o1
     * Image-to-Video (requires background_only.jpg as input)
     */
    function getLoopVideoPrompt() {
        // Fixed prompt - no variables needed
        return `The animation displays smooth, looping movements of the shimmering effect based on the provided image. Dramatic sparkles and shining smokes flying in the background, cinematic lighting with volumetric effects (divine rays) filters through shimmering particles, creating a magical atmosphere with highlights. Rendered in a photorealistic and hyper-detailed style, the animation flows perfectly with a cinematic approach, captivating the viewer's attention with its fluid movement and mesmerizing 4K quality. IMPORTANT: Static Camera / No Camera Movement, only environmental motion.`;
    }

    /**
     * TEMPLATE F: Gift List (Presentes) - Seedream v4.5
     * Image-to-Image (requires background_only.jpg as input)
     */
    function getGiftListPrompt(listContent) {
        const vars = getContextVariables();
        vars.LIST_CONTENT = listContent || 'Kitchen items, Home decor, Gift cards';

        const template = `Create a central parchment sheet containing the Gift List listed below. Use your creativity to insert photorealistic 3D elements related to the {{THEME}} theme (e.g., if Disney theme, insert the character elegantly; if Floral, insert flowers) interacting with the paper. Gift List: {{LIST_CONTENT}}. Visual Style: Mature and realistic composition. Highly detailed 3D render, centered composition, dramatic lighting, volumetric light. Highlights on the textured paper to emphasize texture and detail. Style: Photorealistic, cinematic, elegant. Resolution: 8K. Aspect Ratio: 9:16.`;

        return injectVariables(template, vars);
    }

    /**
     * TEMPLATE G: Guest Manual (Manual) - Seedream v4.5
     * Image-to-Image (requires background_only.jpg as input)
     */
    function getGuestManualPrompt(rulesContent) {
        const vars = getContextVariables();
        vars.LIST_CONTENT = rulesContent || 'Please arrive on time, Formal dress code, No photography during ceremony';

        const template = `Create a central parchment or elegant card containing the Guest Guide/Rules listed below. Use your creativity to insert photorealistic 3D elements related to the {{THEME}} theme around the text. Guest Guide Rules: {{LIST_CONTENT}}. Visual Style: Clean layout for readability. Highly detailed 3D render, centered composition. Lighting: Soft cinematic lighting, clear focus on the text area. Style: Photorealistic, elegant, formal yet inviting. Resolution: 8K. Aspect Ratio: 9:16.`;

        return injectVariables(template, vars);
    }

    /**
     * Get model configuration for each generation type
     */
    function getModelConfig(type) {
        const configs = {
            'cover': {
                model: 'seedream-v4',
                mode: 'text-to-image',
                aspect_ratio: '9:16'
            },
            'leaf': {
                model: 'seedream-v4',
                mode: 'text-to-image',
                aspect_ratio: '9:16'
            },
            'fill': {
                model: 'seedream-v4.5',
                mode: 'image-to-image',
                aspect_ratio: '9:16'
            },
            'intro': {
                model: 'hailuo-02',
                mode: 'image-to-video',
                duration: 5
            },
            'loop': {
                model: 'kling-o1',
                mode: 'image-to-video',
                duration: 5,
                loop: true
            },
            'gifts': {
                model: 'seedream-v4.5',
                mode: 'image-to-image',
                aspect_ratio: '9:16'
            },
            'manual': {
                model: 'seedream-v4.5',
                mode: 'image-to-image',
                aspect_ratio: '9:16'
            }
        };

        return configs[type] || {};
    }

    /**
     * Build complete generation payload
     */
    function buildGenerationPayload(type, options = {}) {
        const config = getModelConfig(type);
        let prompt = '';

        // Get appropriate prompt
        switch (type) {
            case 'cover':
                prompt = getCoverPrompt();
                break;
            case 'leaf':
                prompt = getBlankSheetPrompt();
                break;
            case 'fill':
                prompt = getFilledSheetPrompt();
                break;
            case 'intro':
                prompt = getOpeningVideoPrompt();
                break;
            case 'loop':
                prompt = getLoopVideoPrompt();
                break;
            case 'gifts':
                prompt = getGiftListPrompt(options.listContent);
                break;
            case 'manual':
                prompt = getGuestManualPrompt(options.rulesContent);
                break;
            default:
                prompt = options.customPrompt || '';
        }

        // Allow prompt override from UI
        if (options.customPrompt) {
            prompt = options.customPrompt;
        }

        return {
            ...config,
            prompt,
            target_window: type,
            reference_image: options.referenceImage,
            image_url: options.imageUrl // For video generation
        };
    }

    // ==================== PUBLIC API ====================

    window.AIPrompts = {
        // Individual prompt getters
        getCoverPrompt,
        getBlankSheetPrompt,
        getFilledSheetPrompt,
        getOpeningVideoPrompt,
        getLoopVideoPrompt,
        getGiftListPrompt,
        getGuestManualPrompt,

        // Utilities
        getContextVariables,
        getModelConfig,
        buildGenerationPayload,

        // For testing
        injectVariables
    };

    console.log('[AI Prompts] Module loaded - 7 templates available');

})();
