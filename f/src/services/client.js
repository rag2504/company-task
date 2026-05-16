import axios from 'axios';
import { getAuthToken } from '../utils/userManager';

function resolveApiBase() {
  const fromEnv = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000';
  }
  return '';
}

const apiBase = resolveApiBase();

export const api = axios.create({
  baseURL: apiBase ? `${apiBase}/api` : '/api',
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
  const base =
    apiBase ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '');
  if (!base) {
    throw new Error('REACT_APP_API_URL is not configured');
  }
  const res = await axios.get(`${base}/api/health`, { timeout: 5000 });
  return res.data;
}
