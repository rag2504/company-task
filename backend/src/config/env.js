import dotenv from 'dotenv';

dotenv.config();

const splitOrigins = (value) =>
  value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

/** https://render.com sets RENDER=true on web services */
const isRender = Boolean(process.env.RENDER);
const isProduction =
  process.env.NODE_ENV === 'production' || isRender;

const localHost =
  process.env.HOST === 'localhost' ? '127.0.0.1' : process.env.HOST;

let port = parseInt(process.env.PORT || '5000', 10);
let host = localHost || (isProduction ? '0.0.0.0' : '127.0.0.1');

/** Render: always public bind + platform port (ignore HOST/PORT from .env or nodemon) */
if (isRender) {
  host = '0.0.0.0';
  if (process.env.PORT) {
    port = parseInt(process.env.PORT, 10);
  }
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || (isRender ? 'production' : 'development'),
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
  isRender,
};
