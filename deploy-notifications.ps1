#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploy notification Cloud Functions to Firebase
.DESCRIPTION
    This script deploys the notification-related Cloud Functions to Firebase.
    It can deploy all notification functions or specific ones.
.PARAMETER All
    Deploy all functions (not just notifications)
.PARAMETER EmulatorTest
    Start the Firebase emulator for local testing
.EXAMPLE
    .\deploy-notifications.ps1
    Deploys only notification functions
.EXAMPLE
    .\deploy-notifications.ps1 -All
    Deploys all Cloud Functions
.EXAMPLE
    .\deploy-notifications.ps1 -EmulatorTest
    Starts the emulator for local testing
#>

param(
    [switch]$All,
    [switch]$EmulatorTest
)

Write-Host "🔔 HOAS Notification Deployment Script" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "server\functions\src\notifications.js")) {
    Write-Host "❌ Error: Please run this script from the HOAS root directory" -ForegroundColor Red
    exit 1
}

# Navigate to server directory
Push-Location server

try {
    if ($EmulatorTest) {
        Write-Host "🧪 Starting Firebase Emulator..." -ForegroundColor Yellow
        Write-Host "   You can test notifications by creating colleges/tickets" -ForegroundColor Gray
        Write-Host ""
        firebase emulators:start
    }
    elseif ($All) {
        Write-Host "📦 Deploying ALL Cloud Functions..." -ForegroundColor Yellow
        Write-Host ""
        firebase deploy --only functions
    }
    else {
        Write-Host "📦 Deploying Notification Functions..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   • onNewCollegeApproval" -ForegroundColor Gray
        Write-Host "   • onNewSupportTicket" -ForegroundColor Gray
        Write-Host "   • onSupportTicketUpdate" -ForegroundColor Gray
        Write-Host "   • onNewWardenRegistration" -ForegroundColor Gray
        Write-Host ""
        
        firebase deploy --only functions:onNewCollegeApproval,functions:onNewSupportTicket,functions:onSupportTicketUpdate,functions:onNewWardenRegistration
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Deployment successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Test by creating a new college or support ticket" -ForegroundColor Gray
        Write-Host "2. Check Firebase Console → Functions for deployment status" -ForegroundColor Gray
        Write-Host "3. Monitor logs with: firebase functions:log" -ForegroundColor Gray
        Write-Host ""
    }
    else {
        Write-Host ""
        Write-Host "❌ Deployment failed!" -ForegroundColor Red
        Write-Host "Check the error messages above for details." -ForegroundColor Yellow
        exit 1
    }
}
finally {
    # Return to original directory
    Pop-Location
}
