import { env } from './env.js';

/** Allow Netlify production + preview deploys without listing every URL in env */
export function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (env.FRONTEND_ORIGINS.includes(origin)) return true;
  if (
    env.isProduction &&
    /^https:\/\/[a-z0-9-]+--[a-z0-9-]+\.netlify\.app$/i.test(origin)
  ) {
    return true;
  }
  if (env.isProduction && /^https:\/\/[a-z0-9-]+\.netlify\.app$/i.test(origin)) {
    return true;
  }
  return false;
}

export function corsOrigin(origin, callback) {
  if (isAllowedOrigin(origin)) {
    callback(null, true);
  } else {
    callback(new Error(`CORS blocked origin: ${origin}`));
  }
}
