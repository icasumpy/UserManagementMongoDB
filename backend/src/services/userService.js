const bcrypt = require('bcrypt');
const User = require('../models/User');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 254;
const NAME_MAX_LENGTH = 100;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_BYTES = 72;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_STRING_BYTES = 14 * 1024 * 1024;
const USER_FIELDS = ['email', 'matkhau', 'hoten', 'hinhanh'];

class UserServiceError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'UserServiceError';
    this.status = status;
  }
}

function fail(status, message) {
  throw new UserServiceError(status, message);
}

function validateEmail(value) {
  if (typeof value !== 'string') fail(400, 'Email không hợp lệ.');
  const email = value.trim().toLowerCase();
  if (!email || email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
    fail(400, 'Email không hợp lệ.');
  }
  return email;
}

function validatePassword(value) {
  if (typeof value !== 'string') fail(400, 'Mật khẩu phải là chuỗi hợp lệ.');
  const bytes = Buffer.byteLength(value, 'utf8');
  if (value.length < PASSWORD_MIN_LENGTH || bytes > PASSWORD_MAX_BYTES) {
    fail(400, 'Mật khẩu phải có ít nhất 8 ký tự và không vượt quá giới hạn bcrypt.');
  }
  return value;
}

function validateName(value) {
  if (typeof value !== 'string') fail(400, 'Họ tên phải là chuỗi hợp lệ.');
  const name = value.trim();
  if (!name || name.length > NAME_MAX_LENGTH) fail(400, 'Họ tên không được để trống và tối đa 100 ký tự.');
  return name;
}

function validateImage(value) {
  if (value === '') return '';
  if (typeof value !== 'string' || Buffer.byteLength(value, 'utf8') > MAX_IMAGE_STRING_BYTES) {
    fail(400, 'Ảnh không hợp lệ hoặc vượt quá dung lượng cho phép.');
  }

  const match = value.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match || match[2].length % 4 !== 0) fail(400, 'Ảnh chỉ hỗ trợ JPEG, PNG hoặc WebP hợp lệ.');

  const [, format, encoded] = match;
  const imageBytes = Buffer.from(encoded, 'base64');
  if (imageBytes.length === 0 || imageBytes.length > MAX_IMAGE_BYTES || imageBytes.toString('base64') !== encoded) {
    fail(400, 'Ảnh vượt quá dung lượng 10 MB hoặc dữ liệu Base64 không hợp lệ.');
  }

  const isJpeg = format === 'jpeg' && imageBytes[0] === 0xff && imageBytes[1] === 0xd8 && imageBytes[2] === 0xff;
  const isPng = format === 'png' && imageBytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isWebp = format === 'webp'
    && imageBytes.toString('ascii', 0, 4) === 'RIFF'
    && imageBytes.toString('ascii', 8, 12) === 'WEBP';
  if (!isJpeg && !isPng && !isWebp) fail(400, 'Nội dung ảnh không khớp với định dạng đã khai báo.');
  return value;
}

function rejectUnknownFields(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail(400, 'Dữ liệu gửi lên không hợp lệ.');
  const unknown = Object.keys(input).filter((key) => !USER_FIELDS.includes(key));
  if (unknown.length > 0) fail(400, 'Dữ liệu chứa trường không được hỗ trợ.');
}

function toPublicUser(user) {
  if (!user) return null;
  return {
    _id: String(user._id),
    email: user.email,
    hoten: user.hoten,
    hinhanh: user.hinhanh || '',
  };
}

function isDuplicateEmail(error) {
  // `email` is the collection's only unique index, so a duplicate-key error
  // always means that normalized email is already taken.
  return [error?.code, error?.cause?.code, error?.originalError?.code].some((code) => Number(code) === 11000)
    || error?.name === 'MongoServerError' && /E11000 duplicate key error/.test(error?.message || '');
}

function translateDatabaseError(error) {
  if (isDuplicateEmail(error)) fail(409, 'Email này đã được sử dụng.');
  throw error;
}

function normalizeCreateInput(input) {
  rejectUnknownFields(input);
  return {
    email: validateEmail(input.email),
    matkhau: validatePassword(input.matkhau),
    hoten: validateName(input.hoten),
    hinhanh: input.hinhanh === undefined ? '' : validateImage(input.hinhanh),
  };
}

function normalizeUpdateInput(input) {
  rejectUnknownFields(input);
  const update = {};
  for (const field of USER_FIELDS) {
    if (!Object.hasOwn(input, field)) continue;
    if (field === 'email') update.email = validateEmail(input.email);
    if (field === 'matkhau') update.matkhau = validatePassword(input.matkhau);
    if (field === 'hoten') update.hoten = validateName(input.hoten);
    if (field === 'hinhanh') update.hinhanh = validateImage(input.hinhanh);
  }
  if (Object.keys(update).length === 0) fail(400, 'Cần cung cấp ít nhất một trường để cập nhật.');
  return update;
}

function validateId(id) {
  if (typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id)) fail(400, 'ID người dùng không hợp lệ.');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function listUsers(search = '') {
  const q = search.trim();
  if (q.length > 100) fail(400, 'Từ khóa tìm kiếm tối đa 100 ký tự.');
  const filter = q
    ? { $or: [{ email: { $regex: escapeRegExp(q), $options: 'i' } }, { hoten: { $regex: escapeRegExp(q), $options: 'i' } }] }
    : {};
  const users = await User.find(filter).select('_id email hoten hinhanh').sort({ hoten: 1, email: 1 }).lean();
  return users.map(toPublicUser);
}

async function getUser(id) {
  validateId(id);
  const user = await User.findById(id).select('_id email hoten hinhanh').lean();
  if (!user) fail(404, 'Không tìm thấy người dùng.');
  return toPublicUser(user);
}

async function createUser(input) {
  const data = normalizeCreateInput(input);
  data.matkhau = await bcrypt.hash(data.matkhau, 12);
  try {
    const user = await User.create(data);
    return toPublicUser(user);
  } catch (error) {
    translateDatabaseError(error);
  }
}

async function updateUser(id, input) {
  validateId(id);
  const update = normalizeUpdateInput(input);
  if (update.matkhau) update.matkhau = await bcrypt.hash(update.matkhau, 12);
  try {
    const user = await User.findByIdAndUpdate(id, { $set: update }, {
      returnDocument: 'after',
      runValidators: true,
      projection: '_id email hoten hinhanh',
    }).lean();
    if (!user) fail(404, 'Không tìm thấy người dùng.');
    return toPublicUser(user);
  } catch (error) {
    translateDatabaseError(error);
  }
}

async function deleteUser(id) {
  validateId(id);
  const user = await User.findByIdAndDelete(id).select('_id email hoten hinhanh').lean();
  if (!user) fail(404, 'Không tìm thấy người dùng.');
  return toPublicUser(user);
}

module.exports = {
  UserServiceError,
  createUser,
  deleteUser,
  getUser,
  listUsers,
  updateUser,
};
