@echo off
chcp 65001 >nul
title Duyên Ca · Wedding Playlist Studio (AjiNO)

echo ============================================================
echo   💐 DUYÊN CA — WEDDING PLAYLIST STUDIO (AjiNO)
echo   Khởi chạy Studio Nhạc Cưới Tự Do & Đồng Bộ Đa Thiết Bị
echo ============================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo [LỖI] Máy tính chưa cài đặt Node.js!
  echo Vui lòng cài đặt Node.js từ https://nodejs.org trước khi chạy.
  echo.
  pause
  exit /b 1
)

cd /d "%~dp0"

echo [1/2] Đang kiểm tra bản dựng ứng dụng...
if not exist "dist\index.html" (
  echo Đang biên dịch mã nguồn lần đầu, vui lòng đợi trong giây lát...
  call npx.cmd vite build
)

echo.
echo [2/2] Đang khởi động máy chủ Duyên Ca Studio...
echo.
start "" "http://localhost:8788"
node server/index.mjs

pause
