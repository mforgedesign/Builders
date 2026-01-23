# Documentação do Chatbot IA - AutoBuilder v4/v5

**Versão:** 1.0  
**Data:** 2026-01-16  
**Status:** Em Desenvolvimento  

---

## 1. VISÃO GERAL

### 1.1 Propósito
O Chatbot é o **orquestrador central** do AutoBuilder. Não é apenas uma interface de texto, mas um **agente autônomo** com permissões de leitura/escrita no estado global do builder.

### 1.2 Funcionalidades Principais
- Comunicação via linguagem natural
- Controle total de todos os elementos da interface
- Geração de assets via APIs (Gemini/GPT)
- Persistência de contexto entre sessões
- Integração bidirecional com formulário
- Exibição de botões, imagens e carrosséis interativos
- Tratamento inteligente de erros

---

## 2. ARQUITETURA DO SISTEMA

### 2.1 Fluxo de Request

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Usuário   │───▶│   Gemini    │───▶│  Resposta   │
│   (Input)   │    │    API      │    │             │
└─────────────┘    └──────┬──────┘    └─────────────┘
                          │ FALHA
                          ▼
                   ┌─────────────┐
                   │   OpenAI    │
                   │   GPT-4     │
                   └─────────────┘
```

### 2.2 Prioridade de APIs
1. **Primário:** Google Gemini API
2. **Fallback:** OpenAI GPT-4

### 2.3 Context Payload
Cada request deve incluir:
```javascript
{
  "conversation": [...], // Histórico completo da conversa atual
  "systemPrompt": "...", // Prompt Master (instruções do chatbot)
  "builderState": {...}, // Estado atual do formulário
  "assets": [...],       // URLs/base64 de imagens no builder
  "currentWindow": "...", // Janela ativa ("form", "cover", etc.)
  "timestamp": "..."
}
```

---

## 3. PROMPT MASTER (System Instruction)

```
Você é o **AutoBuilder AI**, assistente especializado em design e engenharia de convites digitais interativos.

**SUAS CAPACIDADES:**
1. Ler/escrever no estado global do builder (formData, assets, toggles)
2. Navegar entre janelas do builder
3. Gerar prompts para APIs de imagem/vídeo
4. Importar e filtrar convites do histórico
5. Configurar cada elemento da interface

**REGRAS DE OURO:**
1. Sempre pedir confirmação antes de gastar créditos
2. Oferecer alternativa gratuita (Gemini, Dreamina) quando aplicável
3. Explicar erros em linguagem acessível
4. Manter contexto da tarefa atual
5. Desativar botões/interações antigas quando mudar de assunto

**TOM DE VOZ:** Profissional, criativo, direto. Evite jargões técnicos.
```

---

## 4. MAPEAMENTO DE UI (Interface Elements)

### 4.1 Formulário - Campos Editáveis pelo Chatbot

| Campo ID | Data Field | Tipo | Descrição |
|----------|------------|------|-----------|
| `form-nome` | `nome` | text | Nome do aniversariante/casal |
| `form-tipo_evento` | `tipo_evento` | select | Tipo (Aniversário, Casamento, etc.) |
| `form-data` | `data` | date | Data do evento |
| `form-hora` | `hora` | time | Hora do evento |
| `form-idade` | `idade` | number | Idade (para aniversários) |
| `form-tema_evento` | `tema_evento` | text | Tema visual |
| `form-local_evento` | `local_evento` | text | Nome/endereço do local |
| `form-paleta_cores` | `paleta_cores` | text | Cores principais |
| `form-frase_convite` | `frase_convite` | textarea | Frase personalizada |
| `form-cor_botoes` | `cor_botoes` | color | Cor dos botões |
| `form-sombra_gradiente` | `sombra_gradiente` | color | Sombra inferior |
| `form-posicao_botoes` | `posicao_botoes` | range | Posição bottom (0-200px) |
| `form-tamanho_botoes` | `tamanho_botoes` | select | Pequeno/Médio/Grande |
| `form-link_google_maps` | `link_google_maps` | url | Link do Google Maps |
| `form-link_presentes` | `link_presentes` | url | Link lista de presentes |
| `form-manual_content` | `manual_content` | textarea | HTML do manual |
| `form-numero_whatsapp` | `numero_whatsapp` | tel | Número para RSVP |
| `form-link_confirmacao` | `link_confirmacao` | url | Link alternativo RSVP |
| `form-permitir_acompanhante` | `permitir_acompanhante` | checkbox | Toggle acompanhantes |
| `form-timer_contagem` | `timer_contagem` | checkbox | Toggle countdown |

### 4.2 Dropzones (Upload Areas)

> [!IMPORTANT]
> **FUNCIONAMENTO ATUAL DO BACKGROUND (fundo_tela)**  
> O sistema foi **simplificado** em relação ao doc bruto. Não existe mais:
> - ~`vid_loop`~ (vídeo loop separado)
> - ~`fill-video-dropzone`~ (dropzone separado para vídeo)
> - ~Geração de "video loop"~
> 
> O `fill-image-dropzone` aceita **IMAGEM OU VÍDEO** de forma unificada. A extensão é detectada automaticamente na publicação.

| Dropzone ID | Context | Tipo | Janela | Observação |
|-------------|---------|------|--------|------------|
| `cover-dropzone` | `capa` | image | Capa | Envelope/capa do convite |
| `cover-reference-dropzone` | `capa_referencia` | image | Capa | Ref. para geração IA |
| `leaf-dropzone` | `folha_vazia` | image | Folha Vazia | Folha base (ex: convite sobre mesa) |
| `intro-video-dropzone` | `vid_abertura` | video | Animação | Vídeo de abertura (abre envelope) |
| `fill-image-dropzone` | `fundo_tela` | **image/video** | Preencher Folha | **UNIFICADO**: JPG, PNG ou MP4 |
| `dropzone-leaf-only` | `folha_only` | image | Folha Vazia | Folha extraída (sem fundo) |
| `dropzone-background-only` | `background_only` | image | Folha Vazia | Fundo extraído (sem folha) |
| `gifts-image-dropzone` | `presentes` | image | Presentes | Imagem lista de presentes |
| `manual-image-dropzone` | `manual` | image | Manual | Imagem do manual |
| `music-dropzone` | `musica` | audio | Música | MP3 de fundo |

#### Lógica de Normalização de Contextos (Legacy)

O código atual normaliza contextos legados para o novo padrão:
```javascript
// Em restoreBuilderState (windows.js ~linha 900)
if (context === 'folha_preenchida') context = 'fundo_tela';
if (context === 'background') context = 'fundo_tela';
if (context === 'vid_loop') context = 'fundo_tela';  // ← Legado convertido
```

#### Detecção Automática de Tipo na Publicação

```javascript
// Em publishToGitHub (windows.js ~linha 1850)
if (config.ext === 'auto') {
  if (blob.type.includes('video')) config.ext = 'mp4';
  else if (blob.type.includes('image')) config.ext = 'png';
}
```

### 4.3 Janelas (Windows)

| Window ID | Data-Window | Título |
|-----------|-------------|--------|
| `chatbot-container` | `chat` | Chatbot |
| `window-history` | `history` | Histórico |
| `window-form` | `form` | Formulário |
| `window-cover` | `cover` | Capa |
| `window-leaf` | `leaf` | Folha Vazia |
| `window-video_intro` | `video_intro` | Animação |
| `window-fill_leaf` | `fill_leaf` | Preencher |
| `window-gifts` | `gifts` | Presentes |
| `window-manual` | `manual` | Manual |
| `window-music` | `music` | Música |
| `window-finalize` | `finalize` | Finalizar |

### 4.4 Toggles de Modo

| Toggle ID | Modos | Janela |
|-----------|-------|--------|
| `manual-mode-*` | `text`, `image` | Manual |
| `gifts-mode-*` | `link`, `image` | Presentes |
| `animate-background-toggle` | on/off | Folha Vazia |
| `watermark-toggle` | on/off | Finalizar |

---

## 5. SISTEMA DE COMANDOS NLP

### 5.1 Categorias de Intenções

#### A. Navegação
- "Abra a janela da capa" → `switchWindow('cover')`
- "Vá para o formulário" → `switchWindow('form')`
- "Mostre o histórico" → `switchWindow('history')`

#### B. Preenchimento de Dados
- "O nome é Julia" → `updateField('nome', 'Julia')`
- "O evento é dia 15/03" → `updateField('data', '2026-03-15')`
- "Tema tropical com cores azul e verde" → Multiple updates

#### C. Upload/Geração
- "Use esta imagem como capa" → Inject to `cover-dropzone`
- "Gere uma capa tropical" → Trigger AI generation
- "Anime o fundo" → Process background animation

#### D. Configuração
- "Mude a cor dos botões para rosa" → `updateField('cor_botoes', '#FF69B4')`
- "Ative o timer" → `setToggle('timer_contagem', true)`
- "Mude para modo imagem no manual" → `setMode('manual', 'image')`

#### E. Histórico/Importação
- "Quais convites de 15 anos eu tenho?" → Filter + Carousel
- "Importe o convite da Julia" → `History.importInvitation(slug)`

#### F. Publicação
- "Publicar agora" → `triggerPublish()`
- "Mostre a prévia" → `triggerPreview()`

### 5.2 Upload de Múltiplos Arquivos com Detecção Inteligente

O chatbot aceita múltiplos arquivos simultaneamente e identifica automaticamente onde cada um deve ser anexado no builder.

#### A. Prioridade de Detecção

```
┌──────────────────────────────────────────────────────────────────┐
│                   ORDEM DE DETECÇÃO                              │
├──────────────────────────────────────────────────────────────────┤
│  1. TIPO DO ARQUIVO (mais confiável)                            │
│     • .mp4/.webm → vid_abertura (vídeo de abertura)             │
│     • .mp3/.m4a → musica                                        │
│     • .png/.jpg/.jpeg/.webp → análise nome/contexto             │
│                                                                  │
│  2. NOME DO ARQUIVO (segundo mais confiável)                    │
│     • *capa*, *cover*, *envelope* → capa                        │
│     • *folha*, *sheet*, *convite* → folha_vazia                 │
│     • *fundo*, *background*, *back* → fundo_tela                │
│     • *presentes*, *gifts*, *lista* → presentes                 │
│     • *manual*, *instrucoes* → manual                           │
│     • *musica*, *music*, *audio* → musica                       │
│                                                                  │
│  3. CONTEXTO DA CONVERSA (fallback inteligente)                 │
│     • Janela ativa ou último assunto discutido                  │
│     • Pergunta ao usuário se ambíguo                            │
└──────────────────────────────────────────────────────────────────┘
```

#### B. Fluxo de Processamento

```javascript
/**
 * Processa múltiplos arquivos anexados ao chat
 * @param {FileList|File[]} files - Lista de arquivos
 */
async function handleMultipleFileUpload(files) {
  const results = [];
  const ambiguous = [];
  
  for (const file of files) {
    const detection = detectFileContext(file);
    
    if (detection.confidence >= 0.8) {
      // Alta confiança: anexa automaticamente
      results.push({
        file,
        context: detection.context,
        confidence: detection.confidence,
        reason: detection.reason
      });
    } else {
      // Baixa confiança: guarda para perguntar
      ambiguous.push({
        file,
        suggestions: detection.suggestions
      });
    }
  }
  
  // Processa arquivos com alta confiança
  if (results.length > 0) {
    await processConfidentFiles(results);
  }
  
  // Pergunta sobre arquivos ambíguos
  if (ambiguous.length > 0) {
    await askAboutAmbiguousFiles(ambiguous);
  }
}
```

#### C. Detecção de Contexto

```javascript
/**
 * Detecta onde o arquivo deve ser anexado
 * @param {File} file
 * @returns {{ context: string, confidence: number, reason: string, suggestions: string[] }}
 */
function detectFileContext(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const name = file.name.toLowerCase();
  
  // 1. ÁUDIO: sempre música (máxima confiança)
  if (['mp3', 'm4a', 'wav', 'ogg'].includes(ext)) {
    return {
      context: 'musica',
      confidence: 0.95,
      reason: 'Áudio detectado → Música de Fundo',
      suggestions: []
    };
  }
  
  // 2. VÍDEO: verificar NOME para decidir destino
  if (['mp4', 'webm', 'mov'].includes(ext)) {
    // Patterns que indicam abertura/intro
    const introPatterns = ['intro', 'abertura', 'open', 'entrada', 'initial'];
    // Patterns que indicam fundo/background
    const fundoPatterns = ['fundo', 'background', 'bg', 'loop', 'back'];
    
    if (introPatterns.some(p => name.includes(p))) {
      return {
        context: 'vid_abertura',
        confidence: 0.90,
        reason: `Vídeo detectado + nome contém "${introPatterns.find(p => name.includes(p))}" → Abertura`,
        suggestions: []
      };
    }
    
    if (fundoPatterns.some(p => name.includes(p))) {
      return {
        context: 'fundo_tela',  // UNIFICADO: aceita vídeo também!
        confidence: 0.90,
        reason: `Vídeo detectado + nome contém "${fundoPatterns.find(p => name.includes(p))}" → Fundo`,
        suggestions: []
      };
    }
    
    // Vídeo sem nome descritivo: preferência para abertura, mas perguntar
    return {
      context: null,
      confidence: 0.5,
      reason: 'Vídeo detectado, mas destino incerto',
      suggestions: ['vid_abertura', 'fundo_tela']  // Oferece as duas opções
    };
  }
  
  // 2. DETECÇÃO POR NOME (alta confiança)
  const namePatterns = {
    capa: ['capa', 'cover', 'envelope', 'frente', 'front'],
    folha_vazia: ['folha', 'sheet', 'convite', 'invitation', 'base'],
    fundo_tela: ['fundo', 'background', 'back', 'bg', 'preenchida'],
    presentes: ['presente', 'gift', 'lista', 'pix', 'pagamento'],
    manual: ['manual', 'instrucao', 'instruction', 'guia', 'guide']
  };
  
  for (const [context, patterns] of Object.entries(namePatterns)) {
    if (patterns.some(p => name.includes(p))) {
      return {
        context,
        confidence: 0.85,
        reason: `Nome contém "${patterns.find(p => name.includes(p))}"`,
        suggestions: []
      };
    }
  }
  
  // 3. DETECÇÃO POR CONTEXTO (média confiança)
  const currentWindow = getCurrentWindow();
  const lastContext = ButtonManager.currentContext;
  
  // Mapeia janela/contexto para dropzone
  const windowToContext = {
    'cover': 'capa',
    'leaf': 'folha_vazia',
    'fill_leaf': 'fundo_tela',
    'gifts': 'presentes',
    'manual': 'manual',
    'music': 'musica',
    'video_intro': 'vid_abertura'
  };
  
  if (windowToContext[currentWindow]) {
    return {
      context: windowToContext[currentWindow],
      confidence: 0.6,
      reason: `Janela ativa: ${currentWindow}`,
      suggestions: Object.keys(namePatterns) // Mostra todas as opções
    };
  }
  
  // 4. AMBÍGUO: pedir confirmação
  return {
    context: null,
    confidence: 0,
    reason: 'Não foi possível determinar automaticamente',
    suggestions: ['capa', 'folha_vazia', 'fundo_tela', 'presentes', 'manual']
  };
}
```

#### D. Card de Confirmação para Arquivos Ambíguos

```javascript
function askAboutAmbiguousFiles(ambiguous) {
  const html = ambiguous.map(({ file, suggestions }) => `
    <div class="file-assign-card" data-filename="${file.name}">
      <div class="file-preview">
        ${file.type.startsWith('image') 
          ? `<img src="${URL.createObjectURL(file)}" alt="${file.name}">`
          : `<i class="fa-solid fa-file"></i>`
        }
      </div>
      <div class="file-info">
        <strong>${file.name}</strong>
        <p class="file-question">Onde devo colocar este arquivo?</p>
        <div class="file-options">
          ${suggestions.map(s => `
            <button 
              class="option-btn"
              onclick="ChatBot.assignFile('${file.name}', '${s}')"
            >
              ${getContextLabel(s)}
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `).join('');
  
  ChatBot.addMessage(`
    <div class="ambiguous-files-container">
      <p>📎 Recebi ${ambiguous.length} arquivo(s) que preciso de ajuda para identificar:</p>
      ${html}
    </div>
  `, 'assistant');
}

function getContextLabel(context) {
  const labels = {
    'capa': '🖼️ Capa',
    'folha_vazia': '📄 Folha Vazia',
    'fundo_tela': '🎨 Fundo/Preenchida',
    'presentes': '🎁 Presentes',
    'manual': '📖 Manual',
    'vid_abertura': '🎥 Vídeo Abertura',
    'musica': '🎵 Música'
  };
  return labels[context] || context;
}
```

#### E. Exibição de Upload Múltiplo no Chat

```
┌─────────────────────────────────────────────────────────────────┐
│ USUÁRIO: *anexa 4 arquivos de uma vez*                          │
├─────────────────────────────────────────────────────────────────┤
│ CHATBOT:                                                        │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📎 Recebi 4 arquivos! Processando...                        │ │
│ │                                                             │ │
│ │ ✅ entrada.mp4 → Vídeo de Abertura (detectado)             │ │
│ │ ✅ musica_festa.mp3 → Música (detectado)                   │ │
│ │ ✅ capa_julia.png → Capa (nome contém "capa")              │ │
│ │                                                             │ │
│ │ ❓ imagem_01.jpg → Onde devo colocar?                       │ │
│ │    [🖼️ Capa] [📄 Folha] [🎨 Fundo] [🎁 Presentes]          │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ USUÁRIO: *clica em "📄 Folha"*                                  │
├─────────────────────────────────────────────────────────────────┤
│ CHATBOT: "✅ Todos os arquivos foram anexados!"                 │
│                                                                 │
│ • Capa: capa_julia.png                                          │
│ • Folha Vazia: imagem_01.jpg                                    │
│ • Vídeo de Abertura: entrada.mp4                                │
│ • Música: musica_festa.mp3                                      │
│                                                                 │
│ "Quer que eu mostre a prévia do convite?"                       │
│ [👀 Ver Prévia]  [✏️ Continuar Editando]                       │
└─────────────────────────────────────────────────────────────────┘
```

#### F. Processamento e Injeção nos Dropzones

```javascript
/**
 * Injeta arquivo no dropzone correto
 * @param {File} file
 * @param {string} context
 */
async function injectFileToDropzone(file, context) {
  const dropzoneMap = {
    'capa': 'cover-dropzone',
    'folha_vazia': 'leaf-dropzone',
    'fundo_tela': 'fill-image-dropzone',
    'vid_abertura': 'intro-video-dropzone',
    'presentes': 'gifts-image-dropzone',
    'manual': 'manual-image-dropzone',
    'musica': 'music-dropzone'
  };
  
  const dropzoneId = dropzoneMap[context];
  const dropzone = document.getElementById(dropzoneId);
  
  if (!dropzone) {
    console.error(`Dropzone not found: ${dropzoneId}`);
    return false;
  }
  
  // Cria preview
  const url = URL.createObjectURL(file);
  const type = file.type.startsWith('video') ? 'video' : 
               file.type.startsWith('audio') ? 'audio' : 'image';
  
  // Atualiza visual do dropzone
  if (window.updateDropzonePreview) {
    window.updateDropzonePreview(dropzone, url, type);
  }
  
  // Salva no estado global
  if (!window.builderState) window.builderState = {};
  if (!window.builderState.assets) window.builderState.assets = {};
  window.builderState.assets[context] = file;
  
  // Dispara evento para persistência
  document.dispatchEvent(new CustomEvent('mediaUpdated', {
    detail: { type: context, data: { url, file, blob: file } }
  }));
  
  // Salva no IndexedDB
  if (window.Persistence?.processAsset) {
    await window.Persistence.processAsset(context, file);
  }
  
  console.log(`✅ File injected: ${file.name} → ${context}`);
  return true;
}
```

#### G. Integração com Input de Anexo

```javascript
// Modificação do input de anexo para suportar múltiplos arquivos
function setupMultipleFileInput() {
  const attachBtn = document.querySelector('[data-window="chat"] .fa-paperclip')?.parentElement;
  
  if (attachBtn) {
    attachBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true; // HABILITA MÚLTIPLOS
      input.accept = 'image/*,video/*,audio/*,.zip';
      
      input.onchange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
          // Mostra feedback imediato
          ChatBot.addMessage(`📎 Processando ${files.length} arquivo(s)...`, 'user');
          
          // Processa todos
          await handleMultipleFileUpload(files);
        }
      };
      
      input.click();
    });
  }
}

// Suporte a drag-and-drop múltiplo
function setupMultipleDragDrop() {
  const chatContainer = document.getElementById('chatbot-container');
  
  chatContainer.addEventListener('drop', async (e) => {
    e.preventDefault();
    chatContainer.classList.remove('ring-2', 'ring-brand-500');
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      ChatBot.addMessage(`📎 Processando ${files.length} arquivo(s)...`, 'user');
      await handleMultipleFileUpload(files);
    }
  });
}
```

#### H. Resposta Contextual Pós-Upload

```javascript
/**
 * Após processar todos os arquivos, dá feedback contextual
 */
function showUploadSummary(processedFiles) {
  const byContext = {};
  processedFiles.forEach(({ file, context }) => {
    byContext[context] = file.name;
  });
  
  let html = '<div class="upload-summary"><h4>✅ Arquivos Anexados</h4><ul>';
  
  for (const [context, filename] of Object.entries(byContext)) {
    html += `<li><strong>${getContextLabel(context)}:</strong> ${filename}</li>`;
  }
  
  html += '</ul>';
  
  // Sugestões baseadas no que ainda falta
  const missing = detectMissingAssets();
  if (missing.length > 0) {
    html += `<p class="missing-note">💡 Ainda falta: ${missing.map(getContextLabel).join(', ')}</p>`;
  }
  
  html += '</div>';
  
  ChatBot.addMessage(html, 'assistant');
  
  // Oferece próximos passos
  ChatBot.addMessage(`
    <div class="next-steps">
      <p>O que você gostaria de fazer agora?</p>
      <div class="step-buttons">
        ${missing.length > 0 
          ? '<button onclick="ChatBot.suggestMissingAssets()">📎 Adicionar assets faltantes</button>'
          : ''
        }
        <button onclick="ChatBot.showPreview()">👀 Ver prévia</button>
        <button onclick="ChatBot.switchWindow(\'form\')">✏️ Editar formulário</button>
      </div>
    </div>
  `, 'assistant');
}
```

---

## 6. FEEDBACK VISUAL INTELIGENTE

### 6.1 Estados de Carregamento

#### A. Geração de Assets
```javascript
// Ao iniciar geração
ChatBot.showStatus({
  type: 'generating',
  message: 'Gerando capa com IA...',
  progress: 0,
  allowContinue: true // Permite continuar conversando
});

// Durante geração
ChatBot.updateStatus({ progress: 50 });

// Ao concluir
ChatBot.showAssetComplete({
  type: 'image',
  url: 'blob:...',
  context: 'capa',
  actions: ['download', 'regenerate', 'use']
});
```

#### B. Processo de Publicação
```
┌─────────────────────────────────────────────────┐
│  📦 Publicando Convite                          │
├─────────────────────────────────────────────────┤
│  [████████░░░░░░░░░░░░] 40%                    │
│                                                 │
│  ✅ Build local concluído                       │
│  ⏳ Enviando para GitHub...                     │
│  ○ Aguardando deploy                           │
└─────────────────────────────────────────────────┘
```

### 6.2 Detecção Automática de Conclusão

```javascript
// Sistema de polling para verificar geração
async function watchAssetGeneration(jobId, context) {
  const interval = setInterval(async () => {
    const status = await checkJobStatus(jobId);
    
    if (status === 'completed') {
      clearInterval(interval);
      ChatBot.notifyAssetReady(context);
      ChatBot.addMessage(`✅ Sua ${context} foi gerada!`, 'assistant');
      ChatBot.showAssetPreview(context);
    } else if (status === 'failed') {
      clearInterval(interval);
      ChatBot.handleError('generation_failed', context);
    }
  }, 2000); // Verifica a cada 2 segundos
}
```

### 6.3 Toggles Acessíveis no Chat

Antes de publicar, o chatbot verifica toggles não configurados:

```javascript
// Exemplo de verificação pré-publicação
function prePublishCheck() {
  const toggles = [];
  
  if (!getToggle('timer_contagem')) {
    toggles.push({
      id: 'timer_contagem',
      label: 'Timer de Contagem Regressiva',
      question: 'Deseja ativar o countdown?'
    });
  }
  
  if (!getToggle('permitir_acompanhante') && getField('numero_whatsapp')) {
    toggles.push({
      id: 'permitir_acompanhante',
      label: 'Permitir Acompanhantes',
      question: 'Habilitar seletor de acompanhantes no RSVP?'
    });
  }
  
  return toggles;
}
```

**Exibição no Chat:**
```
┌─────────────────────────────────────────────────┐
│  ⚙️ Configurações Pendentes                    │
├─────────────────────────────────────────────────┤
│  Timer de Contagem Regressiva                   │
│  [ ] Desativado  [●] Ativado                   │
│                                                 │
│  [Continuar sem alterar]  [Aplicar e Publicar] │
└─────────────────────────────────────────────────┘
```

---

## 7. SISTEMA DE BOTÕES INTERATIVOS

### 7.1 Ciclo de Vida dos Botões

```
┌──────────────────────────────────────────────────────────┐
│                    CICLO DE VIDA                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  [CRIADO] ──▶ [ATIVO] ──▶ [CLICADO ou EXPIRADO]        │
│                  │                                       │
│                  ▼                                       │
│           Mudança de Assunto                            │
│                  │                                       │
│                  ▼                                       │
│            [DESATIVADO]                                  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 7.2 Implementação

```javascript
class InteractiveButton {
  constructor(config) {
    this.id = generateUniqueId();
    this.label = config.label;
    this.action = config.action;
    this.context = config.context; // Assunto ao qual pertence
    this.timestamp = Date.now();
    this.active = true;
  }
  
  render() {
    return `
      <button 
        class="chat-interactive-btn ${this.active ? '' : 'disabled'}"
        data-btn-id="${this.id}"
        data-context="${this.context}"
        onclick="ChatBot.handleButtonClick('${this.id}')"
        ${!this.active ? 'disabled' : ''}
      >
        ${this.label}
      </button>
    `;
  }
  
  deactivate() {
    this.active = false;
    const el = document.querySelector(`[data-btn-id="${this.id}"]`);
    if (el) {
      el.classList.add('disabled');
      el.disabled = true;
    }
  }
}

// Gerenciador de contexto
const ButtonManager = {
  buttons: [],
  currentContext: null,
  
  setContext(context) {
    // Desativa todos os botões do contexto anterior
    if (this.currentContext !== context) {
      this.buttons
        .filter(b => b.context === this.currentContext)
        .forEach(b => b.deactivate());
    }
    this.currentContext = context;
  },
  
  createButton(config) {
    config.context = this.currentContext;
    const btn = new InteractiveButton(config);
    this.buttons.push(btn);
    return btn.render();
  }
};
```

### 7.3 Detecção de Mudança de Assunto

```javascript
function detectContextChange(newMessage) {
  const intents = analyzeIntent(newMessage);
  
  // Intenções que mudam contexto
  const contextChangers = [
    'navigate', 'generate', 'upload', 'publish',
    'import', 'search', 'configure', 'reset'
  ];
  
  if (contextChangers.some(c => intents.includes(c))) {
    const newContext = extractContext(newMessage);
    ButtonManager.setContext(newContext);
    return true;
  }
  
  return false;
}
```

---

## 8. TRATAMENTO DE ERROS INTELIGENTE

### 8.1 Mapa de Erros

```javascript
const ERROR_MAP = {
  // Erros de API
  'gemini_rate_limit': {
    message: 'O Gemini está sobrecarregado.',
    suggestion: 'Tentando com GPT...',
    action: 'fallback_gpt'
  },
  'gpt_quota_exceeded': {
    message: 'Cota de créditos esgotada.',
    suggestion: 'Use as ferramentas gratuitas: Gemini ou Dreamina.',
    action: 'show_free_tools'
  },
  'generation_failed': {
    message: 'A geração falhou.',
    suggestion: 'Tente simplificar o prompt ou usar uma imagem de referência.',
    action: 'retry_with_options'
  },
  
  // Erros de GitHub
  'github_conflict': {
    message: 'O slug já existe no repositório.',
    suggestion: 'Escolha outro nome ou atualize o existente.',
    action: 'show_conflict_options'
  },
  'github_auth_failed': {
    message: 'Falha na autenticação com GitHub.',
    suggestion: 'Verifique se o token está configurado corretamente.',
    action: 'show_token_guide'
  },
  
  // Erros de Validação
  'missing_required_field': {
    message: 'Campo obrigatório não preenchido.',
    suggestion: 'Preencha o campo antes de continuar.',
    action: 'highlight_field'
  },
  'invalid_file_type': {
    message: 'Tipo de arquivo não suportado.',
    suggestion: 'Use: PNG, JPG, MP4 ou MP3.',
    action: null
  },
  
  // Erros de Importação
  'legacy_format': {
    message: 'Formato de convite antigo detectado.',
    suggestion: 'Iniciando migração automática...',
    action: 'migrate_legacy'
  }
};
```

### 8.2 Handler de Erros

```javascript
async function handleError(errorCode, context = null) {
  const error = ERROR_MAP[errorCode] || {
    message: 'Erro desconhecido.',
    suggestion: 'Tente novamente ou contate o suporte.',
    action: null
  };
  
  // Exibe mensagem amigável
  ChatBot.addMessage(`
    <div class="error-card">
      <div class="error-icon">⚠️</div>
      <div class="error-content">
        <strong>${error.message}</strong>
        <p>${error.suggestion}</p>
      </div>
    </div>
  `, 'assistant');
  
  // Executa ação de recuperação
  if (error.action) {
    await executeErrorAction(error.action, context);
  }
}

async function executeErrorAction(action, context) {
  switch (action) {
    case 'fallback_gpt':
      return await sendToGPT(context);
      
    case 'show_free_tools':
      ChatBot.showFreeToolsCard();
      break;
      
    case 'retry_with_options':
      ChatBot.showRetryOptions(context);
      break;
      
    case 'show_conflict_options':
      ChatBot.showConflictResolver(context);
      break;
      
    case 'migrate_legacy':
      await migrateLegacyFormat(context);
      break;
  }
}
```

### 8.3 Card de Ferramentas Gratuitas

```javascript
function showFreeToolsCard() {
  const html = `
    <div class="tools-card">
      <h4>🆓 Alternativas Gratuitas</h4>
      <div class="tools-grid">
        <a href="https://gemini.google.com" target="_blank">
          <i class="fa-solid fa-robot"></i> Gemini
        </a>
        <a href="https://dreamina.capcut.com/ai-tool/generate?type=image" target="_blank">
          <i class="fa-solid fa-wand-magic-sparkles"></i> Dreamina
        </a>
        <a href="https://pxz.ai/tools/image-generator" target="_blank">
          <i class="fa-solid fa-image"></i> PXZ.ai
        </a>
      </div>
      <p class="tools-note">Gere a imagem e faça upload aqui!</p>
    </div>
  `;
  ChatBot.addMessage(html, 'assistant');
}
```

---

## 9. SISTEMA DE PERSISTÊNCIA

### 9.1 Estrutura de Dados Salva

```javascript
const ChatPersistence = {
  // Chave no localStorage
  STORAGE_KEY: 'autobuilder_chat_v4',
  
  // Estrutura do estado
  state: {
    conversationHistory: [],    // Array de {role, content, timestamp}
    currentContext: null,       // Assunto atual
    activeButtons: [],          // IDs de botões ativos
    pendingActions: [],         // Ações aguardando
    lastSlug: null,             // Último slug trabalhado
    chatSettings: {
      collapsed: false,
      soundEnabled: true
    }
  }
};
```

### 9.2 Salvamento Automático

```javascript
// Debounced save (500ms)
let saveTimeout;
function scheduleChatSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveChatState();
  }, 500);
}

function saveChatState() {
  const state = {
    ...ChatPersistence.state,
    conversationHistory: ChatPersistence.state.conversationHistory.slice(-100), // Limita a 100 msgs
    timestamp: Date.now()
  };
  
  localStorage.setItem(ChatPersistence.STORAGE_KEY, JSON.stringify(state));
}

// Salva após cada mensagem
function addMessage(content, role) {
  ChatPersistence.state.conversationHistory.push({
    role,
    content,
    timestamp: Date.now()
  });
  
  // ... render message ...
  
  scheduleChatSave();
}
```

### 9.3 Restauração

```javascript
async function restoreChatState() {
  const saved = localStorage.getItem(ChatPersistence.STORAGE_KEY);
  if (!saved) return false;
  
  try {
    const state = JSON.parse(saved);
    
    // Restaura histórico visual
    state.conversationHistory.forEach(msg => {
      renderMessage(msg.content, msg.role, { skipSave: true });
    });
    
    // Restaura contexto
    ChatPersistence.state = state;
    ButtonManager.setContext(state.currentContext);
    
    return true;
  } catch (e) {
    console.error('Erro ao restaurar chat:', e);
    return false;
  }
}
```

### 9.4 Integração com data.json (Publicação)

```javascript
// Ao publicar, inclui contexto do chat no data.json
function generateDataJson() {
  return {
    version: "4.0",
    timestamp: new Date().toISOString(),
    formData: window.AutoBuilderForm.data,
    linksExtras: window.LinksExtras.getAll(),
    assetsMap: getAssetsMap(),
    toggles: getToggles(),
    
    // NOVO: Contexto do Chat
    chatContext: {
      history: ChatPersistence.state.conversationHistory.slice(-50),
      lastContext: ChatPersistence.state.currentContext,
      importedSlug: ChatPersistence.state.lastSlug
    }
  };
}
```

### 9.5 Reset do Chat

```javascript
// Limpa chat (mantém configurações)
function clearChatHistory() {
  ChatPersistence.state.conversationHistory = [];
  ChatPersistence.state.activeButtons = [];
  ChatPersistence.state.pendingActions = [];
  ChatPersistence.state.currentContext = null;
  
  // Limpa DOM
  document.getElementById('chat-messages').innerHTML = '';
  
  // Mensagem inicial
  addWelcomeMessage();
  
  saveChatState();
}

// Reset completo (incluindo do data.json)
function fullChatReset() {
  clearChatHistory();
  
  // Remove do data.json também (se existir em memória)
  if (window.builderState?.chatContext) {
    delete window.builderState.chatContext;
  }
}
```

---

## 10. INTEGRAÇÃO COM HISTÓRICO

### 10.1 Busca com Linguagem Natural

```javascript
async function searchHistory(query) {
  // Extrai intenção de busca
  const filters = await extractSearchFilters(query);
  
  // Exemplos de extração:
  // "convites de 15 anos" → { tipo_evento: 'Aniversário', idade: 15 }
  // "casamentos de 2025" → { tipo_evento: 'Casamento', ano: 2025 }
  // "convite da Julia" → { nome: 'Julia' }
  
  // Busca no GitHub
  const all = await History.loadInvitations();
  
  // Filtra
  const filtered = all.filter(inv => matchesFilters(inv, filters));
  
  return filtered;
}

function matchesFilters(invitation, filters) {
  if (filters.tipo_evento && invitation.formData?.tipo_evento !== filters.tipo_evento) {
    return false;
  }
  if (filters.idade && invitation.formData?.idade != filters.idade) {
    return false;
  }
  if (filters.nome && !invitation.formData?.nome?.toLowerCase().includes(filters.nome.toLowerCase())) {
    return false;
  }
  if (filters.ano) {
    const invYear = new Date(invitation.formData?.data).getFullYear();
    if (invYear !== filters.ano) return false;
  }
  return true;
}
```

### 10.2 Exibição em Carrossel

```javascript
function showHistoryCarousel(invitations) {
  const html = `
    <div class="chat-carousel" data-context="history-search">
      <div class="carousel-container">
        ${invitations.map((inv, i) => `
          <div class="carousel-item" data-index="${i}">
            <img src="${inv.coverUrl}" alt="${inv.slug}">
            <div class="carousel-info">
              <strong>${inv.formData?.nome || inv.slug}</strong>
              <span>${inv.formData?.tipo_evento || 'Convite'}</span>
            </div>
            <button 
              class="btn-import-carousel"
              onclick="ChatBot.confirmImport('${inv.slug}')"
            >
              Importar
            </button>
          </div>
        `).join('')}
      </div>
      <div class="carousel-nav">
        <button onclick="ChatBot.carouselPrev()">◀</button>
        <span class="carousel-counter">1/${invitations.length}</span>
        <button onclick="ChatBot.carouselNext()">▶</button>
      </div>
    </div>
  `;
  
  ChatBot.addMessage(html, 'assistant');
}
```

### 10.3 Confirmação de Importação

```javascript
function confirmImport(slug) {
  ChatBot.addMessage(`
    <div class="confirm-card">
      <p>Deseja importar o convite <strong>${slug}</strong>?</p>
      <p class="warning">⚠️ Isso substituirá os dados atuais não salvos.</p>
      <div class="confirm-actions">
        <button onclick="ChatBot.executeImport('${slug}')">
          ✅ Sim, importar
        </button>
        <button onclick="ChatBot.cancelAction()">
          ❌ Cancelar
        </button>
      </div>
    </div>
  `, 'assistant');
}

async function executeImport(slug) {
  ButtonManager.setContext('importing');
  
  try {
    await History.importInvitation(slug);
    
    // Atualiza contexto do chat
    ChatPersistence.state.lastSlug = slug;
    
    ChatBot.addMessage(`✅ Convite **${slug}** importado com sucesso!`, 'assistant');
    
    // Se tiver contexto de chat salvo, oferece restaurar
    const data = await fetchDataJson(slug);
    if (data?.chatContext?.history?.length > 0) {
      ChatBot.askRestoreChatContext();
    }
  } catch (error) {
    handleError('import_failed', slug);
  }
}
```

---

## 11. DETECÇÃO DE MUDANÇA DE SLUG

### 11.1 Lógica de Novo Convite

```javascript
// Monitora mudanças no slug
function watchSlugChanges() {
  const slugField = document.getElementById('form-slug') || 
                    document.querySelector('[data-field="slug"]');
  
  if (!slugField) return;
  
  let lastSlug = slugField.value;
  
  slugField.addEventListener('change', () => {
    const newSlug = slugField.value;
    
    if (lastSlug && newSlug !== lastSlug) {
      // Detecta se é um convite importado
      const wasImported = ChatPersistence.state.lastSlug === lastSlug;
      
      if (wasImported) {
        ChatBot.notifySlugChange(lastSlug, newSlug);
      }
    }
    
    lastSlug = newSlug;
  });
}

function notifySlugChange(oldSlug, newSlug) {
  ChatBot.addMessage(`
    <div class="info-card">
      <i class="fa-solid fa-code-branch"></i>
      <div>
        <strong>Novo convite detectado!</strong>
        <p>Você alterou o slug de <code>${oldSlug}</code> para <code>${newSlug}</code>.</p>
        <p>Isso será salvo como um novo convite, mantendo o original intacto.</p>
      </div>
    </div>
  `, 'assistant');
  
  // Atualiza contexto
  ChatPersistence.state.lastSlug = newSlug;
}
```

---

## 12. CONFIRMAÇÃO DE CRÉDITOS

### 12.1 Identificação de Ações Pagas

```javascript
const PAID_ACTIONS = {
  'generate_image_fal': {
    provider: 'fal.ai',
    cost: '~$0.02-0.05',
    freeAlternatives: ['gemini', 'dreamina', 'pxz']
  },
  'generate_video_fal': {
    provider: 'fal.ai',
    cost: '~$0.10-0.50',
    freeAlternatives: ['kling_free_tier']
  },
  'gpt_request': {
    provider: 'OpenAI',
    cost: '~$0.01-0.03',
    freeAlternatives: ['gemini_api']
  }
};
```

### 12.2 Fluxo de Confirmação

```javascript
async function confirmPaidAction(actionType, context) {
  const action = PAID_ACTIONS[actionType];
  if (!action) return true; // Ação gratuita
  
  const html = `
    <div class="credit-confirm-card">
      <div class="credit-header">
        <i class="fa-solid fa-coins"></i>
        <strong>Esta ação usa créditos</strong>
      </div>
      <div class="credit-info">
        <p>Provedor: ${action.provider}</p>
        <p>Custo estimado: ${action.cost}</p>
      </div>
      <div class="credit-alternatives">
        <p><strong>Alternativas gratuitas:</strong></p>
        <ul>
          ${action.freeAlternatives.map(alt => 
            `<li><a href="${getFreeToolUrl(alt)}" target="_blank">${getToolName(alt)}</a></li>`
          ).join('')}
        </ul>
      </div>
      <div class="credit-actions">
        <button onclick="ChatBot.proceedPaidAction('${actionType}', '${context}')">
          💳 Usar Créditos
        </button>
        <button onclick="ChatBot.cancelAction()">
          🆓 Usar Gratuito
        </button>
      </div>
    </div>
  `;
  
  ChatBot.addMessage(html, 'assistant');
  ButtonManager.setContext('credit_confirmation');
  
  // Retorna promise que será resolvida pelo botão
  return new Promise((resolve) => {
    window._pendingCreditAction = { resolve, actionType, context };
  });
}

function proceedPaidAction(actionType, context) {
  if (window._pendingCreditAction) {
    window._pendingCreditAction.resolve(true);
    delete window._pendingCreditAction;
  }
  
  // Executa ação
  executeAction(actionType, context);
}
```

---

## 13. MENU DE TRÊS PONTINHOS

### 13.1 Estrutura do Menu

```html
<div id="chat-menu" class="chat-dropdown-menu hidden">
  <button onclick="ChatBot.clearHistory()">
    <i class="fa-solid fa-broom"></i> Limpar Conversa
  </button>
  <button onclick="ChatBot.resetContext()">
    <i class="fa-solid fa-rotate"></i> Resetar Contexto
  </button>
  <button onclick="ChatBot.deleteFromDataJson()">
    <i class="fa-solid fa-trash"></i> Apagar do Convite
  </button>
  <hr>
  <button onclick="ChatBot.exportContext()">
    <i class="fa-solid fa-download"></i> Exportar Contexto
  </button>
</div>
```

### 13.2 Implementação

```javascript
const ChatMenu = {
  show() {
    document.getElementById('chat-menu').classList.remove('hidden');
  },
  
  hide() {
    document.getElementById('chat-menu').classList.add('hidden');
  },
  
  // Limpa apenas histórico visual
  clearHistory() {
    if (confirm('Limpar histórico de conversa?')) {
      clearChatHistory();
      this.hide();
    }
  },
  
  // Reseta contexto completo (incluindo do data.json em memória)
  resetContext() {
    if (confirm('Resetar todo o contexto do chatbot? Isso também removerá o contexto salvo do convite atual.')) {
      fullChatReset();
      this.hide();
    }
  },
  
  // Remove do data.json (para quando publicar)
  deleteFromDataJson() {
    if (confirm('Apagar contexto do chatbot do convite? Na próxima publicação, o convite não terá histórico de chat.')) {
      if (window.builderState) {
        delete window.builderState.chatContext;
      }
      ChatBot.addMessage('✅ Contexto removido do convite.', 'assistant');
      this.hide();
    }
  },
  
  // Exporta para arquivo JSON
  exportContext() {
    const data = {
      conversation: ChatPersistence.state.conversationHistory,
      context: ChatPersistence.state.currentContext,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-context-${Date.now()}.json`;
    a.click();
    
    this.hide();
  }
};
```

---

## 14. INTEGRAÇÃO COM "NOVO CONVITE"

### 14.1 Bind com Botão Existente

```javascript
// Estende o comportamento do botão "Novo Convite"
function setupNewInvitationIntegration() {
  const originalReset = window.resetBuilderState;
  
  window.resetBuilderState = async function(silent = false) {
    // Chama reset original
    const result = await originalReset(silent);
    
    if (result) {
      // Também reseta o chat
      fullChatReset();
      
      // Mensagem de boas-vindas
      ChatBot.addMessage(`
        <div class="welcome-card">
          <h4>🎉 Novo Convite!</h4>
          <p>Olá! Vamos criar algo incrível.</p>
          <p>Me conte: qual é o <strong>tema</strong> e <strong>tipo</strong> do evento?</p>
        </div>
      `, 'assistant');
    }
    
    return result;
  };
}
```

---

## 15. FUNÇÕES EXPOSTAS (window.ChatBot)

```javascript
window.ChatBot = {
  // Mensagens
  addMessage,
  showTypingIndicator,
  hideTypingIndicator,
  
  // Interação
  handleButtonClick,
  confirmImport,
  executeImport,
  cancelAction,
  proceedPaidAction,
  
  // Carrossel
  showHistoryCarousel,
  carouselPrev,
  carouselNext,
  
  // Status
  showStatus,
  updateStatus,
  showAssetComplete,
  notifyAssetReady,
  
  // Erros
  handleError,
  showFreeToolsCard,
  
  // Cards especiais
  showToggleCard,
  showConfirmCard,
  
  // Contexto
  setContext: (ctx) => ButtonManager.setContext(ctx),
  getContext: () => ButtonManager.currentContext,
  
  // Persistência
  save: saveChatState,
  restore: restoreChatState,
  clear: clearChatHistory,
  reset: fullChatReset,
  
  // Menu
  menu: ChatMenu,
  
  // Busca
  searchHistory,
  
  // Créditos
  confirmPaidAction,
  
  // Debugging
  getState: () => ChatPersistence.state
};
```

---

## 16. CASOS DE USO DETALHADOS

### 16.1 Caso de Uso: Criação Completa via Chat

**Cenário:** Usuário quer criar um convite de 15 anos do zero.

```
┌─────────────────────────────────────────────────────────────────┐
│ USUÁRIO: "Quero fazer um convite de 15 anos da Julia,           │
│          tema borboletas, cores rosa e dourado"                 │
├─────────────────────────────────────────────────────────────────┤
│ CHATBOT:                                                        │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ✅ Dados capturados:                                        │ │
│ │ • Nome: Julia                                               │ │
│ │ • Tipo: Aniversário                                         │ │
│ │ • Idade: 15                                                 │ │
│ │ • Tema: Borboletas                                          │ │
│ │ • Paleta: Rosa e Dourado                                    │ │
│ │                                                             │ │
│ │ Faltam algumas informações:                                 │ │
│ │ • Data e hora do evento                                     │ │
│ │ • Local                                                     │ │
│ │                                                             │ │
│ │ Quer me dizer agora ou começar a gerar as artes?           │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ USUÁRIO: "Dia 15 de março às 19h no Salão Crystal"             │
├─────────────────────────────────────────────────────────────────┤
│ CHATBOT: "Perfeito! Vou começar a criar a capa. Aqui está      │
│          o prompt que vou usar:"                                │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📝 Prompt Sugerido:                                         │ │
│ │ "Envelope elegante 3D com borboletas douradas e rosa,       │ │
│ │  lacre de cera com número 15, estilo premium..."            │ │
│ │                                                             │ │
│ │ [✅ Aprovar]  [✏️ Editar]                                   │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ USUÁRIO: *clica em Aprovar*                                     │
├─────────────────────────────────────────────────────────────────┤
│ CHATBOT:                                                        │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 💳 Esta ação usa créditos                                   │ │
│ │ Provedor: fal.ai | Custo: ~$0.03                           │ │
│ │                                                             │ │
│ │ Alternativas gratuitas:                                     │ │
│ │ • Gemini • Dreamina • PXZ.ai                               │ │
│ │                                                             │ │
│ │ [💳 Usar Créditos]  [🆓 Usar Gratuito]                     │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 16.2 Caso de Uso: Busca e Importação do Histórico

**Cenário:** Usuário quer duplicar um convite existente.

```
┌─────────────────────────────────────────────────────────────────┐
│ USUÁRIO: "Quais convites de casamento eu fiz ano passado?"      │
├─────────────────────────────────────────────────────────────────┤
│ CHATBOT: "Encontrei 3 convites de casamento de 2025:"           │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [◀] ┌────────┐ ┌────────┐ ┌────────┐ [▶]                   │ │
│ │     │ 🖼️     │ │ 🖼️     │ │ 🖼️     │                      │ │
│ │     │        │ │        │ │        │                      │ │
│ │     └────────┘ └────────┘ └────────┘                      │ │
│ │     Ana&Pedro  Mari&João  Lu&Carlos                       │ │
│ │     [Importar] [Importar] [Importar]                      │ │
│ │                                                           │ │
│ │     1/3                                                   │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ USUÁRIO: *clica em Importar no "Ana&Pedro"*                     │
├─────────────────────────────────────────────────────────────────┤
│ CHATBOT:                                                        │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Deseja importar o convite ana-pedro-2025?                   │ │
│ │ ⚠️ Isso substituirá os dados atuais não salvos.            │ │
│ │                                                             │ │
│ │ [✅ Sim, importar]  [❌ Cancelar]                           │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ USUÁRIO: *clica em Sim*                                         │
├─────────────────────────────────────────────────────────────────┤
│ CHATBOT:                                                        │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ⏳ Importando convite...                                    │ │
│ │ [████████████░░░░░░░░] 60%                                 │ │
│ │                                                             │ │
│ │ ✅ Formulário carregado                                     │ │
│ │ ⏳ Baixando capa...                                         │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [Após conclusão]                                                │
│                                                                 │
│ "✅ Convite importado! Este convite tinha histórico de chat."   │
│ "Deseja restaurar a conversa anterior?"                         │
│                                                                 │
│ [✅ Restaurar]  [❌ Começar do Zero]                            │
└─────────────────────────────────────────────────────────────────┘
```

### 16.3 Caso de Uso: Mudança de Assunto

**Cenário:** Usuário muda de assunto no meio de uma ação.

```
┌─────────────────────────────────────────────────────────────────┐
│ CHATBOT: "Aqui estão os convites de 15 anos:"                   │
│          [Carrossel com botões de importar]                     │
├─────────────────────────────────────────────────────────────────┤
│ USUÁRIO: "Na verdade, me mostra como mudar a cor dos botões"    │
├─────────────────────────────────────────────────────────────────┤
│ CHATBOT:                                                        │
│ [Sistema automaticamente desativa os botões do carrossel]       │
│                                                                 │
│ "Claro! Para mudar a cor dos botões, você pode:"                │
│ "1. Ir na aba Formulário > Estilo & UI > Cor dos Botões"        │
│ "2. Ou me dizer a cor desejada e eu configuro pra você!"        │
│                                                                 │
│ "Qual cor você quer? Ex: 'rosa', 'azul', '#FF5733'"             │
├─────────────────────────────────────────────────────────────────┤
│ [Se o usuário subir e clicar no botão Importar antigo]          │
│                                                                 │
│ *Botão está desabilitado e nada acontece*                       │
│ *Tooltip: "Esta opção expirou. Peça novamente."*                │
└─────────────────────────────────────────────────────────────────┘
```

### 16.4 Caso de Uso: Verificação Pré-Publicação

**Cenário:** Usuário pede para publicar sem configurar tudo.

```
┌─────────────────────────────────────────────────────────────────┐
│ USUÁRIO: "Publica esse convite agora"                           │
├─────────────────────────────────────────────────────────────────┤
│ CHATBOT: "Antes de publicar, notei algumas configurações        │
│          que você pode querer revisar:"                         │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ⚙️ Configurações Pendentes                                  │ │
│ │                                                             │ │
│ │ Timer de Contagem Regressiva                                │ │
│ │ ○ Desativado  ● Ativado                                    │ │
│ │                                                             │ │
│ │ O campo "Link de Presentes" está vazio.                    │ │
│ │ [Preencher agora] [Ignorar]                                │ │
│ │                                                             │ │
│ │ [Publicar assim mesmo]  [Revisar formulário]               │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ USUÁRIO: *ativa o timer e clica em Publicar*                    │
├─────────────────────────────────────────────────────────────────┤
│ CHATBOT: "✅ Timer ativado! Iniciando publicação..."            │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📦 Publicando convite                                       │ │
│ │ [████████████████████] 100%                                │ │
│ │                                                             │ │
│ │ ✅ Build local                                              │ │
│ │ ✅ Upload GitHub                                            │ │
│ │ ✅ Deploy concluído                                         │ │
│ │                                                             │ │
│ │ 🔗 https://mforgedesign.github.io/Convites/julia-15        │ │
│ │ [Copiar Link]  [Abrir]  [Ver Código]                       │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 17. ENDPOINTS E INTEGRAÇÕES

### 17.1 Supabase Edge Functions

```javascript
// Endpoint principal do chat
const CHAT_ENDPOINT = 'https://YOUR_PROJECT.supabase.co/functions/v1/chat';

async function sendToChatAPI(message, context) {
  const response = await fetch(CHAT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      message,
      conversation: context.history,
      builderState: context.state,
      assets: context.assets
    })
  });
  
  return response.json();
}
```

### 17.2 Fallback GPT via Edge Function

```javascript
// Edge Function: chat/index.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

Deno.serve(async (req) => {
  const { message, conversation, builderState, assets } = await req.json();
  
  // 1. Tenta Gemini primeiro
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent({
      contents: buildGeminiContents(conversation, message, assets),
      systemInstruction: SYSTEM_PROMPT
    });
    
    return new Response(JSON.stringify({
      status: 'ok',
      response: result.response.text(),
      provider: 'gemini'
    }));
    
  } catch (geminiError) {
    console.log('Gemini failed, trying GPT:', geminiError);
    
    // 2. Fallback para GPT
    try {
      const openai = new OpenAI({ apiKey: OPENAI_KEY });
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: buildGPTMessages(conversation, message),
        max_tokens: 2000
      });
      
      return new Response(JSON.stringify({
        status: 'ok',
        response: completion.choices[0].message.content,
        provider: 'gpt'
      }));
      
    } catch (gptError) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Ambos provedores falharam',
        error: gptError.message
      }), { status: 500 });
    }
  }
});
```

### 17.3 Envio de Imagens para Contexto

```javascript
// Prepara assets para envio
async function prepareAssetsForContext() {
  const assets = [];
  
  // Captura capa se existir
  const capaUrl = window.builderState?.assets?.capa;
  if (capaUrl) {
    const base64 = await urlToBase64(capaUrl);
    assets.push({
      type: 'image',
      context: 'capa',
      data: base64
    });
  }
  
  // Captura folha se existir
  const folhaUrl = window.builderState?.assets?.folha_vazia;
  if (folhaUrl) {
    const base64 = await urlToBase64(folhaUrl);
    assets.push({
      type: 'image',
      context: 'folha',
      data: base64
    });
  }
  
  return assets;
}
```

---

## 18. CONSIDERAÇÕES DE IMPLEMENTAÇÃO

### 18.1 Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `static/js/chatbot.js` | REESCREVER | Implementação completa do novo chatbot |
| `static/js/chat-persistence.js` | CRIAR | Sistema de persistência do chat |
| `static/js/chat-buttons.js` | CRIAR | Gerenciador de botões interativos |
| `static/js/chat-api.js` | CRIAR | Comunicação com APIs |
| `static/css/chat.css` | CRIAR | Estilos dos cards e carrosséis |
| `index.html` | MODIFICAR | Menu de 3 pontinhos no header do chat |
| `supabase/functions/chat/index.ts` | CRIAR | Edge function de chat |

### 18.2 Dependências

```javascript
// Dependências já existentes no projeto
- Supabase Client (já importado)
- JSZip (já importado)
- Font Awesome (já importado)

// Novas dependências (via CDN ou import)
- Nenhuma obrigatória (Pure JS)
```

### 18.3 Ordem de Implementação Sugerida

1. **Fase 1: Infraestrutura**
   - [ ] Edge Function básica (Gemini + GPT fallback)
   - [ ] Sistema de persistência (localStorage)
   - [ ] Estrutura de mensagens

2. **Fase 2: UI/UX**
   - [ ] Cards de aprovação/confirmação
   - [ ] Sistema de botões interativos
   - [ ] Carrossel de histórico
   - [ ] Menu de 3 pontinhos

3. **Fase 3: Inteligência**
   - [ ] NLP para extração de dados
   - [ ] Mapeamento de intenções
   - [ ] Controle de contexto

4. **Fase 4: Integração**
   - [ ] Two-way binding com formulário
   - [ ] Integração com dropzones
   - [ ] Integração com History module
   - [ ] Verificação pré-publicação

5. **Fase 5: Polimento**
   - [ ] Tratamento de erros
   - [ ] Feedback visual
   - [ ] Testes e debugging

---

## 20. MENU DE TRÊS PONTINHOS (⋮)

### 20.1 Localização e Estrutura

O menu de três pontinhos (⋮) fica no **header do chatbot**, ao lado do título. Ao clicar, exibe um dropdown com opções de gerenciamento.

```html
<!-- Estrutura HTML no header do chatbot -->
<div class="chat-header">
    <h3>Chatbot</h3>
    <div class="chat-menu-container">
        <button id="chat-menu-btn" class="chat-menu-trigger">
            <i class="fa-solid fa-ellipsis-vertical"></i>
        </button>
        <div id="chat-menu-dropdown" class="chat-menu-dropdown hidden">
            <button data-action="clear-history">
                <i class="fa-solid fa-trash"></i> Limpar Conversa
            </button>
            <button data-action="reset-context">
                <i class="fa-solid fa-rotate-left"></i> Resetar Contexto Completo
            </button>
            <button data-action="delete-from-json">
                <i class="fa-solid fa-eraser"></i> Apagar do data.json
            </button>
            <hr>
            <button data-action="export-context">
                <i class="fa-solid fa-download"></i> Exportar Contexto
            </button>
        </div>
    </div>
</div>
```

### 20.2 Ações do Menu

| Ação | Data-Action | Descrição | Escopo |
|------|-------------|-----------|--------|
| **Limpar Conversa** | `clear-history` | Remove mensagens do chat, mantém configurações | Visual + localStorage |
| **Resetar Contexto Completo** | `reset-context` | Limpa tudo: histórico, config, botões, estado | Visual + localStorage |
| **Apagar do data.json** | `delete-from-json` | Remove contexto do chatbot do data.json salvo | data.json do convite |
| **Exportar Contexto** | `export-context` | Baixa JSON com todo o contexto atual | Download |

### 20.3 Implementação das Ações

```javascript
// ChatBot.menuActions
const menuActions = {
    'clear-history': () => {
        // Limpa apenas mensagens visuais e histórico de conversa
        ChatState.conversationHistory = [];
        messagesArea.innerHTML = '';
        addWelcomeMessage();
        save();
        showToast('Conversa limpa');
    },
    
    'reset-context': () => {
        // Limpa TUDO: conversa, botões, contexto, configurações
        ChatState.conversationHistory = [];
        ChatState.currentContext = null;
        ChatState.pendingFiles = [];
        ChatState.settings = { soundEnabled: true };
        ButtonManager.buttons = [];
        ButtonManager.currentContext = null;
        messagesArea.innerHTML = '';
        addWelcomeMessage();
        localStorage.removeItem(CONFIG.STORAGE_KEY);
        showToast('Contexto resetado completamente');
    },
    
    'delete-from-json': async () => {
        // Remove o campo 'chatbot' do data.json do convite atual
        const slug = window.AutoBuilderForm?.data?.slug;
        if (!slug) {
            showToast('Nenhum convite carregado', 'warning');
            return;
        }
        
        // Atualiza o estado para excluir chatbot na próxima publicação
        ChatState.deletedFromJson = true;
        showToast(`Contexto do chatbot será removido do data.json ao publicar "${slug}"`);
    },
    
    'export-context': () => {
        const exportData = {
            conversationHistory: ChatState.conversationHistory,
            currentContext: ButtonManager.currentContext,
            slug: window.AutoBuilderForm?.data?.slug,
            exportedAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chatbot-context-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Contexto exportado');
    }
};
```

### 20.4 Estilos do Menu

```css
.chat-menu-container {
    position: relative;
}

.chat-menu-trigger {
    background: transparent;
    border: none;
    padding: 0.5rem;
    cursor: pointer;
    color: #6b7280;
    transition: color 0.2s;
}

.chat-menu-trigger:hover {
    color: #3b82f6;
}

.chat-menu-dropdown {
    position: absolute;
    right: 0;
    top: 100%;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    min-width: 200px;
    z-index: 100;
    overflow: hidden;
}

.chat-menu-dropdown button {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    text-align: left;
    font-size: 0.875rem;
    color: #374151;
    cursor: pointer;
    transition: background 0.15s;
}

.chat-menu-dropdown button:hover {
    background: #f3f4f6;
}

.chat-menu-dropdown button[data-action="delete-from-json"] {
    color: #dc2626;
}

.chat-menu-dropdown hr {
    margin: 0.25rem 0;
    border: none;
    border-top: 1px solid #e5e7eb;
}
```

---

## 21. PERSISTÊNCIA NO DATA.JSON

### 21.1 Estrutura de Dados Salva

Quando o convite é publicado, o contexto do chatbot é incluído no `data.json`:

```javascript
// Estrutura do data.json COM chatbot
{
    "formData": { ... },      // Dados do formulário
    "assetsMap": { ... },     // Mapa de assets
    "linksExtras": [ ... ],   // Links personalizados
    
    // NOVO: Contexto do Chatbot
    "chatbot": {
        "conversationHistory": [
            { "role": "user", "content": "...", "timestamp": 1234567890 },
            { "role": "assistant", "content": "...", "timestamp": 1234567891 }
        ],
        "currentContext": "cover_generation",
        "settings": {
            "soundEnabled": true
        },
        "lastInteraction": "2026-01-16T12:00:00Z"
    }
}
```

### 21.2 Salvamento na Publicação

```javascript
// Em windows.js → publishToGitHub (adicionar após appState)

// Incluir contexto do chatbot no data.json
if (window.ChatBot && !window.ChatBot.getState().deletedFromJson) {
    const chatState = window.ChatBot.getState();
    appState.chatbot = {
        conversationHistory: chatState.conversationHistory.slice(-50), // Últimas 50 mensagens
        currentContext: chatState.currentContext,
        settings: chatState.settings,
        lastInteraction: new Date().toISOString()
    };
}
```

### 21.3 Restauração na Importação

```javascript
// Em history.js → importInvitation (adicionar após restore)

// Restaurar contexto do chatbot se existir
if (data.chatbot && window.ChatBot) {
    window.ChatBot.restoreFromData(data.chatbot);
}
```

### 21.4 Função de Restauração

```javascript
// Em chatbot.js
function restoreFromData(chatbotData) {
    if (!chatbotData) return;
    
    // Limpa estado atual
    ChatState.conversationHistory = [];
    messagesArea.innerHTML = '';
    
    // Restaura histórico
    if (chatbotData.conversationHistory) {
        chatbotData.conversationHistory.forEach(msg => {
            addMessage(msg.content, msg.role, { skipSave: true });
        });
        ChatState.conversationHistory = chatbotData.conversationHistory;
    }
    
    // Restaura contexto e settings
    ButtonManager.currentContext = chatbotData.currentContext || null;
    ChatState.settings = chatbotData.settings || { soundEnabled: true };
    
    // Mensagem de boas-vindas
    addMessage(`
        <div class="welcome-card">
            <p>📦 <strong>Contexto do chatbot restaurado!</strong></p>
            <p class="text-sm text-gray-500">Última interação: ${chatbotData.lastInteraction || 'desconhecida'}</p>
        </div>
    `, 'assistant', { skipSave: true });
    
    save();
}

// Expor função
window.ChatBot.restoreFromData = restoreFromData;
```

---

## 22. DETECÇÃO DE MUDANÇA DE SLUG

### 22.1 Problema

Quando o usuário muda o slug (campo `slug` no formulário), significa:
- **Novo convite** está sendo criado
- **Cópia/versão** de um convite importado

### 22.2 Implementação

```javascript
// Em chatbot.js - inicialização
let lastKnownSlug = null;

function checkSlugChange() {
    const currentSlug = document.getElementById('form-slug')?.value || 
                        window.AutoBuilderForm?.data?.slug;
    
    if (!currentSlug) return;
    
    // Primeira carga
    if (!lastKnownSlug) {
        lastKnownSlug = currentSlug;
        ChatState.lastSlug = currentSlug;
        return;
    }
    
    // Slug mudou!
    if (currentSlug !== lastKnownSlug) {
        handleSlugChange(lastKnownSlug, currentSlug);
        lastKnownSlug = currentSlug;
    }
}

function handleSlugChange(oldSlug, newSlug) {
    // Pergunta ao usuário o que fazer
    addMessage(`
        <div class="slug-change-card">
            <h4>📝 Slug alterado!</h4>
            <p>De: <code>${oldSlug}</code></p>
            <p>Para: <code>${newSlug}</code></p>
            <p class="text-sm text-gray-500 mt-2">
                Isso indica um <strong>novo convite</strong> ou uma <strong>cópia</strong>.
            </p>
            <div class="chat-buttons mt-3">
                ${ButtonManager.createButton({ 
                    label: '🔄 Manter Contexto', 
                    action: () => keepContextForNewSlug(newSlug) 
                })}
                ${ButtonManager.createButton({ 
                    label: '🗑️ Resetar para Novo', 
                    action: () => resetForNewSlug(newSlug) 
                })}
            </div>
        </div>
    `, 'assistant');
}

function keepContextForNewSlug(newSlug) {
    ChatState.lastSlug = newSlug;
    addMessage('✅ Contexto mantido para o novo slug.', 'assistant');
    save();
}

function resetForNewSlug(newSlug) {
    menuActions['reset-context']();
    ChatState.lastSlug = newSlug;
    addMessage(`✅ Contexto resetado. Começando do zero para "${newSlug}".`, 'assistant');
    save();
}

// Verificar mudança de slug periodicamente ou via evento
document.getElementById('form-slug')?.addEventListener('blur', checkSlugChange);
```

---

## 23. INTEGRAÇÃO COM "NOVO CONVITE"

### 23.1 Comportamento Esperado

Quando usuário clica em **"Novo Convite"** na sidebar:
1. Builder é resetado (já implementado)
2. **Chatbot também é resetado**

### 23.2 Implementação

```javascript
// Em windows.js → botão "Novo Convite"
document.getElementById('btn-new-invitation')?.addEventListener('click', async () => {
    // Confirmação (já existente)
    const confirmed = await showConfirmModal(
        'Novo Convite',
        'Isso limpará todos os dados atuais. Deseja continuar?'
    );
    
    if (!confirmed) return;
    
    // Reset do builder (já existente)
    // ... código existente ...
    
    // NOVO: Reset do chatbot
    if (window.ChatBot) {
        window.ChatBot.clear();
        console.log('[NewInvitation] Chatbot resetado');
    }
});
```

---

## 24. VERIFICAÇÃO PRÉ-PUBLICAÇÃO

### 24.1 Problema

Antes de publicar, o chatbot deve verificar:
- Toggles não configurados
- Campos obrigatórios vazios
- Assets faltando

### 24.2 Verificação de Toggles

```javascript
// Função chamada antes de publicar
async function prePublishCheck() {
    const issues = [];
    const suggestions = [];
    
    // 1. Verificar toggles
    const toggles = [
        { id: 'form-permitir_acompanhante', label: 'Permitir Acompanhante' },
        { id: 'form-timer_contagem', label: 'Timer de Contagem Regressiva' }
    ];
    
    toggles.forEach(toggle => {
        const el = document.getElementById(toggle.id);
        if (el && !el.dataset.userConfigured) {
            suggestions.push({
                type: 'toggle',
                id: toggle.id,
                label: toggle.label,
                currentValue: el.checked
            });
        }
    });
    
    // 2. Verificar campos obrigatórios
    const requiredFields = ['nome', 'data', 'tipo_evento'];
    requiredFields.forEach(field => {
        const el = document.querySelector(`[data-field="${field}"]`);
        if (el && !el.value.trim()) {
            issues.push({
                type: 'required_field',
                field,
                label: el.closest('.form-group')?.querySelector('label')?.textContent || field
            });
        }
    });
    
    // 3. Verificar assets essenciais
    const coverDropzone = document.getElementById('cover-dropzone');
    if (!coverDropzone?.style.backgroundImage || coverDropzone.style.backgroundImage === 'none') {
        issues.push({
            type: 'missing_asset',
            asset: 'capa',
            label: 'Capa do Convite'
        });
    }
    
    return { issues, suggestions };
}
```

### 24.3 Exibição no Chat antes de Publicar

```javascript
async function showPrePublishConfirmation() {
    const { issues, suggestions } = await prePublishCheck();
    
    if (issues.length === 0 && suggestions.length === 0) {
        // Tudo OK, prosseguir
        return true;
    }
    
    let html = '<div class="pre-publish-check">';
    
    // Problemas bloqueantes
    if (issues.length > 0) {
        html += '<div class="issues-section"><h4>⚠️ Problemas encontrados:</h4><ul>';
        issues.forEach(issue => {
            html += `<li>❌ ${issue.label} está vazio/faltando</li>`;
        });
        html += '</ul></div>';
    }
    
    // Sugestões de toggles
    if (suggestions.length > 0) {
        html += '<div class="suggestions-section"><h4>📋 Configurações não revisadas:</h4>';
        suggestions.forEach(sug => {
            if (sug.type === 'toggle') {
                html += `
                    <div class="toggle-suggestion">
                        <label>${sug.label}</label>
                        <div class="inline-toggle">
                            <button class="toggle-option ${!sug.currentValue ? 'active' : ''}" 
                                    onclick="ChatBot.setToggle('${sug.id}', false)">Não</button>
                            <button class="toggle-option ${sug.currentValue ? 'active' : ''}" 
                                    onclick="ChatBot.setToggle('${sug.id}', true)">Sim</button>
                        </div>
                    </div>
                `;
            }
        });
        html += '</div>';
    }
    
    html += `
        <div class="chat-buttons mt-4">
            ${ButtonManager.createButton({ label: '✅ Publicar Mesmo Assim', action: 'force-publish' })}
            ${ButtonManager.createButton({ label: '✏️ Corrigir Antes', action: 'cancel-publish' })}
        </div>
    </div>`;
    
    addMessage(html, 'assistant');
    
    // Retorna promise que resolve quando usuário decidir
    return new Promise(resolve => {
        ChatBot.pendingPublishResolve = resolve;
    });
}
```

---

## 25. LISTAGEM E IMPORTAÇÃO VIA LINGUAGEM NATURAL

### 25.1 Detecção de Intenção

```javascript
// Padrões para detectar busca no histórico
const historyIntentPatterns = [
    /quais?\s+(convites?|eventos?)\s+(de|do|da)?\s*(\w+)/i,  // "Quais convites de 15 anos"
    /mostr[ae]\s+(meus?|os?)?\s*(convites?|histórico)/i,     // "Mostre meus convites"
    /lista[re]?\s+(convites?|eventos?)/i,                     // "Liste convites"
    /busca[re]?\s+(convites?)\s+(?:de|com|sobre)\s+(.+)/i    // "Buscar convites de casamento"
];

function detectHistoryIntent(message) {
    for (const pattern of historyIntentPatterns) {
        const match = message.match(pattern);
        if (match) {
            return {
                intent: 'search_history',
                query: match[match.length - 1] || null
            };
        }
    }
    return null;
}
```

### 25.2 Busca e Exibição em Carrossel

```javascript
async function searchAndShowInvitations(query) {
    addMessage('🔍 Buscando convites...', 'assistant');
    
    // Busca no histórico (via History module)
    const allInvitations = await window.History?.getInvitations() || [];
    
    // Filtra por query
    let filtered = allInvitations;
    if (query) {
        const q = query.toLowerCase();
        filtered = allInvitations.filter(inv => 
            inv.slug?.toLowerCase().includes(q) ||
            inv.data?.formData?.tipo_evento?.toLowerCase().includes(q) ||
            inv.data?.formData?.nome?.toLowerCase().includes(q) ||
            inv.data?.formData?.tema_evento?.toLowerCase().includes(q)
        );
    }
    
    if (filtered.length === 0) {
        addMessage(`Não encontrei convites ${query ? `para "${query}"` : ''}.`, 'assistant');
        return;
    }
    
    // Monta carrossel
    const carouselHtml = `
        <div class="history-carousel">
            <p class="mb-2">Encontrei <strong>${filtered.length}</strong> convite(s):</p>
            <div class="carousel-container">
                ${filtered.slice(0, 10).map(inv => `
                    <div class="carousel-card" data-slug="${inv.slug}">
                        <div class="card-preview">
                            ${inv.coverUrl 
                                ? `<img src="${inv.coverUrl}" alt="${inv.slug}">`
                                : '<i class="fa-solid fa-image text-3xl text-gray-300"></i>'
                            }
                        </div>
                        <div class="card-info">
                            <strong>${inv.slug}</strong>
                            <span class="text-xs text-gray-500">${inv.data?.formData?.tipo_evento || 'Evento'}</span>
                        </div>
                        <button class="card-import-btn" onclick="ChatBot.confirmImport('${inv.slug}')">
                            Importar
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    addMessage(carouselHtml, 'assistant');
}
```

### 25.3 Confirmação de Importação

```javascript
function confirmImport(slug) {
    addMessage(`
        <div class="import-confirm">
            <p>Importar o convite <strong>"${slug}"</strong>?</p>
            <p class="text-sm text-gray-500">Isso substituirá os dados atuais do builder.</p>
            <div class="chat-buttons mt-3">
                ${ButtonManager.createButton({ 
                    label: '✅ Sim, Importar', 
                    action: () => executeImport(slug) 
                })}
                ${ButtonManager.createButton({ 
                    label: '❌ Cancelar', 
                    action: 'cancel' 
                })}
            </div>
        </div>
    `, 'assistant');
}

async function executeImport(slug) {
    addMessage('⏳ Importando convite...', 'assistant');
    
    try {
        await window.History?.importInvitation(slug);
        addMessage(`✅ Convite "${slug}" importado com sucesso!`, 'assistant');
    } catch (error) {
        addMessage(`❌ Erro ao importar: ${error.message}`, 'assistant');
    }
}
```

---

## 26. AGUARDAR GERAÇÃO DE ASSETS

### 26.1 Problema

Quando o chatbot dispara geração de imagem/vídeo:
- Usuário pode continuar conversando
- Chatbot deve detectar quando asset foi gerado
- Mostrar feedback visual apropriado

### 26.2 Estado de Monitoramento

```javascript
// Estado de gerações pendentes
const pendingGenerations = new Map();

function startAssetGeneration(context, type) {
    const id = `gen_${Date.now()}`;
    
    pendingGenerations.set(id, {
        context,   // 'capa', 'folha', etc.
        type,      // 'image' ou 'video'
        startedAt: Date.now(),
        status: 'pending'
    });
    
    // Inicia monitoramento
    monitorGeneration(id, context);
    
    return id;
}

async function monitorGeneration(id, context) {
    const dropzoneMap = {
        'capa': 'cover-dropzone',
        'folha_vazia': 'leaf-dropzone',
        'vid_abertura': 'intro-video-dropzone',
        'fundo_tela': 'fill-image-dropzone'
    };
    
    const dropzoneId = dropzoneMap[context];
    const dropzone = document.getElementById(dropzoneId);
    if (!dropzone) return;
    
    // Snapshot inicial
    const initialState = dropzone.style.backgroundImage || dropzone.querySelector('video')?.src;
    
    // Polling para detectar mudança
    const checkInterval = setInterval(() => {
        const currentState = dropzone.style.backgroundImage || dropzone.querySelector('video')?.src;
        
        if (currentState !== initialState && currentState) {
            // Asset gerado!
            clearInterval(checkInterval);
            pendingGenerations.delete(id);
            
            addMessage(`
                <div class="generation-complete">
                    ✅ <strong>${context}</strong> gerado com sucesso!
                    <div class="asset-preview">
                        ${dropzone.querySelector('video') 
                            ? '<i class="fa-solid fa-video"></i> Vídeo' 
                            : '<i class="fa-solid fa-image"></i> Imagem'
                        }
                    </div>
                </div>
            `, 'assistant');
        }
        
        // Timeout após 5 minutos
        const gen = pendingGenerations.get(id);
        if (gen && Date.now() - gen.startedAt > 300000) {
            clearInterval(checkInterval);
            pendingGenerations.delete(id);
            addMessage(`⚠️ Geração de ${context} demorou muito. Verifique manualmente.`, 'assistant');
        }
    }, 2000); // Checa a cada 2 segundos
}
```

### 26.3 Indicador Visual de Geração Pendente

```javascript
function showGenerationIndicator(context) {
    const indicator = document.createElement('div');
    indicator.id = `gen-indicator-${context}`;
    indicator.className = 'generation-indicator';
    indicator.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        <span>Gerando ${context}...</span>
    `;
    messagesArea.appendChild(indicator);
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

function hideGenerationIndicator(context) {
    document.getElementById(`gen-indicator-${context}`)?.remove();
}
```

---

**FIM DA DOCUMENTAÇÃO**

---

*Documento criado em: 2026-01-16*  
*Última atualização: 2026-01-16*  
*Versão: 1.1 - Adicionadas seções 20-26*

