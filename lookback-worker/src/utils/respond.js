
export function respondJSON(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

export function respondError(status = 500, message = "Error") {
  return respondJSON({ error: message }, status);
}
