@echo off
echo ==========================================
echo HOAS - Send All 20 Email Templates Test
echo Recipient: ramasaiahemanth@gmail.com
echo ==========================================
echo.
cd /d "%~dp0"
node scripts\test-all-20-emails.js %*
pause
