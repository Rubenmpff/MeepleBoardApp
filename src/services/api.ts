// src/services/api.ts
import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import getEnvVars from "../constants/env";
import { tokenService } from "./tokenService";

const { API_URL } = getEnvVars();

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

// Helper: garante headers sempre existentes
function ensureHeaders(config: InternalAxiosRequestConfig) {
  config.headers = config.headers ?? {};
  return config;
}

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    config = ensureHeaders(config);

    const token = await tokenService.getValidToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (AxiosRequestConfig & { _retry?: boolean });

    // Se não for 401 ou já tentámos refresh, devolve erro normal
    if (error.response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    // Se já há refresh a acontecer, mete na fila
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((newToken) => {
          if (!newToken) return reject(error);

          originalRequest.headers = originalRequest.headers ?? {};
          (originalRequest.headers as any).Authorization = `Bearer ${newToken}`;
          resolve(api(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const newToken = await tokenService.refreshAccessToken();

      // resolve fila
      refreshQueue.forEach((cb) => cb(newToken));
      refreshQueue = [];

      if (!newToken) return Promise.reject(error);

      originalRequest.headers = originalRequest.headers ?? {};
      (originalRequest.headers as any).Authorization = `Bearer ${newToken}`;

      return api(originalRequest);
    } catch (err) {
      // rejeita fila
      refreshQueue.forEach((cb) => cb(null));
      refreshQueue = [];

      await tokenService.clearAll();
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;