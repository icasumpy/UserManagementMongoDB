# Database

The backend connects to MongoDB Atlas using `MONGODB_URI` and `MONGODB_DB_NAME=UserManagementDB`. On connection, it ensures the `users` collection exists, creating it only if absent. It does not insert sample data.

The `users` collection is restricted to four business fields: `email`, `matkhau`, `hoten`, and `hinhanh`. MongoDB supplies `_id`; Mongoose disables timestamps and its version key, and rejects unknown fields. The backend creates a unique index on normalized `email`, bcrypt-hashes `matkhau`, and excludes it from API responses. `hinhanh` stores an HTTPS URL from the configured Cloudinary account in `usermanagement/avatars`. The one-time `npm run migrate:avatars` command moves legacy Base64 images of supported formats up to 5 MB to Cloudinary and conditionally replaces only `hinhanh`; invalid or oversized legacy values are reported and left unchanged for manual handling.

All user-management operations, avatar upload/cleanup APIs, and email OTP endpoints are behind the existing Admin JWT middleware. Admin accounts are configured separately in backend environment variables and are never stored in `users`. Email OTP state is stored temporarily in the separate `email_verifications` collection, which has a TTL index; it never adds fields to `users`.

`email_verifications` is created by the OTP service when it initializes its indexes. It stores only temporary verification state: normalized `email`, HMAC `otpHash`, `otpExpiresAt`, `resendAfter`, `attempts`, `verifiedAt`, and TTL field `expiresAt`. Successful user creation removes the verified record; MongoDB TTL cleanup removes expired records automatically. The HMAC key is `EMAIL_OTP_HMAC_SECRET` and must not be shared with the frontend.
