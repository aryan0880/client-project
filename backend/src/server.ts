import app from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';

async function startServer(): Promise<void> {
  await connectDatabase();

  app.listen(env.port, () => {
    console.log(`\n[Server] Running on port ${env.port} (${env.nodeEnv})`);
    console.log(`[Server] API: http://localhost:${env.port}/api`);
    console.log(`[Server] Health: http://localhost:${env.port}/api/health\n`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Failed to start:', err);
  process.exit(1);
});
