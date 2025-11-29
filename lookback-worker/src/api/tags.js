// worker/src/api/tags.js
import { respondJSON, respondError } from "../utils/respond.js";

export async function handleTags(request, env) {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    try {
        // ------------------------------------------
        // GET /api/tags  (전체 태그 조회)
        // ------------------------------------------
        if (method === "GET" && path === "/api/tags") {
            const rows = await env.DB.prepare(`SELECT * FROM tags ORDER BY name ASC`).all();
            return respondJSON(rows.results || []);
        }

        // ------------------------------------------
        // POST /api/tags (새 태그 추가)
        // ------------------------------------------
        if (method === "POST" && path === "/api/tags") {
            const { name } = await request.json();
            if (!name) return respondError(400, "Tag name required");

            const stmt = await env.DB.prepare(
                `INSERT INTO tags (name) VALUES (?)`
            )
                .bind(name)
                .run();

            return respondJSON({ id: stmt.lastRowId }, 201);
        }

        // ------------------------------------------
        // POST /api/tags/generate  ← AI 기반 태그 자동 생성
        // ------------------------------------------
        if (method === "POST" && path === "/api/tags/generate") {
            const { content } = await request.json();
            if (!content) return respondError(400, "content required");

            // Cloudflare Workers AI 호출
            const aiRes = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
                messages: [
                    { role: "system", content: "Extract 3~5 short meaningful tags for a journal entry. Return only comma-separated tags." },
                    { role: "user", content }
                ]
            });

            const raw = aiRes.response || aiRes.result || "";
            const tags = raw
                .replace(/\n/g, "")
                .split(",")
                .map(s => s.trim())
                .filter(Boolean);

            return respondJSON({ tags });
        }

        return respondError(405, "Method Not Allowed");
    } catch (err) {
        console.error("Tag API Error:", err);
        return respondError(500, err.message || "Tag API Error");
    }
}
