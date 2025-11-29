import { respondJSON, respondError } from "../utils/respond.js";

export async function handleReflectionTags(request, env) {
	const url = new URL(request.url);
	const method = request.method;
	const path = url.pathname;

	try {
		// ------------------------------------------------------
		// POST /api/reflection-tags
		// ------------------------------------------------------
		if (method === "POST" && path === "/api/reflection-tags") {
			const { reflection_id: reflectionId, tag_id: tagId } = await request.json();

			if (!reflectionId || !tagId) {
				return respondError(400, "reflection_id and tag_id are required");
			}

			await env.DB.prepare(
				`INSERT OR IGNORE INTO reflection_tags (reflection_id, tag_id)
				 VALUES (?, ?)`
			)
				.bind(reflectionId, tagId)
				.run();

			return respondJSON({ reflection_id: reflectionId, tag_id: tagId }, 201);
		}

		// ------------------------------------------------------
		// GET /api/reflection-tags/:reflectionId
		// ------------------------------------------------------
		const listMatch = path.match(/^\/api\/reflection-tags\/(\d+)$/);
		if (method === "GET" && listMatch) {
			const reflectionId = Number(listMatch[1]);

			const rows = await env.DB.prepare(
				`SELECT t.id, t.name
				 FROM reflection_tags rt
				 JOIN tags t ON t.id = rt.tag_id
				 WHERE rt.reflection_id = ?
				 ORDER BY t.name ASC`
			)
				.bind(reflectionId)
				.all();

			return respondJSON({
				tags: rows?.results ?? []
			});
		}

		// ------------------------------------------------------
		// DELETE /api/reflection-tags/:reflectionId/:tagId
		// ------------------------------------------------------
		const deleteMatch = path.match(/^\/api\/reflection-tags\/(\d+)\/(\d+)$/);
		if (method === "DELETE" && deleteMatch) {
			const reflectionId = Number(deleteMatch[1]);
			const tagId = Number(deleteMatch[2]);

			const stmt = await env.DB.prepare(
				`DELETE FROM reflection_tags
				 WHERE reflection_id = ? AND tag_id = ?`
			)
				.bind(reflectionId, tagId)
				.run();

			return respondJSON({
				success: stmt.changes > 0
			});
		}

		return respondError(405, "Method Not Allowed");
	} catch (err) {
		console.error("Reflection-Tag API Error:", err);
		return respondError(err.statusCode || 500, err.message || "Server Error");
	}
}

