@echo off
echo =====================================
echo Starting PKI Frontend
echo =====================================
echo.

cd /d "%~dp0pki-frontend"

echo Frontend will start on: http://localhost:3000
echo Backend HTTPS endpoint: https://localhost:8443
echo.
echo Make sure backend is running first!
echo Login credentials: admin / admin123
echo.

echo Starting Next.js development server...
set NODE_TLS_REJECT_UNAUTHORIZED=0
npm run dev

pause