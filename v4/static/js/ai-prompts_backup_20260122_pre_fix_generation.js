/**
 * AutoBuilder v4 - AI Prompt Templates
 * =====================================
 * Centralized prompt engineering for all AI generation endpoints
 * Updated v4.1.9 - User Specific Templates
 */

(function () {
    'use strict';

    /**
     * Variable injection - replaces {{VARIABLE}} with actual values
     */
    function injectVariables(template, variables) {
        let result = template;

        for (const [key, value] of Object.entries(variables)) {
            // Replace all occurrences case-insensitive
            const regex = new RegExp(`{{${key}}}`, 'gi');
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

        // Helper to safely get string values
        const val = (v, fallback = '') => (v ? String(v).trim() : fallback);

        // Core fields - Prioritize DOM value if formData is empty (stale state protection)
        const getFieldVal = (fieldId, stateKey) => {
            const el = document.querySelector(`[data-field="${fieldId}"]`) || document.getElementById(fieldId);
            const domVal = el ? el.value : '';
            return val(formData[stateKey || fieldId]) || val(domVal);
        };

        const theme = getFieldVal('tema_evento') || getFieldVal('tema') || 'Elegant';
        const colors = getFieldVal('paleta_cores') || 'Gold and White';
        const eventType = getFieldVal('tipo_evento') || 'Special Event';
        const name = getFieldVal('nome') || '';
        const age = getFieldVal('idade') || '';

        // "Selo" logic (Initials or Age)
        let seal = age; // Default to age (e.g., 15)
        if (eventType.toLowerCase().includes('casamento') || eventType.toLowerCase().includes('wedding')) {
            // Extract initials for weddings
            const parts = name.split(' ');
            if (parts.length >= 2) {
                seal = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
            } else if (name) {
                seal = name[0].toUpperCase();
            }
        }
        if (!seal) seal = 'W'; // Fallback symbol

        return {
            THEME: theme,
            COLORS: colors,
            EVENT_TYPE: eventType,
            NAME: name,
            AGE: age,
            SEAL: seal
        };
    }

    // ==================== GENERATION TEMPLATES ====================

    /**
     * 1. CAPA (Cover)
     * User-defined template
     */
    function getCoverPrompt() {
        const vars = getContextVariables();

        const template = `Tipo de evento: {{EVENT_TYPE}}
Selo: {{SEAL}}
Paleta de Cores: {{COLORS}}
Tema: {{THEME}}
Task: Create a vertical image of a hyper-realistic 3D render of a premium invitation envelope. The envelope is sealed with an intricately detailed wax seal. The wax seal may contain ONLY the number "{{SEAL}}" embossed - NO OTHER TEXT OR WORDS ANYWHERE IN THE IMAGE. The paper boasts a high-quality, textured finish, exuding elegance and sophistication. Background: A setting with elements that enhance the luxurious feel of the invitation without specific thematic details. The composition is centered, with dramatic lighting casting volumetric light and creating a soft focus and depth of field. Lighting: Dramatic, cinematic lighting with volumetric effects. Highlights on the envelope and wax seal accentuate the texture and detail. Style: Photorealistic, hyper-detailed, cinematic, and elegant. CRITICAL: DO NOT generate any text, letters, or words except the number on the seal. Technical Details: Resolution: 8K, ultra high resolution Aspect Ratio: 9:16 Rendering Engine: Octane Render, Unreal Engine 5 Camera: Macro lens, f/2.8, shallow depth of field`;

        return injectVariables(template, vars);
    }

    /**
     * 2. FOLHA VAZIA (Blank Sheet)
     * User-defined adaptation: "Same as cover but blank sheet, centered, 90% coverage, adorned edges"
     */
    function getBlankSheetPrompt() {
        const vars = getContextVariables();

        const template = `Tipo de evento: {{EVENT_TYPE}}
Paleta de Cores: {{COLORS}}
Tema: {{THEME}}
Task: Create a vertical image of a hyper-realistic 3D render of a premium blank sheet. The sheet is centered, vertical, covering 90% of the image, and has its edges adorned with decorative elements matching the theme. The paper boasts a high-quality, textured finish, exuding elegance and sophistication. Background: A setting with elements that enhance the luxurious feel of the invitation without specific thematic details. The composition is centered, with dramatic lighting casting volumetric light and creating a soft focus and depth of field. Lighting: Dramatic, cinematic lighting with volumetric effects. Highlights on the sheet and adornments accentuate the texture and detail. Style: Photorealistic, hyper-detailed, cinematic, and elegant. CRITICAL: DO NOT include ANY text, letters, numbers, or words anywhere in the image - the sheet must be completely blank. Technical Details: Resolution: 8K, ultra high resolution Aspect Ratio: 9:16 Rendering Engine: Octane Render, Unreal Engine 5 Camera: Macro lens, f/2.8, shallow depth of field`;

        return injectVariables(template, vars);
    }

    /**
     * 3. FOLHA PREENCHIDA (Filled Sheet)
     * User-defined template
     */
    function getFilledSheetPrompt() {
        const vars = getContextVariables();

        const template = `{{NAME}}
{{AGE}}
Tipo de evento: {{EVENT_TYPE}}
Tema: {{THEME}}
Task: Preencha essa folha com os dados para convite de forma criativa e elegante.
Coloque elementos de design de forma elegante no convite, divisórias modernas, hierarquia visual madura e profissional, linhas, e uma frase similar a "Você está convidado para o... (crie a frase conforme o contexto)" conforme sua criatividade.
Coloque textura, camadas, adornos no texto do nome, letra cursiva (Great Vibes) e efeitos especiais elegantes.`;

        return injectVariables(template, vars);
    }

    /**
     * 4. PRESENTES (Gifts)
     * User-defined template
     */
    function getGiftListPrompt(listContent) {
        const vars = getContextVariables();
        vars.LIST_CONTENT = listContent || '[Lista de Presentes Vazia - Informe os itens]';

        const template = `Você irá escrever as sugestões de presentes que vou listar a seguir. Use sua criatividade, inserindo elementos do tema e os itens fotorealistas modernos junto dos itens descritos. 
Tema: {{THEME}}
Paleta de cores: {{COLORS}}
Composição madura e realista. Highly detailed 3D render of a luxurious setting, centered composition, dramatic lighting, volumetric light, soft focus, depth of field. Lighting: Dramatic, cinematic lighting. Volumetric lighting effects (god rays) filtering through the floral elements and particles. Highlights on the textured paper to emphasize texture and detail. Style: Photorealistic, hyperdetailed, cinematic, elegant, romantic. Technical Details: Resolution: 8K, ultra high resolution Aspect Ratio: 9:16 Rendering Engine: Octane Render, Unreal Engine 5 Camera: Macro lens, f/2.8, shallow depth of field.

Sugestões de presentes:
{{LIST_CONTENT}}`;

        return injectVariables(template, vars);
    }

    /**
     * 5. MANUAL (Guest Manual)
     * Adapted from Gifts template as requested
     */
    function getGuestManualPrompt(rulesContent) {
        const vars = getContextVariables();
        vars.LIST_CONTENT = rulesContent || '[Texto do Manual Vazio - Informe as regras]';

        const template = `Você irá escrever o Manual do Convidado/Regras que vou listar a seguir. Use sua criatividade, inserindo elementos do tema e os itens fotorealistas modernos junto dos itens escritos.
Tema: {{THEME}}
Paleta de cores: {{COLORS}}
Composição madura e realista. Highly detailed 3D render of a luxurious setting, centered composition, dramatic lighting, volumetric light, soft focus, depth of field. Lighting: Dramatic, cinematic lighting. Volumetric lighting effects (god rays) filtering through the floral elements and particles. Highlights on the textured paper to emphasize texture and detail. Style: Photorealistic, hyperdetailed, cinematic, elegant, romantic. Technical Details: Resolution: 8K, ultra high resolution Aspect Ratio: 9:16 Rendering Engine: Octane Render, Unreal Engine 5 Camera: Macro lens, f/2.8, shallow depth of field.

Manual do convidado:
{{LIST_CONTENT}}`;

        return injectVariables(template, vars);
    }

    /**
     * 6. INTRO (Hailuo Video)
     * Fixed prompt
     */
    function getOpeningVideoPrompt() {
        return `The animation begins with a focus on the closed envelope. As the wax seal gracefully detaches and falls, the envelope's flap uplifts slowly. From its interior, a spectacular eruption of glittering sparkles and smoke, shimmering dust, and glowing light trails emerges, cascading outward in a mesmerizing display. These vibrant particles swirl dynamically, increasing in density and brightness around the envelope. The radiant light and swirling glitter intensify, rapidly expanding to fill the entire scene. CRITICAL: The Color of glow, light and smoke need to be the same of the image color pallete. The overwhelming brilliance transitions the frame to a solid, blinding white screen in the very final frame, achieved through a dramatic zoom-in effect.`;
    }

    /**
     * 7. LOOP (Background Animation)
     */
    function getLoopVideoPrompt() {
        return `The animation displays smooth, looping movements of the shimmering effect based on the provided image. Dramatic sparkles and shining smokes flying in the background, cinematic lighting with volumetric effects (divine rays) filters through shimmering particles, creating a magical atmosphere with highlights. Rendered in a photorealistic and hyper-detailed style, the animation flows perfectly with a cinematic approach, captivating the viewer's attention with its fluid movement and mesmerizing 4K quality. IMPORTANT: Static Camera / No Camera Movement, only environmental motion.`;
    }

    // ==================== CONFIG & BUILDER ====================

    function getModelConfig(type) {
        const configs = {
            'cover': {
                model: 'seedream/4.5-text-to-image',
                mode: 'text-to-image',
                aspect_ratio: '9:16'
            },
            'leaf': {
                model: 'seedream/4.5-text-to-image',
                mode: 'text-to-image',
                aspect_ratio: '9:16'
            },
            'fill': {
                model: 'seedream/4.5-edit',
                mode: 'image-to-image',
                aspect_ratio: '9:16'
            },
            'intro': {
                model: 'hailuo/02-image-to-video-standard',
                mode: 'image-to-video',
                duration: 6
            },
            'loop': {
                model: 'kling/v1/standard',
                mode: 'image-to-video',
                duration: 6,
                loop: true
            },
            'gifts': {
                model: 'seedream/4.5-edit',
                mode: 'image-to-image',
                aspect_ratio: '9:16'
            },
            'manual': {
                model: 'seedream/4.5-edit',
                mode: 'image-to-image',
                aspect_ratio: '9:16'
            }
        };
        return configs[type] || {};
    }

    function buildGenerationPayload(type, options, config) {
        if (!config) config = getModelConfig(type);

        let prompt = '';
        const opts = options || {};

        switch (type) {
            case 'cover': prompt = getCoverPrompt(); break;
            case 'leaf': prompt = getBlankSheetPrompt(); break;
            case 'fill': prompt = getFilledSheetPrompt(); break;
            case 'intro': prompt = getOpeningVideoPrompt(); break;
            case 'loop': prompt = getLoopVideoPrompt(); break;
            case 'gifts':
                // Ensure listContent is passed from options
                prompt = getGiftListPrompt(opts.listContent || opts.customPrompt);
                break;
            case 'manual':
                prompt = getGuestManualPrompt(opts.rulesContent || opts.customPrompt);
                break;
            default: prompt = opts.customPrompt || '';
        }

        // If user manually edited the prompt box in UI, prefer that (unless it's empty?)
        // BUT if it's gifts/manual, we prefer the template + list content over the raw prompt, 
        // unless the raw prompt ALREADY contains the list (which it might if user edited it).
        // Let's assume if customPrompt is very long, user wants to use it.
        if (opts.customPrompt && opts.customPrompt.length > 50 && type !== 'gifts' && type !== 'manual') {
            prompt = opts.customPrompt;
        }

        return {
            ...config,
            prompt,
            target_window: type,
            reference_image: opts.referenceImage,
            image_url: opts.imageUrl,
            end_image_url: opts.endImageUrl // Pass through if exists
        };
    }

    // Default Prompts (for UI autofill buttons) matches the generators
    function getDefaultCoverPrompt() { return getCoverPrompt(); }
    function getDefaultFillPrompt() { return getFilledSheetPrompt(); }

    // ==================== IMAGE EDIT PROMPTS (for modifying existing models) ====================

    /**
     * Cover Edit Prompt - Used when user has an existing cover image and wants to change theme/colors
     * Uses Seedream v4.5 Edit mode (image-to-image)
     */
    function getCoverEditPrompt() {
        const vars = getContextVariables();

        const template = `Recrie essa composição com os seguintes detalhes técnicos:
Tema: {{THEME}}
Paleta de cores: {{COLORS}}
Faça o selo e o número "{{SEAL}}" embossed na cor principal da paleta.
Mantenha a composição e elementos visuais, apenas alterando as cores e o tema conforme especificado.
CRÍTICO: NÃO inclua nenhum texto ou palavras na imagem, exceto o número "{{SEAL}}" no selo de cera.
Style: Photorealistic, hyper-detailed, cinematic, and elegant.
Technical Details: Resolution: 8K, ultra high resolution Aspect Ratio: 9:16 Rendering Engine: Octane Render, Unreal Engine 5 Camera: Macro lens, f/2.8, shallow depth of field`;

        return injectVariables(template, vars);
    }

    /**
     * Blank Sheet Edit Prompt - Used when user has an existing blank sheet and wants to change theme/colors
     */
    function getBlankSheetEditPrompt() {
        const vars = getContextVariables();

        const template = `Recrie essa composição com os seguintes detalhes técnicos:
Tema: {{THEME}}
Paleta de cores: {{COLORS}}
Mantenha a composição, o formato da folha e os adornos nas bordas, apenas alterando as cores e o tema conforme especificado.
CRÍTICO: NÃO inclua NENHUM texto, letra, número ou palavra na imagem - a folha deve permanecer completamente em branco.
Style: Photorealistic, hyper-detailed, cinematic, and elegant.
Technical Details: Resolution: 8K, ultra high resolution Aspect Ratio: 9:16 Rendering Engine: Octane Render, Unreal Engine 5 Camera: Macro lens, f/2.8, shallow depth of field`;

        return injectVariables(template, vars);
    }

    /**
     * Refine Prompt - Used when user wants to adjust specific aspects of an existing image
     * E.g., "Add more blue", "Change to green", "Make it brighter"
     * @param {string} refinementInstruction - The user's specific refinement request
     * @param {string} assetType - 'cover' or 'leaf' to determine NO TEXT rules
     */
    function getRefinePrompt(refinementInstruction, assetType = 'cover') {
        const vars = getContextVariables();
        vars.REFINEMENT = refinementInstruction || 'Refine the colors';

        let noTextRule = '';
        if (assetType === 'cover') {
            noTextRule = `CRÍTICO: NÃO inclua nenhum texto ou palavras na imagem, exceto o número "${vars.SEAL}" no selo de cera.`;
        } else if (assetType === 'leaf') {
            noTextRule = 'CRÍTICO: NÃO inclua NENHUM texto, letra, número ou palavra na imagem - a folha deve permanecer completamente em branco.';
        }

        const template = `Aplique a seguinte modificação nesta imagem:
{{REFINEMENT}}

Mantenha todos os outros elementos da composição intactos.
${noTextRule}
Style: Photorealistic, hyper-detailed, cinematic, and elegant.
Technical Details: Resolution: 8K, ultra high resolution Aspect Ratio: 9:16`;

        return injectVariables(template, vars);
    }

    // Public API
    window.AIPrompts = {
        getCoverPrompt,
        getBlankSheetPrompt,
        getFilledSheetPrompt,
        getOpeningVideoPrompt,
        getLoopVideoPrompt,
        getGiftListPrompt,
        getGuestManualPrompt,
        getDefaultCoverPrompt, // Alias
        getDefaultFillPrompt, // Alias

        // Image Edit Prompts (for modifying existing models)
        getCoverEditPrompt,
        getBlankSheetEditPrompt,

        // Refinement Prompt (for "add more blue", "change to green" commands)
        getRefinePrompt,

        getContextVariables,
        getModelConfig,
        buildGenerationPayload,
        injectVariables
    };

    console.log('[AI Prompts] Module loaded (v4.2.1 - Refinement Mode)');

})();
