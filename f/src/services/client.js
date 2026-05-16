import axios from 'axios';
import { getAuthToken } from '../utils/userManager';
import { resolveApiBaseUrl } from '../config/apiConfig';

const apiBase = resolveApiBaseUrl();

export const api = axios.create({
  baseURL: `${apiBase}/api`,
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getApiBaseUrl() {
  return apiBase;
}

export function apiEnabled() {
  return Boolean(getAuthToken());
}

/** Ping local/production API without auth */
export async function checkApiHealth() {
  const res = await axios.get(`${apiBase}/api/health`, { timeout: 5000 });
  return res.data;
}
