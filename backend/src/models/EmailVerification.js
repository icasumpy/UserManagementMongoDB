const mongoose = require('mongoose');

const emailVerificationSchema = new mongoose.Schema({
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  otpHash: { type: String, required: true, default: '' },
  otpExpiresAt: { type: Date, default: null },
  resendAfter: { type: Date, required: true },
  attempts: { type: Number, required: true, default: 0, min: 0, max: 5 },
  verifiedAt: { type: Date, default: null },
  expiresAt: { type: Date, required: true },
}, {
  collection: 'email_verifications',
  strict: 'throw',
  timestamps: false,
  versionKey: false,
  autoIndex: false,
  autoCreate: false,
  minimize: false,
});

module.exports = mongoose.models.EmailVerification
  || mongoose.model('EmailVerification', emailVerificationSchema);
