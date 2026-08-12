const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('jwt_token');
  const headers = new Headers(init.headers);

  if (!(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(data.error || response.statusText);
  }

  if (response.headers.get('Content-Type')?.includes('application/json')) {
    return response.json();
  }

  return response.blob() as Promise<T>;
}
