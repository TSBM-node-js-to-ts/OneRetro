import { handleReflections } from "./api/reflections.js";
import { handleTags } from "./api/tags.js";
import { handleAI } from "./api/ai.js";
import { handleUsers } from "./api/users.js";
import { handleReflectionTags } from "./api/reflectionTags.js";
import { handleAnalytics } from "./api/analytics.js";
import { handleMemories } from "./api/memories.js";
import { handleSearch } from "./api/search.js";
import { handleChat } from "./api/chat.js";
import { handleCoachAnalysis } from "./api/coachAnalysis.js";
import { respondError } from "./utils/respond.js";

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const path = url.pathname;
		const method = request.method;

		try {
			// === User CRUD ===
			if (path.startsWith("/api/users")) {
				return handleUsers(request, env);
			}

			// === Semantic search for reflections ===
			if (path.startsWith("/api/notes/search")) {
				return handleSearch(request, env);
			}

			// === Reflection CRUD ===
			if (path.startsWith("/api/reflections")) {
				return handleReflections(request, env);
			}

			// === Tag CRUD & Tag Generation ===
			if (path.startsWith("/api/tags")) {
				return handleTags(request, env);
			}

			// === Reflection-Tag relations ===
			if (path.startsWith("/api/reflection-tags")) {
				return handleReflectionTags(request, env);
			}

			// === Analytics ===
			if (path.startsWith("/api/analytics")) {
				return handleAnalytics(request, env);
			}

			// === AI Long-term Memories ===
			if (path.startsWith("/api/memories")) {
				return handleMemories(request, env);
			}

			// === Coach Analysis history ===
			if (path.startsWith("/api/coach/analysis")) {
				return handleCoachAnalysis(request, env);
			}

			// === Chat with RAG ===
			if (path === "/api/ai/chat") {
				return handleChat(request, env);
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
