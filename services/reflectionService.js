const { callWorker } = require('./utils/workerClient');

const createValidationError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const assertUserId = (userId) => {
  if (!userId) {
    throw createValidationError('userId는 필수입니다.');
  }
};

const assertId = (id) => {
  if (!Number.isInteger(id)) {
    throw createValidationError('id는 정수여야 합니다.');
  }
};

class ReflectionService {
  async getAllReflections(userId) {
    assertUserId(userId);
    return callWorker(`/api/reflections?userId=${userId}`);
  }

  async getReflectionById(id, userId) {
    assertId(id);
    assertUserId(userId);
    return callWorker(`/api/reflections/${id}?userId=${userId}`);
  }

  async createReflection(userId, data = {}) {
    assertUserId(userId);

    const { title, content, date } = data;

    if (!title || !content) {
      throw createValidationError('제목과 내용은 필수입니다.');
    }

    return callWorker('/api/reflections', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        title,
        content,
        date: date || new Date().toISOString()
      })
    });
  }

  async updateReflection(id, userId, data = {}) {
    assertId(id);
    assertUserId(userId);

    return callWorker(`/api/reflections/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ userId, ...data })
    });
  }

  async deleteReflection(id, userId) {
    assertId(id);
    assertUserId(userId);

    return callWorker(`/api/reflections/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId })
    });
  }
}

module.exports = new ReflectionService();

