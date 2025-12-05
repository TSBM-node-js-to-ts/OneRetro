import { respondJSON, respondError } from "../utils/respond.js";
import { semanticSearchReflections } from "../utils/vector.js";

const DEFAULT_TOP_K = 6;

function chooseModel(model) {
	return model === "qwen"
		? "@cf/qwen/qwen2-7b-instruct"
		: "@cf/meta/llama-3-8b-instruct";
}

function parseJsonResponse(raw) {
	const trimmed = (raw || "").trim();
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

async function fetchRecentMemories(env, userId, limit = 6) {
	const rows = await env.DB.prepare(
		`SELECT memory_type, memory, metadata, created_at
		 FROM ai_memories
		 WHERE user_id = ?
		 ORDER BY created_at DESC
		 LIMIT ?`
	).bind(userId, limit).all();

	return rows?.results ?? [];
}

function buildPrompt({ message, reflections, memories }) {
	const reflectionBlock = reflections
		.map(
			(r, idx) =>
				`[R${idx + 1}] "${r.title || "제목 없음"}" (${r.reflection_date || "날짜 없음"})\n${(r.content || "").slice(0, 1200)}`
		)
		.join("\n\n");

	const memoryBlock = memories
		.map(
			(m, idx) =>
				`[M${idx + 1}] (${m.memory_type || "memory"}) ${m.memory || ""}`
		)
		.join("\n");

	return {
		system: [
			"You are a Korean personal reflection assistant.",
			"Use only the provided reflections and memories as grounding.",
			"If information is insufficient, say so briefly.",
			"Keep answers concise and empathetic.",
			"Return JSON without code fences."
		].join(" "),
		user: JSON.stringify({
			query: message,
			reflections: reflections.map((r, idx) => ({
				id: r.id,
				ref_idx: idx + 1,
				title: r.title,
				reflection_date: r.reflection_date,
				content: r.content?.slice(0, 1200)
			})),
			memories: memories.map((m, idx) => ({
				mem_idx: idx + 1,
				memory_type: m.memory_type,
				memory: m.memory,
				created_at: m.created_at
			}))
		})
	};
}

export async function handleChat(request, env) {
	const url = new URL(request.url);
	const path = url.pathname;
	const method = request.method;

	try {
		if (method === "POST" && path === "/api/ai/chat") {
			const body = await request.json();
			const {
				userId,
				message,
				references = [],
				topK = DEFAULT_TOP_K,
				model
			} = body || {};

			if (!userId) return respondError(400, "userId is required");
			if (!message || !message.trim()) return respondError(400, "message is required");

			let reflections = [];

			if (Array.isArray(references) && references.length) {
				const ids = references.map((v) => Number(v)).filter(Boolean);
				reflections = await fetchReflectionsByIds(env, userId, ids);
			} else {
				const matches = await semanticSearchReflections(env, {
					userId,
					query: message,
					topK: Math.min(Number(topK) || DEFAULT_TOP_K, 12)
				});
				const ids = matches.map((m) => m.id);
				const rows = await fetchReflectionsByIds(env, userId, ids);
				const byId = new Map(rows.map((r) => [r.id, r]));
				reflections = matches
					.map((m) => {
						const row = byId.get(m.id);
						return row ? { ...row, score: m.score ?? null } : null;
					})
					.filter(Boolean);
			}

			const memories = await fetchRecentMemories(env, userId, 6);
			const prompt = buildPrompt({ message, reflections, memories });

			const aiRes = await env.AI.run(chooseModel(model), {
				messages: [
					{ role: "system", content: prompt.system },
					{ role: "user", content: prompt.user }
				]
			});

			const text = aiRes?.response || aiRes?.result || "";
			const parsed = parseJsonResponse(text);
			const answer =
				(typeof parsed?.answer === "string" && parsed.answer.trim()) || text.trim();

			return respondJSON({
				answer,
				reflections: reflections.map((r) => ({
					id: r.id,
					title: r.title,
					reflection_date: r.reflection_date,
					score: r.score ?? null
				})),
				memories: memories.map((m) => ({
					memory_type: m.memory_type,
					memory: m.memory,
					created_at: m.created_at
				}))
			});
		}

		return respondError(405, "Method Not Allowed");
	} catch (err) {
		console.error("Chat API Error:", err);
		return respondError(err.statusCode || 500, err.message || "Chat Error");
	}
}

