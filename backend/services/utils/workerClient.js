// Worker 공통 요청 유틸 함수
const WORKER_BASE_URL = process.env.WORKER_BASE_URL || 'http://localhost:8787';

export async function callWorker(path, options = {}) {
  if (!WORKER_BASE_URL) {
    throw new Error('WORKER_BASE_URL이 설정되지 않았습니다. 환경 변수를 확인해주세요.');
  }

  // path가 /로 시작하지 않으면 추가
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${WORKER_BASE_URL}${normalizedPath}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    if (!res.ok) {
      const text = await res.text();
      let errorMessage = `Worker 요청 실패 (${res.status}): ${text || res.statusText || '응답이 없습니다.'}`;
      
      // 연결 실패인 경우 더 명확한 메시지
      if (res.status === 0 || text.includes('Failed to fetch') || text.includes('ECONNREFUSED')) {
        errorMessage = `Worker 서버에 연결할 수 없습니다. ${WORKER_BASE_URL}가 실행 중인지 확인해주세요.`;
      }
      
      const error = new Error(errorMessage);
      error.statusCode = res.status;
      throw error;
    }

    return res.json();
  } catch (error) {
    // 네트워크 오류인 경우
    if (error.message.includes('fetch') || error.code === 'ECONNREFUSED') {
      throw new Error(`Worker 서버에 연결할 수 없습니다. ${WORKER_BASE_URL}가 실행 중인지 확인해주세요.`);
    }
    throw error;
  }
}