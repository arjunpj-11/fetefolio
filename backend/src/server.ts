import { app } from './app.js';
import { connectDatabase, disconnectDatabase } from './shared/config/db.js';
import { connectRedis, disconnectRedis } from './shared/config/redis.js';
import { env } from './shared/config/env.js';

const start = async (): Promise<void> => {
  await Promise.all([connectDatabase(), connectRedis()]);
  const server = app.listen(env.PORT);
  await new Promise<void>((resolve, reject) => {
    const onListening = () => {
      server.off('error', onError);
      resolve();
    };
    const onError = (error: Error) => {
      server.off('listening', onListening);
      reject(error);
    };
    server.once('listening', onListening);
    server.once('error', onError);
  });
  console.info(`Fetefolio API listening on http://localhost:${env.PORT}`);

  let isShuttingDown = false;
  const shutdown = (): void => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    server.close(() => {
      void Promise.allSettled([disconnectDatabase(), disconnectRedis()]).then(() =>
        process.exit(0),
      );
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};
void start().catch((error: unknown) => {
  console.error('API failed to start', error);
  process.exit(1);
});
