import { respondJSON, respondError } from "../utils/respond.js";
import {
	upsertReflectionVector,
	deleteReflectionVector
} from "../utils/vector.js";

function extractUserId(url, body = {}) {
    const params = Object.fromEntries(url.searchParams);
    return body.userId || body.user_id || params.userId || params.user_id;
}

export async function handleReflections(request, env) {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    try {
        // ------------------------------------------
        // GET /api/reflections?userId=...&startDate=&endDate=
        // ------------------------------------------
        if (method === "GET" && path === "/api/reflections") {
            const { userId, startDate, endDate } = Object.fromEntries(url.searchParams);

            if (!userId) {
                return respondError(400, "userId is required");
            }

            const conditions = ["user_id = ?", "deleted_at IS NULL"];
            const bindings = [userId];

            if (startDate) {
                conditions.push("date(reflection_date) >= date(?)");
                bindings.push(startDate);
            }

            if (endDate) {
                conditions.push("date(reflection_date) <= date(?)");
                bindings.push(endDate);
            }

            const query = `SELECT * FROM reflections
				WHERE ${conditions.join(" AND ")}
				ORDER BY date(reflection_date) DESC, created_at DESC`;

            const result = await env.DB.prepare(query).bind(...bindings).all();

            return respondJSON({
                reflections: result.results || []
            });
        }

        // ------------------------------------------
        // GET /api/reflections/:id
        // ------------------------------------------
        const matchId = path.match(/^\/api\/reflections\/(\d+)$/);
        if (method === "GET" && matchId) {
            const id = Number(matchId[1]);
            const userId = extractUserId(url);

            if (!userId) {
                return respondError(400, "userId is required");
            }

            const reflection = await env.DB.prepare(
                `SELECT * FROM reflections
				 WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
            )
                .bind(id, userId)
                .first();

            if (!reflection) return respondError(404, "Reflection not found");

            const tags = await env.DB.prepare(
                `SELECT t.id, t.name
                 FROM reflection_tags rt
                 JOIN tags t ON t.id = rt.tag_id
                 WHERE rt.reflection_id = ?`
            )
                .bind(id)
                .all();

            return respondJSON({
                ...reflection,
                tags: tags?.results ?? []
            });
        }

        // ------------------------------------------
        // POST /api/reflections
        // ------------------------------------------
        if (method === "POST" && path === "/api/reflections") {
            const body = await request.json();
            const { userId, title, content, reflection_date: reflectionDate } = body;

            if (!userId || !title || !content) {
                return respondError(400, "userId, title, content are required");
            }

            const storedDate = reflectionDate || new Date().toISOString();

            const stmt = await env.DB.prepare(
                `INSERT INTO reflections (user_id, title, content, reflection_date)
				 VALUES (?, ?, ?, ?)`
            )
                .bind(userId, title, content, storedDate)
                .run();

            const createdId = stmt?.lastRowId ?? stmt?.meta?.last_row_id;

            const created = await env.DB.prepare(
                `SELECT * FROM reflections WHERE id = ?`
            )
                .bind(createdId)
                .first();

            await upsertReflectionVector(env, {
                id: created.id,
                userId,
                title,
                content,
                reflection_date: storedDate
            });

            return respondJSON(created, 201);
        }

        // ------------------------------------------
        // PUT /api/reflections/:id
        // ------------------------------------------
        if (method === "PUT" && matchId) {
            const id = Number(matchId[1]);
            const body = await request.json();
            const userId = extractUserId(url, body);
            const { title, content, reflection_date: reflectionDate } = body;

            if (!userId) {
                return respondError(400, "userId is required");
            }

            const updates = [];
            const bindings = [];

            if (typeof title !== "undefined") {
                updates.push("title = ?");
                bindings.push(title);
            }

            if (typeof content !== "undefined") {
                updates.push("content = ?");
                bindings.push(content);
            }

            if (typeof reflectionDate !== "undefined") {
                updates.push("reflection_date = ?");
                bindings.push(reflectionDate);
            }

            if (updates.length === 0) {
                return respondError(400, "No fields provided to update");
            }

            updates.push("updated_at = CURRENT_TIMESTAMP");

            const stmt = await env.DB.prepare(
                `UPDATE reflections
				 SET ${updates.join(", ")}
				 WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
            )
                .bind(...bindings, id, userId)
                .run();

            if (stmt.changes === 0) {
                return respondError(404, "Reflection not found");
            }

            const updated = await env.DB.prepare(
                `SELECT * FROM reflections WHERE id = ? AND user_id = ?`
            )
                .bind(id, userId)
                .first();

            await upsertReflectionVector(env, {
                id,
                userId,
                title: updated?.title ?? title,
                content: updated?.content ?? content,
                reflection_date: updated?.reflection_date ?? reflectionDate
            });

            return respondJSON(updated);
        }

        // ------------------------------------------
        // DELETE /api/reflections/:id
        // ------------------------------------------
        if (method === "DELETE" && matchId) {
            const id = Number(matchId[1]);

            let body = {};
            try {
                body = await request.json();
            } catch {
                body = {};
            }

            const userId = extractUserId(url, body);

            if (!userId) {
                return respondError(400, "userId is required");
            }

            const stmt = await env.DB.prepare(
                `UPDATE reflections
				 SET deleted_at = CURRENT_TIMESTAMP,
					 updated_at = CURRENT_TIMESTAMP
				 WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
            )
                .bind(id, userId)
                .run();

            if (stmt.changes === 0) {
                return respondError(404, "Reflection not found");
            }

            const deleted = await env.DB.prepare(
                `SELECT deleted_at FROM reflections WHERE id = ? AND user_id = ?`
            )
                .bind(id, userId)
                .first();

            await deleteReflectionVector(env, id);

            return respondJSON({
                success: true,
                deleted_at: deleted?.deleted_at || null
            });
        }

        return respondError(405, "Method Not Allowed");
    } catch (err) {
        console.error("Reflection Error:", err);
        return respondError(err.statusCode || 500, err.message || "Server Error");
    }
}
