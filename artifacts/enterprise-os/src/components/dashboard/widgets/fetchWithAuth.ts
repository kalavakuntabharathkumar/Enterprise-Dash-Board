export async function fetchWithAuth(url: string): Promise<any> {
  const token = localStorage.getItem("enterprise_os_token");
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) return [];
  return res.json();
}
