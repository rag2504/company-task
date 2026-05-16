const levels = ['debug', 'info', 'warn', 'error'];

function log(level, msg, meta) {
  if (!levels.includes(level)) level = 'info';
  const line = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${msg}`;
  if (meta !== undefined) {
    // eslint-disable-next-line no-console
    console[level === 'error' ? 'error' : 'log'](line, meta);
  } else {
    // eslint-disable-next-line no-console
    console[level === 'error' ? 'error' : 'log'](line);
  }
}

export const logger = {
  debug: (msg, meta) => log('debug', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
};
