/** Production Render API */
export const PRODUCTION_API_URL = 'https://company-task-5vh3.onrender.com';

export function isHostedProduction() {
  if (typeof window === 'undefined') {
    return process.env.NODE_ENV === 'production';
  }
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return false;
  return true;
}

export function resolveApiBaseUrl() {
  const fromEnv = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
  if (fromEnv) return fromEnv;

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    return PRODUCTION_API_URL;
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000';
  }
  return PRODUCTION_API_URL;
}
