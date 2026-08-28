const API_BASE_URL =
  import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? "/api" : "http://localhost:8000");

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.detail || data?.message || `Request failed: ${response.status}`
    );
  }

  return data;
}