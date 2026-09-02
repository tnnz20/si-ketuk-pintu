import { api } from './client';
import type { LoginResponse } from '@app-types/api';

export async function login(identifier: string, password: string): Promise<string> {
  const data = await api<LoginResponse>('/api/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });
  localStorage.setItem('jwt_token', data.token);
  return data.token;
}

export function logout(): void {
  localStorage.removeItem('jwt_token');
}

export function getToken(): string | null {
  return localStorage.getItem('jwt_token');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
