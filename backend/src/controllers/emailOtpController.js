const emailVerificationService = require('../services/emailVerificationService');

function handleError(error, response, next) {
  if (error instanceof emailVerificationService.EmailVerificationError) {
    return response.status(error.status).json({ error: error.message, ...(error.code ? { code: error.code } : {}) });
  }
  return next(error);
}

async function sendOtp(request, response, next) {
  try {
    const result = await emailVerificationService.sendOtp(request.body?.email);
    return response.status(201).json({
      success: true,
      message: 'Mã OTP đã được gửi đến email.',
      resendAfter: result.resendAfter.toISOString(),
      expiresAt: result.expiresAt.toISOString(),
    });
  } catch (error) {
    return handleError(error, response, next);
  }
}

async function verifyOtp(request, response, next) {
  try {
    const result = await emailVerificationService.verifyOtp(request.body?.email, request.body?.otp);
    return response.status(200).json({ success: true, verified: result.verified, email: result.email });
  } catch (error) {
    return handleError(error, response, next);
  }
}

module.exports = { sendOtp, verifyOtp };
