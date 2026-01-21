# Instruções para Deploy da Edge Function (Chatbot)

Para que o chatbot funcione corretamente e preencha os campos do convite, você precisa fazer o deploy da função `chatbot-intent` no seu projeto Supabase.

A função já foi criada localmente em: `supabase/functions/chatbot-intent/index.ts`.

## Passos para Deploy

1.  **Instale a CLI do Supabase** (se ainda não tiver):
    *   **Windows:** `winget install Supabase.CLI`
    *   **Mac/Linux:** `brew install supabase/tap/supabase`
    Ou siga o guia oficial: https://supabase.com/docs/guides/cli

2.  **Login no Supabase:**
    Abra seu terminal na pasta do projeto e execute:
    ```bash
    supabase login
    ```

3.  **Vincule o Projeto Local ao Remoto:**
    Você precisará do "Reference ID" do seu projeto no Supabase (encontrado nas configurações do projeto, URL: `https://app.supabase.com/project/<PROJECT_REF>`).
    ```bash
    supabase link --project-ref <SEU_PROJECT_REF_AQUI>
    ```

4.  **Configure a Chave da OpenAI:**
    A função precisa da chave da OpenAI para funcionar. Configure-a como um segredo no Supabase:
    ```bash
    supabase secrets set OPENAI_API_KEY="sk-proj-L0sFmdymV5U769dwX2QvnY-..."
    ```
    *(Use a chave completa que você forneceu anteriormente)*

5.  **Faça o Deploy da Função:**
    ```bash
    supabase functions deploy chatbot-intent
    ```

## Teste

Após o deploy, o chatbot no AutoBuilder v4 deverá começar a responder e preencher os campos automaticamente, pois o frontend já está configurado para chamar esta função.
