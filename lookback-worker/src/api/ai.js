import { respondJSON, respondError } from "../utils/respond.js";

const MODEL = "@cf/meta/llama-3-8b-instruct";
const QWEN_MODEL = "@cf/qwen/qwen2-7b-instruct";

const SYSTEM_PROMPT =
	"You are an assistant for a personal reflection app. You MUST respond with valid JSON only (no markdown code fences). When the user payload includes a 'memory_context' array, use it to ground your analysis, avoid contradicting prior memories, and prefer referencing them concisely.";

function parseJsonResponse(raw) {
    const trimmed = raw.trim();
    const withoutFence = trimmed.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();

    try {
        return JSON.parse(withoutFence);
    } catch {
        try {
            return JSON.parse(trimmed);
        } catch {
            return null;
        }
    }
}

async function runStructuredTask(env, payload) {
    const modelId = payload?.model === "qwen" ? QWEN_MODEL : MODEL;
    const { model, ...rest } = payload || {};

    const aiRes = await env.AI.run(modelId, {
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: JSON.stringify(rest) }
        ]
    });

    const text = aiRes.response || aiRes.result || "";
    const parsed = parseJsonResponse(text);

    return { parsed, raw: text };
}

export async function handleAI(request, env) {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    try {
        // ------------------------------------------
        // POST /api/ai/summarize
        // ------------------------------------------
        if (method === "POST" && path === "/api/ai/summarize") {
            const { content, model } = await request.json();
            if (!content) return respondError(400, "content is required");

            const { parsed, raw } = await runStructuredTask(env, {
                model,
                task: "summarize",
                content
            });

            const summary =
                typeof parsed?.summary === "string" && parsed.summary.trim()
                    ? parsed.summary.trim()
                    : raw.trim();

            return respondJSON({ summary });
        }

        // ------------------------------------------
        // POST /api/ai/analyze-sentiment
        // ------------------------------------------
        if (method === "POST" && path === "/api/ai/analyze-sentiment") {
            const { content, model } = await request.json();
            if (!content) return respondError(400, "content is required");

            const { parsed, raw } = await runStructuredTask(env, {
                model,
                task: "analyze-sentiment",
                content
            });

            if (parsed?.sentiment) {
                return respondJSON({ sentiment: parsed.sentiment });
            }

            return respondJSON({
                sentiment: {
                    score: null,
                    label: "unknown",
                    note: raw.trim()
                }
            });
        }

        // ------------------------------------------
        // POST /api/ai/extract-keywords
        // ------------------------------------------
        if (method === "POST" && path === "/api/ai/extract-keywords") {
            const { content, model } = await request.json();
            if (!content) return respondError(400, "content is required");

            const { parsed, raw } = await runStructuredTask(env, {
                model,
                task: "extract-keywords",
                content
            });

            const keywords = Array.isArray(parsed?.keywords)
                ? parsed.keywords
                : [{ word: raw.trim(), relevance: 1 }];

            return respondJSON({ keywords });
        }

        // ------------------------------------------
        // POST /api/ai/suggest-tags
        // ------------------------------------------
        if (method === "POST" && path === "/api/ai/suggest-tags") {
            const { content, existing_tags: existingTags = [], model } = await request.json();
            if (!content) return respondError(400, "content is required");

            const { parsed, raw } = await runStructuredTask(env, {
                model,
                task: "suggest-tags",
                content,
                existing_tags: existingTags
            });

            const suggested = Array.isArray(parsed?.suggested_tags)
                ? parsed.suggested_tags
                : [{ name: raw.trim(), confidence: 0.5 }];

            return respondJSON({ suggested_tags: suggested });
        }

        // ------------------------------------------
        // POST /api/ai/analyze-full
        // ------------------------------------------
        if (method === "POST" && path === "/api/ai/analyze-full") {
            const { content, model } = await request.json();
            if (!content) return respondError(400, "content is required");

            const { parsed, raw } = await runStructuredTask(env, {
                model,
                task: "analyze-full",
                content
            });

            if (parsed) {
                return respondJSON({
                    summary: parsed.summary ?? null,
                    sentiment: parsed.sentiment ?? null,
                    keywords: parsed.keywords ?? [],
                    suggested_tags: parsed.suggested_tags ?? []
                });
            }

            return respondJSON({
                summary: raw.trim(),
                sentiment: null,
                keywords: [],
                suggested_tags: []
            });
        }

        // ------------------------------------------
        // POST /api/ai/generate-title
        // ------------------------------------------
        if (method === "POST" && path === "/api/ai/generate-title") {
            const { content, model } = await request.json();
            if (!content) return respondError(400, "content is required");

            const system = "You are a Korean writing assistant. Return only a concise title (max 12 words). Respond as plain text.";
            const aiRes = await env.AI.run(model === "qwen" ? QWEN_MODEL : MODEL, {
                messages: [
                    { role: "system", content: system },
                    { role: "user", content: content }
                ]
            });

            const text = aiRes?.response || aiRes?.result || "";
            const title = text.trim().replace(/^["']|["']$/g, "");

            return respondJSON({ title });
        }

        return respondError(405, "Method Not Allowed");
    } catch (err) {
        console.error("AI API Error:", err);
        return respondError(err.statusCode || 500, err.message || "AI Processing Error");
    }
}
