import { resolveApiBaseUrl } from '../config/apiConfig';

export function formatApiError(error) {
  const status = error.response?.status;
  const serverMsg = error.response?.data?.message;
  const api = resolveApiBaseUrl();

  if (status === 401) {
    return 'Not signed in to the server. Sign out, then sign in with your Quickbill email and password.';
  }
  if (status === 403) {
    return serverMsg || 'You do not have permission for this action.';
  }
  if (status === 404) {
    return `API route not found on ${api}. Redeploy the backend on Render if this persists.`;
  }
  if (!error.response && error.request) {
    return `Cannot reach Quickbill API at ${api}. On free Render, the first request can take 30–60 seconds — wait and try again.`;
  }
  return serverMsg || error.message || 'Request failed.';
}
