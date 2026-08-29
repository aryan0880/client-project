import dotenv from 'dotenv';

dotenv.config();

/**
 * Typed environment variable loader.
 * Throws at startup if any required variable is missing so failures are explicit.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const env = {
  port: parseInt(optionalEnv('PORT', '5000'), 10),
  nodeEnv: optionalEnv('NODE_ENV', 'development'),
  mongoUri: optionalEnv('MONGODB_URI', ''),
  jwtSecret: optionalEnv('JWT_SECRET', 'dev-secret-change-in-production'),
  jwtExpiresIn: optionalEnv('JWT_EXPIRES_IN', '7d'),
  resendApiKey: optionalEnv('RESEND_API_KEY', ''),
  emailFrom: optionalEnv('EMAIL_FROM', ''),
  smtpUser: optionalEnv('SMTP_USER', ''),
  smtpPass: optionalEnv('SMTP_PASS', ''),
  frontendUrl: optionalEnv('FRONTEND_URL', 'http://localhost:5173'),
  isDevelopment: optionalEnv('NODE_ENV', 'development') === 'development',
};
