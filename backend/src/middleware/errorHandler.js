import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  const message =
    err.isOperational || status < 500 ? err.message : 'Internal server error';

  if (status >= 500) {
    logger.error(err.message, { stack: err.stack, path: req.path });
  }

  res.status(status).json({
    success: false,
    message,
    details: err.details ?? undefined,
    ...(process.env.NODE_ENV === 'development' && status >= 500
      ? { stack: err.stack }
      : {}),
  });
}
