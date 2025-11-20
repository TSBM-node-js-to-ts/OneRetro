// Workers Common request util function

export async function callWorker(path, options = {}) {
    const url = `${WORKER_BASE_URL}${path}`;

    const res = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP error! status: ${res.status}, message: ${text}`);
    }

    return res.json();
}


```
async 함수에서는 return할 때 자동으로 Promise가 래핑되기 때문에 
await을 붙여서 또 기다릴 필요가 없다.
언제 return await이 필요할까?
try/catch 안에서만 에러 캐치하는 경우에 return await이 필요하다.
try {
    return await res.json(); // ← error를 try 블록에서 잡음
} catch (err) {
    console.error("JSON parse error", err);
}
```