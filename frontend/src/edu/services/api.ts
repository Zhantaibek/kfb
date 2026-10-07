import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { getEmbedConfig } from '../embed/runtime';
import { EDU_API_URL } from '../config';

const api = axios.create({
  baseURL: EDU_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const embed = getEmbedConfig();
  if (embed.apiBaseUrl) {
    config.baseURL = embed.apiBaseUrl;
  }
  const token = embed.getAccessToken?.() ?? useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Иначе FormData уходит как JSON и multer не видит файл
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    const headers = config.headers as { delete?: (name: string) => void };
    if (typeof headers.delete === 'function') {
      headers.delete('Content-Type');
    } else {
      delete config.headers['Content-Type'];
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = String(error.config?.url ?? '');
      const isAuthChallenge =
        url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/verify-otp') ||
        url.includes('/auth/verify-magic-link') ||
        url.includes('/auth/verify-telegram') ||
        url.includes('/auth/telegram/continue');

      // Неверные логин/код — не считаем это «сессия истекла»
      if (!isAuthChallenge) {
        useAuthStore.getState().logout();
        const embed = getEmbedConfig();
        if (embed.onUnauthorized) {
          embed.onUnauthorized();
          return Promise.reject(error);
        }
        const path = window.location.pathname;
        const base = embed.basePath || '/education/app';
        const isPublic =
          path === base ||
          path === `${base}/` ||
          path.startsWith(`${base}/login`) ||
          path.startsWith(`${base}/register`);
        if (!isPublic) {
          window.location.href = `${base}/login`;
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
