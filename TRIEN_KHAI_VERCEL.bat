@echo off
chcp 65001 >nul
title Duyên Ca · Triển khai Vercel (Online 24/7)

echo ============================================================
echo   🚀 DUYÊN CA — TRIỂN KHAI LÊN VERCEL ONLINE 24/7
echo ============================================================
echo.

cd /d "%~dp0"

echo [1/2] Đang kiểm tra bản build ứng dụng...
call npm.cmd run build

echo.
echo [2/2] Đang khởi động Vercel CLI để triển khai trực tiếp...
echo (Nếu Vercel yêu cầu đăng nhập, trình duyệt sẽ tự động mở để xác thực)
echo.

call vercel.cmd --prod

echo.
echo ============================================================
echo ✨ Hướng dẫn nếu muốn liên kết tự động qua GitHub:
echo 1. Vào https://vercel.com/new
echo 2. Nhấn "Import" cạnh repository: phamtuananh0098/AjiNO
echo 3. Nhấn "Deploy" -> Vercel sẽ tự động cập nhật web mỗi khi đẩy code!
echo ============================================================
echo.
pause
