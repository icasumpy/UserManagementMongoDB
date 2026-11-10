# UserManagementMongoDB

Ứng dụng quản lý hồ sơ người dùng dành riêng cho Admin. Frontend dùng React Native và Expo, hỗ trợ Web và Android; backend dùng Node.js, Express và MongoDB Atlas. Admin xác thực bằng bcrypt/JWT. 

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
