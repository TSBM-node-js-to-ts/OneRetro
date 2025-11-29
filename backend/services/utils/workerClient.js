// Worker 공통 요청 유틸 함수
const WORKER_BASE_URL = process.env.WORKER_BASE_URL || '';

export async function callWorker(path, options = {}) {
  const url = `${WORKER_BASE_URL}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (!res.ok) {
    const text = await res.text();
    const error = new Error(
      `Worker 요청 실패: ${text || res.statusText || '응답이 없습니다.'}`
    );
    error.statusCode = res.status;
    throw error;
  }

  return res.json();
}