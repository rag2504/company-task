/** Production Render API (used when REACT_APP_API_URL is missing from the build) */
export const PRODUCTION_API_URL = 'https://company-task-5vh3.onrender.com';

export function resolveApiBaseUrl() {
  const fromEnv = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000';
  }
  return PRODUCTION_API_URL;
}
