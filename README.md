# UserManagementMongoDB

Ứng dụng quản lý hồ sơ người dùng dành riêng cho Admin. Frontend dùng React Native và Expo, hỗ trợ Web và Android; backend dùng Node.js, Express và MongoDB Atlas. Admin xác thực bằng bcrypt/JWT. Ảnh đại diện được upload có xác thực qua backend lên Cloudinary; MongoDB lưu URL HTTPS trong trường `hinhanh`.

## Công nghệ

- Node.js 26+ và npm
- React Native, Expo và Expo Router
- Node.js và Express REST API
- MongoDB Atlas qua Mongoose
- bcrypt để hash mật khẩu; JWT để bảo vệ API quản trị
- Cloudinary Node SDK để lưu ảnh; Multer memory storage để nhận multipart upload

## Cấu trúc thư mục

```text
UserManagementMongoDB/
├── backend/                 # Express API, xác thực Admin và quản lý users
│   ├── src/config/          # Cấu hình môi trường, MongoDB và Cloudinary
│   ├── src/controllers/     # Xử lý request
│   ├── src/middleware/      # JWT Admin và xử lý lỗi
│   ├── src/models/          # Mongoose User model
│   ├── src/routes/          # Auth, health và users API
│   ├── src/services/        # Nghiệp vụ
│   ├── test/                # Kiểm thử xác thực và upload ảnh Admin
│   └── .env.example         # Mẫu cấu hình không chứa thông tin bí mật
├── frontend/                # Ứng dụng Expo cho Web và Android
│   └── src/                 # Routes, components, context và API clients
├── database/                # Tài liệu cấu trúc MongoDB
├── docs/                    # Đặc tả yêu cầu dự án
├── PROGRESS.md              # Tiến độ triển khai
└── README.md
```

## Cài đặt và cấu hình

Yêu cầu Node.js 26 trở lên theo `backend/package.json`, npm và Expo Go (Android) hoặc trình duyệt Web.

1. Cài backend dependencies:

   ```powershell
   cd backend
   npm install
   Copy-Item .env.example .env
   ```

2. Điền các biến cục bộ trong `backend/.env`: cấu hình Admin/JWT, `MONGODB_URI`, `MONGODB_DB_NAME=UserManagementDB`, Cloudinary và SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`). SMTP thường dùng port `587` với `SMTP_SECURE=false` (STARTTLS) hoặc port `465` với `SMTP_SECURE=true`. Tạo `EMAIL_OTP_HMAC_SECRET` ngẫu nhiên tối thiểu 32 byte, ví dụ `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Dùng thông tin SMTP/app password do nhà cung cấp email cấp. Không đưa `.env` lên Git. Giá trị trong `.env.example` chỉ là mẫu, không gửi email thật.

3. Cài frontend dependencies và cấu hình URL backend:

   ```powershell
   cd ..\frontend
   npm install
   Copy-Item .env.example .env
   ```

   Đặt `EXPO_PUBLIC_API_URL` trong `frontend/.env` thành URL backend có thể truy cập từ thiết bị. Với Expo Go trên điện thoại, dùng địa chỉ LAN của máy chạy backend, không dùng `localhost`.

## Chạy ứng dụng

Mở hai terminal từ thư mục dự án:

```powershell
cd backend
npm run dev
```

```powershell
cd frontend
npm run web
```

Để chạy Android, dùng `cd frontend; npm run android` với Android device/emulator đã sẵn sàng, hoặc chạy `npx expo start` rồi quét QR bằng Expo Go. Backend cần được chạy và firewall cho phép điện thoại kết nối đến port API.

Health check: `GET http://localhost:3000/api/health` (port thực tế lấy từ `PORT`).

## API ảnh đại diện

- `POST /api/users/avatar`: multipart field `image`, Admin authentication bắt buộc; nhận JPEG, PNG hoặc WebP tối đa 5 MB. Backend tải lên Cloudinary bằng SDK ký phía server, vào `usermanagement/avatars`, trả `url` HTTPS và `publicId` tạm thời.
- `DELETE /api/users/avatar`: Admin authentication bắt buộc; nhận `publicId` để dọn ảnh đã upload nhưng chưa gắn vào user.
- CRUD `/api/users` vẫn yêu cầu Admin. `hinhanh` nhận URL Cloudinary hợp lệ; mật khẩu user vẫn được hash bcrypt và không trả về frontend.
- `POST /api/auth/email/send-otp`: Admin authentication bắt buộc; request `{ "email": "..." }`, trả thời gian gửi lại nhưng không trả OTP.
- `POST /api/auth/email/verify-otp`: Admin authentication bắt buộc; request `{ "email": "...", "otp": "123456" }`.

OTP có hiệu lực 5 phút, dùng một lần, tối đa 5 lần nhập sai và giới hạn gửi lại mỗi 60 giây. Trạng thái OTP được lưu tạm trong collection riêng `email_verifications` với OTP HMAC, TTL cleanup; collection `users` không thay đổi. API tạo user kiểm tra xác thực email ở backend rồi xóa trạng thái xác minh sau khi tạo thành công.

`users` tiếp tục chỉ có các trường nghiệp vụ `email`, `matkhau`, `hoten`, `hinhanh` cùng `_id` MongoDB. Không lưu `public_id` riêng hoặc ảnh Base64 cho dữ liệu mới. Những bản ghi cũ đang chứa Base64 (nếu có) cần được thay ảnh để chuyển sang URL Cloudinary.

Nếu collection có ảnh Base64 từ phiên bản trước, chạy `cd backend; npm run migrate:avatars` để chuyển các ảnh JPEG/PNG/WebP hợp lệ tối đa 5 MB. Script chỉ cập nhật `hinhanh`, giữ nguyên các trường khác và báo số lượng bản ghi được chuyển/bỏ qua/lỗi.

## Kiểm thử

```powershell
cd backend
npm run test:auth
npm run test:avatar
npm run test:email-otp

cd ..\frontend
npx tsc --noEmit
npm run lint
npx expo export --platform web
npx expo export --platform android
```
