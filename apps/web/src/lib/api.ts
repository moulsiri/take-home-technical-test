// A simple API wrapper around fetch
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 && endpoint !== '/auth/refresh' && endpoint !== '/auth/login' && endpoint !== '/auth/register' && endpoint !== '/auth/me') {
    // try to refresh token
    const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    
    if (refreshRes.ok) {
      // retry original request
      return fetch(`${API_URL}${endpoint}`, { ...options, headers, credentials: 'include' });
    } else {
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
  }
  return res;
}
