const EMBED_MODEL = "@cf/baai/bge-base-en-v1.5";
const DEFAULT_TOP_K = 6;

async function runEmbedding(env, text) {
	if (!env?.AI) throw new Error("AI binding is missing");
	const res = await env.AI.run(EMBED_MODEL, { text });
	const vector = res?.data?.[0] || res?.embedding || res?.vector;
	if (!Array.isArray(vector)) {
		throw new Error("Embedding model did not return a vector");
	}
	return vector;
}

function ensureVectorize(env) {
	if (!env?.VECTORIZE) {
		throw new Error("VECTORIZE binding is missing");
	}
	return env.VECTORIZE;
}

export async function upsertReflectionVector(env, { id, userId, title, content, tags = [], reflection_date: reflectionDate }) {
	try {
		if (!id || !userId || !content) return false;
		const vector = await runEmbedding(env, content);
		const snippet = content.slice(0, 400);

		await ensureVectorize(env).upsert([
			{
				id: `reflection:${id}`,
				values: vector,
				metadata: {
					userId,
					reflectionId: id,
					title,
					tags,
					reflection_date: reflectionDate,
					snippet
				}
			}
		]);
		return true;
	} catch (err) {
		console.error("[Vector] upsertReflectionVector failed:", err);
		return false;
	}
}

export async function deleteReflectionVector(env, id) {
	try {
		if (!id) return false;
		await ensureVectorize(env).deleteByIds([`reflection:${id}`]);
		return true;
	} catch (err) {
		console.error("[Vector] deleteReflectionVector failed:", err);
		return false;
	}
}

export async function semanticSearchReflections(env, { userId, query, topK = DEFAULT_TOP_K }) {
	try {
		if (!query || !userId) return [];
		const vector = await runEmbedding(env, query);

		const result = await ensureVectorize(env).query(vector, {
			topK,
			filter: { userId },
			returnValues: false,
			returnMetadata: true
		});

		return result?.matches?.map((m) => ({
			id: Number(m?.metadata?.reflectionId ?? String(m?.id).replace("reflection:", "")),
			score: m?.score ?? null,
			metadata: m?.metadata ?? {}
		})) ?? [];
	} catch (err) {
		console.error("[Vector] semanticSearchReflections failed:", err);
		return [];
	}
}

export const VECTOR_CONSTANTS = {
	EMBED_MODEL,
	DEFAULT_TOP_K
};

