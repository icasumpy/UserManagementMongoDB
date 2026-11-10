const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter;

function isSmtpConfigured() {
  return Boolean(
    env.smtpHost
    && Number.isInteger(env.smtpPort)
    && env.smtpPort > 0
    && env.smtpPort <= 65535
    && typeof process.env.SMTP_SECURE === 'string'
    && env.smtpUser
    && env.smtpPass
    && env.mailFrom,
  );
}

function getTransporter() {
  if (!isSmtpConfigured()) {
    const error = new Error('SMTP is not configured.');
    error.code = 'SMTP_NOT_CONFIGURED';
    throw error;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      requireTLS: !env.smtpSecure,
      auth: { user: env.smtpUser, pass: env.smtpPass },
    });
  }
  return transporter;
}

async function sendOtpEmail(email, otp) {
  const mailer = getTransporter();
  const expiryMinutes = 5;
  await mailer.sendMail({
    from: env.mailFrom,
    to: email,
    subject: 'Mã xác thực email - UserManagementMongoDB',
    text: [
      `Mã xác thực email của bạn là: ${otp}`,
      `Mã có hiệu lực trong ${expiryMinutes} phút.`,
      'Không chia sẻ mã xác thực. Chỉ nhập mã này vào biểu mẫu xác thực vừa mở.',
      'Nếu bạn không yêu cầu mã, hãy bỏ qua email này.',
    ].join('\n\n'),
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#111"><h2>Xác thực email</h2><p>Sử dụng mã sau để xác thực email người dùng:</p><div style="font-size:32px;font-weight:700;letter-spacing:8px;padding:16px 20px;background:#f5f5f5;border-radius:8px;text-align:center">${otp}</div><p>Mã có hiệu lực trong <strong>${expiryMinutes} phút</strong>.</p><p style="color:#555">Không chia sẻ mã xác thực. Chỉ nhập mã vào biểu mẫu xác thực vừa mở. Nếu bạn không yêu cầu mã, hãy bỏ qua email này.</p></div>`,
  });
}

module.exports = { isSmtpConfigured, sendOtpEmail };
