function authHeaders(): HeadersInit {
  const token = localStorage.getItem("enterprise_os_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const d = await res.json(); msg = d.detail || d.message || msg; } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: authHeaders() });
  return handleResponse<T>(res);
}

export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: authHeaders(), body: JSON.stringify(body) });
  return handleResponse<T>(res);
}

export async function apiPatch<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "PATCH", headers: authHeaders(), body: JSON.stringify(body) });
  return handleResponse<T>(res);
}

export async function apiDelete(url: string): Promise<void> {
  const res = await fetch(url, { method: "DELETE", headers: authHeaders() });
  return handleResponse<void>(res);
}
