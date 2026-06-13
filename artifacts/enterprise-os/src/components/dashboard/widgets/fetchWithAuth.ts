export async function fetchWithAuth(url: string, options?: RequestInit): Promise<any> {
  const token = localStorage.getItem("enterprise_os_token");
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  });
  if (options?.method === "DELETE") {
    return res.ok ? null : Promise.reject(new Error(`DELETE ${url} failed: ${res.status}`));
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return Promise.reject(new Error(text || `Request failed: ${res.status}`));
  }
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) return res.json();
  return null;
}
