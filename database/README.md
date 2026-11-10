# Database

The backend connects to MongoDB Atlas using `MONGODB_URI` and `MONGODB_DB_NAME=UserManagementDB`. On connection, it ensures the `users` collection exists, creating it only if absent. It does not insert sample data.

The `users` collection is restricted to four business fields: `email`, `matkhau`, `hoten`, and `hinhanh`. MongoDB supplies `_id`; Mongoose disables timestamps and its version key, and rejects unknown fields. The backend creates a unique index on normalized `email`, bcrypt-hashes `matkhau`, and excludes it from API responses. `hinhanh` stores validated JPEG/PNG/WebP Base64 data URLs, limited to 10 MB decoded size so BSON documents remain below MongoDB's 16 MB limit.

All user-management operations are behind the existing Admin JWT middleware. The Admin account is configured separately in backend environment variables and is never stored in `users`. No other collection or sample data is created.
