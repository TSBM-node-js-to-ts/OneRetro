import { respondJSON, respondError } from "../utils/respond.js";

async function requireUserId(url) {
	const { userId } = Object.fromEntries(url.searchParams);
	if (!userId) {
		throw Object.assign(new Error("userId is required"), { statusCode: 400 });
	}
	return userId;
}

export async function handleAnalytics(request, env) {
	const url = new URL(request.url);
	const path = url.pathname;
	const method = request.method;

	try {
		// ------------------------------------------------------
		// GET /api/analytics/reflection-count?userId=xxx
		// ------------------------------------------------------
		if (method === "GET" && path === "/api/analytics/reflection-count") {
			const userId = await requireUserId(url);

			const totalRow = await env.DB.prepare(
				`SELECT COUNT(*) AS count
				 FROM reflections
				 WHERE user_id = ? AND deleted_at IS NULL`
			)
				.bind(userId)
				.first();

			const weekRow = await env.DB.prepare(
				`SELECT COUNT(*) AS count
				 FROM reflections
				 WHERE user_id = ?
				   AND deleted_at IS NULL
				   AND date(reflection_date) >= date('now', '-6 days')`
			)
				.bind(userId)
				.first();

			const monthRow = await env.DB.prepare(
				`SELECT COUNT(*) AS count
				 FROM reflections
				 WHERE user_id = ?
				   AND deleted_at IS NULL
				   AND strftime('%Y-%m', reflection_date) = strftime('%Y-%m', 'now')`
			)
				.bind(userId)
				.first();

			return respondJSON({
				total: totalRow?.count ?? 0,
				this_week: weekRow?.count ?? 0,
				this_month: monthRow?.count ?? 0
			});
		}

		// ------------------------------------------------------
		// GET /api/analytics/tag-frequency?userId=xxx
		// ------------------------------------------------------
		if (method === "GET" && path === "/api/analytics/tag-frequency") {
			const userId = await requireUserId(url);

			const rows = await env.DB.prepare(
				`SELECT t.name, COUNT(*) AS count
				 FROM reflection_tags rt
				 JOIN tags t ON t.id = rt.tag_id
				 JOIN reflections r ON r.id = rt.reflection_id
				 WHERE r.user_id = ?
				   AND r.deleted_at IS NULL
				 GROUP BY t.id
				 ORDER BY count DESC, t.name ASC`
			)
				.bind(userId)
				.all();

			return respondJSON({
				tags: rows?.results?.map((row) => ({
					name: row.name,
					count: Number(row.count)
				})) ?? []
			});
		}

		return respondError(405, "Method Not Allowed");
	} catch (err) {
		const status = err.statusCode || 500;
		const message = err.message || "Analytics Error";
		console.error("Analytics API Error:", err);
		return respondError(status, message);
	}
}

