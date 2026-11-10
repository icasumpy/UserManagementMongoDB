# UserManagementMongoDB

Ứng dụng quản lý hồ sơ người dùng dành riêng cho Admin. Frontend dùng React Native và Expo, hỗ trợ Web và Android; backend dùng Node.js, Express và MongoDB Atlas. Admin xác thực bằng bcrypt/JWT. Người dùng được quản lý không có chức năng đăng nhập.

## Công nghệ

- Node.js 26+ và npm
- React Native, Expo và Expo Router
- Node.js và Express REST API
- MongoDB Atlas qua Mongoose
- bcrypt để hash mật khẩu; JWT để bảo vệ API quản trị

## Cấu trúc thư mục

```text
UserManagementMongoDB/
├── backend/                 # Express API, xác thực Admin và quản lý users
│   ├── src/config/          # Cấu hình môi trường và MongoDB
│   ├── src/controllers/     # Xử lý request
│   ├── src/middleware/      # JWT Admin và xử lý lỗi
│   ├── src/models/          # Mongoose User model
│   ├── src/routes/          # Auth, health và users API
│   ├── src/services/        # Nghiệp vụ
│   ├── test/                # Kiểm thử xác thực Admin
│   └── .env.example         # Mẫu cấu hình không chứa thông tin bí mật
├── frontend/                # Ứng dụng Expo cho Web và Android
│   └── src/                 # Routes, components, context và API clients
├── database/                # Tài liệu cấu trúc MongoDB
├── docs/                    # Đặc tả yêu cầu dự án
├── PROGRESS.md              # Tiến độ triển khai
└── README.md
```

## Cài đặt

Cần cài Node.js 26 trở lên. Mở hai terminal tại thư mục dự án.

### 1. Cài và cấu hình backend

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Mở `backend/.env` trên máy của bạn và điền cấu hình riêng:

- `MONGODB_URI`: URI kết nối MongoDB Atlas.
- `MONGODB_DB_NAME=UserManagementDB`.
- `ADMIN_EMAIL`: email Admin.
- `ADMIN_PASSWORD_HASH`: bcrypt hash của mật khẩu Admin. Tạo hash bằng `npm run admin:hash` trong thư mục `backend`.
- `JWT_SECRET`: secret ngẫu nhiên dùng ký JWT.
- `JWT_EXPIRES_IN`: thời hạn token, ví dụ `1h`.
- `FRONTEND_ORIGINS`: các origin frontend được phép gọi API.
- `PORT`: cổng backend; mẫu hiện đặt `3000`.

Không commit `.env`, không gửi các giá trị này lên GitHub và không ghi chúng vào tài liệu công khai.

Chạy backend:

```powershell
npm run dev
```

Kiểm tra trạng thái tại `http://localhost:3000/api/health`. API chỉ báo database kết nối khi MongoDB sẵn sàng.

### 2. Cài và cấu hình frontend

Mở terminal thứ hai:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
```

Trong `frontend/.env`, đặt `EXPO_PUBLIC_API_URL` tới backend, ví dụ `http://localhost:3000` cho trình duyệt chạy trên cùng máy. Khi dùng điện thoại Android, thay `localhost` bằng địa chỉ IP LAN của máy tính chạy backend. Điện thoại và máy tính cần kết nối cùng mạng.

### 3. Chạy ứng dụng

Web:

```powershell
cd frontend
npm run web
```

Android/Expo Go:

```powershell
cd frontend
npx expo start --lan
```

Quét QR bằng Expo Go. Đảm bảo backend đang chạy và `EXPO_PUBLIC_API_URL` trỏ tới địa chỉ mà điện thoại truy cập được.

## Kiểm thử

```powershell
cd backend
npm run test:auth
```

```powershell
cd frontend
npx tsc --noEmit
npm run lint
npx expo export --platform web
npx expo export --platform android
npx expo install --check
```

## Phạm vi và dữ liệu

Chỉ Admin đăng nhập và sử dụng ứng dụng. Các API quản lý người dùng yêu cầu JWT Admin. Collection `UserManagementDB.users` chỉ có bốn trường nghiệp vụ `email`, `matkhau`, `hoten`, `hinhanh`; MongoDB tự tạo `_id`. Mật khẩu người dùng được hash bằng bcrypt, response API không trả trường mật khẩu. Tài khoản Admin nằm trong biến môi trường backend, không lưu trong collection. Không sử dụng Firebase.

Xem thêm [đặc tả dự án](docs/PROJECT_REQUIREMENTS.md), [tài liệu database](database/README.md) và [tiến độ](PROGRESS.md).
