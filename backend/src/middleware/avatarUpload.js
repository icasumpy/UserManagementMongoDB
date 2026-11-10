const multer = require('multer');

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const MIME_FORMATS = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

const parser = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AVATAR_BYTES, files: 1, fields: 0, parts: 1 },
  fileFilter(_request, file, callback) {
    if (!MIME_FORMATS.has(file.mimetype)) {
      const error = new Error('Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP.');
      error.status = 415;
      return callback(error);
    }
    return callback(null, true);
  },
}).single('image');

function matchesImageSignature(buffer, mimeType) {
  if (mimeType === 'image/jpeg') return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === 'image/png') return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimeType === 'image/webp') return buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  return false;
}

function avatarUpload(request, response, next) {
  parser(request, response, (error) => {
    if (error) {
      if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        return response.status(413).json({ error: 'Ảnh không được vượt quá 5 MB.' });
      }
      return response.status(error.status || 400).json({ error: error.status === 415 ? error.message : 'Dữ liệu ảnh tải lên không hợp lệ.' });
    }
    if (!request.file) return response.status(400).json({ error: 'Vui lòng chọn một ảnh để tải lên.' });
    if (!matchesImageSignature(request.file.buffer, request.file.mimetype)) {
      return response.status(415).json({ error: 'Nội dung ảnh không khớp định dạng JPEG, PNG hoặc WebP.' });
    }
    request.file.format = MIME_FORMATS.get(request.file.mimetype);
    return next();
  });
}

module.exports = { avatarUpload, MAX_AVATAR_BYTES, matchesImageSignature };
