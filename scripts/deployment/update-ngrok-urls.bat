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

REM Update server .env.prod
powershell -Command "(Get-Content 'server\.env.prod') -replace 'GOOGLE_CALLBACK_URL=.*', 'GOOGLE_CALLBACK_URL=%BACKEND_URL%/auth/google/callback' | Set-Content 'server\.env.prod'"
powershell -Command "(Get-Content 'server\.env.prod') -replace 'CLIENT_URL=.*', 'CLIENT_URL=%FRONTEND_URL%' | Set-Content 'server\.env.prod'"
powershell -Command "(Get-Content 'server\.env.prod') -replace 'CORS_ORIGIN=.*', 'CORS_ORIGIN=%FRONTEND_URL%' | Set-Content 'server\.env.prod'"

REM Update client .env.prod
powershell -Command "(Get-Content 'client\.env.prod') -replace 'VITE_API_URL=.*', 'VITE_API_URL=%BACKEND_URL%' | Set-Content 'client\.env.prod'"
powershell -Command "(Get-Content 'client\.env.prod') -replace 'VITE_CDN_URL=.*', 'VITE_CDN_URL=%FRONTEND_URL%' | Set-Content 'client\.env.prod'"
powershell -Command "(Get-Content 'client\.env.prod') -replace 'VITE_STATIC_ASSETS_URL=.*', 'VITE_STATIC_ASSETS_URL=%FRONTEND_URL%' | Set-Content 'client\.env.prod'"

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
