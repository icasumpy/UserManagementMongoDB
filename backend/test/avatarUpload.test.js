const assert = require('node:assert/strict');
const { once } = require('node:events');
const { randomBytes } = require('node:crypto');
const { after, before, test } = require('node:test');
const bcrypt = require('bcrypt');
let cloudinaryService;

const testEmail = `admin-${randomBytes(8).toString('hex')}@example.invalid`;
const testPassword = randomBytes(32).toString('base64url');
const testSecret = randomBytes(48).toString('base64url');
let app;
let server;
let baseUrl;
let adminCookie;
let originalUpload;
let originalDelete;

before(async () => {
  process.env.ADMIN_EMAIL = testEmail;
  process.env.ADMIN_PASSWORD_HASH = await bcrypt.hash(testPassword, 10);
  process.env.JWT_SECRET = testSecret;
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
  process.env.CLOUDINARY_API_KEY = 'test-api-key';
  process.env.CLOUDINARY_API_SECRET = 'test-api-secret';
  cloudinaryService = require('../src/config/cloudinary');
  app = require('../src/app');
  originalUpload = cloudinaryService.uploadAvatar;
  originalDelete = cloudinaryService.deleteAvatarByPublicId;
  cloudinaryService.uploadAvatar = async () => ({
    url: 'https://res.cloudinary.com/test-cloud/image/upload/usermanagement/avatars/123e4567-e89b-12d3-a456-426614174000.jpg',
    publicId: 'usermanagement/avatars/123e4567-e89b-12d3-a456-426614174000',
  });
  cloudinaryService.deleteAvatarByPublicId = async () => ({ result: 'ok' });

  server = app.listen(0);
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  const login = await fetch(`${baseUrl}/api/auth/admin/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-auth-transport': 'cookie' },
    body: JSON.stringify({ email: testEmail, password: testPassword }),
  });
  assert.equal(login.status, 200);
  adminCookie = (login.headers.get('set-cookie') || '').split(';', 1)[0];
});

after(async () => {
  cloudinaryService.uploadAvatar = originalUpload;
  cloudinaryService.deleteAvatarByPublicId = originalDelete;
  if (server?.listening) {
    server.close();
    await once(server, 'close');
  }
});

function samplePng() {
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), Buffer.alloc(20)]);
}

test('avatar upload requires Admin authentication', async () => {
  const form = new FormData();
  form.append('image', new Blob([samplePng()], { type: 'image/png' }), 'avatar.png');
  const response = await fetch(`${baseUrl}/api/users/avatar`, { method: 'POST', body: form });
  assert.equal(response.status, 401);
});

test('authenticated multipart upload returns HTTPS Cloudinary URL and public id', async () => {
  const form = new FormData();
  form.append('image', new Blob([samplePng()], { type: 'image/png' }), 'avatar.png');
  const response = await fetch(`${baseUrl}/api/users/avatar`, { method: 'POST', headers: { cookie: adminCookie }, body: form });
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.match(body.url, /^https:\/\/res\.cloudinary\.com\//);
  assert.match(body.publicId, /^usermanagement\/avatars\//);
});

test('authenticated upload rejects unsupported MIME type, spoofed content, and files over 5 MB', async () => {
  const unsupported = new FormData();
  unsupported.append('image', new Blob(['not an image'], { type: 'image/gif' }), 'avatar.gif');
  const unsupportedResponse = await fetch(`${baseUrl}/api/users/avatar`, { method: 'POST', headers: { cookie: adminCookie }, body: unsupported });
  assert.equal(unsupportedResponse.status, 415);

  const spoofed = new FormData();
  spoofed.append('image', new Blob(['not png bytes'], { type: 'image/png' }), 'avatar.png');
  const spoofedResponse = await fetch(`${baseUrl}/api/users/avatar`, { method: 'POST', headers: { cookie: adminCookie }, body: spoofed });
  assert.equal(spoofedResponse.status, 415);

  const oversized = new FormData();
  oversized.append('image', new Blob([Buffer.alloc(5 * 1024 * 1024 + 1)], { type: 'image/png' }), 'large.png');
  const oversizedResponse = await fetch(`${baseUrl}/api/users/avatar`, { method: 'POST', headers: { cookie: adminCookie }, body: oversized });
  assert.equal(oversizedResponse.status, 413);
});

test('authenticated avatar cleanup validates generated public ids', async () => {
  const denied = await fetch(`${baseUrl}/api/users/avatar`, { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ publicId: 'outside/folder' }) });
  assert.equal(denied.status, 401);
  const response = await fetch(`${baseUrl}/api/users/avatar`, {
    method: 'DELETE',
    headers: { cookie: adminCookie, 'content-type': 'application/json' },
    body: JSON.stringify({ publicId: 'usermanagement/avatars/123e4567-e89b-12d3-a456-426614174000' }),
  });
  assert.equal(response.status, 200);
});
