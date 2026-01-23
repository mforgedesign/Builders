# AutoBuilder v4 - Criador de Convites Digitais

Aplicação web 100% serverless para criação de convites digitais interativos com IA.

## 🚀 Tecnologias

- **Frontend**: HTML5, CSS3 (Tailwind), JavaScript ES6+
- **Backend**: Supabase Edge Functions (Deno)
- **Deploy**: GitHub Pages
- **IA**: Fal.ai (Seedream, Hailuo, Kling) + OpenAI (GPT-4)

## 📦 Estrutura

```
index.html          - Aplicação principal (SPA)
final_template.html - Template do convite final
CHANGELOG.md        - Histórico de mudanças
```

## 🔗 Deploy

**URL de Produção**: `https://convites.mforge.com.br/autobuilder`

O frontend está hospedado no GitHub Pages e se conecta ao Supabase:
- **Project**: ymttaaebrqcfrgipqwvy.supabase.co
- **Region**: sa-east-1

## 🎯 Funcionalidades

### Janelas do Builder

1. **Chatbot** - Assistente IA (OpenAI GPT-4)
2. **Formulário** - Dados do evento (persiste no Supabase)
3. **Histórico** - Lista de convites criados
4. **Capa** - Geração de imagem (Fal.ai Seedream v4)
5. **Folha Vazia** - Base do convite + tratamento (layers)
6. **Animações** - Vídeos (abertura + loop)
7. **Preencher Folha** - Composição final
8. **Presentes** - Lista de presentes (link ou imagem)
9. **Manual** - Manual do convidado (texto ou imagem)
10. **Música** - Upload ou biblioteca de samples
11. **Publicar** - Deploy para GitHub Pages

### Edge Functions (Supabase)

- `generate-image` - Text/Image-to-Image (Seedream v4/v4.5)
- `generate-video` - Image-to-Video (Hailuo-02, Kling-O1, Veo3.1)
- `process-image` - Background removal + Inpainting
- `chatbot-intent` - NLP e orquestração (OpenAI)
- `deploy-github` - Deploy automático via GitHub API

## 🗄️ Database Schema

### invitations
Tabela principal com dados do convite (28 campos)

### invitation_assets
Assets (cover, sheet, videos, music) com URLs do Storage

### invitation_extra_links
Botões customizados dinâmicos

### build_history
Histórico de deploys e commits

## 🔐 Variáveis de Ambiente

Edge Functions requerem:
- `FAL_API_KEY`
- `OPENAI_API_KEY`
- `GITHUB_TOKEN`

## 📝 Como Usar

1. Acesse `https://convites.mforge.com.br/autobuilder`
2. Use o Chatbot ou Formulário para inserir dados
3. Gere imagens/vídeos via IA ou faça upload
4. Publique com um slug único

## 🛠️ Desenvolvimento Local

Como é 100% estático, basta abrir `index.html` em qualquer navegador.

Para servir localmente:
```bash
python -m http.server 8000
# ou
npx serve
```

## 📜 Licença

Propriedade de MForge Design
