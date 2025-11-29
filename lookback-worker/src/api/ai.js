// worker/src/api/ai.js
import { respondJSON, respondError } from "../utils/respond.js";

export async function handleAI(request, env) {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    try {
        // ------------------------------------------
        // POST /api/ai/analyze
        // ------------------------------------------
        if (method === "POST" && path === "/api/ai/analyze") {
            const { content } = await request.json();
            if (!content) return respondError(400, "content required");

            const aiRes = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
                messages: [
                    {
                        role: "system",
                        content:
                            "You analyze user reflections. Output JSON with: summary, sentiment, insights, suggestions."
                    },
                    {
                        role: "user",
                        content
                    }
                ]
            });

            const text = aiRes.response || aiRes.result || "";
            return respondJSON({ analysis: text });
        }

        return respondError(405, "Method Not Allowed");
    } catch (err) {
        console.error("AI API Error:", err);
        return respondError(500, err.message || "AI Processing Error");
    }
}
