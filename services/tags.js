import { callWorker } from "./utils/workerClient.js";

class TagService {
    async getAllTags() {
        return callWorker('/api/tags');
    }

    async addTagToReflection(reflectionId, tagName) {
        return callWorker(`/api/reflections/${reflectionId}/tags`, {
            method: 'POST',
            body: JSON.stringify({
                tagName: tagName
            })
        });
    }

    async removeTagFromReflection(reflectionId, tagName) {
        return callWorker(`/api/reflections/${reflectionId}/tags`, {
            method: 'DELETE',
            body: JSON.stringify({
                tagName: tagName
            })
        });
    }

    async deleteTag(tagName) {
        //수동 태그 삭제 기능을 위해 추가
        return callWorker(`/api/tags/${tagName}`, {
            method: 'DELETE'
        });
    }
}

