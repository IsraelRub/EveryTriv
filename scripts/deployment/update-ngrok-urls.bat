@echo off
setlocal enabledelayedexpansion

echo ========================================
echo EveryTriv - Update Ngrok URLs
echo ========================================

echo.
echo Enter your ngrok URLs:
echo.

set /p BACKEND_URL="Enter Backend ngrok URL (e.g., https://abc123.ngrok.io): "
set /p FRONTEND_URL="Enter Frontend ngrok URL (e.g., https://def456.ngrok.io): "

echo.
echo Updating environment files...

REM Update root .env (single source of truth for server + client VITE_* build vars)
powershell -Command "(Get-Content '.env') -replace 'SERVER_URL=.*', 'SERVER_URL=%BACKEND_URL%' | Set-Content '.env'"
powershell -Command "(Get-Content '.env') -replace 'CLIENT_URL=.*', 'CLIENT_URL=%FRONTEND_URL%' | Set-Content '.env'"

echo.
echo ========================================
echo URLs updated successfully!
echo.
echo Backend URL: %BACKEND_URL%
echo Frontend URL: %FRONTEND_URL%
echo.
echo Use these URLs in Google OAuth:
echo - Authorized redirect URIs: %BACKEND_URL%/auth/google/callback
echo - Authorized JavaScript origins: %FRONTEND_URL%
echo ========================================
