# Project progress

## Phase 1 — Project foundation

- Complete: Expo frontend for Web/Android, Express backend, health route, CORS, project documentation.

## Phase 2 — MongoDB Atlas integration

- Complete: Mongoose connection uses `MONGODB_URI` and `MONGODB_DB_NAME`.
- Complete: backend ensures `users` exists without creating a schema or inserting records; health reflects database readiness.

## Phase 3 — Admin login

- Implemented: environment-configured Admin identity, bcrypt password verification, expiring JWTs, protected `/api/auth/admin/me`, logout.
- Implemented: responsive Modern SaaS Admin login and dashboard UI with shared components, real Admin email, honest empty states, and a collapsible small-screen navigation menu. Authentication logic, session storage, and protected routes are unchanged.
- Implemented: Web HttpOnly session cookie, Android Expo SecureStore, hidden-input bcrypt hash generator.
- Verified: all 5 backend authentication tests pass; frontend lint, TypeScript check, Web and Android exports, and Expo dependency compatibility check pass. Backend starts and connects to Atlas; health returns connected; no new collections or records are created by authentication.
- Configuration is kept in ignored local `.env` files; no secret values are stored in project documentation.
- Pending manual verification: login using the Admin password in the local environment; automated authentication tests use temporary in-memory credentials.
- Not implemented: user registration/login, user roles, or Admin records/collections in MongoDB.

## Frontend visual refresh

- Complete: refreshed login and protected dashboard using the project palette and reusable UI components.
- Complete: responsive Web/Android layouts; dashboard metrics remain empty until real management data is available.
- Not implemented: user registration/login, user roles, or functionality outside the approved Admin management scope.

## Phase 4 — Admin user management

- Implemented: Admin-protected list/search/detail/create/update/delete API and responsive Expo user-management screen.
- Implemented: bcrypt password hashing, unique normalized email index, strict four-field MongoDB documents, safe response projection, and validated/compressed Base64 profile photos.
- Verified: frontend lint, TypeScript, Expo dependency check, Web/Android exports, existing Admin authentication tests, and Atlas CRUD integration (including unauthorized requests, validation errors, duplicate emails, bcrypt storage, exact document fields, image validation, and cleanup of temporary test records).

## Cloudinary avatar storage integration

- Implemented: Admin-authenticated multipart avatar upload and cleanup APIs using Cloudinary server-side signed uploads.
- Implemented: JPEG/PNG/WebP validation by MIME and file signature, memory-only processing, and a 5 MB upload limit.
- Implemented: frontend device image picking/compression and multipart requests on Expo Web and Android; avatar URLs are stored in the existing `hinhanh` field.
- Implemented: replacement/deletion cleanup derives generated Cloudinary public IDs from HTTPS URLs; no additional MongoDB fields or collections.
- Security: Cloudinary credentials remain backend environment variables and are not logged or exposed to the frontend. Local `.env` files remain ignored by Git.
- Migrated: all 4 existing Base64 avatars to HTTPS Cloudinary URLs; conditional updates changed only `hinhanh`.
- Verified against Atlas: 5 users, 0 Base64 avatar values, 5 Cloudinary URLs, and all 5 documents contain only `_id` plus the four approved business fields.
- Verified: Cloudinary ping, signed upload and deletion; real authenticated API create/list/detail/update/avatar replacement/delete flow; temporary test user and Cloudinary assets were removed.
- Verified: Admin auth tests and multipart API tests pass; TypeScript, lint, Expo Web and Android exports pass. Expo compatibility check still reports pre-existing SDK package version drift.

## Email OTP verification before user creation

- Implemented: Admin-protected `POST /api/auth/email/send-otp` and `POST /api/auth/email/verify-otp` using Nodemailer over SMTP.
- Implemented: cryptographically random six-digit OTPs, email-bound HMAC storage, five-minute expiry, one-time verification, five-attempt lockout, and 60-second resend cooldown. MongoDB TTL cleanup is configured on the separate `email_verifications` collection; `users` remains unchanged.
- Implemented: backend `POST /api/users` requires an unexpired server-side verified-email record and consumes it after successful creation. Concurrent duplicate creation remains protected by the unique email index.
- Implemented: create-user form send/verify states, resend countdown, expiry/error feedback, and creation disabled until the current email is verified; changing the email clears client verification state.
- Verified: auth/avatar/OTP backend tests, Atlas OTP state and temporary user flow, Expo TypeScript/lint and Web/Android exports pass.
- Not verified: real SMTP delivery. No SMTP credentials or `EMAIL_OTP_HMAC_SECRET` are configured in the current local environment; the live OTP endpoint correctly returns HTTP 503 until configured. OTP integration tests use a mock mail transport and do not send real email.
