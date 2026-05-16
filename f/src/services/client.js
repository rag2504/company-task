import axios from 'axios';
import { getAuthToken } from '../utils/userManager';
import { resolveApiBaseUrl } from '../config/apiConfig';

export const api = axios.create({
  timeout: 90000,
});

api.interceptors.request.use((config) => {
  config.baseURL = `${resolveApiBaseUrl()}/api`;
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getApiBaseUrl() {
  return resolveApiBaseUrl();
}

export function apiEnabled() {
  return Boolean(getAuthToken());
}

/** Ping API without auth */
export async function checkApiHealth() {
  const base = resolveApiBaseUrl();
  const res = await axios.get(`${base}/api/health`, { timeout: 30000 });
  return res.data;
}
