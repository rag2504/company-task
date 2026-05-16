import dotenv from 'dotenv';

dotenv.config();

const splitOrigins = (value) =>
  value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const isProduction = process.env.NODE_ENV === 'production';

/** Render sets PORT; local `npm run dev` forces 5000 via package.json script */
const port = isProduction
  ? parseInt(process.env.PORT || '10000', 10)
  : parseInt(process.env.PORT || '5000', 10);

/**
 * Render must listen on 0.0.0.0; local dev uses 127.0.0.1 (localhost only).
 */
const host = process.env.HOST || (isProduction ? '0.0.0.0' : '127.0.0.1');

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: port,
  HOST: host,
  MONGODB_URI: process.env.MONGODB_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || 'change-me-in-production-min-32-chars',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  FRONTEND_ORIGINS: splitOrigins(
    process.env.FRONTEND_ORIGINS ||
      'http://localhost:3000,http://localhost:3001'
  ),
  isProduction,
};
