// API 클라이언트 설정
const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');
const WORKER_URL = (import.meta.env.VITE_WORKER_URL || 'http://localhost:8787').replace(/\/$/, '');

// 기본 fetch 래퍼
async function apiCall(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: response.statusText };
      }
      const error = new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    return response.json();
  } catch (error) {
    console.error('API call failed:', url, error);
    throw error;
  }
}

// Backend API
export const backendAPI = {
  // Health check
  health: () => apiCall(`${BACKEND_URL}/health`),

  // Reflections
  getReflections: (userId, params = {}) => {
    const query = new URLSearchParams({ userId, ...params }).toString();
    return apiCall(`${BACKEND_URL}/api/reflections?${query}`);
  },
  getReflection: (id, userId) => {
    return apiCall(`${BACKEND_URL}/api/reflections/${id}?userId=${userId}`);
  },
  createReflection: (data) => {
    return apiCall(`${BACKEND_URL}/api/reflections`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateReflection: (id, data) => {
    return apiCall(`${BACKEND_URL}/api/reflections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  deleteReflection: (id, userId) => {
    return apiCall(`${BACKEND_URL}/api/reflections/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId }),
    });
  },

  // Coach
  analyzeReflection: (data) => {
    return apiCall(`${BACKEND_URL}/api/coach/analyze`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Worker API
export const workerAPI = {
  // Tags
  getTags: () => apiCall(`${WORKER_URL}/api/tags`),
  createTag: (data) => {
    return apiCall(`${WORKER_URL}/api/tags`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  generateTags: (data) => {
    return apiCall(`${WORKER_URL}/api/tags/generate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Reflection Tags
  getReflectionTags: (reflectionId) => {
    return apiCall(`${WORKER_URL}/api/reflection-tags/${reflectionId}`);
  },
  attachTag: (data) => {
    return apiCall(`${WORKER_URL}/api/reflection-tags`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  removeTag: (reflectionId, tagId) => {
    return apiCall(`${WORKER_URL}/api/reflection-tags/${reflectionId}/${tagId}`, {
      method: 'DELETE',
    });
  },

  // Memories
  getMemories: (userId, limit = 20) => {
    return apiCall(`${WORKER_URL}/api/memories?userId=${userId}&limit=${limit}`);
  },
  createMemory: (data) => {
    return apiCall(`${WORKER_URL}/api/memories`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Analytics
  getReflectionCount: (userId) => {
    return apiCall(`${WORKER_URL}/api/analytics/reflection-count?userId=${userId}`);
  },
  getTagFrequency: (userId) => {
    return apiCall(`${WORKER_URL}/api/analytics/tag-frequency?userId=${userId}`);
  },

  // AI
  summarize: (data) => {
    return apiCall(`${WORKER_URL}/api/ai/summarize`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  analyzeSentiment: (data) => {
    return apiCall(`${WORKER_URL}/api/ai/analyze-sentiment`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  extractKeywords: (data) => {
    return apiCall(`${WORKER_URL}/api/ai/extract-keywords`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  suggestTags: (data) => {
    return apiCall(`${WORKER_URL}/api/ai/suggest-tags`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  analyzeFull: (data) => {
    return apiCall(`${WORKER_URL}/api/ai/analyze-full`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

