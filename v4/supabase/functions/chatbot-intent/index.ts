import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

console.log("Hello from chatbot-intent function!");

serve(async (req) => {
    // CORS headers handling
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            }
        });
    }

    try {
        const { message, history, system_prompt, context } = await req.json();

        if (!message) {
            throw new Error("Message is required");
        }

        // Retrieve API Key from Environment Variable
        // YOU MUST SET 'OPENAI_API_KEY' IN YOUR SUPABASE PROJECT DASHBOARD
        const openAiKey = Deno.env.get('OPENAI_API_KEY');
        if (!openAiKey) {
            throw new Error("OPENAI_API_KEY not configured on server");
        }

        // Use provided system prompt or fallback
        const promptToUse = system_prompt || "You are a helpful assistant. You must output JSON.";

        // Construct Context Message
        let contextMessage = "";
        if (context) {
            contextMessage = `\n\n[SYSTEM CONTEXT]\nCurrent Step: ${context.currentStep || 1}\nLast Action: ${context.lastAction || 'None'}\nFormData: ${JSON.stringify(context.formData || {})}\nUploaded Assets: ${JSON.stringify(context.uploadedAssets || {})}`;
        }

        const messages = [
            { role: "system", content: promptToUse + contextMessage },
            ...(history || []).map((msg: any) => ({ role: msg.role, content: msg.content })),
            { role: "user", content: message }
        ];

        console.log("Sending request to OpenAI...");

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openAiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o", // Ensure you have access to this model, or use gpt-3.5-turbo / gpt-4-turbo
                messages: messages,
                temperature: 0.7,
                response_format: { type: "json_object" } // Using JSON mode ensures structure
            })
        });

        if (!response.ok) {
            const err = await response.json();
            console.error("OpenAI API Error:", err);
            throw new Error(err.error?.message || 'OpenAI API Error');
        }

        const data = await response.json();
        const aiContent = data.choices[0].message.content;

        console.log("Received response from OpenAI");

        return new Response(JSON.stringify({
            status: 'ok',
            response: aiContent
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*', // Allow all origins for dev, restrict in prod if needed
            },
        });

    } catch (error) {
        console.error("Function Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    }
});
