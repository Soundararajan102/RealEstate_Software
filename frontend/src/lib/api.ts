const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // In browser: default to relative '/api' proxy so requests route to Next.js on the current domain/origin
    // and are forwarded over Docker's internal network to the backend.
    // This avoids port 4000 connection timeouts, CORS issues, and host IP hardcoding.
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl && envUrl.startsWith('/')) {
      return envUrl.replace(/\/$/, '');
    }
    if (envUrl && !envUrl.includes(':4000')) {
      return envUrl.replace(/\/$/, '');
    }
    return '/api';
  }
  return process.env.INTERNAL_API_URL
    ? `${process.env.INTERNAL_API_URL.replace(/\/$/, '')}/api`
    : 'http://backend:4000/api';
};

const API_BASE_URL = getBaseUrl();

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('msp_token');
}

export function setAuthSession(token: string, user: any) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('msp_token', token);
  localStorage.setItem('msp_user', JSON.stringify(user));
}

export function getStoredUser(): any | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem('msp_user');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('msp_token');
  localStorage.removeItem('msp_user');
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const cleanBase = API_BASE_URL.replace(/\/$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${cleanBase}${cleanEndpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      clearAuthSession();
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    const message = data?.message || data?.error || 'An error occurred while connecting to the server';
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }

  return data;
}

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatINR(val: number | string | null | undefined): string {
  // ponytail: stdlib Intl.NumberFormat handles formatting; coerce invalid/empty to 0
  return inrFormatter.format(Number(val) || 0);
}

export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
