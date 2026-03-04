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

apiInstance.interceptors.request.use((config) => {
  const token = getCookie('auth_token_client');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);
