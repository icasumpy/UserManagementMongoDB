const assert = require('node:assert/strict');
const { once } = require('node:events');
const { randomUUID } = require('node:crypto');
const { after, before, test } = require('node:test');
const bcrypt = require('bcrypt');

const testAdminEmail = `otp-admin-${randomUUID()}@example.invalid`;
const testEmails = [];
let app;
let server;
let baseUrl;
let token;
let EmailVerification;
let User;
let mongoose;
let emailService;
let originalIsSmtpConfigured;
let originalSendOtpEmail;
const deliveredOtp = new Map();

function newTestEmail() {
  const email = `otp-${randomUUID()}@example.invalid`;
  testEmails.push(email);
  return email;
}

async function post(path, body, authenticated = true) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(authenticated ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

async function put(path, body, authenticated = true) {
  return fetch(`${baseUrl}${path}`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      ...(authenticated ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}
async function send(email) {
  return post('/api/auth/email/send-otp', { email });
}

async function verify(email, otp) {
  return post('/api/auth/email/verify-otp', { email, otp });
}

before(async () => {
  process.env.ADMIN_EMAIL = testAdminEmail;
  process.env.ADMIN_PASSWORD_HASH = await bcrypt.hash('temporary-test-admin-password', 10);
  process.env.JWT_SECRET = 'email-otp-tests-only-secret-which-is-long-enough';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.EMAIL_OTP_HMAC_SECRET = 'email-otp-tests-hmac-key-with-at-least-32-bytes';

  const database = require('../src/config/database');
  assert.equal(await database.connectToDatabase(), true, 'test connection to Atlas');
  mongoose = require('mongoose');
  EmailVerification = require('../src/models/EmailVerification');
  User = require('../src/models/User');
  emailService = require('../src/services/emailService');
  originalIsSmtpConfigured = emailService.isSmtpConfigured;
  originalSendOtpEmail = emailService.sendOtpEmail;
  emailService.isSmtpConfigured = () => true;
  emailService.sendOtpEmail = async (email, otp) => { deliveredOtp.set(email, otp); };

  app = require('../src/app');
  const authService = require('../src/services/adminAuthService');
  token = authService.signAdminToken();
  server = app.listen(0);
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  emailService.isSmtpConfigured = originalIsSmtpConfigured;
  emailService.sendOtpEmail = originalSendOtpEmail;
  if (EmailVerification) await EmailVerification.deleteMany({ email: { $in: testEmails } }).catch(() => {});
  if (User) await User.deleteMany({ email: { $in: testEmails } }).catch(() => {});
  deliveredOtp.clear();
  if (server?.listening) {
    server.close();
    await once(server, 'close');
  }
  await mongoose.disconnect();
});

test('OTP routes require a valid Admin session and validate email/OTP input', async () => {
  const noAuth = await post('/api/auth/email/send-otp', { email: newTestEmail() }, false);
  assert.equal(noAuth.status, 401);

  const invalidEmail = await send('not-an-email');
  assert.equal(invalidEmail.status, 400);

  const email = newTestEmail();
  const sent = await send(email);
  assert.equal(sent.status, 201);
  const invalidOtp = await verify(email, '12ab56');
  assert.equal(invalidOtp.status, 400);
});

test('OTP is never returned, SMTP-unconfigured state is honest, and resend is throttled', async () => {
  const email = newTestEmail();
  emailService.isSmtpConfigured = () => false;
  const unavailable = await send(email);
  assert.equal(unavailable.status, 503);
  emailService.isSmtpConfigured = () => true;

  const sent = await send(email);
  assert.equal(sent.status, 201);
  const body = await sent.json();
  const otp = deliveredOtp.get(email);
  assert.match(otp, /^\d{6}$/);
  const storedOtp = await EmailVerification.findOne({ email }).select('otpHash').lean();
  assert.match(storedOtp.otpHash, /^[a-f0-9]{64}$/);
  assert.notEqual(storedOtp.otpHash, otp);
  assert.equal(JSON.stringify(body).includes(otp), false);
  assert.equal(typeof body.resendAfter, 'string');
  assert.equal(typeof body.expiresAt, 'string');

  const limited = await send(email);
  assert.equal(limited.status, 429);
  assert.equal(deliveredOtp.get(email), otp);
});

test('OTP is email-bound, expires, and locks after five incorrect attempts', async () => {
  const email = newTestEmail();
  const otherEmail = newTestEmail();
  assert.equal((await send(email)).status, 201);
  const otp = deliveredOtp.get(email);

  assert.equal((await verify(otherEmail, otp)).status, 400);
  assert.equal((await EmailVerification.findOne({ email })).attempts, 0);

  const wrongOtp = otp === '999999' ? '999998' : '999999';
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const response = await verify(email, wrongOtp);
    assert.equal(response.status, attempt === 5 ? 429 : 400);
  }
  assert.equal((await verify(email, otp)).status, 429);

  const expiredEmail = newTestEmail();
  assert.equal((await send(expiredEmail)).status, 201);
  await EmailVerification.updateOne({ email: expiredEmail }, { $set: { otpExpiresAt: new Date(Date.now() - 1) } });
  const expired = await verify(expiredEmail, deliveredOtp.get(expiredEmail));
  assert.equal(expired.status, 400);
});

test('user creation requires verified email, consumes OTP once, and remains race-safe for duplicate email', async () => {
  const email = newTestEmail();
  const createPayload = (targetEmail) => ({ email: targetEmail, matkhau: 'Temporary-user-password-2026', hoten: 'Temporary OTP Integration', hinhanh: '' });

  const bypass = await post('/api/users', createPayload(email));
  assert.equal(bypass.status, 403);
  assert.equal((await send(email)).status, 201);
  const otp = deliveredOtp.get(email);
  const valid = await verify(email, otp);
  assert.equal(valid.status, 200);
  assert.equal((await verify(email, otp)).status, 409);

  const changedEmail = newTestEmail();
  const changedAttempt = await post('/api/users', createPayload(changedEmail));
  assert.equal(changedAttempt.status, 403);

  const [first, second] = await Promise.all([
    post('/api/users', createPayload(email)),
    post('/api/users', createPayload(email)),
  ]);
  assert.equal([first.status, second.status].filter((status) => status === 201).length, 1);
  assert.ok([403, 409].includes([first.status, second.status].find((status) => status !== 201)));
  const firstBody = await first.json();
  const secondBody = await second.json();
  const created = first.status === 201 ? firstBody.user : secondBody.user;
  assert.equal('matkhau' in created, false);
  const storedUser = await User.collection.findOne({ email });
  assert.deepEqual(Object.keys(storedUser).sort(), ['_id', 'email', 'hinhanh', 'hoten', 'matkhau']);
  assert.equal(Boolean(await EmailVerification.exists({ email })), false);
  assert.equal(await User.countDocuments({ email }), 1);
});

test('email already used is rejected before an OTP is sent', async () => {
  const email = newTestEmail();
  await User.create({
    email,
    matkhau: await bcrypt.hash('Temporary-existing-user-password', 10),
    hoten: 'Temporary Existing User',
    hinhanh: '',
  });
  const response = await send(email);
  assert.equal(response.status, 409);
  assert.equal(deliveredOtp.has(email), false);
});

test('user update keeps same-email edits free of OTP and rejects unverified email changes', async () => {
  const email = newTestEmail();
  const target = newTestEmail();
  const user = await User.create({
    email,
    matkhau: await bcrypt.hash('Temporary-user-password-2026', 10),
    hoten: 'Temporary Update User',
    hinhanh: '',
  });
  const url = `/api/users/${user.id}`;

  const sameEmail = await put(url, { email, hoten: 'Updated Name' });
  assert.equal(sameEmail.status, 200);
  assert.equal((await sameEmail.json()).user.hoten, 'Updated Name');

  const cloudinary = require('../src/config/cloudinary');
  const cloudName = cloudinary.cloudinary.config().cloud_name;
  const imageUrl = 'https://res.cloudinary.com/' + cloudName + '/image/upload/usermanagement/avatars/' + randomUUID() + '.jpg';
  const imageUpdate = await put(url, { email, hinhanh: imageUrl });
  assert.equal(imageUpdate.status, 200);
  assert.equal((await imageUpdate.json()).user.hinhanh, imageUrl);

  const passwordUpdate = await put(url, { email, matkhau: 'Temporary-user-password-updated' });
  assert.equal(passwordUpdate.status, 200);
  const stored = await User.findById(user.id).select('matkhau email hoten hinhanh').lean();
  assert.equal(await bcrypt.compare('Temporary-user-password-updated', stored.matkhau), true);
  assert.equal(stored.email, email);

  assert.equal((await put(url, { email: target, hoten: 'Must not save' })).status, 403);
  assert.equal((await User.findById(user.id).select('email hoten').lean()).email, email);
  assert.equal((await put(url, { email: target }, false)).status, 401);
});

test('email updates require OTP for the exact destination and consume it only after success', async () => {
  const originalEmail = newTestEmail();
  const emailA = newTestEmail();
  const emailB = newTestEmail();
  const user = await User.create({
    email: originalEmail,
    matkhau: await bcrypt.hash('Temporary-user-password-2026', 10),
    hoten: 'Temporary OTP Update',
    hinhanh: '',
  });
  const url = `/api/users/${user.id}`;

  assert.equal((await send(emailA)).status, 201);
  const wrong = deliveredOtp.get(emailA) === '999999' ? '999998' : '999999';
  assert.equal((await verify(emailA, wrong)).status, 400);
  assert.equal((await put(url, { email: emailA })).status, 403);

  await EmailVerification.updateOne({ email: emailA }, { $set: { resendAfter: new Date(Date.now() - 1) } });
  assert.equal((await send(emailA)).status, 201);
  assert.equal((await verify(emailA, deliveredOtp.get(emailA))).status, 200);
  assert.equal((await put(url, { email: emailB })).status, 403, 'verified email A cannot authorize email B');

  await EmailVerification.updateOne({ email: emailA }, { $set: { expiresAt: new Date(Date.now() - 1), resendAfter: new Date(Date.now() - 1) } });
  assert.equal((await put(url, { email: emailA })).status, 403, 'expired verification cannot authorize update');

  assert.equal((await send(emailB)).status, 201);
  assert.equal((await verify(emailB, deliveredOtp.get(emailB))).status, 200);
  const updated = await put(url, { email: emailB, hoten: 'Verified Email User' });
  assert.equal(updated.status, 200);
  assert.equal((await updated.json()).user.email, emailB);
  assert.equal(Boolean(await EmailVerification.exists({ email: emailB })), false);
  assert.equal((await put(url, { email: newTestEmail() })).status, 403);
});
test('email collision is rejected and concurrent email changes cannot overwrite each other', async () => {
  const original = newTestEmail();
  const alreadyUsed = newTestEmail();
  const user = await User.create({ email: original, matkhau: await bcrypt.hash('Temporary-password-2026', 10), hoten: 'Race Source', hinhanh: '' });
  const other = await User.create({ email: alreadyUsed, matkhau: await bcrypt.hash('Temporary-password-2026', 10), hoten: 'Race Existing', hinhanh: '' });
  const url = `/api/users/${user.id}`;
  assert.equal((await put(url, { email: alreadyUsed })).status, 409);
  assert.equal((await send(alreadyUsed)).status, 409);

  const emailA = newTestEmail();
  const emailB = newTestEmail();
  for (const email of [emailA, emailB]) {
    assert.equal((await send(email)).status, 201);
    assert.equal((await verify(email, deliveredOtp.get(email))).status, 200);
  }
  const [first, second] = await Promise.all([
    put(url, { email: emailA }),
    put(url, { email: emailB }),
  ]);
  assert.equal([first.status, second.status].filter((status) => status === 200).length, 1);
  assert.equal([first.status, second.status].filter((status) => [403, 409].includes(status)).length, 1);
  const saved = await User.findById(user.id).select('email').lean();
  assert.ok([emailA, emailB].includes(saved.email));
  assert.equal((await User.findById(other.id).select('email').lean()).email, alreadyUsed);
});