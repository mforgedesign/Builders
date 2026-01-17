# AutoBuilder v4.0 - CHANGELOG

Registro de todas as modificações do projeto, conforme as diretrizes das global rules.

---

## [17/01/2026 - 19:55] - v4.3.32 - Fix: Robustez no Deploy
### Arquivos Modificados:
*   `static/js/github-adapter.js`:
    *   **Fix**: Adicionada verificação de nulidade para `filesMap` em `deployBatch` para evitar crashes.
*   `static/js/supabase-adapter.js`:
    *   **Fix**: Adicionado valor padrão `{}` para `body.files` ao chamar o adapter do GitHub.

---

## [17/01/2026 - 19:50] - v4.3.31 - Fix: Toggle de Acompanhantes e Timer
### Arquivos Modificados:
*   `static/js/build-system.js`:
    *   **Fix**: Atualizada a lógica de `COMPANION_HIDE_CLASS` e `TIMER_HIDE_CLASS`.
    *   **Robustez**: Adicionada verificação para strings `"true"`/`"on"` além de booleanos.
    *   **CSS**: Alterado de `'hidden'` para `'!hidden'` para forçar o desaparecimento e evitar conflitos com classes `flex` do Tailwind.
    *   **Backup**: `build-system_bkp_20260117_toggle_fix.js`

---

## [16/01/2026 - 21:56] - v4.3.30 - Ajuste: Posição Padrão dos Botões
### Arquivos Modificados:
*   `static/js/build-system.js`:
    *   **Fix**: Alterado o valor padrão de `BUTTONS_OFFSET` de `50` para `-40`.
    *   **Motivo**: Os botões estavam posicionados muito alto no convite gerado devido ao `items-start` usado para alinhamento. A nova posição (90px mais baixo) coloca os botões mais próximos da parte inferior da tela, conforme feedback do usuário.
    *   **Backup**: `build-system_bkp_20260116_2156.js`

---

## [16/01/2026 - 19:35] - v4.3.29 - Fix Definitive 2.0: Presentes (Hidden DOM)

### Arquivos Modificados:
*   `static/js/preview.js`:
    *   **Inline Style Check**: Alterado para checar `element.style.backgroundImage` em vez de `getComputedStyle`.
    *   **Motivo**: `getComputedStyle` retorna `none` ou vazio se o elemento pai (aba) estiver oculto (`display: none`). Checar o estilo inline garante que detectamos a imagem mesmo se o usuário estiver em outra aba.

---

## [16/01/2026 - 19:10] - v4.3.28 - Fix Definitive: Presentes (DOM Truth)
### Arquivos Modificados:
*   `static/js/preview.js`:
    *   **DOM-Truth Strategy**: Alterado `isButtonVisible` para checar diretamente o background-image do elemento `#gifts-image-dropzone`. Se o usuário vê a imagem no builder, o botão APARECE.
    *   **Fallback Click**: No click, se o state estiver vazio, o script "rouba" a URL direto do CSS do dropzone. Resolvido o problema de desincronia de estado.

---

## [16/01/2026 - 18:45] - v4.3.27 - Fix Critical: Crash & Debug Presentes
### Arquivos Modificados:
*   `static/js/preview.js`:
    *   **CRITICAL FIX**: Corrigido potencial crash no listener `mediaUpdated` quando o `data` é null (ao remover arquivo), que quebrava o script e impedia renderizações futuras.
    *   **Failsafe**: Adicionado mecanismo de segurança em `isButtonVisible` para sincronizar automaticamente `currentState.presentes` se `currentState.media_presentes` existir, garantindo que o botão não fique invisível incorretamente.
    *   **Debug**: Adicionados logs detalhados para rastrear a decisão de visibilidade do botão 'gifts'.

---

## [16/01/2026 - 18:35] - v4.3.26 - Fix: Alinhamento Gerado
### Arquivos Modificados:
*   `final_template.html`:
    *   **CSS Fix (Logic)**: Alterada a lógica JavaScript injetada (`gridClasses`) para usar `items-start` (flex) e `place-items-start` (grid). Isso corrige o desalinhamento vertical no convite *publicado/gerado*, onde botões com 2 linhas ficavam sobressalentes.

---

## [16/01/2026 - 18:25] - v4.3.25 - Fix: Alinhamento de Botões
### Arquivos Modificados:
*   `index.html`:
    *   **CSS Fix**: Adicionado `items-start` ao container `#preview-buttons` para corrigir o desalinhamento vertical quando um botão possui texto em duas linhas (ex: "Confirmar Presença"). Isso garante que todos os botões fiquem alinhados pelo topo.

---

## [16/01/2026 - 18:15] - v4.3.24 - Fix: Sync Evento Presentes
### Arquivos Modificados:
*   `static/js/preview.js`:
    *   **Fix Event**: O listener `mediaUpdated` foi ajustado para popular explicitamente as chaves `presentes` e `manual` no estado local. Isso garante que a verificação de visibilidade (que checa essas chaves) funcione imediatamente após o upload, sem delay ou necessidade de reload.

---

## [16/01/2026 - 18:00] - v4.3.23 - Fix: Visualização Botão Presentes
### Arquivos Modificados:
*   `static/js/preview.js`:
    *   **Fix Visibility**: O botão de presentes agora verifica tanto `currentState.media_presentes` (evento) quanto `currentState.presentes` (estado salvo/persistido) para garantir que apareça mesmo se o evento de media for perdido ou sobrescrito. Adicionado logs de debug mais detalhados.

---

## [16/01/2026 - 17:50] - v4.3.22 - Fix: Restore Vídeo Persistence
### Arquivos Modificados:
*   `static/js/persistence.js`:
    *   **Fix Restore**: Correção na detecção do tipo de ativo durante a restauração via IndexedDB. Agora verifica o MIME type do Base64 (`data:video/`) para garantir que vídeos no `fundo_tela` não sejam tratados como imagens (tela preta).

---

## [16/01/2026 - 17:20] - v4.3.21 - Deploy Debug
### Ações Realizadas:
*   **Deploy**: Execução do script `deploy_to_github.py` para atualizar a versão com logs de debug.
*   **URL**: https://builder.mforge.com.br/v4/

---

## [16/01/2026 - 17:15] - v4.3.21 - Debug Preview Button
### Arquivos Modificados:
*   `static/js/preview.js`:
    *   **Debug**: Adicionado log detalhado em `isButtonVisible` para rastrear estado do botão "Presentes" (Link vs Media).

---

## [16/01/2026 - 17:00] - v4.3.20 - Deploy Manual
### Ações Realizadas:
*   **Deploy**: Execução do script `deploy_to_github.py` para atualizar a versão em produção no repositório `mforgedesign/Builders`.
*   **URL**: https://builder.mforge.com.br/v4/

---

## [16/01/2026 - 16:55] - v4.3.20 - Fix: Preview de Vídeo e Título Manual
### Arquivos Modificados:
*   `static/js/preview.js`:
    *   **Fix Video Preview**: A detecção de vídeo no `updateBackground` confiava na extensão da URL. Blobs locais não possuem extensão definida na URL. Adicionado fallback para verificar `data.blob.type` se disponível, ou assumir imagem se não for MP4 explícito.
    *   **Fix Title**: Alterado título do modal de "Manual dos Padrinhos" para "Manual" em `handleButtonClick`.
*   `final_template.html`:
    *   **Fix Title**: Alterado título do modal de "Manual dos Padrinhos" para "Manual" para manter consistência no convite publicado.

---

## [16/01/2026 - 16:45] - v4.3.19 - Deploy Manual
### Ações Realizadas:
*   **Deploy**: Execução do script `deploy_to_github.py` para atualizar a versão em produção no repositório `mforgedesign/Builders`.
*   **URL**: https://builder.mforge.com.br/v4/

---

## [16/01/2026 - 16:40] - v4.3.19 - Fix: Visibilidade de Botões (Presentes/Manual)
### Arquivos Modificados:
*   `static/js/form.js`:
    *   **Fix Critical**: Adicionado listener para o evento `mediaUpdated`.
    *   **Lógica de Exclusividade Mútua**: Agora, quando uma imagem é enviada para "Presentes" ou "Manual", o sistema **limpa automaticamente** os campos de texto correspondentes (`link_presentes` ou `manual_content`).
    *   **Rationale**: O `preview.js` prioriza Links sobre Imagens. Se o campo de link não fosse limpo, o botão continuava agindo como Link (ou não aparecia corretamente) mesmo após o upload da imagem. Essa correção garante que o estado reflita a intenção do usuário (Imagem > Link se imagem for nova).

---

## [15/01/2026 - 22:35] - v4.3.5 - Importação Local e I.A (OpenAI)
### Arquivos Modificados:
*   `index.html`:
    *   **UI**: Substituído painel "Logado como" por botão "Importar Local (Pasta/ZIP)".
*   `static/js/windows.js`:
    *   **Feature**: Implementado suporte a upload de ZIP contendo estruturas de convites.
    *   **Lógica**: Se encontrar `data.json` v4+, carrega direto. Se for legado, aciona lógica de I.A.
*   `static/js/gemini-adapter.js`:
    *   Mantido como ponte para Edge Function (agora preparada para OpenAI).
*   **Backend (Edge Function)**:
    *   Criado artefato `analyze-invitation-edge-function.ts` com código para migrar para GPT-4o.

### Comportamento Esperado:
1. Usuário clica em "Importar Pasta/ZIP".
2. Seleciona arquivo ZIP de um convite antigo.
3. Sistema carrega estrutura, detecta se precisa de I.A e envia para análise.
4. **Backend (Configurado)**: A Edge Function `analyze-invitation` já foi atualizada via MCP com GPT-4o e Token configurado.

---

## [16/01/2026 - 00:45] - v4.3.18 - Clean UI (No Alerts)
### Arquivos Modificados:
*   `windows.js` e `persistence.js`: Remoção total dos alertas de debug. Substituídos por Logs discretos ou Toasts de erro.
*   `history.js`: Alerta de erro substituído por Toast nativo.

---

## [16/01/2026 - 00:30] - v4.3.17 - History Import Fix
### Arquivos Modificados:
*   `static/js/history.js`:
    *   **Correção de Importação de Histórico**: Corrigido bug onde a importação "Direta" (sem I.A, via `data.json`) não passava a URL base para o carregador de assets, resultando em convites sem imagens.
*   `index.html`:
    *   Links de cache atualizados.

---

## [16/01/2026 - 00:10] - v4.3.15 - Aggressive Fallback
### Arquivos Modificados:
*   `static/js/windows.js`:
    *   **Fallback Nativo Agressivo**: Se a I.A retornar um mapa vazio ou incompleto, o sistema agora ignora o erro e força a importação lendo os arquivos do ZIP localmente.
        *   **Regra de Ouro**: Se houver qualquer imagem JPG/PNG no ZIP, ela será atribuída como Capa se nenhuma outra for encontrada.
        *   **Prevenção de Falha Total**: Isso garante que "algo" sempre seja importado, mesmo que a I.A falhe 100%.

---

## [16/01/2026 - 00:00] - v4.3.14 - Critical Persistence Fix
### Arquivos Modificados:
*   `static/js/windows.js`:
    *   **Desacoplamento de Eventos**: Agora a função `restoreBuilderState` salva explicitamente o asset no IndexedDB (`Persistence.processAsset`) com o nome original (ex: `capa`) ANTES de disparar o evento visual mapeado (ex: `fundo_tela`).
    *   **Correção de Regressão**: Isso corrige o bug onde a Capa desaparecia após o reload porque era salva com a chave errada.
    *   Mantido Alertas de Debug.

---

## [15/01/2026 - 23:55] - v4.3.13 - Global Debug
### Arquivos Modificados:
*   `static/js/windows.js`:
    *   **Start/End Alerts**: Adicionados alertas globais para verificar se o arquivo JS está carregando corretamente ou travando no meio da execução.
*   `index.html`:
    *   **Cache Busting**: Forçada atualização de todos os scripts para `v4.3.13`.

---

## [15/01/2026 - 23:50] - v4.3.12 - Full System Trace
### Arquivos Modificados:
*   `static/js/persistence.js`:
    *   **Trace Persistence**: Adicionados alertas para confirmar se o arquivo está sendo SALVO no banco (`[DEBUG PERSISTENCE] Salvo`) e se está sendo RESTAURADO (`[PERSISTENCE] Restaurando`).
*   `static/js/windows.js`:
    *   Mantido trace de importação.

---

## [15/01/2026 - 23:40] - v4.3.11 - Full Trace Debug
### Arquivos Modificados:
*   `static/js/windows.js`:
    *   **Trace Mode**: Adicionados alertas de rastreamento (`Iniciando AI`, `Mapa de Assets Final`) para identificar exatamente onde o fluxo de importação está parando.

---

## [15/01/2026 - 23:30] - v4.3.10 - Debug Mode
### Arquivos Modificados:
*   `static/js/windows.js`:
    *   **Debug**: Ativado modo de debug visual. Alertas (`window.alert`) aparecerão se a importação encontrar os arquivos ou falhar. (Removeremos isso após confirmação).
    *   **Fix**: Mapeamento de `capa` forçado para `fundo_tela` para garantir que a imagem apareça.

---

## [15/01/2026 - 23:20] - v4.3.9 - Fix Crítico: Importação e Persistence
### Arquivos Modificados:
*   `static/js/windows.js`:
    *   **Fix Critical**: A busca de arquivos no ZIP agora é **Case-Insensitive**. (Corrigido o problema onde a I.A. retornava `capa.png` minúsculo e o ZIP tinha `Capa.png`, falhando no load de todos os arquivos).
    *   **Fallback**: Se `fundo_tela` não for detectado pela I.A., o sistema tenta usar a `capa` ou `folha` automaticamente para garantir que o convite não fique sem fundo.
    *   **Mapping**: Removido mapeamento incorreto que tratava a Capa como vídeo.
    *   **Logs**: Adicionados logs detalhados no console para diagnóstico de falha na restauração.

---

## [15/01/2026 - 23:00] - v4.3.8 - Ajuste de UI
### Arquivos Modificados:
*   `index.html` e `static/js/preview.js`:
    *   **UI**: Reduzida a posição padrão dos botões (`bottom`) de 50px para 20px, para evitar sobreposição de textos em convites importados.

---

## [15/01/2026 - 22:50] - v4.3.7 - Fix: Slug e Detecção de Imagem
### Arquivos Modificados:
*   `static/js/windows.js`:
    *   **Feature**: O `slug` do convite agora é gerado automaticamente a partir do **nome do arquivo** importado (ex: `ConviteEster.zip` -> `conviteester`).
    *   **Improvement**: Melhoria na lógica de busca de imagem para análise da I.A. (Procura por folha -> fundo -> capa -> maior imagem), garantindo que o texto seja lido mesmo se os nomes dos arquivos forem diferentes.

---

## [15/01/2026 - 22:45] - v4.3.6 - Fix: Preview na Importação
### Arquivos Modificados:
*   `static/js/preview.js`:
    *   **Fix**: Agora escuta eventos de atualização com source `restore` (importação).
*   `static/js/windows.js`:
    *   **Fix**: Força atualização visual dos assets (backgrounds/vídeos) no preview logo após restaurar.
    *   **Feature**: Gera automaticamente um `slug` (URL amigável) se o convite importado não tiver um.

---

## [15/01/2026 - 22:20] - v4.3.4 - Fix: Importação de Convites Legados
### Arquivos Modificados:
*   `static/js/windows.js`:
    *   **Fix (Linha 897)**: Adicionada verificação de `null/undefined` no `assetsMap` antes de chamar `.startsWith()`.
    *   **Rationale**: Crashava ao tentar importar convites onde a I.A retornava `null` para assets.
*   `static/js/history.js`:
    *   **Melhorado (Linha 515-575)**: Detecção de assets agora verifica subpastas (`capa/`, `abertura/`, `loop/`, `musica/`).
    *   **Novo**: Log de debug `Asset URL Map` para facilitar troubleshooting.

### Comportamento Esperado:
1. Importação de convites legados não crasha mais em assets nulos.
2. Assets dentro de subpastas são detectados corretamente.

---

## [15/01/2026 - 21:43] - v4.3.3 - Prompts Padrão com Auto-Preenchimento
### Arquivos Modificados:
*   `static/js/ai-prompts.js`:
    *   **Novo**: `getDefaultCoverPrompt()` - Template base para capa com dados do formulário (Tipo evento, Selo, Paleta, Tema).
    *   **Novo**: `getDefaultFillPrompt()` - Template base para folha preenchida com dados do formulário (Nome, Idade, Tipo evento, Tema).
*   `index.html`:
    *   **Novo**: Botões "Preenchimento Padrão" nos campos `cover-prompt` e `fill-prompt`.
    *   **UI**: Campos de prompt ampliados de 4 para 6 linhas.
*   `static/js/windows.js`:
    *   **Fix (Linha 1059-1068)**: `resetBuilderState` agora aplica prompts padrão para capa e folha ao clicar em "Novo Convite".
    *   **Novo**: Event handlers para botões "Preenchimento Padrão".

### Comportamento Esperado:
1. Clicar em "Preenchimento Padrão" preenche o prompt com template base + dados do formulário.
2. Clicar em "Novo Convite" reseta os prompts para o padrão (campos vazios até preencher formulário).
3. Os placeholders `[Preenche automático]` são substituídos pelos dados do formulário.

---

## [15/01/2026 - 21:37] - v4.3.2 - Adicionado Link Dreamina nas Ferramentas
### Arquivos Modificados:
*   `index.html`:
    *   **Novo**: Link para Dreamina (CapCut) adicionado em 5 seções de "Ferramentas Externas" (Capa, Folha Vazia, Preencher Folha, Presentes, Manual).
    *   **URL**: `https://dreamina.capcut.com/ai-tool/generate?type=image`

---

## [15/01/2026 - 21:35] - v4.3.1 - Fix: Espaçamento de Botões no Template Final
### Arquivos Modificados:
*   `final_template.html`:
    *   **Fix (Linha 561)**: Removido `w-full max-w-[480px]` do container de botões para ≤4 botões.
    *   **Rationale**: O container ocupava 100% da largura, fazendo botões se espalharem mesmo com `justify-center`. Agora o container usa largura automática, permitindo agrupamento natural.
    *   **Backup**: `final_template_bkp_20260115_2135.html`

### Comportamento Esperado:
1. Convites com 2-4 botões exibem os botões agrupados no centro (igual ao preview).
2. Convites com 5+ botões continuam usando grid com distribuição automática.

---

## [15/01/2026 - 21:10] - v4.3.0 - Botões Arrastáveis no Preview
### Arquivos Modificados:
*   `index.html`:
    *   **Novo**: Adicionado SortableJS CDN (1.15.2) para drag-and-drop.
*   `final_template.html`:
    *   **Fix**: Reduzido espaçamento entre botões de `gap-6` para `gap-3` (alinhado com preview).
*   `static/js/preview.js`:
    *   **Reescrita Completa**: Implementado sistema de botões arrastáveis (drag-and-drop).
    *   **Novo**: Array `buttonOrder` unificado que define a ordem dos botões.
    *   **Novo**: Integração com SortableJS para arrastar e reordenar botões no preview.
    *   **Novo**: Persistência da ordem em localStorage (`autoBuilder_buttonOrder`).
    *   **Nova API Pública**: `AutoBuilderPreview.getButtonOrder()`, `setButtonOrder()`, `resetButtonOrder()`.
    *   **Evento**: Dispara `buttonOrderChanged` ao reordenar.
*   `static/js/windows.js`:
    *   **Refatorado**: Geração de `menuConfig` agora usa `AutoBuilderPreview.getButtonOrder()` para garantir que o convite publicado tenha a mesma ordem de botões do preview.
    *   **Fix**: Corrigida função duplicada `updateDeployStep` que causava falha nas bolinhas de status.
    *   **Fix**: Corrigida lógica de substituição de assets (`assetsMap` contém strings, não objetos).

### Comportamento Esperado:
1. No preview do Builder, os botões podem ser arrastados para alterar a ordem.
2. A nova ordem é salva automaticamente no localStorage.
3. Ao publicar, o convite final respeita a ordem definida no preview.
4. O espaçamento entre botões agora é consistente entre preview e convite final.

---

## [15/01/2026 - 19:15] - v4.2.20 - Simplificação: Fundo Unificado da Tela de Botões
### Arquivos Modificados:
*   `index.html`:
    *   **Removido**: Toggle de modos "Superposição" e "Composição Flat" (fill-mode-buttons).
    *   **Removido**: Seções separadas `#fill-overlay-mode` e `#fill-flat-mode`.
    *   **Novo**: Janela simplificada "Fundo da Tela de Botões" com dropzone único que aceita JPG, PNG ou MP4.
    *   **Rationale**: Unificar a experiência - o usuário anexa/gera uma imagem OU vídeo que será o fundo dos botões.
*   `final_template.html`:
    *   **Removido**: `#videoLoop` e `#folhaPreenchida` como elementos separados.
    *   **Novo**: `#fundoTelaImg` (para imagens) e `#fundoTelaVideo` (para vídeos MP4) - elementos unificados.
    *   **Novo Placeholder**: `[[FUNDO_TELA_URL]]` substitui `[[VIDEO_LOOP_URL]]`.
    *   **Atualizado**: JavaScript interno para usar novos elementos em `irParaLoop()` e controle de mute.
*   `static/js/windows.js`:
    *   **Removido**: Referências a `fill-mode-*`, `fillMode`, `loop-video-dropzone`, `vid_loop`.
    *   **Novo Contexto**: `fundo_tela` substitui `vid_loop` e `folha_preenchida`.
    *   **fetchBlobFromSelector**: Novo tipo `'auto'` que detecta se é imagem (background) ou vídeo (video src).
    *   **Compilação**: Detecta extensão do fundo (png/jpg/mp4) a partir do MIME do blob.
*   `static/js/persistence.js`:
    *   **Removido**: `fillMode` toggle, `vid_loop`, `folha_preenchida`, `folha_animada` dos mapas.
    *   **Novo**: `fundo_tela` mapeado para `fill-image-dropzone`.

### Comportamento Esperado:
1. A janela "Fundo da Tela de Botões" aceita imagens (JPG/PNG) ou vídeo (MP4).
2. Se o usuário anexar uma imagem, ela aparece estática atrás dos botões.
3. Se o usuário anexar um vídeo MP4, ele reproduz em loop atrás dos botões.
4. A detecção é automática baseada no tipo de arquivo.

---

## [15/01/2026 - 18:12] - v4.2.15 - Fix: Botão de Animação da Capa (Hailuo 02 First-Last-Frame)
### Arquivos Modificados:
*   `generate-video` (Supabase Edge Function):
    *   **Breaking Change**: Atualizado para usar endpoint `first-last-frame-to-video` ao invés de `image-to-video`.
    *   **Parâmetros**: 9:16, 6s, 768p, prompt_optimizer: false.
    *   **URL do blank.jpg**: `https://ymttaaebrqcfrgipqwvy.supabase.co/storage/v1/object/public/invitation-assets/system/blank.jpg`
    *   **Rationale**: O endpoint anterior não suportava transição para tela branca final. O novo endpoint interpola entre o frame inicial (capa) e o frame final (tela branca).
*   `static/js/ai-prompts.js`:
    *   **Prompt Atualizado**: Adicionada instrução crítica sobre paleta de cores: "CRITICAL: The Color of glow, light and smoke need to be the same of the image color pallete."
*   `static/js/windows.js`:
    *   **Nova Função**: `initializeDefaultPrompts()` - Inicializa campos de prompt com valores padrão se vazios.
    *   **Rationale**: Garante que o usuário sempre tenha um prompt funcional pré-carregado.
*   **Supabase Storage**: Upload de `blank.jpg` para `invitation-assets/system/blank.jpg`.

### Comportamento Esperado:
1. Ao iniciar o builder, o campo de prompt terá o prompt padrão pré-carregado.
2. Ao alterar o prompt, a persistência salva no localStorage.
3. Ao clicar "Novo Convite", o prompt é restaurado para o padrão (não fica em branco).
4. O botão "Gerar Animação" agora chama o endpoint correto com first/last frame.

---

## [15/01/2026 - 18:58] - v4.2.19 - Fix: Edge Function Rejeita Data URLs
### Arquivos Modificados:
*   `generate-video` (Supabase Edge Function v7):
    *   **Problema**: fal.ai rejeita data URLs (base64). Persistence/Restore salva assets como data URLs.
    *   **Solução**: Edge Function agora detecta data URLs e faz upload para Supabase Storage, usando a URL pública resultante.
    *   **Nova Função**: `ensurePublicUrl()` - Converte data URL para URL pública via Storage.

---

## [15/01/2026 - 18:53] - v4.2.18 - Fix: Import do GitHub Também Não Reconhecia Assets
### Arquivos Modificados:
*   `static/js/windows.js`:
    *   **restoreBuilderState()**: Alterado para salvar URL em builderState (antes salvava Blob).
    *   **Linha 775**: `window.builderState.assets[context] = url;` (antes era `= blob;`)

---

## [15/01/2026 - 18:50] - v4.2.17 - Fix: Assets Restaurados Não Reconhecidos pelo Builder
### Arquivos Modificados:
*   `static/js/windows.js`:
    *   **getRequiredImage()**: Corrigido mapeamento de nomes de assets (capa/cover, folha_vazia/leaf_only).
    *   **Causa**: Persistência usa nomes em português, AI generation usava nomes em inglês.
*   `static/js/persistence.js`:
    *   **restoreFromLocalStorage()**: Alterado para salvar dataUrl diretamente em builderState (antes salvava Blob).
    *   **Causa**: APIs precisam de URLs, não de Blobs. Isso causava erro ao tentar gerar animação após restaurar sessão.

---

## [15/01/2026 - 18:44] - v4.2.16 - Fix: Botão de Animação Não Respondia a Cliques
### Arquivos Modificados:
*   `static/js/windows.js`:
    *   **BUG CRÍTICO CORRIGIDO**: A função `setupAIButtons()` existia mas NUNCA era chamada em `initWindows()`.
    *   **Causa**: Os click handlers dos botões "Gerar Animação" e "Gerar Loop" não eram anexados.
    *   **Solução**: Adicionada chamada `setupAIButtons()` em `initWindows()` (linha ~2738).

---

## [15/01/2026 - 18:17] - v4.2.14 - Deploy Manual
### Ações Realizadas:
*   **Deploy**: Execução do script `deploy_to_github.py` para atualizar a versão em produção no repositório `mforgedesign/Builders`.
*   **URL**: https://builder.mforge.com.br/v4/

---

## [15/01/2026 - 16:10] - v4.2.14 - Fix: Reset de Prompts de Animação
### Funcionalidades:
*   **Melhoria "Novo Convite"**: Ao resetar o builder ("Novo Convite"), os prompts de animação (Abertura e Loop) não são mais limpos completamente.
    *   **Ação**: O sistema agora restaura automaticamente o "Prompt Base" (descrição detalhada da abertura do envelope) e o prompt padrão de Loop.
    *   **Rationale**: Isso evita que o usuário tenha que redigir o prompt complexo novamente do zero, mantendo a "receita" ideal pré-carregada para uso imediato do botão "Gerar Animação".
*   `static/js/windows.js`:
    *   Atualizada função `resetBuilderState` para reinjetar os prompts padrão via `AIPrompts.getOpeningVideoPrompt()` e `getLoopVideoPrompt()`.

## [15/01/2026 - 15:45] - v4.2.8 - Importação Inteligente com I.A (Gemini)
### Arquivos Modificados:
*   `static/js/gemini-adapter.js`: [NOVO] Implementado adaptador para API do Gemini 1.5 Flash. Parser inteligente de HTML para JSON.
*   `static/js/history.js`: Adicionado fallback para usar o GeminiAdapter quando `data.json` não for encontrado.
*   `index.html`: Inclusão do script do Gemini e atualização de versões (v=4.2.8).
*   `final_template.html`: Refatorada lógica de renderização do botão Manual e adicionados logs de debug.
### Funcionalidades:
*   **Importação Inteligente**: Agora, ao importar convites antigos/externos sem metadados, a I.A lê o HTML e preenche o formulário automaticamente.
*   **Correção Manual**: Botão 'Manual' agora aparece corretamente mesmo sem modo imagem.

---

## [15/01/2026 - 16:45] - v4.2.10 - Fix: Chave de API Gemini & Storage
### Arquivos Modificados:
*   `static/js/gemini-adapter.js`:
    *   **Fix**: Adicionado tratamento de erro para `localStorage` (Tracking Prevention) para evitar falha na leitura da chave de API.
    *   **Robustez**: Fallback garantido para a chave hardcoded caso o storage falhe.
    *   **Debug**: Log parcial da chave para verificação de integridade no console.

---

## [15/01/2026 - 17:00] - v4.2.11 - Migração de Segurança (Server-Side AI)
### Arquivos Modificados:
*   `static/js/gemini-adapter.js`:
    *   **Refactor**: Removida toda lógica de chave de API no cliente.
    *   **Security**: Agora invoca a *Supabase Edge Function* `analyze-invitation` para processamento seguro.
    *   **Cleanup**: Remove automaticamente chaves antigas do `localStorage` do usuário.
*   `supabase/functions/analyze-invitation`: [NOVO]
    *   Function em Deno/TypeScript que atua como proxy seguro para a API do Google Gemini.
*   `deploy_to_github.py`: Executado para atualizar o frontend.

---

## [15/01/2026 - 17:15] - v4.2.12 - Otimização de Manual com IA
### Funcionalidades:
*   **Maximizar com IA (Manual)**: O botão "Otimizar com IA" no editor manual agora funciona de verdade!
    *   **Backend**: Nova Edge Function `optimize-manual` que usa Gemini AI.
    *   **Ação**: Rewrites o texto inserido para ser mais elegante/formal e insere automaticamente ícones (FontAwesome) relevantes ao contexto.
    *   **Frontend**: Feedback visual de carregamento ("Otimizando (IA)...") e tratamento de erros.

---

## [15/01/2026 - 17:35] - v4.2.13 - Fix: SDK Supabase Client
### Arquivos Modificados:
*   `static/js/supabase-adapter.js`:
    *   **Fix**: Exposto explicitamente `window.supabaseClient` para garantir acesso global à instância autenticada.
*   `static/js/gemini-adapter.js` & `static/js/windows.js`:
    *   **Refactor**: Atualizadas referências para usar `window.supabaseClient` ao invés de `supabase` (que era indefinido no escopo global).
    *   **Result**: Resolve erro `TypeError: Cannot read properties of undefined (reading 'invoke')` durante importação e otimização manual.

---

## [15/01/2026 - 17:55] - v4.2.14 - Fix: Persistência de Dados e Limpeza
### Correções Críticas:
*   `static/js/windows.js`:
    *   **Fix Data Saving**: A ordem de geração do `data.json` estava incorreta (antes de coletar os dados do formulário). Agora a coleta acontece ANTES do salvamento, garantindo que o arquivo json contenha todos os dados atuais.
    *   **Critical Fix**: Restaurada definição de `htmlContent` em `windows.js` (fetch do template) que havia sido removida acidentalmente, causando erro na publicação.
    *   **UI Fix**: Corrigido bug visual onde as "bolinhas" de status do deploy não atualizavam (mismatch de classes CSS/HTML). Agora elas exibem spinner/check conforme o progresso.
    *   **Manual Fix**: Adicionada verificação extra no template para garantir que o botão "Manual" apareça se houver texto, independende do link ('#') ser validado ou não. Correção de robustez.
*   **Deploy System (Backend)**:
    *   **Novo**: Edge Function `deploy-github-v2` implementada.
    *   **Feature**: "Atomic Subtree Replacement". Ao fazer deploy via servidor (fallback), o sistema agora **substitui** completamente a pasta do convite, removendo automaticamente arquivos antigos (lixo acumulado) em um único commit.
*   `functions/analyze-invitation`:
    *   **Fix 500 Error (V3)**:
        *   **Hard Truncate**: O input HTML é cortado nos primeiros 100KB *antes* de qualquer processamento. Isso evita travamentos (timeouts) com Regex em arquivos gigantes.
        *   **Connectivity Probe**: Adicionado teste automático de conexão com Gemini se a chamada principal falhar, para diferenciar erro de chave vs erro de payload.
        *   **API Key Update**: Chave de API atualizada e validada.
        *   **Upgrade**: Modelo atualizado para `gemini-3-flash-preview` (Gemini 2.0 Flash) para maior rapidez e precisão.
*   `functions/optimize-manual`:
    *   **fix**: API Key também atualizada neste módulo.
    *   **Upgrade**: Modelo atualizado para `gemini-3-flash-preview`.
*   `static/js/supabase-adapter.js`:
    *   Atualizado para usar a versão v2 do deploy no GitHub.
*   `deploy_to_github.py`:
    *   **Optimization**: Script já em uso versão otimizada (v2).

---

## [2026-01-14 18:55] - UI Tweaks & Deployment Optimization
### Arquivos Modificados:
*   `final_template.html`:
    *   Rationale: Feedback do usuário indicou que o alerta estava cobrindo demais o convite.
    *   Lines 191-196 (Update): Ajuste fino para `bg-black/5` e `backdrop-blur-[2px]` (quase invisível) para máxima legibilidade.
*   `static/js/github-adapter.js`:
    *   Added `deployBatch` with **Atomic Subtree Replacement**: Agora cria uma nova árvore limpa para o slug, substituindo completamente o conteúdo anterior. Isso remove arquivos antigos/obsoletos automaticamente e evita o acúmulo de lixo no repositório.
    *   Added `getLatestWorkflowStatus`: Implementada verificação real do status do GitHub Actions.
    *   Rationale: Resolver problema de múltiplos workflows disparados e mensagem de sucesso prematura.
*   `static/js/windows.js`:
    *   Integration: Atualizada lógica de publicação para usar `deployBatch` e polling robusto via `getLatestWorkflowStatus`.
    *   UI Update: Indicadores de status agora usam Amarelo (Amber-500) para "Processando/Carregando" e Verde para "Sucesso".
    *   Fix: Link do repositório final corrigido para apontar para a pasta do slug em `mforgedesign/Convites`.
    *   Optim: Reduzido intervalo de polling para 2s e adicionado anti-cache na requisição do status para feedback imediato.
    *   UI Finalization (Watermark): Removido "vidro" e fundo. Trocado para texto branco (25% opacidade) com outline preto suave (1px) para legibilidade sem obstrução.
*   **URL**: https://builder.mforge.com.br/v4/

---

## [14/01/2026 - 18:42] - v4.2.7 - Deploy Manual da Versão Atual
### Ações Realizadas:
*   **Deploy**: Execução do script `deploy_to_github.py` para atualizar a versão em produção no repositório `mforgedesign/Builders`.
*   **URL**: https://builder.mforge.com.br/v4/

---

## [12/01/2026 - 17:35] - v4.2.4 - Correção Crítica de Publicação e Música
### Arquivos Modificados:
*   `static/js/windows.js`:
    *   **Fix**: Alterado chave de asset de música de `music` para `musica` (agora alinha com o estado salvo tanto por samples quanto por upload).
    *   **Fix**: Adicionado `JSON.stringify(menuConfig)` na compilação do HTML final. Antes, entrava como `[object Object]`, o que gerava erro de sintaxe e quebrava todo o JS do convite publicado (botões e interação não funcionavam).
    *   **Feature**: Atualizada URL final de sucesso para `https://convites.mforge.com.br/` ao invés do domínio padrão do GitHub Pages.
    *   **Fix**: Adicionado replacements faltantes para `[[BUTTON_SIZE]]` e `[[COMPANION_HIDE_CLASS]]`.

---

## [2026-01-12 14:45] - v4.2.3 - Fix Completo de Persistência & "Esquecidos"
### Arquivos Modificados:
*   `static/js/persistence.js`:
    *   **Fix Critical**: `saveFormState` reescrito para coletar dados **diretamente do DOM** (`querySelectorAll`) ao invés de confiar no objeto `window.builderState` (que chegava vazio na 2ª recarga, limpando o localStorage).
*   `static/js/windows.js`:
    *   **Music Name Sync**: Adicionada lógica para atualizar o input hidden `#music-track-name-hidden` quando uma música é escolhida (Sample) ou enviada (Drop/Upload).
*   `static/js/form.js`:
    *   **Restore Logic**: Adicionado listener para atualizar o texto visual da música quando o formulário é populado.
*   `index.html`:
    *   **Persistence Tracking**: Adicionados atributos `data-field="..."` e classe `form-input` em **TODOS** os campos que estavam "esquecidos":
        *   Textareas de Prompts de IA (Capa, Folha, Intro Motion, Loop Motion, Fill Prompt, Gifts Prompt)
        *   Toggles (Watermark, Animate Background)
    *   **Hidden Field**: Adicionado `<input type="hidden" id="music-track-name-hidden">` para persistir o nome da música.
    *   **Version Bump**: Scripts atualizados para `v4.2.3`.

## [2026-01-12 14:03] - Correções de Persistência e Formulário (v4.2.2)

### Problemas Corrigidos:
1. **QuotaExceededError** - localStorage excedia 5MB com assets grandes
2. **Formulário perdido na 2ª recarga** - dados eram sobrescritos com objeto vazio
3. **Músicas 404** - paths errados para arquivos de sample
4. **Autocomplete não detectado** - browser autocomplete não dispara input events

### Soluções Implementadas:

#### IndexedDB para Assets (persistence.js)
* Reescrita completa usando IndexedDB ao invés de localStorage para assets
* Suporta 50MB+ de armazenamento
* localStorage usado apenas para dados leves (formData, linksExtras)

#### Fix Form Populate (form.js)
* `populateForm()` agora verifica se state está vazio antes de popular
* Não sobrescreve campos existentes com valores vazios
* Adicionado listener `blur` para detectar autocomplete do navegador

#### Paths das Músicas (index.html)
* Corrigido de `musica-base/` para `música base/` (pasta real)
* Sample names corrigidos para match com arquivos existentes

### Arquivos Modificados:
* `static/js/persistence.js`: IndexedDB storage completo
* `static/js/form.js`: Skip empty state + blur listener
* `static/js/windows.js`: Clear IndexedDB on reset
* `index.html`: Music paths, script versions v4.2.2

---

## [2026-01-12 13:08] - Cache Busting para Scripts

### Problema:
* Navegador pode estar servindo versão antiga dos scripts em cache
* Scripts não tinham parâmetros de versão consistentes

### Solução:
* Atualizados TODOS os scripts com `?v=4.1.0` para forçar invalidação do cache
* Adicionado parâmetro de versão em scripts que não tinham

### Arquivos Modificados:
* `index.html`: Linhas 1916-1933 - Todos os scripts agora têm `?v=4.1.0`

---

## [2026-01-12 12:53] - Rewrite Persistence with Eager Save Strategy

### Problema:
A correção anterior (12:28) NÃO funcionou porque:
* `saveState()` era **async** mas `beforeunload` não espera Promises
* O navegador fechava ANTES do `await blobToBase64()` completar
* Debounce de 1 segundo não era adequado

### Nova Estratégia:
**Salvamento Imediato (Eager Save):**
1. Converte blobs para Base64 **IMEDIATAMENTE** quando arquivo é selecionado
2. Mantém **cache** de Base64 já convertido (`assetsBase64Cache`)
3. Salva **SINCRONAMENTE** usando o cache (não depende de async)

### Arquivos Modificados:

* `static/js/persistence.js`: **REESCRITA COMPLETA**
  * Adicionado `assetsBase64Cache` - cache de assets em Base64
  * Adicionado `saveStateSync()` - função síncrona de salvamento
  * Adicionado `processAndSaveAsset()` - converte e salva imediatamente
  * Modificado listener `mediaUpdated` - processa assets na hora
  * `beforeunload` agora chama função síncrona
  * Adicionada API pública: `Persistence.processAsset`, `removeAsset`, `getCache`

### Arquivos de Backup:
* `static/js/persistence_bkp_20260112_1252.js`

### Prompt Original:
> Os itens ainda não estão sendo salvos após correção anterior

---

## [2026-01-12 12:28] - Fix Persistence Issues (Major Fix)

### Problema:
Após fechar e reabrir o navegador, os seguintes itens não eram restaurados:
* Links extras
* Imagem de capa
* Vídeo de abertura
* Imagem da lista de presentes
* Imagem do manual
* Música selecionada
* Slug da URL

### Causa Raiz:
1. **Links extras**: `saveLinksToBackend()` não atualizava `window.builderState.linksExtras`
2. **Assets (capa, vídeo, imagens)**: Salvando blob URLs que são inválidas após fechar o navegador
3. **Música**: Salvando blob object que não pode ser serializado para localStorage
4. **Slug**: Faltava a classe `form-input` no input para ser rastreado pelo `form.js`

### Arquivos Modificados:

* `index.html`:
  * Line 1622: Adicionada classe `form-input` ao input do slug

* `static/js/links-extras.js`:
  * Lines 51-55: Adicionada atualização de `window.builderState.linksExtras` em `saveLinksToBackend()`

* `static/js/persistence.js`:
  * Lines 21-41: Adicionada função `blobToBase64()` helper
  * Lines 43-71: Refatorada `saveState()` para ser async e converter blobs para Base64
  * Lines 110-210: Refatorada restauração de assets com `base64ToBlob()` e tratamento especial para música

* `static/js/windows.js`:
  * Lines 524-537: Adicionado salvamento de blob no `builderState.assets` ao selecionar arquivo
  * Lines 578-591: Adicionado salvamento de blob no `builderState.assets` ao fazer drop
  * Line 248: Corrigida key de `music` para `musica` para consistência
  * Lines 263-271: Adicionado dispatch de `mediaUpdated` ao selecionar música base
  * Line 930: Corrigida referência de `assets.music` para `assets.musica`
  * Lines 879-886: Adicionada limpeza do localStorage no `resetBuilderState()`

### Arquivos de Backup Criados:
* `static/js/persistence_bkp_20260112_1227.js`
* `static/js/links-extras_bkp_20260112_1227.js`
* `static/js/windows_bkp_20260112_1227.js`

### Impacto no Botão "Novo Convite":
* Agora também limpa o localStorage, garantindo reset completo

### Verificação Necessária:
- [ ] Links extras persistem após reload
- [ ] Imagem de capa persiste após reload
- [ ] Vídeo de abertura persiste após reload
- [ ] Imagem de presentes persiste após reload
- [ ] Imagem do manual persiste após reload
- [ ] Música selecionada persiste após reload
- [ ] Slug persiste após reload
- [ ] Botão "Novo Convite" zera tudo corretamente

### Prompt Original:
> Eu preenchi no formulário [...] Agora, eu fechei o navegador e abri novamente [...]
> O link extra que adicionei não ficou salvo; A imagem de capa não ficou salva; [...]

---

## [2026-01-12 11:46] - Deploy para Novo Repositório GitHub

### Contexto:
* Migração do projeto para novo repositório após problema com IDE no repositório anterior
* Novo repositório: `mforgedesign/Builders`
* Novo domínio: `builder.mforge.com.br`

### Arquivos Criados:
* `deploy_to_github.py`: Script Python para deploy automatizado via GitHub API
  * Faz upload de todos os arquivos do projeto
  * Configura CNAME para domínio customizado
  * Cria redirecionamento na raiz para `/v4/`
  * Habilita GitHub Pages automaticamente

### Arquivos Publicados (33 total):
* `v4/index.html` - Interface principal do builder
* `v4/final_template.html` - Template de convite final
* `v4/static/js/*.js` - 14 módulos JavaScript
* `v4/static/css/main.css` - Estilos
* `v4/templates/*.html` - Templates Jinja2
* `v4/música base/*.mp3` - Samples de música
* Assets e configurações

### URLs de Acesso:
* **Domínio Customizado**: https://builder.mforge.com.br/v4/
* **GitHub Pages**: https://mforgedesign.github.io/Builders/v4/

### Prompt Original:
> Quero publicar o projeto no repositório https://github.com/mforgedesign/Builders
> CNAME builder.mforge.com.br com acesso em builder.mforge.com.br/v4

---

## [2026-01-12 12:15] - Fix Timer Visibility Bug

### Problema:
* O timer de contagem regressiva aparecia no preview desktop mesmo quando o checkbox "Timer de Contagem Regressiva" estava desmarcado no formulário.
* O timer mobile já estava correto com `style="display: none;"` por padrão.

### Arquivos Modificados:
* `index.html`:
  * Line 1765: Adicionado `style="display: none;"` ao elemento `#preview-timer` (preview desktop).
  * Rationale: Equiparar comportamento com o preview mobile que já possuía `display: none` por padrão.

### Arquivos de Backup Criados:
* `index_bkp_20260112_1210.html`
* `static/js/preview_bkp_20260112_1210.js`

### Verificação:
* A lógica de `updateTimerVisibility()` em `preview.js` já tratava corretamente valores `undefined`, `false`, e `null` como "ocultar timer".
* O `final_template.html` usa `[[TIMER_HIDE_CLASS]]` que é substituído por `hidden` quando timer está desativado.

### Status:
* Timer agora inicia oculto por padrão em ambos os previews (desktop e mobile).
* O checkbox controla corretamente a visibilidade.

### Prompt Original:
> O timer já está aparecendo, mas no formulário ele está desmarcado. Quero que arrume isso.

---

## [2026-01-12 12:12] - Fix History Branch Configuration

### Problema:
* O módulo de Histórico (`history.js`) estava buscando convites do branch `main`, mas o repositório `mforgedesign/Convites` usa o branch `recuperaçãohoje`.

### Arquivos Modificados:
* `static/js/history.js`:
  * Line 15: Adicionada constante `GITHUB_BRANCH = 'recuperaçãohoje'`
  * Line 15: Atualizado `GITHUB_REPO_BASE` para usar a variável `GITHUB_BRANCH`
  * Line 75: Atualizada API call do Git Trees para usar `GITHUB_BRANCH`
  * Line 163: Atualizada URL do raw.githubusercontent para usar `GITHUB_BRANCH`

### Arquivos de Backup Criados:
* `static/js/history_bkp_20260112_1210.js`

### Status:
* O histórico agora busca convites do branch correto (`recuperaçãohoje`).

### Prompt Original:
> O histórico precisa buscar nesse local ( https://github.com/mforgedesign/Convites )
> Atualmente está buscando em outro branch.

---

## [2025-12-31 18:46] - FASE 1: Infraestrutura Backend Completa (Supabase)

### Database Schema Criado (Supabase)
**Projeto**: Autobuilder v4 (ymttaaebrqcfrgipqwvy), Region: sa-east-1

#### Migration: create_invitations_table
* **Descrição técnica**: Tabela principal `invitations` com 28 campos
* **Rationale**: Centralizar dados do convite (evento, visual, links, toggles, state_json)
* **Features**: Trigger auto-update `updated_at`, indexes em `slug` e `user_id`, checks em modes

#### Migration: create_invitation_assets_table
* **Descrição técnica**: Tabela `invitation_assets` para assets (cover, sheet, videos, music)
* **Rationale**: Múltiplos assets por convite com versionamento
* **Features**: 10 tipos asset_type, CASCADE delete, indexes compostos

#### Migration: create_extra_links_and_build_history_tables
* **Tabelas**: `invitation_extra_links` (botões customizados), `build_history` (deploys)
* **Rationale**: Links dinâmicos ordenáveis + auditoria de deploys
* **Features**: order_index, github_commit_sha tracking

#### Migration: enable_rls_and_policies
* **Descrição**: RLS habilitado em todas as 4 tabelas com policies permissivas
* **Rationale**: Acesso público para MVP (builder tool), considerar auth em prod
* **⚠️ Security Note**: Policies "Anyone can..." - não recomendado para produção

### Storage Bucket Criado
**Nome**: `invitation-assets` (public)
**Policies**: CRUD público completo

### Edge Functions Deployed (5 total)

#### 1. generate-image (Fal.ai - Seedream)
* **Endpoint**: POST /functions/v1/generate-image
* **Features**: text-to-image e image-to-image, 9:16 aspect ratio, CORS enabled
* **Models**: Seedream v4, Seedream v4.5

#### 2. generate-video (Fal.ai - Video Models)
* **Endpoint**: POST /functions/v1/generate-video
* **Features**: Suporta Hailuo-02, Kling-O1, Veo3.1
* **Keyframes**: start_frame e end_frame para loops perfeitos

#### 3. process-image (Background Removal + Inpainting)
* **Endpoint**: POST /functions/v1/process-image
* **Features**: BiRefNet (remove BG) + Seedream v4.5 (inpainting)
* **Output**: leaf_only.png e background_only.jpg

#### 4. chatbot-intent (OpenAI GPT-4)
* **Endpoint**: POST /functions/v1/chatbot-intent
* **Features**: System prompt em PT-BR, context-aware, structured JSON response
* **Actions**: updateState, generateImage, generateVideo, switchWindow

#### 5. deploy-github (GitHub Pages Deploy)
* **Endpoint**: POST /functions/v1/deploy-github
* **Features**: Auto-deploy via GitHub API, conflict detection, commit SHA tracking
* **Repo Target**: mforgedesign/convites.mforge.com.br

### Environment Variables Configuradas
* FAL_API_KEY, OPENAI_API_KEY, GITHUB_TOKEN configurados no Supabase Edge Functions secrets

### Próximos Passos
* **Phase 2**: Frontend integration (conectar builder.html existente às Edge Functions)
* **Phase 3**: Implementar build system e template rendering

---


## [2025-12-30 17:17] - Conexão de Botões às Rotas API

### Arquivos Modificados:
* `static/js/windows.js`:
    * Lines 204-330: Conectou dropzones à rota `/api/upload/<contexto>`
    * Lines 420-530: Conectou botões AI à rota `/api/generate/<tipo>`
    * Adicionou `uploadFile()` para envio via FormData
    * Adicionou `updateDropzonePreview()` para preview de imagem/vídeo
    * AI buttons agora buscam state para obter image_url em geração de vídeo
    * Mapas: `DROPZONE_CONTEXTS` e `AI_TYPE_TO_DROPZONE`

* `app.py`:
    * Lines 808-910: Adicionou rota `/api/history` (lista convites publicados)
    * Lines 850-905: Adicionou rota `/api/samples` (lista 4 samples de música)

### Arquivo windows.js cresceu de 598 para ~660 linhas

---

## [2025-12-30 16:35] - Expansão Completa das 12 Janelas do Builder

### Arquivos Criados:
* `static/js/windows.js`:
    * 480+ linhas de JavaScript
    * Mode toggles (Manual, Gifts, Fill)
    * Animation tabs (Intro/Loop)
    * Music player com progress bar
    * Dropzone handling com preview
    * Finalize buttons (preview/download/publish)
    * AI generation button handlers
    * Manual HTML editor

### Arquivos Modificados:
* `templates/builder.html`:
    * Lines 489-750: Expandiu 7 janelas placeholder para componentes completos
    * **Folha Vazia**: Dropzone, prompt IA, toggle animar background, preview de layers
    * **Animação**: Tabs para Abertura/Loop, video dropzones, prompts de movimento
    * **Preencher Folha**: Toggle overlay/flat, prompts, download buttons
    * **Presentes**: Toggle link/popup, URL input, sugestões, image dropzone
    * **Manual**: Toggle texto/imagem, HTML editor raw, preview WYSIWYG
    * **Música**: Audio player, progress bar, 4 samples library
    * **Finalizar**: Slug input, watermark toggle, deploy status, preview/build/publish, custom ZIP upload

### Resumo:
* Arquivo cresceu de 764 para ~1500 linhas
* Todas as 12 janelas agora possuem UI funcional
* Próximo passo: Conectar JavaScript aos novos elementos

### Prompt Original:
> Gap analysis aprovado. Iniciar implementação das 12 janelas do builder.

---

## [2025-12-30 16:07] - Integração GitHub Pages

### Arquivos Criados:
* `utils/github_deploy.py`:
    * Classe `GitHubDeployer` com PyGithub
    * Métodos: `upload_file()`, `upload_text_file()`, `deploy_directory()`
    * Auto-detecção de usuário a partir do token
    * Verificação de existência de arquivos
    * Geração de URL do GitHub Pages
    * Rationale: Deploy automático de convites

* `tests/test_github_deploy.py`:
    * 5 testes headless:
        1. GitHub Connection
        2. File Upload (test_deploy.txt)
        3. File Exists (verificação via API)
        4. Pages URL
        5. Cleanup
    * Flag `--keep` para manter arquivo de teste
    * Rationale: Validação do deploy

### Arquivos Modificados:
* `app.py`:
    * Lines 671-807: Rota POST `/api/publish`
        - Recebe slug do convite
        - Gera build do projeto
        - Extrai e faz upload para GitHub
        - Retorna URL do GitHub Pages
    * Rationale: Endpoint de publicação

* `.env`:
    * Adicionado `GITHUB_REPO` para configurar repositório de destino
    * Rationale: Flexibilidade de deploy

### Nota:
> ⚠️ O teste requer um repositório GitHub válido e acessível.
> Configure `GITHUB_REPO=owner/repo` no `.env`

### Prompt Original:
> Integração final com GitHub. PyGithub: check de repositório e upload.
> Teste Headless: test_github_deploy.py

---

## [2025-12-30 16:02] - Build e Geração de ZIP

### Arquivos Criados:
* `utils/build.py`:
    * Função `render_template()` - Substitui placeholders [[KEY]] por valores do state
    * Função `generate_data_json()` - Gera metadados do convite
    * Função `build_project()` - Processo completo de build:
        - Renderiza HTML com Jinja2-style placeholders
        - Gera data.json com configurações
        - Cria estrutura de pastas (capa/, abertura/, loop/, musica/)
        - Empacota em ZIP com zipfile
    * Função `_inject_menu_config()` - Injeta configuração dos botões
    * Função `_inject_button_color()` - Injeta cor customizada via CSS
    * Rationale: Módulo de build com renderização e empacotamento

* `tests/test_build_process.py`:
    * 6 testes headless:
        1. Server Health Check
        2. State Setup (configura estado de teste)
        3. Build Endpoint (aciona /api/build)
        4. ZIP Valid (valida formato)
        5. Required Files (index.html, data.json)
        6. HTML Rendering (verifica placeholders substituídos)
    * Salva ZIP em test_output.zip para inspeção
    * Rationale: Validação completa do processo de build

### Arquivos Modificados:
* `app.py`:
    * Line 12: Adicionado `send_file` ao import
    * Lines 573-668: Rota POST `/api/build`
        - Obtém estado da sessão
        - Coleta arquivos uploadados
        - Gera ZIP via build_project()
        - Retorna arquivo para download
    * Rationale: Endpoint para geração do convite final

### Prompt Original:
> Implemente o build_project e a geração de ZIP. Renderização: Jinja2. 
> Renomeação e Empacotamento: zipfile. Teste Headless.

---

## [01/01/2026 - 21:30] - Premium Deployment UI & Stabilization
### Arquivos Modificados:
*   `index.html`:
    *   Added `#deploy-status-modal`: Nova interface de status de publicação (modal escuro com passos em tempo real).
    *   Updated script versions to `v=4.0.8` para forçar atualização de cache.
*   `static/js/windows.js`:
    *   Added `pollDeployStatus`, `showDeployModal`, `updateDeployModalStatus`: Lógica para gerenciar o novo modal de status.
    *   Refatoração `setupPublish`: Removidos `alert()` nativos em favor da nova UI.
    *   **FIX CRÍTICO 1**: Corrigido `SyntaxError` (bloco catch duplicado) que quebrava o carregamento do script (Drag-and-Drop não funcionava).
    *   **FIX CRÍTICO 2**: Restaurada função `setupProcessButtons` que havia sumido, causando `ReferenceError`.
    *   **FIX CRÍTICO 3**: Movida declaração de `const formData` para o topo do escopo em `setupPublish` para corrigir erro `Cannot access 'formData' before initialization`.
    *   **FEAT**: `pollDeployStatus` agora faz requisições HTTP reais (`HEAD`) com cache-buster e timeout de 2min.
*   `final_template.html`:
    *   **FIX CRÍTICO DE PATHS**: Substituídos caminhos hardcoded (`loop/`, `abertura/`, `musica/`) por placeholders dinâmicos (`[[VIDEO_LOOP_URL]]`, `[[CAPA_URL]]`, etc.) compatíveis com o novo deploy.
    *   **FIX CAPA**: Removido overlay redundante (`overlayInicial`) para usar apenas `capaInicial` com a URL correta.
    *   **FIX IMAGENS**: Atualizadas imagens de Manual e Presentes para usar URLs dinâmicas.

*   `windows.js`:
    *   **FIX IMPORTAÇÃO SILENCIOSA**: Refatorado `restoreBuilderState` para usar `populateForm` em vez de iterar updates individuais. Isso preveniu o "spam de notificações" e crashes causados por centenas de requisições simultâneas durante a importação do GitHub.


## v4.2.5 - Hotfix: Publishing replacements order
### v4.2.5 - Hotfix - 12/01/2026
*   `static/js/windows.js`:
    *   Lines 1400+: Corrigida ordem de execução das substituições para garantir que `[[MENU_CONFIG]]`, `[[BUTTON_SIZE]]`, e `[[COMPANION_HIDE_CLASS]]` sejam processados ANTES de povoar `filesMap`. Isso corrige o erro de referência e a falta de interatividade no convite publicado.
    *   Movidos logs de debug para escopo correto.

### v4.2.6 - Fix Visual e Botões - 13/01/2026
*   `final_template.html`:
    *   Fix: `folhaPreenchida` agora é revelada explicitamente na transição para o loop, garantindo que o fundo não fique preto se o video loop for transparente ou demorar a carregar.
*   `static/js/windows.js`:
    *   Fix: `BUTTONS_OFFSET` agora é calculado e substituído corretamente (`formData.botoes_offset`).
    *   Fix: `EVENT_DATETIME` é gerado unindo data e hora do evento, corrigindo o Timer/Contagem Regressiva.
    *   Fix: `BUTTON_COLOR` agora prioriza `cor_botoes` > `shadow_color` > default. Adicionada injeção de CSS Variable para forçar a cor de fundo correta (override em `.custom-button-bg`).
    *   Fix: Manual agora busca texto também de `manual-raw-text` (fallback).
    *   Fix: Removido checagem legada de `link_localizacao`.
    *   Fix: Corrigido mapeamento de nomes de variáveis que causava falha no Timer e Posição dos Botões:
        *   `data_evento` -> `data` (fallback)
        *   `hora_evento` -> `hora` (fallback)
        *   `botoes_offset` -> `posicao_botoes` (fallback)
    *   Fix: Sincronização INCONDICIONAL de `formData` com `AutoBuilderForm.data` antes da publicação.
    *   Fix: Implementado **DOM Scraping** direto dos inputs (`.form-input`) na hora de publicar.
    *   New: Adicionado Checkbox "Baixar Log de Debug" na tela de publicação (desmarcado por padrão).
    *   Fix: Corrigido Timer/Contagem não aparecendo (fallback seguro para verificação booleana `String(val) === 'true'`).
    *   Fix: Implementada lógica de fallback para Modo Manual/Presentes: Se houver imagem e o texto estiver vazio, o builder força o modo de Imagem, prevenindo erro caso a persistência visual falhe.
    *   Fix: Reimplementada a **Marca d'Água (Pagamento Pendente)**. A estrutura HTML não existia no template final e foi reinserida com z-index alto para garantir visibilidade.
    *   Fix: Implementada **Persistência de Toggles** (Modo Imagem/Texto) no `persistence.js`. Agora o builder lembra qual aba estava selecionada após o recarregamento.
    *   **UX Upgrade (Publicação):**
        *   Removido o popup bloqueante durante a publicação. O status agora é exibido diretamente no painel "Finalizar".
        *   Adicionado acompanhamento "Real-Time" (verificação ativa se o link já está no ar).
        *   Adicionado botão **"Abrir Pasta no GitHub"** para acesso rápido aos arquivos gerados.
        *   *Motivo:* A persistência de dados (IndexedDB) preenchia o visual (DOM) mas não atualizava o estado interno da memória (`AutoBuilderForm.data`), resultando em envio de configurações vazias. Agora, o sistema lê o que está na tela, garantindo 100% de fiabilidade.
    *   Fix: Botões "Manual", "Localização" e "RSVP" agora aparecem corretamente.
*   `static/js/debug-logger.js`:
    *   New: Ferramenta de diagnóstico adicionada. Gera e baixa automaticamente um relatório `debug_report_X.txt` ao publicar. Contém snapshots dos dados do formulário, configuração de menus e trechos cruciais do HTML gerado.
*   `index.html` e `windows.js`:
    *   Injeção do script de debug e gatilho de geração de relatório.

## v4.2.4 - Publishing Logic Fixes (Current)

### Arquivos Criados:
* `utils/ai_wrapper.py`:
    * Classe `FalAIClient` para comunicação com Fal.ai
    * Métodos:
        - `generate_image()`: Seedream V4 (text-to-image)
        - `generate_video_from_image()`: SORA 2 (image-to-video)
        - `generate_video_interpolation()`: Veo3.1 (frame interpolation)
    * Funções de conveniência: `generate_image()`, `generate_video()`, `generate_video_transition()`
    * Utilitários: `image_to_data_uri()`, `download_file()`
    * Rationale: Abstração da API Fal.ai para uso no builder

* `tests/test_ai_integration.py`:
    * Testes headless para integração AI
    * Modo MOCK (sem consumir créditos): `python test_ai_integration.py --mock`
    * Modo REAL (consome créditos): `python test_ai_integration.py --real`
    * Testes: server health, tipo inválido, prompt obrigatório, geração de imagem, download
    * Rationale: Validação completa da integração AI

### Arquivos Modificados:
* `app.py`:
    * Lines 444-570: Rotas POST `/api/generate/<tipo>`
    * Tipos suportados: `image`, `video`, `video_transition`
    * Validação de parâmetros obrigatórios
    * Tratamento de erros específicos (AIGenerationError)
    * Rationale: Endpoints para geração de conteúdo via IA

### Prompt Original:
> Conecte as APIs (Fal.ai) no backend. Módulo AI: utils/ai_wrapper.py. 
> Rotas: POST /api/generate/<tipo>. Teste Headless.

---

## [2025-12-30 15:00] - Melhorias Mobile UI

### Arquivos Modificados:
* `templates/builder.html`:
    * Sidebar refatorada para slide-in mobile (hamburger menu)
    * Overlay backdrop ao abrir menu
    * Botão hamburger no header
    * Modal de preview mobile com sincronização
    * Template de Links Extras redesenhado:
        - Layout vertical para mobile
        - Campos maiores (p-3 vs p-2)
        - Espaçamento melhorado
        - Botão delete visível
    * JavaScript inline para toggle de menu/preview
    * Rationale: UX mobile amigável

### Prompt Original:
> Melhorar a UI da versão mobile: hamburger menu, preview mobile, campos maiores

---

## [2025-12-30 14:55] - Sistema de Upload de Arquivos

### Arquivos Modificados:
* `app.py`:
    * Lines 233-430: Rota POST `/api/upload/<contexto>`
    * Validação de extensões por contexto:
        - capa, folha_vazia, folha_preenchida, manual, presentes: jpg, jpeg, png, webp
        - abertura, loop, folha_animada: mp4, webm, mov
        - musica: mp3, wav, ogg, m4a
    * Armazenamento em `static/uploads/<session_id>/`
    * Funções auxiliares: `allowed_file()`, `get_session_upload_dir()`, `secure_filename_custom()`
    * Rationale: Upload seguro com isolamento por sessão

### Arquivos Criados:
* `tests/test_file_upload.py`:
    * Cria imagem dummy JPEG válida (348 bytes)
    * Testa upload de capa (200 OK)
    * Verifica existência no disco via `os.path.exists()`
    * Testa rejeição de extensão inválida (.exe)
    * Testa rejeição de contexto inválido
    * Testa upload de MP3
    * Rationale: Validação completa do sistema de upload

### Prompt Original:
> Implemente o sistema de Uploads com validação de extensões e teste headless

---

## [2025-12-30 14:32] - Preview Controller (Reativo)

### Arquivos Criados:
* `static/js/preview.js`:
    * Renderização condicional de botões
    * Botões nativos aparecem APENAS se links preenchidos:
        - Local: link_google_maps
        - Confirmar: numero_whatsapp
        - Presentes: link_presentes
    * Links Extras adicionados dinamicamente
    * Se nenhum link: preview fica sem botões
    * **Background com prioridade:**
        1. Folha Animada (vídeo) OU Folha Preenchida (imagem)
        2. Folha Vazia (fallback)
        3. Gradiente padrão (se nenhuma mídia)
    * Evento `mediaUpdated` para atualizar fundo
    * Rationale: Preview reativo conforme solicitação

### Arquivos Modificados:
* `templates/builder.html`:
    * Line 638: Script preview.js adicionado
    * Rationale: Integração do preview reativo

### Prompt Original:
> Se não houverem links, não deve ter botões
> Imagem de fundo: folha animada ou folha preenchida > folha vazia > gradiente

---

## [2025-12-30 14:29] - Links Extras (Dynamic Array)

### Arquivos Criados:
* `static/js/links-extras.js`:
    * Gerenciamento de array dinâmico
    * Funções addLinkRow, removeLinkRow, saveLinksToBackend
    * Carga inicial do backend
    * Rationale: UI dinâmica para botões personalizados

* `tests/test_links_extras.py`:
    * Testa persistência de array
    * Valida adição de múltiplos links
    * Rationale: Validação de links extras

### Arquivos Modificados:
* `templates/builder.html`:
    * Lines 297-370: Seção Links Extras com:
        - Template HTML para clonagem de linhas
        - Botão Adicionar Link
        - Seletor de ícones (16 opções FontAwesome)
        - Drag handle para reordenação futura
    * Lines 633-637: Script links-extras.js adicionado
    * Rationale: Dynamic array conforme Doc bruto

### Prompt Original:
> Os links extra, conforme explicado no doc bruto

---

## [2025-12-30 14:23] - Passo 3: Formulário e Two-Way Binding

### Arquivos Criados:
* `static/js/form.js`:
    * Two-way binding via fetch API
    * Debounce para inputs de texto
    * Sincronização de color pickers
    * Evento stateUpdated para preview
    * Rationale: Sincronização de formulário com backend

* `tests/test_form_submission.py`:
    * Simula payload JSON (cor_botoes)
    * Testa múltiplos campos
    * Valida persistência na sessão
    * Rationale: Validação de submissão de formulário

### Arquivos Modificados:
* `templates/builder.html`:
    * Lines 157-300: Formulário expandido com campos:
        - Identidade: nome, tipo_evento, data, hora, idade, tema_evento, local_evento, paleta_cores, frase_convite
        - Estilo: cor_botoes, sombra_gradiente, posicao_botoes, tamanho_botoes
        - Links: link_google_maps, link_presentes
        - RSVP: numero_whatsapp, link_confirmacao
        - Toggles: permitir_acompanhante, timer_contagem
    * Lines 558-561: Adicionado script form.js
    * Rationale: Campos baseados no Doc de Criação

### Prompt Original:
> Implemente os Inputs do Formulário e o Two-Way Binding com JS Fetch e 
> teste headless test_form_submission.py

---

## [2025-12-30 14:17] - Passo 2: Estrutura Frontend

### Arquivos Criados:
* `templates/base.html`:
    * Template base Jinja2 com TailwindCSS, Font Awesome, estilos comuns
    * Rationale: Herança de templates e configuração centralizada

* `templates/builder.html`:
    * Interface completa do Builder com IDs obrigatórios
    * IDs: chatbot-container, dynamic-window-area, device-preview
    * Rationale: Estrutura principal da aplicação

* `static/js/navigation.js`:
    * Lógica de navegação entre janelas
    * Função showWindow() e event listeners
    * Rationale: Alternância de painéis sem recarregar página

* `tests/test_html_structure.py`:
    * Teste headless para validar estrutura HTML
    * Rationale: Verificação automatizada de IDs obrigatórios

### Arquivos Modificados:
* `app.py`:
    * Lines 114-123: Adicionada rota `/builder`
    * Rationale: Endpoint para renderizar interface do builder

### Prompt Original:
> Crie base.html e builder.html com IDs específicos (chatbot-container, 
> dynamic-window-area, device-preview). Lógica de navegação JS. Teste headless.

### Arquivos Criados:
* `static/css/main.css`:
    * Stylesheet placeholder
    * Rationale: Estrutura de diretório para assets CSS

* `static/js/app.js`:
    * JavaScript placeholder
    * Rationale: Estrutura de diretório para scripts JS

* `templates/index.html`:
    * Template Jinja2 básico
    * Rationale: Estrutura para renderização de páginas

* `utils/__init__.py`:
    * Pacote Python para módulos auxiliares
    * Rationale: Organização de código utilitário

* `tests/test_state_logic.py`:
    * Teste de persistência de estado
    * Rationale: Validação da API de estado

### Arquivos Modificados:
* `requirements.txt`:
    * Lines: Adicionado Flask-Session>=0.8.0
    * Rationale: Dependência para sessões server-side

* `app.py`:
    * Lines 24-30: Configuração Flask-Session (filesystem)
    * Lines 36-71: Função `get_default_builder_state()` com campos do formulário
    * Lines 110-131: Endpoint `GET /api/state`
    * Lines 134-172: Endpoint `POST /api/update_state`
    * Lines 175-192: Endpoint `POST /api/reset_state`
    * Rationale: API de gerenciamento de estado do builder

### Prompt Original:
> Construa a espinha dorsal do Backend: estrutura de pastas, Flask-Session, 
> API de Estado (GET/POST), teste headless test_state_logic.py

---

## [2025-12-30 11:07] - Passo 0: Configuração Inicial do Ambiente

### Arquivos Criados:
* `requirements.txt`:
    * Dependências Flask 3.0+, python-dotenv, requests, PyGithub, supabase
    * Rationale: Stack tecnológica definida para o AutoBuilder v4.0

* `.env`:
    * Variáveis de ambiente com tokens (GITHUB_TOKEN, SUPABASE_KEY, FAL_API_KEY, OPENAI_API_KEY)
    * Rationale: Armazenamento seguro de credenciais fora do código

* `.gitignore`:
    * Regras para ignorar .env, venv, __pycache__, backups
    * Rationale: Proteção de arquivos sensíveis e desnecessários no versionamento

* `app.py`:
    * Aplicação Flask básica com rotas `/` e `/health`
    * Configuração para porta 4000
    * Handlers de erro 404 e 500
    * Rationale: Base do servidor para desenvolvimento das funcionalidades

* `tests/__init__.py`:
    * Pacote Python para testes
    * Rationale: Estrutura de diretório para testes automatizados

* `tests/test_server_boot.py`:
    * Script de teste de boot do servidor
    * Testa rota raiz e health check
    * Rationale: Validação automatizada conforme protocolo de desenvolvimento

* `CHANGELOG.md` (este arquivo):
    * Registro de modificações
    * Rationale: Lei do Changelog - "Se não está no Changelog, não aconteceu"

* `developmentlog.md`:
    * Log de desenvolvimento
    * Rationale: Registro de funções criadas e saídas de teste

### Prompt Original:
> Passo 0: Configure o venv, requirements.txt, .env com os tokens e o app.py básico. 
> Crie um script tests/test_server_boot.py que faz um request para http://localhost:4000/ 
> e verifica se retorna 200 OK.
## [2026-01-01T16:15:00] - Custom ZIP Upload Implementation

### Arquivo Modificado:
* static/js/windows.js (lines 471-600): Implementado handler completo para upload de ZIP personalizado

### Funcionalidade:
- Drag-and-drop de arquivos .zip
- File input nativo
- Validação e confirmação antes do deploy
- Visual feedback com status indicators
- Endpoint: POST /api/deploy-custom-zip

## [2026-01-01T16:30:00] - Upload and Preview Bug Fixes

### Arquivos Modificados:
* supabase-adapter.js (line 100): Corrigido erro de sintaxe 'window.builder State' -> 'window.builderState'
* supabase-adapter.js (lines 135-139): Corrigida estrutura de resposta do upload API
* windows.js (lines 313-325): Adicionado disparo de evento mediaUpdated após uploads

### Bugs Corrigidos:
1. ✅ Failed to fetch: Erro de sintaxe quebrava todo o adapter
2. ✅ Upload response: Estrutura corrigida para {success, data: {url, context, file_url}}
3. ✅ Preview não atualizava: Adicionado evento mediaUpdated para preview.js escutar

## [2026-01-01 14:10] - History Window & Navigation Fixes

### Arquivos Modificados:
* `static/js/history.js`:
    * **Crucial Fix**: Substituído `window.Navigation.navigateTo` (inexistente) por `window.AutoBuilderNav.showWindow`.
    * **Feature**: Implementada lógica completa de importação (reset ambiente, fetch assets, hydrate form).
    * **UI/UX**: Cards alterados para vertical (aspect-ratio 9:16) para melhor visualização.
    * **Performance**: Melhorada detecção de arquivo de capa (`.includes` vs `.startsWith`).
    * **Bugfix**: Corrigido evento `windowChanged` para escutar `detail.windowId` corretamente.
    * **OPTIMIZATION**: Substituído loop de fetch (N+1 requests) por **Single Tree Request** (`git/trees`). Isso reduz de ~50 requests para **1 request**, eliminando erros 403 de Rate Limit.

* `static/js/supabase-adapter.js`:
    * **Bugfix**: Adicionada sanitização de nomes de arquivo (remove acentos/espaços) para evitar erros 400 no Supabase.

### Arquivos Criados:
* `static/js/ai-prompts.js`: Módulo com 7 templates de prompts para IA.

### Status:
* Janela de Histórico 100% funcional (Load, Lazy Loading, Import).
* Uploads funcionando sem erros de caracteres especiais.
## [2026-01-01 14:15] - UI/UX Fixes (Timer & Preview)

### Arquivos Modificados:
* `static/js/preview.js`:
    * **Fix**: Corrigida lógica de inicialização do timer (defaults to false).
    * **Fix**: Adicionado suporte para botões "Presentes" e "Manual" aparecerem quando imagem é carregada (antes dependia só de link).
    * **State**: Mapeamento de `media_presentes` e `media_manual` no estado global.
* `templates/builder.html`:
    * **Fix**: Adicionado ID `mobile-preview-timer` faltante, que impedia o timer de ser escondido no mobile.

### Status:
* Timer agora respeita o checkbox (invisível por padrão).
* Botões de Ação aparecem corretament ao fazer upload das imagens correspondentes.

## [2026-01-01 14:30] - Data Persistence Module

### Arquivos Criados:
* `static/js/persistence.js` (NEW): Módulo responsável por salvar/restaurar o estado do builder.

### Arquivos Modificados:
* `index.html`: Inclusão do script `persistence.js`.
* `static/js/windows.js`: Exposta a função `updateDropzonePreview` para permitir restauração de imagens.

### Funcionalidade:
* **Auto-Save**: Salva automaticamente alterações no formulário, uploads e links extras no `localStorage` do navegador.
* **Auto-Restore**: Ao abrir a página, o sistema verifica e restaura todo o trabalho anterior (dados, imagens e prévias).
* **Robustez**: Previne perda de dados acidental ao recarregar a aba.

## [2026-01-01 14:35] - Fix Preview Buttons Logic

### Arquivos Modificados:
* `index.html`:
    *   Adicionado `data-field="link_presentes"` ao input de link de presentes.
    *   Adicionado `data-field="manual_content"` ao editor HTML do manual.
    *   Adicionada classe `form-input` a ambos para rastreamento pelo `form.js`.
* `static/js/preview.js`:
    *   Lógica do botão "Manual" atualizada para checar `media_manual` OU `manual_content`.

### Correções:
* O botão "Presentes" agora aparece corretamente ao preencher apenas o link (modo texto).
* O botão "Manual" agora aparece corretamente ao preencher o texto (modo HTML/texto).

## [2026-01-01 14:45] - Fix Custom ZIP Upload

### Arquivos Criados:
* `static/js/github-adapter.js`: Novo adaptador para comunicação direta com a API do GitHub (Client-Side).

### Arquivos Modificados:
* `index.html`: Inclusão de `JSZip` (CDN) e `github-adapter.js`.
* `static/js/windows.js`: Reescrevida a função `handleZipUpload` para usar unzip local e upload via GitHub API, eliminando dependência de backend.

### Funcionalidade:
* **Deploy Client-Side**: Agora é possível subir ZIPs personalizados diretamente pelo navegador.
* **Autenticação**: O sistema solicitará seu Token GitHub (PAT) na primeira vez para autorizar a publicação.
* **Correção**: Eliminado erro "Endpoint not implemented".

## [2026-01-01 14:50] - Fix History Cover Detection

### Arquivos Modificados:
* `static/js/history.js`: Lógica de detecção de capa (coverUrl) aprimorada.

### Correções:
* O sistema agora identifica corretamente imagens de capa mesmo quando estão dentro de subpastas (ex: `slug/capa/imagem.jpg`) ou têm nomes variados.
* Corrigido bug de parsing que impedia a exibição da thumbnail nos cards do histórico.

## [2026-01-01 15:00] - Quick Fix: Preview & Timer

### Arquivos Modificados:
* `static/js/preview.js`: Corrigidos seletores DOM que não correspondiam ao HTML (`#preview-buttons` -> `#mobile-preview-buttons`).
* `index.html`: Timer definido explicitamente como `hidden` por padrão.

### Correções:
* **Botões na Prévia**: Corrigido bug onde os botões (Manual, Presentes) não apareciam porque o script buscava um ID inexistente.
* **Timer**: Agora começa oculto como padrão, respeitando a configuração inicial.

## [2026-01-01 15:15] - Secure Server-Side ZIP Upload

### Arquivos Modificados:
* `static/js/windows.js`: Lógica de upload refatorada para usar a Edge Function `deploy-github` via Supabase.
* `index.html`: Removida referência ao adaptador cliente-side inseguro.

### Melhorias:
* **Autenticação Automática**: O upload de ZIP agora usa o token seguro armazenado no servidor (Supabase), eliminando a necessidade de digitar tokens pessoais.
* **Segurança**: Operações sensíveis movidas de volta para o ambiente seguro das Edge Functions.

## [2026-01-01 15:30] - Fix: Persistence Race Conditions

### Arquivos Modificados:
* `static/js/persistence.js`: Timer excluído da restauração automática para garantir estado inicial oculto.
* `static/js/preview.js`: Corrigido listener de evento para processar corretamente a restauração em massa do estado (`source: persistence`).

### Correções:
* **Timer Persistente**: O timer não "teima" mais em aparecer no load; ele respeita a configuração padrão (oculto).
* **Botões Sumidos**: Corrigido bug onde os dados restaurados (ex: texto do manual) não atualizavam a prévia imediatamente. Agora a prévia reage corretamente ao carregamento dos dados salvos.
* **Preview Desktop Restaurado**: Corrigida regressão que havia quebrado a visualização lateral (desktop). Agora o script atualiza tanto o preview mobile quanto o desktop simultaneamente.
* **Interatividade**: Os botões do preview agora são clicáveis! Links abrem em nova aba, e manuais/presentes abrem simuladores de popup.
* **Lógica de Exclusão**: Inserir imagem de Presentes/Manual agora apaga automaticamente o texto/link correspondente (e vice-versa), garantindo que apenas um modo fique ativo.
* **Prioridade Estrita**: Ajustada a lógica do preview para seguir rigorosamente a documentação:
    * RSVP: Link Externo > WhatsApp.
    * Presentes: Link > Imagem.
    * Manual: Texto > Imagem.

## [2026-01-01 18:50] - Fix UI Regressions (Links & Music)

### Arquivos Modificados:
* `index.html`:
    * Injected "Ferramentas Externas" links (Seedream, Gemini, PXZ.ai) into "Folha Vazia", "Preencher Folha", "Presentes", and "Manual" windows.
    * Injected "Ferramentas Externas" links (Hailuo, Kling, Veo 2) into "Animação" window (both Intro and Loop tabs).
    * Rationale: Users need quick access to generation tools directly from the interface.

* `static/js/windows.js`:
    * Fix `setupMusicPlayer` to correctly define DOM elements (`playBtn`, `progressBar`, etc.) mapped to `index.html` IDs.
    * Rationale: Fixed regression where Music Player controls were undefined and non-functional.

## [2026-01-01 19:10] - Fix Mode Toggles (Gifts, Manual, Fill)

### Arquivos Modificados:
* `windows.js`:
    * Added error logging to `setupModeToggle` to diagnose missing elements.
    * Added `e.preventDefault()` to toggle click handlers to prevent potential form submission conflicts.
    * Added logic to update `dataset.mode` on the container for state persistence.
* `index.html`:
    * Added IDs to mode toggle containers (`#gifts-mode-buttons`, `#manual-mode-buttons`, `#fill-mode-buttons`) to support state persistence logic.
    * Added `data-mode` attributes to all mode toggle buttons to ensure correct initial state capturing.
    * Rationale: Users reported inability to switch modes. This fix standardizes the toggle structure and enables robust state saving.

## [2026-01-01 19:25] - Fix Critical Syntax Error (IIFE Break)

### Arquivos Modificados:
* `windows.js`:
    * **CRITICAL FIX**: Removed stray closing brace `}` at line 1167 that was prematurely terminating the IIFE.
    * Rationale: This syntax error caused the entire `windows.js` to fail silently, breaking ALL interactivity (mode toggles, music player, dropzones, finalize buttons, etc.). No console errors were shown because the script failed to parse entirely.

## [2026-01-01 19:45] - Deploy Music Samples

### Arquivos Adicionados (GitHub):
* `builder-v4/musica-base/sample_enrolados.mp3` - "I See The Light" (Disney)
* `builder-v4/musica-base/sample_perfect.mp3` - "Perfect" (Ed Sheeran Violin Cover)
* `builder-v4/musica-base/sample_vivalavida.mp3` - "Viva La Vida" (Instrumental)
* `builder-v4/musica-base/sample_enchanted.mp3` - "Enchanted" (Orchestral)

### Arquivos Modificados:
* `index.html`:
    * Updated sample `data-sample` paths from `música base/` to `musica-base/` (URL-safe).
    * Rationale: Files were deployed with clean names to avoid encoding issues with accented characters in URLs.

## [2026-01-01 20:20] - Fix Preview Buttons (Presentes & Manual)

### Arquivos Modificados:
* `final_template.html`:
    * Changed `const menuConfig = []` to `const menuConfig = [[MENU_CONFIG]]` to allow dynamic injection.
* `windows.js`:
    * Added complete `menuConfig` generation logic to preview function.
    * Now detects images in `#gifts-image-dropzone` and `#manual-image-dropzone`.
    * Correctly injects `isGiftImage: true` and `isManualImage: true` flags.
    * Rationale: Buttons for Presentes and Manual were not appearing in preview because menuConfig was empty.

## [2026-01-02 11:45] - Critical Persistence Fixes (Form & Assets)

### Crises Resolvidas:
1.  **Perda de Dados de Texto**: O formulário salvava `undefined` para todos os campos de texto porque `window.AutoBuilderForm.data` não estava exposto.
2.  **Imagem de Presentes Ausente**: O deploy buscava o asset `gifts`, mas ele estava salvo como `presentes`.

### Arquivos Modificados:
*   `static/js/form.js`:
    *   **FIX**: Adicionado getter `get data() { return localData; }` para expor o estado privatizado do módulo.
    *   **Rationale**: Permite que `windows.js` leia os dados do formulário durante o `generateBuilderState`.
*   `static/js/windows.js`:
    *   **FIX**: Alterado `getPath('gifts')` para `getPath('presentes')` no replacement do template.
    *   **Rationale**: Corrige o mapeamento para que a imagem de presentes (asset) seja encontrada e injetada no HTML final.

### Status:
*   A persistência de texto (Nomes, Local, etc) e imagens (Capa, Manual, Presentes) deve estar 100% funcional.
