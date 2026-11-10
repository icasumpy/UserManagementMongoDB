const cookie = require('cookie');
const { getAdminAuthConfigIssues, verifyAdminToken } = require('../services/adminAuthService');

const ADMIN_COOKIE_NAME = 'admin_session';

function requireAdminAuth(request, response, next) {
  const configIssues = getAdminAuthConfigIssues();
  if (configIssues.length > 0) {
    return response.status(503).json({ error: 'Admin authentication is not configured.' });
  }

  const authorization = request.get('authorization') || '';
  const bearer = authorization.match(/^Bearer\s+(.+)$/i);
  const cookies = cookie.parseCookie(request.headers.cookie || '');
  const token = (bearer && bearer[1]) || cookies[ADMIN_COOKIE_NAME];
  if (!token) return response.status(401).json({ error: 'Authentication is required.' });

  const admin = verifyAdminToken(token);
  if (!admin) return response.status(401).json({ error: 'Authentication token is invalid or expired.' });

  request.admin = admin;
  return next();
}

module.exports = requireAdminAuth;
