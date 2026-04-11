# Quick Deployment Helper
# Run this script to check prerequisites before deploying

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "HOAS Deployment Prerequisites Check" -ForegroundColor Cyan
Write-Host "==================================`n" -ForegroundColor Cyan

# Check if Firebase CLI is installed
Write-Host "1. Checking Firebase CLI..." -ForegroundColor Yellow
try {
    $firebaseVersion = firebase --version
    Write-Host "   ✅ Firebase CLI installed: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Firebase CLI not found. Install it with: npm install -g firebase-tools" -ForegroundColor Red
    exit 1
}

# Check login status
Write-Host "`n2. Checking Firebase login status..." -ForegroundColor Yellow
$loginCheck = firebase login:list 2>&1
if ($loginCheck -match "No authorized accounts") {
    Write-Host "   ❌ Not logged in to Firebase" -ForegroundColor Red
    Write-Host "   Run: firebase login" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ Logged in to Firebase" -ForegroundColor Green
}

# Check current project
Write-Host "`n3. Checking Firebase project..." -ForegroundColor Yellow
$projectInfo = firebase projects:list 2>&1
if ($projectInfo -match "hoas-65dee") {
    Write-Host "   ✅ Project 'hoas-65dee' found" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Project 'hoas-65dee' not found in your projects" -ForegroundColor Yellow
}

# Check Node.js version
Write-Host "`n4. Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = node --version
Write-Host "   ℹ️  Node.js version: $nodeVersion" -ForegroundColor Blue
if ($nodeVersion -match "v2[0-4]") {
    Write-Host "   ✅ Compatible with Cloud Functions Node 20 runtime" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Consider using Node.js 20 for consistency with deployed functions" -ForegroundColor Yellow
}

# Instructions
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

Write-Host "1. Enable Billing (REQUIRED FOR DEPLOYMENT)" -ForegroundColor Yellow
Write-Host "   Visit: https://console.cloud.google.com/billing`n" -ForegroundColor White

Write-Host "2. Deploy Functions (After billing is enabled)" -ForegroundColor Yellow
Write-Host "   cd server" -ForegroundColor White
Write-Host "   firebase deploy --only functions`n" -ForegroundColor White

Write-Host "3. OR Use Emulators for Local Development" -ForegroundColor Yellow
Write-Host "   cd server" -ForegroundColor White
Write-Host "   firebase emulators:start`n" -ForegroundColor White

Write-Host "4. Enable Emulator Mode in Frontend" -ForegroundColor Yellow
Write-Host "   Open browser console on http://localhost:5173" -ForegroundColor White
Write-Host "   Run: localStorage.setItem('VITE_USE_FIREBASE_EMULATOR', 'true')" -ForegroundColor White
Write-Host "   Refresh the page`n" -ForegroundColor White

Write-Host "================================`n" -ForegroundColor Cyan
Write-Host "📖 For detailed instructions, see: docs/DEPLOYMENT_FIX_GUIDE.md" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan
