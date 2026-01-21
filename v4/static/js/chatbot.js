/**
 * AutoBuilder v4.0 - Chatbot Controller
 * =====================================
 * Handles chat interactions with OpenAI GPT-4 backend.
 * Features:
 * - Message sending/receiving
 * - Form auto-fill from AI responses
 * - Drag-drop file handling
 * - Approval cards for prompts
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
    // Message Rendering
    // ========================================

    /**
     * Adds a message bubble to the chat.
     * @param {string} content - Message content (supports HTML)
     * @param {'user'|'assistant'} role - Message sender
     */
    function addMessage(content, role) {
        const isUser = role === 'user';
        const wrapper = document.createElement('div');
        wrapper.className = `flex ${isUser ? 'justify-end' : 'justify-start'}`;

        const bubble = document.createElement('div');
        bubble.className = `max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${isUser
            ? 'bg-brand-600 text-white rounded-tr-none'
            : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none'
            }`;
        bubble.innerHTML = content;

        wrapper.appendChild(bubble);
        chatMessages.appendChild(wrapper);

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Add to history
        chatHistory.push({ role, content: content.replace(/<[^>]*>/g, '') });
    }

    /**
     * Shows typing indicator.
     */
    function showTypingIndicator() {
        const wrapper = document.createElement('div');
        wrapper.id = 'typing-indicator';
        wrapper.className = 'flex justify-start';
        wrapper.innerHTML = `
            <div class="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 text-sm shadow-sm">
                <div class="flex items-center gap-1">
                    <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
                    <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
                    <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
                </div>
            </div>
        `;
        chatMessages.appendChild(wrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function hideTypingIndicator() {
        document.getElementById('typing-indicator')?.remove();
    }

    // ========================================
    // API Communication
    // ========================================

    // OpenAI API Key REVOVED - Implementing Secure Backend Call
    // The System Prompt remains here to define behavior, but execution happens server-side

    // System Prompt with ALL Fields Mapped
    const SYSTEM_PROMPT = `
You are AutoBuilder AI, an expert invitation designer.
Your goal is to help the user build their digital invitation by extracting information and filling the form fields.

RESPONSE FORMAT:
You must ALWAYS return a JSON object with this structure (no markdown code blocks, just raw JSON):
{
  "response": "Your friendly and helpful text response here...",
  "form_updates": {
    "field_name": "value",
    ...
  }
}

MAPPED FIELDS (Use these exact keys in form_updates):

1. IDENTITY:
- "nome": Name of the person/event (e.g., "Julia", "Casamento Ana e Beto")
- "tipo_evento": One of: "Aniversário", "Casamento", "Formatura", "Chá de Bebê", "Corporativo", "Outro"
- "tipo_evento_custom": If type is "Outro", specify here
- "data": Date in YYYY-MM-DD format
- "hora": Time in HH:MM format
- "idade": Age (number, for birthdays)
- "tema_evento": Theme description (e.g., "Tropical", "Minimalist")
- "local_evento": Address or name of the venue
- "paleta_cores": Color palette (e.g., "Gold and White")
- "frase_convite": Optional phrase (e.g., "Join us for this special moment")

2. STYLE & UI:
- "cor_botoes": Hex color (e.g., "#4f46e5")
- "sombra_gradiente": Hex color (e.g., "#000000")
- "posicao_botoes": Number 0-200 (default 50)
- "tamanho_botoes": "pequeno", "medio", or "grande"

3. LINKS & FEATURES:
- "link_google_maps": URL for map
- "link_presentes": URL for gift registry (main button)
- "confirmacao": WhatsApp number or global RSVP URL
- "permitir_acompanhante": boolean (true/false)
- "timer_contagem": boolean (true/false) - Countdown timer
- "watermark_enabled": boolean (true/false) - "Aguardando Pagamento" watermark

4. MANUAL (Guest Guide):
- "manual_instrucoes": Raw text of instructions
- "manual_html": HTML formatted instructions (e.g., "<p><strong>Traje:</strong> Esporte Fino</p>"). Generate this if user provides rules.

5. GIFTS (Lista de Presentes):
- "lista_presentes_link": URL for external gift list (alternate)
- "lista_presentes_texto": List of suggestions (one item per line)

6. PUBLISH:
- "slug": The URL slug (e.g., "julia-15", "casamento-ana"). Must be kebab-case.

BEHAVIOR:
- If the user gives a description, extract as much as possible.
- If data is implicit (e.g., "my 15th birthday"), infer "idade": 15 and "tipo_evento": "Aniversário".
- Only include fields in "form_updates" that are being changed.
- Keep "response" short, encouraging, and ask for missing details.
`;

    /**
     * Sends message to ChatBot API (Supabase Edge Function via Adapter).
     * @param {string} message - User's message
     */
    async function sendMessage(message) {
        if (!message.trim()) return;

        // Add user message
        addMessage(message, 'user');
        chatInput.value = '';
        chatInput.disabled = true;
        chatSend.disabled = true;

        showTypingIndicator();

        try {
            // Using /api/chat which is intercepted by supabase-adapter.js
            // or handled by backend proxy.
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    history: chatHistory.slice(-10),
                    system_prompt: SYSTEM_PROMPT // Pass prompt to backend
                })
            });

            if (!response.ok) {
                let err = {};
                try { err = await response.json(); } catch (e) { }
                throw new Error(err.error || `HTTP ${response.status}`);
            }

            const data = await response.json();

            // The Edge Function should return { response: "...", form_updates: {...} } directly
            // or { status: "ok", ... } depending on adapter.

            let aiContent = data;

            // Normalize response structure
            if (data.status === 'ok' && data.response) {
                // If it's a string containing JSON (common in some raw proxies)
                if (typeof data.response === 'string' && data.response.trim().startsWith('{')) {
                    try {
                        aiContent = JSON.parse(data.response);
                    } catch (e) {
                        aiContent = { response: data.response };
                    }
                } else {
                    aiContent = data; // Assumes data.response is the text and data.form_updates exists
                }
            }

            hideTypingIndicator();

            // Format response
            const responseText = aiContent.response || aiContent.message || "Sem resposta.";
            const formatted = formatResponse(responseText);
            addMessage(formatted, 'assistant');

            // Apply form updates
            if (aiContent.form_updates && Object.keys(aiContent.form_updates).length > 0) {
                console.log('[Chatbot] Applying updates:', aiContent.form_updates);
                applyFormUpdates(aiContent.form_updates);
            }

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

    /**
     * Formats AI response with basic styling.
     */
    function formatResponse(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>')
            .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>');
    }

    // ========================================
    // Form Integration (Two-Way Binding)
    // ========================================

    /**
     * Applies extracted data to form fields.
     * @param {object} updates - Key-value pairs of form field updates
     */
    function applyFormUpdates(updates) {
        let appliedCount = 0;

        for (const [field, value] of Object.entries(updates)) {
            const input = document.querySelector(`[data-field="${field}"]`);
            if (input) {
                input.value = value;
                input.dispatchEvent(new Event('change', { bubbles: true }));
                appliedCount++;
            }
        }

        if (appliedCount > 0) {
            // Show notification
            showFormUpdateNotification(appliedCount);
        }
    }

    function showFormUpdateNotification(count) {
        const notification = document.createElement('div');
        notification.className = 'flex justify-center';
        notification.innerHTML = `
            <div class="bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 text-xs text-green-700 inline-flex items-center gap-1.5">
                <i class="fa-solid fa-check-circle"></i>
                ${count} campo${count > 1 ? 's' : ''} atualizado${count > 1 ? 's' : ''} no formulário
            </div>
        `;
        chatMessages.appendChild(notification);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // ========================================
    // File Handling (Drag & Drop)
    // ========================================

    function setupDragDrop() {
        const container = document.getElementById('chatbot-container');
        if (!container) return;

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            container.classList.add('ring-2', 'ring-brand-500');
        });

        container.addEventListener('dragleave', () => {
            container.classList.remove('ring-2', 'ring-brand-500');
        });

        container.addEventListener('drop', async (e) => {
            e.preventDefault();
            container.classList.remove('ring-2', 'ring-brand-500');

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                await handleFileUpload(files[0]);
            }
        });
    }

    async function handleFileUpload(file) {
        const ext = file.name.split('.').pop().toLowerCase();

        // Determine context based on file type
        let context = '';
        let description = '';

        if (['mp3', 'm4a'].includes(ext)) {
            context = 'musica';
            description = `música "${file.name}"`;
        } else if (['mp4', 'webm'].includes(ext)) {
            context = 'capa'; // Default, could be animation
            description = `vídeo "${file.name}"`;
        } else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
            context = 'capa'; // Default
            description = `imagem "${file.name}"`;
        } else if (ext === 'zip') {
            addMessage(`Arquivo ZIP detectado: ${file.name}`, 'user');
            addMessage('Importação de ZIP será implementada em breve. Por enquanto, use a funcionalidade manual.', 'assistant');
            return;
        } else {
            addMessage(`Arquivo não suportado: ${file.name}`, 'user');
            addMessage('Por favor, envie imagens (PNG, JPG), vídeos (MP4) ou áudios (MP3, M4A).', 'assistant');
            return;
        }

        // Upload file
        addMessage(`Enviando ${description}...`, 'user');
        showTypingIndicator();

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`/api/upload/${context}`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            hideTypingIndicator();

            if (data.status === 'ok') {
                addMessage(`✅ ${description} enviada com sucesso!`, 'assistant');
            } else {
                addMessage(`❌ Erro ao enviar: ${data.message}`, 'assistant');
            }

        } catch (error) {
            hideTypingIndicator();
            addMessage('❌ Erro de conexão ao enviar arquivo.', 'assistant');
        }
    }

    // ========================================
    // Quick Actions (Approval Cards)
    // ========================================

    /**
     * Creates an approval card for AI-generated prompts.
     */
    function createApprovalCard(promptText, targetWindow) {
        const cardHtml = `
            <div class="bg-brand-50 border border-brand-200 rounded-lg p-4">
                <p class="text-xs text-brand-600 font-semibold mb-2">📝 Prompt Sugerido:</p>
                <p class="text-sm text-gray-700 mb-3">${promptText}</p>
                <div class="flex gap-2">
                    <button onclick="approvePrompt('${targetWindow}', \`${promptText.replace(/`/g, "'")}\`)" 
                            class="bg-brand-600 hover:bg-brand-700 text-white text-xs px-3 py-1.5 rounded-full transition">
                        <i class="fa-solid fa-check mr-1"></i> Aprovar
                    </button>
                    <button onclick="editPrompt('${targetWindow}')"
                            class="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs px-3 py-1.5 rounded-full transition">
                        <i class="fa-solid fa-pen mr-1"></i> Editar
                    </button>
                </div>
            </div>
        `;
        addMessage(cardHtml, 'assistant');
    }

    // Expose for onclick handlers
    window.approvePrompt = function (targetWindow, prompt) {
        // Navigate to target window and fill prompt
        const windowBtn = document.querySelector(`[data-window="${targetWindow}"]`);
        if (windowBtn) windowBtn.click();

        // Fill prompt field if exists
        const promptField = document.querySelector(`#${targetWindow}-prompt, #cover-prompt, #leaf-prompt`);
        if (promptField) {
            promptField.value = prompt;
            promptField.dispatchEvent(new Event('input', { bubbles: true }));
        }
    };

    window.editPrompt = function (targetWindow) {
        const windowBtn = document.querySelector(`[data-window="${targetWindow}"]`);
        if (windowBtn) windowBtn.click();
    };

    // ========================================
    // Event Listeners
    // ========================================

    function setupEventListeners() {
        if (!chatInput || !chatSend) return;

        // Send on button click
        chatSend.addEventListener('click', () => {
            sendMessage(chatInput.value);
        });

        // Send on Enter key
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(chatInput.value);
            }
        });

        // Attach button (placeholder)
        if (attachBtn) {
            attachBtn.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*,video/*,audio/*,.zip';
                input.onchange = (e) => {
                    if (e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                    }
                };
                input.click();
            });
        }
    }

    // ========================================
    // Initialization
    // ========================================

    function init() {
        setupEventListeners();
        setupDragDrop();
        console.log('✅ Chatbot controller initialized');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose for debugging
    window.AutoBuilderChat = {
        sendMessage,
        addMessage,
        createApprovalCard,
        applyFormUpdates
    };

})();
