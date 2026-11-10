const { randomUUID } = require('node:crypto');
const { Readable } = require('node:stream');
const { v2: cloudinary } = require('cloudinary');
const env = require('./env');

const AVATAR_FOLDER = 'usermanagement/avatars';
const configured = Boolean(env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret);

if (configured) {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true,
  });
}

function assertConfigured() {
  if (!configured) {
    const error = new Error('Cloudinary is not configured.');
    error.code = 'CLOUDINARY_NOT_CONFIGURED';
    throw error;
  }
}

function uploadAvatar(buffer, format) {
  assertConfigured();
  const publicId = `${AVATAR_FOLDER}/${randomUUID()}`;
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({
      resource_type: 'image',
      folder: AVATAR_FOLDER,
      public_id: publicId.split('/').pop(),
      overwrite: false,
      unique_filename: false,
      format,
    }, (error, result) => {
      if (error) return reject(error);
      if (!result?.secure_url || !result.secure_url.startsWith('https://')) {
        return reject(new Error('Cloudinary did not return an HTTPS image URL.'));
      }
      return resolve({ url: result.secure_url, publicId: result.public_id });
    });
    Readable.from(buffer).pipe(uploadStream);
  });
}

function publicIdFromUrl(value) {
  if (!configured || typeof value !== 'string') return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'res.cloudinary.com') return null;
    const path = parsed.pathname.split('/').filter(Boolean);
    if (path[0] !== env.cloudinaryCloudName || path[1] !== 'image' || path[2] !== 'upload') return null;
    const assetPath = path.slice(3).filter((part) => !/^v\d+$/.test(part)).join('/');
    const withoutExtension = assetPath.replace(/\.(jpe?g|png|webp)$/i, '');
    if (!/^usermanagement\/avatars\/[0-9a-f-]{36}$/i.test(withoutExtension)) return null;
    return withoutExtension;
  } catch {
    return null;
  }
}

async function deleteAvatarByPublicId(publicId) {
  assertConfigured();
  if (typeof publicId !== 'string' || !/^usermanagement\/avatars\/[0-9a-f-]{36}$/i.test(publicId)) {
    return { result: 'ignored' };
  }
  return cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
}

async function deleteAvatarByUrl(url) {
  const publicId = publicIdFromUrl(url);
  if (!publicId) return { result: 'ignored' };
  return deleteAvatarByPublicId(publicId);
}

module.exports = {
  AVATAR_FOLDER,
  configured,
  cloudinary,
  deleteAvatarByPublicId,
  deleteAvatarByUrl,
  publicIdFromUrl,
  uploadAvatar,
};
