// worker/src/api/reflections.js
import { respondJSON, respondError } from "../utils/respond.js";

export async function handleReflections(request, env) {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    try {
        // ------------------------------------------
        // GET /api/reflections  (전체 조회)
        // ------------------------------------------
        if (method === "GET" && path === "/api/reflections") {
            const { userId } = Object.fromEntries(url.searchParams);

            if (!userId) return respondError(400, "userId is required");

            const result = await env.DB.prepare(
                `SELECT * FROM reflections WHERE user_id = ? AND deleted_at IS NULL ORDER BY reflection_date DESC`
            )
                .bind(userId)
                .all();

            return respondJSON(result.results || []);
        }

        // ------------------------------------------
        // GET /api/reflections/:id  (단일 조회)
        // ------------------------------------------
        const matchId = path.match(/^\/api\/reflections\/(\d+)$/);
        if (method === "GET" && matchId) {
            const id = Number(matchId[1]);
            const { userId } = Object.fromEntries(url.searchParams);

            const result = await env.DB.prepare(
                `SELECT * FROM reflections WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
            )
                .bind(id, userId)
                .first();

            if (!result) return respondError(404, "Reflection not found");
            return respondJSON(result);
        }

        // ------------------------------------------
        // POST /api/reflections (생성)
        // ------------------------------------------
        if (method === "POST" && path === "/api/reflections") {
            const body = await request.json();
            const { userId, title, content, date } = body;

            if (!userId || !title || !content)
                return respondError(400, "userId, title, content required");

            const stmt = await env.DB.prepare(
                `INSERT INTO reflections (user_id, title, content, reflection_date)
         VALUES (?, ?, ?, ?)`
            )
                .bind(userId, title, content, date || new Date().toISOString())
                .run();

            return respondJSON({ id: stmt.lastRowId }, 201);
        }

        // ------------------------------------------
        // PUT /api/reflections/:id (수정)
        // ------------------------------------------
        if (method === "PUT" && matchId) {
            const id = Number(matchId[1]);
            const body = await request.json();
            const { userId, title, content, date } = body;

            const stmt = await env.DB.prepare(
                `UPDATE reflections
         SET title = ?, content = ?, reflection_date = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
            )
                .bind(title, content, date, id, userId)
                .run();

            return respondJSON({ updated: stmt.changes > 0 });
        }

        // ------------------------------------------
        // DELETE /api/reflections/:id (소프트 삭제)
        // ------------------------------------------
        if (method === "DELETE" && matchId) {
            const id = Number(matchId[1]);
            const body = await request.json();
            const { userId } = body;

            const stmt = await env.DB.prepare(
                `UPDATE reflections SET deleted_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
            )
                .bind(id, userId)
                .run();

            return respondJSON({ deleted: stmt.changes > 0 });
        }

        // ------------------------------------------
        return respondError(405, "Method Not Allowed");
    } catch (err) {
        console.error("Reflection Error:", err);
        return respondError(500, err.message || "Server Error");
    }
}
