# Info Sobre Backups - 24/01/2026 14:38

## Backups Criados Nesta Sessão:

### 1. live-preview_backup_20260124_1437.js
**Arquivo Original**: `static/js/live-preview.js`
**Data/Hora**: 24/01/2026 14:37
**Razão do Backup**: Antes de corrigir:
- Remoção da atualização automática (auto-update via debounce)
- Adição de sistema de "pending-changes" (botão brilha quando há mudanças)
- Botões faltando no iframe

**Mudanças Realizadas**:
1. Linhas 400-442: Removido auto-update, adicionado `markPendingChanges()` e `clearPendingChanges()`
2. Agora escuta eventos mas só marca o botão como pendente, não atualiza automaticamente

### 2. index_backup_20260124_1438.html
**Arquivo Original**: `index.html`
**Data/Hora**: 24/01/2026 14:38
**Razão do Backup**: Antes de modificar o botão de refresh

**Mudanças Realizadas**:
- Linhas 1787-1791: Botão pequeno com ícone → Botão grande "Atualizar Prévia"
- Código anterior:
  ```html
  <button id="btn-refresh-preview" class="text-gray-400 hover:text-brand-600 transition p-1">
      <i class="fa-solid fa-arrows-rotate text-sm"></i>
  </button>
  ```
- Código novo:
  ```html
  <button id="btn-refresh-preview" 
      class="w-full mb-3 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2">
      <i class="fa-solid fa-arrows-rotate"></i>
      <span>Atualizar Prévia</span>
  </button>
  ```

### 3. main.css (sem backup - apenas adição)
**Mudanças Realizadas**:
- Linhas 449-477: Adicionado CSS para efeito glow (`pending-changes`) e estado de atualização (`updating`)
- Keyframes: `glow-pulse` e `spin`
