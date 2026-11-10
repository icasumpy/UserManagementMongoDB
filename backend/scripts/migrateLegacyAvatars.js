const mongoose = require('mongoose');
const User = require('../src/models/User');
const cloudinary = require('../src/config/cloudinary');
const { connectToDatabase } = require('../src/config/database');

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

function parseLegacyImage(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match || match[2].length % 4 !== 0) return null;
  const [, format, encoded] = match;
  const buffer = Buffer.from(encoded, 'base64');
  if (!buffer.length || buffer.toString('base64') !== encoded || buffer.length > MAX_AVATAR_BYTES) return null;
  const valid = format === 'jpeg'
    ? buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
    : format === 'png'
      ? buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  if (!valid) return null;
  return { buffer, format: format === 'jpeg' ? 'jpg' : format };
}

async function migrate() {
  if (!cloudinary.configured) throw new Error('Cloudinary is not configured.');
  if (!await connectToDatabase()) throw new Error('MongoDB is unavailable.');

  const legacyUsers = await User.find({ hinhanh: /^data:image\// }).select('_id hinhanh').lean();
  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of legacyUsers) {
    const image = parseLegacyImage(user.hinhanh);
    if (!image) {
      skipped += 1;
      continue;
    }

    let uploaded;
    try {
      uploaded = await cloudinary.uploadAvatar(image.buffer, image.format);
      const result = await User.updateOne(
        { _id: user._id, hinhanh: user.hinhanh },
        { $set: { hinhanh: uploaded.url } },
        { runValidators: true },
      );
      if (result.modifiedCount !== 1) {
        await cloudinary.deleteAvatarByPublicId(uploaded.publicId);
        skipped += 1;
        continue;
      }
      migrated += 1;
    } catch (error) {
      if (uploaded?.publicId) {
        await cloudinary.deleteAvatarByPublicId(uploaded.publicId).catch(() => {});
      }
      failed += 1;
      console.error(`[avatar-migration] One avatar could not be migrated (${error?.name || 'Error'}).`);
    }
  }

  console.log(`[avatar-migration] Complete: migrated=${migrated}, skipped=${skipped}, failed=${failed}.`);
  if (skipped || failed) process.exitCode = 2;
}

migrate()
  .catch((error) => {
    console.error(`[avatar-migration] Stopped (${error?.name || 'Error'}). No credential details were logged.`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
