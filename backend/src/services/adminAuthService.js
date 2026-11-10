const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {
  adminEmail,
  adminPasswordHash,
  jwtSecret,
  jwtExpiresIn,
} = require('../config/env');

const JWT_ISSUER = 'usermanagementmongodb-api';
const JWT_AUDIENCE = 'usermanagementmongodb-admin';
const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const JWT_EXPIRY_PATTERN = /^[1-9]\d*(s|m|h|d)$/;

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function getAdminAuthConfigIssues() {
  const issues = [];
  const normalizedAdminEmail = typeof adminEmail === 'string' ? normalizeEmail(adminEmail) : '';

  if (!normalizedAdminEmail || normalizedAdminEmail.length > 254 || !EMAIL_PATTERN.test(normalizedAdminEmail)) {
    issues.push('ADMIN_EMAIL must be a valid email address');
  }
  if (typeof adminPasswordHash !== 'string' || !BCRYPT_HASH_PATTERN.test(adminPasswordHash)) {
    issues.push('ADMIN_PASSWORD_HASH must be a valid bcrypt hash');
  }
  if (typeof jwtSecret !== 'string' || Buffer.byteLength(jwtSecret, 'utf8') < 32) {
    issues.push('JWT_SECRET must contain at least 32 bytes');
  }
  if (typeof jwtExpiresIn !== 'string' || !JWT_EXPIRY_PATTERN.test(jwtExpiresIn)) {
    issues.push('JWT_EXPIRES_IN must be a positive duration such as 1h');
  }

  return issues;
}

function getAdminAuthConfig() {
  if (getAdminAuthConfigIssues().length > 0) return null;
  return {
    email: normalizeEmail(adminEmail),
    passwordHash: adminPasswordHash,
    secret: jwtSecret,
    expiresIn: jwtExpiresIn,
  };
}

async function verifyAdminCredentials(email, password) {
  const config = getAdminAuthConfig();
  if (!config) return { configured: false, authenticated: false };

  // Always perform the bcrypt check for syntactically valid requests to avoid
  // making an unknown Admin email distinguishable by response timing.
  const passwordMatches = await bcrypt.compare(password, config.passwordHash);
  const emailMatches = normalizeEmail(email) === config.email;
  return {
    configured: true,
    authenticated: passwordMatches && emailMatches,
    email: config.email,
  };
}

function signAdminToken() {
  const config = getAdminAuthConfig();
  if (!config) throw new Error('Admin authentication is not configured');

  return jwt.sign({ sub: 'admin' }, config.secret, {
    algorithm: 'HS256',
    expiresIn: config.expiresIn,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
}

function verifyAdminToken(token) {
  const config = getAdminAuthConfig();
  if (!config) return null;

  try {
    const payload = jwt.verify(token, config.secret, {
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    if (typeof payload === 'string' || payload.sub !== 'admin') return null;
    return { email: config.email };
  } catch {
    return null;
  }
}

module.exports = {
  getAdminAuthConfigIssues,
  verifyAdminCredentials,
  signAdminToken,
  verifyAdminToken,
};
