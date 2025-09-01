@echo off
echo ========================================
echo EveryTriv - Deploy to Vercel
echo ========================================

echo.
echo Installing Vercel CLI...
npm install -g vercel

echo.
echo Deploying Backend to Vercel...
cd server
vercel --prod

echo.
echo Deploying Frontend to Vercel...
cd ../client
vercel --prod

echo.
echo ========================================
echo Deployment completed!
echo.
echo Check your Vercel dashboard for URLs:
echo - Backend: https://your-app-name.vercel.app
echo - Frontend: https://your-app-name.vercel.app
echo.
echo Update Google OAuth with these URLs:
echo - Authorized redirect URIs: https://your-backend-url.vercel.app/auth/google/callback
echo - Authorized JavaScript origins: https://your-frontend-url.vercel.app
echo ========================================
