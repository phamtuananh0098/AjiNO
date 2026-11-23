# 💐 Duyên Ca — Wedding Playlist Studio (AjiNO Edition)

> **Studio quản lý và điều phối kịch bản âm thanh tiệc cưới tự do cá nhân hoá**, phân chia giao diện 2 bên riêng biệt cho **Họ Nhà Trai (Chú Rể)** và **Họ Nhà Gái (Cô Dâu)**, hỗ trợ nạp nhạc đa nguồn (Máy tính, Điện thoại, Google Drive, Web Link), cắt nhạc theo từng khoảnh khắc (Cue), tự động lưu trữ và đồng bộ nhất quán thời gian thực trên mọi thiết bị. Hỗ trợ triển khai trực tiếp lên **GitHub & Vercel** để truy cập toàn cầu 24/7.

---

## 🚀 Cách khởi chạy nhanh nhất

### Cách 1: Nhấp đúp chuột (Khuyên dùng trên Windows)
- Nhấp đúp vào tệp **`CHAY_DUYEN_CA.bat`** trong thư mục `AjiNO`.
- Hệ thống sẽ tự động kiểm tra, biên dịch ứng dụng và mở giao diện tại `http://localhost:8788`.

### Cách 2: Bằng dòng lệnh (Terminal / PowerShell)
```bash
cd AjiNO

# Chế độ phát triển (Live reload + Máy chủ đồng bộ)
npm run dev

# Hoặc chế độ máy chủ chạy trực tiếp
npm run build
npm start
```

### Cách 3: Triển khai lên Vercel & GitHub để dùng mọi lúc mọi nơi
Xem hướng dẫn chi tiết tại tệp: **[HUONG_DAN_VERCEL_GITHUB.md](HUONG_DAN_VERCEL_GITHUB.md)**

---

## ✨ Các tính năng nổi bật

### 1. Phân chia 2 bên độc lập: Họ Nhà Trai & Họ Nhà Gái
- **Giao diện 2 cột song song (Split 50 / 50)**:
  - 🤵 **Cột bên trái — HỌ NHÀ TRAI**: Quản lý danh sách bài hát, giai đoạn rước dâu, gu âm nhạc yêu thích của chú rể và hội bạn. Tone màu Navy & Hoàng kim lịch lãm.
  - 👰 **Cột bên phải — HỌ NHÀ GÁI**: Quản lý danh sách bài hát, giai đoạn vu quy, khoảnh khắc cô dâu vào lễ đường, gu âm nhạc lãng mạn của cô dâu. Tone màu Hoa hồng & Rượu vang ngọt ngào.
- **Chế độ xem linh hoạt**: Chuyển đổi 1 chạm giữa:
  - `[ 👥 Song Song (50/50) ]`
  - `[ 🤵 Chỉ Nhà Trai ]`
  - `[ 👰 Chỉ Nhà Gái ]`
- **Huy hiệu nhận diện trên Studio Console**: Khi phát bất kỳ bài hát nào, màn hình DJ hiển thị rõ ràng `[🤵 NHÀ TRAI]` hoặc `[👰 NHÀ GÁI]`, kèm ghi chú CUE thời điểm phát.
- **In kịch bản phân tách**: Hỗ trợ in kịch bản tổng hợp hai họ, hoặc in riêng kịch bản Nhà Trai / Nhà Gái cho MC và người điều phối.

### 2. Thêm file nhạc từ 4 nguồn phong phú
- 💻 **Từ máy tính (PC / Laptop)**:
  - Kéo thả hoặc chọn tệp âm thanh (MP3, WAV, FLAC, M4A, AAC, OGG, OPUS, WEBM).
  - Tự động đọc độ dài và tên bài hát/nghệ sĩ. Tệp được tải lên máy chủ âm thanh để các thiết bị khác cùng nghe được.
- 📱 **Từ điện thoại thông minh (iPhone / Android / iPad)**:
  - Giao diện cảm ứng tối ưu, mở file âm thanh trực tiếp từ thư viện điện thoại, Voice Memos hoặc Downloads.
  - Tải lên là đồng bộ ngay sang máy tính đang cắm vào dàn âm thanh hội trường!
- ☁ **Từ Google Drive**:
  - Dán đường link chia sẻ tệp âm thanh từ Google Drive (đặt quyền *Bất kỳ ai có liên kết*).
  - Máy chủ sẽ tự động nạp tệp về kho lưu trữ tiệc cưới mà không lo lỗi phân quyền hay giật lag mạng.
- 🔗 **Từ liên kết trực tiếp (Web Audio Link)**:
  - Hỗ trợ nhập trực tiếp URL file nhạc online hoặc luồng phát trực tuyến.

### 3. Studio cắt nhạc & Tinh chỉnh chuyên nghiệp (Audio Trimmer)
- **Cắt đoạn nhạc chính xác (Trim Start / End)**:
  - Chọn đoạn cao trào / điệp khúc thích hợp nhất (ví dụ: chỉ phát từ giây thứ 45 đến 1 phút 30 khi cô dâu bước vào).
  - Có thước kéo trực quan, thanh sóng âm thanh và các nút chọn nhanh (1 phút đầu, 30s cao trào, toàn bài).
  - Chức năng **Nghe thử đoạn cắt** trực tiếp trước khi chốt kịch bản.
- **Ghi chú khoảnh khắc phát (CUE Note)**:
  - Đánh dấu thời điểm kích hoạt: *"Bật ngay khi MC hô 1 2 3 mở cửa"*, *"Giảm nhỏ âm lượng khi trao nhẫn"*, v.v.
- **Fade-in & Fade-out**:
  - Tùy chỉnh làm êm đầu bài và dịu đuôi bài (1s, 2s, 3s, 5s) để chuyển bài mượt mà, không giật tiếng trong không gian trang trọng.
- **Cân bằng âm lượng (Volume Gain dB)**:
  - Tăng hoặc giảm từ -10dB đến +10dB cho từng bài hát riêng lẻ để các bài không bị bài to bài nhỏ.

### 4. Tự động lưu & Đồng bộ thời gian thực đa thiết bị (Real-Time Sync)
- **Tự động lưu tức thì (Auto-Save)**:
  - Mọi thao tác thêm bài, cắt nhạc, sửa ghi chú được lưu lossless ngay vào IndexedDB cục bộ và gửi lên máy chủ trong vòng 350ms.
  - Trạng thái đồng bộ được hiển thị rõ ràng trên thanh tiêu đề: *Đồng bộ tự động*, *Đang lưu...*, hoặc *Ngoại tuyến*.
- **Đồng bộ thời gian thực (Server-Sent Events - SSE)**:
  - Điều phối viên hoặc cô dâu chú rể dùng điện thoại đổi thứ tự bài hát thì màn hình máy tính kết nối dàn âm thanh sẽ tự động cập nhật ngay lập tức mà không cần tải lại trang.
- **Kết nối điện thoại qua mã QR**:
  - Bấm nút **Điện thoại** trên thanh điều hướng để hiện mã QR và địa chỉ IP mạng nội bộ (Wi-Fi).
  - Quét mã bằng camera điện thoại để truy cập tức thì.

### 5. Studio Console (Bàn điều khiển âm thanh DJ tiệc cưới)
- Bàn điều khiển cố định ở cạnh dưới màn hình:
  - Chuyển đổi nhanh 2 chế độ: **Đoạn cắt (CLIP ✂)** hoặc **Cả bài (FULL 🎵)**.
  - Nút **Fade Stop**: Bấm một chạm để hạ âm lượng từ từ trong 2 giây rồi dừng, thích hợp khi MC bất ngờ phát biểu.
  - Thanh tiến trình phát nhạc trực quan với vạch đánh dấu đoạn cắt.
  - Tự động chuyển bài (Auto-next) và chế độ Lặp lại bài hát (Loop) cho nhạc đón khách / dùng tiệc.

### 6. In kịch bản âm thanh (Wedding Cue Sheet)
- Bấm nút **In kịch bản** để mở bảng tổng hợp kịch bản âm thanh chuẩn hóa A4.
- Đầy đủ thông tin thứ tự các giai đoạn, tên bài hát, nghệ sĩ, đoạn cắt, và cột CUE ghi chú rõ ràng cho MC và Kỹ thuật viên âm thanh theo dõi.
- Hỗ trợ in trực tiếp ra giấy hoặc xuất ra file PDF chất lượng cao.

---

## 📱 Dùng như App cài đặt trên điện thoại (PWA)
1. Mở trang web trên điện thoại (quét mã QR từ máy tính).
2. Thao tác cài đặt:
   - **iPhone / iPad (Safari)**: Nhấn biểu tượng **Chia sẻ (Share)** ở dưới cùng → Chọn **Thêm vào MH chính (Add to Home Screen)**.
   - **Android (Chrome)**: Nhấn menu **⋮** ở góc trên → Chọn **Cài đặt ứng dụng** hoặc **Thêm vào màn hình chính**.
3. Ứng dụng sẽ có biểu tượng hoa cưới riêng trên màn hình chính, mở toàn màn hình mượt mà như một ứng dụng native.

---

## 📁 Cấu trúc thư mục dự án `AjiNO`

```
AjiNO/
├── CHAY_DUYEN_CA.bat           # File khởi chạy 1-click cho Windows
├── package.json                # Cấu hình gói và các lệnh chạy
├── vite.config.ts              # Cấu hình Vite & API Proxy
├── tsconfig.json               # Cấu hình TypeScript
├── index.html                  # Khung HTML & Theme loader
├── public/                     # Favicon, Manifest PWA, Icons
├── .data/                      # Thư mục lưu trữ tự động (Playlist JSON & Kho audio)
│   ├── playlist.json
│   └── audio/
├── server/                     # Máy chủ đồng bộ và lưu trữ âm thanh
│   ├── index.mjs               # Master server, REST API & Static server
│   ├── audioStorage.mjs        # Lưu trữ và streaming tệp âm thanh (Range 206)
│   ├── playlistSync.mjs        # Đồng bộ thời gian thực SSE
│   └── gdriveService.mjs       # Tích hợp tải và phân giải Google Drive
├── scripts/                    # Scripts bổ trợ
│   ├── dev.mjs                 # Khởi động đồng thời máy chủ & Vite
│   ├── backup.mjs              # Sao lưu kịch bản cưới
│   └── restore.mjs             # Khôi phục từ bản sao lưu
└── src/                        # Mã nguồn ứng dụng React 19 + TypeScript
    ├── main.tsx                # Entry point
    ├── App.tsx                 # Giao diện chính
    ├── studio.css              # Giao diện Studio Console, Trimmer, Modals
    ├── types/                  # Định nghĩa TypeScript
    ├── state/                  # Context quản lý playlist, audio player & toast
    ├── services/               # API, IndexedDB storage, Audio scanner
    └── components/             # Các thành phần giao diện & cửa sổ chức năng
```

---
*Chúc ngày trọng đại của đôi bạn ngập tràn hạnh phúc và những giai điệu tuyệt vời nhất!*
