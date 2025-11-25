import { callWorker } from "./workerClient.js";

class ReflectionService {
  // 전체 조회
  async getAllReflections(userId) {
    return callWorker(`/api/reflections?userId=${userId}`);
  }

  // 단건 조회
  async getReflectionById(id, userId) {
    return callWorker(`/api/reflections/${id}?userId=${userId}`);
  }

  // 생성
  async createReflection(userId, data) {
    const { title, content, date } = data;

    if (!title || !content) {
      throw new Error("제목과 내용은 필수입니다.");
    }

    return callWorker("/api/reflections", {
      method: "POST",
      body: JSON.stringify({
        userId,
        title,
        content,
        date: date || new Date().toISOString()
      })
    });
  }

  // 수정
  async updateReflection(id, userId, data) {
    return callWorker(`/api/reflections/${id}`, {
      method: "PUT",
      body: JSON.stringify({ userId, ...data })
    });
  }

  // 삭제
  async deleteReflection(id, userId) {
    return callWorker(`/api/reflections/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ userId })
    });
  }
}

export default new ReflectionService();
