const jwt = require('jsonwebtoken');
const {
  getAdminAuthConfigIssues,
  verifyAdminCredentials,
  signAdminToken,
} = require('../services/adminAuthService');
const { isProduction } = require('../config/env');

const ADMIN_COOKIE_NAME = 'admin_session';
// Scope the HttpOnly session cookie to all API routes, including /api/users.
const ADMIN_COOKIE_PATH = '/api';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cookieOptions(maxAge) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: ADMIN_COOKIE_PATH,
    ...(typeof maxAge === 'number' ? { maxAge } : {}),
  };
}

async function loginAdmin(request, response, next) {
  const configIssues = getAdminAuthConfigIssues();
  if (configIssues.length > 0) {
    return response.status(503).json({
      error: 'Admin authentication is not configured.',
      details: configIssues,
    });
  }

  const { email, password } = request.body || {};
  if (
    typeof email !== 'string' ||
    email.trim().length === 0 ||
    email.trim().length > 254 ||
    !EMAIL_PATTERN.test(email.trim()) ||
    typeof password !== 'string' ||
    password.length === 0 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    return response.status(400).json({ error: 'A valid email and password are required.' });
  }

  try {
    const result = await verifyAdminCredentials(email, password);
    if (!result.configured) {
      return response.status(503).json({ error: 'Admin authentication is not configured.' });
    }
    if (!result.authenticated) {
      return response.status(401).json({ error: 'Email or password is incorrect.' });
    }

    const token = signAdminToken();
    const admin = { email: result.email };
    if (request.get('x-auth-transport') === 'cookie') {
      const decoded = jwt.decode(token);
      const maxAge = Math.max((decoded.exp * 1000) - Date.now(), 0);
      response.cookie(ADMIN_COOKIE_NAME, token, cookieOptions(maxAge));
      return response.status(200).json({ admin });
    }

    return response.status(200).json({ token, admin });
  } catch (error) {
    return next(error);
  }
}

function getAdminSession(request, response) {
  return response.status(200).json({ admin: request.admin });
}

function logoutAdmin(_request, response) {
  response.clearCookie(ADMIN_COOKIE_NAME, cookieOptions());
  return response.status(200).json({ status: 'ok' });
}

module.exports = {
  loginAdmin,
  getAdminSession,
  logoutAdmin,
};
