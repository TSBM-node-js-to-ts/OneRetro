import { callWorker } from "./utils/workerClient.js";

const createValidationError = (message) => {
	const error = new Error(message);
	error.statusCode = 400;
	return error;
};

class AIService {
	async summarize(payload) {
		if (!payload?.content) throw createValidationError("content는 필수입니다.");
		return callWorker("/api/ai/summarize", {
			method: "POST",
			body: JSON.stringify(payload)
		});
	}

	async analyzeSentiment(payload) {
		if (!payload?.content) throw createValidationError("content는 필수입니다.");
		return callWorker("/api/ai/analyze-sentiment", {
			method: "POST",
			body: JSON.stringify(payload)
		});
	}

	async extractKeywords(payload) {
		if (!payload?.content) throw createValidationError("content는 필수입니다.");
		return callWorker("/api/ai/extract-keywords", {
			method: "POST",
			body: JSON.stringify(payload)
		});
	}

	async suggestTags(payload) {
		if (!payload?.content) throw createValidationError("content는 필수입니다.");
		return callWorker("/api/ai/suggest-tags", {
			method: "POST",
			body: JSON.stringify(payload)
		});
	}

	async analyzeFull(payload) {
		if (!payload?.content) throw createValidationError("content는 필수입니다.");
		return callWorker("/api/ai/analyze-full", {
			method: "POST",
			body: JSON.stringify(payload)
		});
	}

	async generateTitle(payload) {
		if (!payload?.content) throw createValidationError("content는 필수입니다.");
		return callWorker("/api/ai/generate-title", {
			method: "POST",
			body: JSON.stringify(payload)
		});
	}

	async chat(payload) {
		if (!payload?.userId) throw createValidationError("userId는 필수입니다.");
		if (!payload?.message || !payload?.message.trim()) {
			throw createValidationError("message는 필수입니다.");
		}
		return callWorker("/api/ai/chat", {
			method: "POST",
			body: JSON.stringify(payload)
		});
	}

	async generateTagsSimple(payload) {
		if (!payload?.content) throw createValidationError("content는 필수입니다.");
		return callWorker("/api/tags/generate", {
			method: "POST",
			body: JSON.stringify(payload)
		});
	}
}

const aiService = new AIService();
export default aiService;

