# 🌐 HƯỚNG DẪN ĐƯA DUYÊN CA LÊN GITHUB & VERCEL ĐỂ HOẠT ĐỘNG 24/7

> **Duyên Ca — Wedding Playlist Studio (AjiNO Edition)**  
> Giao diện chia 2 bên độc lập **🤵 HỌ NHÀ TRAI** và **👰 HỌ NHÀ GÁI**, tối ưu hóa 100% cho Vercel Serverless & GitHub để chạy 24/7 trên mọi thiết bị (Điện thoại, iPad, Laptop, PC) bất kỳ đâu có mạng Internet.

---

## 🌟 TỔNG QUAN HỆ THỐNG
Mã nguồn trong thư mục `AjiNO` đã được chuẩn bị sẵn sàng toàn bộ:
1. **Đã khởi tạo sẵn Git** với remote chính thức: `https://github.com/phamtuananh0098/AjiNO.git`
2. **Cấu hình `vercel.json` chuẩn hóa**: Tự động rewrite các API về serverless function và điều hướng SPA client.
3. **Bộ nhớ kép bất tử**: Dữ liệu lưu trong IndexedDB & LocalStorage của trình duyệt kết hợp bộ đệm Serverless `/tmp/duyen-ca-ajino-data`, không bao giờ bị mất danh sách nhạc.
4. **Engine phát nhạc 3 lớp**: Hỗ trợ toàn diện YouTube, tải file từ máy tính/điện thoại, và Google Drive (trực tiếp + lưu trữ Studio).

---

## 🚀 2 BƯỚC ĐƠN GIẢN ĐỂ HOẠT ĐỘNG ONLINE 24/7

### 📌 BƯỚC 1: ĐƯA MÃ NGUỒN LÊN GITHUB

#### Cách 1: Chạy file tự động (Nhanh nhất - Khuyên dùng)
1. Trong thư mục `AjiNO`, nhấp đúp chạy tệp: **`DAY_LEN_GITHUB.bat`**
2. **Lưu ý quan trọng**: Nếu màn hình báo `Repository not found`, đó là vì bạn chưa tạo repository trên GitHub:
   - Hãy mở trình duyệt truy cập: **[https://github.com/new](https://github.com/new)**
   - Ở ô **Repository name**, nhập đúng tên: **`AjiNO`**
   - Chọn chế độ **Public** (hoặc **Private** tùy ý) rồi nhấn **Create repository**.
   - Sau đó chạy lại file **`DAY_LEN_GITHUB.bat`** là xong!

#### Cách 2: Dùng GitHub Desktop (Giao diện trực quan - Máy bạn đã cài sẵn)
1. Mở ứng dụng **GitHub Desktop** trên máy tính.
2. Chọn menu **File** → **Add Local Repository...**
3. Chọn đường dẫn đến thư mục `AjiNO` (`c:\Users\PHAM TUAN\Documents\Qoder\2026-11-17\d84b70e3\AjiNO`).
4. Nhấn nút **Publish repository** lên tài khoản `phamtuananh0098`.

---

### 📌 BƯỚC 2: KẾT NỐI VỚI VERCEL ĐỂ HOẠT ĐỘNG 24/7

#### Cách 1: Kết nối Vercel với GitHub (Khuyên dùng — Tự động cập nhật 24/7)
1. Mở trình duyệt vào: **[https://vercel.com](https://vercel.com)**
2. Đăng nhập bằng tài khoản **Continue with GitHub**.
3. Tại trang tổng quan, nhấn nút **Add New...** → Chọn **Project**.
4. Ở danh sách repository hiện ra, tìm `phamtuananh0098/AjiNO` và nhấn **Import**.
5. Giữ nguyên toàn bộ cấu hình mặc định:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Nhấn nút **Deploy**.
7. Sau khoảng **30 giây**, Vercel sẽ cấp cho bạn một đường link toàn cầu 24/7 có HTTPS miễn phí, dạng:  
   👉 **`https://ajino-wedding.vercel.app`** (hoặc tên miền bạn chọn).

> 💡 **Ưu điểm vượt trội của cách này:** Mỗi lần bạn chỉnh sửa code hoặc chạy lại `DAY_LEN_GITHUB.bat`, Vercel sẽ **tự động cập nhật trang web mới nhất** mà bạn không cần phải cấu hình lại!

---

#### Cách 2: Triển khai trực tiếp bằng lệnh Vercel CLI
Nếu bạn muốn có ngay link web trong 1 phút mà không cần thao tác trên website Vercel:
1. Nhấp đúp chạy tệp **`TRIEN_KHAI_VERCEL.bat`** trong thư mục `AjiNO`.
2. Trình duyệt sẽ mở để bạn đăng nhập Vercel (nếu chưa đăng nhập).
3. Vercel CLI sẽ tự động đóng gói và xuất bản ứng dụng lên máy chủ đám mây toàn cầu.

---

## 📱 SỬ DỤNG TRÊN ĐIỆN THOẠI & THIẾT BỊ KHÁC
Khi đã có link Vercel:
- Gửi link cho Chú Rể, Cô Dâu, MC, DJ tiệc cưới hoặc Ban Tổ Chức.
- Mở link trên Safari (iPhone) hoặc Chrome (Android), chọn **"Thêm vào Màn hình chính" (Add to Home Screen)** để sử dụng như một App ứng dụng thực thụ full màn hình.
- Chế độ **Song Song (50/50)** hiển thị trọn vẹn cả 2 nhà trên iPad/Laptop/Màn hình lớn; trên điện thoại có thể bấm chuyển nhanh giữa tab **🤵 Nhà Trai** và **👰 Nhà Gái**.
