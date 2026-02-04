# Firebase Mode Toggle Helper
# Quickly switch between emulator and production mode

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("emulator", "production", "status")]
    [string]$Mode = "status"
)

$clientPath = "C:\Users\heman\Downloads\HOAS-main\HOAS\client"

function Show-Status {
    Write-Host "`n==================================" -ForegroundColor Cyan
    Write-Host "Firebase Mode Status" -ForegroundColor Cyan
    Write-Host "==================================`n" -ForegroundColor Cyan
    
    Write-Host "How to check current mode:" -ForegroundColor Yellow
    Write-Host "1. Open your app in browser (http://localhost:5173)" -ForegroundColor White
    Write-Host "2. Open browser console (F12)" -ForegroundColor White
    Write-Host "3. Look for one of these messages:" -ForegroundColor White
    Write-Host "   🔧 Using Firebase Emulator for Cloud Functions" -ForegroundColor Green
    Write-Host "   🌐 Using Production Firebase Cloud Functions" -ForegroundColor Blue
    Write-Host "`n"
}

function Set-EmulatorMode {
    Write-Host "`n==================================" -ForegroundColor Cyan
    Write-Host "Enabling Emulator Mode" -ForegroundColor Cyan
    Write-Host "==================================`n" -ForegroundColor Cyan
    
    Write-Host "Steps to enable emulator mode:`n" -ForegroundColor Yellow
    
    Write-Host "1. Start the Firebase Emulators:" -ForegroundColor White
    Write-Host "   cd server" -ForegroundColor Gray
    Write-Host "   firebase emulators:start`n" -ForegroundColor Gray
    
    Write-Host "2. Open your app in browser:" -ForegroundColor White
    Write-Host "   http://localhost:5173`n" -ForegroundColor Gray
    
    Write-Host "3. Open browser console (F12) and run:" -ForegroundColor White
    Write-Host "   localStorage.setItem('VITE_USE_FIREBASE_EMULATOR', 'true')" -ForegroundColor Gray
    Write-Host "`n4. Refresh the page (F5)`n" -ForegroundColor White
    
    Write-Host "✅ You should see: '🔧 Using Firebase Emulator for Cloud Functions'" -ForegroundColor Green
    Write-Host "`nEmulator UI: http://localhost:4000`n" -ForegroundColor Cyan
}

function Set-ProductionMode {
    Write-Host "`n==================================" -ForegroundColor Cyan
    Write-Host "Enabling Production Mode" -ForegroundColor Cyan
    Write-Host "==================================`n" -ForegroundColor Cyan
    
    Write-Host "Steps to enable production mode:`n" -ForegroundColor Yellow
    
    Write-Host "1. Open your app in browser:" -ForegroundColor White
    Write-Host "   http://localhost:5173`n" -ForegroundColor Gray
    
    Write-Host "2. Open browser console (F12) and run:" -ForegroundColor White
    Write-Host "   localStorage.setItem('VITE_USE_FIREBASE_EMULATOR', 'false')" -ForegroundColor Gray
    Write-Host "`n3. Refresh the page (F5)`n" -ForegroundColor White
    
    Write-Host "✅ You should see: '🌐 Using Production Firebase Cloud Functions'" -ForegroundColor Green
    Write-Host "`n⚠️  IMPORTANT: Make sure billing is enabled for production!" -ForegroundColor Yellow
    Write-Host "   Visit: https://console.cloud.google.com/billing`n" -ForegroundColor White
}

# Execute based on mode
switch ($Mode) {
    "emulator" {
        Set-EmulatorMode
    }
    "production" {
        Set-ProductionMode
    }
    "status" {
        Show-Status
    }
}

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Usage:" -ForegroundColor Cyan
Write-Host "  .\toggle-firebase-mode.ps1 emulator    - Switch to emulator mode" -ForegroundColor White
Write-Host "  .\toggle-firebase-mode.ps1 production  - Switch to production mode" -ForegroundColor White
Write-Host "  .\toggle-firebase-mode.ps1 status      - Check current mode" -ForegroundColor White
Write-Host "==================================`n" -ForegroundColor Cyan
