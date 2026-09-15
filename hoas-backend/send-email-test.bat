// Supabase Email Sender - Terminal Runner
// Run this from: C:\Projects\HOAS\hoas-backend
@echo off
set EMAIL_FUNCTION_URL=https://zaqlwyfghlfklerunazv.supabase.co/functions/v1/send-email

echo ==========================================
echo Supabase Edge Email Sender
echo ==========================================
echo.
echo 1. Send Account Created Email
echo.
echo   curl -X POST "%EMAIL_FUNCTION_URL%" -H "Content-Type: application/json" -d "^
   {"to":"ramasaiahemanth@gmail.com","type":"account_created","config":{"appUrl":"http://localhost:5173","supportEmail":"support@hoas.app","logoUrl":"","brandName":"HOAS"},"data":{"userName":"Test","role":"student","collegeName":"Test College","loginUrl":"http://localhost:5173"}}"
echo.
echo 2. Send Password Reset Email
echo.
echo   curl -X POST "%EMAIL_FUNCTION_URL%" -H "Content-Type: application/json" -d "^
   {"to":"user@example.com","type":"password_reset","config":{"appUrl":"http://localhost:5173","supportEmail":"support@hoas.app","logoUrl":"","brandName":"HOAS"},"data":{"userName":"John Doe","resetUrl":"http://localhost:5173/password-reset","expirationTime":"24 hours"}}"
echo.
echo 3. Send Announcement Email
echo.
echo   curl -X POST "%EMAIL_FUNCTION_URL%" -H "Content-Type: application/json" -d "^
   {"to":"all-students@example.com","type":"new_announcement","config":{"appUrl":"http://localhost:5173","supportEmail":"support@hoas.app","logoUrl":"","brandName":"HOAS"},"data":{"userName":"Students","announcementTitle":"System Maintenance","announcementSummary":"The system will be down for maintenance tonight at 10 PM","announcementUrl":"http://localhost:5173","collegeName":"Your College"}}"
echo.
echo 4. Send Emergency Alert Email
echo.
echo   curl -X POST "%EMAIL_FUNCTION_URL%" -H "Content-Type: application/json" -d "^
   {"to":"all-students@example.com","type":"emergency_alert","config":{"appUrl":"http://localhost:5173","supportEmail":"support@hoas.app","logoUrl":"","brandName":"HOAS"},"data":{"userName":"Students","collegeName":"Your College","alertTitle":"URGENT: Server Maintenance","alertMessage":"The server will be restarted at 10 PM. No data will be lost.","location":"Data Center A","issuedAt":"2024-01-15 10:00 PM","alertUrl":"http://localhost:5173"}}"
echo.
echo ==========================================
echo Choose an option (1-4) or press Ctrl+C to exit:
set /p choice=
if "%choice%"=="1" goto account_created
if "%choice%"=="2" goto password_reset
if "%choice%"=="3" goto announcement
if "%choice%"=="4" goto emergency_alert
echo Invalid choice.
exit /b

:account_created
curl -X POST "%EMAIL_FUNCTION_URL%" -H "Content-Type: application/json" -d "{\"to\":\"ramasaiahemanth@gmail.com\",\"type\":\"account_created\",\"config\":{\"appUrl\":\"http://localhost:5173\",\"supportEmail\":\"support@hoas.app\",\"logoUrl\":\"\",\"brandName\":\"HOAS\"},\"data\":{\"userName\":\"Test\",\"role\":\"student\",\"collegeName\":\"Test College\",\"loginUrl\":\"http://localhost:5173\"}}"
goto end

:password_reset
curl -X POST "%EMAIL_FUNCTION_URL%" -H "Content-Type: application/json" -d "{\"to\":\"user@example.com\",\"type\":\"password_reset\",\"config":{"appUrl":"http://localhost:5173","supportEmail":"support@hoas.app","logoUrl":"","brandName":"HOAS"},"data":{"userName":"John Doe","resetUrl":"http://localhost:5173/password-reset","expirationTime":"24 hours"}}"
goto end

:announcement
curl -X POST "%EMAIL_FUNCTION_URL%" -H "Content-Type: application/json" -d "{\"to\":\"all-students@example.com\",\"type\":\"new_announcement\",\"config":{"appUrl":"http://localhost:5173","supportEmail":"support@hoas.app","logoUrl":"","brandName":"HOAS"},"data":{"userName":"Students","announcementTitle":"System Maintenance","announcementSummary":"The system will be down for maintenance tonight at 10 PM","announcementUrl":"http://localhost:5173","collegeName":"Your College"}}"
goto end

:emergency_alert
curl -X POST "%EMAIL_FUNCTION_URL%" -H "Content-Type: application/json" -d "{\"to\":\"all-students@example.com\",\"type\":\"emergency_alert\",\"config":{"appUrl":"http://localhost:5173","supportEmail":"support@hoas.app","logoUrl":"","brandName":"HOAS"},"data":{"userName":"Students","collegeName":"Your College","alertTitle":"URGENT: Server Maintenance","alertMessage":"The server will be restarted at 10 PM. No data will be lost.","location":"Data Center A","issuedAt":"2024-01-15 10:00 PM","alertUrl":"http://localhost:5173"}}"
goto end

:end
echo.
echo ==========================================
echo Done.
echo ==========================================
pause