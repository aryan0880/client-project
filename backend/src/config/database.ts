import mongoose from 'mongoose';
import dns from 'dns';
import { env } from './env';

try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

export async function connectDatabase(): Promise<void> {
  if (!env.mongoUri) {
    console.warn(
      '[DB] MONGODB_URI is not set. Skipping database connection.\n' +
        '     The API will start but database-dependent routes will not work.\n' +
        '     Set MONGODB_URI in your .env file to enable full functionality.'
    );
    return;
  }

  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log('[DB] Connected to MongoDB successfully.');
  } catch (error) {
    console.error('[DB] Connection failed:', error);
    // Do not crash the process in development so UI can still be tested
    if (!env.isDevelopment) {
      process.exit(1);
    }
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[DB] MongoDB disconnected.');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[DB] MongoDB error:', err);
  });
}
