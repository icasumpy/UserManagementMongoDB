const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  matkhau: { type: String, required: true, select: false },
  hoten: { type: String, required: true, trim: true, maxlength: 100 },
  hinhanh: { type: String, default: '', maxlength: 14 * 1024 * 1024 },
}, {
  collection: 'users',
  strict: 'throw',
  timestamps: false,
  versionKey: false,
  autoIndex: false,
  minimize: false,
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
