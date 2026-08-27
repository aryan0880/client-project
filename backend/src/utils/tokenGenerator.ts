import crypto from 'crypto';

/**
 * Generates a cryptographically random survey token.
 * Uses 32 bytes of randomness → 64 hex characters.
 * This makes tokens unguessable and safe to embed in URLs.
 */
export function generateSurveyToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
