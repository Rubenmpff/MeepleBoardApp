// src/services/api.ts
import axios from "axios";
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
let refreshQueue: ((token: string | null) => void)[] = [];

api.interceptors.request.use(
  async (config) => {
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
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve) =>
        refreshQueue.push((newToken) => {
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          } else {
            resolve(Promise.reject(error));
          }
        })
      );
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const newToken = await tokenService.refreshAccessToken();

      refreshQueue.forEach((cb) => cb(newToken));
      refreshQueue = [];

      if (!newToken) return Promise.reject(error);

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (err) {
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
