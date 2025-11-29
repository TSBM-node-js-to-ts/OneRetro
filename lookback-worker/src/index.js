import { handleReflections } from "./api/reflections.js";
import { handleTags } from "./api/tags.js";
import { handleAI } from "./api/ai.js";
import { handleDebug } from "./api/debug.js";
import { respondError } from "./utils/respond.js";

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const path = url.pathname;
		const method = request.method;

		try {
			// === Debug ===
			if (path.startsWith("/api/debug")) {
				return handleDebug(request, env);
			}

			// === Reflection CRUD ===
			if (path.startsWith("/api/reflections")) {
				return handleReflections(request, env);
			}

			// === Tag CRUD & Tag Generation ===
			if (path.startsWith("/api/tags")) {
				return handleTags(request, env);
			}

			// === AI Analysis ===
			if (path.startsWith("/api/ai")) {
				return handleAI(request, env);
			}

			// --- 404 fallback ---
			return respondError(404, `No route matches ${path}`);
		} catch (error) {
			console.error("Worker Error:", error);

			return respondError(
				error.statusCode || 500,
				error.message || "Internal Worker Error"
			);
		}
	}
};
