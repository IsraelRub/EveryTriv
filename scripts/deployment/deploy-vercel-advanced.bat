@echo off
echo ========================================
echo EveryTriv - Advanced Vercel Deployment
echo ========================================

echo.
echo Step 1: Installing Vercel CLI...
npm install -g vercel

echo.
echo Step 2: Setting up environment variables...
echo.
echo Please set these environment variables in Vercel:
echo.
echo Backend Environment Variables:
echo - DATABASE_HOST
echo - DATABASE_USERNAME
echo - DATABASE_PASSWORD
echo - DATABASE_NAME
echo - JWT_SECRET
echo - GOOGLE_CLIENT_ID
echo - GOOGLE_CLIENT_SECRET
echo - REDIS_HOST
echo - REDIS_PASSWORD
echo - CHATGBT_API_KEY
echo - CLAUDE_API_KEY
echo - GEMINI_API_KEY
echo - SESSION_SECRET
echo.

echo Step 3: Deploying Backend to Vercel...
cd server
vercel --prod

echo.
echo Step 4: Getting Backend URL...
for /f "tokens=*" %%i in ('vercel ls --prod ^| findstr "everytriv"') do set BACKEND_URL=%%i

echo.
echo Step 5: Deploying Frontend to Vercel...
cd ../client
vercel --prod

echo.
echo Step 6: Getting Frontend URL...
for /f "tokens=*" %%i in ('vercel ls --prod ^| findstr "everytriv"') do set FRONTEND_URL=%%i

echo.
echo ========================================
echo Deployment completed!
echo.
echo Backend URL: %BACKEND_URL%
echo Frontend URL: %FRONTEND_URL%
echo.
echo Next steps:
echo 1. Update Google OAuth with these URLs:
echo    - Authorized redirect URIs: %BACKEND_URL%/auth/google/callback
echo    - Authorized JavaScript origins: %FRONTEND_URL%
echo.
echo 2. Set environment variables in Vercel dashboard
echo 3. Test your application
echo ========================================
