const cloudinary = require('../config/cloudinary');

function publicError(error) {
  if (error?.code === 'CLOUDINARY_NOT_CONFIGURED') {
    return { status: 503, message: 'Dịch vụ lưu trữ ảnh chưa được cấu hình.' };
  }
  return { status: 502, message: 'Không thể tải ảnh lên dịch vụ lưu trữ. Vui lòng thử lại.' };
}

async function uploadAvatar(request, response) {
  try {
    const result = await cloudinary.uploadAvatar(request.file.buffer, request.file.format);
    return response.status(201).json({ url: result.url, publicId: result.publicId });
  } catch (error) {
    const safe = publicError(error);
    console.error(`[cloudinary] Avatar upload failed (${error?.name || 'Error'}). Details omitted.`);
    return response.status(safe.status).json({ error: safe.message });
  }
}

async function deleteAvatar(request, response) {
  const { publicId } = request.body || {};
  if (typeof publicId !== 'string' || !/^usermanagement\/avatars\/[0-9a-f-]{36}$/i.test(publicId)) {
    return response.status(400).json({ error: 'Mã ảnh cần xóa không hợp lệ.' });
  }
  try {
    const result = await cloudinary.deleteAvatarByPublicId(publicId);
    if (result.result !== 'ok' && result.result !== 'not found') {
      return response.status(502).json({ error: 'Không thể xóa ảnh khỏi dịch vụ lưu trữ.' });
    }
    return response.status(200).json({ success: true });
  } catch (error) {
    const safe = publicError(error);
    console.error(`[cloudinary] Avatar deletion failed (${error?.name || 'Error'}). Details omitted.`);
    return response.status(safe.status).json({ error: safe.message });
  }
}

module.exports = { deleteAvatar, uploadAvatar };
