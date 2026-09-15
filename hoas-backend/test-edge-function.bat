@echo off
setlocal enabledelayedexpansion
echo ======================================================
echo Supabase Edge Function & HOAS Email Test Suite
echo ======================================================
echo.
echo Function URL: https://zaqlwyfghlfklerunazv.supabase.co/functions/v1/send-email
echo Recipient:    ramasaiahemanth@gmail.com
echo.
echo 1. Ping Edge Function
echo 2. Send Account Created Email
echo 3. Send Password Reset Email
echo 4. Send ALL 20 Email Templates to ramasaiahemanth@gmail.com
echo 5. Exit
echo.
set /p choice="Enter choice [1-5]: "

if "%choice%"=="1" (
  echo.
  echo Running Ping Test...
  curl -X POST "https://zaqlwyfghlfklerunazv.supabase.co/functions/v1/send-email" -H "Content-Type: application/json" -d "{\"type\":\"ping\"}"
  echo.
) else if "%choice%"=="2" (
  echo.
  echo Sending Account Created Test Email to ramasaiahemanth@gmail.com...
  curl -X POST "https://zaqlwyfghlfklerunazv.supabase.co/functions/v1/send-email" -H "Content-Type: application/json" -d "{\"to\":\"ramasaiahemanth@gmail.com\",\"type\":\"account_created\",\"config\":{\"appUrl\":\"http://localhost:5173\",\"supportEmail\":\"support@hoas.app\",\"logoUrl\":\"\",\"brandName\":\"HOAS\"},\"data\":{\"userName\":\"Hemanth\",\"role\":\"student\",\"collegeName\":\"Test College\",\"loginUrl\":\"http://localhost:5173\"}}"
  echo.
) else if "%choice%"=="3" (
  echo.
  echo Sending Password Reset Test Email to ramasaiahemanth@gmail.com...
  curl -X POST "https://zaqlwyfghlfklerunazv.supabase.co/functions/v1/send-email" -H "Content-Type: application/json" -d "{\"to\":\"ramasaiahemanth@gmail.com\",\"type\":\"password_reset\",\"config\":{\"appUrl\":\"http://localhost:5173\",\"supportEmail\":\"support@hoas.app\",\"logoUrl\":\"\",\"brandName\":\"HOAS\"},\"data\":{\"userName\":\"Hemanth\",\"resetUrl\":\"http://localhost:5173/password-reset\",\"expirationTime\":\"24 hours\"}}"
  echo.
) else if "%choice%"=="4" (
  echo.
  echo Sending all 20 templates via test-all-20-emails.js...
  cd /d "%~dp0"
  node scripts\test-all-20-emails.js ramasaiahemanth@gmail.com
  echo.
) else (
  goto done
)

:done
echo ======================================================
echo Test finished. Check response above.
echo ======================================================
pause