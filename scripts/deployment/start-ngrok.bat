@echo off
echo ========================================
echo EveryTriv - Ngrok Tunnel Setup
echo ========================================

echo.
echo Starting ngrok tunnels...
echo.

echo Starting tunnel for Backend (port 3002)...
start "ngrok-backend" cmd /k "ngrok http 3002"

echo.
echo Starting tunnel for Frontend (port 3000)...
start "ngrok-frontend" cmd /k "ngrok http 3000"

echo.
echo ========================================
echo Ngrok tunnels are starting...
echo.
echo Check the ngrok windows for your URLs:
echo - Backend URL: https://xxxxx.ngrok.io
echo - Frontend URL: https://yyyyy.ngrok.io
echo.
echo Use these URLs in Google OAuth:
echo - Authorized redirect URIs: https://xxxxx.ngrok.io/auth/google/callback
echo - Authorized JavaScript origins: https://yyyyy.ngrok.io
echo ========================================
