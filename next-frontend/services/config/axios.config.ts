import axios from 'axios';

export const apiInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
};

// Track whether a refresh is already in flight to avoid parallel retries
let refreshing: Promise<string | null> | null = null;

async function tryRefresh(): Promise<string | null> {
  if (refreshing) return refreshing;
  refreshing = fetch('/api/auth/refresh', { method: 'POST' })
    .then(async (res) => {
      if (!res.ok) return null;
      const data = await res.json();
      return (data.token as string) ?? null;
    })
    .catch(() => null)
    .finally(() => { refreshing = null; });
  return refreshing;
}

apiInstance.interceptors.request.use((config) => {
  const token = getCookie('auth_token_client');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Only attempt refresh on 401, and only once per request
    if (error.response?.status === 401 && !original._retried) {
      original._retried = true;

      const newToken = await tryRefresh();

      if (newToken) {
        // Retry original request with the freshly set cookie (interceptor picks it up)
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiInstance(original);
      }

      // Refresh failed — dispatch session-expired so SessionGuard shows the overlay
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:session-expired'));
      }
    }

    return Promise.reject(error);
  }
);
