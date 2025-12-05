import { respondJSON, respondError } from "../utils/respond.js";

const MAX_LIMIT = 50;

export async function handleMemories(request, env) {
	const url = new URL(request.url);
	const path = url.pathname;
	const method = request.method;

	try {
		// ------------------------------------------------------
		// GET /api/memories?userId=...&limit=...
		// ------------------------------------------------------
		if (method === "GET" && path === "/api/memories") {
			const { userId, limit } = Object.fromEntries(url.searchParams);
			if (!userId) {
				return respondError(400, "userId is required");
			}

			const limitValue = Math.min(Number(limit) || 10, MAX_LIMIT);

			const rows = await env.DB.prepare(
				`SELECT id, user_id, memory_type, memory, metadata, created_at
				 FROM ai_memories
				 WHERE user_id = ?
				 ORDER BY created_at DESC
				 LIMIT ?`
			)
				.bind(userId, limitValue)
				.all();

			return respondJSON({
				memories: rows?.results ?? []
			});
		}

		// ------------------------------------------------------
		// POST /api/memories
		// ------------------------------------------------------
		if (method === "POST" && path === "/api/memories") {
			const body = await request.json();
			const { userId, memory, memory_type: memoryType, metadata } = body;

			if (!userId || !memory || !memoryType) {
				return respondError(400, "userId, memory, memory_type are required");
			}

			const stmt = await env.DB.prepare(
				`INSERT INTO ai_memories (user_id, memory_type, memory, metadata)
				 VALUES (?, ?, ?, ?)`
			)
				.bind(userId, memoryType, memory, metadata ? JSON.stringify(metadata) : null)
				.run();

			const createdId = stmt?.lastRowId ?? stmt?.meta?.last_row_id;

			const created = await env.DB.prepare(
				`SELECT id, user_id, memory_type, memory, metadata, created_at
				 FROM ai_memories WHERE id = ?`
			)
				.bind(createdId)
				.first();

			return respondJSON(created, 201);
		}

		return respondError(405, "Method Not Allowed");
	} catch (err) {
		console.error("Memories API Error:", err);
		return respondError(err.statusCode || 500, err.message || "Memories Error");
	}
}

