import { callWorker } from "./utils/workerClient.js";

class TagService {
	async getAllTags() {
		const response = await callWorker('/api/tags');
		return response?.tags ?? [];
	}

	async createTag(name) {
		return callWorker('/api/tags', {
			method: 'POST',
			body: JSON.stringify({ name })
		});
	}

	async getTagById(id) {
		return callWorker(`/api/tags/${id}`);
	}

	async getTagsForReflection(reflectionId) {
		const response = await callWorker(`/api/reflection-tags/${reflectionId}`);
		return response?.tags ?? [];
	}

	async attachTag(reflectionId, tagId) {
		return callWorker('/api/reflection-tags', {
			method: 'POST',
			body: JSON.stringify({
				reflection_id: reflectionId,
				tag_id: tagId
			})
		});
	}

	async detachTag(reflectionId, tagId) {
		return callWorker(`/api/reflection-tags/${reflectionId}/${tagId}`, {
			method: 'DELETE'
		});
	}
}

const tagService = new TagService();
export default tagService;
