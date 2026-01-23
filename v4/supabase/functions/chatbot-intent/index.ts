import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

console.log("Hello from chatbot-intent function! v4.3.55 (Master Prompt)");

// Emergency Key provided by user
// Emergency Key provided by user
const EMERGENCY_OPENAI_KEY = ""; // Removed for security (GitHub Secret Scanning)

serve(async (req: Request) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        console.log("Request received:", req.method, req.url);

        let body;
        try {
            body = await req.json();
        } catch (e) {
            console.error("Failed to parse JSON body:", e);
            throw new Error("Invalid JSON body");
        }

        const { message, history, system_prompt, context } = body;

        console.log("Payload parsed:", {
            message_len: message?.length,
            history_len: history?.length,
            has_system_prompt: !!system_prompt
        });

        if (!message) {
            throw new Error("Message is required");
        }

        const openAiKey = Deno.env.get('OPENAI_API_KEY');

        if (!openAiKey) {
            throw new Error("OPENAI_API_KEY not configured on server");
        }

        // Use provided system prompt or fallback
        const promptToUse = system_prompt || "You are a helpful assistant.";

        // Inject Current Context if available
        let contextMessage = "";
        if (context) {
            contextMessage = `\n\n[CURRENT BUILDER STATE]\nStep: ${context.currentStep || 1}\nUploaded Assets: ${JSON.stringify(context.uploadedAssets || {})}\nForm Data: ${JSON.stringify(context.formData || {}).substring(0, 3000)}`;
        }

        const messages = [
            { role: "system", content: promptToUse + contextMessage },
            ...(history || []).map((msg: any) => ({ role: msg.role, content: msg.content })),
            { role: "user", content: message }
        ];

        console.log("Calling OpenAI (gpt-4o)...");

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openAiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: messages,
                temperature: 0.7,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const err = await response.json();
            console.error("OpenAI API Error:", JSON.stringify(err));
            throw new Error(`OpenAI Error: ${err.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const aiContent = data.choices[0].message.content;

        console.log("Success. Returning response.");

        return new Response(JSON.stringify({
            status: 'ok',
            response: aiContent
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error("Function Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
