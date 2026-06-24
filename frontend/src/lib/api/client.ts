import axios from 'axios';
import { tokenStore } from '../../auth/tokenStore';
import { refreshClient } from './refreshClient';
import { env } from '../env';

export const client = axios.create({
  baseURL: env.VITE_API_BASE_URL + '/api/v1',
  withCredentials: true,
  timeout: 10000,
});

// Attach access token to every request
client.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Single-flight refresh on 401
let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      error.response?.data?.error?.code === 'TOKEN_EXPIRED' &&
      !original._retry
    ) {
      original._retry = true;
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return client(original);
        });
      }

      isRefreshing = true;
      try {
        const { data } = await refreshClient.post('/auth/refresh');
        const newToken = data.data.accessToken;
        tokenStore.set(newToken);

        refreshQueue.forEach((p) => p.resolve(newToken));
        refreshQueue = [];

        original.headers.Authorization = `Bearer ${newToken}`;
        return client(original);
      } catch (err) {
        refreshQueue.forEach((p) => p.reject(err));
        refreshQueue = [];
        tokenStore.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default client;
