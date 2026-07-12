import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_keystone_jwt_secret_6f8g9h1j2k3l4';

/**
 * Sign a JWT token containing custom claims.
 * @param {object} payload - Claims to include in token
 * @param {number} expiresInSeconds - Expiration time in seconds (default 7 days)
 * @returns {string} Signed JWT token
 */
export function signJwt(payload, expiresInSeconds = 7 * 24 * 60 * 60) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const base64UrlEncode = (obj) => {
    return Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  };

  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInSeconds;
  const fullPayload = { ...payload, iat, exp };

  const headerStr = base64UrlEncode(header);
  const payloadStr = base64UrlEncode(fullPayload);

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${headerStr}.${payloadStr}`)
    .digest('base64url');

  return `${headerStr}.${payloadStr}.${signature}`;
}

/**
 * Verify a JWT token and return its payload.
 * @param {string} token - Signed JWT token
 * @returns {object|null} Decoded payload or null if invalid/expired
 */
export function verifyJwt(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerStr, payloadStr, signature] = parts;

    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${headerStr}.${payloadStr}`)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(
      Buffer.from(payloadStr, 'base64url').toString('utf8')
    );

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now > payload.exp) {
      console.warn('[JWT] Token expired');
      return null;
    }

    return payload;
  } catch (e) {
    console.error('[JWT] Verification failed:', e.message);
    return null;
  }
}

/**
 * Generate a random secure temporary/demo password.
 * @param {number} length - Password length (default 16)
 * @returns {string} Auto-generated password
 */
export function generateRandomPassword(length = 16) {
  // Ensure the password has at least: 1 uppercase, 1 lowercase, 1 digit, 1 special character
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const digitChars = '0123456789';
  const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = uppercaseChars + lowercaseChars + digitChars + specialChars;

  let password = '';
  // Force required character classes
  password += uppercaseChars[crypto.randomInt(0, uppercaseChars.length)];
  password += lowercaseChars[crypto.randomInt(0, lowercaseChars.length)];
  password += digitChars[crypto.randomInt(0, digitChars.length)];
  password += specialChars[crypto.randomInt(0, specialChars.length)];

  // Fill up the rest with random chars
  for (let i = 4; i < length; i++) {
    password += allChars[crypto.randomInt(0, allChars.length)];
  }

  // Shuffle the resulting password array
  return password
    .split('')
    .sort(() => crypto.randomInt(-1, 2))
    .join('');
}

/**
 * Hash a plaintext password using bcrypt.
 * @param {string} password - Plaintext password
 * @returns {Promise<string>} Bcrypt password hash
 */
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Verify if a plaintext password matches its hash.
 * @param {string} password - Plaintext password
 * @param {string} hash - Bcrypt hash
 * @returns {Promise<boolean>} True if match, false otherwise
 */
export async function verifyPassword(password, hash) {
  if (!password || !hash) return false;
  return bcrypt.compare(password, hash);
}

/**
 * Generate a password reset token (15 minute expiry).
 * @param {object} payload - Data to embed in reset token
 * @returns {string} JWT Token valid for 15 minutes
 */
export function generateResetToken(payload) {
  return signJwt(payload, 15 * 60); // 15 minutes
}

/**
 * Extract authentication context from the request headers.
 * Supports Bearer JWT and falls back to x-tenant-id/x-user-id headers for development.
 * @param {Request} request - Next.js Request object
 * @returns {object} Auth context containing tenantId, userId, role, and isAuthenticated
 */
export function getAuthContext(request) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyJwt(token);
    if (decoded) {
      return {
        tenantId: decoded.company_id,
        userId: decoded.user_id,
        role: decoded.role,
        isJwt: true,
        isAuthenticated: true
      };
    }
    return {
      isAuthenticated: false,
      error: 'Invalid or expired session token. Please log in again.'
    };
  }

  // Fallback to query parameters or legacy headers for quick dev logins (ONLY in non-production)
  if (process.env.NODE_ENV !== 'production') {
    let queryTenantId = null;
    let queryUserId = null;
    try {
      if (request.url) {
        const urlObj = new URL(request.url, 'http://localhost');
        queryTenantId = urlObj.searchParams.get('tenantId');
        queryUserId = urlObj.searchParams.get('userId');
      }
    } catch (e) {
      // ignore URL parse errors
    }

    const tenantId = request.headers.get('x-tenant-id') || queryTenantId || 't1';
    const userId = request.headers.get('x-user-id') || queryUserId || 'u1';
    const userRole = request.headers.get('x-user-role') || 'admin';
    
    return {
      tenantId,
      userId,
      role: userRole,
      isJwt: false,
      isAuthenticated: true
    };
  }
  
  return {
    isAuthenticated: false,
    error: 'Authentication credentials are required to access this resource.'
  };
}
