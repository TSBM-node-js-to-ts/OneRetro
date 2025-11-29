import { callWorker } from "./utils/workerClient.js";

class MemoryService {
	async listMemories(userId, limit = 10) {
		if (!userId) return [];
		const response = await callWorker(
			`/api/memories?userId=${encodeURIComponent(userId)}&limit=${limit}`
		);
		const memories = response?.memories ?? [];
		return memories.map((item) => ({
			...item,
			metadata: item.metadata ? safeParseJSON(item.metadata) : null
		}));
	}

	async createMemory({ userId, memoryType, memory, metadata }) {
		if (!userId || !memoryType || !memory) {
			return null;
		}

		return callWorker("/api/memories", {
			method: "POST",
			body: JSON.stringify({
				userId,
				memory_type: memoryType,
				memory,
				metadata
			})
		});
	}
}

function safeParseJSON(value) {
	try {
		return typeof value === "string" ? JSON.parse(value) : value;
	} catch (error) {
		console.warn("[MemoryService] metadata 파싱 실패:", error);
		return null;
	}
}

const memoryService = new MemoryService();
export default memoryService;

