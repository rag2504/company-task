import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { socketAuthenticate } from './middleware/auth.js';

async function main() {
  await connectDb();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: env.FRONTEND_ORIGINS,
      credentials: true,
    },
  });

  io.use(socketAuthenticate);
  io.on('connection', (socket) => {
    const room = `user:${socket.userId}`;
    socket.join(room);
    logger.debug(`Socket joined ${room}`);
  });

  app.set('io', io);

  server.listen(env.PORT, env.HOST, () => {
    const localUrl =
      env.HOST === '0.0.0.0' || env.HOST === '::'
        ? `http://localhost:${env.PORT}`
        : `http://${env.HOST}:${env.PORT}`;
    logger.info(
      `Quickbill API ready (${env.NODE_ENV}) — ${localUrl}  [bind ${env.HOST}:${env.PORT}]`
    );
  });
}

main().catch((err) => {
  logger.error(err.message, { stack: err.stack });
  process.exit(1);
});
