const assert = require('node:assert/strict');
const { once } = require('node:events');
const { randomBytes } = require('node:crypto');
const { after, before, test } = require('node:test');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const testEmail = `admin-${randomBytes(8).toString('hex')}@example.invalid`;
const testPassword = randomBytes(32).toString('base64url');
const testSecret = randomBytes(48).toString('base64url');
let app;
let server;
let baseUrl;

before(async () => {
  process.env.ADMIN_EMAIL = testEmail;
  process.env.ADMIN_PASSWORD_HASH = await bcrypt.hash(testPassword, 10);
  process.env.JWT_SECRET = testSecret;
  process.env.JWT_EXPIRES_IN = '1h';

  app = require('../src/app');
  server = app.listen(0);
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server?.listening) {
    server.close();
    await once(server, 'close');
  }
});

async function postLogin(email, password, transport = 'bearer') {
  return fetch(`${baseUrl}/api/auth/admin/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-auth-transport': transport },
    body: JSON.stringify({ email, password }),
  });
}

test('admin login returns a minimal, expiring JWT for bearer clients', async () => {
  const response = await postLogin(testEmail, testPassword);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.admin.email, testEmail);
  assert.equal(typeof body.token, 'string');
  const payload = jwt.decode(body.token);
  assert.equal(payload.sub, 'admin');
  assert.ok(payload.exp > payload.iat);
  assert.equal('password' in payload, false);
  assert.equal('matkhau' in payload, false);
  assert.equal('role' in payload, false);

  const me = await fetch(`${baseUrl}/api/auth/admin/me`, {
    headers: { authorization: `Bearer ${body.token}` },
  });
  assert.equal(me.status, 200);
  assert.deepEqual(await me.json(), { admin: { email: testEmail } });
});

test('wrong password and unknown email return the same generic error', async () => {
  const badPassword = await postLogin(testEmail, 'incorrect password');
  const badEmail = await postLogin('other-admin@example.invalid', testPassword);
  assert.equal(badPassword.status, 401);
  assert.equal(badEmail.status, 401);
  assert.deepEqual(await badPassword.json(), await badEmail.json());
});

test('login validates request input', async () => {
  const response = await postLogin('', '');
  assert.equal(response.status, 400);
});

test('admin session endpoint rejects missing, invalid, and expired JWTs', async () => {
  const noToken = await fetch(`${baseUrl}/api/auth/admin/me`);
  const invalid = await fetch(`${baseUrl}/api/auth/admin/me`, {
    headers: { authorization: 'Bearer not-a-valid-token' },
  });

  const expiredToken = jwt.sign(
    { sub: 'admin', iat: Math.floor(Date.now() / 1000) - 60 },
    testSecret,
    { algorithm: 'HS256', expiresIn: '1s', issuer: 'usermanagementmongodb-api', audience: 'usermanagementmongodb-admin' },
  );
  const expired = await fetch(`${baseUrl}/api/auth/admin/me`, {
    headers: { authorization: `Bearer ${expiredToken}` },
  });

  assert.equal(noToken.status, 401);
  assert.equal(invalid.status, 401);
  assert.equal(expired.status, 401);
});

test('web login uses an HttpOnly cookie and omits the JWT from JSON', async () => {
  const login = await postLogin(testEmail, testPassword, 'cookie');
  const body = await login.json();
  const setCookie = login.headers.get('set-cookie') || '';
  assert.equal(login.status, 200);
  assert.equal('token' in body, false);
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Strict/i);
  assert.match(setCookie, /Path=\/api(?:;|$)/i);

  const cookiePair = setCookie.split(';', 1)[0];
  const me = await fetch(`${baseUrl}/api/auth/admin/me`, { headers: { cookie: cookiePair } });
  assert.equal(me.status, 200);
  assert.deepEqual(await me.json(), { admin: { email: testEmail } });

  const logout = await fetch(`${baseUrl}/api/auth/admin/logout`, { method: 'POST', headers: { cookie: cookiePair } });
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get('set-cookie') || '', /Expires=/i);
});
