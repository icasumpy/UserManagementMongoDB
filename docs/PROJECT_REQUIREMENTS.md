# Đặc tả yêu cầu — UserManagementMongoDB

## 1. Tổng quan

UserManagementMongoDB là **Admin User Management System**. Chỉ có một đối tượng sử dụng ứng dụng: Admin. Admin đăng nhập vào ứng dụng để quản lý danh sách người dùng. Người dùng được quản lý không phải là tài khoản đăng nhập vào hệ thống này.

## 2. Công nghệ và nền tảng

- Frontend: React Native + Expo.
- Nền tảng: Web và Android.
- Backend: Node.js + Express.
- Cơ sở dữ liệu: MongoDB Atlas.
- JWT dùng để xác thực các API quản trị.
- bcrypt dùng để kiểm tra mật khẩu Admin và hash mật khẩu người dùng trước khi lưu.
- Không sử dụng Firebase.

## 3. Admin và xác thực

- Chỉ Admin được đăng nhập và sử dụng ứng dụng.
- Tài khoản Admin được cấu hình riêng ở backend qua biến môi trường; không lưu trong collection `users`.
- Backend dùng bcrypt để so sánh mật khẩu đăng nhập với mật khẩu Admin đã hash trong cấu hình môi trường.
- Khi đăng nhập thành công, backend cấp JWT. Các API quản trị phải yêu cầu JWT hợp lệ.
- Đăng xuất kết thúc phiên ở phía ứng dụng bằng cách loại bỏ thông tin xác thực; không tạo tài khoản User.
- Biến môi trường Admin: `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `JWT_SECRET`, `JWT_EXPIRES_IN`. Không dùng giá trị mặc định không an toàn.
- Không ghi mật khẩu, hash hoặc JWT secret vào log/source code; không lưu tài khoản Admin trong database.

## 4. Chức năng trong phạm vi

Admin có thể:

- Đăng nhập và đăng xuất.
- Xem Dashboard.
- Thêm người dùng.
- Xem danh sách và chi tiết người dùng.
- Sửa thông tin người dùng.
- Xóa người dùng.
- Tìm kiếm người dùng.
- Chọn và hiển thị hình ảnh của người dùng.

## 5. Dữ liệu người dùng

- MongoDB database: `UserManagementDB`.
- Collection: `users`.
- MongoDB tự sinh `_id`.
- Chỉ có đúng bốn trường nghiệp vụ: `email`, `matkhau`, `hoten`, `hinhanh`.
- `matkhau` phải được hash bằng bcrypt trước khi lưu.
- Không thêm `role`, `status`, `createdAt`, `updatedAt` hoặc bất kỳ trường nghiệp vụ nào khác.
- Thông tin tài khoản Admin tách riêng khỏi collection này.

## 6. Ngoài phạm vi và điều cấm

- Không có đăng nhập User, đăng ký User hoặc màn hình dành cho User.
- Không có phân quyền Admin/User và không thêm trường `role`.
- Không phát triển chức năng ngoài phạm vi bài tập nếu chưa được yêu cầu.
- Không sử dụng Firebase.

## 7. Trạng thái giai đoạn hiện tại

- Giai đoạn 1 đã khởi tạo cấu trúc Expo/Web/Android, màn hình khởi đầu, Express API health, CORS và tài liệu.
- Giai đoạn 2 đã tích hợp kết nối Mongoose tới MongoDB Atlas bằng `MONGODB_URI` và `MONGODB_DB_NAME`, tạo collection `users` nếu chưa tồn tại, và phản ánh tình trạng database trong `GET /api/health`.
- Giai đoạn 2 không tạo Mongoose schema/model và không chèn dữ liệu mẫu.
- Giai đoạn 3 đã có API Admin login/session/logout, xác thực bcrypt/JWT, màn hình đăng nhập, khu vực Admin tối giản được bảo vệ, SecureStore cho Android và HttpOnly cookie cho Web.
- Phase 4 complete: Admin-only user CRUD and responsive UI; normalized unique email, bcrypt password hashing, validated/compressed Base64 photos, and exactly four business fields. API responses exclude `matkhau`.
- Users have no login/registration and there is no User/Admin role system.