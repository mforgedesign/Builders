/**
 * AutoBuilder v4.0 - Chatbot Controller (Autonomous & Passive)
 * =====================================
 * Handles chat interactions, autonomous building flows, and passive context awareness.
 * 
 * Features:
 * - Autonomous Flow Manager (Slug -> Cover -> Leaf -> Animation -> Build)
 * - Passive Context Awareness (Ghost Mode)
 * - Logic-Aware Prompt Engineering
 */

(function () {
    'use strict';

    // DOM Elements
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const attachBtn = document.querySelector('[data-window="chat"] .fa-paperclip')?.parentElement;

    // Chat history for context
    let chatHistory = [];

    // Ensure Global Namespace Exists
    window.AutoBuilderChatbot = window.AutoBuilderChatbot || {};

    // ========================================
    // 1. CONTEXT MANAGER (PASSIVE AWARENESS)
    // ========================================
    class ContextManager {
        constructor() {
            this.context = {
                currentStep: 1,
                lastAction: null,
                uploadedAssets: {},
                formData: {}
            };
            this.setupPassiveListeners();
        }

        setupPassiveListeners() {
            // Listen for input changes (Text fields)
            document.addEventListener('input', (e) => {
                if (e.target.dataset.field) {
                    this.context.formData[e.target.dataset.field] = e.target.value;
                    this.context.lastAction = `Edited ${e.target.dataset.field}`;
                }
            });

            // Listen for toggle changes
            document.addEventListener('change', (e) => {
                if (e.target.dataset.field) {
                    this.context.formData[e.target.dataset.field] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                }
            });

            // Listen for Asset Updates (Manual & AI)
            document.addEventListener('builder:asset_ready', (e) => {
                const { type, url, method } = e.detail;
                this.context.uploadedAssets[type] = url;
                console.log(`[Ghost] Asset ready: ${type} (${method})`);

                // Notify Flow Manager if it's waiting
                window.AutoFlow.onAssetReady(type);
            });
        }

        getSnapshot() {
            return {
                ...this.context,
                builderState: window.builderState || {}
            };
        }

        clearContext() {
            this.context = {
                currentStep: 1,
                lastAction: 'Reset',
                uploadedAssets: {},
                formData: {}
            };
            console.log("[ContextManager] State Reset");
        }
    }

    // ========================================
    // 2. AUTO FLOW MANAGER (THE BRAIN)
    // ========================================
    const ASSET_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes per asset

    class AutoFlowManager {
        constructor() {
            this.isAutoBuilding = false;
            this.waitingFor = new Set(); // Assets we are waiting for
            this.assetTimeouts = new Map(); // Timeout IDs for each asset
            this.slugConfig = null;
        }

        /**
         * Starts the Autonomous Creation Loop
         * @param {string} eventName - Base name for slug generation
         */
        async startAutoCreation(eventName) {
            if (this.isAutoBuilding) return;
            this.isAutoBuilding = true;
            addMessage("🤖 Iniciando Criação Autônoma...", "assistant");

            // Step 1: Slug Audit
            const slug = await this.auditSlug(eventName);
            if (!slug) {
                addMessage("❌ Não foi possível definir um slug seguro. Abortando.", "assistant");
                this.isAutoBuilding = false;
                return;
            }

            // Set Slug in UI
            const slugInput = document.getElementById('slug-input');
            if (slugInput) {
                slugInput.value = slug;
                slugInput.dispatchEvent(new Event('input'));
            }
            addMessage(`✅ Slug definido: <strong>${slug}</strong>`, "assistant");

            // Step 2: Select Music (Perfect Violin)
            const perfectSample = document.querySelector('[data-name="Perfect (Violin Cover)"]');
            if (perfectSample) {
                const selectBtn = perfectSample.querySelector('.sample-select-btn');
                if (selectBtn) {
                    selectBtn.click();
                    addMessage(`🎵 Música selecionada: Perfect (Violin)`, "assistant");
                }
            }

            // Step 3: Trigger Initial Assets (Cover & Leaf)
            this.triggerAssetGeneration('cover');
            this.triggerAssetGeneration('leaf');
        }

        /**
         * Checks if an asset type already has an existing image (e.g., from imported model)
         * Used to decide between generation prompt vs edit prompt
         */
        checkExistingAsset(type) {
            const dropzoneIdMap = {
                'cover': 'cover-dropzone',
                'leaf': 'leaf-dropzone',
                'fill': 'fill-image-dropzone',
                'gifts': 'gifts-image-dropzone'
            };

            const dropzoneId = dropzoneIdMap[type];
            if (!dropzoneId) return false;

            const dropzone = document.getElementById(dropzoneId);
            if (!dropzone) return false;

            // Check if dropzone has background-image set (indicating an existing image)
            const bgImage = dropzone.style.backgroundImage;
            return bgImage && bgImage.includes('url(') && bgImage !== 'none';
        }

        /**
         * Checks permissions and existing assets before clicking Generate
         * Applies Advanced Prompts if needed.
         */
        triggerAssetGeneration(type) {
            const promptIdMap = {
                'cover': 'cover-prompt',
                'leaf': 'leaf-prompt',
                'intro': 'intro-motion-prompt',
                'loop': 'loop-motion-prompt',
                'fill': 'fill-prompt',
                'gifts': 'gifts-image-prompt'
            };

            const btnIdMap = {
                'cover': 'btn-generate-cover',
                'leaf': 'btn-generate-leaf',
                'intro': 'btn-generate-intro',
                'loop': 'btn-generate-loop',
                'fill': 'btn-generate-fill',
                'gifts': 'gifts-generate-image-btn'
            };

            const promptEl = document.getElementById(promptIdMap[type]);
            const btnEl = document.getElementById(btnIdMap[type]);

            if (promptEl && btnEl) {
                // Check if there's an existing image (from imported model)
                const hasExistingImage = this.checkExistingAsset(type);

                // Quality Check: If prompt is empty/short, inject Advanced Prompt
                if (promptEl.value.length < 20) {
                    let advancedPrompt = '';

                    if (type === 'cover') {
                        // Use Edit prompt if we have an existing image, otherwise use generation prompt
                        advancedPrompt = hasExistingImage
                            ? window.AIPrompts.getCoverEditPrompt()
                            : window.AIPrompts.getCoverPrompt();
                    }
                    if (type === 'leaf') {
                        advancedPrompt = hasExistingImage
                            ? window.AIPrompts.getBlankSheetEditPrompt()
                            : window.AIPrompts.getBlankSheetPrompt();
                    }

                    // Inject
                    if (advancedPrompt) {
                        promptEl.value = advancedPrompt;
                        promptEl.dispatchEvent(new Event('input'));
                        console.log(`[AutoFlow] Injected ${hasExistingImage ? 'EDIT' : 'GENERATION'} Prompt for ${type}`);
                    }
                }

                // Click and Wait
                btnEl.click();
                this.waitingFor.add(type);
                addMessage(`⏳ Gerando ${type}... (timeout: 3min)`, "assistant");

                // Set timeout for this asset
                const timeoutId = setTimeout(() => {
                    if (this.waitingFor.has(type)) {
                        this.waitingFor.delete(type);
                        addMessage(`⚠️ Timeout: ${type} não concluído em 3 minutos. Continuando...`, "assistant");
                        // Trigger next steps anyway
                        if (type === 'cover') setTimeout(() => this.triggerAssetGeneration('intro'), 500);
                        if (type === 'leaf') setTimeout(() => this.triggerLoopGeneration(), 500);
                        this.checkCompletion();
                    }
                }, ASSET_TIMEOUT_MS);
                this.assetTimeouts.set(type, timeoutId);
            }
        }

        /**
         * Called by Passive Listener when an asset is ready
         */
        onAssetReady(type) {
            if (!this.isAutoBuilding) return;

            if (this.waitingFor.has(type)) {
                // Clear timeout since asset completed
                if (this.assetTimeouts.has(type)) {
                    clearTimeout(this.assetTimeouts.get(type));
                    this.assetTimeouts.delete(type);
                }
                this.waitingFor.delete(type);
                addMessage(`✨ ${type} concluído!`, "assistant");

                // SEQUENTIAL LOGIC (The Domino Effect)
                if (type === 'cover') {
                    // Capa ready -> Do Intro
                    setTimeout(() => this.triggerAssetGeneration('intro'), 1000);
                }
                if (type === 'leaf') {
                    // Leaf ready -> Do Loop & Fill & Gifts
                    setTimeout(() => this.triggerLoopGeneration(), 1000);
                }

                // Check for completion logic
                this.checkCompletion();
            }
        }

        triggerLoopGeneration() {
            // Need to separate layers first? Usually handled by 'leaf'.
            // Assuming direct generation for now or 'Preenchimento'
            this.triggerAssetGeneration('fill');
            // Gifts requires background_only usually, assuming leaf handles it or loop uses it
            // Trigger gifts if needed
            this.triggerAssetGeneration('gifts');
        }

        checkCompletion() {
            // If waiting set is empty, we might be done? 
            if (this.waitingFor.size === 0) {
                addMessage("✅ Todos os assets solicitados foram processados.", "assistant");
                addMessage("🚀 Iniciando publicação automática...", "assistant");
                this.handlePublish();
            }
        }

        async handlePublish() {
            const publishBtn = document.getElementById('btn-publish');
            if (publishBtn) {
                publishBtn.click();

                // Initialize Modal Buster (Auto-Confirm Logic)
                this.initModalBuster();
            } else {
                addMessage("❌ Botão de publicar não encontrado.", "assistant");
            }
            this.isAutoBuilding = false; // Release control after triggering
        }

        /**
         * SAFETY OVERRIDE: Watches for blocking modals (Slug Exists) and auto-confirms them
         * This is necessary because the Chatbot needs full autonomy.
         */
        /**
         * SAFETY OVERRIDE: Watches for blocking modals and auto-confirms them.
         * For publication confirmation, shows a 30s countdown in the chat.
         */
        initModalBuster() {
            addMessage("🛡️ Monitorando janelas de confirmação...", "assistant");

            let attempts = 0;
            const maxAttempts = 120; // 60 seconds (500ms interval)
            let countdownActive = false;
            let countdownSeconds = 30;
            let countdownMsgId = null;

            const busterInterval = setInterval(() => {
                attempts++;
                if (attempts > maxAttempts) {
                    clearInterval(busterInterval);
                    return;
                }

                // Find modal buttons
                const buttons = Array.from(document.querySelectorAll('button'));
                const visibleButtons = buttons.filter(btn => btn.offsetParent !== null);

                // 1. Detect Overwrite/Safety Modals (Immediate confirm)
                const safetyBtn = visibleButtons.find(btn => {
                    const text = btn.innerText.toLowerCase();
                    return text.includes('sobrescrever') || text.includes('publicar mesmo assim') || text.includes('sim, publicar');
                });

                if (safetyBtn) {
                    console.log('[AutoFlow] Safety Modal detected. Confirming...');
                    safetyBtn.click();
                    addMessage("⚠️ Alerta de segurança detectado. Auto-confirmação executada.", "assistant");
                    clearInterval(busterInterval);
                    return;
                }

                // 2. Detect Publication Modal (30s Countdown)
                const publishConfirmBtn = visibleButtons.find(btn => btn.innerText.trim() === 'Publicar' && btn.classList.contains('bg-brand-600') || btn.classList.contains('bg-indigo-600') || btn.classList.contains('bg-blue-600'));

                if (publishConfirmBtn && !countdownActive) {
                    countdownActive = true;
                    console.log('[AutoFlow] Publication Modal detected. Starting 30s countdown...');

                    const updateCountdown = () => {
                        if (countdownSeconds <= 0) {
                            clearInterval(busterInterval);
                            publishConfirmBtn.click();
                            addMessage("🚀 Publicação confirmada automaticamente.", "assistant");
                            return;
                        }

                        const msgText = `⏳ Publicação automática em <strong>${countdownSeconds}s</strong>...`;
                        if (!countdownMsgId) {
                            countdownMsgId = addMessage(msgText, "assistant");
                        } else {
                            // Update existing message if possible (UI limitation: addMessage returns void in this simple impl)
                            // So we just add a new one every 10s or keep it simple
                            if (countdownSeconds % 10 === 0) {
                                addMessage(msgText, "assistant");
                            }
                        }

                        countdownSeconds--;
                        setTimeout(updateCountdown, 1000);
                    };

                    updateCountdown();
                }
            }, 500);
        }

        /**
         * Audits slug availability
         */
        async auditSlug(baseName) {
            const cleanName = baseName.toLowerCase().replace(/[^a-z0-9]/g, '');
            const candidates = [
                `${cleanName}`,
                `${cleanName}15anos`,
                `15anos${cleanName}`,
                `${cleanName}-15`,
                `convite-${cleanName}`,
                `${cleanName}-official`
            ];

            addMessage(`🔍 Buscando o melhor slug para "${cleanName}"...`, "assistant");

            for (const candidate of candidates) {
                const isAvailable = await this.checkGithub(candidate);
                if (isAvailable) return candidate;
            }

            return `${cleanName}-${Date.now().toString().slice(-4)}`; // Fallback unique
        }

        async checkGithub(slug) {
            // Priority 1: Use Adapter API (List Contents) - Accurate
            if (window.githubAdapter && window.githubAdapter.checkFolderExists) {
                try {
                    const exists = await window.githubAdapter.checkFolderExists(slug);
                    return !exists; // If folder exists, it is NOT available
                } catch (e) {
                    console.warn('[AutoFlow] API Check failed, falling back to HTTP', e);
                }
            }

            // Priority 2: Fallback to HTTP Head (Less reliable but good enough for new sites)
            try {
                const res = await fetch(`https://mforgedesign.github.io/Convites/${slug}/`, { method: 'HEAD' });
                return (res.status === 404);
            } catch (e) { return true; }
        }
    }

    // ========================================
    // MASTER SYSTEM PROMPT - AutoBuilder AI v4.2
    // ========================================
    const SYSTEM_PROMPT = `
You are **AutoBuilder AI**, an expert digital invitation designer.
You have FULL CONTROL over the builder interface and can fill forms, import models, and trigger actions.

## RESPONSE FORMAT
You MUST return a valid JSON object (no markdown, no code blocks):
{
  "message": "Sua resposta amigável em português...",
  "actions": [
    { "type": "setValue", "id": "FIELD_ID", "value": "VALUE" },
    { "type": "toggle", "id": "CHECKBOX_ID", "value": true },
    { "type": "click", "id": "BUTTON_ID" },
    { "type": "importModel", "url": "https://...", "modifications": false },
    { "type": "autoBuild", "eventName": "NAME" }
  ]
}

## FIELD ID MAP (Use these EXACT IDs)
### Identity & Event Details:
- form-nome → Name(s) of honoree(s)
- form-tipo_evento → Event type: "Aniversário", "Casamento", "15 Anos / Debutante", "Formatura", "Chá de Bebê", "Corporativo", "Outro"
- form-idade → Age (number, for birthdays)
- form-data → Event date (YYYY-MM-DD format)
- form-hora → Event time (HH:MM format)
- form-local_evento → Full address or venue name
- form-tema_evento → Theme (e.g., "Flores Rosas", "Tropical", "Disney")
- form-paleta_cores → Color palette (e.g., "Rosa dourado", "Azul e prata")
- form-frase_convite → Invitation phrase/tagline

### Style & UI:
- form-cor_botoes → Button color (hex, e.g., "#d4af37")
- form-sombra_gradiente → Shadow/gradient color (hex)
- form-posicao_botoes → Button position (number 0-200, default 100)
- form-tamanho_botoes → Button size: "pequeno", "medio", "grande"

### Links & Features:
- form-link_google_maps → Google Maps URL
- form-link_presentes → Main gift list URL
- form-confirmacao → RSVP: WhatsApp number OR form URL (if starts with http, opens link; otherwise WhatsApp)
- form-permitir_acompanhante → Checkbox: Allow plus-one (true/false)
- form-timer_contagem → Checkbox: Show countdown timer (true/false)
- form-watermark_enabled → Checkbox: Show "Awaiting Payment" watermark (true/false)

### Manual (Guest Guide):
- manual-raw-text → Raw text instructions (dress code, parking, etc.)
- manual-html-editor → The generated HTML code for the manual (Use the "Standard Template" below if needed)

### Gifts:
- gifts-suggestions → Gift suggestions text (one per line)
- gifts-link-input → External gift list URL

### Publish:
- slug-input → URL slug (kebab-case, e.g., "isadora-15anos")

## DETECTING MODEL IMPORT
If the user's message contains a URL like:
- https://convites.mforge.com.br/SLUG/
- https://MODEL-NAME.netlify.app/
- https://mforgedesign.github.io/Convites/SLUG/

Then IMMEDIATELY use:
{ "type": "importModel", "url": "THE_URL", "modifications": BOOLEAN }

**When modifications = true:**
- User requested different colors, theme, or explicit changes
- The original cover will be moved to "Reference" slot for the AI to use as inspiration

**When modifications = false:**
- User wants to keep the model as-is (only fill in event details)
- Cover, intro video, and blank sheet are preserved

## PARSING BUDGET INPUT (ORÇAMENTO)
When user pastes a budget/order like:
\`\`\`
*ORCAMENTO DE CONVITE*
*FUNCOES SELECIONADAS:*
- Abertura Envelope e Folha com Botões - R$ 60,00
- Formulário de Confirmação de Presença - R$ 5,00
*MODELO ESCOLHIDO:*
Rosa e Dourado
https://model-niver-rosadourado-sarah-longo.netlify.app/
*DADOS DO EVENTO:*
- Nome(s): ISADORA
- Tipo: 15 Anos / Debutante
...
\`\`\`

You MUST:
1. Extract the model URL → call importModel
2. Parse "DADOS DO EVENTO" → generate setValue actions for each field
3. Generate a unique slug from the name (e.g., "isadora-15anos")
4. Check if any modifications are needed (different palette/theme from model)

## BUSINESS RULES
1. **RSVP Priority**: If both "Formulário de Confirmação" and WhatsApp are mentioned, USE THE FORM URL (link prevails over WhatsApp number)
2. **Music Selection**: ALWAYS select "Perfect (Violin)" as the music by adding action: { "type": "selectMusic", "sample": "perfect-violin" }. Ignore any music the client requests in the budget (the builder cannot download external songs).
3. **Slug Generation**: Create from name + event type, lowercase, no special chars (e.g., "casamento-ana-joao", "15anos-isadora")
4. **Skip Assets**: If model already has cover/intro/sheet, conserve them unless user explicitly asks for changes
5. **Tiered Features**:
   - "Abertura Envelope" → Cover + Intro animation
   - "Folha com Botões" → Filled sheet + Buttons
   - "Sugestão de Presentes" → Gifts image/list
   - "Confirmação pelo WhatsApp" → WhatsApp RSVP
   - "Formulário de Confirmação" → Form URL RSVP (PRIORITY over WhatsApp)

## REFINEMENT COMMANDS
When user says things like:
- "Adicione mais azul"
- "Mude a cor para verde"  
- "Coloque mais flores"
- "Deixe mais claro"
- "Troque o rosa por roxo"

Use the action:
{ "type": "refineAsset", "assetType": "cover" OR "leaf", "instruction": "USER'S INSTRUCTION" }

This will take the current image and apply the refinement via image-to-image AI editing.

## BEHAVIOR GUIDELINES
- Respond in **Portuguese (Brazil)**, friendly and professional
- If information is missing, ASK before filling (especially: date, time, location)
- If user provides a URL, detect if it's a model and import it
- For birthday events, infer "Aniversário" and ask for age if not provided
- For "15 Anos" or "Debutante", set tipo_evento to "15 Anos / Debutante" and idade to 15
- Always generate a slug automatically when filling name
- Keep responses SHORT - focus on actions, not explanations

## MANUAL HTML DRAFT (Standard Template)
If the user asks to "generate the manual" or if you are creating a complete invitation, use this boilerplate for the manual-html-editor field (adjusting icons to the theme):

<p><i class='fa-solid fa-shirt'></i> <strong>Dress Code:</strong> Traje Esporte Fino</p>
<p><i class='fa-solid fa-location-dot'></i> <strong>Estacionamento:</strong> No local</p>
<p><i class='fa-solid fa-clock'></i> <strong>Horário:</strong> Chegar com 15 min de antecedência</p>
<p><i class='fa-solid fa-gift'></i> <strong>Presentes:</strong> Sugestões na aba "Presentes"</p>

## FULL AUTO-BUILD (Criação Completa até Publicar)
When user says things like:
- "Cria tudo até publicar"
- "Faz o convite completo"
- "Gera e publica automaticamente"

Use the action:
{ "type": "autoBuild", "eventName": "NAME" }

This triggers the FULL FLOW:
1. Audits slug availability (generates unique if taken)
2. Generates Cover + Blank Sheet (uses AI prompts)
3. Waits for assets to complete
4. Generates Intro Animation + Filled Sheet + Gifts
5. Auto-publishes to GitHub
6. Modal Buster auto-confirms any popups (e.g., "slug exists")

**IMPORTANT**: Before calling autoBuild, you MUST fill all form fields first (name, date, type, etc.), otherwise the AI prompts won't have context.

## EXAMPLE INTERACTION
User: "Cria um convite baseado nesse modelo https://model-test.netlify.app/ para Maria, 15 anos, dia 20/05/2026"

Response:
{
  "message": "Entendido! Importando o modelo e preenchendo os dados da Maria.",
  "actions": [
    { "type": "importModel", "url": "https://model-test.netlify.app/", "modifications": false },
    { "type": "setValue", "id": "form-nome", "value": "MARIA" },
    { "type": "setValue", "id": "form-tipo_evento", "value": "15 Anos / Debutante" },
    { "type": "setValue", "id": "form-idade", "value": "15" },
    { "type": "setValue", "id": "form-data", "value": "2026-05-20" },
    { "type": "setValue", "id": "slug-input", "value": "maria-15anos" }
  ]
}
`;

    // Initialize Managers
    const contextManager = new ContextManager();
    const autoFlow = new AutoFlowManager();
    window.AutoFlow = autoFlow; // Expose for listeners

    /**
     * Sends message to ChatBot API (Supabase Edge Function via Adapter).
     */
    async function sendMessage(message) {
        if (!message.trim()) return;

        addMessage(message, 'user');
        chatInput.value = '';
        chatInput.disabled = true;
        chatSend.disabled = true;

        showTypingIndicator();

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s Timeout

        try {
            if (!window.supabaseClient) throw new Error("Supabase client not initialized");

            const { data, error } = await window.supabaseClient.functions.invoke('chatbot-intent', {
                body: {
                    message,
                    history: chatHistory.slice(-10),
                    // Let Edge Function use its own updated System Prompt, BUT passing ours is safer for now as it contains the JSON schema instructions
                    system_prompt: SYSTEM_PROMPT,
                    // Inject Current Context
                    context: contextManager.getSnapshot()
                }
            });

            clearTimeout(timeoutId); // Clear timeout on response

            if (error) throw new Error(error.message || "Erro na conexão com API de Chat");

            // Parse response - handles both direct JSON and wrapper
            let aiContent = typeof data === 'string' ? JSON.parse(data) : data;

            // The Edge Function returns { status: 'ok', response: '...' }
            // The 'response' field contains the AI's JSON output as a string
            let rawAiResponse = aiContent.response || aiContent.message || aiContent;

            // If it's a string, try to parse it as JSON
            let parsedResponse;
            if (typeof rawAiResponse === 'string') {
                try {
                    parsedResponse = JSON.parse(rawAiResponse);
                } catch (e) {
                    // Not valid JSON, treat as plain text
                    parsedResponse = { message: rawAiResponse };
                }
            } else {
                parsedResponse = rawAiResponse;
            }

            console.log("[Chatbot] Parsed AI Response:", parsedResponse);

            // Execute actions if present
            let actionsExecuted = 0;
            if (parsedResponse.actions && Array.isArray(parsedResponse.actions)) {
                console.log("[Chatbot] Executing Actions:", parsedResponse.actions);
                actionsExecuted = parsedResponse.actions.length;
                executeBuilderActions(parsedResponse.actions);
            }

            // Also check for markdown-wrapped JSON (legacy support)
            let displayText = parsedResponse.message || parsedResponse.reply || "";
            const jsonBlock = displayText.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonBlock && jsonBlock[1]) {
                try {
                    const commandData = JSON.parse(jsonBlock[1]);
                    if (commandData.actions) {
                        console.log("[Chatbot] Executing Markdown Actions:", commandData.actions);
                        executeBuilderActions(commandData.actions);
                        actionsExecuted += commandData.actions.length;
                    }
                    displayText = displayText.replace(jsonBlock[0], '').trim();
                } catch (e) { console.error("JSON Parse Error", e); }
            }

            hideTypingIndicator();

            // Show user-friendly message
            if (actionsExecuted > 0) {
                addMessage(`✅ <strong>Entendido!</strong> Preenchendo ${actionsExecuted} campos...`, 'assistant');
            } else if (displayText) {
                addMessage(formatResponse(displayText), 'assistant');
            } else {
                addMessage("✅ Comando processado!", 'assistant');
            }

        } catch (error) {
            clearTimeout(timeoutId);
            hideTypingIndicator();
            console.error('Chat error:', error);

            let userMsg = `Erro: ${error.message}`;
            if (error.name === 'AbortError') {
                userMsg = "O servidor demorou muito para responder. Tente novamente.";
            }

            addMessage(`<span class="text-red-500">${userMsg}</span>`, 'assistant');
        } finally {
            chatInput.disabled = false;
            chatSend.disabled = false;
            chatInput.focus();
        }
    }

    // ... (Keep existing UI helpers: addMessage, showTypingIndicator, formatResponse, showFormUpdateNotification)
    // Re-implementing simplified versions for brevity in this replace block, 
    // strictly adhering to the "replace entire file" instruction to ensure consistency.

    function addMessage(content, role) {
        const isUser = role === 'user';
        const wrapper = document.createElement('div');
        wrapper.className = `flex ${isUser ? 'justify-end' : 'justify-start'}`;
        const bubble = document.createElement('div');
        bubble.className = `max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${isUser ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none'}`;
        bubble.innerHTML = content;
        wrapper.appendChild(bubble);
        chatMessages.appendChild(wrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        chatHistory.push({ role, content: content.replace(/<[^>]*>/g, '') });
    }

    function showTypingIndicator() {
        const wrapper = document.createElement('div');
        wrapper.id = 'typing-indicator';
        wrapper.innerHTML = '<div class="px-4 py-2 text-xs text-gray-400">Digitando...</div>';
        chatMessages.appendChild(wrapper);
    }
    function hideTypingIndicator() { document.getElementById('typing-indicator')?.remove(); }
    function formatResponse(text) { return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>'); }

    function showFormUpdateNotification(count) {
        if (count > 0) {
            addMessage(`✅ <strong>Dados Aplicados!</strong><br>${count} campos do formulário foram preenchidos.`, 'assistant');
        }
    }

    async function executeBuilderActions(actions) {
        let fieldCount = 0; // Apenas campos modificados (setValue, toggle)
        for (const action of actions) {
            if (action.type === 'autoBuild') {
                autoFlow.startAutoCreation(action.eventName || 'Evento');
                continue;
            }

            if (action.type === 'importModel') {
                if (window.importFromRemoteURL) {
                    addMessage(`📦 <strong>Baixando modelo...</strong><br>${action.url}`, "assistant");
                    const result = await window.importFromRemoteURL(action.url, action.modifications);

                    if (result && result.success) {
                        // Push context to history so LLM "sees" it occurred
                        chatHistory.push({
                            role: 'system',
                            content: `[SYSTEM] Model imported successfully. Cover redirected: ${result.coverRedirected}. Modifications applied.`
                        });

                        if (result.coverRedirected) {
                            addMessage('✅ <strong>Modelo Carregado!</strong><br>A capa original foi movida para "Referência" para não sobrescrever sua nova criação.', "assistant");
                        } else if (action.modifications) {
                            addMessage('✅ Modelo base importado. Editando...', "assistant");
                        } else {
                            addMessage('✅ Importado com sucesso!', "assistant");
                        }
                    } else {
                        addMessage('❌ Houve um erro na importação.', "assistant");
                    }
                } else {
                    addMessage("❌ Erro: Função de importação não carregada.", "assistant");
                }
                continue;
            }

            const el = document.getElementById(action.id) || document.querySelector(`[data-field="${action.id}"]`);
            if (!el) {
                // Only warn if action needs ID
                if (['setValue', 'click', 'toggle'].includes(action.type)) {
                    console.warn(`[Chatbot] Element not found for action: ${action.id}`);
                }
                continue;
            }

            try {
                if (action.type === 'setValue') {
                    // PROTECTION REFINEMENT:
                    // Skip empty values if element already has content, 
                    // UNLESS the chat history suggests we are starting over or an import just happened.
                    const isEmptyValue = action.value === null || action.value === undefined || action.value === '';
                    const hasExistingValue = el.value && el.value.trim() !== '';

                    // Check if there was a recent 'importModel' or 'autoBuild' action in the queue
                    // or if the assistant message explicitly mentioned a "new" creation.
                    const isNewCreation = actions.some(a => a.type === 'importModel' || a.type === 'autoBuild');

                    if (isEmptyValue && hasExistingValue && !isNewCreation) {
                        console.log(`[Chatbot] Skipping empty setValue for "${action.id}" (preserving existing value: "${el.value.substring(0, 30)}...")`);
                        continue;
                    }

                    // Special handling for Color Inputs (ensure format and events)
                    if (el.type === 'color' || el.id.includes('cor') || el.id.includes('sombra')) {
                        // Ensure valid hex
                        if (action.value && action.value.startsWith('#') && (action.value.length === 7 || action.value.length === 4)) {
                            el.value = action.value;
                            // Color pickers often need 'input' to update preview and 'change' to commit
                            el.dispatchEvent(new Event('input', { bubbles: true }));
                            el.dispatchEvent(new Event('change', { bubbles: true }));
                        } else {
                            console.warn(`[Chatbot] Invalid color value: ${action.value} for ${action.id}`);
                        }
                    } else {
                        el.value = action.value;
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        // Text inputs might need 'change' for verify/formatting logic
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    fieldCount++;
                } else if (action.type === 'toggle') {
                    if (el.type === 'checkbox') {
                        el.checked = (action.value === true);
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                    } else el.click();
                    fieldCount++;
                } else if (action.type === 'click') {
                    el.click();

                    // Se clicou em btn-publish, ativar Modal Buster para auto-confirmar popups
                    if (action.id === 'btn-publish') {
                        addMessage("🚀 Publicando convite...", "assistant");
                        initModalBusterEnhanced();
                    }
                    // Cliques não contam como campos atualizados
                } else if (action.type === 'importModel') {
                    if (window.importFromRemoteURL) {
                        addMessage(`📦 <strong>Baixando modelo...</strong><br>${action.url}`, "assistant");
                        await window.importFromRemoteURL(action.url, action.modifications);
                    } else {
                        addMessage("❌ Erro: Função de importação não carregada.", "assistant");
                    }
                } else if (action.type === 'selectMusic') {
                    // Select Perfect (Violin) sample
                    const perfectSample = document.querySelector('[data-name="Perfect (Violin Cover)"]');
                    if (perfectSample) {
                        const selectBtn = perfectSample.querySelector('.sample-select-btn');
                        if (selectBtn) {
                            selectBtn.click();
                            console.log('[Chatbot] Selected Perfect (Violin) music');
                        }
                    }
                } else if (action.type === 'refineAsset') {
                    // Refine existing asset with user's instruction
                    const assetType = action.assetType || 'cover';
                    const instruction = action.instruction || 'Melhore as cores';

                    // Generate refinement prompt
                    const refinePrompt = window.AIPrompts.getRefinePrompt(instruction, assetType);

                    // Find the prompt textarea and button
                    const promptIdMap = {
                        'cover': 'cover-prompt',
                        'leaf': 'leaf-prompt'
                    };
                    const btnIdMap = {
                        'cover': 'btn-generate-cover',
                        'leaf': 'btn-generate-leaf'
                    };

                    const promptEl = document.getElementById(promptIdMap[assetType]);
                    const btnEl = document.getElementById(btnIdMap[assetType]);

                    if (promptEl && btnEl) {
                        // Inject the refinement prompt
                        promptEl.value = refinePrompt;
                        promptEl.dispatchEvent(new Event('input'));

                        addMessage(`🎨 Aplicando refinamento: "${instruction}"`, "assistant");

                        // Click generate button
                        btnEl.click();
                    } else {
                        addMessage(`❌ Erro: Não foi possível encontrar o asset "${assetType}" para refinar.`, "assistant");
                    }
                }
            } catch (e) { console.error(e); }
        }
        // Só mostra notificação se realmente modificou campos
        if (fieldCount > 0) showFormUpdateNotification(fieldCount);
    }

    /**
     * Enhanced Modal Buster - Fecha popup e mostra confirmação inline no chat
     */
    function initModalBusterEnhanced() {
        let searchAttempts = 0;
        const maxSearchAttempts = 120; // 60 seconds searching for popup

        const busterInterval = setInterval(() => {
            searchAttempts++;

            if (searchAttempts > maxSearchAttempts) {
                clearInterval(busterInterval);
                return;
            }

            // Procura por botões de confirmação visíveis (no popup)
            const buttons = Array.from(document.querySelectorAll('button'));
            const confirmBtn = buttons.find(btn => {
                if (btn.offsetParent === null) return false;
                const text = btn.innerText.toLowerCase();
                return text.includes('sobrescrever') ||
                    text.includes('publicar mesmo assim') ||
                    text.includes('sim, publicar');
            });

            // Também procura o botão Cancelar do popup
            const cancelBtn = buttons.find(btn => {
                if (btn.offsetParent === null) return false;
                const text = btn.innerText.toLowerCase();
                return text === 'cancelar' && btn.closest('.fixed');
            });

            if (confirmBtn && cancelBtn) {
                clearInterval(busterInterval);
                console.log('[ModalBuster] Popup detectado! Fechando e mostrando confirmação inline...');

                // Fecha o popup clicando em cancelar
                cancelBtn.click();

                // Mostra confirmação inline no chat
                showInlineChatConfirmation(confirmBtn);
            }
        }, 500);
    }

    /**
     * Mostra confirmação inline no chat com timer de 30s e botões
     */
    function showInlineChatConfirmation(originalConfirmBtn) {
        let countdown = 30;
        const confirmId = `confirm-${Date.now()}`;

        // Cria o card de confirmação
        const wrapper = document.createElement('div');
        wrapper.className = 'flex justify-start';
        wrapper.id = confirmId;
        wrapper.innerHTML = `
            <div class="max-w-[90%] rounded-2xl px-4 py-4 shadow-lg bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-tl-none">
                <div class="flex items-center gap-2 mb-2">
                    <i class="fa-solid fa-triangle-exclamation text-amber-500"></i>
                    <strong class="text-amber-800">Slug já existe!</strong>
                </div>
                <p class="text-sm text-gray-600 mb-3">O convite será sobrescrito. Confirmar publicação?</p>
                <div class="flex items-center justify-between">
                    <div class="flex gap-2">
                        <button id="${confirmId}-yes" class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium text-sm transition-colors">
                            <i class="fa-solid fa-check mr-1"></i> Sobrescrever
                        </button>
                        <button id="${confirmId}-no" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium text-sm transition-colors">
                            Cancelar
                        </button>
                    </div>
                    <div class="text-right">
                        <span id="${confirmId}-timer" class="text-2xl font-bold text-amber-600">30</span>
                        <span class="text-xs text-gray-500 block">segundos</span>
                    </div>
                </div>
            </div>
        `;

        chatMessages.appendChild(wrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        const timerEl = document.getElementById(`${confirmId}-timer`);
        const yesBtn = document.getElementById(`${confirmId}-yes`);
        const noBtn = document.getElementById(`${confirmId}-no`);

        let confirmed = false;
        let cancelled = false;

        // Timer de countdown
        const countdownInterval = setInterval(() => {
            countdown--;
            if (timerEl) timerEl.textContent = countdown;

            if (countdown <= 0) {
                clearInterval(countdownInterval);
                if (!confirmed && !cancelled) {
                    // Auto-confirmar
                    executePublishConfirmation();
                }
            }

            // Cor muda quando fica crítico
            if (countdown <= 10 && timerEl) {
                timerEl.classList.remove('text-amber-600');
                timerEl.classList.add('text-red-500');
            }
        }, 1000);

        // Ação de confirmar
        function executePublishConfirmation() {
            confirmed = true;
            wrapper.innerHTML = `
                <div class="max-w-[80%] rounded-2xl px-4 py-3 shadow-sm bg-green-50 border border-green-200 rounded-tl-none">
                    <i class="fa-solid fa-check text-green-500 mr-2"></i>
                    <span class="text-green-700">Publicação confirmada! Sobrescrevendo...</span>
                </div>
            `;
            // Clica no botão de publicar novamente para reabrir o popup
            const publishBtn = document.getElementById('btn-publish');
            if (publishBtn) {
                publishBtn.click();
                // Agora auto-confirma o popup imediatamente
                setTimeout(() => {
                    const btns = Array.from(document.querySelectorAll('button'));
                    const realConfirm = btns.find(b => b.innerText.toLowerCase().includes('sobrescrever'));
                    if (realConfirm) realConfirm.click();
                }, 500);
            }
        }

        // Ação de cancelar
        function executeCancellation() {
            cancelled = true;
            clearInterval(countdownInterval);
            wrapper.innerHTML = `
                <div class="max-w-[80%] rounded-2xl px-4 py-3 shadow-sm bg-gray-50 border border-gray-200 rounded-tl-none">
                    <i class="fa-solid fa-xmark text-gray-400 mr-2"></i>
                    <span class="text-gray-600">Publicação cancelada pelo usuário.</span>
                </div>
            `;
        }

        // Event listeners
        yesBtn?.addEventListener('click', executePublishConfirmation);
        noBtn?.addEventListener('click', executeCancellation);

        // Auto-cancelar se usuário modificar algo no builder
        const formInputs = document.querySelectorAll('input, textarea, select');
        const cancelOnChange = () => {
            if (!confirmed && !cancelled) {
                executeCancellation();
                addMessage("↩️ Confirmação cancelada automaticamente (você modificou algo no builder).", "assistant");
            }
            formInputs.forEach(el => el.removeEventListener('input', cancelOnChange));
        };
        formInputs.forEach(el => el.addEventListener('input', cancelOnChange, { once: true }));
    }

    // ========================================
    // 4. FILE UPLOAD HANDLING
    // ========================================
    function handleFiles(files) {
        if (!files || files.length === 0) return;

        addMessage(`📂 Processando ${files.length} arquivo(s)...`, 'assistant');

        // Separate by type
        const audios = files.filter(f => f.type.startsWith('audio/'));
        const videos = files.filter(f => f.type.startsWith('video/'));
        const images = files.filter(f => f.type.startsWith('image/'));

        // 1. Handle Audios (Auto)
        audios.forEach(file => {
            if (window.updateDropzonePreview) {
                // Use a dedicated context or logic. 'musica' context.
                // We need to pass the file object. 
                // Assuming updateDropzonePreview handles URLs mostly, but we can pass object URL.
                const url = URL.createObjectURL(file);
                // Find dropzone
                const musicDz = document.getElementById('music-dropzone');
                if (musicDz) {
                    window.updateDropzonePreview(musicDz, url, 'audio');
                    // Set name in input if exists
                    const musicInput = document.getElementById('music-name-display');
                    if (musicInput) musicInput.value = file.name;
                    addMessage(`🎵 Música definida: <strong>${file.name}</strong>`, 'assistant');
                }
            }
        });

        // 2. Handle Videos (Decision Queue)
        if (videos.length > 0) {
            processVideoQueue(videos);
        }

        // 3. Handle Images (Decision Queue)
        if (images.length > 0) {
            processImageQueue(images);
        }
    }

    function processVideoQueue(videos) {
        // Smart Logic: If 2 videos, ask for first, auto-assign second.
        let remaining = [...videos];

        const askNext = () => {
            if (remaining.length === 0) return;

            const current = remaining.shift();
            const url = URL.createObjectURL(current);

            // Check if we can smart-assign the last one
            // (Not implemented fully for simplicity, just ask all for now unless requested)

            const msgId = 'vid-' + Date.now();
            const html = `
                <div class="chat-upload-card" id="${msgId}">
                    <video src="${url}" class="rounded h-auto" style="max-height: 120px; max-width: 100%;" autoplay muted loop></video>
                    <p class="text-[10px] text-gray-500 mb-1.5 uppercase font-bold text-center">Vídeo Detectado</p>
                    <div class="flex flex-col gap-1 w-full">
                        <button class="btn-xs bg-brand-600 text-white w-full" onclick="window.AutoBuilderChatbot.assignAsset('${msgId}', '${url}', 'vid_abertura', 'video')">Usar na Abertura</button>
                        <button class="btn-xs bg-gray-100 hover:bg-brand-100 text-gray-700 w-full" onclick="window.AutoBuilderChatbot.assignAsset('${msgId}', '${url}', 'fundo_tela', 'video')">Usar no Fundo</button>
                    </div>
                </div>
             `;
            addMessage(html, 'assistant', true); // true = raw HTML
        };

        askNext(); // Start with first. 
        // Note: Logic to show next needs a callback.
        // We can expose assignAsset to handle the next step.
    }

    function processImageQueue(images) {
        let remaining = [...images];

        // We attach the queue to window to persist state across clicks
        window.AutoBuilderChatbot.imageQueue = remaining;
        window.AutoBuilderChatbot.processNextImage();
    }

    // Expose helpers
    window.AutoBuilderChatbot.assignAsset = (msgId, url, context, type = 'image') => {
        console.log(`[Chatbot] Assigning asset: ${context} (${type})`, url);

        // 1. Find Dropzone for visual update
        let dzId = '';
        if (context === 'vid_abertura') dzId = 'intro-video-dropzone';
        if (context === 'fundo_tela') dzId = 'fill-image-dropzone';
        if (context === 'capa') dzId = 'cover-dropzone';
        if (context === 'folha_vazia' || context === 'folha') dzId = 'leaf-dropzone';
        if (context === 'folha_preenchida') dzId = 'fill-image-dropzone';
        if (context === 'presentes') dzId = 'gifts-image-dropzone';
        if (context === 'manual') dzId = 'manual-image-dropzone';

        const dz = document.getElementById(dzId);
        if (dz && window.updateDropzonePreview) {
            window.updateDropzonePreview(dz, url, type);
        }

        // 2. Critical: Update Builder State & Preview
        if (window.AutoBuilderForm) {
            // Map chatbot terminology to form field names
            const fieldMap = {
                'vid_abertura': 'vid_abertura',
                'fundo_tela': 'fundo_tela',
                'capa': 'capa',
                'folha': 'folha_vazia',
                'folha_vazia': 'folha_vazia',
                'folha_preenchida': 'fundo_tela',
                'presentes': 'presentes',
                'manual': 'manual'
            };

            const fieldName = fieldMap[context] || context;
            window.AutoBuilderForm.updateField(fieldName, url);
            console.log(`[Chatbot] Builder form updated: ${fieldName}`);
        }

        // 3. Sync with windows.js internal state (builderState)
        if (!window.builderState) window.builderState = { assets: {} };
        if (!window.builderState.assets) window.builderState.assets = {};

        const stateKeyMap = {
            'vid_abertura': 'vid_abertura',
            'fundo_tela': 'fundo_tela',
            'capa': 'capa',
            'folha': 'folha_vazia',
            'folha_vazia': 'folha_vazia',
            'folha_preenchida': 'fundo_tela',
            'presentes': 'presentes',
            'manual': 'manual'
        };
        const stateKey = stateKeyMap[context] || context;
        window.builderState.assets[stateKey] = url;

        // 4. Dispatch Event for awareness (matches windows.js behavior)
        document.dispatchEvent(new CustomEvent('builder:asset_ready', {
            detail: { type: stateKey, url: url, method: 'chatbot' }
        }));

        // Remove card buttons or whole card
        const card = document.getElementById(msgId);
        if (card) {
            card.innerHTML = `<div class="text-green-600 text-[10px] font-bold py-1"><i class="fa-solid fa-check"></i> DEFINIDO EM: ${context.toUpperCase()}</div>`;
            setTimeout(() => card.style.opacity = '0.5', 1000);
        }

        // Trigger next if any
        if (window.AutoBuilderChatbot.imageQueue && window.AutoBuilderChatbot.imageQueue.length > 0) {
            setTimeout(() => window.AutoBuilderChatbot.processNextImage(), 500);
        }
    };

    window.AutoBuilderChatbot.processNextImage = () => {
        const queue = window.AutoBuilderChatbot.imageQueue;
        if (!queue || queue.length === 0) return;

        const current = queue.shift();
        const url = URL.createObjectURL(current);
        const msgId = 'img-' + Date.now();

        const html = `
            <div class="chat-upload-card" id="${msgId}">
                <img src="${url}" class="rounded h-auto" style="max-height: 120px; max-width: 100%;">
                <p class="text-[10px] text-gray-500 mb-1.5 uppercase font-bold text-center">Imagem Detectada</p>
                <div class="grid grid-cols-2 gap-1 w-full">
                    <button class="btn-xs bg-brand-600 text-white" onclick="window.AutoBuilderChatbot.assignAsset('${msgId}', '${url}', 'capa', 'image')">Capa</button>
                    <button class="btn-xs bg-saas-sidebar text-white" onclick="window.AutoBuilderChatbot.assignAsset('${msgId}', '${url}', 'folha', 'image')">Folha Vaz.</button>
                    <button class="btn-xs bg-gray-100 hover:bg-brand-100 text-gray-700" onclick="window.AutoBuilderChatbot.assignAsset('${msgId}', '${url}', 'folha_preenchida', 'image')">Preencher</button>
                    <button class="btn-xs bg-gray-100 hover:bg-brand-100 text-gray-700" onclick="window.AutoBuilderChatbot.assignAsset('${msgId}', '${url}', 'presentes', 'image')">Presentes</button>
                    <button class="btn-xs bg-gray-100 hover:bg-brand-100 text-gray-700 col-span-2" onclick="window.AutoBuilderChatbot.assignAsset('${msgId}', '${url}', 'manual', 'image')">Manual</button>
                </div>
            </div>
         `;
        addMessage(html, 'assistant', true);
    };

    // Listeners initialization
    function init() {
        if (chatSend) chatSend.addEventListener('click', () => sendMessage(chatInput.value));
        if (chatInput) chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(chatInput.value); }
        });


        // Attach Button Handler
        const attachBtn = document.getElementById('chat-attach-btn');
        const fileInput = document.getElementById('chat-file-input');

        if (attachBtn && fileInput) {
            attachBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => handleFiles(Array.from(e.target.files)));
        }

        // Drag & Drop Handler
        const chatContainer = document.querySelector('.chat-window') || document.body;
        chatContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            chatContainer.classList.add('drag-over');
        });
        chatContainer.addEventListener('dragleave', () => chatContainer.classList.remove('drag-over'));
        chatContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            chatContainer.classList.remove('drag-over');
            if (e.dataTransfer.files.length > 0) {
                handleFiles(Array.from(e.dataTransfer.files));
            }
        });

        // Initialize Managers

        // autoFlow.startMonitoring();

        // Expose API for external control (like Context Reset)
        if (!window.AutoBuilderChatbot.resetContext) {
            Object.assign(window.AutoBuilderChatbot, {
                resetContext: () => {
                    contextManager.clearContext();
                    addMessage("🧹 Contexto do chat limpo para novo convite.", "assistant");
                    console.log("[Chatbot] Contexto limpo via AutoBuilderChatbot.");
                }
            });
        }

        // Listen for GitHub Deploy Status Events (from GitHubAdapter)
        window.addEventListener('gh-deploy-status', (e) => {
            const { status, message, url, slug, progress } = e.detail;

            if (status === 'start') {
                addMessage(`🚀 <strong>Iniciando publicação...</strong><br><span class="text-xs text-gray-500">Preparando arquivos...</span>`, "assistant");
            } else if (status === 'progress') {
                // Optional: Update ephemeral progress if needed
                // console.log(`[Deploy Progress] ${message}`);
            } else if (status === 'success') {
                const whatsappText = encodeURIComponent(`Veja meu convite especial: ${url}`);
                const adminUrl = `https://github.com/mforgedesign/Convites/tree/main/${slug}`;

                const successHtml = `
                    <div class="bg-green-50 border border-green-200 rounded-xl p-4 mt-2 shadow-sm animate-fade-in">
                        <div class="flex items-center gap-2 mb-3">
                            <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <i class="fa-solid fa-check text-green-600"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-green-800 text-sm">Convite Publicado!</h3>
                                <p class="text-xs text-green-600">Pronto para compartilhar</p>
                            </div>
                        </div>
                        
                        <div class="space-y-2">
                            <button onclick="window.open('${url}', '_blank')" class="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition-colors text-sm shadow-sm">
                                <i class="fa-solid fa-up-right-from-square"></i> Abrir Convite
                            </button>
                            
                            <div class="flex gap-2">
                                <button onclick="window.open('https://wa.me/?text=${whatsappText}', '_blank')" class="flex-1 flex items-center justify-center gap-1 bg-[#25D366] hover:bg-[#128C7E] text-white font-medium py-2 rounded-lg transition-colors text-sm shadow-sm">
                                    <i class="fa-brands fa-whatsapp"></i> WhatsApp
                                </button>
                                <button onclick="window.open('${adminUrl}', '_blank')" class="flex-1 flex items-center justify-center gap-1 bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 rounded-lg transition-colors text-sm shadow-sm">
                                    <i class="fa-brands fa-github"></i> Admin
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                addMessage(successHtml, "assistant");
            } else if (status === 'error') {
                addMessage(`❌ <strong>Erro na publicação:</strong> ${message}`, "assistant");
            }
        });

        console.log('✅ Chatbot Brain v4.1 Initialized');
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

})();
