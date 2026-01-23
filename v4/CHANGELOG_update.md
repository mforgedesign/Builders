## [4.2.6] - 2026-01-23
### Fixed
- **Chatbot Dropzone Interference**: Corrigido bug onde o Chatbot interceptava eventos de drag-and-drop de toda a aplicação (via `document.body`), impedindo o uso de dropzones em outras janelas (como Música ou Capa) enquanto o terminal estava aberto.
    - **Correção**: O listener de `drop` foi restrito estritamente ao container `#chatbot-container`, removendo o fallback global.

---
