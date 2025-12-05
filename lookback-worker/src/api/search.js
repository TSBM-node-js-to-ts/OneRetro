import { respondJSON, respondError } from "../utils/respond.js";
import { semanticSearchReflections } from "../utils/vector.js";

async function fetchReflectionsByIds(env, userId, ids = []) {
	if (!ids.length) return [];
	const placeholders = ids.map(() => "?").join(", ");
	const stmt = await env.DB.prepare(
		`SELECT id, user_id, title, content, reflection_date
		 FROM reflections
		 WHERE user_id = ?
		   AND deleted_at IS NULL
		   AND id IN (${placeholders})`
	).bind(userId, ...ids);
	const rows = await stmt.all();
	return rows?.results ?? [];
}

async function fallbackTextSearch(env, userId, query, limit = 6) {
	const stmt = await env.DB.prepare(
		`SELECT id, user_id, title, content, reflection_date
		 FROM reflections
		 WHERE user_id = ?
		   AND deleted_at IS NULL
		   AND (title LIKE ? OR content LIKE ?)
		 ORDER BY updated_at DESC
		 LIMIT ?`
	).bind(userId, `%${query}%`, `%${query}%`, limit);
	const rows = await stmt.all();
	return rows?.results?.map((r) => ({
		id: r.id,
		score: null,
		title: r.title,
		snippet: r.content?.slice(0, 400) || "",
		reflection_date: r.reflection_date
	})) ?? [];
}

export async function handleSearch(request, env) {
	const url = new URL(request.url);
	const path = url.pathname;
	const method = request.method;

	try {
		if (method === "GET" && path === "/api/notes/search") {
			const { userId, query, k } = Object.fromEntries(url.searchParams);
			if (!userId) return respondError(400, "userId is required");
			if (!query) return respondError(400, "query is required");

			const topK = Math.min(Number(k) || 6, 12);

			// Try vector search first
			const vectorMatches = await semanticSearchReflections(env, {
				userId,
				query,
				topK
			});

			let reflections = [];
			if (vectorMatches.length) {
				const ids = vectorMatches.map((m) => m.id);
				const rows = await fetchReflectionsByIds(env, userId, ids);
				const byId = new Map(rows.map((r) => [r.id, r]));
				reflections = vectorMatches
					.map((m) => {
						const row = byId.get(m.id);
						return row
							? {
									id: row.id,
									title: row.title,
									reflection_date: row.reflection_date,
									snippet: row.content?.slice(0, 400) || m?.metadata?.snippet || "",
									score: m.score ?? null
							  }
							: null;
					})
					.filter(Boolean);
			} else {
				reflections = await fallbackTextSearch(env, userId, query, topK);
			}

			return respondJSON({ results: reflections });
		}

		return respondError(405, "Method Not Allowed");
	} catch (err) {
		console.error("Search API Error:", err);
		return respondError(err.statusCode || 500, err.message || "Search Error");
	}
}

