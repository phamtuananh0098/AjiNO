# 🌐 HƯỚNG DẪN ĐƯA DUYÊN CA LÊN GITHUB & VERCEL ĐỂ DÙNG TOÀN CẦU 24/7

> **Duyên Ca — Wedding Playlist Studio (AjiNO Edition)**  
> Bản nâng cấp chia 2 bên Nhà Trai & Nhà Gái, tối ưu hóa 100% cho Vercel Serverless & GitHub để truy cập mọi nơi, mọi lúc trên bất kỳ thiết bị nào chỉ cần có mạng Internet.

---

## 🌟 1. VÌ SAO BẢN NÀY ĐÃ SẴN SÀNG CHO VERCEL & GITHUB?

Thư mục `AjiNO` đã được trang bị sẵn toàn bộ cấu hình chuẩn hóa của Vercel:
1. **`vercel.json`**: Cấu hình rewrite định tuyến `/api/(.*)` vào serverless function và chuyển `/(.*)` về Single Page App `index.html`. Hỗ trợ CORS đầy đủ cho thiết bị di động.
2. **`api/index.js`**: Đóng gói toàn bộ logic backend thành hàm Serverless Function tương thích hoàn toàn với hạ tầng Vercel Lambda.
3. **Tự thích ứng lưu trữ trên Cloud (`server/paths.mjs`)**: Nhận diện môi trường Vercel (`process.env.VERCEL`) để tự động chuyển thư mục ghi sang `/tmp/duyen-ca-ajino-data`.
4. **Bộ nhớ kép bất tử (Dual-Layer Cache)**: Trình duyệt luôn lưu dữ liệu vào `IndexedDB` & `localStorage`, kết hợp đồng bộ lên Cloud và Google Drive, đảm bảo không bao giờ bị mất kịch bản cưới dù tắt mở thiết bị.

---

## 🚀 2. HƯỚNG DẪN ĐƯA LÊN GITHUB VÀ KẾT NỐI VERCEL (2 PHƯƠNG ÁN)

### 📌 PHƯƠNG ÁN A: KẾT NỐI QUA GITHUB (Khuyên dùng — Cập nhật tự động)

#### Bước 1: Tạo Repository trên GitHub
1. Truy cập [https://github.com](https://github.com) và đăng nhập tài khoản của bạn.
2. Nhấn vào dấu **`+`** ở góc trên bên phải → Chọn **New repository**.
3. Đặt tên kho lưu trữ, ví dụ: `duyen-ca-wedding-studio`.
4. Chọn chế độ **Public** (hoặc **Private** tùy ý) → Nhấn **Create repository**.

#### Bước 2: Tải mã nguồn `AjiNO` lên GitHub
Bạn có thể chọn 1 trong 3 cách tiện nhất sau:

* **Cách 2.1: Dùng lệnh Git (Nếu đã cài Git trên máy):**
  Mở PowerShell tại thư mục `AjiNO` và chạy:
  ```bash
  cd "c:\Users\PHAM TUAN\Documents\Qoder\2026-11-17\d84b70e3\AjiNO"
  git init
  git add .
  git commit -m "Khoi tao Duyen Ca Studio chia 2 ben Nha Trai & Nha Gai"
  git branch -M main
  git remote add origin https://github.com/TÊN_GITHUB_CỦA_BẠN/duyen-ca-wedding-studio.git
  git push -u origin main
  ```
  *(Nếu máy chưa có Git, bạn có thể cài nhanh bằng lệnh: `winget install --id Git.Git -e` trong PowerShell).*

* **Cách 2.2: Dùng GitHub Desktop (Giao diện đồ họa dễ nhất):**
  1. Tải ứng dụng miễn phí tại [desktop.github.com](https://desktop.github.com).
  2. Chọn **File** → **Add Local Repository** → Chọn thư mục `AjiNO`.
  3. Nhấn **Publish repository** lên tài khoản GitHub của bạn.

* **Cách 2.3: Tải trực tiếp qua trình duyệt Web:**
  Tại trang repository vừa tạo trên GitHub, kéo thả toàn bộ các tệp và thư mục trong `AjiNO` (ngoại trừ `node_modules` và `dist`) rồi nhấn **Commit changes**.

#### Bước 3: Kết nối với Vercel để chạy online
1. Truy cập [https://vercel.com](https://vercel.com) và đăng nhập (chọn **Continue with GitHub**).
2. Tại bảng điều khiển Vercel, nhấn **Add New...** → Chọn **Project**.
3. Danh sách kho GitHub sẽ hiện ra → Tìm `duyen-ca-wedding-studio` và nhấn **Import**.
4. Cấu hình kiểm tra:
   - **Framework Preset**: `Vite` (Vercel tự động nhận).
   - **Root Directory**: `./` (để mặc định).
   - **Build Command**: `npm run build` (để mặc định).
   - **Output Directory**: `dist` (để mặc định).
5. Nhấn nút **Deploy**.
6. Quá trình triển khai chỉ mất khoảng **30 - 45 giây**. Vercel sẽ cấp cho bạn một đường dẫn toàn cầu dạng:
   👉 **`https://duyen-ca-wedding-studio.vercel.app`**

Bây giờ bạn có thể gửi đường link này cho Cô Dâu, Chú Rể, MC, Quản lý sảnh tiệc hay ban nhạc. Mọi người có thể mở bằng 4G, Wi-Fi ở bất cứ đâu trên thế giới!

---

### 📌 PHƯƠNG ÁN B: DEPLOY TRỰC TIẾP LÊN VERCEL BẰNG LỆNH (Không cần tạo GitHub)

Nếu bạn muốn có link Vercel ngay lập tức trong 1 phút mà không cần qua các bước tạo GitHub:
1. Mở PowerShell tại thư mục `AjiNO`.
2. Chạy lệnh:
   ```powershell
   npx vercel
   ```
3. Vercel sẽ hỏi đăng nhập (Login via Email/GitHub), sau đó xác nhận:
   - *Set up and deploy?* → Nhấn `Y`
   - *Which scope?* → Chọn tài khoản của bạn
   - *Link to existing project?* → Nhấn `N`
   - *What's your project's name?* → Gõ `duyen-ca-wedding`
   - *In which directory is your code located?* → Để `./` và nhấn Enter
4. Chỉ sau 30 giây, Vercel sẽ trả về link truy cập chính thức!

---

## 👥 3. HƯỚNG DẪN SỬ DỤNG GIAO DIỆN CHIA 2 BÊN NHÀ TRAI & NHÀ GÁI

### Chuyển đổi 3 chế độ xem linh hoạt
Tại thanh công cụ phía trên danh sách bài hát, bạn có thể chuyển đổi:
* **👥 Song Song (50 / 50)**: Hiển thị 2 cột độc lập song song cạnh nhau.
  * Cột bên trái: **🤵 HỌ NHÀ TRAI** (Theme Oxford Navy & Vàng kim lịch lãm).
  * Cột bên phải: **👰 HỌ NHÀ GÁI** (Theme Hoa hồng & Rượu vang ngọt ngào).
* **🤵 Nhà Trai**: Tập trung toàn màn hình vào các bài hát và giai đoạn của chú rể & họ nhà trai.
* **👰 Nhà Gái**: Tập trung toàn màn hình vào các bài hát và giai đoạn của cô dâu & họ nhà gái.

### Cá nhân hoá theo sở thích riêng biệt
* **Thêm bài hát**: Khi bấm **+ Bài Nhà Trai** hoặc **+ Bài Nhà Gái**, bài hát sẽ tự động được gán nhãn bên tương ứng.
* **Đổi bên nhanh**: Trên mỗi dòng bài hát có huy hiệu `[🤵 Nhà Trai]`, `[👰 Nhà Gái]` hoặc `[💍 Cả Hai Bên]`, bạn có thể nhấp chuột trực tiếp để chuyển bài hát sang phía đối diện.
* **Bàn điều khiển Studio Console**: Khi bất kỳ bài hát nào đang phát, góc trái hiển thị rõ huy hiệu phát: `[🤵 NHÀ TRAI]` hoặc `[👰 NHÀ GÁI]` cùng ghi chú thời điểm CUE giúp người bấm nhạc không bao giờ bị nhầm lẫn.
* **In kịch bản (Cue Sheet)**: Hỗ trợ 3 tùy chọn in ấn:
  1. In kịch bản tổng hợp hai họ.
  2. In riêng kịch bản Nhà Trai (để phát cho MC / người phụ trách lễ xuất phát đón dâu).
  3. In riêng kịch bản Nhà Gái (để phát cho MC / người phụ trách lễ vu quy).
