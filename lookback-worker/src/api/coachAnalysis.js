import { respondJSON, respondError } from "../utils/respond.js";

export async function handleCoachAnalysis(request, env) {
	const url = new URL(request.url);
	const path = url.pathname;
	const method = request.method;

	try {
		// POST /api/coach/analysis
		if (method === "POST" && path === "/api/coach/analysis") {
			const body = await request.json();
			const { userId, reflectionId, result } = body || {};

			if (!userId || !reflectionId || !result) {
				return respondError(400, "userId, reflectionId, result are required");
			}

			await env.DB.prepare(
				`INSERT INTO coach_analyses (user_id, reflection_id, result_json)
				 VALUES (?, ?, ?)`
			)
				.bind(userId, reflectionId, JSON.stringify(result))
				.run();

			return respondJSON({ success: true }, 201);
		}

		// GET /api/coach/analysis/:reflectionId?userId=...
		const match = path.match(/^\/api\/coach\/analysis\/(\d+)$/);
		if (method === "GET" && match) {
			const reflectionId = Number(match[1]);
			const { userId } = Object.fromEntries(url.searchParams);
			if (!userId) return respondError(400, "userId is required");

			const row = await env.DB.prepare(
				`SELECT result_json, created_at
				 FROM coach_analyses
				 WHERE reflection_id = ? AND user_id = ?
				 ORDER BY created_at DESC
				 LIMIT 1`
			)
				.bind(reflectionId, userId)
				.first();

			if (!row) return respondError(404, "Coach analysis not found");

			return respondJSON({
				reflection_id: reflectionId,
				user_id: userId,
				created_at: row.created_at,
				result: JSON.parse(row.result_json)
			});
		}

		return respondError(405, "Method Not Allowed");
	} catch (err) {
		console.error("CoachAnalysis API Error:", err);
		return respondError(err.statusCode || 500, err.message || "CoachAnalysis Error");
	}
}

