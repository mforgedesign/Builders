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

    /**
     * Sends message to ChatBot API.
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
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    history: chatHistory.slice(-10)
                })
            });

            const data = await response.json();

            hideTypingIndicator();

            if (data.status === 'ok') {
                // Format response with markdown-like parsing
                const formatted = formatResponse(data.response);
                addMessage(formatted, 'assistant');

                // Apply form updates if any
                if (data.form_updates && Object.keys(data.form_updates).length > 0) {
                    applyFormUpdates(data.form_updates);
                }
            } else {
                addMessage(`<span class="text-red-500">Erro: ${data.message || 'Falha na comunicação'}</span>`, 'assistant');
            }

        } catch (error) {
            hideTypingIndicator();
            console.error('Chat error:', error);
            addMessage(`<span class="text-red-500">Erro de conexão. Tente novamente.</span>`, 'assistant');
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
