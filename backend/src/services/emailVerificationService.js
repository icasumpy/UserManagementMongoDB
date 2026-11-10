const { createHmac, randomInt, timingSafeEqual } = require('node:crypto');
const EmailVerification = require('../models/EmailVerification');
const User = require('../models/User');
const env = require('../config/env');
const emailService = require('./emailService');
const { getDatabaseStatus } = require('../config/database');

const OTP_LIFETIME_MS = 5 * 60 * 1000;
const RESEND_WAIT_MS = 60 * 1000;
const VERIFIED_LIFETIME_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
let indexesReady;

class EmailVerificationError extends Error {
  constructor(status, message, code) {
    super(message);
    this.name = 'EmailVerificationError';
    this.status = status;
    this.code = code;
  }
}

function fail(status, message, code) {
  throw new EmailVerificationError(status, message, code);
}

function normalizeEmail(value) {
  if (typeof value !== 'string') fail(400, 'Vui lòng nhập email hợp lệ.', 'INVALID_EMAIL');
  const email = value.trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    fail(400, 'Vui lòng nhập email hợp lệ.', 'INVALID_EMAIL');
  }
  return email;
}

function assertConfigured() {
  if (getDatabaseStatus() !== 'connected') {
    fail(503, 'Cơ sở dữ liệu hiện không khả dụng.', 'DATABASE_UNAVAILABLE');
  }
  if (typeof env.emailOtpHmacSecret !== 'string' || Buffer.byteLength(env.emailOtpHmacSecret, 'utf8') < 32) {
    fail(503, 'Dịch vụ xác thực email chưa được cấu hình đầy đủ.', 'OTP_NOT_CONFIGURED');
  }
}

async function ensureIndexes() {
  if (!indexesReady) {
    indexesReady = Promise.all([
      EmailVerification.collection.createIndex({ email: 1 }, { unique: true, name: 'unique_verification_email' }),
      EmailVerification.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'expire_email_verifications' }),
    ]).catch((error) => {
      indexesReady = undefined;
      throw error;
    });
  }
  await indexesReady;
}

function hashOtp(email, otp) {
  return createHmac('sha256', env.emailOtpHmacSecret).update(`${email}\0${otp}`).digest('hex');
}

function hashesMatch(expected, supplied) {
  const expectedBytes = Buffer.from(expected, 'hex');
  const suppliedBytes = Buffer.from(supplied, 'hex');
  return expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes);
}

function isDuplicateKey(error) {
  return Number(error?.code) === 11000 || Number(error?.cause?.code) === 11000;
}

async function sendOtp(value) {
  const email = normalizeEmail(value);
  assertConfigured();
  await ensureIndexes();
  if (await User.exists({ email })) fail(409, 'Email này đã được sử dụng.');
  if (!emailService.isSmtpConfigured()) {
    fail(503, 'Máy chủ chưa cấu hình SMTP để gửi email OTP.', 'SMTP_NOT_CONFIGURED');
  }

  const now = new Date();
  const otp = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const otpHash = hashOtp(email, otp);
  const resendAfter = new Date(now.getTime() + RESEND_WAIT_MS);
  const otpExpiresAt = new Date(now.getTime() + OTP_LIFETIME_MS);
  let record;
  try {
    record = await EmailVerification.findOneAndUpdate(
      { email, $or: [{ resendAfter: { $lte: now } }, { resendAfter: { $exists: false } }] },
      { $set: { otpHash, otpExpiresAt, resendAfter, attempts: 0, verifiedAt: null, expiresAt: otpExpiresAt } },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    ).lean();
  } catch (error) {
    if (isDuplicateKey(error)) fail(429, 'Vui lòng chờ trước khi yêu cầu gửi lại mã OTP.', 'OTP_RESEND_LIMIT');
    throw error;
  }
  if (!record) fail(429, 'Vui lòng chờ trước khi yêu cầu gửi lại mã OTP.', 'OTP_RESEND_LIMIT');

  try {
    await emailService.sendOtpEmail(email, otp);
  } catch (error) {
    await EmailVerification.updateOne(
      { email, otpHash },
      { $set: { otpHash: '', otpExpiresAt: now, expiresAt: resendAfter } },
    ).catch(() => {});
    if (error?.code === 'SMTP_NOT_CONFIGURED') {
      fail(503, 'Máy chủ chưa cấu hình SMTP để gửi email OTP.', 'SMTP_NOT_CONFIGURED');
    }
    console.error(`[email-otp] SMTP delivery failed (${error?.code || error?.name || 'Error'}). Details omitted.`);
    fail(502, 'Không thể gửi email OTP lúc này. Vui lòng thử lại sau.', 'SMTP_DELIVERY_FAILED');
  }

  return { email, resendAfter, expiresAt: otpExpiresAt };
}

async function verificationState(email) {
  return EmailVerification.findOne({ email }).select('attempts otpExpiresAt verifiedAt').lean();
}

async function verifyOtp(value, suppliedOtp) {
  assertConfigured();
  const email = normalizeEmail(value);
  if (typeof suppliedOtp !== 'string' || !/^\d{6}$/.test(suppliedOtp)) {
    fail(400, 'Mã OTP phải gồm đúng 6 chữ số.', 'OTP_INVALID');
  }
  await ensureIndexes();
  const now = new Date();
  const record = await EmailVerification.findOne({ email }).select('otpHash otpExpiresAt attempts verifiedAt').lean();
  if (!record) fail(400, 'Mã OTP không hợp lệ hoặc đã hết hạn.', 'OTP_INVALID');
  if (record.verifiedAt) fail(409, 'Mã OTP đã được sử dụng.');
  if (record.attempts >= MAX_ATTEMPTS) fail(429, 'Bạn đã nhập sai OTP quá 5 lần. Hãy yêu cầu mã mới sau thời gian chờ.', 'OTP_ATTEMPTS_EXCEEDED');
  if (!record.otpExpiresAt || record.otpExpiresAt <= now || !record.otpHash) {
    fail(400, 'Mã OTP không hợp lệ hoặc đã hết hạn.', 'OTP_INVALID');
  }

  const submittedHash = hashOtp(email, suppliedOtp);
  if (!hashesMatch(record.otpHash, submittedHash)) {
    const updated = await EmailVerification.updateOne(
      { email, otpHash: record.otpHash, attempts: { $lt: MAX_ATTEMPTS }, verifiedAt: null, otpExpiresAt: { $gt: now } },
      { $inc: { attempts: 1 } },
    );
    if (updated.modifiedCount !== 1) {
      const latest = await verificationState(email);
      if (latest?.attempts >= MAX_ATTEMPTS) fail(429, 'Bạn đã nhập sai OTP quá 5 lần. Hãy yêu cầu mã mới sau thời gian chờ.', 'OTP_ATTEMPTS_EXCEEDED');
      fail(400, 'Mã OTP không hợp lệ hoặc đã hết hạn.', 'OTP_INVALID');
    }
    if (record.attempts + 1 >= MAX_ATTEMPTS) {
      fail(429, 'Bạn đã nhập sai OTP quá 5 lần. Hãy yêu cầu mã mới sau thời gian chờ.', 'OTP_ATTEMPTS_EXCEEDED');
    }
    fail(400, 'Mã OTP không chính xác.', 'OTP_INVALID');
  }

  const verifiedExpiresAt = new Date(now.getTime() + VERIFIED_LIFETIME_MS);
  const updated = await EmailVerification.findOneAndUpdate(
    { email, otpHash: record.otpHash, attempts: { $lt: MAX_ATTEMPTS }, verifiedAt: null, otpExpiresAt: { $gt: now } },
    { $set: { verifiedAt: now, expiresAt: verifiedExpiresAt }, $unset: { otpHash: '', otpExpiresAt: '' } },
    { returnDocument: 'after' },
  ).lean();
  if (!updated) {
    const latest = await verificationState(email);
    if (latest?.verifiedAt) fail(409, 'Mã OTP đã được sử dụng.');
    if (latest?.attempts >= MAX_ATTEMPTS) fail(429, 'Bạn đã nhập sai OTP quá 5 lần. Hãy yêu cầu mã mới sau thời gian chờ.', 'OTP_ATTEMPTS_EXCEEDED');
    fail(400, 'Mã OTP không hợp lệ hoặc đã hết hạn.', 'OTP_INVALID');
  }
  return { email, verified: true };
}

async function isEmailVerified(value) {
  const email = normalizeEmail(value);
  const now = new Date();
  return Boolean(await EmailVerification.exists({ email, verifiedAt: { $ne: null }, expiresAt: { $gt: now } }));
}

async function consumeVerification(value) {
  const email = normalizeEmail(value);
  try {
    await EmailVerification.deleteOne({ email, verifiedAt: { $ne: null } });
  } catch (error) {
    console.error(`[email-otp] Verified state cleanup failed (${error?.name || 'Error'}). TTL cleanup remains enabled.`);
  }
}

module.exports = { EmailVerificationError, consumeVerification, isEmailVerified, normalizeEmail, sendOtp, verifyOtp };
