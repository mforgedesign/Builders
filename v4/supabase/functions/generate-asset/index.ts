import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Use Env Var or Hardcoded Fallback (Secure in Server-side Edge Function)
        const KIE_API_KEY = Deno.env.get("KIE_API_KEY") || "b9674185ac0693bb39d3e10c3ee1dd21";

        if (!KIE_API_KEY) {
            throw new Error("KIE_API_KEY not configured");
        }

        const { model, input, taskId } = await req.json();

        // 0. Handle Polling (if taskId provided)
        if (taskId) {
            console.log(`[Polling] Checking status for task ${taskId}`);
            const pollResp = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
                headers: {
                    "Authorization": `Bearer ${KIE_API_KEY}`
                }
            });

            if (!pollResp.ok) throw new Error("Failed to poll status");

            const pollData = await pollResp.json();
            return new Response(JSON.stringify(pollData), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // 1. Handle File Uploads (if needed)
        // Kie.ai requires files to be on their storage to avoid "fetch failed" errors from providers like Catbox
        const uploadToKie = async (urlOrBase64: string) => {
            console.log(`[Upload] Processing asset...`);

            // If it's already a Kie.ai/Redpanda/AIQuickDraw URL, skip upload
            if (typeof urlOrBase64 === 'string' && (
                urlOrBase64.includes("redpandaai.co") ||
                urlOrBase64.includes("aiquickdraw.com")
            )) {
                return urlOrBase64;
            }

            let fileBlob: Blob;
            let filename = "upload.jpg";

            // If Base64
            if (urlOrBase64.startsWith("data:")) {
                const base64Data = urlOrBase64.split(",")[1];
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                fileBlob = new Blob([byteArray], { type: "image/jpeg" });
                filename = `upload_${Date.now()}.jpg`;
            } else {
                // Fetch URL (Proxy fetching to avoid CORS on browser, do it server-side)
                const resp = await fetch(urlOrBase64);
                if (!resp.ok) throw new Error(`Failed to fetch source image: ${urlOrBase64}`);
                fileBlob = await resp.blob();

                // Try to guess filename from URL
                try {
                    const urlPath = new URL(urlOrBase64).pathname;
                    filename = urlPath.split('/').pop() || `image_${Date.now()}.jpg`;
                } catch {
                    filename = `image_${Date.now()}.jpg`;
                }
            }

            // Upload to Kie.ai
            const formData = new FormData();
            formData.append("file", fileBlob, filename);
            formData.append("uploadPath", "temp_uploads");

            const uploadResp = await fetch("https://kieai.redpandaai.co/api/file-stream-upload", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${KIE_API_KEY}`
                },
                body: formData
            });

            if (!uploadResp.ok) {
                const errText = await uploadResp.text();
                console.error("Kie Upload Error:", errText);
                throw new Error(`Kie Upload Failed: ${errText}`);
            }

            const uploadData = await uploadResp.json();

            // The API returns downloadUrl in data.downloadUrl (found in tests)
            const downloadUrl = uploadData.data?.downloadUrl || uploadData.data?.url || uploadData.data?.fileUrl;

            if (!downloadUrl) {
                console.error("Upload response missing URL:", uploadData);
                throw new Error("Upload completed but no URL returned from Kie.ai");
            }

            console.log(`[Upload] Success: ${downloadUrl}`);
            return downloadUrl;
        };

        // Process inputs that need upload
        // Hailuo (Video)
        if (input.image_url) {
            input.image_url = await uploadToKie(input.image_url);
        }
        if (input.end_image_url) {
            input.end_image_url = await uploadToKie(input.end_image_url);
        }

        // Seedream (Image Edit)
        if (input.image_urls && Array.isArray(input.image_urls)) {
            input.image_urls = await Promise.all(input.image_urls.map(async (url) => await uploadToKie(url)));
        }

        // 2. Create Task
        console.log(`[Generate] Creating task for model ${model}`);
        const taskResp = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${KIE_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: model,
                input: input // Now contains internal Kie URLs
            })
        });

        if (!taskResp.ok) {
            const err = await taskResp.text();
            console.error("Create Task Error:", err);
            throw new Error(`Create Task Failed: ${err}`);
        }

        const taskData = await taskResp.json();
        return new Response(JSON.stringify(taskData), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
