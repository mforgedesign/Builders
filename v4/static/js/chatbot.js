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
    }

    // ========================================
    // 2. AUTO FLOW MANAGER (THE BRAIN)
    // ========================================
    class AutoFlowManager {
        constructor() {
            this.isAutoBuilding = false;
            this.waitingFor = new Set(); // Assets we are waiting for
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

            // Step 2: Trigger Initial Assets (Cover & Leaf)
            this.triggerAssetGeneration('cover');
            this.triggerAssetGeneration('leaf');
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
                // Quality Check: If prompt is empty/short, inject Advanced Prompt
                if (promptEl.value.length < 20) {
                    let advancedPrompt = '';
                    if (type === 'cover') advancedPrompt = window.AIPrompts.getCoverPrompt();
                    if (type === 'leaf') advancedPrompt = window.AIPrompts.getBlankSheetPrompt();
                    // Inject
                    if (advancedPrompt) {
                        promptEl.value = advancedPrompt;
                        promptEl.dispatchEvent(new Event('input'));
                        console.log(`[AutoFlow] Injected Advanced Prompt for ${type}`);
                    }
                }

                // Click and Wait
                btnEl.click();
                this.waitingFor.add(type);
                addMessage(`⏳ Gerando ${type}... aguardando conclusão.`, "assistant");
            }
        }

        /**
         * Called by Passive Listener when an asset is ready
         */
        onAssetReady(type) {
            if (!this.isAutoBuilding) return;

            if (this.waitingFor.has(type)) {
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
        initModalBuster() {
            addMessage("🛡️ Monitorando janelas de confirmação...", "assistant");

            let attempts = 0;
            const maxAttempts = 20; // 10 seconds (500ms interval)

            const busterInterval = setInterval(() => {
                attempts++;
                if (attempts > maxAttempts) {
                    clearInterval(busterInterval);
                    return;
                }

                // Strategy: Find any button with specific text that is visible
                const buttons = Array.from(document.querySelectorAll('button'));
                const confirmBtn = buttons.find(btn => {
                    // Check visibility
                    if (btn.offsetParent === null) return false;

                    const text = btn.innerText.toLowerCase();
                    return text.includes('sobrescrever') || text.includes('confirmar') || text.includes('publicar mesmo assim');
                });

                if (confirmBtn) {
                    console.log('[AutoFlow] Blocking Modal detected. Overriding safety...');
                    confirmBtn.click();
                    addMessage("⚠️ Alerta de Slug detectado. Auto-confirmação executada.", "assistant");
                    clearInterval(busterInterval);
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
    // 3. MAIN CHATBOT LOGIC
    // ========================================

    // System Prompt with ALL Fields Mapped & MODULAR BUDGET INFO
    const SYSTEM_PROMPT = `
You are the **AutoBuilder Assistant**, an expert invitation designer.
You have FULL CONTROL over the interface and comprehensive knowledge of MForge pricing.

## 1. CONTROL CAPABILITIES (ACTIONS)
To perform actions on the builder, you must output a **JSON BLOCK** at the very end of your response.
Format:
\`\`\`json
{
  "actions": [
    { "type": "setValue", "id": "FIELD_ID", "value": "VALUE" },
    { "type": "toggle", "id": "CHECKBOX_ID", "value": true }, 
    { "type": "click", "id": "BUTTON_ID" },
    { "type": "autoBuild", "eventName": "NAME" } 
  ]
}
\`\`\`

### ID MAP (Builder Fields):
- **Title**: \`form-nome\`
- **Type**: \`form-tipo_evento\`
- **Date**: \`form-data\`
- **Time**: \`form-hora\`
- **Location**: \`form-local_evento\`
- **Colors**: \`form-paleta_cores\`
- **Phrase**: \`form-frase_convite\`
- **Waiting**: \`form-confirmacao\` (WhatsApp/Link)

## 2. BUSINESS LOGIC
**CRITICAL RULES:**
1. **IGNORE UNSUPPORTED**: "Save The Date", "Abertura Longa", "Lista Vídeo".
2. **ASK LINKS**: If user wants Form (+R$5) or Gallery (+R$10), ASK FOR THE LINK.
3. **AUTO-BUILD**: If user explicitly asks to "Create Everything" or "Build Full Invitation", use action \`autoBuild\`.

**BEHAVIOR - BUILDING**
- Use the JSON actions to help them edit.
- If asking for links (Form/Gallery), wait for user input before trying to fill.
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

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    history: chatHistory.slice(-10),
                    system_prompt: SYSTEM_PROMPT,
                    // Inject Current Context
                    context: contextManager.getSnapshot()
                })
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();

            // Parse JSON Actions
            let aiContent = typeof data === 'string' ? JSON.parse(data) : data;
            let responseText = aiContent.response || aiContent.message || "Olá!";

            const jsonBlock = responseText.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonBlock && jsonBlock[1]) {
                try {
                    const commandData = JSON.parse(jsonBlock[1]);
                    if (commandData.actions) {
                        console.log("[Chatbot] Executing Actions:", commandData.actions);
                        executeBuilderActions(commandData.actions);
                    }
                    responseText = responseText.replace(jsonBlock[0], '').trim();
                } catch (e) { console.error("JSON Parse Error", e); }
            }

            hideTypingIndicator();
            addMessage(formatResponse(responseText), 'assistant');

        } catch (error) {
            hideTypingIndicator();
            console.error('Chat error:', error);
            addMessage(`<span class="text-red-500">Erro: ${error.message}</span>`, 'assistant');
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
        const note = document.createElement('div');
        note.className = 'text-xs text-center text-green-600 mt-2';
        note.innerText = `✅ ${count} campos atualizados`;
        chatMessages.appendChild(note);
    }

    function executeBuilderActions(actions) {
        let fieldCount = 0; // Apenas campos modificados (setValue, toggle)
        actions.forEach(action => {
            if (action.type === 'autoBuild') {
                autoFlow.startAutoCreation(action.eventName || 'Evento');
                return;
            }

            const el = document.getElementById(action.id) || document.querySelector(`[data-field="${action.id}"]`);
            if (!el) return;

            try {
                if (action.type === 'setValue') {
                    el.value = action.value;
                    el.dispatchEvent(new Event('input', { bubbles: true }));
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
                }
            } catch (e) { console.error(e); }
        });
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

    // Listeners initialization
    function init() {
        if (chatSend) chatSend.addEventListener('click', () => sendMessage(chatInput.value));
        if (chatInput) chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(chatInput.value); }
        });
        console.log('✅ Chatbot Brain v4.1 Initialized');
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

})();
