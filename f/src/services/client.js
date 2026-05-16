import axios from 'axios';
import { getAuthToken } from '../utils/userManager';

const base = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

export const api = axios.create({
  baseURL: base ? `${base}/api` : '/api',
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** True when the user has a JWT — data + AI calls should use the backend */
export function apiEnabled() {
  return Boolean(getAuthToken());
}
