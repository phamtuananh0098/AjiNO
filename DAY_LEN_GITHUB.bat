@echo off
chcp 65001 >nul
title Duyên Ca · Đẩy mã nguồn lên GitHub

echo ============================================================
echo   📦 DUYÊN CA — ĐẨY MÃ NGUỒN LÊN GITHUB
echo   Repository: https://github.com/phamtuananh0098/AjiNO
echo ============================================================
echo.

cd /d "%~dp0"

set "GIT_EXE=C:\Users\PHAM TUAN\AppData\Local\GitHubDesktop\app-3.7.0\resources\app\git\cmd\git.exe"
if not exist "%GIT_EXE%" (
  set "GIT_EXE=git"
)

echo [1/3] Đang cập nhật danh sách tệp thay đổi...
"%GIT_EXE%" add .

echo.
echo [2/3] Đang lưu lịch sử commit phiên bản mới nhất...
"%GIT_EXE%" commit -m "feat: Cap nhat Duyen Ca Wedding Studio - chia 2 ben Nha Trai & Nha Gai, engine Google Drive hoan thien"

echo.
echo [3/3] Đang đẩy mã nguồn lên GitHub (nhánh main)...
"%GIT_EXE%" push -u origin main

if %errorlevel% neq 0 (
  echo.
  echo ============================================================
  echo ⚠️ LƯU Ý KHI GẶP LỖI "Repository not found" HOẶC CHƯA ĐĂNG NHẬP:
  echo.
  echo 1. NẾU BẠN CHƯA TẠO REPO TRÊN GITHUB:
  echo    👉 Mở trình duyệt vào: https://github.com/new
  echo    👉 Mục "Repository name" đặt tên chính xác là: AjiNO
  echo    👉 Chọn Public (hoặc Private) và nhấn nút "Create repository"
  echo    👉 Sau đó chạy lại tệp DAY_LEN_GITHUB.bat này!
  echo.
  echo 2. HOẶC DÙNG GITHUB DESKTOP (Có sẵn trên máy):
  echo    👉 Mở GitHub Desktop -> Chọn File -> Add Local Repository
  echo    👉 Chọn thư mục AjiNO này -> Nhấn "Publish repository"
  echo ============================================================
) else (
  echo.
  echo ============================================================
  echo ✅ THÀNH CÔNG! Toàn bộ mã nguồn đã được đưa lên GitHub!
  echo 👉 Xem kho mã nguồn tại: https://github.com/phamtuananh0098/AjiNO
  echo ============================================================
)

echo.
pause
