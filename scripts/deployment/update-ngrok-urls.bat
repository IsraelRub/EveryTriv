@echo off

setlocal enabledelayedexpansion



echo ========================================

echo EveryTriv - Update Ngrok URLs

echo ========================================



echo.

echo Enter your ngrok URLs:

echo (Use the same URL for both if you tunnel only port 3000 — client nginx proxies /api, /auth, /multiplayer.)

echo.



set /p BACKEND_URL="Enter Backend ngrok URL (e.g., https://abc123.ngrok.io): "

set /p FRONTEND_URL="Enter Frontend ngrok URL (e.g., https://def456.ngrok.io): "



for /f "delims=" %%V in ('powershell -NoProfile -Command "$b='%BACKEND_URL%'.TrimEnd('/'); $f='%FRONTEND_URL%'.TrimEnd('/'); if ($b -ieq $f) { 'USE_ORIGIN_API_PREFIX' } else { '%BACKEND_URL%' }"') do set "VITE_VAL=%%V"



echo.

echo Updating environment files...



powershell -Command "(Get-Content '.env') -replace 'SERVER_URL=.*', 'SERVER_URL=%BACKEND_URL%' | Set-Content '.env'"

powershell -Command "(Get-Content '.env') -replace 'CLIENT_URL=.*', 'CLIENT_URL=%FRONTEND_URL%' | Set-Content '.env'"

powershell -NoProfile -Command "$p='.env'; $lines=Get-Content $p; $vite='VITE_API_BASE_URL=%VITE_VAL%'; $found=$false; $out=@(); foreach($l in $lines){ if($l -match '^VITE_API_BASE_URL='){ $out+=$vite; $found=$true } else { $out+=$l } }; if(-not $found){ $out+=$vite }; $out | Set-Content $p"



echo.

echo ========================================

echo URLs updated successfully!

echo.

echo SERVER_URL: %BACKEND_URL%

echo CLIENT_URL: %FRONTEND_URL%

echo VITE_API_BASE_URL: %VITE_VAL%

echo.

echo Google OAuth (same tunnel: use CLIENT_URL for both):

echo - Authorized redirect URIs: %FRONTEND_URL%/auth/google/callback

echo - Authorized JavaScript origins: %FRONTEND_URL%

echo ========================================

